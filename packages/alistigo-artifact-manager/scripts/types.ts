export interface AppFrontmatter {
  app?: string;
  description?: string;
  triggers?: string[];
  [key: string]: unknown;
}

export interface AppSkillData {
  appName: string;
  pkgDir: string;
  description: string;
  triggers: string[];
}
