/**
 * React glue around `@alistigo/document-editor`.
 *
 * Wraps a `ListApplicationService` so that child components can read the
 * current `AlistigoDocument` via `useAlistigoDocument()` and dispatch
 * mutations via `useAlistigoActions()`.
 *
 * The `isPending` flag powers the `data-state="pending"/"idle"` attribute
 * used by the Playwright runner's `waitForIdle` synchronisation.
 */

import type { ListApplicationService } from "@alistigo/document-editor";
import type { AlistigoDocument } from "@alistigo/document-format";
import { generateActorId, type ListId, parseListElementId } from "@alistigo/domain";
import { createLogger } from "@alistigo/logger";
import {
  createContext,
  type JSX,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ProviderContextError } from "../errors/list-components-error.js";

const UI_ACTOR_ID = generateActorId();
const log = createLogger("alistigo:provider");

interface DocumentContextValue {
  doc: AlistigoDocument;
  setDoc: (doc: AlistigoDocument) => void;
}
const DocumentContext = createContext<DocumentContextValue | null>(null);

interface ServiceContextValue {
  service: ListApplicationService;
  listId: ListId;
}
const ServiceContext = createContext<ServiceContextValue | null>(null);

interface PendingContextValue {
  isPending: boolean;
  setIsPending: (v: boolean) => void;
}
const PendingContext = createContext<PendingContextValue | null>(null);

export interface AlistigoProviderProps {
  service: ListApplicationService;
  listId: ListId;
  initialDocument: AlistigoDocument;
  children: ReactNode;
}

export function AlistigoProvider({
  service,
  listId,
  initialDocument,
  children,
}: AlistigoProviderProps): JSX.Element {
  const [doc, setDoc] = useState<AlistigoDocument>(initialDocument);
  const [isPending, setIsPending] = useState(false);
  const docValue = useMemo(() => ({ doc, setDoc }), [doc]);
  const serviceValue = useMemo(() => ({ service, listId }), [service, listId]);
  const pendingValue = useMemo(() => ({ isPending, setIsPending }), [isPending]);

  return (
    <DocumentContext.Provider value={docValue}>
      <ServiceContext.Provider value={serviceValue}>
        <PendingContext.Provider value={pendingValue}>{children}</PendingContext.Provider>
      </ServiceContext.Provider>
    </DocumentContext.Provider>
  );
}

function useDocumentContext(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (ctx == null) throw new ProviderContextError("AlistigoProvider");
  return ctx;
}

function useServiceContext(): ServiceContextValue {
  const ctx = useContext(ServiceContext);
  if (ctx == null) throw new ProviderContextError("AlistigoProvider");
  return ctx;
}

function usePendingContext(): PendingContextValue {
  const ctx = useContext(PendingContext);
  if (ctx == null) throw new ProviderContextError("AlistigoProvider");
  return ctx;
}

/** Returns the current `AlistigoDocument`. Re-renders on every mutation. */
export function useAlistigoDocument(): AlistigoDocument {
  return useDocumentContext().doc;
}

/**
 * Returns true between dispatch and the subsequent document update.
 * Exposed as `data-state="pending"/"idle"` by `AlistigoApp` for test sync.
 */
export function useActionPending(): boolean {
  return usePendingContext().isPending;
}

export interface AlistigoActions {
  addElement(text: string): void;
  deleteElement(elementId: string): void;
}

/**
 * Stable action callbacks. Each fires an async command and updates doc state
 * on success. `isPending` is set true on dispatch and cleared when done.
 */
export function useAlistigoActions(): AlistigoActions {
  const { setDoc } = useDocumentContext();
  const { service, listId } = useServiceContext();
  const { setIsPending } = usePendingContext();
  const setDocRef = useRef(setDoc);
  setDocRef.current = setDoc;

  return useMemo<AlistigoActions>(
    () => ({
      addElement: (text) => {
        setIsPending(true);
        service
          .addListElement(listId, text, UI_ACTOR_ID)
          .then((result) => {
            if (result.ok) {
              log.debug("element added");
              setDocRef.current(result.value);
            } else {
              log.error({ error: result.error }, "addElement failed");
            }
          })
          .finally(() => setIsPending(false));
      },
      deleteElement: (elementId) => {
        setIsPending(true);
        Promise.resolve()
          .then(() => {
            const lseId = parseListElementId(elementId);
            return service.deleteListElement(listId, lseId, UI_ACTOR_ID);
          })
          .then((result) => {
            if (result.ok) {
              log.debug({ elementId }, "element deleted");
              setDocRef.current(result.value);
            } else {
              log.error({ error: result.error, elementId }, "deleteElement failed");
            }
          })
          .finally(() => setIsPending(false));
      },
    }),
    [service, listId, setIsPending],
  );
}
