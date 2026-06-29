export type ErrorContext = Record<string, string | number | boolean | null | undefined>;

export abstract class AbstractAlistigoError extends Error {
  readonly context: ErrorContext;

  constructor(message: string, context: ErrorContext = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
