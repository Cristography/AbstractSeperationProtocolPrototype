class ComponentRegistry {
  constructor() {
    this.manifest = null;
    this.loaded = false;
  }

  async loadManifest(path = '../manifest.json') {
    try {
      const response = await fetch(path);
      this.manifest = await response.json();
      this.loaded = true;
      console.log('Registry loaded:', this.manifest);
      return this.manifest;
    } catch (error) {
      console.error('Failed to load manifest:', error);
      throw error;
    }
  }

  getLayouts() {
    return this.manifest?.components?.layouts || {};
  }

  getComponents() {
    return this.manifest?.components?.components || {};
  }

  getThemes() {
    return this.manifest?.components?.themes || {};
  }

  getLayout(id) {
    return this.getLayouts()[id];
  }

  getComponent(id) {
    return this.getComponents()[id];
  }

  getTheme(id) {
    return this.getThemes()[id];
  }

  getLayoutsByCategory(category) {
    const layouts = this.getLayouts();
    return Object.values(layouts).filter(l => l.category === category);
  }

  getAvailableSlots(layoutId) {
    const layout = this.getLayout(layoutId);
    return layout?.slots || [];
  }

  getConstraints(layoutId, slotName) {
    const layout = this.getLayout(layoutId);
    return layout?.constraints?.[slotName] || null;
  }

  validateContent(layoutId, slotName, content) {
    const constraints = this.getConstraints(layoutId, slotName);
    if (!constraints) return { valid: true };

    const errors = [];

    if (constraints.required && (!content || content.trim() === '')) {
      errors.push(`${slotName} is required`);
    }

    if (constraints.maxChars && content?.length > constraints.maxChars) {
      errors.push(`${slotName} exceeds max ${constraints.maxChars} characters (current: ${content.length})`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getEditableProperties(layoutId) {
    const layout = this.getLayout(layoutId);
    return layout?.editableProperties || [];
  }
}

window.ComponentRegistry = ComponentRegistry;
