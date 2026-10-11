# 0025 — Solar themes and visible project access

Status: accepted. Corrects the forced dark home in 0024.

## Behavior

The home follows VitePress's appearance setting, including persistence after refresh and navigation. Light uses ivory surfaces and deep gold; dark uses charcoal, ivory text and solar gold. Canvas states retain green, amber and red. Shared theme variables style the headline, navigation, product view, cards and buttons. The cinematic composition and video remain.

The video is desaturated and tinted warm to fit Hyperion's identity. In dark mode it receives reduced brightness/opacity and a stronger charcoal overlay; in light mode the luminance is inverted into warm ink on ivory, with a localized soft overlay behind the headline and description. The light treatment preserves visible folds and movement instead of washing the entire video out. Decorative side guide lines are removed so the background remains full-bleed. The media's visibility remains subordinate to content. Reduced motion and failed-media fallback from 0024 are retained.

UI arrows use the shared SVG component. Tool marks are local SVG assets from Lobe Icons, with provenance and MIT license retained. These identify tools and do not imply endorsement or equal integration capabilities.

Shields.io supplies linked badges for the GitHub repository, MIT license and actual documentation workflow status. No static passing-build claim is made. Home, contribution pages and README expose the project. Both contribution pages begin with a repository card, a prominent GitHub link, issue link and contribution rules.

## Validation

New tests first reproduced the ineffective theme switch and absent badges. Tests check actual computed color changes, switching back, persistence, SVG actions, badge URLs and visible repository links in both languages. Accessibility checks cover light/dark home and contribution pages. Inspect desktop and mobile captures with both real video and the static fallback. External badges and video remain optional remote assets; navigation never depends on their availability.
