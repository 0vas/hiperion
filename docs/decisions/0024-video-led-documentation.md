# 0024 — Follow the cinematic video reference

Status: accepted. Supersedes the home composition in 0023.

## Problem

The solar illustration and side-by-side layout in 0023 did not match the user's reference. The intended composition is a dark video-backed page, centered oversized gradient headline, restrained translucent navigation, desktop-style product menu and a wide application window beneath it. The cinematic treatment must continue through the quickstart, simulation, use cases and downloads.

## Implementation

Use the exact CloudFront video URL supplied in the user's Aura reference as an external background media resource. The video is muted, looping and inline. Hyperion's branding, copy, real installer links and local simulation remain its own. The reference's unrelated email product, pricing, metrics and testimonials are not included. Keep VitePress/Vue, bilingual content and the existing tested canvas rather than introducing a second application framework.

The background has a pause/resume button and stops when the browser tab is hidden. With reduced motion enabled, the video source is not attached and the headline stops animating. An original local SVG poster remains visible if playback is unavailable or the external host fails. Autoplay rejection never blocks navigation. The external video is not bundled into the repository or represented as MIT artwork; its availability depends on the supplied host.

The large product view is explicitly an example, showing the request, plan, SVG canvas and sample activity. It does not claim that an agent is connected. Its review action opens the existing interactive simulation. Documentation articles retain their theme preference; the marketing home has a consistent dark palette.

## Validation

Updated the acceptance test before implementation: it failed against the previous left-aligned headline. Tests now cover centered composition, wide product view, video configuration, pause, reduced motion, failed media fallback, mobile/split layouts and accessible navigation. Inspect live-video screenshots as well as static fallback captures. Browser validation confirmed actual playback of the 1920×1080 video and pause/resume; viewport emulation does not imply physical-device testing.
