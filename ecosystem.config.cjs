// MAK Tours & Travels ERP - PM2 Production Ecosystem Configuration
// Deployable to IOP Server / Ubuntu / Debian / RHEL with PM2 process manager
module.exports = {
  apps: [
    {
      name: 'mak-erp-backend',
      script: 'src/server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 8000
    }
  ]
};
