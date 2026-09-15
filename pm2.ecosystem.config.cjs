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
    {
      name: "website",
      script: "pnpm",
      args: "exec astro dev --host 0.0.0.0",
      interpreter: "none",
      cwd: `${root}/websites/alistigo`,
      autorestart: true,
      watch: false,
    },
    {
      name: "storybook",
      script: "pnpm",
      args: "exec storybook dev --port 6006 --host 0.0.0.0",
      interpreter: "none",
      cwd: `${root}/websites/storybook`,
      autorestart: true,
      watch: false,
    },
  ],
};
