# Visual Content Editor - Technical Specification

## Executive Summary

A browser-based visual content creation platform that enables users to create presentations, websites, resumes, and social media posts through a unified interface. The system features AI integration capabilities, real-time editing, multi-format export, and a component-based architecture.

**Key Capabilities:**
- 4 content types: Presentations (16:9), Websites (scrolling), Resumes (A4), Social Posts (various)
- 50+ layout templates across all content types
- 4 built-in color themes with custom color support
- Export to HTML, PPTX, PDF, PNG, JPG
- AI-powered content generation via MCP (Model Context Protocol)
- Drag-and-drop reordering and inline editing
- LocalStorage persistence with JSON import/export

---

## 1. System Architecture

### 1.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (index.html, style.css)                     │
│  ├─ Welcome Modal (content type selector)                       │
│  ├─ Main Toolbar (actions, navigation)                          │
│  ├─ Three-Panel Layout (sidebar/canvas/properties)              │
│  ├─ Modal System (layouts, themes, export)                      │
│  └─ Toast Notifications                                         │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (editor.js)                                  │
│  ├─ State Management (project, history, zoom)                   │
│  ├─ Event Handling (clicks, keyboard, drag-drop)                │
│  ├─ UI Coordination (toolbar, sidebar, canvas sync)             │
│  ├─ Export Logic (format-specific generation)                   │
│  └─ Theme Application (color scheme distribution)               │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (js/*.js)                                         │
│  ├─ Project.js - Core data model and persistence                │
│  ├─ Registry.js - Component catalog and validation              │
│  ├─ Renderer.js - HTML/CSS generation engine                    │
│  ├─ MCPServer.js - AI tool definitions and handlers             │
│  └─ Components.js - UI component library                        │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                     │
│  ├─ config.json - Layout and theme definitions                  │
│  ├─ manifest.json - Extended component metadata                 │
│  ├─ LocalStorage - Project state persistence                    │
│  └─ File System - Layout templates (HTML files)                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Architecture

**User Action Flow:**
```
User Input → Editor.js → Update Project State → Save to LocalStorage
     ↓                                              ↓
     └────────── Trigger Render ←───────────────────┘
                          ↓
                    Renderer.js
                          ↓
               (Project + Registry + Theme)
                          ↓
                    HTML/CSS Output
                          ↓
                    DOM Update
```

**AI Integration Flow:**
```
User Prompt → AI Processing → MCP Tool Call → Project Update
                                            ↓
                                       Validation
                                            ↓
                                       Persistence
                                            ↓
                                       UI Refresh
```

---

## 2. Core Components

### 2.1 Content Type System

The platform supports 4 distinct content types, each with specialized configurations:

| Content Type | Aspect Ratio | Dimensions | Unit | Sidebar Label | Export Formats |
|--------------|--------------|------------|------|---------------|----------------|
| Presentation | 16:9 | 960×540 | px | Slides | HTML, PPTX, PDF |
| Website | auto | 1200×auto | px | Sitemap | HTML, ZIP |
| Resume | 210/297mm | 794×1123 | px | Pages | PDF, HTML |
| Social Post | 1:1 | 1080×1080 | px | Posts | PNG, JPG, HTML |

**Content Type Configuration Object (CONTENT_TYPES):**
```javascript
{
  presentation: {
    aspectRatio: '16/9',
    width: 960,
    height: 540,
    folder: 'presentations',
    itemName: 'slide',
    exportFormats: ['html', 'pptx', 'pdf'],
    supportsAnimations: true
  }
}
```

### 2.2 Project Data Model

**Project Structure:**
```typescript
interface Project {
  type: 'presentation' | 'website' | 'resume' | 'post';
  items: Item[];
  currentIndex: number;
  zoom: number;
  theme: Theme;
}

interface Item {
  id: string;
  layout: string;
  content: Record<string, string>;
  colors: {
    bg: string;
    text: string;
    primary: string;
    secondary: string;
  };
  animation: string;
}

interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    text: string;
    primary: string;
    secondary: string;
  };
}
```

### 2.3 Layout System

**Layout Definition Schema:**
```json
{
  "id": "title-slide",
  "name": "Title Slide",
  "category": "presentation",
  "icon": "📝",
  "slots": {
    "title": {
      "type": "text",
      "placeholder": "Your Title"
    },
    "subtitle": {
      "type": "text", 
      "placeholder": "Subtitle"
    }
  }
}
```

**Slot Types:**
- `text` - Single-line input field
- `textarea` - Multi-line text area

**Layout Categories:**
- **Presentation** (14 layouts): title, content, two-column, quote, agenda, stats, timeline, thank-you, problem-solution, team, comparison, contact
- **Website** (8 layouts): hero, features, about, CTA, footer, testimonials, pricing, team
- **Resume** (7 layouts): header, summary, section, job, skills, education, projects
- **Social** (10 layouts): Instagram square/story, LinkedIn, Twitter, Facebook, YouTube thumbnail, Pinterest, TikTok, quote, promo

### 2.4 Theme System

**Theme Definition:**
```json
{
  "id": "clean-white",
  "name": "Clean White",
  "colors": {
    "bg": "#ffffff",
    "text": "#333333",
    "primary": "#3b82f6",
    "secondary": "#64748b"
  }
}
```

**Built-in Themes:**
1. **Clean White** - Professional blue/gray on white
2. **Dark Mode** - Purple accents on dark background
3. **Warm Sand** - Orange/amber earth tones
4. **Nature Green** - Emerald/teal on mint background

**Theme Application Strategy:**
- Colors are copied to each item individually (allows per-item customization)
- Theme change updates all items' color objects
- Individual item colors can override theme defaults

---

## 3. UI/UX Specifications

### 3.1 Layout Structure

**Three-Panel Editor Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│ Toolbar (56px height)                                            │
│ [Logo] [Type Badge]        [Actions]        [Theme][Save][Export]│
├──────────────────────────────────────────────────────────────────┤
│ Sidebar (320px)  │  Canvas (flex)           │  Properties (320px)│
│                  │                          │                    │
│ [Header]         │  ┌────────────────────┐  │ [Settings]         │
│                  │  │                    │  │  - Layout          │
│ ┌────────────┐   │  │   Preview Area     │  │  - Animation       │
│ │ Item 1     │   │  │   (scaled)         │  │                    │
│ │ Item 2     │   │  │                    │  │ [Content Fields]   │
│ │ Item 3  ●  │   │  └────────────────────┘  │  - Slot inputs     │
│ └────────────┘   │                          │                    │
│                  │  [Zoom]         [Nav]    │ [Colors]           │
│ [+ Add Item]     │  100%  [◀] 3/5 [▶]       │  - BG/Text/Primary │
│                  │                          │                    │
└──────────────────┴──────────────────────────┴────────────────────┘
```

### 3.2 Component Library

**Visual Components:**

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| Type Cards | Welcome screen selection | Hover lift effect, icon + description |
| Page Items | Sidebar navigation | Drag handle, active state, number badge |
| Layout Options | Layout library grid | Icon, name, category, hover border |
| Theme Options | Theme selector | 3-color preview, selected state |
| Modal Overlays | Focused workflows | Backdrop blur, centered content |
| Toast | Notifications | Bottom center, auto-dismiss |

**Interactive States:**
- **Default**: Subtle borders, muted text
- **Hover**: Accent border, slight lift (translateY)
- **Active/Selected**: Solid accent border, light accent background
- **Dragging**: Reduced opacity, dashed border

### 3.3 Editing Modes

**1. Inline Editing (Canvas):**
- Contenteditable elements in preview
- onblur triggers save
- Real-time visual feedback

**2. Properties Panel Editing:**
- Form inputs for each slot
- Color pickers for theme colors
- Layout dropdown for switching
- Animation selector

**3. Drag & Drop Reordering:**
- Drag handle on each sidebar item
- Visual feedback during drag
- Drop target highlighting
- Automatic reorder in array

### 3.4 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save project |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+Z | Redo (alternative) |
| Delete | Delete selected item |
| Arrow Keys | Navigate items (planned) |

### 3.5 Color System (CSS Variables)

```css
:root {
  --bg-dark: #0f0f0f;
  --bg-panel: #1a1a1a;
  --bg-hover: #252525;
  --bg-active: #2a2a2a;
  --border: #333;
  --border-light: #444;
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --text: #e5e5e5;
  --text-muted: #888;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
}
```

---

## 4. Export System

### 4.1 Export Formats Matrix

| Content Type | HTML | PPTX | PDF | PNG | JPG | ZIP |
|--------------|------|------|-----|-----|-----|-----|
| Presentation | ✓ | ✓ | ✓ | - | - | - |
| Website | ✓ | - | - | - | - | ✓ |
| Resume | ✓ | - | ✓ | - | - | - |
| Social Post | ✓ | - | - | ✓ | ✓ | - |

### 4.2 Export Implementation Details

**HTML Export:**
- Generates complete HTML document
- Embeds all CSS styles
- Includes content inline
- Standalone file (no external dependencies)

**PPTX Export (PptxGenJS):**
- 16:9 layout (LAYOUT_16x9)
- Supports background colors
- Text positioning with x,y,w,h coordinates
- Font styling (size, color, bold)

**PDF Export (jsPDF + html2canvas):**
- Landscape for presentations
- Portrait for resumes (A4)
- Rasterizes each item to canvas
- Embeds as images in PDF pages

**Image Export (PNG/JPG):**
- Uses html2canvas for rendering
- 2x scale for high resolution
- Current item only
- Transparent background option (PNG)

### 4.3 Export Code Structure

```javascript
// Export dispatcher
function doExport() {
  const format = document.getElementById('exportFormat').value;
  switch(format) {
    case 'html': exportHTML(); break;
    case 'pptx': exportPPTX(); break;
    case 'pdf': exportPDF(); break;
    case 'png': case 'jpg': exportImage(format); break;
  }
}

// Common pattern for image-based exports
async function exportImage(format) {
  // 1. Create temp div
  // 2. Apply dimensions and styles
  // 3. Render content
  // 4. Use html2canvas to capture
  // 5. Generate download
  // 6. Cleanup
}
```

---

## 5. AI Integration (MCP Server)

### 5.1 MCP Tool Definitions

The MCP (Model Context Protocol) server exposes 11 tools for AI integration:

| Tool | Purpose | Parameters |
|------|---------|------------|
| `get_available_components` | List layouts/themes | category (optional) |
| `get_component_details` | Get layout metadata | layoutId |
| `generate_content` | Create content for slots | layoutId, topic, tone, language |
| `create_page` | Add item to project | layoutId, content, theme |
| `update_page_content` | Modify existing content | pageId, slot, content |
| `get_project_status` | Project overview | - |
| `apply_theme` | Change theme | themeId |
| `generate_presentation` | Multi-slide creation | topic, slideCount |
| `validate_content` | Check constraints | layoutId, content |
| `export_project` | Export data | format |

### 5.2 AI Content Generation

**Content Generation Strategy:**
```javascript
// Slot-specific content generators
const slotGenerators = {
  title: (topic) => `Introduction to ${topic}`,
  subtitle: () => `Exploring the fundamentals and key concepts`,
  heading: (topic) => `Understanding ${topic}`,
  body: (topic) => `${topic} is an important concept...`,
  cta: () => `Learn More`,
  ctaPrimary: () => `Get Started`
};
```

**Constraint Handling:**
- Max character limits enforced
- Required field validation
- Content truncation with ellipsis

### 5.3 AI Workflow Example

```
User: "Create a presentation about renewable energy"
  ↓
AI → MCP.generate_presentation({topic: "renewable energy", slideCount: 4})
  ↓
MCP: 
  1. Gets presentation layouts
  2. Generates content for each slot
  3. Creates 4 items in project
  4. Saves to LocalStorage
  ↓
Editor detects change → Re-renders UI
  ↓
User sees 4 slides ready to edit
```

---

## 6. State Management

### 6.1 Project State

```javascript
// Current state structure
const project = {
  type: 'presentation',
  items: [
    {
      id: 'unique-id',
      layout: 'title-slide',
      content: {
        title: 'My Title',
        subtitle: 'My Subtitle'
      },
      colors: {
        bg: '#ffffff',
        text: '#333333',
        primary: '#3b82f6',
        secondary: '#64748b'
      },
      animation: 'none'
    }
  ],
  currentIndex: 0,
  zoom: 0.6,
  theme: { /* theme object */ }
};
```

### 6.2 History Management

**Undo/Redo Implementation:**
```javascript
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

function saveState() {
  // Truncate future history if in middle
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  
  // Add new state
  const state = JSON.stringify({items, currentIndex, theme});
  history.push(state);
  
  // Limit history size
  if (history.length > MAX_HISTORY) {
    history.shift();
    historyIndex--;
  }
  
  historyIndex++;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreState(history[historyIndex]);
  }
}
```

### 6.3 Persistence Strategy

**LocalStorage Keys:**
- `visualEditorProject` - Full project state

**Save Triggers:**
- Every content change
- Theme application
- Layout change
- Item reordering
- Color updates

**Load on Startup:**
1. Check LocalStorage for saved project
2. If found, restore state
3. If not, show welcome modal

---

## 7. Technical Specifications

### 7.1 Dependencies

**External Libraries:**
| Library | Version | Purpose |
|---------|---------|---------|
| Font Awesome | 6.5.1 | Icons |
| PptxGenJS | 3.12.0 | PowerPoint export |
| jsPDF | 2.5.1 | PDF generation |
| html2canvas | 1.4.1 | Canvas rasterization |

**CDN URLs:**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

### 7.2 Browser Compatibility

**Supported Browsers:**
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

**Required Features:**
- ES6+ JavaScript
- CSS Grid and Flexbox
- CSS Custom Properties
- LocalStorage API
- File API (for import)

### 7.3 Performance Considerations

**Optimizations:**
- Canvas scaling for preview (not full resolution)
- Lazy loading of layout library
- Debounced input handlers
- Efficient DOM updates (innerHTML batching)

**Limits:**
- 50 undo history items
- LocalStorage ~5MB limit
- Image export size limited by canvas memory

### 7.4 File Size Analysis

| File | Lines | Purpose |
|------|-------|---------|
| index.html | 237 | Main UI structure |
| style.css | 1440 | All styling |
| editor.js | 1340 | Core application logic |
| js/registry.js | 86 | Component registry |
| js/project.js | 144 | Project data model |
| js/renderer.js | 294 | Rendering engine |
| js/mcp-server.js | 450 | AI integration |
| js/components.js | 157 | UI components |
| js/main.js | 161 | Initialization |

**Total Code:** ~3,900 lines JavaScript/CSS/HTML

---

## 8. File Structure

```
project-root/
├── index.html                 # Main application entry
├── style.css                  # Global styles and UI
├── editor.js                  # Main application logic
├── config.json                # Layout and theme definitions
├── manifest.json              # Extended component registry
├── README.md                  # Basic documentation
│
├── js/                        # JavaScript modules
│   ├── main.js               # Application initialization
│   ├── registry.js           # ComponentRegistry class
│   ├── project.js            # Project data model
│   ├── renderer.js           # Renderer class
│   ├── mcp-server.js         # MCPServer class
│   └── components.js         # UI component templates
│
├── docs/                      # Documentation
│   ├── PROJECT.md            # Project overview
│   └── architecture.md       # Architecture diagrams
│
├── examples/                  # Example data
│   └── ai-conversations.json # Sample AI interactions
│
├── presentations/             # Presentation templates
│   ├── base.css              # Base styles
│   └── layouts/              # Layout templates
│       ├── layout-title.html
│       ├── layout-bullets.html
│       ├── layout-two-column.html
│       ├── layout-quote.html
│       ├── layout-agenda.html
│       ├── layout-timeline.html
│       ├── layout-comparison.html
│       ├── layout-team.html
│       ├── layout-features.html
│       ├── layout-flowchart.html
│       ├── layout-mermaid.html
│       └── layout-thankyou.html
│
├── website/                   # Website templates
│   ├── base.css
│   └── layouts/
│       ├── hero.html
│       ├── features.html
│       ├── about.html
│       ├── cta.html
│       └── footer.html
│
├── resume/                    # Resume templates
│   ├── base.css
│   └── layouts/
│       ├── header.html
│       ├── section.html
│       └── skills.html
│
└── posts/                     # Social post templates
    ├── base.css
    └── layouts/
        ├── instagram-square.html
        ├── instagram-story.html
        ├── linkedin-post.html
        ├── twitter-post.html
        ├── facebook-post.html
        └── youtube-thumbnail.html
```

---

## 9. API Reference

### 9.1 Core Functions

**Editor Functions (editor.js):**

| Function | Parameters | Description |
|----------|------------|-------------|
| `init()` | - | Initialize editor |
| `selectContentType(type)` | string | Switch content type |
| `addNewItem()` | - | Open layout library |
| `addItemWithLayout(id)` | string | Create item from layout |
| `duplicateItem()` | - | Copy current item |
| `deleteItem()` | - | Remove current item |
| `changeItem(index)` | number | Select item by index |
| `updateContent(field, value)` | string, string | Update slot content |
| `updateColor(type, value)` | string, string | Update color |
| `changeLayout(id)` | string | Switch layout |
| `changeAnimation(anim)` | string | Set animation |
| `undo()` / `redo()` | - | History navigation |
| `zoomIn()` / `zoomOut()` | - | Adjust zoom |
| `saveProject()` | - | Download JSON |
| `loadProject()` | - | Upload JSON |
| `doExport()` | - | Export to selected format |

**Project Class (js/project.js):**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createNew(name)` | string | Project | Initialize new project |
| `addPage(layoutId, data)` | string, object | Page | Add new page |
| `removePage(id)` | string | - | Delete page |
| `updatePageContent(id, content)` | string, object | Page | Update content |
| `updatePageStyle(id, styles)` | string, object | Page | Update styles |
| `getPage(id)` | string | Page | Get page by ID |
| `setTheme(id)` | string | - | Change theme |
| `duplicatePage(id)` | string | Page | Clone page |
| `toJSON()` | - | object | Serialize |
| `saveToStorage(key)` | string | - | Persist to LocalStorage |
| `loadFromStorage(key)` | string | Project | Restore from LocalStorage |
| `exportProject()` | - | string | Export as JSON string |
| `importProject(json)` | string | boolean | Import from JSON |

**Renderer Class (js/renderer.js):**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `init()` | - | Promise | Initialize renderer |
| `renderProject(project, opts)` | Project, object | string | Render full project |
| `renderPage(page, theme, opts)` | Page, string, object | string | Render single page |
| `renderPageContent(page, layout, theme)` | Page, Layout, Theme | string | Render content |
| `renderSlot(name, content, comp, layout, theme)` | string, string, object, Layout, Theme | string | Render slot |

**MCPServer Class (js/mcp-server.js):**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `callTool(name, args)` | string, object | object | Execute tool |
| `getToolDescriptions()` | - | array | List available tools |
| `generateSlotContent(slot, topic, tone, lang, max)` | string, string, string, string, number | string | Generate text |

---

## 10. Development Guide

### 10.1 Adding a New Layout

1. **Add to config.json:**
```json
{
  "id": "new-layout",
  "name": "New Layout",
  "category": "presentation",
  "icon": "🆕",
  "slots": {
    "heading": { "type": "text", "placeholder": "Heading" },
    "body": { "type": "textarea", "placeholder": "Body text" }
  }
}
```

2. **Add to getDefaultLayouts() in editor.js** (for fallback)

3. **Create HTML template** (optional, for complex layouts)

4. **Add CSS styles** to style.css or base.css

5. **Test:** Refresh editor, select layout, verify rendering

### 10.2 Adding a New Content Type

1. **Add CONTENT_TYPES entry:**
```javascript
newtype: {
  name: 'New Type',
  icon: 'fa-icon',
  aspectRatio: '16/9',
  width: 960,
  height: 540,
  sidebarTitle: 'Items',
  emptyMessage: 'Add your first item',
  addButtonText: 'Add Item',
  itemName: 'item',
  folder: 'newfolder',
  exportFormats: ['html', 'pdf']
}
```

2. **Create folder structure:**
```
newfolder/
├── base.css
└── layouts/
```

3. **Update category mapping:**
```javascript
// In getFilteredLayouts()
const configMap = {
  'newtype': 'newcategory',
  // ...
};
```

4. **Add toolbar controls** in index.html

5. **Update dimensions function:**
```javascript
// In getDimensionsForType()
'newtype': { width: 960, height: 540 }
```

### 10.3 Adding a New Export Format

1. **Add to exportFormats array** in CONTENT_TYPES

2. **Add label** in updateExportFormats()

3. **Create export function:**
```javascript
function exportNEWFORMAT() {
  // Implementation
}
```

4. **Add case** in doExport() switch statement

---

## 11. Future Roadmap

### 11.1 Short Term (v1.1)

- [ ] ZIP export for websites
- [ ] Animation preview in editor
- [ ] Multiple themes per project
- [ ] Custom font upload
- [ ] Image upload/placement
- [ ] Speaker notes for presentations

### 11.2 Medium Term (v2.0)

- [ ] React/Vue frontend rewrite
- [ ] Backend with user accounts
- [ ] Cloud storage and sync
- [ ] Real-time collaboration
- [ ] Component marketplace
- [ ] Brand kit (fonts, logos, colors)
- [ ] Mobile-responsive editing

### 11.3 Long Term (v3.0)

- [ ] AI-powered layout suggestions
- [ ] Automatic content generation from URLs
- [ ] Voice-to-text content input
- [ ] Analytics and engagement tracking
- [ ] Native mobile apps
- [ ] Plugin system for custom components
- [ ] White-label licensing

---

## 12. Conclusion

This Visual Content Editor represents a well-architected solution for multi-format content creation with AI integration capabilities. The modular design enables easy extension of content types, layouts, and export formats. The separation of structure (layouts), content (data), and presentation (themes) provides flexibility while maintaining simplicity.

Key strengths:
- Clean separation of concerns
- Multiple export formats
- AI-ready architecture via MCP
- Extensible layout system
- Responsive UI design

Areas for enhancement:
- ZIP export not fully implemented
- Image upload capabilities missing
- No backend/cloud features
- Limited animation system

**Total Analysis:**
- 9 JavaScript modules
- 4 content types
- 39+ layout templates
- 4 color themes
- 6 export formats
- 11 MCP tools
- ~3,900 lines of code

---

*Document generated from comprehensive codebase analysis*
*Last updated: 2026-02-05*
