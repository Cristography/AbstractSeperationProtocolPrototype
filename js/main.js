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
  console.log('Available MCP tools:', mcpServer.getToolDescriptions().map(t => t.name));
});

Editor.prototype.quickStart = function(layoutId) {
  const layout = this.registry.getLayout(layoutId);
  if (!layout) return;

  const initialContent = {};
  layout.slots.forEach(slot => {
    initialContent[slot] = this.renderer.getPlaceholderContent(slot);
  });

  const page = this.project.addPage(layoutId);
  this.project.updatePageContent(page.id, initialContent);
  this.selectedPage = page;
  this.markUnsaved();
  this.render();
  this.updatePropertyPanel();
};

Editor.prototype.generateWithAI = async function() {
  const prompt = document.getElementById('aiPrompt').value;
  if (!prompt.trim()) {
    this.showToast('Please enter a prompt');
    return;
  }

  const output = document.getElementById('aiOutput');
  output.innerHTML = '<div class="loading">Generating...</div>';

  try {
    const layouts = await mcpServer.callTool('get_available_components', {});

    const layoutsStr = JSON.stringify(layouts, null, 2);

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
            content: `You are a content generation assistant for a visual content creation tool.
Available layouts: ${layoutsStr}

Your task is to:
1. Analyze the user's request
2. Choose appropriate layouts
3. Generate content for each slot following constraints
4. Return a JSON response with the layout selection and content

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

    if (aiResponse.action === 'create_page') {
      await mcpServer.callTool('create_page', {
        layoutId: aiResponse.layoutId,
        content: aiResponse.content
      });

      this.project.pages = this.project.pages;
      this.render();
      this.updatePropertyPanel();
      this.showToast('Page created successfully!');
    } else if (aiResponse.action === 'create_presentation') {
      await mcpServer.callTool('generate_presentation', {
        topic: aiResponse.topic,
        slideCount: aiResponse.slideCount || 3
      });

      this.render();
      this.updatePropertyPanel();
      this.showToast('Presentation created!');
    }

    output.innerHTML = `<div class="success">✓ Generated successfully</div>`;
  } catch (error) {
    console.error('AI generation error:', error);
    output.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    this.showToast('Generation failed');
  }
};

Editor.prototype.setTheme = function(themeId) {
  this.project.setTheme(themeId);
  this.markUnsaved();
  this.render();
  this.updatePropertyPanel();
};

Editor.prototype.duplicatePage = function(pageId) {
  const newPage = this.project.duplicatePage(pageId);
  if (newPage) {
    this.markUnsaved();
    this.render();
    this.updatePropertyPanel();
  }
};

Editor.prototype.deletePage = function(pageId) {
  if (confirm('Are you sure you want to delete this page?')) {
    this.project.removePage(pageId);
    if (this.selectedPage?.id === pageId) {
      this.selectedPage = this.project.pages[0] || null;
    }
    this.markUnsaved();
    this.render();
    this.updatePropertyPanel();
  }
};

Editor.prototype.showToast = function(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show';
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
};

ComponentRegistry.prototype.getComponentBySlotType = function(slotType) {
  const components = this.getComponents();
  return Object.values(components).find(c => c.slotType === slotType) || null;
};
