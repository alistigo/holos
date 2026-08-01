import type { ReactNode } from "react";
import logoUrl from "../assets/logo.png";

export interface LoadingScreenProps {
  artifactName?: string | undefined;
}

export function LoadingScreen({ artifactName }: LoadingScreenProps): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
        <img src={logoUrl} alt="Alistigo" className="h-14 w-14 rounded-2xl" />
      </div>
      {artifactName != null && <p className="text-sm text-gray-500">{artifactName}</p>}
    </div>
  );
}
