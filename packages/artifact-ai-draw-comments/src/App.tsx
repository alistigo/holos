import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { sendAnnotation } from "./application/claude-bridge.js";
import { AnnotationThread } from "./components/AnnotationThread.js";
import { CommentInput } from "./components/CommentInput.js";
import { DrawCanvas } from "./components/DrawCanvas.js";
import { DrawCommentButton } from "./components/DrawCommentButton.js";
import { DrawToolbar } from "./components/DrawToolbar.js";
import { ErrorBanner } from "./components/ErrorBanner.js";
import { SelectionOverlay } from "./components/SelectionOverlay.js";
import type {
  DrawCommentSession,
  SelectionRegion,
  SessionEvent,
  SessionEventLog,
} from "./domain/session.js";
import { projectSession } from "./domain/session.js";
import type { DrawShape } from "./domain/shapes.js";
import { buildAnnotatedSnapshot } from "./domain/snapshot.js";
import "./styles/widget.css";

function appendEvent(
  logs: SessionEventLog[],
  sessionId: string,
  event: SessionEvent,
): SessionEventLog[] {
  return logs.map((log) =>
    log.sessionId === sessionId ? { ...log, events: [...log.events, event] } : log,
  );
}

function isSessionActive(session: DrawCommentSession | null): boolean {
  if (session === null) return false;
  return session.status !== "idle" && session.status !== "responded";
}

function ClaudeUnavailableBanner({ onDismiss }: { onDismiss: () => void }) {
  if ("claude" in window) return null;
  return (
    <ErrorBanner
      message="window.claude is not available — this widget requires a Claude artifact context."
      onDismiss={onDismiss}
    />
  );
}

interface DrawingPhaseProps {
  session: DrawCommentSession;
  activeTool: "rectangle" | "line";
  comment: string;
  shapes: DrawShape[];
  regionRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.RefObject<Konva.Stage | null>;
  onToolChange: (tool: "rectangle" | "line") => void;
  onShapesChange: (shapes: DrawShape[]) => void;
  onCommentChange: (v: string) => void;
  onSend: () => void;
  onDismissError: () => void;
}

function DrawingPhase({
  session,
  activeTool,
  comment,
  shapes,
  regionRef,
  stageRef,
  onToolChange,
  onShapesChange,
  onCommentChange,
  onSend,
  onDismissError,
}: DrawingPhaseProps) {
  return (
    <>
      {session.region !== null && (
        <div
          ref={regionRef}
          className="absolute"
          style={{
            left: session.region.x,
            top: session.region.y,
            width: session.region.width,
            height: session.region.height,
          }}
        >
          <DrawCanvas
            region={session.region}
            activeTool={activeTool}
            onShapesChange={onShapesChange}
            stageRef={stageRef}
          />
        </div>
      )}
      <div
        className="fixed bottom-0 left-0 right-0 shadow-lg"
        style={{ zIndex: "var(--ai-draw-panel-z)" }}
      >
        <div className="flex items-start gap-2 border-t border-gray-200 bg-white p-2">
          <DrawToolbar activeTool={activeTool} onToolChange={onToolChange} />
          <div className="flex-1">
            {session.error !== null && (
              <ErrorBanner message={session.error} onDismiss={onDismissError} />
            )}
            <CommentInput
              comment={comment}
              shapes={shapes}
              onCommentChange={onCommentChange}
              onSend={onSend}
              isSending={session.status === "submitting"}
            />
          </div>
        </div>
      </div>
    </>
  );
}

interface SessionActiveViewProps extends DrawingPhaseProps {
  onSelect: (region: SelectionRegion) => void;
  onCancel: () => void;
}

function SessionActiveView({ session, onSelect, onCancel, ...rest }: SessionActiveViewProps) {
  if (session.status === "selecting") {
    return <SelectionOverlay onSelect={onSelect} onCancel={onCancel} />;
  }
  if (session.status !== "drawing" && session.status !== "submitting") return null;
  return <DrawingPhase session={session} {...rest} />;
}

function AnnotationList({ sessions }: { sessions: DrawCommentSession[] }) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {sessions
        .filter((s) => s.status === "sent" || s.status === "responded")
        .map((s) => (
          <AnnotationThread key={s.id} session={s} />
        ))}
    </div>
  );
}

// fallow-ignore-next-line complexity
export function App() {
  const [logs, setLogs] = useState<SessionEventLog[]>([]);
  const [activeTool, setActiveTool] = useState<"rectangle" | "line">("rectangle");
  const [shapes, setShapes] = useState<DrawShape[]>([]);
  const [comment, setComment] = useState("");
  const regionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  const sessions = logs.map(projectSession);
  const activeLog = logs.at(-1);
  const activeSession = activeLog !== undefined ? projectSession(activeLog) : null;
  const isActive = isSessionActive(activeSession);

  function dispatch(sessionId: string, event: SessionEvent) {
    setLogs((prev) => appendEvent(prev, sessionId, event));
  }

  function startSession() {
    const id = crypto.randomUUID();
    setShapes([]);
    setComment("");
    setLogs((prev) => [
      ...prev,
      {
        sessionId: id,
        events: [{ type: "AnnotationStarted", sessionId: id, at: Date.now() }],
      },
    ]);
  }

  function handleRegionSelected(region: SelectionRegion) {
    if (activeLog === undefined) return;
    dispatch(activeLog.sessionId, { type: "RegionSelected", region, at: Date.now() });
  }

  function handleCancel() {
    if (activeLog === undefined) return;
    dispatch(activeLog.sessionId, { type: "AnnotationCancelled", at: Date.now() });
    setShapes([]);
    setComment("");
  }

  function handleShapesChange(newShapes: DrawShape[]) {
    setShapes(newShapes);
    const lastShape = newShapes.at(-1);
    if (lastShape !== undefined && activeLog !== undefined) {
      dispatch(activeLog.sessionId, { type: "ShapeDrawn", shape: lastShape, at: Date.now() });
    }
  }

  function handleCommentChange(v: string) {
    setComment(v);
    if (activeLog !== undefined) {
      dispatch(activeLog.sessionId, { type: "CommentUpdated", comment: v, at: Date.now() });
    }
  }

  async function doSend(sessionId: string, regionEl: HTMLDivElement, stage: Konva.Stage) {
    dispatch(sessionId, { type: "AnnotationSubmitting", at: Date.now() });
    try {
      const snapshot = await buildAnnotatedSnapshot(regionEl, stage, comment);
      dispatch(sessionId, { type: "AnnotationSent", snapshot, at: Date.now() });
      const response = await sendAnnotation(snapshot);
      dispatch(sessionId, { type: "ClaudeResponded", response, at: Date.now() });
    } catch (e) {
      dispatch(sessionId, { type: "SendFailed", error: String(e), at: Date.now() });
    }
  }

  async function handleSend() {
    const log = activeLog;
    if (log === undefined) return;
    const regionEl = regionRef.current;
    const stage = stageRef.current;
    if (regionEl === null || stage === null) return;
    await doSend(log.sessionId, regionEl, stage);
  }

  function handleDismissError() {
    if (activeLog !== undefined) {
      dispatch(activeLog.sessionId, { type: "AnnotationCancelled", at: Date.now() });
    }
  }

  // Handle Escape during the drawing phase (SelectionOverlay covers selecting; this covers drawing/submitting).
  const activeLogRef = useRef(activeLog);
  activeLogRef.current = activeLog;
  useEffect(() => {
    // fallow-ignore-next-line complexity
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const log = activeLogRef.current;
      if (log === undefined) return;
      const session = projectSession(log);
      if (session.status === "drawing" || session.status === "submitting") {
        setLogs((prev) =>
          appendEvent(prev, log.sessionId, { type: "AnnotationCancelled", at: Date.now() }),
        );
        setShapes([]);
        setComment("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="ai-draw-comments font-sans text-sm">
      <ClaudeUnavailableBanner onDismiss={handleDismissError} />
      <DrawCommentButton
        onClick={startSession}
        disabled={isActive || !("claude" in window)}
        disabledReason={
          !("claude" in window)
            ? "Draw comments require a Claude artifact environment"
            : "An annotation is already in progress"
        }
      />
      {activeSession !== null && (
        <SessionActiveView
          session={activeSession}
          activeTool={activeTool}
          comment={comment}
          shapes={shapes}
          regionRef={regionRef}
          stageRef={stageRef}
          onToolChange={setActiveTool}
          onShapesChange={handleShapesChange}
          onCommentChange={handleCommentChange}
          onSend={() => {
            void handleSend();
          }}
          onSelect={handleRegionSelected}
          onCancel={handleCancel}
          onDismissError={handleDismissError}
        />
      )}
      <AnnotationList sessions={sessions} />
    </div>
  );
}
