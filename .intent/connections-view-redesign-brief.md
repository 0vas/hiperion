# Connections dedicated view — Designer brief

**Status:** SUPERSEDES `.intent/connections-inventory-brief.md` for **placement and primary UI**.
Honesty states, detection bounds, client roster, and Replace confirm from #31 remain in force unless this brief tightens them.

NO CODE. Developer implements after acceptance.
Out of scope: binary updater / update-and-restart; inventing “tools loaded in chat.”

---

## Placement decision (Oscar feedback)

| Was (AMBOS — retire as primary) | Now |
|---|---|
| Header **Integraciones** chip as inventory home | **Remove** as primary chrome. At most a quiet entry that **opens the Connections view** (icon or text link — not N/M conflict telemetry in the topbar). |
| Dense **Ajustes → Conexiones** fieldset / modal list | **Retire as primary.** Optional: one line in Settings — «Abrir conexiones» → dedicated view. |
| CalVer buried under a long list | **Always visible** in the Connections view identity band (header or sticky footer). Keep macOS About. |

**Primary experience:** a dedicated **Connections** view (full canvas-adjacent screen / route / panel that owns the viewport — not a cramped settings fieldset).

---

## IA wire

```
Topbar (calm)
  […] [Ajustes] [Guía]  ● Conectado|Sin conexión   [?]
       optional: [Conexiones] text/icon → opens view
       NO “0 ready · 1 conflicts” chip

Empty canvas / menu
  «Conectar mi agente» / Hyperion → Conectar con mi IA
       → opens Connections view (or setup, then land on view)

┌─ Connections view (dedicated) ─────────────────────────────┐
│ HEADER IDENTITY (always visible, no scroll required)       │
│   Conexiones                                               │
│   Hyperion 2026.10.17.xxxx UTC · preview                   │
│   [Volver al canvas]              [Volver a comprobar]     │
│                                                            │
│ SERVICE STRIP (secondary, one calm row)                    │
│   Servicio local · Conectado · 127.0.0.1:port              │
│   short honesty: servicio ≠ IA cargada                     │
│                                                            │
│ HERO / SUMMARY                                             │
│   eyebrow + one line (“Tus aplicaciones de IA”)            │
│   status sentence (empty / partial / conflict attention)   │
│   primary CTA: Conectar con mi IA…                         │
│                                                            │
│ CLIENT STAGE (stylized cards / gallery — not a dense table)│
│   [Codex] [Cursor] [Claude Desktop] [Claude Code]          │
│   [Antigravity]                                             │
│   each: mark · status · short path · 1–2 actions           │
│                                                            │
│ FOOTER (optional sticky twin of CalVer if header scrolls)  │
│   Hyperion {calver} UTC · {channel} · MIT                  │
└────────────────────────────────────────────────────────────┘

Conflict → dialog (existing honesty)
Replace… → confirm alertdialog (#31) → backup + overwrite
```

### Entry points

1. Topbar quiet **Conexiones** (preferred) or help menu item — opens view.
2. Empty state **Conectar mi agente** → view (setup chooser can be a step inside the view).
3. Desktop menu **Conectar con mi IA** → after setup, show/refresh Connections view.
4. Settings: remove inventory list; keep link **Abrir conexiones**.

---

## Visual direction (stylized + clear)

- Cinema / solar–sepia tokens already on site/home; canvas modal can borrow soft surface, generous padding, clear hierarchy — **not** a second Settings form.
- **Cards** for the five clients (exception to “no cards” rule: each card is the interaction unit — status + actions). Large type for client name; badge; path as mono caption.
- Conflict cards: amber outline / soft warning wash — not alarm red.
- Configured: calm brand-soft check affordance.
- Missing: muted, single clear **Configurar…**
- Light + dark: use existing canvas theme variables; version string must remain readable (text-2, not decorative gradient-only).
- Desktop: 2-column card grid (3+2) or horizontal wrap with min card width ~220px.
- Narrow: single column; identity band sticky at top so CalVer never disappears; actions stack full-width.
- Reduced motion: no looping status animations; badge changes are instant.

---

## CalVer placement (must see without hunting)

| Surface | Rule |
|---|---|
| Connections view header | **Required:** `Hyperion {version} UTC · {channel}` under title, always in first viewport. |
| Connections view footer | Optional sticky repeat on long scroll. |
| About (macOS / existing) | Keep. |
| Topbar | Do **not** put full CalVer in the topbar (clutter). |
| Settings | No longer the place people look for version via scrolling a list. |

`aria` / `title`: «Versión de Hyperion».

---

## Honesty (unchanged bounds)

| Badge ES | EN | Meaning |
|---|---|---|
| Configurada | Configured | Matching Hyperion entry in client file |
| Sin configurar | Not configured | No entry |
| Conflicto · no sobrescrita | Conflict · not overwritten | Different entry; we did not overwrite |
| No se pudo comprobar | Couldn’t verify | Detection error |

Local service pill/strip ≠ AI integration health. Never claim tools loaded in an open chat.

Alternate ports (`127.0.0.1:52629`): show URL honestly in the **service strip**, in smaller type, with tooltip that this is the local service endpoint — not “which AI is connected.”

---

## Conflict + Replace (#31 — keep)

1. **Ver conflicto…** → dialog: no-overwrite explanation + file path + Copiar ruta · Abrir guía · **Reemplazar…** · Cerrar.
2. **Reemplazar…** → `alertdialog` confirm: backup will be created; overwrite `hyperion` entry; cannot undo from Hyperion → Cancelar | **Reemplazar conexión** (danger).
3. Never silent overwrite. Never one-click replace from the card.

Reuse existing strings from #31 where possible (see table).

---

## Empty / partial / attention states (view summary line)

| State | ES | EN |
|---|---|---|
| empty | Ninguna aplicación tiene Hyperion configurado todavía. | No app has Hyperion configured yet. |
| partial | {0} de {1} aplicaciones listas. Reinicia el cliente y abre un chat nuevo para cargar herramientas. | {0} of {1} apps ready. Restart the client and open a new chat so tools can load. |
| all ok | Las {0} integraciones conocidas están configuradas. | All {0} known integrations are configured. |
| conflicts | {0} en conflicto — Hyperion no sobrescribió esas entradas. | {0} in conflict — Hyperion did not overwrite those entries. |
| mixed | {0} listas · {1} en conflicto | {0} ready · {1} in conflict |

---

## ES ↔ EN string table (view chrome + changes)

### View chrome

| ES | EN |
|---|---|
| Conexiones | Connections |
| Tus aplicaciones de IA | Your AI apps |
| Hyperion prepara la entrada local en cada aplicación. «Configurada» no significa que un chat abierto ya haya cargado las herramientas. | Hyperion prepares the local entry in each app. “Configured” does not mean an open chat has already loaded the tools. |
| Volver al canvas | Back to canvas |
| Volver a comprobar | Recheck |
| Abrir conexiones | Open connections |
| Conectar con mi IA… | Connect my AI… |
| Servicio local | Local service |
| El servicio local responde en este equipo. No indica qué aplicación de IA está en uso. | The local service is responding on this computer. It does not say which AI app is in use. |
| Versión de Hyperion | Hyperion version |
| *(display)* Hyperion {0} UTC · {1} | Hyperion {0} UTC · {1} |

### Topbar (slim)

| ES | EN |
|---|---|
| Conectado | Connected |
| Sin conexión | Offline |
| Conectando | Connecting |
| Conexiones | Connections |
| El servicio local de Hyperion responde en este equipo. | The local Hyperion service is responding on this computer. |

Remove / stop using as primary chrome (may delete from UI): Integraciones chip labels like `{0} listas · {1} conflictos`, `Ninguna configurada` in the **header**. Those phrases may remain for the **view summary** if useful.

### Settings remnant

| ES | EN |
|---|---|
| Conexiones e integraciones | Connections and integrations |
| Gestiona el servicio local y tus aplicaciones de IA en la vista Conexiones. | Manage the local service and your AI apps in the Connections view. |
| Abrir conexiones | Open connections |

### Card actions (reuse)

| ES | EN |
|---|---|
| Configurada | Configured |
| Sin configurar | Not configured |
| Conflicto · no sobrescrita | Conflict · not overwritten |
| No se pudo comprobar | Couldn’t verify |
| Configurar… | Set up… |
| Copiar ruta | Copy path |
| Ruta copiada | Path copied |
| Ver conflicto… | View conflict… |
| Abrir guía | Open guide |
| Reemplazar… | Replace… |
| ¿Reemplazar la conexión Hyperion? | Replace the Hyperion connection? |
| Se sobrescribirá la entrada «hyperion» en {0}. Se crea un respaldo del archivo. Esta acción no se puede deshacer desde Hyperion. | The «hyperion» entry in {0} will be overwritten. A backup of the file is created. This cannot be undone from Hyperion. |
| Reemplazar conexión | Replace connection |
| Cancelar | Cancel |
| Cerrar | Close |
| Ya existe otra conexión Hyperion en {0}. No se sobrescribió. | Another Hyperion connection already exists in {0}. It was not overwritten. |
| Archivo: {0} | File: {0} |

### Empty canvas CTA

| ES | EN |
|---|---|
| Conectar mi agente | Connect my agent |
| Ver conexiones | View connections |

Prefer **Ver conexiones** when ≥1 configured or any conflict; else **Conectar mi agente**.

---

## Accessibility

- View landmark: `aria-labelledby` on Connections title; CalVer in identity band associated with `title`/visually adjacent text «Versión de Hyperion».
- Status badges: text labels, not color alone.
- Replace confirm: keep `role="alertdialog"`.
- Recheck: polite live region on settled summary only.
- Focus: opening view moves focus to title or first card; Back returns to trigger.

---

## Do not claim

- Header “Integraciones N ready” as proof of agent health
- Service Connected = AI client linked
- Configured = tools in an open chat
- Silent overwrite
- Updater / in-place restart behavior (out of scope here)

---

## Acceptance checklist

- [ ] Dedicated Connections view is the primary inventory UI
- [ ] Header Integrations chip telemetry removed as primary home
- [ ] Settings no longer hosts the dense list (link only OK)
- [ ] CalVer visible in first viewport of Connections view
- [ ] Honesty badges + Replace confirm (#31) preserved
- [ ] Empty / partial / conflict summaries in view
- [ ] ES↔EN tables applied; light/dark + narrow layouts
- [ ] No tools-loaded-in-chat claims; no updater work in this change

---

## Explicit supersession note for Developer

When implementing this brief:

1. Treat `connections-inventory-brief.md` **AMBOS header+Settings primary** as obsolete.
2. Keep its detection honesty matrix and client roster.
3. Keep #31 Replace confirm copy and behavior.
4. Migrate `Connections.tsx` from settings fieldset to the dedicated view shell; slim the topbar.
