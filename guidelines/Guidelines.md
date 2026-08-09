# POS Inventory Admin Dashboard Design Guidelines

## Aesthetic Stance: Data-Dense

Inspired by Bloomberg Terminal and FlightRadar24, this dashboard prioritizes maximum information density, functional clarity, and precise data visualization. The interface is built for speed-reading metrics, scanning tables, and tracking trends at a glance.

## Typography

### Primary: DM Sans
- **Display/Headings**: DM Sans Medium (500) — clear, neutral, readable at all sizes
- **Body/UI**: DM Sans Regular (400) — efficient information display
- **Usage**: All UI labels, section headers, navigation

### Data: JetBrains Mono
- **Numbers/Metrics**: JetBrains Mono Medium (500) — tabular alignment, precise spacing
- **Usage**: Financial figures, quantities, dates, status codes, table data

### Hierarchy
- Section headers: 18px DM Sans Medium
- Subsection headers: 14px DM Sans Medium
- Body text: 13px DM Sans Regular
- Data labels: 11px DM Sans Regular, uppercase tracking
- Metric values: 24-32px JetBrains Mono Medium
- Table data: 13px JetBrains Mono Regular

## Color System

### Functional Palette
- **Background**: True white (#ffffff) — maximum contrast for all-day viewing
- **Foreground**: Near-black (#0a0a0a) — sharp, legible
- **Borders**: Low-opacity gray (rgba(0,0,0,0.08)) — subtle structure
- **Interactive**: Deep blue (#0066cc) — primary actions, links
- **Success/Profit**: Forest green (#059669) — positive metrics
- **Warning**: Amber (#f59e0b) — low stock alerts
- **Danger/Loss**: Crimson (#dc2626) — negative metrics, critical alerts

### Chart Colors
Calibrated for data density and distinction:
1. Blue: #3b82f6
2. Teal: #14b8a6
3. Purple: #8b5cf6
4. Orange: #f97316
5. Pink: #ec4899

## Layout Principles

### Grid & Spacing
- Base unit: 4px
- Content padding: 16px (4 units)
- Card gaps: 12px (3 units)
- Section spacing: 24px (6 units)
- Dense tables: 8px vertical padding per row

### Sidebar
- Fixed width: 240px
- Compact navigation items
- Icon + label pattern
- Active state: subtle background + accent border

### Dashboard Cards
- Minimal padding (16px)
- Tight line-height for metrics
- Hairline borders
- No shadows — rely on borders for structure

### Data Tables
- Striped rows for scanability
- Sticky headers
- Right-aligned numbers
- Mono font for numeric columns
- Compact row height (36px)

## Visual Craft

### Borders
- Hairline rules: 1px solid with 8% opacity
- Active elements: 1px solid primary color
- Never heavy or doubled borders

### Whitespace
- Minimal but deliberate
- Dense packing in tables and metric grids
- Breathing room around section headers only

### Transitions
- Instant feedback: 100ms
- State changes: 150ms ease-out
- No unnecessary motion

### Charts
- Clean axes, minimal gridlines
- Functional tooltips with precise values
- Legend positioned for efficiency
- Responsive sizing to container

### Interactive States
- Hover: 4% background tint
- Active: 8% background tint
- Focus: 2px ring in primary color
- Disabled: 40% opacity

## Component Patterns

### Metric Card
```
[LABEL] 11px uppercase tracking
[VALUE] 32px JetBrains Mono Medium
[CHANGE] 13px with arrow + percentage
```

### Date Range Picker
- Start/End date inputs side by side
- "Apply" button for filtering
- Preset options: This Month, Last Month, Custom

### Status Badge
- Compact pill shape
- Uppercase 10px text
- Color-coded background at 10% opacity
- Full-opacity text

### Action Buttons
- 32px height (compact)
- Clear labels, optional icons
- Primary: filled blue
- Secondary: outlined gray

## Content Guidelines

### Numbers
- Use tabular figures (mono font)
- Right-align in tables
- Include currency symbols
- Show 2 decimal places for currency
- Use commas for thousands

### Dates
- Format: MMM DD, YYYY
- Relative when recent: "Today", "Yesterday"
- Consistent timezone display

### Status Labels
- IN_STOCK, LOW_STOCK, OUT_OF_STOCK
- ACTIVE, INACTIVE
- Short, scannable codes

## Accessibility

- Text contrast: minimum 4.5:1
- Interactive targets: minimum 32px
- Focus indicators on all controls
- Keyboard navigation support
- Screen reader labels on icons
