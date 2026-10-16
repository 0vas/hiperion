# 0034 — Replace the previous runtime when opening an update

## Problem

Desktop intentionally leaves its local service available after closing the window. Replacing the application files does not replace a process already in memory. The new launcher previously rejected that older version, leaving an updated application unable to open.

## Decision

Keep the same local service, credentials, SQLite database and adapter boundary. The shared Desktop/CLI/MCP launcher now authenticates the existing service, checks that its version is older, and verifies the listening PID, OS owner and exact runtime/server command against this installation. It rechecks ownership immediately before stopping the process. Unknown versions, newer servers, wrong credentials and other installations remain untouched. No unauthenticated shutdown endpoint is added.

Use an exclusive startup lock to serialize launchers. Before termination, create a consistent SQLite `VACUUM INTO` backup and check its integrity. Use the existing directory for the replacement, including its WAL; never restore the earlier backup over newer committed data. POSIX SIGTERM drains the service. Windows terminates the verified process and relies on SQLite WAL transaction recovery. Backups are local and retained; failure to create one prevents termination. This supports older installers without requiring an endpoint they never shipped.

A service restart is not a workflow retry. Keep running task attempts, decisions, receipts, artifacts, lineage and continuation records. External agent execution is independent; interrupted transports can reconnect and retry identical commands with their original idempotency key. No native chat wakeup or installer execution is implied. Installing/moving to a different application path is intentionally not automatic takeover.

## Evidence and limits

Unit tests cover version/identity boundaries, unauthenticated and foreign listeners, and serialized startup. Native runtime tests launch an older version, replace files, start two launchers, and verify all saved evidence, artifact bytes, links and receipts; a failed backup leaves the old process alive. CI repeats this with macOS ARM64, macOS Intel and Windows packaged runtimes. The single trusted OS-user security model is unchanged; this is not protection against malicious local code with the user's credentials.

The existing architecture diagrams retain the same actors, data store and component connections. This change adds a startup lifecycle policy inside the adapter; no domain, HTTP or artifact schema changes are introduced.
