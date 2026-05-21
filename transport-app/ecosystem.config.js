// PM2 process configuration for Nexura Transport App.
// Usage on the server:
//   pm2 start ecosystem.config.js --env production
//   pm2 save
//   pm2 startup     (one-time, to register systemd boot hook)

module.exports = {
  apps: [
    {
      name: 'nexura-transport',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,                // bump up (or 'max') when you outgrow a single core
      exec_mode: 'fork',           // switch to 'cluster' with instances > 1
      autorestart: true,
      max_memory_restart: '512M',
      watch: false,                // do NOT watch in production
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      // Logging — combined with system journald via pm2-logrotate
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
