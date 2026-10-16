# Explain the system and preserve continuous background motion

Status: accepted.

The architecture page previously named components without explaining enough of the product's execution, data and recovery behavior. It now offers three Archify views, backed by immutable source references, alongside a concrete user journey, responsibility map, typed data handoffs, deployment boundaries and failure semantics. Spanish and English carry the same capabilities and limitations. Existing ArchiMate component and continuation models remain the formal reference; no runtime behavior changes in this increment.

The root AGENTS.md now records the product boundary, repository map, execution invariants, harness capability limits, verification workflow and a change-to-documentation matrix. Contributors must update affected contracts, examples, ES/EN guides and architecture sources in the same change. Existing historical ADRs retain their context.

The landing page's external video did not have matching first and last frames. Native loop exposed that discontinuity. Two muted layers now overlap the final two seconds (or a third of a shorter clip) using a smoothstep opacity blend driven by the incoming media clock. The opaque outgoing layer remains underneath until the incoming layer fully covers it; only hidden media is rewound. Pauses, hidden tabs and reduced motion stop playback and frame scheduling. Buffering keeps the last visible frame, rather than flashing an empty layer. This trades a second decoder during overlap for continuity without altering or downloading the external media asset. The background is decorative, never a signal of workflow progress.

Validation: failing architecture browser regression before implementation; Archify finalize validates all six localized viewers; media-controller tests cover two handoffs, pause and unready buffers; docs browser checks cover localization, accessibility, layout and playback controls; visual review inspects both themes and the real video transition. Native connector certification and ArchiMate XSD/tool import remain outside this documentation change.

The architecture accessibility check covers our selector, annotations and links. The pinned Archify viewer reports existing nested SVG control and document-landmark findings under Axe; its generated HTML is not hand-patched. The surrounding page provides a textual equivalent and direct source links. Full viewer accessibility remediation requires an upstream renderer change.
