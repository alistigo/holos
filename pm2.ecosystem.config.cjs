const root = __dirname;
module.exports = {
  apps: [
    {
      name: "playground",
      script: "pnpm",
      args: "exec vite --host 0.0.0.0",
      interpreter: "none",
      cwd: `${root}/apps/alistigo-artifact-playground`,
      autorestart: true,
      watch: false,
    },
  ],
};
