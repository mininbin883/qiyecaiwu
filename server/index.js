import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { z } from 'zod';
import {
  COLLECTION_NAMES,
  appendAuditLog,
  deleteCollectionRecord,
  getCollection,
  getUserById,
  getUserByUsername,
  migrateAndSeed,
  setCollection,
  upsertCollectionRecord,
} from './db.js';
import { parseImport } from './importer.js';
import {
  applyApprovalSideEffects,
  applyCollectionSideEffects,
  getCashflowForecast,
  getDashboardSummary,
  getRiskSummary,
  syncExpenseToPayableAndBudget,
  syncIncomeToReceivable,
} from './services.js';
import { validateCollection } from './validators.js';

const PORT = Number(process.env.API_PORT ?? 4100);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-finance-secret-change-me';
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

migrateAndSeed();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

function signUser(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '8h' });
}

function publicUser(user) {
  const roles = getCollection('roles') ?? [];
  const role = roles.find((item) => item.key === user.role_key);
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    roleKey: user.role_key,
    permissions: role?.permissions ?? [],
  };
}

function authRequired(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: '未登录' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getUserById(payload.sub);
    if (!user) return res.status(401).json({ message: '登录已失效' });
    req.user = publicUser(user);
    next();
  } catch {
    res.status(401).json({ message: '登录已失效' });
  }
}

function hasPermission(user, permission) {
  return user.permissions.includes('all') || user.permissions.includes(permission);
}

function writeRequired(req, res, next) {
  if (hasPermission(req.user, 'manage_finance')) return next();
  if (hasPermission(req.user, 'edit_income')) return next();
  if (hasPermission(req.user, 'edit_expense')) return next();
  if (hasPermission(req.user, 'edit_contract')) return next();
  if (hasPermission(req.user, 'edit_master')) return next();
  if (hasPermission(req.user, 'approve')) return next();
  return res.status(403).json({ message: '当前角色没有写入权限' });
}

function approveRequired(req, res, next) {
  if (hasPermission(req.user, 'manage_finance')) return next();
  if (hasPermission(req.user, 'approve')) return next();
  if (hasPermission(req.user, 'approve_final')) return next();
  return res.status(403).json({ message: '当前角色没有审批权限' });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const body = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }).safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ message: '请输入账号和密码' });
  }

  const user = getUserByUsername(body.data.username);
  if (!user || !bcrypt.compareSync(body.data.password, user.password_hash)) {
    return res.status(401).json({ message: '账号或密码错误' });
  }

  appendAuditLog(publicUser(user), '系统登录', '系统设置', `${user.display_name} 登录系统`);
  res.json({ token: signUser(user), user: publicUser(user) });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/bootstrap', authRequired, (req, res) => {
  const collections = {};
  for (const name of COLLECTION_NAMES) {
    collections[name] = getCollection(name) ?? [];
  }
  res.json({ user: req.user, collections });
});

app.get('/api/collections/:name', authRequired, (req, res) => {
  if (!COLLECTION_NAMES.includes(req.params.name)) {
    return res.status(404).json({ message: '未知数据集合' });
  }
  res.json({ data: getCollection(req.params.name) ?? [] });
});

app.put('/api/collections/:name', authRequired, writeRequired, (req, res) => {
  const name = req.params.name;
  if (!COLLECTION_NAMES.includes(name)) {
    return res.status(404).json({ message: '未知数据集合' });
  }

  const validation = validateCollection(name, req.body.data);
  if (!validation.ok) {
    return res.status(400).json({ message: validation.message });
  }

  setCollection(name, validation.data);
  applyCollectionSideEffects(name, validation.data, req.user);
  appendAuditLog(req.user, '更新数据', name, `更新 ${name}，共 ${validation.data.length} 条`);
  res.json({ data: validation.data });
});

function collectionHandler(collectionName, afterSave) {
  return {
    list: (_req, res) => res.json({ data: getCollection(collectionName) ?? [] }),
    replace: (req, res) => {
      const validation = validateCollection(collectionName, req.body.data);
      if (!validation.ok) return res.status(400).json({ message: validation.message });
      setCollection(collectionName, validation.data);
      applyCollectionSideEffects(collectionName, validation.data, req.user);
      appendAuditLog(req.user, '批量更新', collectionName, `批量更新 ${collectionName}，共 ${validation.data.length} 条`);
      return res.json({ data: getCollection(collectionName) ?? [] });
    },
    create: (req, res) => {
      const current = getCollection(collectionName) ?? [];
      const validation = validateCollection(collectionName, [...current, req.body]);
      if (!validation.ok) return res.status(400).json({ message: validation.message });
      const saved = upsertCollectionRecord(collectionName, req.body);
      afterSave?.(saved, req.user);
      appendAuditLog(req.user, '新增', collectionName, `新增 ${collectionName} ${saved.code ?? saved.id}`);
      return res.status(201).json({ data: saved });
    },
    update: (req, res) => {
      const current = getCollection(collectionName) ?? [];
      const next = current.map((item) => (item.id === req.params.id ? { ...item, ...req.body, id: req.params.id } : item));
      if (!next.some((item) => item.id === req.params.id)) return res.status(404).json({ message: '记录不存在' });
      const validation = validateCollection(collectionName, next);
      if (!validation.ok) return res.status(400).json({ message: validation.message });
      const saved = validation.data.find((item) => item.id === req.params.id);
      upsertCollectionRecord(collectionName, saved);
      afterSave?.(saved, req.user);
      appendAuditLog(req.user, '更新', collectionName, `更新 ${collectionName} ${saved.code ?? saved.id}`);
      return res.json({ data: saved });
    },
    remove: (req, res) => {
      deleteCollectionRecord(collectionName, req.params.id);
      appendAuditLog(req.user, '删除', collectionName, `删除 ${collectionName} ${req.params.id}`);
      return res.status(204).end();
    },
  };
}

const incomeRoutes = collectionHandler('incomes', syncIncomeToReceivable);
const expenseRoutes = collectionHandler('expenses', syncExpenseToPayableAndBudget);

app.get('/api/incomes', authRequired, incomeRoutes.list);
app.put('/api/incomes', authRequired, writeRequired, incomeRoutes.replace);
app.post('/api/incomes', authRequired, writeRequired, incomeRoutes.create);
app.put('/api/incomes/:id', authRequired, writeRequired, incomeRoutes.update);
app.delete('/api/incomes/:id', authRequired, writeRequired, incomeRoutes.remove);

app.get('/api/expenses', authRequired, expenseRoutes.list);
app.put('/api/expenses', authRequired, writeRequired, expenseRoutes.replace);
app.post('/api/expenses', authRequired, writeRequired, expenseRoutes.create);
app.put('/api/expenses/:id', authRequired, writeRequired, expenseRoutes.update);
app.delete('/api/expenses/:id', authRequired, writeRequired, expenseRoutes.remove);

app.post('/api/approvals/:id/approve', authRequired, approveRequired, (req, res) => {
  const approvals = getCollection('approvals') ?? [];
  const approval = approvals.find((item) => item.id === req.params.id);
  if (!approval) return res.status(404).json({ message: '审批记录不存在' });
  const updated = { ...approval, status: 'approved', currentNode: '已完成' };
  upsertCollectionRecord('approvals', updated);
  applyApprovalSideEffects(updated, req.user);
  appendAuditLog(req.user, '审批通过', 'approvals', `审批通过 ${updated.code}`);
  return res.json({ data: updated });
});

app.post('/api/approvals/:id/reject', authRequired, approveRequired, (req, res) => {
  const approvals = getCollection('approvals') ?? [];
  const approval = approvals.find((item) => item.id === req.params.id);
  if (!approval) return res.status(404).json({ message: '审批记录不存在' });
  const updated = { ...approval, status: 'rejected', currentNode: '已驳回' };
  upsertCollectionRecord('approvals', updated);
  appendAuditLog(req.user, '审批驳回', 'approvals', `审批驳回 ${updated.code}`);
  return res.json({ data: updated });
});

app.post('/api/imports/:module', authRequired, writeRequired, upload.single('file'), (req, res) => {
  const moduleMap = {
    income: 'incomes',
    incomes: 'incomes',
    expense: 'expenses',
    expenses: 'expenses',
    contracts: 'contracts',
    contract: 'contracts',
    budget: 'budgets',
    budgets: 'budgets',
    'master-data': 'masterData',
    masterData: 'masterData',
  };
  const collectionName = moduleMap[req.params.module];
  if (!collectionName || !req.file) return res.status(400).json({ message: '导入模块或文件无效' });

  const imported = parseImport(collectionName, req.file.buffer);
  const next = [...(getCollection(collectionName) ?? []), ...imported];
  const validation = validateCollection(collectionName, next);
  if (!validation.ok) return res.status(400).json({ message: validation.message });

  setCollection(collectionName, validation.data);
  applyCollectionSideEffects(collectionName, validation.data, req.user);
  appendAuditLog(req.user, 'Excel导入', collectionName, `导入 ${collectionName} ${imported.length} 条`);
  return res.json({ data: imported, count: imported.length });
});

app.get('/api/dashboard/summary', authRequired, (_req, res) => {
  res.json({ data: getDashboardSummary() });
});

app.get('/api/cashflow/forecast', authRequired, (_req, res) => {
  res.json({ data: getCashflowForecast() });
});

app.get('/api/risks/summary', authRequired, (_req, res) => {
  res.json({ data: getRiskSummary() });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Finance API listening on http://localhost:${PORT}`);
});
