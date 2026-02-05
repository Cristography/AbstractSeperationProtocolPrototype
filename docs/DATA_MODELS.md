# Data Models & State Management

## Overview

This document defines all data structures, state management patterns, and serialization formats used in the Visual Content Editor.

---

## 1. Core Data Models

### 1.1 Project Model

**Primary State Container**

```typescript
interface Project {
  type: ContentType;
  items: Item[];
  currentIndex: number;
  zoom: number;
  theme: Theme | null;
}

type ContentType = 'presentation' | 'website' | 'resume' | 'post';
```

**JavaScript Implementation (editor.js lines 57-65):**
```javascript
let project = {
  type: null,           // Current content type identifier
  items: [],            // Array of content items
  currentIndex: 0,      // Active item index
  zoom: 0.6,            // Canvas zoom level (0.5 - 1.5)
  theme: null           // Current theme object
};
```

**Default Values:**
- `zoom`: 0.6 (60% scale for comfortable editing)
- `currentIndex`: 0 (first item selected by default)
- `type`: null until user selects from welcome modal

---

### 1.2 Item Model

**Individual Content Unit (Slide/Section/Page/Post)**

```typescript
interface Item {
  id: string;                    // Unique identifier
  layout: string;                // Layout template ID
  content: Record<string, string>; // Slot ID → content mapping
  colors: ColorScheme;           // Item-specific colors
  animation: string;             // Animation type
}

interface ColorScheme {
  bg: string;        // Background color (hex)
  text: string;      // Text color (hex)
  primary: string;   // Primary accent (hex)
  secondary: string; // Secondary accent (hex)
}
```

**JavaScript Implementation (editor.js lines 262-273):**
```javascript
const item = {
  id: generateId(),           // e.g., "k2p9r7m4n1q8"
  layout: layoutId,           // e.g., "title-slide"
  content: {},                // Populated from layout slots
  colors: { ...project.theme.colors }, // Copied from theme
  animation: 'none'           // Animation type
};

// Content population
Object.keys(layout.slots || {}).forEach(slotId => {
  item.content[slotId] = layout.slots[slotId].placeholder || '';
});
```

**Example Item Instance:**
```json
{
  "id": "k2p9r7m4n1q8",
  "layout": "title-slide",
  "content": {
    "title": "My Presentation",
    "subtitle": "A great talk"
  },
  "colors": {
    "bg": "#ffffff",
    "text": "#333333",
    "primary": "#3b82f6",
    "secondary": "#64748b"
  },
  "animation": "none"
}
```

---

### 1.3 Theme Model

**Color and Style Configuration**

```typescript
interface Theme {
  id: string;           // Theme identifier
  name: string;         // Display name
  colors: ColorScheme;  // Color palette
}
```

**Built-in Themes (config.json lines 27-32):**
```json
[
  {
    "id": "clean-white",
    "name": "Clean White",
    "colors": {
      "bg": "#ffffff",
      "text": "#333333",
      "primary": "#3b82f6",
      "secondary": "#64748b"
    }
  },
  {
    "id": "dark-mode",
    "name": "Dark Mode",
    "colors": {
      "bg": "#1a1a2e",
      "text": "#ffffff",
      "primary": "#6366f1",
      "secondary": "#94a3b8"
    }
  },
  {
    "id": "warm-sand",
    "name": "Warm Sand",
    "colors": {
      "bg": "#fffbeb",
      "text": "#78350f",
      "primary": "#f59e0b",
      "secondary": "#d97706"
    }
  },
  {
    "id": "nature-green",
    "name": "Nature Green",
    "colors": {
      "bg": "#ecfdf5",
      "text": "#064e3b",
      "primary": "#10b981",
      "secondary": "#059669"
    }
  }
]
```

**Color Usage Patterns:**
- `bg`: Item background, slide background
- `text`: Body text, paragraphs
- `primary`: Headings, buttons, accents, links
- `secondary`: Subheadings, captions, muted text

---

### 1.4 Layout Model

**Template Definition Structure**

```typescript
interface Layout {
  id: string;                    // Unique layout ID
  name: string;                  // Display name
  category: string;              // Content type category
  icon: string;                  // Emoji icon
  slots: Record<string, Slot>;   // Editable fields
}

interface Slot {
  type: 'text' | 'textarea';     // Input type
  placeholder: string;           // Default hint text
}
```

**Example Layout Definitions:**

```json
// Title Slide (config.json line 4)
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

// Two Column Layout (config.json line 6)
{
  "id": "two-column",
  "name": "Two Columns",
  "category": "presentation",
  "icon": "🔀",
  "slots": {
    "heading": {
      "type": "text",
      "placeholder": "Section heading"
    },
    "leftTitle": {
      "type": "text",
      "placeholder": "Left title"
    },
    "leftBody": {
      "type": "textarea",
      "placeholder": "Left content"
    },
    "rightTitle": {
      "type": "text",
      "placeholder": "Right title"
    },
    "rightBody": {
      "type": "textarea",
      "placeholder": "Right content"
    }
  }
}
```

**Slot Type Behaviors:**

| Type | Input Element | Use Case |
|------|--------------|----------|
| `text` | `<input type="text">` | Short text: titles, headings, single lines |
| `textarea` | `<textarea>` | Long text: body content, descriptions |

---

## 2. Content Type Configurations

### 2.1 CONTENT_TYPES Object

**Central Configuration for All Content Types (editor.js lines 1-55):**

```javascript
const CONTENT_TYPES = {
  presentation: {
    name: 'Presentation',
    icon: 'fa-play-circle',
    aspectRatio: '16/9',
    width: 960,
    height: 540,
    sidebarTitle: 'Slides',
    emptyMessage: 'Add your first slide',
    addButtonText: 'Add Slide',
    itemName: 'slide',
    folder: 'presentations',
    exportFormats: ['html', 'pptx', 'pdf']
  },
  
  website: {
    name: 'Website',
    icon: 'fa-globe',
    aspectRatio: 'auto',
    width: 1200,
    height: 'auto',
    sidebarTitle: 'Sitemap',
    emptyMessage: 'Add your first section',
    addButtonText: 'Add Section',
    itemName: 'section',
    folder: 'website',
    exportFormats: ['html', 'zip']
  },
  
  resume: {
    name: 'Resume',
    icon: 'fa-file-alt',
    aspectRatio: '210mm/297mm',
    width: 794,
    height: 1123,
    sidebarTitle: 'Pages',
    emptyMessage: 'Add your first section',
    addButtonText: 'Add Section',
    itemName: 'page',
    folder: 'resume',
    exportFormats: ['pdf', 'html']
  },
  
  post: {
    name: 'Social Post',
    icon: 'fa-share-alt',
    aspectRatio: '1/1',
    width: 1080,
    height: 1080,
    sidebarTitle: 'Posts',
    emptyMessage: 'Add your first post',
    addButtonText: 'New Post',
    itemName: 'post',
    folder: 'posts',
    exportFormats: ['png', 'jpg', 'html']
  }
};
```

**Property Reference:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name in UI |
| `icon` | string | Font Awesome icon class |
| `aspectRatio` | string | CSS aspect-ratio value |
| `width` | number/string | Preview width (px or 'auto') |
| `height` | number/string | Preview height (px or 'auto') |
| `sidebarTitle` | string | Label for sidebar header |
| `emptyMessage` | string | Message when no items exist |
| `addButtonText` | string | Label for add button |
| `itemName` | string | Singular noun for item |
| `folder` | string | Folder name for templates |
| `exportFormats` | string[] | Available export formats |

---

## 3. State Management Patterns

### 3.1 History (Undo/Redo)

**Implementation (editor.js lines 68-116):**

```javascript
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

function saveState() {
  // Serialize current state
  const state = JSON.stringify({
    items: project.items,
    currentIndex: project.currentIndex,
    theme: project.theme
  });
  
  // Truncate future if we're in middle of history
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  
  // Enforce size limit
  if (history.length >= MAX_HISTORY) {
    history.shift();
  }
  
  // Add new state
  history.push(state);
  historyIndex = history.length - 1;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreState(history[historyIndex]);
    renderAll();
    showToast('Undo');
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreState(history[historyIndex]);
    renderAll();
    showToast('Redo');
  }
}

function restoreState(stateJson) {
  const state = JSON.parse(stateJson);
  project.items = state.items;
  project.currentIndex = state.currentIndex;
  project.theme = state.theme;
  saveProjectToStorage();
}
```

**History State Capture Points:**
- Content field changes
- Layout changes
- Theme applications
- Color updates
- Item reordering
- Item duplication/deletion

**Memory Management:**
- Maximum 50 history states
- Oldest states discarded when limit reached
- Each state is JSON string (~10-50KB depending on content)
- Total memory: ~0.5-2.5MB for full history

---

### 3.2 Persistence (LocalStorage)

**Storage Schema:**

```javascript
// Storage Key: 'visualEditorProject'
{
  "type": "presentation",
  "items": [...],
  "currentIndex": 2,
  "zoom": 0.8,
  "theme": {
    "id": "clean-white",
    "name": "Clean White",
    "colors": {...}
  }
}
```

**Storage Functions (editor.js lines 1169-1182):**

```javascript
function saveProjectToStorage() {
  localStorage.setItem('visualEditorProject', JSON.stringify(project));
}

function loadProjectFromStorage() {
  const saved = localStorage.getItem('visualEditorProject');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      project = parsed;
      currentContentType = project.type || 'presentation';
    } catch (e) {
      console.error('Failed to load project:', e);
    }
  }
}
```

**Auto-Save Triggers:**
- Every 30 seconds (if implemented)
- On content change
- On layout change
- On theme change
- On color update
- On item reorder
- Before window unload

**Storage Limits:**
- LocalStorage: ~5-10MB per domain
- Typical project: 10-100KB
- Max projects: ~50-100 full projects

---

### 3.3 File Import/Export

**Export Format (JSON):**

```javascript
function saveProject() {
  const data = JSON.stringify(project, null, 2);
  downloadFile(
    data, 
    `project-${currentContentType}-${Date.now()}.json`, 
    'application/json'
  );
}
```

**File Structure:**
```json
{
  "type": "presentation",
  "items": [
    {
      "id": "abc123",
      "layout": "title-slide",
      "content": {
        "title": "Hello World",
        "subtitle": "My first slide"
      },
      "colors": {
        "bg": "#ffffff",
        "text": "#333333",
        "primary": "#3b82f6",
        "secondary": "#64748b"
      },
      "animation": "fade"
    }
  ],
  "currentIndex": 0,
  "zoom": 0.6,
  "theme": {
    "id": "clean-white",
    "name": "Clean White",
    "colors": {...}
  }
}
```

**Import Process:**
```javascript
function handleFileLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const loaded = JSON.parse(e.target.result);
      
      // Validate structure
      if (!loaded.type || !Array.isArray(loaded.items)) {
        throw new Error('Invalid project file');
      }
      
      // Apply loaded project
      project = loaded;
      currentContentType = project.type || 'presentation';
      
      // Initialize UI
      document.getElementById('welcomeModal').classList.remove('show');
      document.getElementById('mainToolbar').style.display = 'flex';
      document.getElementById('mainContainer').style.display = 'flex';
      
      updateUIForContentType();
      renderAll();
      showToast('Project loaded!');
    } catch (err) {
      alert('Invalid project file');
    }
  };
  reader.readAsText(file);
}
```

---

## 4. Advanced Data Patterns

### 4.1 ComponentRegistry (js/registry.js)

**Extended Model for Component System:**

```javascript
class ComponentRegistry {
  constructor() {
    this.manifest = null;
    this.loaded = false;
  }
  
  // Data Access Methods
  getLayouts() → Object      // All layouts by ID
  getComponents() → Object   // All components
  getThemes() → Object       // All themes
  
  // Individual Item Access
  getLayout(id) → Layout
  getComponent(id) → Component
  getTheme(id) → Theme
  
  // Filtered Access
  getLayoutsByCategory(category) → Layout[]
  getAvailableSlots(layoutId) → string[]
  
  // Validation
  getConstraints(layoutId, slotName) → Constraints
  validateContent(layoutId, slotName, content) → ValidationResult
}
```

**Validation Result Structure:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface Constraints {
  maxChars?: number;
  required?: boolean;
  maxWidth?: number;
  aspectRatio?: string;
}
```

---

### 4.2 Project Class (js/project.js)

**Advanced Project Management:**

```javascript
class Project {
  constructor() {
    this.id = null;
    this.name = 'Untitled Project';
    this.pages = [];
    this.theme = 'modern';
    this.createdAt = null;
    this.updatedAt = null;
    this.metadata = {};
  }
  
  // CRUD Operations
  createNew(name) → Project
  addPage(layoutId, data) → Page
  removePage(pageId)
  updatePageContent(pageId, content) → Page
  updatePageStyle(pageId, styles) → Page
  duplicatePage(pageId) → Page
  
  // Queries
  getPage(pageId) → Page
  getPageByOrder(order) → Page
  
  // Theming
  setTheme(themeId)
  
  // Serialization
  toJSON() → Object
  exportProject() → string
  importProject(jsonString) → boolean
  
  // Persistence
  saveToStorage(key)
  loadFromStorage(key) → Project
}
```

**Page Structure:**
```typescript
interface Page {
  id: string;
  layoutId: string;
  content: Record<string, string>;
  styleOverrides: Record<string, string>;
  animations: string[];
  order: number;
}
```

---

## 5. Serialization Formats

### 5.1 Internal JSON Format

**Complete Project Export:**
```json
{
  "version": "1.0",
  "type": "presentation",
  "name": "My Project",
  "createdAt": "2026-02-05T10:30:00.000Z",
  "updatedAt": "2026-02-05T11:45:00.000Z",
  "theme": {
    "id": "clean-white",
    "name": "Clean White",
    "colors": {
      "bg": "#ffffff",
      "text": "#333333",
      "primary": "#3b82f6",
      "secondary": "#64748b"
    }
  },
  "items": [
    {
      "id": "page_k2p9r7m4n1q8",
      "layout": "title-slide",
      "content": {
        "title": "Welcome",
        "subtitle": "To my presentation"
      },
      "colors": {
        "bg": "#ffffff",
        "text": "#333333",
        "primary": "#3b82f6",
        "secondary": "#64748b"
      },
      "animation": "fade",
      "order": 0
    }
  ],
  "settings": {
    "zoom": 0.6,
    "currentIndex": 0
  }
}
```

### 5.2 MCP Tool Input/Output

**get_available_components Response:**
```json
{
  "success": true,
  "layouts": [
    {
      "id": "title-slide",
      "name": "Title Slide",
      "category": "presentation",
      "slots": ["title", "subtitle"],
      "constraints": {
        "title": { "maxChars": 50, "required": true },
        "subtitle": { "maxChars": 100, "required": false }
      }
    }
  ],
  "themes": [
    {
      "id": "modern",
      "name": "Modern Clean",
      "colors": { "primary": "#3B82F6", "secondary": "#10B981" }
    }
  ],
  "totalLayouts": 39
}
```

**create_page Request:**
```json
{
  "layoutId": "title-slide",
  "content": {
    "title": "My Title",
    "subtitle": "My Subtitle"
  },
  "theme": "modern"
}
```

**create_page Response:**
```json
{
  "success": true,
  "pageId": "page_abc123",
  "layoutId": "title-slide",
  "totalPages": 5,
  "message": "Page created successfully using layout \"Title Slide\""
}
```

---

## 6. State Transition Diagrams

### 6.1 Item Lifecycle

```
┌─────────────┐
│   Create    │───► Layout Selection
│  (Start)    │
└─────────────┘
       │
       ▼
┌─────────────┐
│   Active    │───► User edits content
│   (Edit)    │───► User changes colors
└─────────────┘
       │
       ├──► Duplicate ───► New Item
       │
       ├──► Delete ─────► Remove
       │
       ├──► Reorder ────► Change Position
       │
       ▼
┌─────────────┐
│   Export    │───► HTML/PPTX/PDF/PNG
│   (Output)  │
└─────────────┘
```

### 6.2 Theme Application Flow

```
User Selects Theme
       │
       ▼
┌─────────────┐
│ Save State  │───► Add to undo history
└─────────────┘
       │
       ▼
┌─────────────┐
│ Apply to    │───► project.theme = newTheme
│   Project   │
└─────────────┘
       │
       ▼
┌─────────────┐
│ Copy to All │───► item.colors = theme.colors
│    Items    │     (for each item)
└─────────────┘
       │
       ▼
┌─────────────┐
│   Render    │───► Update canvas preview
└─────────────┘
       │
       ▼
┌─────────────┐
│  Persist    │───► Save to LocalStorage
└─────────────┘
```

---

## 7. Validation Rules

### 7.1 Content Validation

**Character Limits:**
```javascript
// Default constraints from config.json
{
  "title": { "maxChars": 50, "required": true },
  "subtitle": { "maxChars": 100, "required": false },
  "heading": { "maxChars": 60, "required": true },
  "body": { "maxChars": 500, "required": true }
}
```

**Validation Function (js/registry.js lines 59-77):**
```javascript
validateContent(layoutId, slotName, content) {
  const constraints = this.getConstraints(layoutId, slotName);
  if (!constraints) return { valid: true };
  
  const errors = [];
  
  if (constraints.required && (!content || content.trim() === '')) {
    errors.push(`${slotName} is required`);
  }
  
  if (constraints.maxChars && content?.length > constraints.maxChars) {
    errors.push(
      `${slotName} exceeds max ${constraints.maxChars} ` +
      `characters (current: ${content.length})`
    );
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 7.2 Data Integrity Rules

**Project Validation:**
- `type` must be one of: 'presentation', 'website', 'resume', 'post'
- `items` must be an array
- `currentIndex` must be >= 0 and < items.length
- Each item must have: `id`, `layout`, `content`, `colors`
- `zoom` must be between 0.5 and 1.5

**Item Validation:**
- `id` must be unique within project
- `layout` must exist in registry
- `content` keys must match layout slots
- `colors` must have: bg, text, primary, secondary
- `animation` must be valid animation type

---

## 8. Data Migration

### 8.1 Version Compatibility

**Current Version: 1.0**

**Future Migration Strategy:**
```javascript
function migrateProject(data) {
  const version = data.version || '1.0';
  
  switch(version) {
    case '1.0':
      // Current version, no migration needed
      return data;
      
    case '0.9':
      // Example: Migrate old format to new
      data.items = data.items.map(item => ({
        ...item,
        animation: item.animation || 'none'
      }));
      data.version = '1.0';
      return data;
      
    default:
      throw new Error(`Unsupported project version: ${version}`);
  }
}
```

### 8.2 Backup Strategy

**Automatic Backups:**
```javascript
function createBackup() {
  const timestamp = Date.now();
  const key = `visualEditor_backup_${timestamp}`;
  localStorage.setItem(key, JSON.stringify(project));
  
  // Keep only last 10 backups
  const backups = Object.keys(localStorage)
    .filter(k => k.startsWith('visualEditor_backup_'))
    .sort();
  
  while (backups.length > 10) {
    localStorage.removeItem(backups.shift());
  }
}
```

---

## 9. Performance Optimization

### 9.1 Memory Management

**Large Project Handling:**
```javascript
// Lazy loading of item previews
function getItemPreview(item) {
  // Only check first non-empty field
  const keys = Object.keys(item.content);
  for (const key of keys) {
    if (item.content[key] && item.content[key].length > 0) {
      return item.content[key].substring(0, 25);
    }
  }
  return 'Empty';
}
```

**Debounced Saves:**
```javascript
// Debounce rapid changes
let saveTimeout;
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveProjectToStorage();
  }, 500);
}
```

### 9.2 Rendering Optimization

**Batch DOM Updates:**
```javascript
function renderAll() {
  // Batch all UI updates in single frame
  requestAnimationFrame(() => {
    renderSidebar();
    renderItem();
    renderFields();
    updateCounter();
    populateLayoutSelect();
  });
}
```

**Canvas Optimization:**
```javascript
// Scale down for preview, scale up for export
const PREVIEW_SCALE = 0.6;
const EXPORT_SCALE = 2.0;
```

---

## 10. Error Handling

### 10.1 Data Validation Errors

```javascript
try {
  const project = JSON.parse(savedData);
  
  // Validate required fields
  if (!project.type) {
    throw new ValidationError('Missing project type');
  }
  
  if (!Array.isArray(project.items)) {
    throw new ValidationError('Invalid items array');
  }
  
  // Validate each item
  project.items.forEach((item, index) => {
    if (!item.id) {
      throw new ValidationError(`Item ${index} missing ID`);
    }
    
    if (!item.layout) {
      throw new ValidationError(`Item ${index} missing layout`);
    }
  });
  
} catch (error) {
  if (error instanceof ValidationError) {
    showToast(`Invalid project: ${error.message}`);
  } else {
    showToast('Corrupted project file');
  }
  console.error('Project load error:', error);
}
```

### 10.2 Storage Errors

```javascript
function saveProjectToStorage() {
  try {
    const data = JSON.stringify(project);
    localStorage.setItem('visualEditorProject', data);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      showToast('Storage full. Please export and clear.');
    } else {
      showToast('Failed to save project');
    }
  }
}
```

---

## Summary

**Key Data Models:**
1. **Project** - Root container with metadata and items array
2. **Item** - Individual content unit with layout, content, and styling
3. **Theme** - Color scheme configuration
4. **Layout** - Template definition with slots

**State Management:**
- History: 50-state undo/redo with JSON serialization
- Persistence: LocalStorage with automatic saves
- Import/Export: JSON files for backup and sharing

**Validation:**
- Content constraints (max chars, required fields)
- Data integrity (structure, types, references)
- Version compatibility for migrations

**Performance:**
- Debounced saves to reduce I/O
- Lazy loading for large datasets
- Batch rendering for smooth UI

---

*This document provides complete specifications for all data structures and state management patterns*
