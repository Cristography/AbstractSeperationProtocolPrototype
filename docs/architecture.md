# System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Editor (index.html)                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Page List    │  │   Canvas     │  │  Properties  │   │   │
│  │  │ (Thumbnails) │  │  (Preview)   │  │    Panel     │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EDITOR LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Editor.js                           │   │
│  │  • Manage selection                                      │   │
│  │  • Update content/styles                                 │   │
│  │  • Handle user actions                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                ▼                                   ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│     PROJECT SYSTEM          │   │      MCP SERVER             │
│  ┌───────────────────────┐  │   │  ┌───────────────────────┐  │
│  │       Project.js       │  │   │  │      MCPServer        │  │
│  │  • Pages array         │  │   │  │  • get_available_comp │  │
│  │  • Content storage     │  │   │   │  • generate_content  │  │
│  │  • Theme management    │  │   │   │  • create_page       │  │
│  │  • JSON import/export  │  │   │   │  • update_page       │  │
│  └───────────────────────┘  │   │   │  • apply_theme        │  │
│                             │   │   │  • validate_content   │  │
│                             │   │   └───────────────────────┘  │
└─────────────────────────────┘   │                             │
                                  │                             │
                                  ▼                             │
┌───────────────────────────────────────────────────────────────┐
│                      RENDERER SYSTEM                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                      Renderer.js                        │  │
│  │  • Takes Project + Registry                             │  │
│  │  • Merges structure + content + theme                   │  │
│  │  • Outputs HTML/CSS                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────┐
│                        DATA LAYER                             │
│  ┌────────────────────┐     ┌────────────────────┐           │
│  │   manifest.json    │     │   LocalStorage     │           │
│  │  • Layouts         │     │  • Project state   │           │
│  │  • Components      │     │  • Auto-save       │           │
│  │  • Themes          │     │                    │           │
│  │  • Constraints     │     │                    │           │
│  └────────────────────┘     └────────────────────┘           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                      AI INTEGRATION                           │
│                                                               │
│    AI ──► MCP Tools ──► Project System ──► Renderer ──► HTML │
│                                                               │
│    Example flow:                                              │
│    1. AI: "Create presentation about X"                      │
│    2. MCP: get_available_components()                        │
│    3. MCP: generate_content(layoutId, topic)                 │
│    4. MCP: create_page(layoutId, content)                    │
│    5. Editor: Render and display                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                       EXPORT OUTPUTS                          │
│                                                               │
│    HTML ──► Browser display, PDF print, Embed                │
│    JSON ──► Project backup, AI context, Translation          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. USER ACTION
   ↓
2. EDITOR updates Project state
   ↓
3. PROJECT saves to LocalStorage
   ↓
4. RENDERER reads Project + Registry
   ↓
5. Output HTML/CSS (with theme + animations)
   ↓
6. USER edits / exports
```

## AI Interaction Flow

```
1. USER: "Create a carousel about coffee"
   ↓
2. AI calls MCP tool: generate_content(layoutId, topic)
   ↓
3. MCP returns validated content
   ↓
4. AI calls MCP tool: create_page(layoutId, content)
   ↓
5. Project updated, UI refreshes
   ↓
6. USER can edit in interface
```
