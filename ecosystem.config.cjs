module.exports = {
  apps: [
    {
      name: "indobraga-api",
      cwd: "./apps/api",
      script: "dist/src/main.js",
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "indobraga-web",
      cwd: "./apps/web",
      script: ".output/server/index.mjs",
      time: true,
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "3000",
        API_INTERNAL_BASE_URL: "http://127.0.0.1:3001",
      },
    },
  ],
};
