import { Trans, useLingui } from "@lingui/react/macro";
import type { DrawShape } from "../domain/shapes.js";

interface CommentInputProps {
  comment: string;
  shapes: DrawShape[];
  onCommentChange: (v: string) => void;
  onSend: () => void;
  isSending?: boolean;
}

export function CommentInput({
  comment,
  shapes,
  onCommentChange,
  onSend,
  isSending,
}: CommentInputProps) {
  const { t } = useLingui();
  const sendable = shapes.length > 0 || comment.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 border-t border-gray-200 bg-white px-3 py-2">
      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder={t`Add a comment… (optional)`}
        rows={2}
        className="w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        disabled={isSending}
        aria-label={t`Annotation comment`}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSend}
          disabled={!sendable || isSending}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? <Trans>Sending…</Trans> : <Trans>Send</Trans>}
        </button>
      </div>
    </div>
  );
}
