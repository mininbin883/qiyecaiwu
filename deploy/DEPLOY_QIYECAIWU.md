# 企业财务系统隔离部署

本部署方案不会占用旧系统目录、端口、PM2 进程名或数据库文件。

## 隔离约定

- 项目目录：`/var/www/qiyecaiwu/current`
- 数据目录：`/var/www/qiyecaiwu/shared/data`
- API 端口：`4101`
- PM2 进程名：`qiyecaiwu-api`
- Nginx 配置：`/etc/nginx/conf.d/qiyecaiwu.conf`
- 前端域名：`finance.example.com`

## 首次部署

```bash
sudo mkdir -p /var/www/qiyecaiwu/current /var/www/qiyecaiwu/shared/data
sudo chown -R $USER:$USER /var/www/qiyecaiwu

cd /var/www/qiyecaiwu/current
git clone git@github-qiyecaiwu:mininbin883/qiyecaiwu.git .

cp deploy/env.production.example .env.production
npm ci
npm run build
```

部署前修改 `ecosystem.config.cjs`：

- `CLIENT_ORIGIN` 改成真实域名
- `JWT_SECRET` 改成足够长的随机字符串
- 如端口 `4101` 被占用，改成其他未占用端口，并同步修改 Nginx

启动 API：

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs --only qiyecaiwu-api
pm2 save
```

安装 Nginx 配置：

```bash
sudo cp deploy/nginx-qiyecaiwu.conf /etc/nginx/conf.d/qiyecaiwu.conf
sudo sed -i 's/finance.example.com/你的真实域名/g' /etc/nginx/conf.d/qiyecaiwu.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 验证

```bash
curl http://127.0.0.1:4101/api/health
pm2 logs qiyecaiwu-api
```

访问：

```txt
http://你的真实域名
```

## 更新部署

```bash
cd /var/www/qiyecaiwu/current
git pull
npm ci
npm run build
pm2 restart qiyecaiwu-api
```
