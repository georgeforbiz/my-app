"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold text-slate-500">VSTAH</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 w-full rounded-xl bg-[#0033A0] px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
