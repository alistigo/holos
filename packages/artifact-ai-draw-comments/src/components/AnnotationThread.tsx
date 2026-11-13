import type { DrawCommentSession, SessionStatus } from "../domain/session.js";

interface AnnotationThreadProps {
  session: DrawCommentSession;
}

function isAwaitingResponse(status: SessionStatus, claudeResponse: string | null): boolean {
  return status === "sent" && claudeResponse === null;
}

export function AnnotationThread({ session }: AnnotationThreadProps) {
  const { snapshot, claudeResponse, status } = session;

  if (snapshot === null) return null;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-3">
        <img
          src={`data:image/png;base64,${snapshot.pngBase64}`}
          alt="Annotated region"
          className="w-full rounded border border-gray-100"
        />
        {snapshot.comment.length > 0 && (
          <p className="mt-2 text-sm text-gray-700">{snapshot.comment}</p>
        )}
      </div>
      <div className="border-t border-gray-100 p-3">
        {isAwaitingResponse(status, claudeResponse) ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
              aria-hidden="true"
            />
            Claude is thinking…
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-gray-800">{claudeResponse}</p>
        )}
      </div>
    </div>
  );
}
