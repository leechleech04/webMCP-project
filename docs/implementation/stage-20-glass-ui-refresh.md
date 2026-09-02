# Stage 20: Apple × Nothing Inspired Glass UI Refresh

## 1. Design Intent
Stage 20 replaces the previous dark, heavy workshop aesthetic with a luminous, refined, high-precision glassmorphism interface inspired by the design languages of **Apple** and **Nothing**:

- **Apple Influence**:
  - Clarity, generous whitespace, balanced layout proportions.
  - Layered translucent glass panels (`backdrop-filter: blur(...) saturate(...)`) with delicate 1px border highlights.
  - Smooth ergonomic corner radiuses (24px for major panels, 18px for subpanels, 12px for interactive controls).
  - Modern, restrained system sans typography with crisp hierarchy.
  - Soft neutral shadows providing tangible depth without visual clutter.

- **Nothing Influence**:
  - High-contrast monochrome base (crisp whites, silver translucency, near-black solid controls).
  - Fine subtle dot-grid texture on the global canvas (`radial-gradient` pattern).
  - Compact monospace micro-labels, counters (e.g. `13 / 17`), and uppercase status headers.
  - Restrained accent red dots (`#FF3B30`) for live status indicators and active chassis selections.

The interface maintains full visual coherence over both light and dark 3D scene elements while delivering a responsive, performant experience across desktop, tablet, and mobile.

---

## 2. Token Palette & Semantic Variables

All visual parameters are centralized in `src/styles.css` using semantic CSS custom properties:

```css
:root {
  /* Canvas & Foundations */
  --color-canvas: #f4f5f7;
  --color-canvas-subtle: #eceef2;
  --color-canvas-elevated: #ffffff;

  /* Typography / Ink */
  --color-ink: #101114;
  --color-ink-secondary: #4b5260;
  --color-ink-muted: #727a8a;
  --color-ink-faint: #9fa6b5;
  --color-ink-inverse: #ffffff;
  --color-ink-inverse-muted: rgba(255, 255, 255, 0.80);

  /* Layered Glass Surfaces */
  --surface-glass-base: rgba(255, 255, 255, 0.58);
  --surface-glass-panel: rgba(255, 255, 255, 0.72);
  --surface-glass-strong: rgba(255, 255, 255, 0.88);
  --surface-glass-subtle: rgba(255, 255, 255, 0.42);
  --surface-glass-card: rgba(255, 255, 255, 0.65);
  --surface-glass-card-hover: rgba(255, 255, 255, 0.94);
  --surface-glass-sunken: rgba(0, 0, 0, 0.035);

  /* Monochrome Controls */
  --surface-dark: #111215;
  --surface-dark-hover: #22242a;
  --surface-dark-active: #050607;
  --surface-dark-subtle: #1c1e24;

  /* Borders */
  --border-glass: rgba(255, 255, 255, 0.85);
  --border-glass-subtle: rgba(17, 18, 21, 0.07);
  --border-glass-medium: rgba(17, 18, 21, 0.12);
  --border-glass-strong: rgba(17, 18, 21, 0.20);
  --border-dark: #111215;

  /* Accents & Status */
  --accent-red: #ff3b30;
  --accent-red-subtle: rgba(255, 59, 48, 0.10);
  --accent-red-border: rgba(255, 59, 48, 0.26);
  --accent-focus: #0066cc;
  --accent-focus-ring: rgba(0, 102, 204, 0.32);

  /* Feedback Colors */
  --color-success: #059669;
  --color-success-bg: rgba(16, 185, 129, 0.09);
  --color-success-border: rgba(16, 185, 129, 0.28);
  --color-success-text: #065f46;

  --color-warning: #d97706;
  --color-warning-bg: rgba(245, 158, 11, 0.09);
  --color-warning-border: rgba(245, 158, 11, 0.28);
  --color-warning-text: #92400e;

  --color-error: #dc2626;
  --color-error-bg: rgba(239, 68, 68, 0.08);
  --color-error-border: rgba(239, 68, 68, 0.28);
  --color-error-text: #991b1b;

  /* Elevation & Blur */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  --shadow-panel: 0 20px 48px -12px rgba(17, 24, 39, 0.08), 0 2px 6px rgba(17, 24, 39, 0.02);
  --shadow-panel-raised: 0 28px 64px -16px rgba(17, 24, 39, 0.12), 0 4px 12px rgba(17, 24, 39, 0.03);
  --shadow-dark-button: 0 4px 14px rgba(17, 18, 21, 0.18);
  --shadow-inner-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.95);
  --shadow-card-hover: 0 14px 32px -6px rgba(17, 24, 39, 0.09), 0 2px 8px rgba(17, 24, 39, 0.03);

  --blur-panel: 20px;
  --blur-subpanel: 14px;
  --blur-control: 10px;

  /* Radii */
  --radius-panel: 24px;
  --radius-subpanel: 18px;
  --radius-control: 12px;
  --radius-chip: 8px;
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans KR", sans-serif;
  --font-mono: "SF Mono", "JetBrains Mono", "Cascadia Code", "Segoe UI Mono", Menlo, Consolas, monospace;
}
```

---

## 3. Files Changed

1. `src/styles.css`
   - Complete architectural refactoring replacing ~3,000 lines of legacy stacked dark/workbench layers with a clean, single-source glassmorphism styling layer.
   - Reduced CSS bundle size from 47.91 kB to 29.47 kB (38.5% reduction).
2. `index.html`
   - Updated meta `theme-color` from `#111827` to `#f4f5f7` to seamlessly blend mobile browser chrome with the bright glass foundation.
3. `src/components/scene/PcScene.tsx`
   - Added `scene-controls-group` and `scene-selection-panel` class hooks to enable responsive glass overlay styling without touching Three.js geometry or OrbitControls logic.
4. `scripts/verify-browser.mjs`
   - Automated CDP-driven browser test runner verifying responsive viewports, user clicks, console errors, network failures, and screenshot generation.

---

## 4. Accessibility Provisions

- **Contrast Ratios**: Body text (`--color-ink` #101114 on `#f4f5f7` and `#ffffff`) satisfies WCAG AA and AAA contrast (> 12:1). Secondary text (`--color-ink-secondary` #4b5260 on white/glass) exceeds 4.8:1.
- **Focus Indicators**: Clear `:focus-visible` rings (`outline: 2px solid #0066cc; outline-offset: 2px`) on all interactive buttons, selects, and summaries.
- **Touch Target Sizes**: Interactive buttons and segmented controls maintain a practical touch target height of at least 40–44px.
- **State Differentiation**: Selection states are conveyed through background inversion, borders, and red indicator dots (`accent-red`), never by hue alone.
- **Motion & Transparency Fallbacks**:
  - `@media (prefers-reduced-motion: reduce)`: Instantly zeros animation durations and transitions.
  - `@supports not (backdrop-filter: blur(16px))`: Automatically falls back to high-opacity opaque surfaces (`rgba(255, 255, 255, 0.95)`).
  - `@media (prefers-contrast: more)`: Amplifies borders and text weights for high-contrast accessibility.

---

## 5. Responsive Decisions

- **Desktop (1440×900, 1280×720)**:
  - 3-column layout: Left setup rail (case picker, build controls, cables), Center stage (large 3D canvas), Right parts rail (category tabs, component catalog).
  - Bottom review dock spans full width housing Validation, Activity timeline, and Reviewer simulation.
- **Tablet (768px – 1150px)**:
  - Component catalog wraps below the setup rail and 3D canvas in a 4-column or 3-column tab grid, keeping the 3D workspace wide and interactive.
- **Mobile (390×844)**:
  - Single column stack: 3D Stage (top priority) → Setup Rail → Component Catalog → Review Dock.
  - 3D scene controls (Studio, Fullscreen, Reset view) transition to the bottom right of the viewport to prevent collision with the Live Build State overlay chip at top left.
  - No horizontal page overflow (`overflow-x: hidden`), stable wrapping for both English and Korean labels.

---

## 6. Before / After Screenshots

| View | Baseline (Before) | Stage 20 Refresh (After) |
| :--- | :--- | :--- |
| **Desktop 1440×900 (Empty)** | `docs/screenshots/baseline-1440.png` | `docs/screenshots/after-desktop-1440.png` |
| **Desktop 1440×900 (Auto-filled)** | N/A | `docs/screenshots/after-desktop-autofilled.png` |
| **Desktop 1440×900 (Korean SFF)** | N/A | `docs/screenshots/after-case-sff-korean.png` |
| **Desktop 1280×720** | `docs/screenshots/baseline-1280.png` | `docs/screenshots/after-desktop-1280.png` |
| **Tablet 768×1024** | `docs/screenshots/baseline-768.png` | `docs/screenshots/after-tablet-768.png` |
| **Mobile 390×844** | `docs/screenshots/baseline-390.png` | `docs/screenshots/after-mobile-390.png` |

---

## 7. Known Limitations

- In legacy browsers that do not support CSS `backdrop-filter`, surfaces fall back to solid/opaque white cards via `@supports not (backdrop-filter: blur(16px))`.
- The Three.js canvas WebGL context renders independently inside the container, utilizing STUDIO mode ambient/directional light for optimal model visibility.
