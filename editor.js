// Content Types Configuration
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
    exportFormats: ['html', 'pptx', 'pdf'],
    categories: ['headings', 'bullet-points', 'multi-column', 'quotes', 'agenda-timeline', 'statistics', 'diagrams-charts', 'visual-content', 'team-people', 'closing']
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
    exportFormats: ['html', 'zip'],
    categories: ['hero', 'features', 'content', 'conversion', 'footer']
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
    exportFormats: ['pdf', 'html'],
    categories: ['headers', 'summary', 'experience', 'education', 'skills', 'projects']
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
    exportFormats: ['png', 'jpg', 'html'],
    categories: ['instagram', 'linkedin', 'twitter', 'other']
  },
  analytics: {
    name: 'Analytics',
    icon: 'fa-chart-bar',
    aspectRatio: '16/9',
    width: 960,
    height: 540,
    sidebarTitle: 'Dashboards',
    emptyMessage: 'Add your first dashboard',
    addButtonText: 'Add Dashboard',
    itemName: 'dashboard',
    folder: 'analytics',
    exportFormats: ['html', 'png', 'jpg'],
    categories: ['dashboards', 'charts', 'reports', 'metrics']
  }
};

// State
let currentContentType = 'presentation';
let project = {
  type: null,
  items: [],
  currentIndex: 0,
  zoom: 0.6,
  theme: null
};
let themes = [];
let layouts = [];
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// History Management
function saveState() {
  const state = JSON.stringify({
    items: project.items,
    currentIndex: project.currentIndex,
    theme: project.theme
  });

  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }

  if (history.length >= MAX_HISTORY) {
    history.shift();
  }

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

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    } else if (e.key === 'y') {
      e.preventDefault();
      redo();
    } else if (e.key === 's') {
      e.preventDefault();
      saveProject();
    }
  }
});

// Initialize
async function init() {
  await loadConfig();
  loadProjectFromStorage();
  updateZoom();
  saveState();
  console.log('Editor initialized');
}

// Load config
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    if (!response.ok) throw new Error('Config not found');
    const config = await response.json();
    
    // Handle new segmented layout structure
    if (config.layouts && typeof config.layouts === 'object' && !Array.isArray(config.layouts)) {
      // Flatten nested layout structure
      layouts = flattenLayouts(config.layouts);
      window.layoutCategories = config.layouts; // Store for category browser
    } else {
      layouts = config.layouts || [];
    }
    
    themes = config.themes || [];
    
    console.log('Loaded layouts:', layouts.length);
    console.log('Loaded themes:', themes.length);
    console.log('Layout categories:', window.layoutCategories ? Object.keys(window.layoutCategories) : 'flat');
  } catch (e) {
    console.log('Using default config:', e.message);
    layouts = getDefaultLayouts();
    themes = getDefaultThemes();
  }
  
  if (themes.length > 0) {
    project.theme = themes[0];
  }
}

// Flatten nested layout structure
function flattenLayouts(layoutCategories) {
  const flat = [];
  Object.keys(layoutCategories).forEach(category => {
    const categoryData = layoutCategories[category];
    if (typeof categoryData === 'object') {
      Object.keys(categoryData).forEach(subcategory => {
        const subLayouts = categoryData[subcategory];
        if (Array.isArray(subLayouts)) {
          subLayouts.forEach(layout => {
            flat.push({
              ...layout,
              category: category,
              subcategory: subcategory
            });
          });
        }
      });
    }
  });
  return flat;
}

// Select content type
async function selectContentType(type) {
  // Wait for config to load
  await loadConfig();
  
  currentContentType = type;
  project.type = type;
  project.items = [];
  project.currentIndex = 0;

  document.getElementById('welcomeModal').classList.remove('show');
  document.getElementById('welcomeModal').style.display = 'none';
  document.getElementById('mainToolbar').style.display = 'flex';
  document.getElementById('mainContainer').style.display = 'flex';

  updateUIForContentType();
  renderThemeOptions();
  saveProjectToStorage();
  
  // Now add first item (theme is guaranteed to be loaded)
  addNewItem();
}

function updateUIForContentType() {
  const config = CONTENT_TYPES[currentContentType];
  const configMap = {
    'presentation': 'presentation',
    'website': 'website',
    'resume': 'resume',
    'post': 'social',
    'analytics': 'analytics'
  };

  document.getElementById('sidebarHeader').textContent = config.sidebarTitle;
  document.getElementById('currentTypeBadge').innerHTML = `<i class="fas ${config.icon}"></i> ${config.name}`;
  document.getElementById('emptyMessage').textContent = config.emptyMessage;
  document.getElementById('addButtonText').textContent = config.addButtonText;

  // Show/hide toolbar controls
  document.getElementById('presentation-controls').style.display = currentContentType === 'presentation' ? 'flex' : 'none';
  document.getElementById('website-controls').style.display = currentContentType === 'website' ? 'flex' : 'none';
  document.getElementById('resume-controls').style.display = currentContentType === 'resume' ? 'flex' : 'none';
  document.getElementById('post-controls').style.display = currentContentType === 'post' ? 'flex' : 'none';
  document.getElementById('analytics-controls').style.display = currentContentType === 'analytics' ? 'flex' : 'none';

  // Animation for presentations and analytics
  document.getElementById('animationGroup').style.display = (currentContentType === 'presentation' || currentContentType === 'analytics') ? 'block' : 'none';

  // Update export formats
  updateExportFormats();
}

function updateExportFormats() {
  const config = CONTENT_TYPES[currentContentType];
  const select = document.getElementById('exportFormat');
  select.innerHTML = '';

  const labels = {
    'html': 'HTML (Editable)',
    'pptx': 'PowerPoint (.pptx)',
    'pdf': 'PDF Document',
    'zip': 'ZIP Archive',
    'png': 'PNG Image',
    'jpg': 'JPEG Image'
  };

  config.exportFormats.forEach(fmt => {
    const opt = document.createElement('option');
    opt.value = fmt;
    opt.textContent = labels[fmt] || fmt.toUpperCase();
    select.appendChild(opt);
  });
}

// Item Management
function addNewItem() {
  showLayoutLibrary();
}

function addItemWithLayout(layoutId) {
  console.log('Adding layout:', layoutId);
  const layout = getLayoutById(layoutId);
  if (!layout) {
    console.error('Layout not found:', layoutId);
    alert('Layout not found: ' + layoutId);
    return;
  }
  
  console.log('Found layout:', layout.name);
  
  // Ensure theme is set
  if (!project.theme) {
    project.theme = themes[0] || { colors: { bg: '#ffffff', text: '#333333', primary: '#3b82f6', secondary: '#64748b' } };
  }

  const item = {
    id: generateId(),
    layout: layoutId,
    content: {},
    colors: { ...project.theme.colors },
    animation: 'none'
  };

  Object.keys(layout.slots || {}).forEach(slotId => {
    item.content[slotId] = layout.slots[slotId].placeholder || '';
  });

  saveState();
  project.items.push(item);
  project.currentIndex = project.items.length - 1;

  hideLayoutLibrary();
  renderAll();
  updateZoom();
  saveProjectToStorage();
  showToast(layout.name + ' added');
}

function duplicateItem() {
  if (project.items.length === 0) return;
  const current = project.items[project.currentIndex];
  const copy = JSON.parse(JSON.stringify(current));
  copy.id = generateId();
  saveState();
  project.items.splice(project.currentIndex + 1, 0, copy);
  project.currentIndex++;
  renderAll();
  saveProjectToStorage();
  showToast('Item duplicated');
}

function deleteItem() {
  if (project.items.length === 0) return;
  if (!confirm('Delete this item?')) return;
  saveState();
  project.items.splice(project.currentIndex, 1);
  if (project.currentIndex >= project.items.length) {
    project.currentIndex = Math.max(0, project.items.length - 1);
  }
  renderAll();
  saveProjectToStorage();
  showToast('Item deleted');
}

function prevItem() {
  if (project.currentIndex > 0) {
    project.currentIndex--;
    renderAll();
  }
}

function nextItem() {
  if (project.currentIndex < project.items.length - 1) {
    project.currentIndex++;
    renderAll();
  }
}

function changeItem(index) {
  project.currentIndex = index;
  renderAll();
}

// Website Section
function addWebsiteSection() {
  addNewItem();
}

// Resume
function addResumeSection() {
  addNewItem();
}

function addResumePage() {
  addNewItem();
}

// Post
function addPost() {
  addNewItem();
}

// Layout Library
function showLayoutLibrary() {
  document.getElementById('layoutLibraryTitle').textContent = CONTENT_TYPES[currentContentType].itemName.charAt(0).toUpperCase() + CONTENT_TYPES[currentContentType].itemName.slice(1) + ' Layouts';
  document.getElementById('layoutLibraryModal').classList.add('show');
  renderLayoutCategories();
  renderLayoutGrid('all');
}

function hideLayoutLibrary() {
  document.getElementById('layoutLibraryModal').classList.remove('show');
}

function renderLayoutCategories() {
  const container = document.getElementById('layoutCategories');
  const cats = getLayoutCategories();
  
  // Format category names for display
  const formatCategoryName = (cat) => {
    return cat.split('-').map(word => capitalize(word)).join(' ');
  };
  
  container.innerHTML = `
    <button class="layout-category-btn active" data-category="all" onclick="filterLayouts('all')">All</button>
    ${cats.map(cat => `
      <button class="layout-category-btn" data-category="${cat}" onclick="filterLayouts('${cat}')">${formatCategoryName(cat)}</button>
    `).join('')}
  `;
}

function filterLayouts(category) {
  document.querySelectorAll('.layout-category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  renderLayoutGrid(category);
}

function renderLayoutGrid(filterCategory = 'all') {
  const grid = document.getElementById('layoutGrid');
  
  console.log('Rendering layouts for type:', currentContentType);
  console.log('Filter category:', filterCategory);
  console.log('Total layouts:', layouts.length);

  if (filterCategory === 'all') {
    // Show all layouts organized by subcategory
    const subcategories = getLayoutSubcategories();
    
    if (subcategories) {
      let html = '';
      Object.keys(subcategories).forEach(subcat => {
        const subLayouts = subcategories[subcat];
        if (subLayouts && subLayouts.length > 0) {
          html += `
            <div class="layout-subcategory" style="margin-bottom: 24px;">
              <h4 style="color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
                ${subcat.split('-').map(word => capitalize(word)).join(' ')}
              </h4>
              <div class="layout-grid-section" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
                ${subLayouts.map(layout => `
                  <div class="layout-option" onclick="addItemWithLayout('${layout.id}')" style="background: var(--bg-hover); border: 2px solid transparent; border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.15s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='transparent'">
                    <div class="layout-icon" style="font-size: 28px; margin-bottom: 8px;">${layout.icon || '📄'}</div>
                    <div class="layout-name" style="font-size: 12px; color: var(--text);">${layout.name}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      });
      grid.innerHTML = html;
      return;
    }
  }
  
  // Filtered view
  const filtered = getFilteredLayouts(filterCategory);
  console.log('Filtered layouts:', filtered.length);

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">No layouts available</p>';
    return;
  }

  grid.innerHTML = `
    <div class="layout-grid-section" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
      ${filtered.map(layout => `
        <div class="layout-option" onclick="addItemWithLayout('${layout.id}')" style="background: var(--bg-hover); border: 2px solid transparent; border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.15s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='transparent'">
          <div class="layout-icon" style="font-size: 28px; margin-bottom: 8px;">${layout.icon || '📄'}</div>
          <div class="layout-name" style="font-size: 12px; color: var(--text);">${layout.name}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Rendering
function renderAll() {
  renderSidebar();
  renderItem();
  renderFields();
  updateCounter();
  populateLayoutSelect();
}

function renderSidebar() {
  const container = document.getElementById('itemsList');
  
  if (project.items.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = project.items.map((item, i) => {
    const layout = getLayoutById(item.layout);
    const preview = getItemPreview(item);
    const isActive = i === project.currentIndex ? 'active' : '';
    
    return `
      <div class="page-item ${isActive}" onclick="changeItem(${i})">
        <div class="page-num">${i + 1}</div>
        <div class="page-info">
          <div class="page-title">${layout?.name || 'Item'}</div>
          <div class="page-type">${preview.substring(0, 25)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getItemPreview(item) {
  const keys = Object.keys(item.content);
  for (const key of keys) {
    if (item.content[key] && item.content[key].length > 0) {
      return item.content[key];
    }
  }
  return 'Empty';
}

function renderItem() {
  const emptyCanvas = document.getElementById('emptyCanvas');
  const itemWrapper = document.getElementById('itemWrapper');
  const config = CONTENT_TYPES[currentContentType];

  if (project.items.length === 0) {
    emptyCanvas.style.display = 'flex';
    itemWrapper.style.display = 'none';
    return;
  }

  // Website mode: render all sections in one long scrollable page
  if (currentContentType === 'website') {
    renderWebsitePreview();
    return;
  }

  // Other modes: render single item
  emptyCanvas.style.display = 'none';
  itemWrapper.style.display = 'block';

  const item = project.items[project.currentIndex];
  const itemEl = document.getElementById('currentItem');
  
  // Fixed dimensions for better preview
  const dimensions = getDimensionsForType(currentContentType);
  itemEl.style.width = dimensions.width + 'px';
  itemEl.style.height = dimensions.height + 'px';
  itemEl.style.background = item.colors.bg;
  itemEl.style.color = item.colors.text;
  itemEl.style.margin = '0 auto';

  const layout = getLayoutById(item.layout);
  itemEl.innerHTML = renderItemContent(layout, item);
}

function getDimensionsForType(type) {
  const dims = {
    'presentation': { width: 960, height: 540 },
    'resume': { width: 794, height: 1123 },
    'post': { width: 400, height: 400 },
    'website': { width: 1200, height: 'auto' }
  };
  return dims[type] || { width: 960, height: 540 };
}

function renderWebsitePreview() {
  const itemWrapper = document.getElementById('itemWrapper');
  const itemEl = document.getElementById('currentItem');
  
  itemWrapper.style.display = 'block';
  itemWrapper.style.overflow = 'visible';
  itemWrapper.style.height = 'auto';
  
  itemEl.style.width = '100%';
  itemEl.style.maxWidth = '100%';
  itemEl.style.height = 'auto';
  itemEl.style.margin = '0';
  itemEl.style.background = 'transparent';
  
  let html = '<div class="website-container" style="max-width: 100%; margin: 0;">';
  
  project.items.forEach((item, index) => {
    const layout = getLayoutById(item.layout);
    // Use the website-specific rendering which creates proper sections
    html += renderWebsiteLayout(layout, item, getLayoutClass(item.layout));
  });
  
  html += '</div>';
  itemEl.innerHTML = html;
}

function renderSidebar() {
  const container = document.getElementById('itemsList');
  const config = CONTENT_TYPES[currentContentType];

  if (project.items.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = project.items.map((item, i) => {
    const layout = getLayoutById(item.layout);
    const preview = getItemPreview(item);
    const isActive = i === project.currentIndex ? 'active' : '';
    
    return `
      <div class="page-item ${isActive}" draggable="true" 
           ondragstart="handleDragStart(event, ${i})"
           ondragover="handleDragOver(event)"
           ondrop="handleDrop(event, ${i})"
           onclick="changeItem(${i})">
        <div class="page-num">${currentContentType === 'resume' ? 'P' + (Math.floor(i / 3) + 1) : i + 1}</div>
        <div class="page-info">
          <div class="page-title">${layout?.name || 'Item'}</div>
          <div class="page-type">${preview.substring(0, 25)}</div>
        </div>
        <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
      </div>
    `;
  }).join('');
}

let draggedIndex = null;

function handleDragStart(event, index) {
  draggedIndex = index;
  event.dataTransfer.effectAllowed = 'move';
  event.target.classList.add('dragging');
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleDrop(event, targetIndex) {
  event.preventDefault();
  
  if (draggedIndex === null || draggedIndex === targetIndex) {
    return;
  }

  saveState();
  
  const items = [...project.items];
  const [movedItem] = items.splice(draggedIndex, 1);
  items.splice(targetIndex, 0, movedItem);
  
  project.items = items;
  project.currentIndex = targetIndex;
  
  draggedIndex = null;
  renderAll();
  saveProjectToStorage();
  showToast('Item moved');
}

function getItemPreview(item) {
  const keys = Object.keys(item.content);
  for (const key of keys) {
    if (item.content[key] && item.content[key].length > 0) {
      return item.content[key];
    }
  }
  return 'Empty';
}

function renderItem() {
  const emptyCanvas = document.getElementById('emptyCanvas');
  const itemWrapper = document.getElementById('itemWrapper');
  const config = CONTENT_TYPES[currentContentType];

  if (project.items.length === 0) {
    emptyCanvas.style.display = 'flex';
    itemWrapper.style.display = 'none';
    return;
  }

  emptyCanvas.style.display = 'none';
  itemWrapper.style.display = 'block';

  // For website mode, render all sections as one continuous page
  if (currentContentType === 'website') {
    renderWebsitePreview();
    return;
  }

  const item = project.items[project.currentIndex];
  const itemEl = document.getElementById('currentItem');
  
  itemEl.style.aspectRatio = config.aspectRatio;
  itemEl.style.maxWidth = config.width + 'px';
  if (config.height !== 'auto') {
    itemEl.style.maxHeight = config.height + 'px';
  }
  itemEl.style.background = item.colors.bg;
  itemEl.style.color = item.colors.text;

  const layout = getLayoutById(item.layout);
  itemEl.innerHTML = renderItemContent(layout, item);
}

function renderItemContent(layout, item) {
  if (!layout) {
    return `<div style="padding: 40px;"><h2>${item.layout}</h2><p>Layout not found</p></div>`;
  }

  const layoutId = layout.id;
  const colors = item.colors;
  
  // Get layout-specific CSS class
  const layoutClass = getLayoutClass(layoutId);
  
  // For website mode, render differently
  if (currentContentType === 'website') {
    return renderWebsiteLayout(layout, item, layoutClass);
  }
  
  // For presentation and other modes
  return renderPresentationLayout(layout, item, layoutClass);
}

function getLayoutClass(layoutId) {
  // Map layout IDs to CSS classes
  const classMap = {
    // Title variations
    'title-slide': 'layout-title-classic',
    'title-centered': 'layout-title-centered',
    'title-split': 'layout-title-split',
    'title-gradient': 'layout-title-gradient',
    'title-minimal': 'layout-title-minimal',
    'title-bold': 'layout-title-bold',
    'title-elegant': 'layout-title-elegant',
    'title-modern': 'layout-title-modern',
    
    // Bullet variations
    'content-slide': 'layout-bullets-standard',
    'bullets-icon': 'layout-bullets-icon',
    'bullets-numbered': 'layout-bullets-numbered',
    'bullets-cards': 'layout-bullets-cards',
    'bullets-split': 'layout-bullets-split',
    'bullets-hierarchy': 'layout-bullets-hierarchy',
    'bullets-checklist': 'layout-bullets-checklist',
    'bullets-quote': 'layout-bullets-quote',
    
    // Column layouts
    'two-column': 'layout-two-column',
    'three-column': 'layout-three-column',
    'comparison-table': 'layout-comparison-table',
    'vs-slide': 'layout-vs-battle',
    'pros-cons': 'layout-pros-cons',
    'before-after': 'layout-before-after',
    
    // Quotes
    'quote-slide': 'layout-quote-simple',
    'quote-large': 'layout-quote-large',
    'quote-boxed': 'layout-quote-boxed',
    'quote-pullout': 'layout-quote-pullout',
    'quote-testimonial': 'layout-quote-testimonial',
    
    // Statistics
    'stat-slide': 'layout-stats-grid',
    'stats-big': 'layout-stats-big',
    'stats-compare': 'layout-stats-compare',
    'stats-trio': 'layout-stats-trio',
    'kpi-dashboard': 'layout-kpi-dashboard',
    
    // Diagrams
    'mermaid-flowchart': 'layout-mermaid-flowchart',
    'mermaid-sequence': 'layout-mermaid-sequence',
    'mermaid-gantt': 'layout-mermaid-gantt',
    'mermaid-pie': 'layout-mermaid-pie',
    'chart-bar': 'layout-chart-bar',
    'chart-line': 'layout-chart-line',
    'swot-analysis': 'layout-swot-analysis',
    'funnel-chart': 'layout-funnel-chart',
    'pyramid-chart': 'layout-pyramid-chart',
    
    // Team
    'team-slide': 'layout-team-grid',
    'team-spotlight': 'layout-team-spotlight',
    'org-chart': 'layout-org-chart',
    'speaker-intro': 'layout-speaker-intro',
    'testimonial-grid': 'layout-testimonial-grid',
    
    // Closing
    'thank-you-slide': 'layout-thanks-standard',
    'thank-you-minimal': 'layout-thanks-minimal',
    'cta-final': 'layout-cta-final',
    'q-a': 'layout-qa',
    'next-steps': 'layout-next-steps',
    'contact-info': 'layout-contact-info'
  };
  
  return classMap[layoutId] || 'layout-default';
}

function renderPresentationLayout(layout, item, layoutClass) {
  const slots = layout.slots || {};
  const content = item.content || {};
  const colors = item.colors;
  
  let html = `<div class="${layoutClass}" style="padding: 40px; height: 100%; background: ${colors.bg}; color: ${colors.text};">`;
  
  // Special rendering based on layout type
  switch(layout.id) {
    // Title variations
    case 'title-slide':
    case 'title-centered':
      html += `
        <h1 contenteditable="true" onblur="updateContent('title', this.innerText)">${content.title || 'Your Title'}</h1>
        <div class="subtitle" contenteditable="true" onblur="updateContent('subtitle', this.innerText)">${content.subtitle || 'Subtitle'}</div>
      `;
      break;
      
    case 'title-split':
      html += `
        <h1 contenteditable="true" onblur="updateContent('title', this.innerText)">${content.title || 'Main Title'}</h1>
        <div class="side-content" contenteditable="true" onblur="updateContent('sideText', this.innerText)">${content.sideText || 'Side content...'}</div>
      `;
      break;
      
    case 'title-gradient':
      html += `
        <h1 contenteditable="true" onblur="updateContent('title', this.innerText)" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${content.title || 'Bold Title'}</h1>
        <div class="tagline" contenteditable="true" onblur="updateContent('tagline', this.innerText)">${content.tagline || 'TAGLINE'}</div>
      `;
      break;
      
    case 'title-bold':
      html += `
        <h1 contenteditable="true" onblur="updateContent('title', this.innerText)" style="font-size: 72px; font-weight: 900; text-transform: uppercase;">${content.title || 'BIG TITLE'}</h1>
        <div class="subtitle" contenteditable="true" onblur="updateContent('subtitle', this.innerText)" style="font-size: 20px; letter-spacing: 4px; text-transform: uppercase;">${content.subtitle || 'SUBTITLE'}</div>
      `;
      break;
      
    // Bullet variations
    case 'bullets-numbered':
      html += `
        <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 32px; margin-bottom: 30px;">${content.heading || 'Steps'}</h2>
        <div class="step-list">
          <div class="step-item"><div class="step-number" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});"></div><div contenteditable="true" onblur="updateContent('step1', this.innerText)">${content.step1 || 'Step 1'}</div></div>
          <div class="step-item"><div class="step-number" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});"></div><div contenteditable="true" onblur="updateContent('step2', this.innerText)">${content.step2 || 'Step 2'}</div></div>
          <div class="step-item"><div class="step-number" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});"></div><div contenteditable="true" onblur="updateContent('step3', this.innerText)">${content.step3 || 'Step 3'}</div></div>
          <div class="step-item"><div class="step-number" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});"></div><div contenteditable="true" onblur="updateContent('step4', this.innerText)">${content.step4 || 'Step 4'}</div></div>
        </div>
      `;
      break;
      
    case 'bullets-cards':
      html += `
        <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 32px; margin-bottom: 30px;">${content.heading || 'Features'}</h2>
        <div class="card-grid">
          <div class="feature-card" style="background: rgba(255,255,255,0.1); border: 2px solid ${colors.primary};">
            <div class="card-icon">✨</div>
            <div contenteditable="true" onblur="updateContent('card1', this.innerText)">${content.card1 || 'Card 1'}</div>
          </div>
          <div class="feature-card" style="background: rgba(255,255,255,0.1); border: 2px solid ${colors.primary};">
            <div class="card-icon">🚀</div>
            <div contenteditable="true" onblur="updateContent('card2', this.innerText)">${content.card2 || 'Card 2'}</div>
          </div>
          <div class="feature-card" style="background: rgba(255,255,255,0.1); border: 2px solid ${colors.primary};">
            <div class="card-icon">💡</div>
            <div contenteditable="true" onblur="updateContent('card3', this.innerText)">${content.card3 || 'Card 3'}</div>
          </div>
        </div>
      `;
      break;
      
    case 'two-column':
      html += `
        <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 32px; margin-bottom: 30px;">${content.heading || 'Section heading'}</h2>
        <div class="slide-two-col">
          <div>
            <h3 contenteditable="true" onblur="updateContent('leftTitle', this.innerText)" style="font-size: 24px; margin-bottom: 16px; color: ${colors.primary};">${content.leftTitle || 'Left title'}</h3>
            <div contenteditable="true" onblur="updateContent('leftBody', this.innerText)" style="font-size: 16px; line-height: 1.6;">${content.leftBody || 'Left content'}</div>
          </div>
          <div>
            <h3 contenteditable="true" onblur="updateContent('rightTitle', this.innerText)" style="font-size: 24px; margin-bottom: 16px; color: ${colors.primary};">${content.rightTitle || 'Right title'}</h3>
            <div contenteditable="true" onblur="updateContent('rightBody', this.innerText)" style="font-size: 16px; line-height: 1.6;">${content.rightBody || 'Right content'}</div>
          </div>
        </div>
      `;
      break;
      
    case 'pros-cons':
      html += `
        <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 32px; margin-bottom: 30px;">${content.heading || 'Analysis'}</h2>
        <div class="pros-cons-grid">
          <div class="pros" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05)); border: 2px solid #22c55e; border-radius: 16px; padding: 30px;">
            <h3 style="font-size: 20px; margin-bottom: 15px; color: #22c55e;">👍 PROS</h3>
            <div contenteditable="true" onblur="updateContent('pros', this.innerText)" style="white-space: pre-line;">${content.pros || '✓ Benefits...'}</div>
          </div>
          <div class="cons" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05)); border: 2px solid #ef4444; border-radius: 16px; padding: 30px;">
            <h3 style="font-size: 20px; margin-bottom: 15px; color: #ef4444;">👎 CONS</h3>
            <div contenteditable="true" onblur="updateContent('cons', this.innerText)" style="white-space: pre-line;">${content.cons || '✗ Drawbacks...'}</div>
          </div>
        </div>
      `;
      break;
      
    case 'quote-slide':
      html += `
        <div class="slide-quote" style="font-size: 36px; font-style: italic; text-align: center; max-width: 80%; margin: 0 auto; line-height: 1.4;">
          <div contenteditable="true" onblur="updateContent('quote', this.innerText)">${content.quote || 'Quote text'}</div>
        </div>
        <div class="slide-author" style="text-align: center; margin-top: 20px; font-size: 18px;">
          <div contenteditable="true" onblur="updateContent('author', this.innerText)">${content.author || '— Author name'}</div>
        </div>
      `;
      break;
      
    case 'stat-slide':
      html += `
        <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 32px; margin-bottom: 40px;">${content.heading || 'Our Stats'}</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; text-align: center;">
          <div>
            <div contenteditable="true" onblur="updateContent('stat1', this.innerText)" style="font-size: 56px; font-weight: 800; color: ${colors.primary};">${content.stat1 || '100%'}</div>
            <div contenteditable="true" onblur="updateContent('label1', this.innerText)" style="font-size: 16px; opacity: 0.8;">${content.label1 || 'Complete'}</div>
          </div>
          <div>
            <div contenteditable="true" onblur="updateContent('stat2', this.innerText)" style="font-size: 56px; font-weight: 800; color: ${colors.primary};">${content.stat2 || '50+'}</div>
            <div contenteditable="true" onblur="updateContent('label2', this.innerText)" style="font-size: 16px; opacity: 0.8;">${content.label2 || 'Projects'}</div>
          </div>
        </div>
      `;
      break;
      
    case 'stats-big':
      html += `
        <div class="layout-stats-big" style="text-align: center;">
          <div contenteditable="true" onblur="updateContent('number', this.innerText)" style="font-size: 100px; font-weight: 900; background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${content.number || '1M+'}</div>
          <div contenteditable="true" onblur="updateContent('label', this.innerText)" style="font-size: 28px; font-weight: 600; margin: 10px 0;">${content.label || 'Total Users'}</div>
          <div contenteditable="true" onblur="updateContent('context', this.innerText)" style="font-size: 16px; opacity: 0.7;">${content.context || 'Context'}</div>
        </div>
      `;
      break;
      
    case 'thank-you-slide':
      html += `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
          <h1 contenteditable="true" onblur="updateContent('mainText', this.innerText)" style="font-size: 64px; font-weight: 700; margin-bottom: 20px;">${content.mainText || 'Thank You!'}</h1>
          <div contenteditable="true" onblur="updateContent('subtitle', this.innerText)" style="font-size: 20px; opacity: 0.8;">${content.subtitle || 'Contact info'}</div>
        </div>
      `;
      break;
      
    // Default/generic rendering
    default:
      html += renderGenericSlots(layout, content, colors);
  }
  
  html += '</div>';
  return html;
}

function renderWebsiteLayout(layout, item, layoutClass) {
  const slots = layout.slots || {};
  const content = item.content || {};
  const colors = item.colors;
  
  let html = '';
  
  // Website sections render differently - no wrapper padding
  switch(layout.id) {
    case 'hero-section':
    case 'hero-gradient':
      html += `
        <section class="website-hero ${layoutClass}" style="background: ${colors.bg}; color: ${colors.text}; min-height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 100px 40px;">
          <h1 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 56px; font-weight: 800; margin-bottom: 24px; max-width: 800px;">${content.heading || 'Hero Headline'}</h1>
          <div contenteditable="true" onblur="updateContent('subheadline', this.innerText)" style="font-size: 22px; opacity: 0.9; margin-bottom: 40px; max-width: 600px;">${content.subheadline || 'Subheadline text that explains your value proposition'}</div>
          <div style="display: flex; gap: 20px;">
            <button style="padding: 16px 40px; background: ${colors.primary}; color: white; border: none; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer;" contenteditable="true" onblur="updateContent('ctaPrimary', this.innerText)">${content.ctaPrimary || 'Get Started'}</button>
          </div>
        </section>
      `;
      break;
      
    case 'features-section':
      html += `
        <section class="website-features ${layoutClass}" style="background: ${colors.bg}; color: ${colors.text}; padding: 100px 40px;">
          <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 42px; text-align: center; margin-bottom: 60px;">${content.heading || 'Our Features'}</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; padding: 30px;">
              <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
              <div contenteditable="true" onblur="updateContent('feature1', this.innerText)" style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">${content.feature1 || 'Feature 1'}</div>
            </div>
            <div style="text-align: center; padding: 30px;">
              <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
              <div contenteditable="true" onblur="updateContent('feature2', this.innerText)" style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">${content.feature2 || 'Feature 2'}</div>
            </div>
            <div style="text-align: center; padding: 30px;">
              <div style="font-size: 48px; margin-bottom: 16px;">💡</div>
              <div contenteditable="true" onblur="updateContent('feature3', this.innerText)" style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">${content.feature3 || 'Feature 3'}</div>
            </div>
          </div>
        </section>
      `;
      break;
      
    case 'about-section':
      html += `
        <section class="website-about ${layoutClass}" style="background: ${colors.bg}; color: ${colors.text}; padding: 100px 40px;">
          <div style="max-width: 800px; margin: 0 auto; text-align: center;">
            <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 42px; margin-bottom: 30px;">${content.heading || 'About Us'}</h2>
            <div contenteditable="true" onblur="updateContent('body', this.innerText)" style="font-size: 18px; line-height: 1.8;">${content.body || 'About text...'}</div>
          </div>
        </section>
      `;
      break;
      
    case 'cta-section':
      html += `
        <section class="website-cta ${layoutClass}" style="background: ${colors.bg}; color: ${colors.text}; padding: 120px 40px; text-align: center;">
          <h2 contenteditable="true" onblur="updateContent('heading', this.innerText)" style="font-size: 48px; font-weight: 700; margin-bottom: 20px;">${content.heading || 'Ready to start?'}</h2>
          <div contenteditable="true" onblur="updateContent('body', this.innerText)" style="font-size: 20px; max-width: 600px; margin: 0 auto 40px; opacity: 0.9;">${content.body || 'CTA message'}</div>
          <button style="padding: 18px 50px; background: ${colors.primary}; color: white; border: none; border-radius: 8px; font-size: 20px; font-weight: 600; cursor: pointer;" contenteditable="true" onblur="updateContent('ctaText', this.innerText)">${content.ctaText || 'Button text'}</button>
        </section>
      `;
      break;
      
    case 'footer-section':
      html += `
        <footer class="website-footer ${layoutClass}" style="background: ${colors.bg}; color: ${colors.text}; padding: 60px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
          <div contenteditable="true" onblur="updateContent('brand', this.innerText)" style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${content.brand || 'Brand Name'}</div>
          <div contenteditable="true" onblur="updateContent('copyright', this.innerText)" style="font-size: 14px; opacity: 0.7;">${content.copyright || '© 2024 Brand'}</div>
        </footer>
      `;
      break;
      
    default:
      // Generic website section
      html += `
        <section class="website-section ${layoutClass}" style="background: ${colors.bg}; color: ${colors.text}; padding: 100px 40px;">
          <div style="max-width: 1000px; margin: 0 auto;">
            ${renderGenericSlots(layout, content, colors)}
          </div>
        </section>
      `;
  }
  
  return html;
}

function renderGenericSlots(layout, content, colors) {
  let html = '';
  Object.keys(layout.slots || {}).forEach(slotId => {
    const slot = layout.slots[slotId];
    const value = content[slotId] || slot.placeholder || '';
    const isHeading = slotId === 'heading' || slotId === 'title';
    const isBody = slotId === 'body' || slotId === 'subtitle' || slotId === 'subheadline';
    
    if (isHeading) {
      html += `<h1 style="color: ${colors.primary}; margin-bottom: 16px; font-size: ${slotId === 'title' ? '48' : '36'}px; font-weight: 700;" contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</h1>`;
    } else if (isBody) {
      html += `<p style="font-size: 18px; line-height: 1.6; margin-bottom: 16px;" contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</p>`;
    } else if (slot.type === 'textarea') {
      html += `<div style="margin-top: 12px; font-size: 16px; line-height: 1.5; white-space: pre-line;" contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</div>`;
    } else {
      html += `<div style="margin-top: 8px; font-size: 16px;" contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</div>`;
    }
  });
  return html;
}

function renderFields() {
  if (project.items.length === 0) return;

  const item = project.items[project.currentIndex];
  const layout = getLayoutById(item.layout);
  const container = document.getElementById('fieldsContainer');

  if (!layout) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  Object.keys(layout.slots || {}).forEach(slotId => {
    const slot = layout.slots[slotId];
    if (['heading', 'title', 'body', 'subtitle', 'subheadline'].includes(slotId)) return;
    
    const value = item.content[slotId] || '';
    html += `
      <div class="property-group">
        <label>${capitalize(slotId.replace(/-/g, ' '))}</label>
        <input type="text" value="${value}" 
               onchange="updateContent('${slotId}', this.value)"
               onblur="updateContent('${slotId}', this.value)">
      </div>
    `;
  });
  container.innerHTML = html;

  // Colors
  document.getElementById('bgColor').value = item.colors.bg || '#ffffff';
  document.getElementById('textColor').value = item.colors.text || '#333333';
  document.getElementById('primaryColor').value = item.colors.primary || '#3b82f6';
  document.getElementById('secondaryColor').value = item.colors.secondary || '#64748b';
  document.getElementById('animationSelect').value = item.animation || 'none';
}

function populateLayoutSelect() {
  const select = document.getElementById('layoutSelect');
  const filtered = getFilteredLayouts('all');
  
  select.innerHTML = '<option value="">Select layout...</option>' +
    filtered.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
}

function updateCounter() {
  const counter = document.getElementById('itemCounter');
  counter.textContent = project.items.length > 0 
    ? `${project.currentIndex + 1} / ${project.items.length}` 
    : '0 / 0';
}

// Content Updates
function updateContent(fieldId, value) {
  if (project.items.length === 0) return;
  saveState();
  project.items[project.currentIndex].content[fieldId] = value;
  renderItem();
  saveProjectToStorage();
}

function updateColor(type, value) {
  if (project.items.length === 0) return;
  saveState();
  project.items[project.currentIndex].colors[type] = value;
  renderItem();
  saveProjectToStorage();
}

function changeLayout(layoutId) {
  if (project.items.length === 0) return;
  const layout = getLayoutById(layoutId);
  if (!layout) return;

  saveState();
  const item = project.items[project.currentIndex];
  item.layout = layoutId;
  item.content = {};
  
  Object.keys(layout.slots || {}).forEach(slotId => {
    item.content[slotId] = layout.slots[slotId].placeholder || '';
  });

  renderAll();
  saveProjectToStorage();
}

function changeAnimation(animation) {
  if (project.items.length === 0) return;
  saveState();
  project.items[project.currentIndex].animation = animation;
  saveProjectToStorage();
}

// Zoom
function zoomIn() {
  project.zoom = Math.min(1.5, project.zoom + 0.1);
  updateZoom();
}

function zoomOut() {
  project.zoom = Math.max(0.5, project.zoom - 0.1);
  updateZoom();
}

function updateZoom() {
  const wrapper = document.getElementById('itemWrapper');
  const item = document.getElementById('currentItem');
  
  // For non-website items, scale the wrapper
  if (currentContentType !== 'website' && wrapper) {
    wrapper.style.transform = `scale(${project.zoom})`;
    wrapper.style.transformOrigin = 'top center';
  }
  
  // Show zoom level
  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) {
    zoomLevel.textContent = Math.round(project.zoom * 100) + '%';
  }
}

// Theme Modal
function showThemeModal() {
  document.getElementById('themeModal').classList.add('show');
}

function hideThemeModal() {
  document.getElementById('themeModal').classList.remove('show');
}

function renderThemeOptions() {
  const grid = document.getElementById('themeGrid');
  grid.innerHTML = themes.map(t => `
    <div class="theme-option ${project.theme?.id === t.id ? 'selected' : ''}" 
         onclick="applyTheme('${t.id}')">
      <div class="theme-preview">
        <div class="theme-preview-bg" style="background:${t.colors.bg}"></div>
        <div class="theme-preview-bg" style="background:${t.colors.primary}"></div>
        <div class="theme-preview-bg" style="background:${t.colors.secondary}"></div>
      </div>
      <div class="theme-name">${t.name}</div>
    </div>
  `).join('');
}

function applyTheme(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;

  saveState();
  project.theme = theme;
  project.items.forEach(item => {
    item.colors = { ...theme.colors };
  });

  renderAll();
  renderThemeOptions();
  saveProjectToStorage();
  showToast('Theme applied');
}

// Export
function showExportModal() {
  document.getElementById('exportModal').classList.add('show');
}

function hideExportModal() {
  document.getElementById('exportModal').classList.remove('show');
}

function doExport() {
  const format = document.getElementById('exportFormat').value;
  hideExportModal();

  switch (format) {
    case 'html': exportHTML(); break;
    case 'pptx': exportPPTX(); break;
    case 'pdf': exportPDF(); break;
    case 'png': case 'jpg': exportImage(format); break;
    case 'zip': exportZIP(); break;
  }
}

function exportHTML() {
  const config = CONTENT_TYPES[currentContentType];
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">`;
  html += `<title>${config.name}</title>`;
  html += `<style>
    body{font-family:-apple-system,sans-serif;background:#f0f0f0;padding:20px;}
    .item{background:white;margin:0 auto 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;}
  </style></head><body>`;

  project.items.forEach(item => {
    const layout = getLayoutById(item.layout);
    html += `<div class="item" style="width:${config.width}px;height:${config.height === 'auto' ? 'auto' : config.height + 'px'};background:${item.colors.bg};color:${item.colors.text};">`;
    html += renderItemContent(layout, item);
    html += `</div>`;
  });

  html += `</body></html>`;
  downloadFile(html, `${config.name.toLowerCase()}-${Date.now()}.html`, 'text/html');
  showToast('HTML exported');
}

function exportPPTX() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Presentation';
  pptx.author = 'Visual Editor';
  pptx.subject = 'Presentation';

  project.items.forEach(item => {
    const slide = pptx.addSlide();
    const layout = getLayoutById(item.layout);
    const bgColor = item.colors.bg.replace('#', '');
    const textColor = item.colors.text.replace('#', '');
    const primaryColor = item.colors.primary.replace('#', '');
    const secondaryColor = item.colors.secondary.replace('#', '');

    slide.background = { color: bgColor };

    const shapes = [];

    if (layout && layout.slots) {
      Object.keys(layout.slots).forEach(slotId => {
        const slot = layout.slots[slotId];
        const value = item.content[slotId] || slot.placeholder || '';
        const isTitle = slotId === 'title' || slotId === 'heading';
        const isBody = slotId === 'body' || slotId === 'subtitle' || slotId === 'subheadline';

        if (isTitle) {
          slide.addText(value, {
            x: 0.5, y: 0.5, w: 8.5, h: 1.5,
            fontSize: isTitle && slotId === 'title' ? 44 : 32,
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
        } else if (slot.type === 'textarea') {
          slide.addText(value, {
            x: 0.5, y: 2, w: 8.5, h: 4,
            fontSize: 14,
            color: textColor,
            fontFace: 'Arial',
            valign: 'top'
          });
        } else if (value) {
          slide.addText(value, {
            x: 0.5, y: isTitle ? 0.5 : 2, w: 8.5, h: 0.8,
            fontSize: 16,
            color: textColor,
            fontFace: 'Arial'
          });
        }
      });
    } else {
      slide.addText(item.layout, {
        x: 1, y: 2, w: 7, h: 1,
        fontSize: 24,
        color: textColor,
        align: 'center'
      });
    }
  });

  pptx.writeFile({ fileName: 'presentation.pptx' });
  showToast('PPTX exported');
}

async function exportPDF() {
  showToast('Generating PDF...');

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: currentContentType === 'resume' ? 'portrait' : 'landscape',
    unit: 'px',
    format: currentContentType === 'resume' ? 'a4' : [960, 540]
  });

  for (let i = 0; i < project.items.length; i++) {
    if (i > 0) pdf.addPage();

    const item = project.items[i];
    const layout = getLayoutById(item.layout);

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

    let html = '';
    if (layout && layout.slots) {
      Object.keys(layout.slots).forEach(slotId => {
        const slot = layout.slots[slotId];
        const value = item.content[slotId] || slot.placeholder || '';
        const isTitle = slotId === 'title' || slotId === 'heading';
        const isBody = slotId === 'body' || slotId === 'subtitle' || slotId === 'subheadline';

        if (isTitle) {
          const fontSize = slotId === 'title' ? 36 : 28;
          html += `<h1 style="color: ${item.colors.primary}; margin-bottom: 16px; font-size: ${fontSize}px; font-weight: bold;">${value}</h1>`;
        } else if (isBody) {
          html += `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">${value}</p>`;
        } else if (slot.type === 'textarea') {
          html += `<div style="margin-top: 12px; font-size: 14px;">${value}</div>`;
        } else if (value) {
          html += `<div style="margin-top: 8px; font-size: 14px;">${value}</div>`;
        }
      });
    }

    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const props = pdf.getImageProperties(imgData);

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

async function exportImage(format) {
  if (project.items.length === 0) {
    showToast('No items to export');
    return;
  }

  showToast('Generating image...');

  const item = project.items[project.currentIndex];
  const layout = getLayoutById(item.layout);
  const config = CONTENT_TYPES[currentContentType];

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

  let html = '';
  if (layout && layout.slots) {
    Object.keys(layout.slots).forEach(slotId => {
      const slot = layout.slots[slotId];
      const value = item.content[slotId] || slot.placeholder || '';
      const isTitle = slotId === 'title' || slotId === 'heading';
      const isBody = slotId === 'body' || slotId === 'subtitle' || slotId === 'subheadline';

      if (isTitle) {
        const fontSize = slotId === 'title' ? 36 : 28;
        html += `<h1 style="color: ${item.colors.primary}; margin-bottom: 16px; font-size: ${fontSize}px; font-weight: bold;">${value}</h1>`;
      } else if (isBody) {
        html += `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">${value}</p>`;
      } else if (slot.type === 'textarea') {
        html += `<div style="margin-top: 12px; font-size: 14px;">${value}</div>`;
      } else if (value) {
        html += `<div style="margin-top: 8px; font-size: 14px;">${value}</div>`;
      }
    });
  }

  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: null
    });

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.9 : 1.0;
    const dataUrl = canvas.toDataURL(mimeType, quality);

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

function exportZIP() {
  showToast('ZIP export coming soon!');
}

// Save/Load
function saveProject() {
  const data = JSON.stringify(project, null, 2);
  downloadFile(data, `project-${currentContentType}-${Date.now()}.json`, 'application/json');
  showToast('Project saved!');
}

function loadProject() {
  document.getElementById('loadFileInput').click();
}

function handleFileLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const loaded = JSON.parse(e.target.result);
      project = loaded;
      currentContentType = project.type || 'presentation';
      
      document.getElementById('welcomeModal').classList.remove('show');
      document.getElementById('welcomeModal').style.display = 'none';
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
  event.target.value = '';
}

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
    } catch (e) {}
  }
}

function showNewProjectModal() {
  document.getElementById('welcomeModal').classList.add('show');
  document.getElementById('welcomeModal').style.display = 'flex';
  project.items = [];
  project.currentIndex = 0;
  renderAll();
}

// Helpers
function getFilteredLayouts(category) {
  const configMap = {
    'presentation': 'presentation',
    'website': 'website',
    'resume': 'resume',
    'post': 'social',
    'analytics': 'analytics'
  };
  const targetCat = configMap[currentContentType] || currentContentType;
  
  if (category === 'all') {
    return layouts.filter(l => l.category === targetCat);
  }
  
  // Filter by subcategory if using new structure
  if (window.layoutCategories && window.layoutCategories[targetCat]) {
    return layouts.filter(l => l.category === targetCat && l.subcategory === category);
  }
  
  return layouts.filter(l => l.category === category && l.category === targetCat);
}

function getLayoutById(id) {
  return layouts.find(l => l.id === id);
}

function getLayoutCategories() {
  const configMap = {
    'presentation': 'presentation',
    'website': 'website',
    'resume': 'resume',
    'post': 'social',
    'analytics': 'analytics'
  };
  const targetCat = configMap[currentContentType] || currentContentType;
  
  // If using new segmented structure, return subcategories
  if (window.layoutCategories && window.layoutCategories[targetCat]) {
    return Object.keys(window.layoutCategories[targetCat]);
  }
  
  // Fallback to unique categories
  const filtered = getFilteredLayouts('all');
  return [...new Set(filtered.map(l => l.category))];
}

function getLayoutSubcategories() {
  const configMap = {
    'presentation': 'presentation',
    'website': 'website',
    'resume': 'resume',
    'post': 'social',
    'analytics': 'analytics'
  };
  const targetCat = configMap[currentContentType] || currentContentType;
  
  if (window.layoutCategories && window.layoutCategories[targetCat]) {
    return window.layoutCategories[targetCat];
  }
  
  return null;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Default themes
function getDefaultThemes() {
  return [
    { id: 'clean-white', name: 'Clean White', colors: { bg: '#ffffff', text: '#333333', primary: '#3b82f6', secondary: '#64748b' }},
    { id: 'dark-mode', name: 'Dark Mode', colors: { bg: '#1a1a2e', text: '#ffffff', primary: '#6366f1', secondary: '#94a3b8' }},
    { id: 'warm-sand', name: 'Warm Sand', colors: { bg: '#fffbeb', text: '#78350f', primary: '#f59e0b', secondary: '#d97706' }},
    { id: 'nature-green', name: 'Nature Green', colors: { bg: '#ecfdf5', text: '#064e3b', primary: '#10b981', secondary: '#059669' }}
  ];
}

// Default layouts
function getDefaultLayouts() {
  return [
    // Presentation Layouts
    { id: 'title-slide', name: 'Title Slide', category: 'presentation', icon: '📝', 
      slots: { title: { type: 'text', placeholder: 'Your Title' }, subtitle: { type: 'text', placeholder: 'Subtitle' }}},
    { id: 'content-slide', name: 'Content Slide', category: 'presentation', icon: '📄',
      slots: { heading: { type: 'text', placeholder: 'Heading' }, body: { type: 'textarea', placeholder: 'Body text...' }}},
    { id: 'two-column', name: 'Two Columns', category: 'presentation', icon: '🔀',
      slots: { heading: { type: 'text', placeholder: 'Section heading' }, leftTitle: { type: 'text', placeholder: 'Left title' }, leftBody: { type: 'textarea', placeholder: 'Left content' }, rightTitle: { type: 'text', placeholder: 'Right title' }, rightBody: { type: 'textarea', placeholder: 'Right content' }}},
    { id: 'quote-slide', name: 'Quote Slide', category: 'presentation', icon: '💬',
      slots: { quote: { type: 'textarea', placeholder: 'Quote text' }, author: { type: 'text', placeholder: 'Author name' }}},
    { id: 'agenda-slide', name: 'Agenda', category: 'presentation', icon: '📋',
      slots: { heading: { type: 'text', placeholder: 'Agenda' }, item1: { type: 'text', placeholder: 'Point 1' }, item2: { type: 'text', placeholder: 'Point 2' }, item3: { type: 'text', placeholder: 'Point 3' }, item4: { type: 'text', placeholder: 'Point 4' }}},
    { id: 'stat-slide', name: 'Statistics', category: 'presentation', icon: '📊',
      slots: { heading: { type: 'text', placeholder: 'Our Stats' }, stat1: { type: 'text', placeholder: '100%' }, label1: { type: 'text', placeholder: 'Label' }, stat2: { type: 'text', placeholder: '50+' }, label2: { type: 'text', placeholder: 'Label' }, stat3: { type: 'text', placeholder: '25K' }, label3: { type: 'text', placeholder: 'Label' }}},
    { id: 'timeline-slide', name: 'Timeline', category: 'presentation', icon: '📅',
      slots: { heading: { type: 'text', placeholder: 'Timeline' }, step1: { type: 'text', placeholder: '2020 - Step 1' }, step2: { type: 'text', placeholder: '2021 - Step 2' }, step3: { type: 'text', placeholder: '2022 - Step 3' }, step4: { type: 'text', placeholder: '2023 - Step 4' }}},
    { id: 'thank-you-slide', name: 'Thank You', category: 'presentation', icon: '🙏',
      slots: { mainText: { type: 'text', placeholder: 'Thank You!' }, subtitle: { type: 'text', placeholder: 'Contact info' }}},
    { id: 'problem-solution', name: 'Problem/Solution', category: 'presentation', icon: '🎯',
      slots: { heading: { type: 'text', placeholder: 'The Challenge' }, problem: { type: 'textarea', placeholder: 'Describe the problem...' }, solution: { type: 'textarea', placeholder: 'Describe the solution...' }}},
    { id: 'team-slide', name: 'Meet the Team', category: 'presentation', icon: '👥',
      slots: { heading: { type: 'text', placeholder: 'Our Team' }, member1: { type: 'text', placeholder: 'Member 1' }, role1: { type: 'text', placeholder: 'Role' }, member2: { type: 'text', placeholder: 'Member 2' }, role2: { type: 'text', placeholder: 'Role' }}},
    { id: 'comparison-slide', name: 'Before/After', category: 'presentation', icon: '⚖️',
      slots: { heading: { type: 'text', placeholder: 'Comparison' }, before: { type: 'text', placeholder: 'Before' }, beforeDesc: { type: 'textarea', placeholder: 'Before description...' }, after: { type: 'text', placeholder: 'After' }, afterDesc: { type: 'textarea', placeholder: 'After description...' }}},
    { id: 'contact-slide', name: 'Contact', category: 'presentation', icon: '📞',
      slots: { heading: { type: 'text', placeholder: 'Get in Touch' }, email: { type: 'text', placeholder: 'email@example.com' }, phone: { type: 'text', placeholder: '+1 234 567 8900' }, website: { type: 'text', placeholder: 'www.example.com' }}},
    
    // Website Layouts
    { id: 'hero-section', name: 'Hero Section', category: 'website', icon: '🖥️',
      slots: { heading: { type: 'text', placeholder: 'Hero headline' }, subheadline: { type: 'textarea', placeholder: 'Subheadline text' }, ctaPrimary: { type: 'text', placeholder: 'Primary button' }, ctaSecondary: { type: 'text', placeholder: 'Secondary button' }}},
    { id: 'features-section', name: 'Features Section', category: 'website', icon: '✨',
      slots: { heading: { type: 'text', placeholder: 'Our Features' }, feature1: { type: 'text', placeholder: 'Feature 1' }, feature2: { type: 'text', placeholder: 'Feature 2' }, feature3: { type: 'text', placeholder: 'Feature 3' }, feature4: { type: 'text', placeholder: 'Feature 4' }}},
    { id: 'about-section', name: 'About Section', category: 'website', icon: '👤',
      slots: { heading: { type: 'text', placeholder: 'About Us' }, body: { type: 'textarea', placeholder: 'About text...' }}},
    { id: 'cta-section', name: 'Call to Action', category: 'website', icon: '🎯',
      slots: { heading: { type: 'text', placeholder: 'Ready to start?' }, body: { type: 'textarea', placeholder: 'CTA message' }, ctaText: { type: 'text', placeholder: 'Button text' }}},
    { id: 'footer-section', name: 'Footer', category: 'website', icon: '📍',
      slots: { brand: { type: 'text', placeholder: 'Brand Name' }, copyright: { type: 'text', placeholder: '© 2024 Brand' }, social1: { type: 'text', placeholder: 'Social Link 1' }, social2: { type: 'text', placeholder: 'Social Link 2' }}},
    { id: 'testimonial-section', name: 'Testimonials', category: 'website', icon: '💬',
      slots: { heading: { type: 'text', placeholder: 'What Our Clients Say' }, quote: { type: 'textarea', placeholder: 'Testimonial text...' }, author: { type: 'text', placeholder: 'Client Name' }, company: { type: 'text', placeholder: 'Company' }}},
    { id: 'pricing-section', name: 'Pricing', category: 'website', icon: '💰',
      slots: { heading: { type: 'text', placeholder: 'Pricing Plans' }, plan1: { type: 'text', placeholder: 'Basic - $9' }, plan2: { type: 'text', placeholder: 'Pro - $19' }, plan3: { type: 'text', placeholder: 'Enterprise - $49' }}},
    { id: 'team-section', name: 'Team Section', category: 'website', icon: '👥',
      slots: { heading: { type: 'text', placeholder: 'Meet Our Team' }, member1: { type: 'text', placeholder: 'Name 1' }, role1: { type: 'text', placeholder: 'Role 1' }, member2: { type: 'text', placeholder: 'Name 2' }, role2: { type: 'text', placeholder: 'Role 2' }}},
    
    // Resume Layouts
    { id: 'resume-header', name: 'Resume Header', category: 'resume', icon: '👤',
      slots: { name: { type: 'text', placeholder: 'Your Name' }, title: { type: 'text', placeholder: 'Job Title' }, email: { type: 'text', placeholder: 'email@example.com' }, phone: { type: 'text', placeholder: '+1 234 567 8900' }}},
    { id: 'resume-summary', name: 'Professional Summary', category: 'resume', icon: '📝',
      slots: { title: { type: 'text', placeholder: 'Summary' }, body: { type: 'textarea', placeholder: 'Write your professional summary...' }}},
    { id: 'resume-section', name: 'Resume Section', category: 'resume', icon: '📋',
      slots: { sectionTitle: { type: 'text', placeholder: 'Experience/Education' }, body: { type: 'textarea', placeholder: 'Section content...' }}},
    { id: 'resume-job', name: 'Job Entry', category: 'resume', icon: '💼',
      slots: { title: { type: 'text', placeholder: 'Job Title' }, company: { type: 'text', placeholder: 'Company Name' }, date: { type: 'text', placeholder: 'Jan 2020 - Present' }, description: { type: 'textarea', placeholder: 'Job responsibilities...' }}},
    { id: 'resume-skills', name: 'Skills Section', category: 'resume', icon: '⚡',
      slots: { title: { type: 'text', placeholder: 'Skills' }, skills: { type: 'text', placeholder: 'Skill 1, Skill 2, Skill 3, Skill 4' }}},
    { id: 'resume-education', name: 'Education', category: 'resume', icon: '🎓',
      slots: { degree: { type: 'text', placeholder: 'Degree' }, school: { type: 'text', placeholder: 'School Name' }, year: { type: 'text', placeholder: 'Graduation Year' }}},
    { id: 'resume-projects', name: 'Projects', category: 'resume', icon: '🚀',
      slots: { title: { type: 'text', placeholder: 'Project Name' }, description: { type: 'textarea', placeholder: 'Project description...' }, technologies: { type: 'text', placeholder: 'Technologies used' }}},
    
    // Social Post Layouts
    { id: 'instagram-square', name: 'Instagram Square', category: 'social', icon: '📷',
      slots: { headline: { type: 'text', placeholder: 'Headline' }, body: { type: 'textarea', placeholder: 'Post content' }}},
    { id: 'instagram-story', name: 'Instagram Story', category: 'social', icon: '📱',
      slots: { headline: { type: 'text', placeholder: 'Story headline' }, body: { type: 'textarea', placeholder: 'Story content' }, cta: { type: 'text', placeholder: 'Swipe up / Link' }}},
    { id: 'linkedin-post', name: 'LinkedIn Post', category: 'social', icon: '💼',
      slots: { hook: { type: 'text', placeholder: 'Hook/Attention' }, body: { type: 'textarea', placeholder: 'Post content' }, cta: { type: 'text', placeholder: 'Call to action' }}},
    { id: 'twitter-post', name: 'Twitter/X Post', category: 'social', icon: '🐦',
      slots: { content: { type: 'textarea', placeholder: 'Your tweet...' }, hashtag: { type: 'text', placeholder: '#hashtag' }}},
    { id: 'facebook-post', name: 'Facebook Post', category: 'social', icon: '👥',
      slots: { body: { type: 'textarea', placeholder: 'Post content' }, link: { type: 'text', placeholder: 'Link preview title' }}},
    { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', category: 'social', icon: '▶️',
      slots: { title: { type: 'text', placeholder: 'Video title' }, subtitle: { type: 'text', placeholder: 'Channel name' }, views: { type: 'text', placeholder: '1M views' }}},
    { id: 'pinterest-pin', name: 'Pinterest Pin', category: 'social', icon: '📌',
      slots: { title: { type: 'text', placeholder: 'Pin title' }, description: { type: 'textarea', placeholder: 'Pin description...' }}},
    { id: 'tiktok-post', name: 'TikTok Post', category: 'social', icon: '🎵',
      slots: { headline: { type: 'text', placeholder: 'Hook' }, body: { type: 'textarea', placeholder: 'Caption...' }, sound: { type: 'text', placeholder: 'Sound used' }}},
    { id: 'quote-post', name: 'Quote Post', category: 'social', icon: '💭',
      slots: { quote: { type: 'textarea', placeholder: 'Your quote...' }, author: { type: 'text', placeholder: 'Author name' }}},
    { id: 'promo-post', name: 'Promotional Post', category: 'social', icon: '📢',
      slots: { headline: { type: 'text', placeholder: 'Sale/Offer headline' }, discount: { type: 'text', placeholder: '50% OFF' }, code: { type: 'text', placeholder: 'Use code: SAVE50' }, expires: { type: 'text', placeholder: 'Limited time' }}}
  ];
}

// Start
init();
