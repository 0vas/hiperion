# 0031 — Desktop integrity and user-controlled updates

Date: 2026-10-11. Status: implemented in 0.5.1-preview.1; Apple notarization pending credentials.

The published 0.4.0 Apple Silicon DMG matches its published SHA-256, but its application fails `codesign --verify --deep --strict` with missing sealed resources. The installed copy fails identically. Its icon also predates the canonical solar titan identity.

Use the canonical PNG for Desktop, canvas and favicon, with a byte-equality regression test. Rebuild binary releases for brand changes. Seal macOS previews with ad-hoc signing; signed distributions use Developer ID plus notarization when credentials exist. CI verifies bundle integrity; signed builds additionally require notarization and Gatekeeper assessment. Ad-hoc verification does not certify acceptance on another user's Mac.

Updates belong to Electron's main process. Read public GitHub metadata, filter draft/channel/platform/architecture, and accept official repository assets with SHA-256 digests. Require download consent and a chosen destination. Use temporary files, bounded sizes, cancellation and digest verification before atomic rename. No renderer filesystem bridge, implicit installer execution or elevation. GitHub account compromise is outside this integrity check's protection; digest validation is not developer signing.

Check once after opening packaged Desktop, plus a manual menu action. Offline automatic checks stay quiet. Startup failures preserve retry, diagnostics and update actions instead of immediately terminating. Existing services, workflow state and credentials are never deleted to resolve a conflict.

Tests cover version selection, metadata, download corruption, cancellation, consent, recovery and packaged startup. Developer ID signing and notarization remain unverified without credentials. Native harness resume connectors are unchanged.
