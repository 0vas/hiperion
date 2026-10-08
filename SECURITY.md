# Security policy

Hyperion v0.1 is a **local, single-user preview**. Only the current development version receives fixes.

## Trust boundary

The server listens on `127.0.0.1` and rejects unexpected Host/Origin and cross-site requests. Browser sessions and agent credentials use separate roles. Strict input validation, request limits, revision checks and command deduplication protect the workflow contract.

This does not isolate Hyperion from a program or agent running with the same OS user's full privileges. Such a program can read local files, obtain a browser session or operate the browser. Approval enforcement is a cooperative application boundary, not a sandbox against a malicious local agent.

Do not expose the server publicly, put it behind an Internet tunnel, or treat it as a multi-user service. A remote deployment needs authenticated identities, authorization per run, TLS, secure cookie configuration, rate limits and an executor trust model.

## Data

`.hyperion/` contains credentials, user responses, result evidence and SQLite history. It is excluded from Git and created with restrictive directory/file permissions on POSIX. Keep backups private; do not place secrets in step logs. No telemetry or AI API calls are built in. Dependencies are installed from npm.

A paused or cancelled workflow does not kill external processes or undo their effects. A disconnected executor may leave a step marked running. Reconcile the external action before retrying it.

## Reporting

Do not disclose vulnerabilities or credentials in public issues. Use the repository's private vulnerability reporting feature if enabled; otherwise arrange a private channel with the repository owner through their GitHub profile before sending sensitive details. Include the affected revision, reproduction steps, impact, and a minimal sanitized example.
