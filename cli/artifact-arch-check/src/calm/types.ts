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
