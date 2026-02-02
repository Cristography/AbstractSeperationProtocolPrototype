# AI Content Generation System

A modular, scalable system for generating editable visual content (presentations, social media carousels, resumes, website sections) using AI-generated structured data.

## Architecture Overview

The system separates concerns into distinct layers:

### 1. Component Registry (`manifest.json`)
- **Layouts**: Predefined page structures (intro slides, content slides, carousels, etc.)
- **Components**: Reusable elements (headings, body text, CTAs, diagrams)
- **Themes**: Color schemes, fonts, and styling defaults

Each component includes:
- Metadata (id, name, category)
- Slots (where content goes)
- Constraints (max chars, required fields)
- CSS defaults and editable properties

### 2. Project System (`js/project.js`)
- Stores structure + content separately
- Enables content reuse, translation, and editing
- LocalStorage persistence

### 3. Renderer (`js/renderer.js`)
- Renders structure + content as HTML/CSS
- Supports animations and theme application
- Export capabilities

### 4. Editor (`js/editor.js`)
- Visual interface for editing structure and content
- Property panel for styling
- Preview mode

### 5. MCP Server (`js/mcp-server.js`)
- AI integration layer
- Tools for AI to understand available components
- Content generation with constraints

## Usage

### Basic Setup
```bash
# Open in browser
open index.html
```

### Quick Start
1. Click "+ Add Page" to select a layout
2. Edit content in the right panel
3. Apply themes
4. Export as HTML or JSON

### AI Integration
The MCP server exposes these tools:
- `get_available_components` - List layouts by category
- `get_component_details` - Get layout constraints
- `generate_content` - Generate content for a layout
- `create_page` - Add page to project
- `update_page_content` - Update specific content
- `apply_theme` - Change theme
- `generate_presentation` - Create multi-slide presentation
- `validate_content` - Check constraints

### Example AI Prompt
```
Create a presentation about machine learning with 5 slides
```

The AI will:
1. Select appropriate layouts
2. Generate content for each slot
3. Respect constraints (max chars)
4. Create pages in the project

## Project Structure
```
├── manifest.json         # Component registry
├── index.html           # Editor interface
├── css/
│   └── styles.css       # Editor styles
└── js/
    ├── registry.js      # Component registry
    ├── project.js       # Project management
    ├── renderer.js      # HTML/CSS rendering
    ├── mcp-server.js    # AI tools
    ├── editor.js        # Visual editor
    └── main.js          # Initialization
```

## Export Formats
- **HTML**: Full rendered output
- **JSON**: Project data (structure + content)
- **PDF**: Via browser print

## Scaling Path

### Current (MVP)
- Pure HTML/CSS/JS
- LocalStorage persistence
- Basic editor

### Future Versions
1. **React/Vue frontend** - Better state management
2. **Backend (Node/Django)** - User accounts, cloud storage
3. **PPTX export** - Native PowerPoint files
4. **Component marketplace** - Share templates
5. **Real-time collaboration** - Multiple editors
6. **AI API integration** - OpenAI/Anthropic APIs

## Key Design Decisions

### Separation of Structure and Content
- Structure defines WHERE content goes
- Content defines WHAT is displayed
- Enables reuse, translation, and editing

### Constraint-Driven AI
- AI knows max chars, required fields
- Prevents invalid outputs
- Makes AI integration predictable

### JSON-Based Architecture
- Easy to serialize/deserialize
- Works with any AI via MCP
- Extensible for new formats
