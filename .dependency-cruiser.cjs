/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // Circular dependencies
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },

    // Layer rule: route handlers / controllers cannot import repositories directly.
    // They must go through a service.
    {
      name: "no-handler-to-repo",
      severity: "error",
      comment: "Route handlers must use services, not import repositories directly",
      from: { path: "/(routes|handlers|controllers)/" },
      to: { path: "/(repositories|repos|repository)/" },
    },

    // Layer rule: services cannot import route handlers / controllers (wrong direction)
    {
      name: "no-service-to-handler",
      severity: "error",
      from: { path: "/services?/" },
      to: { path: "/(routes|handlers|controllers)/" },
    },

    // Forbid deep relative imports that escape a package's own directory.
    // Cross-package imports must use the workspace package name (e.g. @mlabrut/foo),
    // not a relative path like ../../other-package/src/bar.
    {
      name: "no-cross-package-relative-import",
      severity: "error",
      comment: "Use workspace package names for cross-package imports, not ../../ relative paths",
      from: { path: "^(apps|packages|cli)/([^/]+)/" },
      to: {
        // matches ../something that would leave the current package root
        path: "^\\.\\.\\/",
        pathNot: "^\\.\\/",
      },
    },
  ],

  options: {
    doNotFollow: {
      dependencyTypes: ["npm", "npm-dev", "npm-optional", "npm-peer", "npm-bundled"],
      path: "node_modules",
    },
    exclude: {
      path: "(node_modules|dist|build|\\.nx|\\.git|\\.astro|vendor|\\.claude)",
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
