"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

/** Catches client render errors so users see a message instead of a blank page. */
export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[vstah] client render error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center"
          role="alert"
        >
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <p className="text-sm font-semibold text-slate-500">VSTAH</p>
            <h1 className="mt-2 text-xl font-bold text-slate-900">Page failed to load</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="mt-6 w-full rounded-xl bg-[#0033A0] px-4 py-3 text-sm font-bold text-white"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
