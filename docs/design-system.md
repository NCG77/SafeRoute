# SafeRoute 2.0 Design System

Production design language for the React Native app and the matching Figma library.

**Brand personality:** trustworthy · calm · premium · minimal · accessible · safety-first · Material 3  
**Not:** pink “women-only” styling. Use deep indigo, emerald, white, charcoal, and a warm accent sparingly.

---

## Figma file structure

Create one library file: `SafeRoute 2.0 — Design System`

| Page | Contents |
| --- | --- |
| `01 Foundations` | Color styles, text styles, effect styles, spacing / radius grid |
| `02 Components` | All components below as variants with Auto Layout |
| `03 Patterns` | Map chrome, route picker strip, SOS hold state, sheet + scrim |
| `04 Screens` | Home, Navigate, Safe Walk, SOS, Contacts, Settings |

**Frame size:** iPhone 14/15 — `393 × 852`.  
**Layout grid:** 8pt base, 16pt page margin, 24px corner radius on cards/sheets.

---

## Color styles (Figma → Local styles)

| Style name | Hex | Role |
| --- | --- | --- |
| `Primary / Default` | `#4F46E5` | Brand, primary CTA, active nav |
| `Primary / Pressed` | `#4338CA` | Pressed primary |
| `Primary / Container` | `#EEF2FF` | Soft brand surfaces |
| `Secondary` | `#2563EB` | Royal blue accents |
| `Success / Emerald` | `#10B981` | Safe / positive |
| `Warning` | `#F59E0B` | Caution |
| `Danger` | `#EF4444` | SOS, critical |
| `Background` | `#FAFBFD` | Warm off-white canvas |
| `Surface` | `#FFFFFF` | Cards, sheets |
| `Text / Primary` | `#0F172A` | Headlines, body |
| `Text / Secondary` | `#64748B` | Meta, captions |
| `Divider` | `#E2E8F0` | Hairlines |

Heat-map route color is **not** a static style — use continuous score → hue (see `core/heatmap.ts`).

---

## Typography (Inter)

| Style | Size / Line / Weight | Use |
| --- | --- | --- |
| `Hero` | 40 / 48 / Bold | Editorial greetings |
| `Display` | 32 / 40 / Bold | Screen titles |
| `Headline` | 26 / 34 / SemiBold | Section titles |
| `Title` | 22 / 28 / SemiBold | Card titles |
| `Body` | 16 / 24 / Regular | Primary body |
| `Caption` | 13 / 18 / Medium | Chips, meta |

---

## Effects

| Style | Spec |
| --- | --- |
| `Elevation / Card` | Y 4 · Blur 16 · `#111827` @ 8% |
| `Elevation / FAB` | Y 8 · Blur 20 · `#111827` @ 16% |
| `Elevation / Sheet` | Y −4 · Blur 24 · `#111827` @ 10% |

Glass: only on map overlays / bottom nav — fill `#FFFFFF` @ 78% + background blur 20.

---

## Spacing & radius

- **Spacing tokens:** 0, 2, 4, 8, 16, 24, 32, 40, 48  
- **Corner radius:** cards / sheets / search = **24**; chips / buttons = **pill (999)**; FAB / SOS / avatar = **full**  
- **Touch targets:** min **48**; SOS **72**; FAB **56**

---

## Components (variants + Auto Layout)

Recreate each as a Figma component. Props map 1:1 to RN props in `components/design-system/`.

### Primary Button
- Variants: `Default` | `Pressed` | `Disabled` | `Loading`
- Auto Layout: horizontal, padding `12–16` vertical / `24` horizontal, hug height, fill width optional
- Fill Primary, text On-Primary, pill radius, Card elevation

### Secondary Button
- Variants: `Default` | `Pressed` | `Disabled`
- Surface fill, 1.5 border Border, text Primary text, pill

### SOS Button
- Variants: `Idle` | `Holding`
- 72 circle, Danger fill, optional outer ring Danger Container
- Label `SOS` Bold 18

### Search Bar
- Variants: `Empty` | `Filled` | `Focused`
- Height 52, radius 24, leading Material Symbol `search`, optional trailing `close`
- Surface + Card elevation

### Route Card
- Variants: `Safest` | `Balanced` | `Fastest` × `Selected` | `Unselected`
- Fixed width ~168, radius 24, top 4px heat accent bar
- Shows ETA, kind label, km, SafetyScoreChip, optional Crowd · Light

### User Avatar
- Variants: `Image` | `Initials` · sizes 32 / 40 / 56
- Full circle, Primary Container fallback

### Bottom Navigation
- Variants: tab `Active` | `Inactive`; center SOS elevated
- Glass surface, top radius 24, Material Symbols rounded
- Tabs: Home, Navigate, SOS, Contacts, Settings (or project-specific set)

### Safety Score Chip
- Variants: `Compact` | `Labeled`
- Pill; fill = heat color for score; white score text

### Notification Card
- Variants: tone `Info` | `Success` | `Warning` | `Danger` × `Read` | `Unread`
- Radius 24, icon tile + title + body + optional time / dismiss

### Heat Map Legend
- Title + continuous segmented track (0→100) + Low / High captions
- Glass optional when over map

### Floating Action Button
- Variants: `Primary` | `Surface` · icon instance swap
- 56 circle, FAB elevation

### Modal Bottom Sheet
- Variants: `Collapsed` | `Half` | `Expanded` (height 35% / 45% / 70%)
- Handle 40×4, title, content slot; scrim `#111827` @ 32%

---

## Code mapping

| Concern | Path |
| --- | --- |
| Tokens | `constants/theme.ts` |
| Paper MD3 theme | `constants/paperTheme.ts` |
| Legacy map colors | `constants/GlobalStyles.js` |
| Components | `components/design-system/*` |
| Heat colors | `core/heatmap.ts` |

```ts
import { theme } from "@/constants/theme";
import { PrimaryButton, RouteCard, SOSButton } from "@/components/design-system";
```

Do not hard-code hex in screens. Extend tokens first, then components.

---

## Accessibility checklist

- Contrast ≥ 4.5:1 for body text on Background / Surface  
- All interactive targets ≥ 48×48  
- SOS uses long-press + cancel affordance (no instant dial on tap alone)  
- Labels on icon-only controls (FAB, clear search, dismiss)  
- Prefer Material Symbols Rounded for consistency with Android / M3

---

## Screen principles

1. **Maps are edge-to-edge** — chrome floats on top (search, legend, route cards, FAB).  
2. **One primary action** per viewport; SOS is always reachable but never decorative pink.  
3. **Large whitespace** — prefer 24–32 gaps between major blocks.  
4. **Glass only** where map readability requires it.  
5. Every new screen must compose from this library — no one-off visual systems.
