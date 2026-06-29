// Local abstract base following the ADR 0015 pattern.
// TODO: extend AbstractAlistigoError from a future @alistigo/errors package
//       once that shared package exists.

export type ErrorContext = Record<string, string | number | boolean | null | undefined>;

// fallow-ignore-next-line code-duplication
abstract class AbstractArtifactManagerError extends Error {
  readonly context: ErrorContext;

  constructor(message: string, context: ErrorContext = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownArtifactAppError extends AbstractArtifactManagerError {
  constructor(app: string, knownApps: string[]) {
    super("Unknown artifact app", { app, knownApps: knownApps.join(", ") });
  }
}

export class MountTargetNotFoundError extends AbstractArtifactManagerError {
  constructor(selector: string) {
    super("No element matches selector", { selector });
  }
}
