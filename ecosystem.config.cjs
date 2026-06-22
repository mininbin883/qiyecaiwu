module.exports = {
  apps: [
    {
      name: 'qiyecaiwu-api',
      script: 'server/index.js',
      cwd: '/var/www/qiyecaiwu/current',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        API_PORT: '4101',
        CLIENT_ORIGIN: 'https://finance.example.com',
        DATA_DIR: '/var/www/qiyecaiwu/shared/data',
        JWT_SECRET: 'change-this-before-deploying',
      },
    },
  ],
};
