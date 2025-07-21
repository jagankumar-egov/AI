module.exports = {
  apps: [
    {
      name: "api",
      script: "./server/index.js",
      env: {
        NODE_ENV: "production",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY
      }
    }
  ]
};
