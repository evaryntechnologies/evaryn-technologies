Evaryn Next.js 16 prerender build fix. Only next.config.ts changed; no auth, theme, or portal UI files changed.
Apply to current Git repository root, review diff, run npm run build, then commit/push main.
Disables Cache Components and Partial Prefetching; changes rendering strategy but not UI or business features. Restore configuration after proper Suspense/PPR remediation if needed.
