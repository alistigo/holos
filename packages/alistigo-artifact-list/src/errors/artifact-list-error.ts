import { AbstractAlistigoError } from "@alistigo/domain";

export abstract class AbstractArtifactListError extends AbstractAlistigoError {}

export class MountContainerNotFoundError extends AbstractArtifactListError {
  constructor(selector: string) {
    super("Mount container not found", { selector });
  }
}
