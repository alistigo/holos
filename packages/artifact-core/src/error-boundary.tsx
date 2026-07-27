import { Component, type ErrorInfo, type ReactNode } from "react";

export interface ArtifactErrorBoundaryProps {
  onError: (error: Error, componentStack: string | undefined) => void;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ArtifactErrorBoundary extends Component<ArtifactErrorBoundaryProps, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    const wrapped = error instanceof Error ? error : new Error(String(error));
    this.props.onError(wrapped, errorInfo.componentStack ?? undefined);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
