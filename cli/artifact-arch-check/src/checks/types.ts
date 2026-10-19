import type { CalmArchFile } from "../calm/types.js";

export interface CheckContext {
  artifactName: string;
  calmFile: CalmArchFile;
  calmFilePath: string;
  workspaceRoot: string;
}

export interface CheckIssue {
  packageName: string;
  message: string;
  fix: string;
  docsRef: string;
}

export interface CheckResult {
  checkId: string;
  checkName: string;
  passed: boolean;
  issues: CheckIssue[];
}

export interface CheckDefinition {
  id: string;
  name: string;
  run(ctx: CheckContext): Promise<CheckResult>;
}
