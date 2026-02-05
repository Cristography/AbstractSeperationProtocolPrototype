# UI/UX Design System

## Overview

This document defines the complete user interface architecture, design patterns, and interaction specifications for the Visual Content Editor.

---

## 1. Design Philosophy

### 1.1 Core Principles

1. **Focus on Content**: UI elements are subdued to let user content shine
2. **Progressive Disclosure**: Advanced features hidden until needed
3. **Immediate Feedback**: Every action has visual response
4. **Consistency**: Same patterns across all content types
5. **Efficiency**: Keyboard shortcuts and quick actions for power users

### 1.2 Visual Hierarchy

```
Primary:    User Content (white canvas, full color)
Secondary:  Editor UI (dark panels, muted grays)
Tertiary:   Accents (indigo for actions, red for danger)
Quaternary: Metadata (timestamps, labels)
```

---

## 2. Layout Architecture

### 2.1 Three-Panel Layout

**Structure:**
```
┌──────────────────────────────────────────────────────────────────┐
│                         TOOLBAR (56px)                          │
├──────────────────┬──────────────────────────────┬────────────────┤
│                  │                              │                │
│    SIDEBAR       │         CANVAS               │   PROPERTIES   │
│    (320px)       │         (flex)               │   (320px)      │
│                  │                              │                │
│  Navigation      │    Preview Area              │   Settings     │
│  & Management    │    (scaled content)          │   & Content    │
│                  │                              │                │
│  ┌────────────┐  │                              │  ┌──────────┐  │
│  │  Slide 1   │  │    ┌──────────────────┐      │  │ Layout   │  │
│  │  Slide 2   │  │    │                  │      │  │ Select   │  │
│  │  Slide 3 ◄─┼──┼────┤   Active Slide   │      │  └──────────┘  │
│  └────────────┘  │    │                  │      │                │
│                  │    └──────────────────┘      │  ┌──────────┐  │
│  [+ Add New]     │                              │  │ Content  │  │
│                  │    [Zoom 60%]    [◀ 3/5 ▶]  │  │ Fields   │  │
│                  │                              │  └──────────┘  │
└──────────────────┴──────────────────────────────┴────────────────┘
```

**Panel Responsiveness:**
- Fixed sidebar widths (320px each)
- Canvas expands to fill available space
- Minimum window width: 1024px
- On smaller screens: collapse sidebars (future feature)

---

## 3. Color System

### 3.1 CSS Custom Properties

**Root Variables (style.css lines 7-24):**
```css
:root {
  /* Background Hierarchy */
  --bg-dark: #0f0f0f;        /* Deepest background */
  --bg-panel: #1a1a1a;       /* Panel backgrounds */
  --bg-hover: #252525;       /* Hover states */
  --bg-active: #2a2a2a;      /* Active/selected states */
  
  /* Border Colors */
  --border: #333;            /* Default borders */
  --border-light: #444;      /* Subtle borders */
  
  /* Accent Colors */
  --accent: #6366f1;         /* Primary action (indigo) */
  --accent-hover: #818cf8;   /* Hover state (lighter indigo) */
  --accent-light: rgba(99, 102, 241, 0.2);  /* Subtle accent bg */
  
  /* Text Colors */
  --text: #e5e5e5;           /* Primary text (near white) */
  --text-muted: #888;        /* Secondary text (gray) */
  
  /* Semantic Colors */
  --success: #22c55e;        /* Success states (green) */
  --warning: #f59e0b;        /* Warning states (orange) */
  --danger: #ef4444;         /* Danger states (red) */
  
  /* Layout Constants */
  --panel-width: 320px;
  --toolbar-height: 56px;
}
```

### 3.2 Color Usage Patterns

**Editor Chrome (Dark Theme):**
| Element | Background | Text | Border |
|---------|-----------|------|--------|
| Body | --bg-dark | --text | - |
| Panels | --bg-panel | --text | --border |
| Buttons | --bg-hover | --text | transparent |
| Buttons (Hover) | --bg-active | --text | --border |
| Primary Button | --accent | white | transparent |
| Input Fields | --bg-hover | --text | --border |
| Active Item | --accent-light | --text | --accent |

**Content Canvas (Light):**
- White/light background (from theme)
- Dark text (from theme)
- Colored accents (from theme)

**Contrast Ratio:**
- Editor UI: 7:1 (WCAG AAA compliant)
- Content: Variable based on theme

---

## 4. Typography

### 4.1 Font Stack

**System Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Why System Fonts:**
- Fast loading (no external requests)
- Native look on each OS
- No font licensing issues
- Reduced bundle size

### 4.2 Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| Logo | 18px | 700 | 1.2 | Toolbar branding |
| H1 (Modal) | 18px | 600 | 1.3 | Modal headers |
| H2 (Section) | 12px | 600 | 1.4 | Panel section headers |
| H3 (Labels) | 13px | 500 | 1.4 | Input labels |
| Body | 13px | 400 | 1.5 | General text |
| Small | 11px | 400 | 1.4 | Metadata, counters |
| Button | 13px | 500 | 1 | Button text |

### 4.3 Content Typography (Generated Slides)

**Presentation Slide Text:**
```css
.slide-title { font-size: 48px; font-weight: 700; }
.slide-subtitle { font-size: 24px; opacity: 0.8; }
.slide-heading { font-size: 32px; font-weight: 600; }
.slide-body { font-size: 18px; line-height: 1.6; }
```

**Social Post Text:**
```css
.insta-headline { font-size: 42px; font-weight: 700; }
.insta-body { font-size: 20px; opacity: 0.9; }
```

---

## 5. Component Library

### 5.1 Buttons

**Primary Button:**
```css
.btn-primary {
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary:hover {
  background: var(--accent-hover);
}
```

**Secondary Button:**
```css
.btn {
  padding: 8px 16px;
  background: var(--bg-hover);
  color: var(--text);
  border: none;
  border-radius: 6px;
  font-size: 13px;
}

.btn:hover {
  background: var(--bg-active);
}
```

**Icon Button:**
```css
.btn-icon {
  padding: 8px;
  /* Square button for icon only */
}
```

**Button States:**
| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | --bg-hover | --text | none |
| Hover | --bg-active | --text | none |
| Active | --accent | white | none |
| Primary | --accent | white | none |
| Primary Hover | --accent-hover | white | none |
| Danger | transparent | --danger | none |

### 5.2 Input Fields

**Text Input:**
```css
input[type="text"],
input[type="email"] {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
}

input:focus {
  outline: none;
  border-color: var(--accent);
}
```

**Textarea:**
```css
textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  min-height: 80px;
  resize: vertical;
}
```

**Select Dropdown:**
```css
select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}
```

**Color Picker:**
```css
input[type="color"] {
  width: 100%;
  height: 40px;
  padding: 4px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
}
```

### 5.3 Cards

**Page Item Card (Sidebar):**
```css
.page-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: grab;
  transition: all 0.15s;
}

.page-item:hover {
  background: var(--bg-active);
}

.page-item.active {
  border-color: var(--accent);
  background: var(--accent-light);
}

.page-item.dragging {
  opacity: 0.5;
  border-style: dashed;
}
```

**Type Selection Card (Welcome Modal):**
```css
.type-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.type-card:hover {
  border-color: var(--accent);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
}
```

**Layout Option Card:**
```css
.layout-option {
  background: var(--bg-hover);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}

.layout-option:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.layout-option.selected {
  border-color: var(--accent);
  background: var(--accent-light);
}
```

### 5.4 Modals

**Modal Structure:**
```
┌─────────────────────────────────────┐
│ Modal Overlay (backdrop blur)       │
│  ┌───────────────────────────────┐  │
│  │ ┌───────────────────────────┐ │  │
│  │ │ Header              [✕]   │ │  │
│  │ └───────────────────────────┘ │  │
│  │                               │  │
│  │      Body Content             │  │
│  │      (scrollable)             │  │
│  │                               │  │
│  │ ┌───────────────────────────┐ │  │
│  │ │ Footer            [Save]  │ │  │
│  │ └───────────────────────────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Modal Styles:**
```css
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.modal-overlay.show {
  display: flex;
}

.modal {
  background: var(--bg-panel);
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

### 5.5 Toast Notifications

**Toast Structure:**
```css
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--bg-panel);
  color: var(--text);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: all 0.3s;
  z-index: 2000;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
```

**Usage:**
```javascript
showToast('Project saved!');           // Auto-dismiss after 3s
showToast('Error: Invalid file', 5000); // Custom duration
```

---

## 6. Animations & Transitions

### 6.1 Micro-interactions

**Button Hover:**
```css
.btn {
  transition: background 0.15s, transform 0.1s;
}

.btn:active {
  transform: scale(0.98);
}
```

**Card Hover:**
```css
.layout-option {
  transition: border-color 0.15s, transform 0.15s;
}

.layout-option:hover {
  transform: translateY(-2px);
}
```

**Focus States:**
```css
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
  transition: border-color 0.2s;
}
```

### 6.2 Slide Animations (Content)

**Available Animations:**
```css
@keyframes fade { 
  from { opacity: 0; } 
  to { opacity: 1; } 
}

@keyframes slide-up { 
  from { transform: translateY(30px); opacity: 0; } 
  to { transform: translateY(0); opacity: 1; } 
}

@keyframes slide-left { 
  from { transform: translateX(30px); opacity: 0; } 
  to { transform: translateX(0); opacity: 1; } 
}

@keyframes zoom { 
  from { transform: scale(0.9); opacity: 0; } 
  to { transform: scale(1); opacity: 1; } 
}

.animation-fade { animation: fade 0.5s ease; }
.animation-slide-up { animation: slide-up 0.5s ease; }
.animation-slide-left { animation: slide-left 0.5s ease; }
.animation-zoom { animation: zoom 0.5s ease; }
```

### 6.3 Modal Transitions

**Fade In:**
```css
.modal-overlay {
  opacity: 0;
  transition: opacity 0.3s;
}

.modal-overlay.show {
  opacity: 1;
}

.modal {
  transform: scale(0.9);
  transition: transform 0.3s;
}

.modal-overlay.show .modal {
  transform: scale(1);
}
```

---

## 7. Welcome Screen

### 7.1 Layout

**Grid Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Create New Project                             │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │          │ │          │ │          │ │          │       │
│  │   [Icon] │ │   [Icon] │ │   [Icon] │ │   [Icon] │       │
│  │          │ │          │ │          │ │          │       │
│  │ Title    │ │ Title    │ │ Title    │ │ Title    │       │
│  │ Desc     │ │ Desc     │ │ Desc     │ │ Desc     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│         Presentation  Website  Resume  Social Post          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Responsive Behavior:**
- Desktop (4 columns): 4 cards side-by-side
- Tablet (2 columns): 2x2 grid
- Mobile (1 column): Stacked vertically

### 7.2 Type Card Design

```css
.type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px;
}

.type-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.type-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent), #818cf8);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
  font-size: 28px;
}

.type-card h3 {
  color: #1e293b;
  font-size: 18px;
  margin-bottom: 8px;
}

.type-card p {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 16px;
}
```

---

## 8. Toolbar Design

### 8.1 Structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo] [Badge]              [Actions]              [Tools]      [Export]     │
│                                                                               │
│  + New    [Type]        Add  Duplicate  Delete      Undo Redo   Save Load  ⬇ │
│  Project  Presentation  Slide                                     Export     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Toolbar Sections

**Left Section:**
- Logo with "+ New Project" click target
- Current type badge (icon + name)

**Center Section:**
- Content-specific actions
- Changes based on content type:
  - Presentation: Add Slide, Duplicate, Delete
  - Website: Add Section
  - Resume: Add Section, New Page
  - Social: New Post

**Right Section:**
- Global actions: Undo, Redo
- Utility: Theme, Save, Load
- Primary: Export (highlighted)

### 8.3 Toolbar Responsive Behavior

**Full Width:**
- All buttons visible with text
- Icons + text labels

**Medium Width:**
- Secondary buttons become icon-only
- Save/Load become icons
- Type badge shows icon only

**Narrow Width:**
- Toolbar scrolls horizontally
- Or hamburger menu (future)

---

## 9. Sidebar Design

### 9.1 Header

```
┌──────────────────┐
│ SIDEBAR TITLE    │  ← Uppercase, muted, small
├──────────────────┤
│                  │
```

**Header Styles:**
```css
.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**Dynamic Titles:**
- Presentation: "Slides"
- Website: "Sitemap"
- Resume: "Pages"
- Social: "Posts"

### 9.2 Page Items

**Structure:**
```
┌──────────────────────┐
│ ●  │ Title      │ ≡  │
│ 1  │ Preview... │    │
└──────────────────────┘
```

**Components:**
1. **Number Badge**: Circular, accent color, sequential
2. **Text Info**: Layout name + content preview
3. **Drag Handle**: Grip icon, appears on hover

**States:**
| State | Border | Background | Drag Handle |
|-------|--------|------------|-------------|
| Default | transparent | --bg-hover | 50% opacity |
| Hover | transparent | --bg-active | 100% opacity |
| Active | --accent | --accent-light | 100% opacity |
| Dragging | dashed | transparent | hidden |

### 9.3 Empty State

```
┌──────────────────────┐
│                      │
│    [+ Icon]          │
│                      │
│   Get Started        │
│                      │
│   Add your first     │
│   [item type]        │
│                      │
│   [Add Button]       │
│                      │
└──────────────────────┘
```

---

## 10. Canvas Design

### 10.1 Canvas Area

**Structure:**
```
┌──────────────────────────────────────────────────────────┐
│ Toolbar: [Zoom - 100% +]  [◀ 3/5 ▶]                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│          ┌──────────────────────────────┐               │
│          │                              │               │
│          │    Preview Canvas            │               │
│          │    (scaled to fit)           │               │
│          │                              │               │
│          │    ┌──────────────────┐      │               │
│          │    │                  │      │               │
│          │    │  User Content    │      │               │
│          │    │  (white bg)      │      │               │
│          │    │                  │      │               │
│          │    └──────────────────┘      │               │
│          │                              │               │
│          └──────────────────────────────┘               │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 10.2 Zoom Controls

**Zoom Display:**
```
[−]  100%  [+]
```

**Behavior:**
- Range: 50% - 150%
- Step: 10% increments
- Default: 60%
- Updates canvas transform: `scale(zoom)`

### 10.3 Navigation

**Item Counter:**
```
[Previous]  3 / 5  [Next]
```

**Keyboard Navigation:**
- Arrow keys (future)
- Click sidebar items
- Toolbar buttons

---

## 11. Properties Panel

### 11.1 Panel Structure

```
┌──────────────────────┐
│ SETTINGS             │
├──────────────────────┤
│ Layout               │
│ [Dropdown      ▼]    │
│                      │
│ Animation            │
│ [Dropdown      ▼]    │
│                      │
│ [Duplicate] [Delete] │
├──────────────────────┤
│ CONTENT              │
├──────────────────────┤
│ Field 1              │
│ [Input           ]   │
│                      │
│ Field 2              │
│ [Textarea        ]   │
│                      │
├──────────────────────┤
│ COLORS               │
├──────────────────────┤
│ BG [■]  Text [■]     │
│                      │
│ Pri [■]  Sec [■]     │
└──────────────────────┘
```

### 11.2 Property Groups

**Section Header:**
```css
.property-section h3 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 12px;
}
```

**Property Group:**
```css
.property-group {
  margin-bottom: 16px;
}

.property-group label {
  display: block;
  font-size: 13px;
  color: var(--text);
  margin-bottom: 6px;
}
```

### 11.3 Color Pickers

**Color Row Layout:**
```
┌──────────────────────┐
│ BG     │  Text       │
│ [████] │  [████]     │
├──────────────────────┤
│ Pri    │  Sec        │
│ [████] │  [████]     │
└──────────────────────┘
```

**Styles:**
```css
.color-row {
  display: flex;
  gap: 8px;
}

.color-row .property-group {
  flex: 1;
}
```

---

## 12. Layout Library Modal

### 12.1 Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Layout Library                                    [✕]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [All] [Category 1] [Category 2] ...                        │
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│ │    📄    │ │    📝    │ │    🔀    │                     │
│ │  Layout  │ │  Layout  │ │  Layout  │                     │
│ │   Name   │ │   Name   │ │   Name   │                     │
│ └──────────┘ └──────────┘ └──────────┘                     │
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│ │    📊    │ │    📅    │ │    🙏    │                     │
│ │  Layout  │ │  Layout  │ │  Layout  │                     │
│ │   Name   │ │   Name   │ │   Name   │                     │
│ └──────────┘ └──────────┘ └──────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Category Filter

**Pill Buttons:**
```css
.layout-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.layout-category-btn {
  padding: 6px 12px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}

.layout-category-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
```

### 12.3 Layout Grid

**Grid System:**
```css
.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
```

**Auto-fill Strategy:**
- Minimum card width: 140px
- Fills available space
- Responsive without media queries

---

## 13. Theme Modal

### 13.1 Theme Grid

```
┌─────────────────────────────────────────────────────────────┐
│ Choose Theme                                      [✕]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ [████████]   │ │ [████████]   │ │ [████████]   │         │
│ │ [████████]   │ │ [████████]   │ │ [████████]   │         │
│ │ [████████]   │ │ [████████]   │ │ [████████]   │         │
│ │              │ │              │ │              │         │
│ │ Theme Name   │ │ Theme Name   │ │ Theme Name   │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 Theme Preview

**Color Preview Bars:**
```css
.theme-preview {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.theme-preview-bg {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}
```

**Color Order:**
1. Background color
2. Primary color
3. Secondary color

---

## 14. Export Modal

### 14.1 Export Options

```
┌─────────────────────────────────────┐
│ Export                    [✕]       │
├─────────────────────────────────────┤
│                                     │
│ Format                              │
│ ┌─────────────────────────────────┐ │
│ │ HTML (Editable)           ▼     │ │
│ ├─────────────────────────────────┤ │
│ │ PPTX (PowerPoint)               │ │
│ ├─────────────────────────────────┤ │
│ │ PDF Document                    │ │
│ ├─────────────────────────────────┤ │
│ │ PNG Image                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [     Export      ]         │
│                                     │
└─────────────────────────────────────┘
```

### 14.2 Dynamic Options

**Format Labels:**
```javascript
const labels = {
  'html': 'HTML (Editable)',
  'pptx': 'PowerPoint (.pptx)',
  'pdf': 'PDF Document',
  'zip': 'ZIP Archive',
  'png': 'PNG Image',
  'jpg': 'JPEG Image'
};
```

**Dynamic Based on Content Type:**
- Presentation: HTML, PPTX, PDF
- Website: HTML, ZIP
- Resume: PDF, HTML
- Social: PNG, JPG, HTML

---

## 15. Responsive Design

### 15.1 Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop | ≥1200px | Full 3-panel |
| Laptop | ≥1024px | Full 3-panel |
| Tablet | <1024px | Collapse right panel |
| Mobile | <768px | Single column |

### 15.2 Mobile Considerations

**Current State:**
- Minimum recommended: 1024px
- Below 1024px: horizontal scroll
- Touch targets: 44px minimum (already implemented)

**Future Improvements:**
- Collapsible sidebars
- Bottom sheet for properties
- Full-screen canvas mode

### 15.3 Touch Interactions

**Drag & Drop (Touch):**
- Long press to initiate drag
- Haptic feedback (if available)
- Visual drag preview

**Pinch to Zoom:**
- Canvas zoom control
- Minimum: 50%, Maximum: 150%

---

## 16. Accessibility

### 16.1 Keyboard Navigation

**Shortcuts:**
| Shortcut | Action |
|----------|--------|
| Tab | Navigate between interactive elements |
| Enter | Activate button/open modal |
| Escape | Close modal |
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Delete | Delete selected item |

**Focus States:**
```css
button:focus,
input:focus,
select:focus,
[contenteditable]:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### 16.2 Screen Readers

**Semantic HTML:**
```html
<button aria-label="Add new slide">
  <i class="fas fa-plus"></i>
</button>

<nav aria-label="Slide navigation">
  <!-- Page items -->
</nav>

<main aria-label="Canvas">
  <!-- Preview area -->
</main>
```

**ARIA Labels:**
- Toolbar buttons: action description
- Sidebar items: "Slide 1: Title Slide"
- Modal close: "Close modal"

### 16.3 Color Contrast

**Editor UI:**
- Background: #0f0f0f
- Text: #e5e5e5
- Ratio: 13.5:1 (WCAG AAA)

**Accent:**
- Background: #6366f1
- Text: white
- Ratio: 4.6:1 (WCAG AA)

**Content:**
- Variable based on theme
- All built-in themes meet WCAG AA

---

## 17. Empty States

### 17.1 Canvas Empty State

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                          [○]                                 │
│                    Get Started                               │
│                                                              │
│         Add your first [slide/section/page/post]             │
│                                                              │
│                [ + Add Item ]                                │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Styles:**
```css
.empty-canvas {
  text-align: center;
  color: var(--text-muted);
}

.empty-canvas h2 {
  font-size: 24px;
  color: var(--text);
  margin-bottom: 8px;
}

.empty-canvas p {
  margin-bottom: 24px;
}
```

### 17.2 Sidebar Empty State

- No items: show empty list
- Add button always visible below

---

## 18. Loading States

### 18.1 Initialization

**Splash Screen (Optional):**
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                      Visual Editor                           │
│                                                              │
│                     Loading...                               │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Progress Indication:**
- Config loading
- Theme initialization
- Layout library population

### 18.2 Export Loading

**Toast Message:**
```javascript
showToast('Generating PDF...');  // Shows during export
showToast('PDF exported');        // Success
```

**Progress Bar (Future):**
```
[████████░░░░░░░░░░] 50%
```

---

## 19. Error States

### 19.1 Validation Errors

**Input Validation:**
```css
input:invalid {
  border-color: var(--danger);
}

.error-message {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}
```

### 19.2 System Errors

**Toast Notifications:**
```javascript
showToast('Failed to load project');
showToast('Storage full. Please export.');
```

**Modal Error:**
```
┌─────────────────────────────────────┐
│ Error                               │
├─────────────────────────────────────┤
│                                     │
│ Unable to load file.                │
│ The file may be corrupted.          │
│                                     │
│          [    OK    ]               │
│                                     │
└─────────────────────────────────────┘
```

---

## 20. Design Tokens

### 20.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| --space-xs | 4px | Tight spacing, icon padding |
| --space-sm | 8px | Button gaps, small margins |
| --space-md | 12px | Card padding, input padding |
| --space-lg | 16px | Section gaps, modal padding |
| --space-xl | 20px | Large sections |
| --space-2xl | 24px | Page padding |

### 20.2 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | Inputs, small elements |
| --radius-md | 6px | Buttons, cards |
| --radius-lg | 8px | Panels, modals |
| --radius-xl | 12px | Large cards, modals |
| --radius-full | 9999px | Pills, avatars |

### 20.3 Shadow Scale

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## Summary

**Key Design Decisions:**
1. **Dark Editor Chrome**: Reduces eye strain, makes content pop
2. **Three-Panel Layout**: Efficient use of screen real estate
3. **CSS Custom Properties**: Consistent theming and easy customization
4. **System Fonts**: Performance and native feel
5. **Subtle Animations**: Delight without distraction

**UI Components:**
- 5 button variants
- 4 input types
- 4 card types
- 3 modal types
- Toast notifications

**Interactive States:**
- Default, hover, active, disabled
- Focus indicators for accessibility
- Loading and error states

**Responsive Strategy:**
- Desktop-first (1024px minimum)
- Future: Collapsible panels for smaller screens

---

*This design system ensures consistency across all features while maintaining flexibility for future additions.*
