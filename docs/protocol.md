# Hyperion protocol v0.1

All requests use the loopback HTTP origin. JSON is validated strictly; unknown fields are rejected. Limits: 100 steps per plan, 128 KiB per request, 8,000 characters per result/log message. Plans are immutable, acyclic and contain unique step IDs.

## Authentication

CLI/MCP send `Authorization: Bearer <agentToken>`. Each registered integration has its own token; the authenticated identity owns runs it creates. All registered integrations can read local runs, while only the owning coordinator can mutate agent steps. The local browser obtains an HttpOnly, SameSite=Strict session cookie from the same-origin UI. Human and agent operations are distinct. This is a single trusted OS-user deployment; see [the security boundary](../SECURITY.md).

Never commit or include `.hyperion/credentials.json` in a report. The agent integration reads only the agent credential. The data directory is created with owner-only permissions on POSIX systems.

## Routes

| Method | Route                    | Result                                         |
| ------ | ------------------------ | ---------------------------------------------- |
| GET    | `/api/health`            | Health and version, no credentials required    |
| GET    | `/api/session`           | Bootstrap a local human browser session        |
| GET    | `/api/runs`              | Up to 100 most recent snapshots, newest first  |
| POST   | `/api/runs`              | Agent creates `{commandId, plan}`; returns 201 |
| GET    | `/api/runs/:id`          | A complete run snapshot                        |
| POST   | `/api/runs/:id/commands` | Apply one command atomically                   |

The session bootstrap is protected by exact Host/Origin and Fetch Metadata checks. It assumes trusted local programs and does not establish user identity over the Internet.

## Plan

```json
{
  "title": "Review a change",
  "description": "Optional context",
  "request": "Use Hyperion to review this change and ask for my approval.",
  "steps": [
    {
      "id": "inspect",
      "title": "Inspect",
      "kind": "agent",
      "dependencies": []
    },
    {
      "id": "choose",
      "title": "Your decision",
      "kind": "approval",
      "dependencies": ["inspect"]
    }
  ]
}
```

`request` is optional for backward compatibility, with a maximum of 8,000 characters. Request-driven clients should always supply the original user request; it persists with the immutable plan and is displayed in the UI.

Step kinds: `agent`, `manual`, `approval`. Optional step `description` provides instructions. IDs contain letters, numbers, `_` or `-`, max 64 characters. The authenticated agent becomes the coordinator.

## Commands

```json
{
  "commandId": "unique-operation-id",
  "type": "complete",
  "stepId": "inspect",
  "message": "Inspected README and ran npm test: 13 passing tests.",
  "expectedRevision": 2
}
```

`expectedRevision` is mandatory for every human command and optional for agent commands. An outdated revision returns 409. Agent operations still enforce the current step status, dependencies and coordinator identity.

| Command                 | Actor                | Required state/result                              |
| ----------------------- | -------------------- | -------------------------------------------------- |
| start                   | Agent                | Agent step ready, run active                       |
| log                     | Agent                | Agent step running, nonempty message               |
| complete / fail         | Agent                | Agent step running, nonempty evidence/error        |
| submit                  | Human                | Manual step waiting, nonempty response             |
| approve / reject        | Human                | Approval step waiting; rejection needs explanation |
| retry                   | Human or coordinator | Failed agent step; prior history retained          |
| pause / resume / cancel | Human                | Run-level command, no step ID                      |

A step waits until **all** dependencies complete. Agent steps then become `ready`; human steps become `waiting`. After all steps complete, the run is `completed`. Rejection and cancellation close the run. They do not undo external effects.

Pausing prevents new starts and human step decisions. In-flight work may still log, fail or complete. A crash can leave a step running; the coordinator must reconcile actual external effects before reporting failure/completion. Never blindly retry a potentially completed external action.

## Idempotency and persistence

The server stores a receipt and updated snapshot in one SQLite transaction. Repeating the same command ID with identical parsed content and actor returns its original response. Reusing an ID for different content/actor returns 409. A failed command does not consume its key. A replayed response may be older than the latest state; use GET to refresh.

The command ID provides request deduplication, not exactly-once external execution. Steps include attempt counts; events retain prior results. Run `revision` increases for each accepted mutation.

## Errors

Errors have `{error, message}`. Common statuses: 400 invalid input, 401 missing credentials, 403 role/host/origin denied, 404 missing run/step, 409 invalid state or revision/idempotency conflict, 413 oversized body, 415 wrong content type. Internal stack traces are not returned to clients.

## Current limits

Snapshots include the full event history and are retained locally without automated expiration. The UI polls once per second; this implementation targets small local workflows. Large-scale event storage, pagination, remote identity management, cancellation signalling to executors, streaming updates, plan edits and distributed orchestration need later protocol versions and tests.
