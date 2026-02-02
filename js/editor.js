class Editor {
  constructor() {
    this.registry = new ComponentRegistry();
    this.project = new Project();
    this.renderer = new Renderer(this.registry);
    this.selectedPage = null;
    this.selectedElement = null;
    this.editMode = 'content';
    this.previewMode = false;
    this.unsavedChanges = false;
  }

  async init() {
    await this.registry.loadManifest();
    this.project.createNew();
    this.bindEvents();
    this.renderLayoutSelector();
    this.renderThemeSelector();
    this.updateUI();
  }

  bindEvents() {
    document.getElementById('addPageBtn')?.addEventListener('click', () => this.showLayoutSelector());
    document.getElementById('previewBtn')?.addEventListener('click', () => this.togglePreview());
    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportProject());
    document.getElementById('saveBtn')?.addEventListener('click', () => this.saveProject());
    document.getElementById('newBtn')?.addEventListener('click', () => this.createNewProject());
    document.getElementById('closePreview')?.addEventListener('click', () => this.togglePreview());

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveProject();
      }
      if (e.key === 'Delete' && this.selectedElement) {
        this.deleteSelectedElement();
      }
    });
  }

  showLayoutSelector() {
    const modal = document.getElementById('layoutSelector');
    if (modal) {
      modal.style.display = 'flex';
      this.renderLayoutOptions();
    }
  }

  hideLayoutSelector() {
    const modal = document.getElementById('layoutSelector');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  renderLayoutOptions() {
    const container = document.getElementById('layoutOptions');
    if (!container) return;

    const layouts = this.registry.getLayouts();
    container.innerHTML = Object.values(layouts).map(layout => `
      <div class="layout-option" data-layout-id="${layout.id}">
        <div class="layout-preview">
          <div class="layout-preview-slots">
            ${layout.slots.map(s => `<div class="preview-slot">${s}</div>`).join('')}
          </div>
        </div>
        <span class="layout-name">${layout.name}</span>
        <span class="layout-category">${layout.category}</span>
      </div>
    `).join('');

    container.querySelectorAll('.layout-option').forEach(option => {
      option.addEventListener('click', () => {
        this.addPage(option.dataset.layoutId);
        this.hideLayoutSelector();
      });
    });
  }

  renderLayoutSelector() {
    const selector = document.getElementById('layoutCategoryFilter');
    if (selector) {
      const categories = [...new Set(Object.values(this.registry.getLayouts()).map(l => l.category))];
      selector.innerHTML = ['all', ...categories].map(cat =>
        `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
      ).join('');
    }
  }

  renderThemeSelector() {
    const selector = document.getElementById('themeSelector');
    if (!selector) return;

    const themes = this.registry.getThemes();
    selector.innerHTML = Object.values(themes).map(theme =>
      `<option value="${theme.id}">${theme.name}</option>`
    ).join('');

    selector.addEventListener('change', (e) => {
      this.project.setTheme(e.target.value);
      this.markUnsaved();
      this.render();
    });
  }

  addPage(layoutId) {
    const layout = this.registry.getLayout(layoutId);
    if (!layout) return;

    const page = this.project.addPage(layoutId);
    const initialContent = {};

    layout.slots.forEach(slot => {
      initialContent[slot] = this.renderer.getPlaceholderContent(slot);
    });

    this.project.updatePageContent(page.id, initialContent);
    this.selectedPage = page;
    this.markUnsaved();
    this.render();
  }

  selectPage(pageId) {
    this.selectedPage = this.project.getPage(pageId);
    this.selectedElement = null;
    this.render();
    this.updatePropertyPanel();
  }

  updateContent(pageId, slotName, value) {
    this.project.updatePageContent(pageId, { [slotName]: value });
    this.markUnsaved();
    this.render();
  }

  updateStyle(pageId, property, value) {
    const page = this.project.getPage(pageId);
    if (page) {
      this.project.updatePageStyle(pageId, { [property]: value });
      this.markUnsaved();
      this.render();
    }
  }

  updatePropertyPanel() {
    const panel = document.getElementById('propertyPanel');
    if (!panel || !this.selectedPage) {
      panel.innerHTML = '<p class="no-selection">Select a page or element to edit</p>';
      return;
    }

    const layout = this.registry.getLayout(this.selectedPage.layoutId);
    const theme = this.registry.getTheme(this.project.theme);

    const editableProps = layout?.editableProperties || [];
    const content = this.selectedPage.content || {};

    panel.innerHTML = `
      <div class="property-section">
        <h3>Page: ${layout?.name || 'Unknown'}</h3>
        <div class="property-group">
          <label>Theme</label>
          <select id="themeSelect" onchange="editor.setTheme(this.value)">
            ${Object.values(this.registry.getThemes()).map(t =>
              `<option value="${t.id}" ${this.project.theme === t.id ? 'selected' : ''}>${t.name}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="property-section">
        <h4>Content Fields</h4>
        ${layout?.slots.map(slot => `
          <div class="property-group">
            <label>${slot}</label>
            ${slot.length > 50 ? 'textarea' : 'input type="text"'}
              class="content-field"
              data-slot="${slot}"
              value="${this.escapeHtml(content[slot] || '')}"
              onchange="editor.updateContent('${this.selectedPage.id}', '${slot}', this.value)"
            />
            ${this.getConstraintInfo(layout, slot)}
          </div>
        `).join('') || '<p>No editable content fields</p>'}
      </div>
      <div class="property-section">
        <h4>Style Properties</h4>
        ${editableProps.map(prop => `
          <div class="property-group">
            <label>${prop}</label>
            <input
              type="color"
              class="style-field"
              data-property="${prop}"
              value="${this.getPropertyColorValue(this.selectedPage.styleOverrides, prop, theme)}"
              onchange="editor.updateStyle('${this.selectedPage.id}', '${prop}', this.value)"
            />
          </div>
        `).join('') || '<p>No style properties available</p>'}
      </div>
      <div class="property-section actions">
        <button onclick="editor.duplicatePage('${this.selectedPage.id}')">Duplicate</button>
        <button onclick="editor.deletePage('${this.selectedPage.id}')" class="danger">Delete</button>
      </div>
    `;
  }

  getConstraintInfo(layout, slot) {
    const constraints = layout?.constraints?.[slot];
    if (!constraints) return '';
    const currentLength = (this.selectedPage.content?.[slot] || '').length;
    return `<small class="constraint-info">${currentLength}/${constraints.maxChars || '∞'}</small>`;
  }

  getPropertyColorValue(styleOverrides, prop, theme) {
    const colors = theme?.colors || {};
    const propMap = {
      backgroundColor: 'background',
      textColor: 'text',
      primaryColor: 'primary',
      secondaryColor: 'secondary',
      accentColor: 'accent'
    };

    const colorKey = propMap[prop] || prop;
    return styleOverrides?.[colorKey] || colors[colorKey] || '#000000';
  }

  setTheme(themeId) {
    this.project.setTheme(themeId);
    this.markUnsaved();
    this.render();
    this.updatePropertyPanel();
  }

  duplicatePage(pageId) {
    const newPage = this.project.duplicatePage(pageId);
    if (newPage) {
      this.markUnsaved();
      this.render();
    }
  }

  deletePage(pageId) {
    if (confirm('Are you sure you want to delete this page?')) {
      this.project.removePage(pageId);
      if (this.selectedPage?.id === pageId) {
        this.selectedPage = this.project.pages[0] || null;
      }
      this.markUnsaved();
      this.render();
    }
  }

  deleteSelectedElement() {
    if (this.selectedElement && this.selectedElement.dataset.slot) {
      const pageId = this.selectedElement.closest('.slide')?.dataset.pageId;
      const slot = this.selectedElement.dataset.slot;
      if (pageId && slot) {
        this.updateContent(pageId, slot, '');
      }
    }
  }

  async render() {
    const container = document.getElementById('editorCanvas');
    if (!container) return;

    const output = await this.renderer.renderProject(this.project);
    container.innerHTML = output;

    this.bindSlideEvents();
    this.updatePageThumbnails();
  }

  bindSlideEvents() {
    document.querySelectorAll('.slide').forEach(slide => {
      slide.addEventListener('click', (e) => {
        if (this.editMode === 'content') {
          const pageId = slide.dataset.pageId;
          this.selectPage(pageId);
        }
      });
    });
  }

  updatePageThumbnails() {
    const container = document.getElementById('pagesList');
    if (!container) return;

    container.innerHTML = this.project.pages.map((page, index) => {
      const layout = this.registry.getLayout(page.layoutId);
      return `
        <div
          class="page-thumbnail ${this.selectedPage?.id === page.id ? 'selected' : ''}"
          data-page-id="${page.id}"
          onclick="editor.selectPage('${page.id}')"
        >
          <span class="page-number">${index + 1}</span>
          <span class="page-layout">${layout?.name || 'Unknown'}</span>
          <div class="page-content-preview">
            ${Object.entries(page.content || {}).slice(0, 2).map(([k, v]) =>
              `<span>${k}: ${String(v).substring(0, 20)}...</span>`
            ).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  async togglePreview() {
    this.previewMode = !this.previewMode;
    const previewContainer = document.getElementById('previewContainer');
    const previewContent = document.getElementById('previewContent');
    const closeBtn = document.getElementById('closePreview');
    const previewBtn = document.getElementById('previewBtn');

    if (this.previewMode) {
      const output = await this.renderer.renderProject(this.project, { preview: true });
      previewContent.innerHTML = output;
      previewContainer.style.display = 'flex';
      previewBtn.textContent = 'Edit';
    } else {
      previewContainer.style.display = 'none';
      previewBtn.textContent = 'Preview';
    }
  }

  async exportProject() {
    const format = prompt('Export format (html, json):', 'html');
    if (!format) return;

    if (format === 'html') {
      const output = await this.renderer.renderProject(this.project);
      this.downloadFile(output, `${this.project.name}.html`, 'text/html');
    } else if (format === 'json') {
      const json = this.project.exportProject();
      this.downloadFile(json, `${this.project.name}.json`, 'application/json');
    } else if (format === 'pdf') {
      const html = await this.renderer.renderProject(this.project);
      this.exportToPDF(html);
    }
  }

  async exportToPDF(htmlContent) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  saveProject() {
    this.project.saveToStorage();
    this.unsavedChanges = false;
    this.updateUI();
    alert('Project saved!');
  }

  loadProject() {
    const loaded = this.project.loadFromStorage();
    if (loaded) {
      this.unsavedChanges = false;
      this.selectedPage = this.project.pages[0] || null;
      this.render();
      this.updatePropertyPanel();
    }
  }

  createNewProject() {
    if (this.unsavedChanges && !confirm('You have unsaved changes. Create new project anyway?')) {
      return;
    }
    this.project.createNew();
    this.selectedPage = null;
    this.unsavedChanges = false;
    this.render();
    this.updatePropertyPanel();
    this.updateUI();
  }

  markUnsaved() {
    this.unsavedChanges = true;
    this.updateUI();
  }

  updateUI() {
    const saveBtn = document.getElementById('saveBtn');
    const projectName = document.getElementById('projectName');

    if (projectName) {
      projectName.textContent = this.project.name + (this.unsavedChanges ? ' *' : '');
    }
    if (saveBtn) {
      saveBtn.disabled = !this.unsavedChanges;
    }

    const pageCount = document.getElementById('pageCount');
    if (pageCount) {
      pageCount.textContent = `${this.project.pages.length} pages`;
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.Editor = Editor;
