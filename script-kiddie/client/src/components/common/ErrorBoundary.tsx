import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {

    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-danger-muted">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-muted">
            This page hit an unexpected error. Reloading usually fixes it; if it keeps
            happening, this has been logged to the browser console for debugging.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
