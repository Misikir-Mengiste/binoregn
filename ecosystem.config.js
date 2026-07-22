module.exports = {
    apps: [
      {
        name: "app-frontend",
        script: "npm",
        args: "start",
        cwd: "/root/affiliate-marketplace",
        instances: 1,
        exec_mode: "fork",
        env: {
          NODE_ENV: "production",
          PORT: 4000,
        },
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
      },
    ],
  };