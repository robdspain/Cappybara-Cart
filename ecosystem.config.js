module.exports = {
  apps: [
    {
      name: "kart-3d-dev",
      cwd: "/Users/robspain/Desktop/Web Projects/cappybara-kart second try/kart-3d",
      script: "npm",
      args: "run dev -- --port 5174 --host 0.0.0.0",
      env: {
        NODE_ENV: "development",
      },
      autorestart: true,
      watch: false,
      max_restarts: 50,
      restart_delay: 3000,
      max_memory_restart: "1G",
      error_file: "/Users/robspain/Desktop/Web Projects/cappybara-kart second try/pm2-logs/kart-3d-dev-error.log",
      out_file: "/Users/robspain/Desktop/Web Projects/cappybara-kart second try/pm2-logs/kart-3d-dev-out.log",
      time: true,
    },
  ],
};


