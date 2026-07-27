import type { ReactNode } from "react";
import logoUrl from "../assets/logo.png";

export interface LoadingScreenProps {
  artifactName?: string | undefined;
}

export function LoadingScreen({ artifactName }: LoadingScreenProps): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <img src={logoUrl} alt="Alistigo" className="h-16 w-16 animate-pulse rounded-2xl" />
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
      {artifactName != null && <p className="text-sm text-gray-500">{artifactName}</p>}
    </div>
  );
}
