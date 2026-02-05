# Visual Editor - Project Documentation

## Overview
A modular visual content editor for creating presentations, websites, resumes, and social media posts with a unified workflow.

## Project Structure

```
├── index.html          # Main editor UI
├── editor.js          # Core editor logic
├── style.css          # Editor UI styles
├── config.json        # Layouts and themes configuration
├── docs/
│   └── ARCHITECTURE.md
├── presentations/    # Presentation layouts (16:9)
│   └── layouts/
├── posts/            # Social media layouts
│   └── layouts/
├── resume/           # Resume layouts (A4)
│   └── layouts/
└── website/          # Website section layouts
    └── layouts/
```

## Content Types

### 1. Presentation (16:9)
- **Aspect Ratio**: 16:9 (960x540 preview)
- **Features**: Slide navigation, animations, speaker notes
- **Export Formats**: HTML, PPTX, PDF
- **Layouts**: Title, Content, Two Columns, Quote, Agenda, Statistics, Timeline, Thank You

### 2. Website (Long Scrolling)
- **Type**: Continuous sections that form a full page
- **Features**: Sitemap view, section reordering, mobile responsive
- **Export Formats**: HTML, ZIP
- **Layouts**: Hero, Features, About, CTA, Footer

### 3. Resume (A4 Format)
- **Type**: Multi-page professional documents
- **Dimensions**: 794x1123px (A4 at 96 DPI)
- **Features**: Header, Sections, Skills, Print-ready
- **Export Formats**: PDF, HTML
- **Layouts**: Header, Section, Skills

### 4. Social Post (Various Sizes)
- **Features**: Multiple platform support
- **Export Formats**: PNG, JPG, HTML
- **Layouts**: Instagram Square, Instagram Story, LinkedIn, Twitter/X, Facebook, YouTube Thumbnail

## Configuration (config.json)

### Layout Structure
```json
{
  "id": "unique-id",
  "name": "Layout Name",
  "category": "presentation|website|resume|social",
  "icon": "📄",
  "slots": {
    "fieldId": {
      "type": "text|textarea",
      "placeholder": "Default text"
    }
  }
}
```

### Theme Structure
```json
{
  "id": "theme-id",
  "name": "Theme Name",
  "colors": {
    "bg": "#ffffff",
    "text": "#333333",
    "primary": "#3b82f6",
    "secondary": "#64748b"
  }
}
```

## State Management

### Project State
```javascript
let project = {
  type: 'presentation',           // Current content type
  items: [],                       // Array of items/slides/sections
  currentIndex: 0,                // Currently selected item
  zoom: 0.6,                       // Canvas zoom level
  theme: {                         // Current theme
    id: 'clean-white',
    colors: { ... }
  }
};
```

### Item Structure
```javascript
{
  id: "generated-id",
  layout: "layout-id",
  content: {
    "heading": "Text content",
    "body": "Longer text..."
  },
  colors: {
    "bg": "#ffffff",
    "text": "#333333",
    "primary": "#3b82f6",
    "secondary": "#64748b"
  },
  animation: "none|fade|slide-up|..."
}
```

## Key Functions

### Core
- `selectContentType(type)` - Switch between content types
- `addNewItem()` - Open layout library
- `addItemWithLayout(layoutId)` - Create new item from layout
- `renderAll()` - Update entire UI

### Navigation
- `changeItem(index)` - Select item by index
- `prevItem()` / `nextItem()` - Navigate items
- `duplicateItem()` / `deleteItem()` - Item management

### Rendering
- `renderItem()` - Render current item
- `renderSidebar()` - Update sidebar navigation
- `renderFields()` - Populate properties panel

### Zoom
- `zoomIn()` / `zoomOut()` - Adjust canvas zoom
- Default: 60%, Range: 50% - 150%

## User Workflow

1. **Welcome Screen** → Select content type
2. **Add Item** → Choose layout from library
3. **Edit Content** → Click text to edit inline
4. **Customize** → Use properties panel for colors/layout
5. **Navigate** → Use sidebar or arrows
6. **Export** → Download in desired format

## CSS Architecture

### Editor UI (style.css)
- Dark theme with accent colors
- Flexbox/Grid layouts
- Responsive modals
- Property panels

### Content Styles (per type)
Each content type folder has its own `base.css` for content-specific styling:
- Presentations: 16:9 aspect ratio, slide shadows
- Posts: Platform-specific sizes
- Resume: A4 dimensions, print-ready
- Website: Full-width, scrolling sections

## Planned Features

### High Priority
- [ ] Export to PPTX (PowerPoint)
- [ ] Export to PDF with proper page breaks
- [ ] Export images as PNG/JPG
- [ ] Drag & drop reordering of slides/sections
- [ ] Auto-save to localStorage

### Medium Priority
- [ ] Animation preview in editor
- [ ] Undo/Redo support
- [ ] Keyboard shortcuts
- [ ] Multiple themes per project
- [ ] Custom color picker

### Lower Priority
- [ ] Mermaid diagram support
- [ ] Font Awesome icons picker
- [ ] Image upload/placement
- [ ] Collaboration features
- [ ] Cloud save/load
- [ ] Template library
- [ ] Brand kit (colors, fonts, logos)
- [ ] Analytics dashboard
- [ ] Presentation mode (fullscreen)
- [ ] Speaker notes view
- [ ] Export to Google Slides

## Development Notes

### Adding New Layouts
1. Add to `config.json` layouts array
2. Create HTML template in appropriate folder (optional - currently using dynamic rendering)
3. Restart editor to pick up changes

### Adding New Content Type
1. Add entry to `CONTENT_TYPES` in `editor.js`
2. Create folder with `layouts/` subfolder
3. Add to category mapping in `getFilteredLayouts()`
4. Update `getDimensionsForType()`

### Debug Mode
Open browser console (F12) to see:
- Layout loading logs
- Item creation logs
- Error messages

## Dependencies
- Font Awesome 6.5.1 (icons)
- No other external dependencies for core functionality

## Browser Support
- Chrome/Edge (recommended)
- Firefox
- Safari

## Version History

### v1.0.0 (Current)
- Initial category-first workflow
- 4 content types implemented
- Basic CRUD operations
- Theme system
- Save/Load functionality
- HTML export
