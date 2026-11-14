import { Trans, useLingui } from "@lingui/react/macro";

interface DrawCommentButtonProps {
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function DrawCommentButton({ onClick, disabled, disabledReason }: DrawCommentButtonProps) {
  const { t } = useLingui();
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={disabled && disabledReason ? disabledReason : t`Draw Comment`}
        className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={t`Draw Comment`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        <Trans>Draw Comment</Trans>
      </button>
    </div>
  );
}
