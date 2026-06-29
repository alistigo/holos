import { AbstractAlistigoError } from "@alistigo/domain";

export abstract class AbstractListComponentsError extends AbstractAlistigoError {}

export class ProviderContextError extends AbstractListComponentsError {
  constructor(providerName: string) {
    super(`Must be rendered inside <${providerName}>.`, { providerName });
  }
}
