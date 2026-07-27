import type { ReactNode } from "react";

export interface ErrorScreenProps {
  error: Error;
  onReset?: (() => void) | undefined;
}

export function ErrorScreen({ error, onReset }: ErrorScreenProps): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold text-red-600">Something went wrong</p>
        <p className="max-w-sm text-sm text-gray-500">{error.message}</p>
      </div>
      {onReset != null && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
