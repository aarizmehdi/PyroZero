# Backend audit before the v2.6 expansion

The deployed baseline is commit `17639c3d433c021ca1f1497f46b9b5f2e9481882`.

Before implementation, the application is a Next.js static export. GraphRAG executes only in the browser; there is no `src/app/api/copilot/route.ts`, no server-side provider adapter, no SSE response, and no environment-variable template. The hosting manifest selects `out/` as a static directory, which cannot execute a POST route.

The upgrade adds a real Next.js route using the Web Request/Response APIs and a shared server-only pipeline. For the existing private Sites deployment, the production build bundles that identical handler into a Worker ES module and embeds the Next.js-prerendered page and assets. This preserves the existing project identity and audience while adding server execution. Local development and normal Next.js production hosting use the App Router route directly.

Stage 1/2 results are emitted before optional generation. Provider narratives use structured paragraph/citation pairs, and citation IDs and numeric tokens are checked against the retrieved/computed context before release. Unknown citations, unsupported numerical claims, invalid provider output, provider errors and timeouts fall back to deterministic synthesis. This enforces citation membership and keeps computed tables authoritative; it is not a proof of every generated sentence's scientific validity.

Official integration references: [OpenAI streaming](https://developers.openai.com/api/docs/guides/streaming-responses), [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Gemini content generation](https://aistudio.google.com/api-reference/generate-content). No paid provider call is needed when neither key is configured.
