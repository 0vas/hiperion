# Illustrated guides and solar monogram

Status: accepted.

## Criteria

- Downloads identify macOS and Windows with local SVG symbols, retain readable names and preserve verified installer links and preview limitations.
- Canvas, continuation and architecture guides explain a single concept at a time through selectable annotations, in Spanish and English.
- Keyboard activation works, selection has an explicit state, and content stays accessible at 390 px in both themes.
- The same original solar H monogram appears in the navigation, favicon, product illustration and README. Existing installer binaries remain unchanged.

## Design

The H, open halo and central light point connect Hyperion's solar identity to the product's human decisions and connected steps. The compact geometry replaces the generic horizon mark without copying the supplied reference artwork.

GuideLens uses a static illustration and three buttons to reveal one short explanation. The canvas view reuses ProductCanvas so readers see the product's real visual language. Architecture starts with responsibilities before the detailed Archify explorer. Other guides link directly to that explorer. These illustrations explain concepts; they are not live agent activity or a replacement for the formal ArchiMate model.

Resume annotations explicitly distinguish durable infrastructure from the still-pending native connectors. Downloads keep the 0.4.0 preview disclosure. No new execution capability is claimed.

## Validation

A Playwright regression first fails on missing platform symbols, then verifies platform SVGs, bilingual annotations, keyboard selection, mobile overflow and light/dark accessibility. Run the complete docs suite and `npm run check`, followed by visual inspection of downloads, guides and the monogram at small sizes.
