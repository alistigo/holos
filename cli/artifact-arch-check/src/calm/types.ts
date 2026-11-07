export interface CalmInterface {
  "unique-id": string;
  description: string;
}

export interface CalmNode {
  "unique-id": string;
  "node-type": "module" | "skill" | "system" | "plugin" | "group";
  name: string;
  description: string;
  "ddd-layer"?: "Domain" | "Application" | "Presentation" | "Infrastructure";
  /** Naming pattern for the artifact-specific implementation package. `{domain}` is substituted with the artifact name. */
  "package-name"?: string;
  /** The mandatory base/shared npm package this layer builds on. Present on nodes that DON'T have a `package-name` (shared nodes) or on nodes that DO (the base package their impl must depend on). */
  "core-npm-package"?: string;
  "default-plugin-package"?: string;
  interfaces?: CalmInterface[];
}

export interface CalmConnectsEndpoint {
  node: string;
  interfaces?: string[];
}

export interface CalmRelationshipType {
  connects?: {
    source: CalmConnectsEndpoint;
    destination: CalmConnectsEndpoint;
  };
  "composed-of"?: {
    container: string;
    nodes: string[];
  };
}

export interface CalmRelationship {
  "unique-id": string;
  description: string;
  "relationship-type": CalmRelationshipType;
}

export interface CalmArchFile {
  $schema: string;
  "unique-id": string;
  name: string;
  description: string;
  metadata?: Record<string, unknown>[];
  nodes: CalmNode[];
  relationships: CalmRelationship[];
}
