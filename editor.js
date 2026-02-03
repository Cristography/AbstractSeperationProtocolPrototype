// Content Types Configuration
const CONTENT_TYPES = {
  presentation: {
    name: 'Presentation',
    icon: 'fa-play-circle',
    aspectRatio: '16/9',
    width: 1280,
    height: 720,
    cssFolder: 'presentations',
    layoutsFolder: 'presentations/layouts'
  },
  post: {
    name: 'Social Post',
    icon: 'fa-share-alt',
    aspectRatio: '1/1',
    width: 1080,
    height: 1080,
    cssFolder: 'posts',
    layoutsFolder: 'posts/layouts'
  },
  resume: {
    name: 'Resume',
    icon: 'fa-file-alt',
    aspectRatio: '210mm/297mm',
    width: 794,
    height: 1123,
    cssFolder: 'resume',
    layoutsFolder: 'resume/layouts'
  },
  website: {
    name: 'Website Section',
    icon: 'fa-globe',
    aspectRatio: 'auto',
    width: 1200,
    height: 'auto',
    cssFolder: 'website',
    layoutsFolder: 'website/layouts'
  }
};

// Config loaded from config.js
let layouts = [];
let themes = [];
let currentTheme = null;
let currentContentType = 'presentation';

// Project state
let project = {
  pages: [],
  currentIndex: 0,
  zoom: 1,
  contentType: 'presentation'
};

// Drag & Drop state
let draggedItem = null;
let dragOverItem = null;

// Initialize
async function init() {
  await loadConfig();
  loadProject();
  updateContentTypeButtons();
  renderLayoutOptions();
  renderThemeOptions();
  setupDragAndDrop();
  updateUI();
}

async function loadConfig() {
  try {
    const response = await fetch('config.json');
    const config = await response.json();
    layouts = config.layouts.map(layout => ({
      ...layout,
      type: layout.category // Map category to type
    }));
    themes = config.themes;
    currentTheme = themes[0];
  } catch (e) {
    console.error('Failed to load config.json');
    showToast('Using default layouts');
    layouts = getDefaultLayouts();
    themes = getDefaultThemes();
    currentTheme = themes[0];
  }
}

function getContentTypeByCategory(category) {
  const typeMap = {
    'presentation': 'presentation',
    'social': 'post',
    'resume': 'resume',
    'website': 'website'
  };
  return typeMap[category] || 'presentation';
}

function setContentType(type) {
  currentContentType = type;
  project.contentType = type;
  saveProject();
  updateCanvasPreview();
  updateLayoutFilter();
}

function updateLayoutFilter() {
  const categoryBtns = document.querySelectorAll('.layout-category-btn');
  categoryBtns.forEach(btn => {
    const cat = btn.dataset.category;
    const type = getContentTypeByCategory(cat);
    btn.classList.toggle('active', type === currentContentType);
  });
  renderLayoutOptions();
}

function getDefaultLayouts() {
  return [
    // PRESENTATIONS (16:9)
    { id: 'title-slide', name: 'Title Slide', category: 'presentation', icon: 'fa-heading', type: 'presentation', slots: [{ id: 'title', type: 'text', placeholder: 'Your Title', maxChars: 60 }, { id: 'subtitle', type: 'text', placeholder: 'Subtitle', maxChars: 100 }]},
    { id: 'content-slide', name: 'Content Slide', category: 'presentation', icon: 'fa-file-alt', type: 'presentation', slots: [{ id: 'heading', type: 'text', placeholder: 'Heading', maxChars: 50 }, { id: 'body', type: 'textarea', placeholder: 'Body text...', maxChars: 400 }]},
    { id: 'two-column', name: 'Two Columns', category: 'presentation', icon: 'fa-columns', type: 'presentation', slots: [{ id: 'heading', type: 'text', placeholder: 'Section heading', maxChars: 50 }, { id: 'left-title', type: 'text', placeholder: 'Left title', maxChars: 40 }, { id: 'left-body', type: 'textarea', placeholder: 'Left content', maxChars: 200 }, { id: 'right-title', type: 'text', placeholder: 'Right title', maxChars: 40 }, { id: 'right-body', type: 'textarea', placeholder: 'Right content', maxChars: 200 }]},
    { id: 'quote-slide', name: 'Quote Slide', category: 'presentation', icon: 'fa-quote-left', type: 'presentation', slots: [{ id: 'quote', type: 'textarea', placeholder: 'Quote text', maxChars: 250 }, { id: 'author', type: 'text', placeholder: 'Author name', maxChars: 50 }]},
    { id: 'layout-title', name: 'Title with Icon', category: 'presentation', icon: 'fa-star', type: 'presentation', slots: [{ id: 'title', type: 'text', placeholder: 'Your Title', maxChars: 60 }]},
    { id: 'layout-agenda', name: 'Agenda Process', category: 'presentation', icon: 'fa-list-ol', type: 'presentation', slots: [{ id: 'heading', type: 'text', placeholder: 'Agenda Title', maxChars: 50 }]},
    { id: 'layout-features', name: 'Features Grid', category: 'presentation', icon: 'fa-th', type: 'presentation', slots: [{ id: 'heading', type: 'text', placeholder: 'Features Title', maxChars: 50 }]},
    { id: 'layout-flowchart', name: 'Flowchart', category: 'presentation', icon: 'fa-project-diagram', type: 'presentation', slots: [{ id: 'heading', type: 'text', placeholder: 'Flowchart Title', maxChars: 50 }]},
    { id: 'layout-timeline', name: 'Timeline', category: 'presentation', icon: 'fa-history', type: 'presentation', slots: [{ id: 'heading', type: 'text', placeholder: 'Timeline Title', maxChars: 50 }]},
    { id: 'layout-thankyou', name: 'Thank You', category: 'presentation', icon: 'fa-check-circle', type: 'presentation', slots: [{ id: 'main-text', type: 'text', placeholder: 'Thank You!', maxChars: 60 }]},

    // SOCIAL POSTS
    { id: 'instagram-square', name: 'Instagram Square', category: 'social', icon: 'fa-instagram', type: 'post', slots: [{ id: 'headline', type: 'text', placeholder: 'Headline', maxChars: 80 }, { id: 'body', type: 'textarea', placeholder: 'Post content', maxChars: 250 }]},
    { id: 'instagram-story', name: 'Instagram Story', category: 'social', icon: 'fa-mobile-alt', type: 'post', slots: [{ id: 'headline', type: 'text', placeholder: 'Headline', maxChars: 60 }]},
    { id: 'linkedin-post', name: 'LinkedIn Post', category: 'social', icon: 'fa-linkedin', type: 'post', slots: [{ id: 'hook', type: 'text', placeholder: 'Hook', maxChars: 100 }, { id: 'body', type: 'textarea', placeholder: 'Post content', maxChars: 300 }]},
    { id: 'twitter-post', name: 'Twitter/X Post', category: 'social', icon: 'fa-twitter', type: 'post', slots: [{ id: 'content', type: 'textarea', placeholder: 'Your tweet...', maxChars: 280 }]},
    { id: 'facebook-post', name: 'Facebook Post', category: 'social', icon: 'fa-facebook', type: 'post', slots: [{ id: 'body', type: 'textarea', placeholder: 'Post content', maxChars: 500 }]},
    { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', category: 'social', icon: 'fa-youtube', type: 'post', slots: [{ id: 'title', type: 'text', placeholder: 'Video Title', maxChars: 60 }]},

    // RESUME
    { id: 'resume-header', name: 'Resume Header', category: 'resume', icon: 'fa-user', type: 'resume', slots: [{ id: 'name', type: 'text', placeholder: 'Your Name', maxChars: 40 }, { id: 'title', type: 'text', placeholder: 'Job Title', maxChars: 50 }]},
    { id: 'resume-section', name: 'Resume Section', category: 'resume', icon: 'fa-list', type: 'resume', slots: [{ id: 'section-title', type: 'text', placeholder: 'Section Title', maxChars: 50 }]},
    { id: 'resume-skills', name: 'Skills Section', category: 'resume', icon: 'fa-cogs', type: 'resume', slots: [{ id: 'title', type: 'text', placeholder: 'Skills', maxChars: 50 }]},
    { id: 'resume-full', name: 'Full Resume', category: 'resume', icon: 'fa-file', type: 'resume', slots: []},

    // WEBSITE
    { id: 'hero-section', name: 'Hero Section', category: 'website', icon: 'fa-desktop', type: 'website', slots: [{ id: 'headline', type: 'text', placeholder: 'Hero headline', maxChars: 60 }, { id: 'subheadline', type: 'textarea', placeholder: 'Subheadline', maxChars: 150 }]},
    { id: 'features-section', name: 'Features Section', category: 'website', icon: 'fa-th-large', type: 'website', slots: [{ id: 'heading', type: 'text', placeholder: 'Features Title', maxChars: 50 }]},
    { id: 'about-section', name: 'About Section', category: 'website', icon: 'fa-info-circle', type: 'website', slots: [{ id: 'heading', type: 'text', placeholder: 'About Title', maxChars: 50 }]},
    { id: 'cta-section', name: 'CTA Section', category: 'website', icon: 'fa-bullhorn', type: 'website', slots: [{ id: 'heading', type: 'text', placeholder: 'CTA Title', maxChars: 60 }, { id: 'body', type: 'textarea', placeholder: 'CTA description', maxChars: 200 }]},
    { id: 'footer-section', name: 'Footer Section', category: 'website', icon: 'fa-sitemap', type: 'website', slots: [{ id: 'brand', type: 'text', placeholder: 'Brand Name', maxChars: 30 }]}
  ];
}

function getDefaultThemes() {
  return [
    { id: 'clean-white', name: 'Clean White', colors: { bg: '#ffffff', text: '#333333', primary: '#3b82f6', secondary: '#64748b', accent: '#8b5cf6' }},
    { id: 'dark-mode', name: 'Dark Mode', colors: { bg: '#1a1a2e', text: '#ffffff', primary: '#6366f1', secondary: '#94a3b8', accent: '#a855f7' }},
    { id: 'warm-sand', name: 'Warm Sand', colors: { bg: '#fffbeb', text: '#78350f', primary: '#f59e0b', secondary: '#d97706', accent: '#ea580c' }}
  ];
}

// Drag & Drop Setup
function setupDragAndDrop() {
  const list = document.getElementById('pagesList');
  
  list.addEventListener('dragstart', handleDragStart);
  list.addEventListener('dragend', handleDragEnd);
  list.addEventListener('dragover', handleDragOver);
  list.addEventListener('dragleave', handleDragLeave);
  list.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
  const pageItem = e.target.closest('.page-item');
  if (!pageItem) return;
  
  draggedItem = parseInt(pageItem.dataset.index);
  pageItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  const pageItem = e.target.closest('.page-item');
  if (pageItem) {
    pageItem.classList.remove('dragging');
  }
  document.querySelectorAll('.page-item').forEach(item => {
    item.classList.remove('drag-over');
  });
  draggedItem = null;
  dragOverItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  const pageItem = e.target.closest('.page-item');
  if (!pageItem || parseInt(pageItem.dataset.index) === draggedItem) return;
  
  document.querySelectorAll('.page-item').forEach(item => item.classList.remove('drag-over'));
  pageItem.classList.add('drag-over');
  dragOverItem = parseInt(pageItem.dataset.index);
}

function handleDragLeave(e) {
  const pageItem = e.target.closest('.page-item');
  if (!pageItem || parseInt(pageItem.dataset.index) === dragOverItem) return;
  pageItem.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  if (draggedItem === null || dragOverItem === null || draggedItem === dragOverItem) return;
  
  // Reorder pages
  const [removed] = project.pages.splice(draggedItem, 1);
  project.pages.splice(dragOverItem, 0, removed);
  
  // Update current index
  if (project.currentIndex === draggedItem) {
    project.currentIndex = dragOverItem;
  } else if (draggedItem < dragOverItem && project.currentIndex > draggedItem && project.currentIndex <= dragOverItem) {
    project.currentIndex--;
  } else if (draggedItem > dragOverItem && project.currentIndex >= dragOverItem && project.currentIndex < draggedItem) {
    project.currentIndex++;
  }
  
  saveProject();
  renderPagesList();
  showToast('Slide reordered');
}

// Page Management
function addNewPage() {
  showLayoutModal();
}

function addPage(layoutId) {
  console.log('Adding page with layout:', layoutId);
  console.log('Available layouts:', layouts.map(l => l.id));

  const layout = layouts.find(l => l.id === layoutId);
  if (!layout) {
    console.error('Layout not found:', layoutId);
    alert('Layout not found: ' + layoutId);
    return;
  }

  console.log('Found layout:', layout.name);

  const page = {
    id: generateId(),
    layout: layoutId,
    content: {},
    colors: { ...currentTheme.colors },
    animation: 'none'
  };

  layout.slots.forEach(slot => {
    page.content[slot.id] = '';
  });

  project.pages.push(page);
  project.currentIndex = project.pages.length - 1;

  console.log('Page added. Total pages:', project.pages.length);

  hideLayoutModal();
  saveProject();
  updateUI();

  console.log('UI updated successfully');
}

function duplicateSlide() {
  if (project.pages.length === 0) return;
  const current = project.pages[project.currentIndex];
  const copy = JSON.parse(JSON.stringify(current));
  copy.id = generateId();
  project.pages.splice(project.currentIndex + 1, 0, copy);
  project.currentIndex++;
  saveProject();
  updateUI();
  showToast('Slide duplicated');
}

function deleteSlide() {
  if (project.pages.length === 0) return;
  if (!confirm('Delete this slide?')) return;
  project.pages.splice(project.currentIndex, 1);
  if (project.currentIndex >= project.pages.length) {
    project.currentIndex = Math.max(0, project.pages.length - 1);
  }
  saveProject();
  updateUI();
  showToast('Slide deleted');
}

function changeLayout(layoutId) {
  if (project.pages.length === 0) return;
  const layout = layouts.find(l => l.id === layoutId);
  if (!layout) return;

  const page = project.pages[project.currentIndex];
  page.layout = layoutId;
  page.content = {};
  layout.slots.forEach(slot => {
    page.content[slot.id] = '';
  });

  saveProject();
  renderSlide();
  renderFields();
}

function changeAnimation(animation) {
  if (project.pages.length === 0) return;
  project.pages[project.currentIndex].animation = animation;
  saveProject();
  renderSlide();
}

function updateContent(fieldId, value) {
  if (project.pages.length === 0) return;
  project.pages[project.currentIndex].content[fieldId] = value;
  renderSlide();
  updateCharCount(fieldId);
  saveProject();
}

function updateColor(type, value) {
  if (project.pages.length === 0) return;
  project.pages[project.currentIndex].colors[type] = value;
  renderSlide();
  saveProject();
}

// Navigation
function prevSlide() {
  if (project.currentIndex > 0) {
    project.currentIndex--;
    updateUI();
  }
}

function nextSlide() {
  if (project.currentIndex < project.pages.length - 1) {
    project.currentIndex++;
    updateUI();
  }
}

// Zoom
function zoomIn() {
  project.zoom = Math.min(2, project.zoom + 0.1);
  updateZoom();
}

function zoomOut() {
  project.zoom = Math.max(0.3, project.zoom - 0.1);
  updateZoom();
}

function updateZoom() {
  document.getElementById('slideWrapper').style.transform = `scale(${project.zoom})`;
  document.getElementById('zoomLevel').textContent = Math.round(project.zoom * 100) + '%';
}

// Rendering
function renderSlide() {
  if (project.pages.length === 0) {
    document.getElementById('emptyCanvas').style.display = 'block';
    document.getElementById('slideWrapper').style.display = 'none';
    document.getElementById('fieldsSection').style.display = 'none';
    return;
  }

  document.getElementById('emptyCanvas').style.display = 'none';
  document.getElementById('slideWrapper').style.display = 'block';
  document.getElementById('fieldsSection').style.display = 'block';

  const page = project.pages[project.currentIndex];
  const layout = layouts.find(l => l.id === page.layout);
  const colors = page.colors;
  const animClass = page.animation !== 'none' ? `animation-${page.animation}` : '';

  const slide = document.getElementById('currentSlide');
  slide.style.background = colors.bg;
  slide.style.color = colors.text;

  let html = `<div class="slide-content ${animClass}">`;

  switch (page.layout) {
    case 'title-slide':
      html += `
        <div class="center">
          <div class="slide-title editable" contenteditable="true" 
            onblur="updateContent('title', this.innerText)"
            style="color: ${colors.primary}">${page.content.title || 'Your Title'}</div>
          <div class="slide-subtitle editable" contenteditable="true"
            onblur="updateContent('subtitle', this.innerText)"
            style="color: ${colors.secondary}">${page.content.subtitle || 'Subtitle'}</div>
        </div>`;
      break;

    case 'agenda-slide':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('title', this.innerText)"
          style="color: ${colors.primary}; font-size: 36px; margin-bottom: 32px;">${page.content.title || 'Agenda'}</div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${[1,2,3,4,5].map(i => `<div class="editable" contenteditable="true" style="font-size: 20px; padding: 8px 0; border-bottom: 1px solid ${colors.secondary}40">${page.content['item'+i] || 'Item '+i}</div>`).join('')}
        </div>`;
      break;

    case 'content-slide':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}">${page.content.heading || 'Heading'}</div>
        <div class="slide-body editable" contenteditable="true"
          onblur="updateContent('body', this.innerText)">${page.content.body || 'Body text...'}</div>
        ${page.content.footer ? `<div class="slide-footer editable" contenteditable="true" onblur="updateContent('footer', this.innerText)">${page.content.footer}</div>` : ''}`;
      break;

    case 'two-column':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 24px;">${page.content.heading || 'Section'}</div>
        <div class="slide-two-col">
          <div>
            <div class="editable" contenteditable="true" style="font-size: 20px; font-weight: 600; color: ${colors.primary}; margin-bottom: 12px" onblur="updateContent('left-title', this.innerText)">${page.content['left-title'] || 'Left Title'}</div>
            <div class="slide-body editable" contenteditable="true" onblur="updateContent('left-body', this.innerText)">${page.content['left-body'] || 'Left content'}</div>
          </div>
          <div>
            <div class="editable" contenteditable="true" style="font-size: 20px; font-weight: 600; color: ${colors.primary}; margin-bottom: 12px" onblur="updateContent('right-title', this.innerText)">${page.content['right-title'] || 'Right Title'}</div>
            <div class="slide-body editable" contenteditable="true" onblur="updateContent('right-body', this.innerText)">${page.content['right-body'] || 'Right content'}</div>
          </div>
        </div>`;
      break;

    case 'three-column':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 32px;">${page.content.heading || 'Section'}</div>
        <div class="slide-two-col" style="grid-template-columns: 1fr 1fr 1fr; gap: 24px;">
          ${[1,2,3].map(i => `
            <div style="text-align: center;">
              <div class="editable" contenteditable="true" style="font-size: 18px; font-weight: 600; color: ${colors.primary}; margin-bottom: 8px" onblur="updateContent('col${i}-title', this.innerText)">${page.content['col'+i+'-title'] || 'Column '+i}</div>
              <div class="slide-body editable" contenteditable="true" style="font-size: 14px" onblur="updateContent('col${i}-body', this.innerText)">${page.content['col'+i+'-body'] || 'Content'}</div>
            </div>
          `).join('')}
        </div>`;
      break;

    case 'image-slide':
      html += `
        <div class="slide-two-col">
          <div>
            <div class="slide-heading editable" contenteditable="true"
              onblur="updateContent('heading', this.innerText)"
              style="color: ${colors.primary}">${page.content.heading || 'Heading'}</div>
            <div class="slide-body editable" contenteditable="true"
              onblur="updateContent('body', this.innerText)">${page.content.body || 'Description'}</div>
          </div>
          <div style="background: ${colors.secondary}30; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
            <span style="color: ${colors.secondary}">🖼️ Image Placeholder</span>
          </div>
        </div>
        ${page.content['image-caption'] ? `<div class="slide-footer editable" contenteditable="true" onblur="updateContent('image-caption', this.innerText)" style="text-align: center; color: ${colors.secondary}">${page.content['image-caption']}</div>` : ''}`;
      break;

    case 'quote-slide':
      html += `
        <div class="center" style="height: 100%; justify-content: center;">
          <div style="font-size: 56px; color: ${colors.primary}; margin-bottom: 24px;">"</div>
          <div class="slide-quote editable" contenteditable="true"
            onblur="updateContent('quote', this.innerText)"
            style="font-size: 32px; font-style: italic; max-width: 80%; margin-bottom: 24px;">${page.content.quote || 'Your quote here'}</div>
          <div class="slide-author editable" contenteditable="true"
            onblur="updateContent('author', this.innerText)"
            style="font-size: 18px; color: ${colors.secondary};">— ${page.content.author || 'Author'}</div>
          ${page.content.title ? `<div class="editable" contenteditable="true" style="font-size: 14px; color: ${colors.secondary}" onblur="updateContent('title', this.innerText)">${page.content.title}</div>` : ''}
        </div>`;
      break;

    case 'stat-slide':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 40px; text-align: center;">${page.content.heading || 'Our Stats'}</div>
        <div class="slide-two-col" style="gap: 48px;">
          ${[1,2,3].map(i => `
            <div style="text-align: center;">
              <div class="editable" contenteditable="true" style="font-size: 48px; font-weight: 700; color: ${colors.primary}" onblur="updateContent('stat${i}-val', this.innerText)">${page.content['stat'+i+'-val'] || '0'}</div>
              <div class="editable" contenteditable="true" style="font-size: 18px; color: ${colors.secondary}" onblur="updateContent('stat${i}-label', this.innerText)">${page.content['stat'+i+'-label'] || 'Label'}</div>
            </div>
          `).join('')}
        </div>`;
      break;

    case 'comparison-slide':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 32px; text-align: center;">${page.content.heading || 'Comparison'}</div>
        <div class="slide-two-col" style="gap: 48px;">
          <div>
            <div class="editable" contenteditable="true" style="font-size: 20px; font-weight: 600; color: ${colors.success}; margin-bottom: 16px" onblur="updateContent('pro-title', this.innerText)">${page.content['pro-title'] || 'Pros'}</div>
            ${[1,2,3].map(i => `<div class="editable" contenteditable="true" style="font-size: 16px; margin-bottom: 8px" onblur="updateContent('pro${i}', this.innerText)">✓ ${page.content['pro'+i] || 'Pro '+i}</div>`).join('')}
          </div>
          <div>
            <div class="editable" contenteditable="true" style="font-size: 20px; font-weight: 600; color: ${colors.danger}; margin-bottom: 16px" onblur="updateContent('con-title', this.innerText)">${page.content['con-title'] || 'Cons'}</div>
            ${[1,2,3].map(i => `<div class="editable" contenteditable="true" style="font-size: 16px; margin-bottom: 8px" onblur="updateContent('con${i}', this.innerText)">✗ ${page.content['con'+i] || 'Con '+i}</div>`).join('')}
          </div>
        </div>`;
      break;

    case 'timeline-slide':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 40px; text-align: center;">${page.content.heading || 'Timeline'}</div>
        <div style="display: flex; justify-content: space-between; position: relative; margin-top: 20px;">
          <div style="position: absolute; top: 20px; left: 10%; right: 10%; height: 3px; background: ${colors.primary}"></div>
          ${[1,2,3,4].map(i => `
            <div style="text-align: center; position: relative; z-index: 1;">
              <div style="width: 40px; height: 40px; background: ${colors.primary}; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${i}</div>
              <div class="editable" contenteditable="true" style="font-size: 14px; font-weight: 500;" onblur="updateContent('step${i}', this.innerText)">${page.content['step'+i] || 'Step '+i}</div>
            </div>
          `).join('')}
        </div>`;
      break;

    case 'team-slide':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 32px; text-align: center;">${page.content.heading || 'Our Team'}</div>
        <div class="slide-two-col" style="gap: 24px;">
          ${[1,2,3,4].map(i => `
            <div style="text-align: center; padding: 16px; background: ${colors.secondary}15; border-radius: 8px;">
              <div style="width: 60px; height: 60px; background: ${colors.primary}; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">👤</div>
              <div class="editable" contenteditable="true" style="font-size: 16px; font-weight: 600;" onblur="updateContent('member${i}-name', this.innerText)">${page.content['member'+i+'-name'] || 'Name'}</div>
              <div class="editable" contenteditable="true" style="font-size: 14px; color: ${colors.secondary}" onblur="updateContent('member${i}-role', this.innerText)">${page.content['member'+i+'-role'] || 'Role'}</div>
            </div>
          `).join('')}
        </div>`;
      break;

    case 'cta-slide':
      html += `
        <div class="center" style="height: 100%;">
          <div class="slide-heading editable" contenteditable="true"
            onblur="updateContent('heading', this.innerText)"
            style="font-size: 36px; margin-bottom: 24px;">${page.content.heading || 'Ready to start?'}</div>
          <div class="slide-body editable" contenteditable="true"
            onblur="updateContent('body', this.innerText)"
            style="font-size: 20px; margin-bottom: 40px; max-width: 600px;">${page.content.body || 'Join us today'}</div>
          <div style="display: flex; gap: 16px; justify-content: center;">
            <button style="padding: 14px 32px; background: ${colors.primary}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600;" class="editable" contenteditable="true" onblur="updateContent('cta-text', this.innerText)">${page.content['cta-text'] || 'Get Started'}</button>
            ${page.content['secondary-text'] ? `<button style="padding: 14px 32px; background: transparent; color: ${colors.text}; border: 2px solid ${colors.secondary}; border-radius: 8px; font-size: 16px;" class="editable" contenteditable="true" onblur="updateContent('secondary-text', this.innerText)">${page.content['secondary-text']}</button>` : ''}
          </div>
        </div>`;
      break;

    case 'thank-you-slide':
      html += `
        <div class="center" style="height: 100%;">
          <div class="slide-heading editable" contenteditable="true"
            onblur="updateContent('main-text', this.innerText)"
            style="font-size: 48px; color: ${colors.primary}; margin-bottom: 16px;">${page.content['main-text'] || 'Thank You!'}</div>
          <div class="slide-subtitle editable" contenteditable="true"
            onblur="updateContent('subtitle', this.innerText)"
            style="font-size: 24px; margin-bottom: 40px;">${page.content.subtitle || ''}</div>
          <div class="editable" contenteditable="true" style="font-size: 18px; color: ${colors.secondary}" onblur="updateContent('contact', this.innerText)">${page.content.contact || ''}</div>
        </div>`;
      break;

    case 'instagram-post':
      const instaGradient = `background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;
      html += `
        <div class="slide-insta" style="${instaGradient}; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 48px;">
          <div class="insta-headline editable" contenteditable="true"
            onblur="updateContent('headline', this.innerText)"
            style="color: white; font-size: 42px; font-weight: 700; margin-bottom: 24px;">${page.content.headline || 'Headline'}</div>
          <div class="insta-body editable" contenteditable="true"
            onblur="updateContent('body', this.innerText)"
            style="color: rgba(255,255,255,0.9); font-size: 20px; margin-bottom: 32px;">${page.content.body || 'Post content'}</div>
          <div class="insta-cta editable" contenteditable="true"
            onblur="updateContent('cta', this.innerText)"
            style="background: white; color: #333; padding: 12px 32px; border-radius: 24px; font-weight: 600;">${page.content.cta || 'Link'}</div>
        </div>`;
      break;

    case 'instagram-story':
      const storyGradient = `background: linear-gradient(135deg, ${colors.primary}, ${colors.accent})`;
      html += `
        <div style="${storyGradient}; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px;">
          <div class="editable" contenteditable="true"
            onblur="updateContent('headline', this.innerText)"
            style="color: white; font-size: 48px; font-weight: 700; margin-bottom: 40px;">${page.content.headline || 'Story'}</div>
          <div class="editable" contenteditable="true"
            onblur="updateContent('body', this.innerText)"
            style="color: rgba(255,255,255,0.9); font-size: 24px; margin-bottom: 60px;">${page.content.body || 'Content'}</div>
          <div class="editable" contenteditable="true"
            onblur="updateContent('cta', this.innerText)"
            style="color: white; font-size: 18px; padding-bottom: 40px;">⬆️ ${page.content.cta || 'Swipe Up'}</div>
        </div>`;
      break;

    case 'linkedin-post':
      html += `
        <div style="padding: 24px;">
          <div class="editable" contenteditable="true"
            onblur="updateContent('hook', this.innerText)"
            style="font-size: 20px; font-weight: 600; color: ${colors.primary}; margin-bottom: 20px;">${page.content.hook || 'Hook'}</div>
          <div class="slide-body editable" contenteditable="true"
            onblur="updateContent('body', this.innerText)"
            style="margin-bottom: 24px;">${page.content.body || 'Post content'}</div>
          <div class="editable" contenteditable="true"
            onblur="updateContent('hashtags', this.innerText)"
            style="color: ${colors.primary}; font-size: 14px;">${page.content.hashtags || '#hashtags'}</div>
        </div>`;
      break;

    case 'carousel-card':
      html += `
        <div class="insta-card" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center;">
          <div class="insta-step editable" contenteditable="true"
            onblur="updateContent('step-num', this.innerText)"
            style="font-size: 72px; font-weight: 800; color: ${colors.primary}; margin-bottom: 16px;">${page.content['step-num'] || '01'}</div>
          <div class="insta-step-title editable" contenteditable="true"
            onblur="updateContent('title', this.innerText)"
            style="font-size: 32px; font-weight: 600; color: #333; margin-bottom: 12px;">${page.content.title || 'Title'}</div>
          <div class="insta-step-desc editable" contenteditable="true"
            onblur="updateContent('description', this.innerText)"
            style="font-size: 18px; color: #666; max-width: 70%;">${page.content.description || 'Description'}</div>
        </div>`;
      break;

    case 'twitter-post':
      html += `
        <div class="center" style="height: 100%; padding: 48px;">
          <div style="font-size: 20px; line-height: 1.5;">
            <span style="font-size: 32px; color: ${colors.primary}; margin-right: 8px;">"</span>
            <span class="editable" contenteditable="true"
              onblur="updateContent('content', this.innerText)">${page.content.content || 'Your tweet...'}</span>
          </div>
          <div style="margin-top: 32px; color: ${colors.secondary}; font-size: 14px;">
            ${page.content.content?.length || 0}/280 characters
          </div>
        </div>`;
      break;

    case 'resume-header':
      html += `
        <div class="resume-header" style="display: flex; gap: 24px; align-items: center; padding-bottom: 24px; border-bottom: 2px solid ${colors.primary}; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: ${colors.primary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px;">👤</div>
          <div class="resume-info">
            <h2 class="editable" contenteditable="true" onblur="updateContent('name', this.innerText)" style="font-size: 28px; margin-bottom: 4px;">${page.content.name || 'Your Name'}</h2>
            <p class="editable" contenteditable="true" onblur="updateContent('title', this.innerText)" style="font-size: 16px; color: ${colors.secondary}; margin-bottom: 8px;">${page.content.title || 'Job Title'}</p>
            <p class="editable" contenteditable="true" style="font-size: 12px;" onblur="updateContent('email', this.innerText)">${page.content.email || ''}</p>
            <p class="editable" contenteditable="true" style="font-size: 12px;" onblur="updateContent('phone', this.innerText)">${page.content.phone || ''}</p>
            <p class="editable" contenteditable="true" style="font-size: 12px; color: ${colors.primary};" onblur="updateContent('linkedin', this.innerText)">${page.content.linkedin || ''}</p>
          </div>
        </div>`;
      break;

    case 'resume-section':
      html += `
        <div class="resume-section-title editable" contenteditable="true"
          onblur="updateContent('section-title', this.innerText)"
          style="color: ${colors.primary}; font-size: 20px; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid #eee;">${page.content['section-title'] || 'Section Title'}</div>
        ${[1,2].map(i => `
          <div style="margin-bottom: 20px;">
            <div class="editable" contenteditable="true" style="font-size: 16px; font-weight: 600;" onblur="updateContent('item${i}-title', this.innerText)">${page.content['item'+i+'-title'] || 'Item ' + i}</div>
            <div class="editable" contenteditable="true" style="font-size: 14px; color: ${colors.secondary}; margin-bottom: 4px;" onblur="updateContent('item${i}-date', this.innerText)">${page.content['item'+i+'-date'] || 'Date'}</div>
            <div class="editable" contenteditable="true" style="font-size: 14px; color: #555;" onblur="updateContent('item${i}-desc', this.innerText)">${page.content['item'+i+'-desc'] || 'Description'}</div>
          </div>
        `).join('')}`;
      break;

    case 'hero-section':
      html += `
        <div class="hero-section" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px;">
          <div class="hero-headline editable" contenteditable="true"
            onblur="updateContent('headline', this.innerText)"
            style="font-size: 48px; font-weight: 700; color: ${colors.primary}; margin-bottom: 20px; max-width: 80%;">${page.content.headline || 'Hero Headline'}</div>
          <div class="hero-sub editable" contenteditable="true"
            onblur="updateContent('subheadline', this.innerText)"
            style="font-size: 20px; color: ${colors.secondary}; margin-bottom: 40px; max-width: 60%;">${page.content.subheadline || 'Subheadline'}</div>
          <div style="display: flex; gap: 16px;">
            <button class="hero-btn hero-btn-primary editable" contenteditable="true"
              onblur="updateContent('cta-primary', this.innerText)"
              style="padding: 14px 32px; background: ${colors.primary}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600;">${page.content['cta-primary'] || 'Get Started'}</button>
            <button class="hero-btn hero-btn-secondary editable" contenteditable="true"
              onblur="updateContent('cta-secondary', this.innerText)"
              style="padding: 14px 32px; background: transparent; color: ${colors.text}; border: 2px solid ${colors.secondary}; border-radius: 8px; font-size: 16px;">${page.content['cta-secondary'] || 'Learn More'}</button>
          </div>
        </div>`;
      break;

    case 'feature-grid':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 32px; text-align: center;">${page.content.heading || 'Our Features'}</div>
        <div class="slide-two-col" style="gap: 24px;">
          ${[1,2,3].map(i => `
            <div class="feature-box" style="text-align: center; padding: 24px; background: ${colors.secondary}10; border-radius: 12px;">
              <div style="font-size: 40px; margin-bottom: 12px;">${page.content['feat'+i+'-icon'] || '⭐'}</div>
              <div class="editable" contenteditable="true" style="font-size: 18px; font-weight: 600; margin-bottom: 8px;" onblur="updateContent('feat'+i+'-title', this.innerText)">${page.content['feat'+i+'-title'] || 'Feature '+i}</div>
              <div class="editable" contenteditable="true" style="font-size: 14px; color: ${colors.secondary};" onblur="updateContent('feat'+i+'-desc', this.innerText)">${page.content['feat'+i+'-desc'] || 'Description'}</div>
            </div>
          `).join('')}
        </div>`;
      break;

    case 'pricing-card':
      html += `
        <div class="center" style="height: 100%;">
          <div class="editable" contenteditable="true"
            onblur="updateContent('plan-name', this.innerText)"
            style="font-size: 24px; font-weight: 600; color: ${colors.primary}; margin-bottom: 8px;">${page.content['plan-name'] || 'Pro Plan'}</div>
          <div class="editable" contenteditable="true"
            onblur="updateContent('price', this.innerText)"
            style="font-size: 48px; font-weight: 700; margin-bottom: 24px;">${page.content.price || '$99/mo'}</div>
          <div style="margin-bottom: 32px;">
            ${[1,2,3].map(i => `<div class="editable" contenteditable="true" style="font-size: 16px; margin-bottom: 12px;" onblur="updateContent('feature${i}', this.innerText)">✓ ${page.content['feature'+i] || 'Feature '+i}</div>`).join('')}
          </div>
          <button class="editable" contenteditable="true"
            onblur="updateContent('cta-text', this.innerText)"
            style="padding: 14px 40px; background: ${colors.primary}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; width: 100%;">${page.content['cta-text'] || 'Get Started'}</button>
        </div>`;
      break;

    case 'testimonial':
      html += `
        <div class="center" style="height: 100%; padding: 48px;">
          <div style="font-size: 64px; color: ${colors.primary}; margin-bottom: 16px;">"</div>
          <div class="editable" contenteditable="true"
            onblur="updateContent('quote', this.innerText)"
            style="font-size: 24px; font-style: italic; max-width: 80%; margin-bottom: 32px; line-height: 1.4;">${page.content.quote || 'Testimonial'}</div>
          <div class="editable" contenteditable="true"
            onblur="updateContent('author', this.innerText)"
            style="font-size: 18px; font-weight: 600;">${page.content.author || 'Name'}</div>
          <div class="editable" contenteditable="true"
            onblur="updateContent('role', this.innerText)"
            style="font-size: 14px; color: ${colors.secondary};">${page.content.role || 'Role'}</div>
        </div>`;
      break;

    case 'contact-section':
      html += `
        <div class="slide-heading editable" contenteditable="true"
          onblur="updateContent('heading', this.innerText)"
          style="color: ${colors.primary}; margin-bottom: 32px; text-align: center;">${page.content.heading || 'Get in Touch'}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <div class="editable" contenteditable="true" style="font-size: 16px; margin-bottom: 16px;" onblur="updateContent('email', this.innerText)">✉️ ${page.content.email || 'email@example.com'}</div>
            <div class="editable" contenteditable="true" style="font-size: 16px; margin-bottom: 16px;" onblur="updateContent('phone', this.innerText)">📞 ${page.content.phone || '+1 234 567 890'}</div>
            <div class="editable" contenteditable="true" style="font-size: 16px;" onblur="updateContent('address', this.innerText)">📍 ${page.content.address || 'Address'}</div>
          </div>
          <div style="display: flex; align-items: center;">
            <button class="editable" contenteditable="true"
              onblur="updateContent('cta-text', this.innerText)"
              style="padding: 14px 32px; background: ${colors.primary}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600;">${page.content['cta-text'] || 'Send Message'}</button>
          </div>
        </div>`;
      break;

    default:
      html += `<div class="center"><h2>${layout?.name || 'Slide'}</h2></div>`;
  }

  html += '</div>';
  slide.innerHTML = html;
}

function renderFields() {
  if (project.pages.length === 0) return;

  const page = project.pages[project.currentIndex];
  const layout = layouts.find(l => l.id === page.layout);
  const container = document.getElementById('fieldsContainer');

  let html = '';
  layout.slots.forEach(slot => {
    if (slot.type === 'background') return;
    const value = page.content[slot.id] || '';
    const isTextarea = slot.type === 'textarea';
    html += `
      <div class="property-group">
        <label>${slot.id.replace(/-/g, ' ')}</label>
        ${isTextarea
          ? `<textarea onchange="updateContent('${slot.id}', this.value)" onblur="updateContent('${slot.id}', this.value)">${value}</textarea>`
          : `<input type="text" value="${value}" onchange="updateContent('${slot.id}', this.value)" onblur="updateContent('${slot.id}', this.value)">`
        }
        ${slot.maxChars ? `<div class="char-count" id="count-${slot.id}">${value.length}/${slot.maxChars}</div>` : ''}
      </div>`;
  });
  container.innerHTML = html;

  // Update color pickers
  document.getElementById('bgColor').value = page.colors.bg || '#ffffff';
  document.getElementById('textColor').value = page.colors.text || '#333333';
  document.getElementById('primaryColor').value = page.colors.primary || '#3b82f6';
  document.getElementById('secondaryColor').value = page.colors.secondary || '#64748b';

  // Update selects
  document.getElementById('layoutSelect').value = page.layout;
  document.getElementById('animationSelect').value = page.animation || 'none';
}

function updateCharCount(fieldId) {
  const count = document.getElementById(`count-${fieldId}`);
  if (!count) return;
  const page = project.pages[project.currentIndex];
  const layout = layouts.find(l => l.id === page.layout);
  const slot = layout.slots.find(s => s.id === fieldId);
  const value = page.content[fieldId] || '';
  count.textContent = `${value.length}/${slot.maxChars}`;
  count.classList.toggle('limit', value.length > slot.maxChars);
}

function renderPagesList() {
  const container = document.getElementById('pagesList');
  if (project.pages.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = project.pages.map((page, i) => {
    const layout = layouts.find(l => l.id === page.layout);
    const preview = Object.values(page.content).find(v => v && v.length > 0) || '';
    return `
      <div class="page-item ${i === project.currentIndex ? 'active' : ''}" 
           data-index="${i}" 
           draggable="true"
           onclick="goToPage(${i})">
        <span class="page-drag-handle" draggable="false">⋮⋮</span>
        <div class="page-num">${i + 1}</div>
        <div class="page-info">
          <div class="page-title">${layout?.name || 'Slide'}</div>
          <div class="page-type">${preview.substring(0, 25)}${preview.length > 25 ? '...' : ''}</div>
        </div>
      </div>`;
  }).join('');
}

function goToPage(index) {
  project.currentIndex = index;
  updateUI();
}

function updateUI() {
  renderPagesList();
  renderSlide();
  renderFields();
  document.getElementById('slideCounter').textContent =
    project.pages.length > 0 ? `${project.currentIndex + 1} / ${project.pages.length}` : '0 / 0';
  updateZoom();
  updateContentTypeButtons();
}

function updateContentTypeButtons() {
  document.querySelectorAll('#layoutModal .btn[id^="btn-"]').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('btn-' + currentContentType);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

function updateCanvasPreview() {
  const slide = document.getElementById('currentSlide');
  if (slide) {
    const typeConfig = CONTENT_TYPES[currentContentType];
    slide.style.aspectRatio = typeConfig.aspectRatio;
    if (typeConfig.width) {
      slide.style.maxWidth = typeConfig.width + 'px';
    }
    if (typeConfig.height && typeConfig.height !== 'auto') {
      slide.style.maxHeight = typeConfig.height + 'px';
    }
  }
}

// Modals
function showLayoutModal() {
  document.getElementById('layoutModal').classList.add('show');
  updateContentTypeButtons();
  renderLayoutOptions();
}

function hideLayoutModal() {
  document.getElementById('layoutModal').classList.remove('show');
}

function showThemeModal() {
  document.getElementById('themeModal').classList.add('show');
}

function hideThemeModal() {
  document.getElementById('themeModal').classList.remove('show');
}

function showExportModal() {
  document.getElementById('exportModal').classList.add('show');
}

function hideExportModal() {
  document.getElementById('exportModal').classList.remove('show');
}

function filterLayouts(category) {
  document.querySelectorAll('.layout-category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  renderLayoutOptions(category);
}

function renderLayoutOptions(filterCategory = 'all') {
  const grid = document.getElementById('layoutGrid');

  console.log('Rendering layouts for type:', currentContentType);
  console.log('Filter category:', filterCategory);
  console.log('Total layouts:', layouts.length);

  const filtered = filterCategory === 'all'
    ? layouts.filter(l => l.type === currentContentType)
    : layouts.filter(l => l.category === filterCategory && l.type === currentContentType);

  console.log('Filtered layouts:', filtered.length);

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">No layouts available for this content type. Please try another.</p>';
    return;
  }

  grid.innerHTML = filtered.map(l => `
    <div class="layout-option" onclick="addPage('${l.id}')">
      <div class="layout-icon"><i class="fas ${l.icon || 'fa-file'}"></i></div>
      <div class="layout-name">${l.name}</div>
      <div class="layout-category">${l.type}</div>
    </div>
  `).join('');
}

function renderThemeOptions() {
  const grid = document.getElementById('themeGrid');
  grid.innerHTML = themes.map(t => `
    <div class="theme-option ${currentTheme?.id === t.id ? 'selected' : ''}" onclick="applyTheme('${t.id}')">
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

  currentTheme = theme;
  project.pages.forEach(page => {
    page.colors = { ...theme.colors };
  });

  saveProject();
  renderSlide();
  renderThemeOptions();
  showToast('Theme applied');
}

// Export Functions
function doExport() {
  const format = document.getElementById('exportFormat').value;
  hideExportModal();

  switch (format) {
    case 'json': exportJSON(); break;
    case 'html': exportHTML(); break;
    case 'pptx': exportPPTX(); break;
    case 'png': exportPNG(); break;
  }
}

function exportJSON() {
  const data = JSON.stringify(project, null, 2);
  downloadFile(data, 'project.json', 'application/json');
  showToast('JSON exported');
}

function exportHTML() {
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Presentation</title>`;
  html += `<link rel="stylesheet" href="core/base.css">`;
  html += `<link rel="stylesheet" href="core/components.css">`;
  html += `<link rel="stylesheet" href="core/icons-diagrams.css">`;
  html += `<link rel="stylesheet" href="core/mermaid-diagrams.css">`;
  html += `<link rel="stylesheet" href="themes/default.css">`;
  html += `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`;
  html += `<script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"><\/script>`;
  html += `<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f0f0; padding: 20px; }
    .slide-container { background: white; margin: 0 auto 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; page-break-after: always; max-width: 1280px; }
    @media print { body { background: white; } .slide-container { box-shadow: none; margin: 0; } }
    [contenteditable] { outline: none; }
  </style></head><body onload="mermaid.initialize({startOnLoad:true});">`;

  project.pages.forEach((page, i) => {
    const layout = layouts.find(l => l.id === page.layout);
    const colors = page.colors;
    html += `<div class="slide-container" style="background:${colors.bg};color:${colors.text};">`;
    html += `<div class="slide-content">`;
    html += renderSlideHTML(page, layout, colors);
    html += `</div>`;
    html += `<div class="slide-number">${i + 1}</div>`;
    html += `</div>`;
  });

  html += '</body></html>';
  downloadFile(html, 'presentation.html', 'text/html');
  showToast('HTML exported');
}

function renderSlideHTML(page, layout, colors) {
  let html = '<div style="width:100%;height:100%;display:flex;flex-direction:column;">';
  
  switch (page.layout) {
    case 'title-slide':
      html += `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
        <h1 style="color:${colors.primary};font-size:48px;margin-bottom:16px">${page.content.title || ''}</h1>
        <p style="color:${colors.secondary};font-size:24px">${page.content.subtitle || ''}</p>
      </div>`;
      break;
    case 'agenda-slide':
      html += `<h2 style="color:${colors.primary};font-size:36px;margin-bottom:32px">${page.content.title || 'Agenda'}</h2>`;
      for (let i = 1; i <= 5; i++) {
        html += `<div style="font-size:20px;padding:8px 0;border-bottom:1px solid ${colors.secondary}40">${page.content['item'+i] || 'Item '+i}</div>`;
      }
      break;
    case 'content-slide':
      html += `<h2 style="color:${colors.primary};font-size:32px;margin-bottom:24px">${page.content.heading || ''}</h2>`;
      html += `<p style="font-size:18px;line-height:1.6;white-space:pre-wrap">${page.content.body || ''}</p>`;
      if (page.content.footer) html += `<p style="margin-top:auto;font-size:14px;color:${colors.secondary}">${page.content.footer}</p>`;
      break;
    case 'two-column':
      html += `<h2 style="color:${colors.primary};font-size:32px;margin-bottom:24px">${page.content.heading || ''}</h2>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;flex:1;">
        <div><h3 style="color:${colors.primary};font-size:20px;margin-bottom:12px">${page.content['left-title'] || ''}</h3><p style="font-size:16px">${page.content['left-body'] || ''}</p></div>
        <div><h3 style="color:${colors.primary};font-size:20px;margin-bottom:12px">${page.content['right-title'] || ''}</h3><p style="font-size:16px">${page.content['right-body'] || ''}</p></div>
      </div>`;
      break;
    case 'quote-slide':
      html += `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
        <p style="font-size:32px;font-style:italic;max-width:80%;margin-bottom:16px">"${page.content.quote || ''}"</p>
        <p style="font-size:18px;color:${colors.secondary}">— ${page.content.author || ''}</p>
      </div>`;
      break;
    case 'instagram-post':
      html += `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(135deg,${colors.primary},${colors.secondary});border-radius:8px;padding:32px;margin:-48px;width:calc(100% + 96px);height:calc(100% + 96px);">
        <h1 style="color:white;font-size:42px;margin-bottom:24px">${page.content.headline || ''}</h1>
        <p style="color:rgba(255,255,255,0.9);font-size:20px;margin-bottom:32px">${page.content.body || ''}</p>
        <span style="background:white;color:#333;padding:12px 32px;border-radius:24px;font-weight:600">${page.content.cta || ''}</span>
      </div>`;
      break;
    default:
      html += `<h2>${layout?.name || ''}</h2>`;
  }
  
  html += '</div>';
  return html;
}

async function exportPPTX() {
  if (project.pages.length === 0) {
    showToast('No slides to export');
    return;
  }

  showToast('Generating PowerPoint...');

  // Check if PptxGenJS is loaded, if not load it
  if (typeof PptxGenJS === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Presentation';
  pptx.author = 'Visual Editor';
  pptx.company = 'Visual Editor';
  pptx.subject = 'Generated Presentation';
  pptx.keywords = 'presentation';
  pptx.created = new Date();

  project.pages.forEach((page, i) => {
    const layout = layouts.find(l => l.id === page.layout);
    const colors = page.colors;
    const slide = pptx.addSlide();

    // Background
    slide.background = { color: colors.bg.replace('#', '') };

    // Add content based on layout
    switch (page.layout) {
      case 'title-slide':
        slide.addText(page.content.title || 'Title', { x: 1, y: 2, w: '80%', h: 1, fontSize: 44, bold: true, color: colors.primary.replace('#', ''), align: 'center' });
        slide.addText(page.content.subtitle || '', { x: 1, y: 3.5, w: '80%', h: 0.8, fontSize: 24, color: colors.secondary.replace('#', ''), align: 'center' });
        break;

      case 'agenda-slide':
        slide.addText(page.content.title || 'Agenda', { x: 1, y: 0.5, w: '80%', h: 0.8, fontSize: 32, bold: true, color: colors.primary.replace('#', ''), align: 'center' });
        for (let j = 1; j <= 5; j++) {
          slide.addText(`${j}. ${page.content['item'+j] || 'Item '+j}`, { x: 1.5, y: 1.8 + (j-1)*0.7, w: '70%', h: 0.5, fontSize: 20, color: colors.text.replace('#', '') });
        }
        break;

      case 'content-slide':
        slide.addText(page.content.heading || '', { x: 0.5, y: 0.5, w: '90%', h: 0.8, fontSize: 32, bold: true, color: colors.primary.replace('#', '') });
        slide.addText(page.content.body || '', { x: 0.5, y: 1.5, w: '90%', h: 3, fontSize: 18, color: colors.text.replace('#', ''), valign: 'top' });
        if (page.content.footer) {
          slide.addText(page.content.footer, { x: 0.5, y: 5, w: '90%', h: 0.4, fontSize: 12, color: colors.secondary.replace('#', '') });
        }
        break;

      case 'two-column':
        slide.addText(page.content.heading || '', { x: 0.5, y: 0.3, w: '90%', h: 0.6, fontSize: 28, bold: true, color: colors.primary.replace('#', '') });
        slide.addText(page.content['left-title'] || '', { x: 0.5, y: 1.2, w: '45%', h: 0.5, fontSize: 18, bold: true, color: colors.primary.replace('#', '') });
        slide.addText(page.content['left-body'] || '', { x: 0.5, y: 1.8, w: '45%', h: 2.5, fontSize: 14, color: colors.text.replace('#', ''), valign: 'top' });
        slide.addText(page.content['right-title'] || '', { x: 5, y: 1.2, w: '45%', h: 0.5, fontSize: 18, bold: true, color: colors.primary.replace('#', '') });
        slide.addText(page.content['right-body'] || '', { x: 5, y: 1.8, w: '45%', h: 2.5, fontSize: 14, color: colors.text.replace('#', ''), valign: 'top' });
        break;

      case 'quote-slide':
        slide.addText(`"${page.content.quote || ''}"`, { x: 1, y: 1.5, w: '80%', h: 2, fontSize: 28, italic: true, color: colors.text.replace('#', ''), align: 'center' });
        slide.addText(`— ${page.content.author || ''}`, { x: 1, y: 4, w: '80%', h: 0.5, fontSize: 18, color: colors.secondary.replace('#', ''), align: 'center' });
        break;

      case 'instagram-post':
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { type: 'solid', color: colors.primary.replace('#', '') } });
        slide.addText(page.content.headline || '', { x: 0.5, y: 1.5, w: '90%', h: 1.5, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center' });
        slide.addText(page.content.body || '', { x: 0.5, y: 3.2, w: '90%', h: 1, fontSize: 18, color: 'FFFFFF', align: 'center' });
        slide.addShape(pptx.ShapeType.roundRect, { x: 3.5, y: 4.5, w: 3, h: 0.8, fill: { color: 'FFFFFF' } });
        slide.addText(page.content.cta || 'Link', { x: 3.5, y: 4.6, w: 3, h: 0.6, fontSize: 14, color: '333333', align: 'center' });
        break;

      case 'cta-slide':
        slide.addText(page.content.heading || '', { x: 0.5, y: 1.5, w: '90%', h: 1, fontSize: 32, bold: true, color: colors.text.replace('#', ''), align: 'center' });
        slide.addText(page.content.body || '', { x: 1, y: 2.8, w: '80%', h: 0.6, fontSize: 18, color: colors.secondary.replace('#', ''), align: 'center' });
        slide.addShape(pptx.ShapeType.roundRect, { x: 3, y: 4, w: 3.5, h: 0.8, fill: { color: colors.primary.replace('#', '') } });
        slide.addText(page.content['cta-text'] || 'Get Started', { x: 3, y: 4.1, w: 3.5, h: 0.6, fontSize: 16, color: 'FFFFFF', align: 'center' });
        break;

      default:
        slide.addText(layout?.name || 'Slide', { x: 1, y: 2.5, w: '80%', h: 1, fontSize: 32, color: colors.text.replace('#', ''), align: 'center' });
    }
  });

  pptx.writeFile({ fileName: 'presentation.pptx' })
    .then(() => showToast('PowerPoint exported!'))
    .catch(err => {
      console.error(err);
      showToast('Export failed: ' + err.message);
    });
}

function exportPNG() {
  showToast('Use browser screenshot or export HTML → Print → Save as PDF');
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Storage
function saveProject() {
  localStorage.setItem('visualEditorProject', JSON.stringify(project));
}

function loadProject() {
  const data = localStorage.getItem('visualEditorProject');
  if (data) {
    try {
      const saved = JSON.parse(data);
      project = saved;
      project.zoom = project.zoom || 1;
      updateUI();
    } catch (e) {
      console.error('Failed to load project');
    }
  }
}

// Utilities
function generateId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' && !e.target.classList.contains('editable')) prevSlide();
  if (e.key === 'ArrowRight' && !e.target.classList.contains('editable')) nextSlide();
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveProject(); showToast('Saved'); }
  if (e.key === 'Delete' && !e.target.classList.contains('editable') && project.pages.length > 0) deleteSlide();
  if (e.key === 'Escape') {
    hideLayoutModal();
    hideThemeModal();
    hideExportModal();
  }
});

// Start
init();
