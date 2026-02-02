class Renderer {
  constructor(registry) {
    this.registry = registry;
    this.themeCache = {};
  }

  async init() {
    if (!this.registry.loaded) {
      await this.registry.loadManifest();
    }
  }

  async renderProject(project, options = {}) {
    await this.init();
    const theme = this.registry.getTheme(project.theme);
    const pages = project.pages.map(page => this.renderPage(page, project.theme, options)).join('\n');
    return this.wrapInContainer(pages, theme, options);
  }

  renderPage(page, themeId, options = {}) {
    const layout = this.registry.getLayout(page.layoutId);
    const theme = this.registry.getTheme(themeId);

    if (!layout) {
      return `<div class="error-page">Layout "${page.layoutId}" not found</div>`;
    }

    const mergedStyle = this.mergeStyles(layout.css.default, page.styleOverrides, theme);
    const styleString = this.styleToString(mergedStyle);

    const content = this.renderPageContent(page, layout, theme, options);
    const animationClass = page.animations?.length > 0
      ? `animation-${page.animations[0]}`
      : '';

    return `
      <div class="slide" data-layout="${layout.id}" data-page-id="${page.id}" style="${styleString}">
        <style>${this.generatePageCSS(page, layout, theme)}</style>
        <div class="slide-content ${animationClass}">
          ${content}
        </div>
      </div>
    `;
  }

  renderPageContent(page, layout, theme, options = {}) {
    const slots = layout.slots || [];
    let content = '';

    slots.forEach(slotName => {
      const slotContent = page.content?.[slotName] || this.getPlaceholderContent(slotName);
      const component = this.registry.getComponentBySlotType(slotName);
      content += this.renderSlot(slotName, slotContent, component, layout, theme, options);
    });

    return content;
  }

  renderSlot(slotName, content, component, layout, theme, options = {}) {
    const slotClass = `slot-${slotName}`;
    const componentDef = component || this.registry.getComponent('heading');

    let html = '';

    if (slotName === 'background') {
      return `<div class="${slotClass}" style="position:absolute;inset:0;z-index:-1;${this.styleToString(this.getBackgroundStyle(content, theme))}"></div>`;
    }

    if (component?.type === 'diagram' && slotName === 'visual' && content?.mermaid) {
      return `
        <div class="${slotClass}">
          <div class="mermaid-diagram">${this.renderMermaid(content.mermaid)}</div>
        </div>
      `;
    }

    if (component?.type === 'interactive') {
      html = `<button class="${slotClass} ${component.id}">${this.escapeHtml(content)}</button>`;
    } else if (component?.type === 'data') {
      html = this.renderStatBox(content, component);
    } else {
      const tag = component?.type === 'text' && slotName.includes('headline') ? 'h1' : 'p';
      const componentClass = component ? `${component.id} slot-element` : slotClass;
      html = `<${tag} class="${componentClass}">${this.escapeHtml(content)}</${tag}>`;
    }

    return `<div class="slot-container ${slotClass}">${html}</div>`;
  }

  renderStatBox(content, component) {
    if (!content || typeof content !== 'object') {
      return `<div class="${component.id}"><p>${content || ''}</p></div>`;
    }

    const { value, label, trend } = content;
    return `
      <div class="${component.id} stat-box">
        ${value ? `<div class="stat-value">${this.escapeHtml(String(value))}</div>` : ''}
        ${label ? `<div class="stat-label">${this.escapeHtml(label)}</div>` : ''}
        ${trend ? `<div class="stat-trend">${this.escapeHtml(trend)}</div>` : ''}
      </div>
    `;
  }

  renderMermaid(code) {
    return `<pre class="mermaid">${this.escapeHtml(code)}</pre>`;
  }

  getPlaceholderContent(slotName) {
    const placeholders = {
      title: 'Your Title Here',
      subtitle: 'Subtitle or description',
      heading: 'Section Heading',
      body: 'Your content goes here...',
      cta: 'Click Here',
      ctaPrimary: 'Get Started',
      ctaSecondary: 'Learn More',
      visual: '',
      image: '',
      photo: '',
      contact: 'email@example.com',
      background: '',
      headline: 'Your Headline',
      subheadline: 'Your subheadline text here',
      footer: 'Footer content'
    };
    return placeholders[slotName] || `[${slotName}]`;
  }

  mergeStyles(layoutStyle, overrides, theme) {
    const merged = { ...layoutStyle };

    if (theme) {
      if (theme.colors?.background) {
        merged.background = theme.colors.background;
      }
      if (theme.colors?.text) {
        merged.color = theme.colors.text;
      }
      if (theme.fonts?.body) {
        merged.fontFamily = theme.fonts.body;
      }
    }

    Object.assign(merged, overrides);
    return merged;
  }

  getBackgroundStyle(content, theme) {
    if (!content) return {};

    if (content.startsWith('gradient:')) {
      return { background: content.replace('gradient:', '') };
    }
    if (content.startsWith('image:')) {
      return {
        background: `url(${content.replace('image:', '')}) center/cover no-repeat`
      };
    }

    const colors = theme?.colors || {};
    return {
      background: colors.primary || content
    };
  }

  styleToString(style) {
    return Object.entries(style)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  generatePageCSS(page, layout, theme) {
    let css = '';

    const themeColors = theme?.colors || {};
    const fonts = theme?.fonts || {};

    css += `
      .slide {
        width: 100%;
        min-height: 100vh;
        position: relative;
        box-sizing: border-box;
      }
      .slide-content {
        width: 100%;
        height: 100%;
      }
    `;

    layout.editableProperties?.forEach(prop => {
      css += `.editable-${prop} { }`;
    });

    css += `
      .mermaid-diagram {
        text-align: center;
        padding: 20px;
      }
      .mermaid {
        display: inline-block;
      }
    `;

    return css;
  }

  wrapInContainer(pagesHtml, theme, options = {}) {
    const fonts = theme?.fonts || {};
    const bgColor = theme?.colors?.background || '#ffffff';
    const textColor = theme?.colors?.text || '#000000';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Generated Content</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: ${fonts.body || 'Inter, sans-serif'};
            background: ${bgColor};
            color: ${textColor};
          }
          .slides-container {
            display: flex;
            flex-direction: column;
            gap: 0;
          }
          .slide {
            break-after: page;
          }
          .slot-container {
            display: block;
          }
          .editable {
            outline: 2px dashed transparent;
            transition: outline 0.2s;
          }
          .editable:hover {
            outline: 2px dashed #3B82F6;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideLeft {
            from { transform: translateX(30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animation-fadeIn { animation: fadeIn 0.6s ease-out; }
          .animation-slideUp { animation: slideUp 0.6s ease-out; }
          .animation-slideLeft { animation: slideLeft 0.6s ease-out; }
          .animation-zoomIn { animation: zoomIn 0.6s ease-out; }
        </style>
      </head>
      <body>
        <div class="slides-container">
          ${pagesHtml}
        </div>
      </body>
      </html>
    `;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.Renderer = Renderer;
