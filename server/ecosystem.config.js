module.exports = {
  apps: [
    {
      name: "generate-config-server",
      script: "index.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 5002
      }
    }
  ]
};
