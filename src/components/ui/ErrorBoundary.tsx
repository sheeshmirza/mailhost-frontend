"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.fallbackTitle || "Something went wrong"}
          message={
            this.props.fallbackMessage ||
            "An unexpected client error occurred while displaying this section."
          }
          error={this.state.error}
          onRetry={this.handleReset}
          retryLabel="Try Recovering"
          actionHref="/overview"
          actionLabel="Go to Dashboard"
        />
      );
    }

    return this.props.children;
  }
}
