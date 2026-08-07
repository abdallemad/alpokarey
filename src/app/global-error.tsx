"use client";

/**
 * Last-resort boundary for errors thrown by the root layout itself.
 *
 * It replaces the root layout when active, so it has to render its own
 * `<html>` and `<body>` — including `lang`/`dir`, since the Arabic RTL setup
 * from the root layout is gone at this point. Global styles and the theme class
 * are not available here either, which is why the styling is inline.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#fafaf9",
          color: "#1c1c1c",
        }}
      >
        <title>حدث خطأ غير متوقع</title>
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            حدث خطأ غير متوقع
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: "#57534e",
            }}
          >
            نعتذر عن هذا العطل. يمكنك إعادة المحاولة، وإذا استمرت المشكلة فيرجى
            التواصل مع الدعم الفني.
          </p>

          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              color: "#fafaf9",
              backgroundColor: "#0f5c4d",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>

          {error.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                color: "#a8a29e",
              }}
            >
              رمز الخطأ: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
