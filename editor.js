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
    exportFormats: ['html', 'pptx', 'pdf']
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
    exportFormats: ['html', 'zip']
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
    exportFormats: ['pdf', 'html']
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
    exportFormats: ['png', 'jpg', 'html']
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

// Initialize
async function init() {
  await loadConfig();
  loadProjectFromStorage();
  updateZoom();
  console.log('Editor initialized');
}

// Load config
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    if (!response.ok) throw new Error('Config not found');
    const config = await response.json();
    layouts = config.layouts || [];
    themes = config.themes || [];
    
    console.log('Loaded layouts:', layouts.length);
    console.log('Loaded themes:', themes.length);
  } catch (e) {
    console.log('Using default config:', e.message);
    layouts = getDefaultLayouts();
    themes = getDefaultThemes();
  }
  
  if (themes.length > 0) {
    project.theme = themes[0];
  }
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
    'post': 'social'
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

  // Animation only for presentations
  document.getElementById('animationGroup').style.display = currentContentType === 'presentation' ? 'block' : 'none';

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
  project.items.splice(project.currentIndex + 1, 0, copy);
  project.currentIndex++;
  renderAll();
  saveProjectToStorage();
  showToast('Item duplicated');
}

function deleteItem() {
  if (project.items.length === 0) return;
  if (!confirm('Delete this item?')) return;
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
  
  container.innerHTML = `
    <button class="layout-category-btn active" data-category="all" onclick="filterLayouts('all')">All</button>
    ${cats.map(cat => `
      <button class="layout-category-btn" data-category="${cat}" onclick="filterLayouts('${cat}')">${capitalize(cat)}</button>
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
  const filtered = getFilteredLayouts(filterCategory);
  
  console.log('Rendering layouts for type:', currentContentType);
  console.log('Filter category:', filterCategory);
  console.log('Total layouts:', layouts.length);
  console.log('Filtered layouts:', filtered.length);

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">No layouts available</p>';
    return;
  }

  grid.innerHTML = filtered.map(layout => `
    <div class="layout-option" onclick="addItemWithLayout('${layout.id}')">
      <div class="layout-icon">${layout.icon || '📄'}</div>
      <div class="layout-name">${layout.name}</div>
    </div>
  `).join('');
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
  itemEl.style.maxWidth = '1200px';
  itemEl.style.height = 'auto';
  itemEl.style.margin = '0 auto';
  itemEl.style.background = 'transparent';
  
  let html = '<div class="website-preview">';
  
  project.items.forEach((item, index) => {
    const layout = getLayoutById(item.layout);
    html += `<div class="website-section" id="section-${index}" onclick="changeItem(${index})" style="background:${item.colors.bg};color:${item.colors.text};min-height:400px;padding:60px 40px;margin-bottom:20px;border-radius:8px;cursor:pointer;position:relative;">`;
    html += `<div class="section-number" style="position:absolute;top:10px;left:10px;background:${item.colors.primary};color:white;padding:4px 8px;border-radius:4px;font-size:12px;">Section ${index + 1}</div>`;
    html += renderItemContent(layout, item);
    html += '</div>';
  });
  
  html += '</div>';
  itemEl.innerHTML = html;
}

function renderItemContent(layout, item) {
  let html = `<div style="padding: 20px;">`;

  if (!layout) {
    html += `<h2>${item.layout}</h2><p>Layout not found</p></div>`;
    return html;
  }

  // Render based on slot type
  Object.keys(layout.slots || {}).forEach(slotId => {
    const slot = layout.slots[slotId];
    const value = item.content[slotId] || slot.placeholder || '';
    const isHeading = slotId === 'heading' || slotId === 'title';
    const isBody = slotId === 'body' || slotId === 'subtitle' || slotId === 'subheadline';
    const isTextarea = slot.type === 'textarea';

    if (isHeading) {
      html += `<h1 style="color: ${item.colors.primary}; margin-bottom: 16px; font-size: ${slotId === 'title' ? '36' : '28'}px;" 
               contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</h1>`;
    } else if (isBody) {
      html += `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;" 
               contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</p>`;
    } else if (isTextarea) {
      html += `<div style="margin-top: 12px;" contenteditable="true" 
               onblur="updateContent('${slotId}', this.innerText)">${value}</div>`;
    } else {
      html += `<div style="margin-top: 8px; font-size: 14px;" contenteditable="true" 
               onblur="updateContent('${slotId}', this.innerText)">${value}</div>`;
    }
  });

  html += `</div>`;
  return html;
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
      <div class="page-item ${isActive}" onclick="changeItem(${i})">
        <div class="page-num">${currentContentType === 'resume' ? 'P' + (Math.floor(i / 3) + 1) : i + 1}</div>
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

  emptyCanvas.style.display = 'none';
  itemWrapper.style.display = 'block';

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
  let html = `<div style="padding: 40px; height: 100%;">`;

  if (!layout) {
    html += `<h2>${item.layout}</h2><p>Layout not found</p></div>`;
    return html;
  }

  // Render based on slot type
  Object.keys(layout.slots || {}).forEach(slotId => {
    const slot = layout.slots[slotId];
    const value = item.content[slotId] || slot.placeholder || '';
    const isHeading = slotId === 'heading' || slotId === 'title';
    const isBody = slotId === 'body' || slotId === 'subtitle' || slotId === 'subheadline';
    const isTextarea = slot.type === 'textarea';

    if (isHeading) {
      html += `<h1 style="color: ${item.colors.primary}; margin-bottom: 16px; font-size: ${slotId === 'title' ? '36' : '28'}px;" 
               contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</h1>`;
    } else if (isBody) {
      html += `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;" 
               contenteditable="true" onblur="updateContent('${slotId}', this.innerText)">${value}</p>`;
    } else if (isTextarea) {
      html += `<div style="margin-top: 12px;" contenteditable="true" 
               onblur="updateContent('${slotId}', this.innerText)">${value}</div>`;
    } else {
      html += `<div style="margin-top: 8px; font-size: 14px;" contenteditable="true" 
               onblur="updateContent('${slotId}', this.innerText)">${value}</div>`;
    }
  });

  html += `</div>`;
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
  project.items[project.currentIndex].content[fieldId] = value;
  renderItem();
  saveProjectToStorage();
}

function updateColor(type, value) {
  if (project.items.length === 0) return;
  project.items[project.currentIndex].colors[type] = value;
  renderItem();
  saveProjectToStorage();
}

function changeLayout(layoutId) {
  if (project.items.length === 0) return;
  const layout = getLayoutById(layoutId);
  if (!layout) return;

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

function exportPPTX() { showToast('PowerPoint export coming soon!'); }
function exportPDF() { showToast('PDF export coming soon!'); }
function exportImage(format) { showToast('Image export coming soon!'); }
function exportZIP() { showToast('ZIP export coming soon!'); }

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
    'post': 'social'
  };
  const targetCat = configMap[currentContentType] || currentContentType;
  
  if (category === 'all') {
    return layouts.filter(l => l.category === targetCat);
  }
  return layouts.filter(l => l.category === category && l.category === targetCat);
}

function getLayoutById(id) {
  return layouts.find(l => l.id === id);
}

function getLayoutCategories() {
  const filtered = getFilteredLayouts('all');
  return [...new Set(filtered.map(l => l.category))];
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
    // Presentation
    { id: 'title-slide', name: 'Title Slide', category: 'presentation', icon: '📝', 
      slots: { title: { type: 'text', placeholder: 'Your Title' }, subtitle: { type: 'text', placeholder: 'Subtitle' }}},
    { id: 'content-slide', name: 'Content Slide', category: 'presentation', icon: '📄',
      slots: { heading: { type: 'text', placeholder: 'Heading' }, body: { type: 'textarea', placeholder: 'Body text...' }}},
    { id: 'two-column', name: 'Two Columns', category: 'presentation', icon: '🔀',
      slots: { heading: { type: 'text', placeholder: 'Section heading' }, leftTitle: { type: 'text', placeholder: 'Left title' }, leftBody: { type: 'textarea', placeholder: 'Left content' }, rightTitle: { type: 'text', placeholder: 'Right title' }, rightBody: { type: 'textarea', placeholder: 'Right content' }}},
    { id: 'quote-slide', name: 'Quote Slide', category: 'presentation', icon: '💬',
      slots: { quote: { type: 'textarea', placeholder: 'Quote text' }, author: { type: 'text', placeholder: 'Author name' }}},
    { id: 'agenda-slide', name: 'Agenda', category: 'presentation', icon: '📋',
      slots: { heading: { type: 'text', placeholder: 'Agenda' }, item1: { type: 'text', placeholder: 'Point 1' }, item2: { type: 'text', placeholder: 'Point 2' }, item3: { type: 'text', placeholder: 'Point 3' }}},
    { id: 'stat-slide', name: 'Statistics', category: 'presentation', icon: '📊',
      slots: { heading: { type: 'text', placeholder: 'Our Stats' }, stat1: { type: 'text', placeholder: '100%' }, label1: { type: 'text', placeholder: 'Label' }, stat2: { type: 'text', placeholder: '50+' }, label2: { type: 'text', placeholder: 'Label' }}},
    { id: 'timeline-slide', name: 'Timeline', category: 'presentation', icon: '📅',
      slots: { heading: { type: 'text', placeholder: 'Timeline' }, step1: { type: 'text', placeholder: '2020 - Step 1' }, step2: { type: 'text', placeholder: '2021 - Step 2' }, step3: { type: 'text', placeholder: '2022 - Step 3' }}},
    { id: 'thank-you-slide', name: 'Thank You', category: 'presentation', icon: '🙏',
      slots: { mainText: { type: 'text', placeholder: 'Thank You!' }, subtitle: { type: 'text', placeholder: 'Contact info' }}},
    
    // Website
    { id: 'hero-section', name: 'Hero Section', category: 'website', icon: '🖥️',
      slots: { heading: { type: 'text', placeholder: 'Hero headline' }, subheadline: { type: 'textarea', placeholder: 'Subheadline text' }, ctaPrimary: { type: 'text', placeholder: 'Primary button' }}},
    { id: 'features-section', name: 'Features Section', category: 'website', icon: '✨',
      slots: { heading: { type: 'text', placeholder: 'Our Features' }, feature1: { type: 'text', placeholder: 'Feature 1' }, feature2: { type: 'text', placeholder: 'Feature 2' }, feature3: { type: 'text', placeholder: 'Feature 3' }}},
    { id: 'about-section', name: 'About Section', category: 'website', icon: '👤',
      slots: { heading: { type: 'text', placeholder: 'About Us' }, body: { type: 'textarea', placeholder: 'About text...' }}},
    { id: 'cta-section', name: 'Call to Action', category: 'website', icon: '🎯',
      slots: { heading: { type: 'text', placeholder: 'Ready to start?' }, body: { type: 'textarea', placeholder: 'CTA message' }, ctaText: { type: 'text', placeholder: 'Button text' }}},
    { id: 'footer-section', name: 'Footer', category: 'website', icon: '📍',
      slots: { brand: { type: 'text', placeholder: 'Brand Name' }, copyright: { type: 'text', placeholder: '© 2024 Brand' }}},
    
    // Resume
    { id: 'resume-header', name: 'Resume Header', category: 'resume', icon: '👤',
      slots: { name: { type: 'text', placeholder: 'Your Name' }, title: { type: 'text', placeholder: 'Job Title' }, email: { type: 'text', placeholder: 'email@example.com' }}},
    { id: 'resume-section', name: 'Resume Section', category: 'resume', icon: '📋',
      slots: { sectionTitle: { type: 'text', placeholder: 'Experience/Education' }, body: { type: 'textarea', placeholder: 'Section content...' }}},
    { id: 'resume-skills', name: 'Skills Section', category: 'resume', icon: '⚡',
      slots: { title: { type: 'text', placeholder: 'Skills' }, skills: { type: 'text', placeholder: 'Skill 1, Skill 2, Skill 3' }}},
    
    // Social Posts
    { id: 'instagram-square', name: 'Instagram Square', category: 'social', icon: '📷',
      slots: { headline: { type: 'text', placeholder: 'Headline' }, body: { type: 'textarea', placeholder: 'Post content' }}},
    { id: 'instagram-story', name: 'Instagram Story', category: 'social', icon: '📱',
      slots: { headline: { type: 'text', placeholder: 'Story headline' }, body: { type: 'textarea', placeholder: 'Story content' }}},
    { id: 'linkedin-post', name: 'LinkedIn Post', category: 'social', icon: '💼',
      slots: { hook: { type: 'text', placeholder: 'Hook/Attention' }, body: { type: 'textarea', placeholder: 'Post content' }}},
    { id: 'twitter-post', name: 'Twitter/X Post', category: 'social', icon: '🐦',
      slots: { content: { type: 'textarea', placeholder: 'Your tweet...' }}},
    { id: 'facebook-post', name: 'Facebook Post', category: 'social', icon: '👥',
      slots: { body: { type: 'textarea', placeholder: 'Post content' }}},
    { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', category: 'social', icon: '▶️',
      slots: { title: { type: 'text', placeholder: 'Video title' }, subtitle: { type: 'text', placeholder: 'Channel name' }}}
  ];
}

// Start
init();
