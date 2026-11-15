---
name: Clinical Clarity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3e4947'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#005c54'
  on-tertiary: '#ffffff'
  tertiary-container: '#00776d'
  on-tertiary-container: '#91fdef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-regular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-regular:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-medium:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style
The design system establishes a high-trust, clinical-grade interface built for virtual care workflows, clinical telemetry, and telemedicine scheduling. The visual tone balances clinical authority with human-centered approachability, avoiding the sterile impersonality of legacy EHR software while maintaining rigorous clarity for high-stakes healthcare scenarios.

The aesthetic follows a modern corporate healthcare ethos: surgical contrast, clean white containment planes, disciplined structural whitespace, and precise typographic hierarchy. Visual noise is minimized to reduce cognitive load during consultations, clinical chart reviews, and triage workflows.

## Colors
The color hierarchy is anchored by deep clinical teal (`#0F766E`), projecting stability, hygiene, and medical expertise. High-contrast typography relies on slate navy (`#0F172A`), providing exceptional WCAG AAA legibility against white and soft off-white canvas backdrops.

### Surface and Canvas Distribution
- **Canvas Base (`#F8FAFC`):** Soft slate canvas providing contrast against pure white cards without glare.
- **Card / Surface (`#FFFFFF`):** Reserved for primary interactive containers, consultation viewports, and clinical charts.
- **Subtle Surface Muted (`#F1F5F9`):** Utilized for structural sidebars, table headers, and neutral metric badges.
- **Borders (`#E2E8F0` & `#CBD5E1`):** Subdued structural boundaries ensuring visual compartmentalization across complex multi-panel clinical views.

### Semantic Status Palette
- **Success (`#059669` / Surface: `#ECFDF5`):** Confirmed appointments, normal vitals, connected devices.
- **Warning (`#D97706` / Surface: `#FFFBEB`):** Pending reviews, borderline clinical flags, lab test delays.
- **Danger (`#DC2626` / Surface: `#FEF2F2`):** Critical alerts, appointment cancellations, disconnected telemetry.
- **Info (`#0284C7` / Surface: `#F0F9FF`):** Informational callouts, active telemedicine room status, incoming consult requests.

## Typography
Typographic clarity is strictly engineered for high-density medical records, schedule density, and high-readability consultation notes. `Inter` governs all roles, prioritizing tabular numerals, unambiguous glyph distinctions, and predictable horizontal optical tracking across varied clinical viewports.

- Use **display** exclusively for primary platform overviews and dashboard landing states.
- Use **headline-1** and **headline-2** for module titles, modal headers, and patient chart names.
- Use **headline-3** for card titles, section headings, and clinical sub-records.
- Use **body-regular** for long-form consultation summaries, patient medical notes, and standard text blocks.
- Use **body-medium** for active table entries, user form input values, and interactive navigation labels.
- Use **label-regular** and **label-medium** for metadata, timestamp indications, form hints, and badge labels.
- Use **caption-caps** exclusively for micro-status indicators, table column headers, and clinical category separators.

## Layout & Spacing
The layout model employs a fluid 12-column grid anchored by a collapsible lateral navigation rail. Standard desktop interfaces reserve 256px for full-size sidebars, collapsing to an 72px icon-only rail in dense chart-review layouts or viewports below 1280px.

### Responsive Behaviors
- **Desktop (>= 1280px):** 12-column fluid grid, `margin: 2rem`, `gutter: 1.5rem`. Multi-pane split views accommodate simultaneous video consults, patient telemetry feeds, and electronic prescription panels.
- **Tablet (768px - 1279px):** 8-column layout, `margin: 1.5rem`, `gutter: 1rem`. Secondary analytical cards stack beneath active patient records. The sidebar defaults to the compact collapsed rail or an off-canvas drawer.
- **Mobile (< 768px):** 4-column layout, `margin: 1rem`, `gutter: 1rem`. Horizontal scroll patterns govern date-time pickers, metric carousels, and patient timeline selectors to prevent excessive vertical elongation.

## Elevation & Depth
Elevation relies on crisp low-contrast surface borders combined with multi-stop, slate-tinted ambient drop shadows. Heavy drop shadows and stark pure-black scrims are avoided to preserve a crisp medical environment.

- **Flat / Surface Level (Cards, Data Sections):** 0px offset, structured with a solid `1px` border of `#E2E8F0`.
- **Level 1 (Hover states, Clinical Cards, Schedule Rows):** `0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)`, bordered by `#E2E8F0`.
- **Level 2 (Popovers, Filter Menus, Contextual Action Sheets):** `0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`, bordered by `#CBD5E1`.
- **Level 3 (Modals, Active Video Consultation Overlays):** `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`, flanked by an ambient background scrim of `rgba(15, 23, 42, 0.4)`.

## Shapes
Geometry is disciplined, precise, and measured. The design system intentionally avoids aggressive circular pill shapes for structural components and action controls, reinforcing a formal, clinical standard.

- **Badges, Tags & Tooltips:** 6px radius.
- **Controls, Input Fields & Standard Buttons:** 8px to 10px radius (using base token `roundedness: 1` scaled up to `rounded-md`/`rounded-lg`).
- **Cards, Panels & Modal Enclosures:** 12px to 16px radius, creating soft external framing without sacrificing internal usable area.
- **Avatars & Camera Viewports:** Circular for personal identity portraits (`rounded-full`); 8px radius for incoming live consultation camera feeds.

## Components

### Buttons & Interactive Controls
- **Primary Button:** Background `#0F766E`, text `#FFFFFF`, border none, 8px border radius. Hover: `#115E59`. Active: `#0D9488`. Focused: 2px ring `#0F766E` offset by 2px `#FFFFFF`.
- **Secondary Button:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #CBD5E1`. Hover: `#F1F5F9`.
- **Destructive Action:** Background `#DC2626`, text `#FFFFFF`. Hover: `#B91C1C`.
- **Ghost/Tertiary:** Background transparent, text `#0F766E`, hover background `#F0FDFA`.

### Status Badges & Chips
- Badges use subtle tinted surfaces paired with high-contrast text and a 6px corner radius:
  - **Confirmed:** Background `#ECFDF5`, text `#059669`, border `1px solid #A7F3D0`.
  - **In Progress:** Background `#F0FDFA`, text `#0F766E`, border `1px solid #99F6E4`.
  - **Pending:** Background `#FFFBEB`, text `#D97706`, border `1px solid #FDE68A`.
  - **Cancelled:** Background `#FEF2F2`, text `#DC2626`, border `1px solid #FECACA`.
  - **Completed:** Background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.

### Form Fields & Scheduling Pickers
- **Text Inputs & Dropdowns:** Pure white background, `1px solid #CBD5E1` border, 8px radius, text `body-regular`. Focus state transitions to `1px solid #0F766E` with an outer soft teal glow (`0 0 0 3px rgba(15, 118, 110, 0.15)`).
- **Date & Slot Pickers:** Calendar grids use 8px rounded cells; selected slots display `#0F766E` with white text, while booked/unavailable slots display `#F1F5F9` with `#94A3B8` text and strike-through indicators.

### Clinical Data Tables
- Header uses `#F8FAFC` background with `caption-caps` typography in `#64748B`, height 44px, bottom border `1px solid #E2E8F0`.
- Rows use `#FFFFFF` background, min-height 60px, bottom border `1px solid #F1F5F9`, transitioning to hover state `#F8FAFC`.
- Integrated layout includes patient identifier (avatar + full name + ID), contextual badge, primary clinical parameter, doctor in charge, and aligned triple-dot action trigger.

### Navigation Architecture
- **Sidebar Rail:** Multi-level navigation displaying active role badge (e.g., Doctor, Triage Nurse, System Admin). Active tab displays background `#F0FDFA`, icon and text `#0F766E`, and a left indicator bar (`3px solid #0F766E`).
- **Global Header Bar:** 64px height, `#FFFFFF` surface with `1px solid #E2E8F0` bottom edge. Houses global patient search with quick-key trigger, urgent notification bell with count badge, real-time doctor availability status toggle, and user account switcher.