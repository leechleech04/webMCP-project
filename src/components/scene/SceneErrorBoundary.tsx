import { Component, type ErrorInfo, type ReactNode } from "react";

export class SceneErrorBoundary extends Component<{
  children: ReactNode;
  fallback: (error: Error, retry: () => void) => ReactNode;
}, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("3D scene rendering failed", error, info);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ error: null }));
    }
    return this.props.children;
  }
}
