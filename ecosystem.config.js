/* eslint-disable no-undef */
module.exports = {
  apps: [
    {
      name: "canva-frontend",
      script: "npm",
      args: "run preview",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "canva-api",
      script: "app.js",
      cwd: "./api",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
