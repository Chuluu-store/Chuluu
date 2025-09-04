module.exports = {
  apps: [
    {
      name: "chuluu",
      script: "node",
      args: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 3,
      restart_delay: 4000,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "https://chuluu.store",
        UPLOAD_PATH: "/home/pi/uploads",
        MAX_FILE_SIZE: "500MB",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
        MONGODB_URI: "mongodb://localhost:27017/chuluu-test", // 테스트용 DB
      },
      log_file: "./logs/app.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      merge_logs: true,
      time: true,
    },
  ],
  deploy: {
    production: {
      user: "pi",
      host: "localhost",
      ref: "origin/main",
      repo: ".",
      path: "/home/pi/Chuluu",
      "pre-deploy-local": "",
      "post-deploy":
        "yarn install && yarn build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
