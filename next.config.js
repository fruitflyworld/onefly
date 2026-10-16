/** @type {import('next').NextConfig} */
const nextConfig = {
  /* The site is one page that computes the day's fly entirely in the browser
     from the committed engine. No API, no database, no wallet, nothing on
     chain. The headers below carry no CSP risk (inline module trees would). */
  async headers() {
    return [
      {
        /* Today's fly must never be served stale: a page cached by a CDN, a
           proxy or an ISP would show yesterday's fly as today's. */
        source: "/:path((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image).*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }]
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
