import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { loadDefaultCollections } from './seed.js';

const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), 'data'));
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'finance.sqlite'));
db.pragma('journal_mode = WAL');

export const COLLECTION_NAMES = [
  'incomes',
  'expenses',
  'receivables',
  'payables',
  'contracts',
  'budgets',
  'approvals',
  'cashflow',
  'risks',
  'masterData',
  'roles',
  'alertRules',
  'auditLogs',
  'monthlyTrends',
];

const TABLE_COLLECTIONS = {
  incomes: {
    table: 'incomes',
    columns: [
      ['id', 'id'],
      ['code', 'code'],
      ['customer', 'customer'],
      ['type', 'type'],
      ['contractCode', 'contract_code'],
      ['project', 'project'],
      ['amount', 'amount'],
      ['collected', 'collected'],
      ['invoiceStatus', 'invoice_status'],
      ['collectionStatus', 'collection_status'],
      ['manager', 'manager'],
      ['remark', 'remark'],
    ],
  },
  expenses: {
    table: 'expenses',
    columns: [
      ['id', 'id'],
      ['code', 'code'],
      ['supplier', 'supplier'],
      ['type', 'type'],
      ['department', 'department'],
      ['amount', 'amount'],
      ['paid', 'paid'],
      ['paymentStatus', 'payment_status'],
      ['receiptStatus', 'receipt_status'],
      ['plannedPayDate', 'planned_pay_date'],
      ['manager', 'manager'],
      ['remark', 'remark'],
    ],
  },
  receivables: {
    table: 'receivables',
    columns: [
      ['id', 'id'],
      ['customer', 'customer'],
      ['amount', 'amount'],
      ['collected', 'collected'],
      ['dueDate', 'due_date'],
      ['overdueDays', 'overdue_days'],
      ['manager', 'manager'],
      ['dunningStatus', 'dunning_status'],
      ['riskLevel', 'risk_level'],
      ['followUp', 'follow_up'],
      ['remark', 'remark'],
    ],
  },
  payables: {
    table: 'payables',
    columns: [
      ['id', 'id'],
      ['supplier', 'supplier'],
      ['amount', 'amount'],
      ['paid', 'paid'],
      ['dueDate', 'due_date'],
      ['priority', 'priority'],
      ['status', 'status'],
      ['suggestion', 'suggestion'],
      ['manager', 'manager'],
      ['remark', 'remark'],
    ],
  },
  budgets: {
    table: 'budgets',
    columns: [
      ['id', 'id'],
      ['department', 'department'],
      ['budgetAmount', 'budget_amount'],
      ['usedAmount', 'used_amount'],
      ['manager', 'manager'],
      ['remark', 'remark'],
    ],
  },
  approvals: {
    table: 'approvals',
    columns: [
      ['id', 'id'],
      ['code', 'code'],
      ['type', 'type'],
      ['applicant', 'applicant'],
      ['department', 'department'],
      ['amount', 'amount'],
      ['submitTime', 'submit_time'],
      ['currentNode', 'current_node'],
      ['status', 'status'],
      ['approver', 'approver'],
    ],
  },
};

export function migrateAndSeed() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      name TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role_key TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      customer TEXT NOT NULL,
      type TEXT NOT NULL,
      contract_code TEXT NOT NULL DEFAULT '',
      project TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      collected REAL NOT NULL DEFAULT 0,
      invoice_status TEXT NOT NULL,
      collection_status TEXT NOT NULL,
      manager TEXT NOT NULL DEFAULT '',
      remark TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      supplier TEXT NOT NULL,
      type TEXT NOT NULL,
      department TEXT NOT NULL,
      amount REAL NOT NULL,
      paid REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL,
      receipt_status TEXT NOT NULL,
      planned_pay_date TEXT NOT NULL,
      manager TEXT NOT NULL DEFAULT '',
      remark TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS receivables (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      amount REAL NOT NULL,
      collected REAL NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      overdue_days INTEGER NOT NULL DEFAULT 0,
      manager TEXT NOT NULL DEFAULT '',
      dunning_status TEXT NOT NULL,
      risk_level TEXT NOT NULL DEFAULT 'normal',
      follow_up TEXT NOT NULL DEFAULT '',
      remark TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payables (
      id TEXT PRIMARY KEY,
      supplier TEXT NOT NULL,
      amount REAL NOT NULL,
      paid REAL NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      suggestion TEXT NOT NULL DEFAULT '',
      manager TEXT NOT NULL DEFAULT '',
      remark TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      department TEXT NOT NULL UNIQUE,
      budget_amount REAL NOT NULL,
      used_amount REAL NOT NULL DEFAULT 0,
      manager TEXT NOT NULL DEFAULT '',
      remark TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      applicant TEXT NOT NULL,
      department TEXT NOT NULL,
      amount REAL NOT NULL,
      submit_time TEXT NOT NULL,
      current_node TEXT NOT NULL,
      status TEXT NOT NULL,
      approver TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budget_usages (
      id TEXT PRIMARY KEY,
      budget_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source_type, source_id)
    );
  `);

  const defaults = loadDefaultCollections();
  const upsertCollection = db.prepare(`
    INSERT OR IGNORE INTO collections (name, data)
    VALUES (@name, @data)
  `);

  for (const name of COLLECTION_NAMES) {
    upsertCollection.run({
      name,
      data: JSON.stringify(defaults[name] ?? []),
    });
  }

  for (const [name, config] of Object.entries(TABLE_COLLECTIONS)) {
    const count = db.prepare(`SELECT COUNT(*) AS count FROM ${config.table}`).get().count;
    if (count === 0) {
      replaceTableCollection(name, getRawCollection(name) ?? defaults[name] ?? []);
    }
  }

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, role_key)
      VALUES (@id, @username, @passwordHash, @displayName, @roleKey)
    `);
    const users = [
      ['u-admin', 'admin', 'admin123', '系统管理员', 'super_admin'],
      ['u-boss', 'boss', 'boss123', '张总', 'boss'],
      ['u-finance', 'finance', 'finance123', '赵宁', 'finance_head'],
    ];

    for (const [id, username, password, displayName, roleKey] of users) {
      insertUser.run({
        id,
        username,
        passwordHash: bcrypt.hashSync(password, 10),
        displayName,
        roleKey,
      });
    }
  }
}

function toApiRecord(config, row) {
  const result = {};
  for (const [field, column] of config.columns) result[field] = row[column];
  return result;
}

function toDbRecord(config, item) {
  const result = {};
  for (const [field, column] of config.columns) result[column] = item[field] ?? '';
  return result;
}

function listTableCollection(name) {
  const config = TABLE_COLLECTIONS[name];
  const rows = db.prepare(`SELECT * FROM ${config.table} ORDER BY rowid`).all();
  return rows.map((row) => toApiRecord(config, row));
}

function replaceTableCollection(name, data) {
  const config = TABLE_COLLECTIONS[name];
  const dbColumns = config.columns.map(([, column]) => column);
  const placeholders = dbColumns.map((column) => `@${column}`).join(', ');
  const insert = db.prepare(`
    INSERT INTO ${config.table} (${dbColumns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET
      ${dbColumns.filter((column) => column !== 'id').map((column) => `${column} = excluded.${column}`).join(', ')},
      updated_at = CURRENT_TIMESTAMP
  `);

  const tx = db.transaction((items) => {
    db.prepare(`DELETE FROM ${config.table}`).run();
    for (const item of items) insert.run(toDbRecord(config, item));
  });
  tx(data);
}

export function getRawCollection(name) {
  const row = db.prepare('SELECT data FROM collections WHERE name = ?').get(name);
  if (!row) return null;
  return JSON.parse(row.data);
}

export function getCollection(name) {
  if (TABLE_COLLECTIONS[name]) return listTableCollection(name);
  return getRawCollection(name);
}

export function setCollection(name, data) {
  if (TABLE_COLLECTIONS[name]) {
    replaceTableCollection(name, data);
    return;
  }

  db.prepare(`
    INSERT INTO collections (name, data, updated_at)
    VALUES (@name, @data, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET
      data = excluded.data,
      updated_at = CURRENT_TIMESTAMP
  `).run({ name, data: JSON.stringify(data) });
}

export function upsertCollectionRecord(name, item) {
  if (!TABLE_COLLECTIONS[name]) {
    const data = getCollection(name) ?? [];
    const index = data.findIndex((current) => current.id === item.id);
    const next = index === -1
      ? [...data, item]
      : data.map((current) => (current.id === item.id ? item : current));
    setCollection(name, next);
    return item;
  }

  const config = TABLE_COLLECTIONS[name];
  const dbColumns = config.columns.map(([, column]) => column);
  const placeholders = dbColumns.map((column) => `@${column}`).join(', ');
  db.prepare(`
    INSERT INTO ${config.table} (${dbColumns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET
      ${dbColumns.filter((column) => column !== 'id').map((column) => `${column} = excluded.${column}`).join(', ')},
      updated_at = CURRENT_TIMESTAMP
  `).run(toDbRecord(config, item));
  return item;
}

export function deleteCollectionRecord(name, id) {
  if (TABLE_COLLECTIONS[name]) {
    db.prepare(`DELETE FROM ${TABLE_COLLECTIONS[name].table} WHERE id = ?`).run(id);
    return;
  }
  setCollection(name, (getCollection(name) ?? []).filter((item) => item.id !== id));
}

export function recordBudgetUsage({ budgetId, sourceType, sourceId, amount }) {
  const result = db.prepare(`
    INSERT OR IGNORE INTO budget_usages (id, budget_id, source_type, source_id, amount)
    VALUES (@id, @budgetId, @sourceType, @sourceId, @amount)
  `).run({
    id: `bu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    budgetId,
    sourceType,
    sourceId,
    amount,
  });
  return result.changes > 0;
}

export function appendAuditLog(user, action, module, detail) {
  const auditLogs = getCollection('auditLogs') ?? [];
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    user: user?.displayName ?? user?.username ?? 'system',
    action,
    module,
    time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    detail,
  });
  setCollection('auditLogs', auditLogs.slice(0, 500));
}

export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ? AND enabled = 1').get(username);
}

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ? AND enabled = 1').get(id);
}
