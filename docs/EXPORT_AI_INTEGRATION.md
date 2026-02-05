# Export System & AI Integration

## Overview

This document covers the complete export pipeline and AI integration architecture, including implementation details, API specifications, and usage patterns.

---

## Part 1: Export System

### 1.1 Export Architecture

**Export Flow:**
```
User selects format
       │
       ▼
┌──────────────────┐
│  Export Modal    │
│  (Format select) │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│  doExport()      │
│  (Dispatcher)    │
└──────────────────┘
       │
       ├──► exportHTML() ───► Download .html
       │
       ├──► exportPPTX() ───► Download .pptx
       │
       ├──► exportPDF() ───► Download .pdf
       │
       └──► exportImage() ──► Download .png/.jpg
```

### 1.2 Export Format Matrix

| Content Type | HTML | PPTX | PDF | PNG | JPG | ZIP |
|--------------|------|------|-----|-----|-----|-----|
| Presentation | ✓ | ✓ | ✓ | - | - | - |
| Website | ✓ | - | - | - | - | ✓ |
| Resume | ✓ | - | ✓ | - | - | - |
| Social Post | ✓ | - | - | ✓ | ✓ | - |

### 1.3 HTML Export

**Implementation (editor.js lines 879-898):**

```javascript
function exportHTML() {
  const config = CONTENT_TYPES[currentContentType];
  
  // Build HTML document
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">`;
  html += `<title>${config.name}</title>`;
  html += `<style>
    body {
      font-family: -apple-system, sans-serif;
      background: #f0f0f0;
      padding: 20px;
    }
    .item {
      background: white;
      margin: 0 auto 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
  </style></head><body>`;

  // Render each item
  project.items.forEach(item => {
    const layout = getLayoutById(item.layout);
    html += `<div class="item" style="width:${config.width}px;`;
    html += `height:${config.height === 'auto' ? 'auto' : config.height + 'px'};`;
    html += `background:${item.colors.bg};`;
    html += `color:${item.colors.text};">`;
    html += renderItemContent(layout, item);
    html += `</div>`;
  });

  html += `</body></html>`;
  
  // Trigger download
  downloadFile(html, `${config.name.toLowerCase()}-${Date.now()}.html`, 'text/html');
  showToast('HTML exported');
}
```

**Output Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Presentation</title>
  <style>
    /* Embedded styles */
  </style>
</head>
<body>
  <div class="item" style="width:960px;height:540px;">
    <!-- Content -->
  </div>
  <div class="item" style="width:960px;height:540px;">
    <!-- Content -->
  </div>
</body>
</html>
```

**Characteristics:**
- Self-contained (no external dependencies)
- Embeds all CSS styles
- Includes all items in sequence
- Light gray background to show item boundaries
- Box shadows for depth

---

### 1.4 PPTX Export (PowerPoint)

**Implementation (editor.js lines 900-972):**

```javascript
function exportPPTX() {
  const pptx = new PptxGenJS();
  
  // Configure presentation
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Presentation';
  pptx.author = 'Visual Editor';
  pptx.subject = 'Presentation';

  // Process each item
  project.items.forEach(item => {
    const slide = pptx.addSlide();
    const layout = getLayoutById(item.layout);
    
    // Convert hex to PPTX format (remove #)
    const bgColor = item.colors.bg.replace('#', '');
    const textColor = item.colors.text.replace('#', '');
    const primaryColor = item.colors.primary.replace('#', '');
    
    // Set background
    slide.background = { color: bgColor };
    
    // Render slots
    if (layout && layout.slots) {
      Object.keys(layout.slots).forEach(slotId => {
        const slot = layout.slots[slotId];
        const value = item.content[slotId] || slot.placeholder || '';
        const isTitle = slotId === 'title' || slotId === 'heading';
        const isBody = slotId === 'body' || slotId === 'subtitle';
        
        if (isTitle) {
          slide.addText(value, {
            x: 0.5,      // Inches from left
            y: 0.5,      // Inches from top
            w: 8.5,      // Width in inches
            h: 1.5,      // Height in inches
            fontSize: slotId === 'title' ? 44 : 32,
            color: primaryColor,
            bold: true,
            fontFace: 'Arial'
          });
        } else if (isBody) {
          slide.addText(value, {
            x: 0.5, y: 2, w: 8.5, h: 4,
            fontSize: 18,
            color: textColor,
            fontFace: 'Arial',
            valign: 'top',
            lineSpacingMultiple: 1.2
          });
        }
      });
    }
  });

  // Generate file
  pptx.writeFile({ fileName: 'presentation.pptx' });
  showToast('PPTX exported');
}
```

**PPTX Coordinate System:**
- Units: inches
- Slide size: 10 x 5.625 inches (16:9)
- Origin: top-left corner
- Text positioning: x, y, w, h

**Supported Features:**
- Background colors
- Text with fonts and colors
- Bold formatting
- Vertical alignment
- Line spacing

**Limitations:**
- No animations
- No embedded images
- Limited font support (system fonts only)
- Basic text formatting only

---

### 1.5 PDF Export

**Implementation (editor.js lines 974-1050):**

```javascript
async function exportPDF() {
  showToast('Generating PDF...');

  const { jsPDF } = window.jspdf;
  
  // Configure PDF
  const pdf = new jsPDF({
    orientation: currentContentType === 'resume' ? 'portrait' : 'landscape',
    unit: 'px',
    format: currentContentType === 'resume' ? 'a4' : [960, 540]
  });

  // Process each item
  for (let i = 0; i < project.items.length; i++) {
    if (i > 0) pdf.addPage();

    const item = project.items[i];
    const layout = getLayoutById(item.layout);

    // Create temporary render container
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: fixed;
      left: -9999px;
      width: ${currentContentType === 'resume' ? '794px' : '960px'};
      height: ${currentContentType === 'resume' ? '1123px' : '540px'};
      background: ${item.colors.bg};
      color: ${item.colors.text};
      padding: 40px;
      font-family: Arial, sans-serif;
    `;

    // Generate content HTML
    let html = '';
    if (layout && layout.slots) {
      Object.keys(layout.slots).forEach(slotId => {
        const slot = layout.slots[slotId];
        const value = item.content[slotId] || slot.placeholder || '';
        const isTitle = slotId === 'title' || slotId === 'heading';
        const isBody = slotId === 'body' || slotId === 'subtitle';

        if (isTitle) {
          const fontSize = slotId === 'title' ? 36 : 28;
          html += `<h1 style="color: ${item.colors.primary}; 
                             margin-bottom: 16px; 
                             font-size: ${fontSize}px; 
                             font-weight: bold;">${value}</h1>`;
        } else if (isBody) {
          html += `<p style="font-size: 16px; 
                              line-height: 1.6; 
                              margin-bottom: 16px;">${value}</p>`;
        }
      });
    }

    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    try {
      // Rasterize to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,              // High resolution
        useCORS: true,         // Allow cross-origin images
        logging: false         // No console spam
      });

      const imgData = canvas.toDataURL('image/png');
      const props = pdf.getImageProperties(imgData);

      // Add to PDF
      if (currentContentType === 'resume') {
        pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, 960, 540);
      }
    } catch (e) {
      console.error('PDF render error:', e);
    }

    document.body.removeChild(tempDiv);
  }

  pdf.save('document.pdf');
  showToast('PDF exported');
}
```

**PDF Generation Strategy:**
1. Create hidden DOM element
2. Apply item styles (colors, dimensions)
3. Render content as HTML
4. Use html2canvas to rasterize
5. Add image to PDF page
6. Repeat for each item
7. Download PDF

**Page Dimensions:**
| Content Type | Orientation | Width | Height | Unit |
|--------------|-------------|-------|--------|------|
| Presentation | Landscape | 960 | 540 | px |
| Resume | Portrait | 794 | 1123 | px |
| Default | Landscape | 960 | 540 | px |

**Quality Settings:**
- Scale: 2x for high resolution
- Format: PNG (lossless)
- Compression: PDF internal

---

### 1.6 Image Export (PNG/JPG)

**Implementation (editor.js lines 1052-1125):**

```javascript
async function exportImage(format) {
  if (project.items.length === 0) {
    showToast('No items to export');
    return;
  }

  showToast('Generating image...');

  const item = project.items[project.currentIndex];
  const layout = getLayoutById(item.layout);
  const config = CONTENT_TYPES[currentContentType];

  // Create render container
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = `
    position: fixed;
    left: -9999px;
    width: ${config.width}px;
    height: ${config.height === 'auto' ? '600px' : config.height + 'px'};
    background: ${item.colors.bg};
    color: ${item.colors.text};
    padding: 40px;
    font-family: Arial, sans-serif;
    overflow: hidden;
  `;

  // Generate HTML content
  let html = '';
  if (layout && layout.slots) {
    Object.keys(layout.slots).forEach(slotId => {
      const slot = layout.slots[slotId];
      const value = item.content[slotId] || slot.placeholder || '';
      const isTitle = slotId === 'title' || slotId === 'heading';
      const isBody = slotId === 'body' || slotId === 'subtitle';

      if (isTitle) {
        const fontSize = slotId === 'title' ? 36 : 28;
        html += `<h1 style="color: ${item.colors.primary}; 
                            margin-bottom: 16px; 
                            font-size: ${fontSize}px; 
                            font-weight: bold;">${value}</h1>`;
      } else if (isBody) {
        html += `<p style="font-size: 16px; 
                            line-height: 1.6; 
                            margin-bottom: 16px;">${value}</p>`;
      }
    });
  }

  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  try {
    // Render to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: null  // Transparent for PNG
    });

    // Determine format
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.9 : 1.0;
    
    // Generate data URL
    const dataUrl = canvas.toDataURL(mimeType, quality);

    // Trigger download
    const link = document.createElement('a');
    link.download = `image.${format}`;
    link.href = dataUrl;
    link.click();

    showToast('Image exported');
  } catch (e) {
    console.error('Image export error:', e);
    showToast('Export failed');
  }

  document.body.removeChild(tempDiv);
}
```

**Export Specifications:**

| Format | MIME Type | Quality | Transparency | Use Case |
|--------|-----------|---------|--------------|----------|
| PNG | image/png | 100% | Yes | Graphics, logos |
| JPG | image/jpeg | 90% | No | Photos, complex images |

**Dimensions:**
- Source: Config-defined (e.g., 1080x1080 for social)
- Output: 2x scale for high DPI (e.g., 2160x2160)

---

### 1.7 ZIP Export (Website)

**Status:** Planned but not fully implemented

```javascript
function exportZIP() {
  showToast('ZIP export coming soon!');
}
```

**Proposed Implementation:**
```javascript
async function exportZIP() {
  const JSZip = await import('jszip');
  const zip = new JSZip();
  
  // Add index.html
  zip.file('index.html', generateIndexHTML());
  
  // Add CSS
  zip.file('styles.css', generateStyles());
  
  // Add assets (if any)
  // zip.file('images/logo.png', imageData);
  
  // Generate ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  downloadFile(content, 'website.zip', 'application/zip');
}
```

---

## Part 2: AI Integration (MCP Server)

### 2.1 MCP Architecture

**Model Context Protocol (MCP) Flow:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────►│     AI      │────►│   MCP Tool  │
│   Prompt    │     │   (LLM)     │     │   Call      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI Update │◄────│   Project   │◄────│   Execute   │
│   (Render)  │     │   Update    │     │   Handler   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2.2 MCPServer Class

**Implementation (js/mcp-server.js lines 1-450):**

```javascript
class MCPServer {
  constructor(registry, project) {
    this.registry = registry;
    this.project = project;
    this.tools = this.defineTools();
  }

  defineTools() {
    return {
      // 11 tools defined here
      get_available_components: { ... },
      get_component_details: { ... },
      generate_content: { ... },
      create_page: { ... },
      update_page_content: { ... },
      get_project_status: { ... },
      apply_theme: { ... },
      generate_presentation: { ... },
      validate_content: { ... },
      export_project: { ... }
    };
  }

  async callTool(toolName, args = {}) {
    const tool = this.tools[toolName];
    if (!tool) {
      return { success: false, error: `Unknown tool: ${toolName}` };
    }

    try {
      const result = await tool.handler(args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getToolDescriptions() {
    return Object.values(this.tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}
```

### 2.3 Tool Definitions

#### 2.3.1 get_available_components

**Purpose:** List all available layouts and themes

**Parameters:**
```javascript
{
  category: {
    type: 'string',
    description: 'Filter by category (presentation, social-media, resume, website)',
    optional: true
  }
}
```

**Handler (lines 23-48):**
```javascript
handler: async (args) => {
  const layouts = args?.category
    ? this.registry.getLayoutsByCategory(args.category)
    : Object.values(this.registry.getLayouts());

  const themes = Object.values(this.registry.getThemes()).map(t => ({
    id: t.id,
    name: t.name,
    colors: t.colors
  }));

  return {
    success: true,
    layouts: layouts.map(l => ({
      id: l.id,
      name: l.name,
      category: l.category,
      slots: l.slots,
      constraints: l.constraints,
      editableProperties: l.editableProperties,
      animations: l.animations
    })),
    themes,
    totalLayouts: layouts.length
  };
}
```

**Example Response:**
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
        "title": { "maxChars": 50, "required": true }
      }
    }
  ],
  "themes": [
    { "id": "modern", "name": "Modern Clean", "colors": { ... } }
  ],
  "totalLayouts": 39
}
```

---

#### 2.3.2 generate_content

**Purpose:** Generate content for a specific layout

**Parameters:**
```javascript
{
  layoutId: { type: 'string', required: true },
  topic: { type: 'string', required: true },
  tone: { type: 'string', optional: true },
  language: { type: 'string', optional: true },
  constraints: { type: 'object', optional: true }
}
```

**Handler (lines 83-133):**
```javascript
handler: async (args) => {
  const layout = this.registry.getLayout(args.layoutId);
  if (!layout) {
    return { success: false, error: `Layout "${args.layoutId}" not found` };
  }

  const generatedContent = {};

  layout.slots.forEach(slot => {
    const slotConstraint = layout.constraints?.[slot];
    const maxChars = slotConstraint?.maxChars || 100;
    const isRequired = slotConstraint?.required !== false;

    generatedContent[slot] = {
      text: this.generateSlotContent(slot, args.topic, args.tone, args.language, maxChars),
      constraints: {
        maxChars,
        required: isRequired,
        currentLength: 0
      },
      metadata: {
        generated: true,
        timestamp: new Date().toISOString()
      }
    };
  });

  return {
    success: true,
    content: generatedContent,
    layoutId: args.layoutId,
    topic: args.topic,
    language: args.language || 'en'
  };
}
```

---

#### 2.3.3 create_page

**Purpose:** Create a new page in the project

**Parameters:**
```javascript
{
  layoutId: { type: 'string', required: true },
  content: { type: 'object', required: true },
  theme: { type: 'string', optional: true }
}
```

**Handler (lines 135-176):**
```javascript
handler: async (args) => {
  const layout = this.registry.getLayout(args.layoutId);
  if (!layout) {
    return { success: false, error: `Layout "${args.layoutId}" not found` };
  }

  const page = this.project.addPage(args.layoutId);

  Object.entries(args.content).forEach(([slot, value]) => {
    const text = typeof value === 'string' ? value : value.text;
    if (text) {
      this.project.updatePageContent(page.id, { [slot]: text });
    }
  });

  if (args.theme) {
    this.project.setTheme(args.theme);
  }

  this.project.saveToStorage();

  return {
    success: true,
    pageId: page.id,
    layoutId: args.layoutId,
    totalPages: this.project.pages.length,
    message: `Page created successfully using layout "${layout.name}"`
  };
}
```

---

#### 2.3.4 generate_presentation

**Purpose:** Generate a complete multi-slide presentation

**Parameters:**
```javascript
{
  topic: { type: 'string', required: true },
  slideCount: { type: 'number', default: 3 },
  layoutType: { type: 'string', optional: true },
  tone: { type: 'string', optional: true }
}
```

**Handler (lines 263-318):**
```javascript
handler: async (args) => {
  const layouts = Object.values(this.registry.getLayouts())
    .filter(l => l.category === 'presentation');
  const slideCount = args.slideCount || 3;

  const slideContents = [];

  for (let i = 0; i < slideCount; i++) {
    const layout = layouts[i % layouts.length];
    const content = {};

    layout.slots.forEach(slot => {
      content[slot] = this.generateSlotContent(
        slot,
        args.topic,
        args.tone,
        'en',
        layout.constraints?.[slot]?.maxChars || 100
      );
    });

    slideContents.push({
      layoutId: layout.id,
      layoutName: layout.name,
      content,
      order: i
    });

    this.project.addPage(layout.id);
    this.project.updatePageContent(
      this.project.pages[this.project.pages.length - 1].id, 
      content
    );
  }

  this.project.saveToStorage();

  return {
    success: true,
    topic: args.topic,
    slidesCreated: slideContents.length,
    slides: slideContents,
    totalPages: this.project.pages.length
  };
}
```

### 2.4 Content Generation Engine

**Slot Content Generators (lines 397-424):**

```javascript
generateSlotContent(slot, topic, tone, language, maxChars) {
  const slotGenerators = {
    title: (t) => `Introduction to ${t}`,
    subtitle: (t) => `Exploring the fundamentals and key concepts`,
    heading: (t) => `Understanding ${t}`,
    body: (t) => `${t} is an important concept that encompasses various aspects. ` +
                 `In this section, we will explore the fundamental principles, ` +
                 `practical applications, and best practices for implementing ` +
                 `${t} effectively. Understanding these core elements will help ` +
                 `you build a strong foundation.`,
    headline: (t) => `${t}: Everything You Need to Know`,
    subheadline: (t) => `A comprehensive guide to understanding and implementing ` +
                        `${t} in your projects`,
    cta: () => `Learn More`,
    ctaPrimary: () => `Get Started`,
    ctaSecondary: () => `Learn More`,
    contact: () => `info@example.com`,
    footer: (t) => `© 2024 ${t} Project`,
    visual: () => '',
    image: () => '',
    photo: () => '',
    background: () => ''
  };

  const generator = slotGenerators[slot] || ((t) => `Content for ${slot}`);
  let content = generator(topic, tone, language);

  // Enforce character limit
  if (content.length > maxChars) {
    content = content.substring(0, maxChars - 3) + '...';
  }

  return content;
}
```

**Generator Strategy:**
- Template-based generation
- Slot-specific patterns
- Topic interpolation
- Constraint enforcement (maxChars)
- Fallback for unknown slots

---

### 2.5 AI Integration in Main App

**Initialization (js/main.js lines 1-17):**

```javascript
let editor;
let mcpServer;

document.addEventListener('DOMContentLoaded', async () => {
  editor = new Editor();
  await editor.init();

  mcpServer = new MCPServer(editor.registry, editor.project);

  editor.loadProject();

  window.editor = editor;
  window.mcpServer = mcpServer;

  console.log('AI Content Generator initialized');
  console.log('Available MCP tools:', 
    mcpServer.getToolDescriptions().map(t => t.name));
});
```

**AI Generation Function (js/main.js lines 36-118):**

```javascript
Editor.prototype.generateWithAI = async function() {
  const prompt = document.getElementById('aiPrompt').value;
  if (!prompt.trim()) {
    this.showToast('Please enter a prompt');
    return;
  }

  const output = document.getElementById('aiOutput');
  output.innerHTML = '<div class="loading">Generating...</div>';

  try {
    // Get available layouts for AI context
    const layouts = await mcpServer.callTool('get_available_components', {});
    const layoutsStr = JSON.stringify(layouts, null, 2);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a content generation assistant...
Available layouts: ${layoutsStr}

Return format:
{
  "action": "create_page" | "create_presentation",
  "layoutId": "chosen_layout_id",
  "content": { "slot_name": "generated content" },
  "topic": "the main topic"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    // Execute AI's chosen action
    if (aiResponse.action === 'create_page') {
      await mcpServer.callTool('create_page', {
        layoutId: aiResponse.layoutId,
        content: aiResponse.content
      });
      this.showToast('Page created successfully!');
    } else if (aiResponse.action === 'create_presentation') {
      await mcpServer.callTool('generate_presentation', {
        topic: aiResponse.topic,
        slideCount: aiResponse.slideCount || 3
      });
      this.showToast('Presentation created!');
    }

    this.render();
    this.updatePropertyPanel();

  } catch (error) {
    console.error('AI generation error:', error);
    output.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    this.showToast('Generation failed');
  }
};
```

### 2.6 Example AI Conversations

**Example 1: Generate Presentation**

```json
{
  "user_prompt": "Create a presentation about renewable energy with 4 slides",
  "ai_response": {
    "action": "create_presentation",
    "topic": "renewable energy",
    "slideCount": 4
  },
  "mcp_calls": [
    {
      "tool": "generate_presentation",
      "arguments": { "topic": "renewable energy", "slideCount": 4 }
    }
  ]
}
```

**Example 2: Generate Single Page**

```json
{
  "user_prompt": "Make an Instagram carousel post about coffee",
  "ai_response": {
    "action": "create_page",
    "layoutId": "carousel-card",
    "content": {
      "headline": "☕ The Art of Perfect Coffee",
      "content": "Discover the secrets of brewing the perfect cup...",
      "cta": "Learn More"
    },
    "topic": "coffee"
  },
  "mcp_calls": [
    {
      "tool": "generate_content",
      "arguments": {
        "layoutId": "carousel-card",
        "topic": "coffee",
        "tone": "engaging"
      }
    },
    {
      "tool": "create_page",
      "arguments": {
        "layoutId": "carousel-card",
        "content": {
          "headline": "☕ The Art of Perfect Coffee",
          "content": "Discover the secrets...",
          "cta": "Learn More"
        }
      }
    }
  ]
}
```

**Example 3: Change Theme**

```json
{
  "user_prompt": "Apply the dark theme to the entire presentation",
  "ai_response": {
    "action": "apply_theme",
    "themeId": "dark"
  },
  "mcp_calls": [
    {
      "tool": "apply_theme",
      "arguments": { "themeId": "dark" }
    }
  ]
}
```

### 2.7 Complete Tool Reference

| Tool | Input | Output | Description |
|------|-------|--------|-------------|
| `get_available_components` | `{category?}` | `{layouts, themes, totalLayouts}` | List available layouts and themes |
| `get_component_details` | `{layoutId}` | `{layout}` | Get detailed layout info |
| `generate_content` | `{layoutId, topic, tone?, language?}` | `{content, layoutId, topic}` | Generate content for a layout |
| `create_page` | `{layoutId, content, theme?}` | `{pageId, totalPages, message}` | Add page to project |
| `update_page_content` | `{pageId, slot, content}` | `{pageId, slot, newLength}` | Update specific slot |
| `get_project_status` | `{}` | `{project}` | Get project overview |
| `apply_theme` | `{themeId}` | `{themeId, themeName}` | Apply theme |
| `generate_presentation` | `{topic, slideCount?, tone?}` | `{topic, slidesCreated, slides}` | Generate multi-slide deck |
| `validate_content` | `{layoutId, content}` | `{validation}` | Check constraints |
| `export_project` | `{format}` | `{data}` | Export project data |

---

## 3. Integration Patterns

### 3.1 AI Workflow Patterns

**Pattern 1: Quick Generation**
```
User Prompt → AI → generate_presentation → Project Updated → Render
```

**Pattern 2: Iterative Refinement**
```
User Prompt → AI → generate_content → User Edits → validate_content → Save
```

**Pattern 3: Themed Creation**
```
User Prompt → AI → get_available_components → create_page → apply_theme → Render
```

### 3.2 Error Handling

**AI Errors:**
```javascript
try {
  const result = await mcpServer.callTool('create_page', args);
  if (!result.success) {
    showToast(`Error: ${result.error}`);
  }
} catch (error) {
  showToast('AI service unavailable');
}
```

**Export Errors:**
```javascript
try {
  await exportPDF();
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    showToast('Storage full. Export and clear.');
  } else {
    showToast('Export failed: ' + error.message);
  }
}
```

---

## 4. Advanced Features

### 4.1 Content Validation

**Validation Flow:**
```javascript
// Before creating page
const validation = await mcpServer.callTool('validate_content', {
  layoutId: 'title-slide',
  content: { title: 'Very long title that exceeds limit...' }
});

if (!validation.validation.valid) {
  console.log('Errors:', validation.validation.errors);
  // ["title exceeds max 50 characters (current: 86)"]
}
```

### 4.2 Multi-Language Support

**Language Parameter:**
```javascript
const result = await mcpServer.callTool('generate_content', {
  layoutId: 'intro',
  topic: 'our project',
  language: 'es'  // Spanish
});

// Returns:
{
  title: "Bienvenido a Nuestro Proyecto",
  subtitle: "Explorando nuevas posibilidades"
}
```

### 4.3 Tone Customization

**Tone Parameter:**
```javascript
const result = await mcpServer.callTool('generate_content', {
  layoutId: 'content-slide',
  topic: 'machine learning',
  tone: 'professional'  // or 'casual', 'technical', 'friendly'
});
```

---

## Summary

**Export System:**
- 5 export formats (HTML, PPTX, PDF, PNG, JPG)
- Format-specific generation strategies
- High-quality rendering via html2canvas
- Self-contained outputs

**AI Integration:**
- 11 MCP tools for comprehensive control
- Template-based content generation
- Constraint-aware generation
- Multi-language support
- Validation system

**Key Capabilities:**
- Complete presentation generation from single prompt
- Per-slot content generation
- Theme application
- Real-time validation
- Project status queries

**Future Enhancements:**
- ZIP export with assets
- More sophisticated AI prompts
- Image generation integration
- Voice-to-content
- Collaborative AI editing

---

*This document covers the complete export pipeline and AI integration architecture*
