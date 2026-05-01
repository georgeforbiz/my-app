"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui,sans-serif", background: "#f8fafc" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24
          }}
        >
          <div
            style={{
              maxWidth: 400,
              padding: 32,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              textAlign: "center"
            }}
          >
            <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>{error.message}</p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: "#0033A0",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
