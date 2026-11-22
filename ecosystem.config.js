// PM2 process for production (Contabo VPS, see doc/deploy.md).
// Runs as the "binoregn" user from /home/binoregn/app. Listens on
// 127.0.0.1 only — nginx is the public entry point (HTTPS), and the
// firewall only opens 22/80/443.
module.exports = {
  apps: [
    {
      name: "binoregn",
      cwd: "/home/binoregn/app",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 4000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      time: true,
    },
  ],
};
