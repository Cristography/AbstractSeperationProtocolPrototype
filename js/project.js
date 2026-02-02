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

  createNew(name = 'New Project') {
    this.id = this.generateId();
    this.name = name;
    this.pages = [];
    this.theme = 'modern';
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    return this;
  }

  generateId() {
    return 'proj_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  addPage(layoutId, pageData = {}) {
    const pageId = 'page_' + Date.now().toString(36);
    const page = {
      id: pageId,
      layoutId,
      content: {},
      styleOverrides: {},
      animations: [],
      order: this.pages.length,
      ...pageData
    };
    this.pages.push(page);
    this.updatedAt = new Date().toISOString();
    return page;
  }

  removePage(pageId) {
    this.pages = this.pages.filter(p => p.id !== pageId);
    this.reorderPages();
    this.updatedAt = new Date().toISOString();
  }

  reorderPages() {
    this.pages.forEach((page, index) => {
      page.order = index;
    });
  }

  updatePageContent(pageId, content) {
    const page = this.pages.find(p => p.id === pageId);
    if (page) {
      page.content = { ...page.content, ...content };
      this.updatedAt = new Date().toISOString();
    }
    return page;
  }

  updatePageStyle(pageId, styleUpdates) {
    const page = this.pages.find(p => p.id === pageId);
    if (page) {
      page.styleOverrides = { ...page.styleOverrides, ...styleUpdates };
      this.updatedAt = new Date().toISOString();
    }
    return page;
  }

  getPage(pageId) {
    return this.pages.find(p => p.id === pageId);
  }

  getPageByOrder(order) {
    return this.pages.find(p => p.order === order);
  }

  setTheme(themeId) {
    this.theme = themeId;
    this.updatedAt = new Date().toISOString();
  }

  duplicatePage(pageId) {
    const original = this.getPage(pageId);
    if (original) {
      const newPage = {
        ...JSON.parse(JSON.stringify(original)),
        id: 'page_' + Date.now().toString(36),
        order: original.order + 1
      };
      this.pages.splice(original.order + 1, 0, newPage);
      this.reorderPages();
      this.updatedAt = new Date().toISOString();
      return newPage;
    }
    return null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      pages: this.pages,
      theme: this.theme,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  saveToStorage(key = 'current_project') {
    localStorage.setItem(key, JSON.stringify(this.toJSON()));
  }

  loadFromStorage(key = 'current_project') {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      Object.assign(this, parsed);
      return this;
    }
    return null;
  }

  exportProject() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  importProject(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      Object.assign(this, data);
      return true;
    } catch (error) {
      console.error('Failed to import project:', error);
      return false;
    }
  }
}

window.Project = Project;
