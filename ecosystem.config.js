module.exports = {
  apps: [
    {
      name: "tdgames-landingpage",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/opt/tdgames-landingpage",
      instances: 1,
      autorestart: true,
      watch: false,
      // 512M là quá sát: upload 1 file 100MB buffer vào RAM ~3× + baseline
      // ~180MB đã chạm trần → PM2 giết process giữa request, client ăn 502.
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        // Process đang chạy trên VPS dùng 3000 và nginx proxy về 3000.
        // 3001 là app khác (platforms) — để 3001 ở đây là bẫy: fallback
        // `pm2 start ecosystem.config.js` sẽ bind nhầm port.
        PORT: 3000,
      },
    },
  ],
};
