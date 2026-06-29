import { AbstractAlistigoError } from "@alistigo/domain";

abstract class AbstractClaudeStorageError extends AbstractAlistigoError {}

export class ClaudeStorageUnavailableError extends AbstractClaudeStorageError {
  constructor() {
    super(
      "ClaudeArtifactListRepository requires window.storage — call isClaudeArtifactContext() before instantiating",
    );
  }
}
