# D3.js 24-Hour Battery Discharge Trend Analysis Chart

A high-fidelity, touch-responsive D3.js data visualization component integrated directly into the BatteryFlow Home dashboard, mapping continuous 24-hour discharge velocity, peak draw events, and power consumption thresholds.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Because interactive clarification options were left at default settings, the visualization implements our recommended mobile-first architectural pattern:

- **Confirmed Visualization Style**: Continuous smooth bezier curve (`d3.curveMonotoneX`) with multi-stop vertical linear gradient fill reflecting active accent theme (Mint / Cyan / Amber / Sky) and baseline zero fill.
- **Confirmed Touch Interaction**: Precision touch scrubber crosshair with haptic pulse triggers, showing drain velocity in %/hour, instantaneous wattage, and local timestamp formatted according to the user's 12h/24h setting.
- **Confirmed Threshold & Baseline Markers**: Subtle color-coded threshold zones (normal drain < 5%/h, elevated 5–10%/h, severe > 10%/h) alongside an annotated horizontal dashed reference line for the 24-hour rolling average drain rate.

---

## 1. Overview & Core Concept

### What It Does
Replaces the existing generic charting implementation with a purpose-built, responsive D3.js vector canvas on the Home dashboard. It tracks rolling 24-hour observation telemetry, calculates real instantaneous discharge velocity (`Δlevel / Δtime`), identifies peak drain spikes (such as gaming, GPS, or camera usage), and plots a fluid rate curve with dynamic gradient shading and contextual tooltips.

### Target Audience & Persona
Mobile users and power users who need clear, immediate insight into how fast their device battery is discharging throughout the day, enabling them to pinpoint battery-draining apps and observe battery health trends without navigating away from the main dashboard.

### Key Value
- **Tactile Responsiveness**: Direct finger scrubbing across the 24-hour timeline with zero lag or jank.
- **Visual Clarity**: Instant visual distinction between light standby idle drain and intensive battery drain bursts.
- **Unified Mobile Ergonomics**: Matches BatteryFlow's dark Aurora neon aesthetic with exact touch targets and responsive SVG viewBox geometry.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **At a Glance**: When opening the app, the Home dashboard displays the 24-hour discharge trend card positioned beneath the live telemetry metrics. Users immediately see the current discharge curve, average drain benchmark, and highest drain spike.
2. **Interactive Scrubbing**: Tapping or dragging anywhere across the chart activates an interactive cursor line with a floating HUD pill detailing the exact time, discharge rate (%/hr), battery charge level at that moment, and estimated active draw.
3. **Metric Mode Toggle**: Users can toggle between **Discharge Rate (%/h)** and **Charge Level (%)** views to cross-reference velocity against absolute battery drop.
4. **Threshold Alert Banners**: If recent discharge rates cross critical thresholds (> 10%/h sustained), an inline warning chip highlights abnormal drain.

### Visual Identity & Theme
- **Canvas & Surface**: Dark translucent container (`bg-zinc-900/90` with `border-white/10`) featuring soft radial background glow matched to the active accent color.
- **Palette & Accents**: 
  - *Accent Line*: Theme-dependent accent (`#10b981` Mint, `#00d2ff` Cyan, `#f59e0b` Amber, `#0ea5e9` Sky) with stroke width of 2.25px and stroke shadow.
  - *Area Fill*: Vertical gradient fading from 25% accent opacity at the peak down to 0% at the baseline.
  - *Warning Zone*: Subtle amber/rose band at > 10%/h discharge rate.
  - *Average Line*: Thin dashed line (`stroke-zinc-500` / `stroke-dasharray 4 3`) with a quiet tabular label.
- **Typography & Formatting**: Clean unboxed figures using tabular monospace numerals (`font-mono tabular-nums`), avoiding clunky pill badges for timestamps and rates.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: D3.js React Ref Integration vs Recharts
- **Chosen Approach**: Direct SVG DOM rendering managed via `useRef` and D3 scales (`d3-scale`, `d3-shape`, `d3-axis`, `d3-array`, `d3-selection`).
- **Why**: Recharts relies on wrapper divs and virtual DOM overhead that causes touch tracking latency on mobile devices. Native D3 calculation with direct SVG attribute mutation delivers fluid 60fps gesture scrubbing and bespoke path gradient shading.
- **Trade-Off**: Requires lifecycle management in `useEffect` and ResizeObserver handling, but guarantees zero-bloat mobile performance.

### Decision 2: Telemetry Sampling & Interpolation
- **Chosen Approach**: 24-hour observation filter with monotone cubic spline interpolation (`d3.curveMonotoneX`).
- **Why**: Monotone splines prevent the visual overshoot and negative rate dips common with standard cardinal splines, ensuring battery discharge rates never show negative values or unnatural spikes between discrete observation points.

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌────────────────────────────────────────────────────────┐
│                      HomeView                          │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │     BatteryRing3D     │   │  MetricCards (Grid)  │  │
│  └───────────────────────┘   └──────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │            D3DischargeTrendChart                 │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ KPI Strip: [Avg Drain] [Peak] [Active]     │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ SVG Viewport (Responsive via ViewBox)      │  │  │
│  │  │  ├── Background Threshold Shading Grid     │  │  │
│  │  │  ├── D3 Monotone Spline Path + Area Fill   │  │  │
│  │  │  ├── Dashed 24h Average Reference Line     │  │  │
│  │  │  ├── D3 Time X-Axis & Rate Y-Axis Labels   │  │  │
│  │  │  └── Touch Event Overlay & Scrubber Reticle│  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Floating Scrubber Tooltip / HUD Panel      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Data Pipeline & State Management
1. **Data Ingestion**: Takes rolling `ObservationPoint[]` from application state (persisted in IndexedDB / local storage).
2. **Velocity Calculation**: For each timestamp interval $t_i - t_{i-1}$, compute hourly rate:
   $$\text{Rate} = \frac{\text{Level}_{i-1} - \text{Level}_i}{\Delta \text{Hours}}$$
   Bounded between $0$ and $35\%/\text{h}$ with fallback estimation from live milliamp draw if charging state is active or idle.
3. **D3 Rendering**:
   - `d3.scaleTime()` maps timestamps over the last 24 hours to the horizontal canvas width.
   - `d3.scaleLinear()` maps discharge rates ($0$ to $\max(\text{peak}, 12)\%/\text{h}$) to vertical canvas height with baseline at the bottom.
   - `d3.bisector()` provides instant $O(\log n)$ scrubber pointer tracking on touch move.
