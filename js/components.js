const ComponentLibrary = {
  icons: {
    presentation: ['fa-star', 'fa-crown', 'fa-trophy', 'fa-medal', 'fa-award', 'fa-certificate'],
    business: ['fa-briefcase', 'fa-building', 'fa-city', 'fa-store', 'fa-warehouse', 'fa-office'],
    technology: ['fa-laptop', 'fa-desktop', 'fa-server', 'fa-database', 'fa-code', 'fa-terminal'],
    communication: ['fa-envelope', 'fa-paper-plane', 'fa-mail-bulk', 'fa-comment', 'fa-comments', 'fa-share'],
    social: ['fa-thumbs-up', 'fa-heart', 'fa-star', 'fa-bookmark', 'fa-flag', 'fa-tag'],
    navigation: ['fa-home', 'fa-bars', 'fa-ellipsis', 'fa-chevron-right', 'fa-chevron-down', 'fa-angle-right'],
    user: ['fa-user', 'fa-users', 'fa-user-tie', 'fa-user-check', 'fa-user-plus', 'fa-user-clock'],
    time: ['fa-clock', 'fa-calendar', 'fa-calendar-alt', 'fa-history', 'fa-hourglass-half', 'fa-stopwatch'],
    location: ['fa-map-marker-alt', 'fa-map-pin', 'fa-map', 'fa-globe', 'fa-globe-americas', 'fa-street-view'],
    nature: ['fa-tree', 'fa-leaf', 'fa-paw', 'fa-feather', 'fa-seedling', 'fa-spider'],
    arrows: ['fa-arrow-right', 'fa-arrow-left', 'fa-arrow-up', 'fa-arrow-down', 'fa-long-arrow-alt-right', 'fa-exchange-alt'],
    charts: ['fa-chart-bar', 'fa-chart-pie', 'fa-chart-line', 'fa-chart-area', 'fa-project-diagram', 'fa-sitemap'],
    media: ['fa-image', 'fa-photo-video', 'fa-film', 'fa-music', 'fa-headphones', 'fa-microphone'],
    files: ['fa-file', 'fa-file-alt', 'fa-file-pdf', 'fa-file-word', 'fa-file-excel', 'fa-file-powerpoint'],
    money: ['fa-dollar-sign', 'fa-money-bill', 'fa-credit-card', 'fa-wallet', 'fa-coins', 'fa-piggy-bank'],
    security: ['fa-shield-alt', 'fa-lock', 'fa-key', 'fa-user-shield', 'fa-passport', 'fa-id-card'],
    tools: ['fa-tools', 'fa-wrench', 'fa-screwdriver', 'fa-hammer', 'fa-paint-brush', 'fa-pencil-ruler'],
    light: ['fa-lightbulb', 'fa-lightbulb-on', 'fa-flashlight', 'fa-lamp', 'fa-fire', 'fa-sparkles'],
    ecommerce: ['fa-shopping-cart', 'fa-shopping-bag', 'fa-shopping-basket', 'fa-store', 'fa-tags', 'fa-tag'],
    cloud: ['fa-cloud', 'fa-cloud-download-alt', 'fa-cloud-upload-alt', 'fa-cloud-meatball', 'fa-cloud-moon', 'fa-cloud-sun'],
    mobile: ['fa-mobile-alt', 'fa-tablet-alt', 'fa-phone', 'fa-phone-alt', 'fa-fax', 'fa-tty']
  },

  diagrams: {
    flowchart: {
      nodeTypes: ['start', 'process', 'decision', 'input-output', 'terminator'],
      directions: ['right', 'down', 'left', 'up']
    },
    charts: ['pie', 'bar-horizontal', 'bar-vertical', 'line', 'area'],
    timelines: ['vertical', 'horizontal', 'milestone'],
    comparison: ['table', 'cards', 'columns'],
    process: ['steps', 'cycle', 'funnel', 'pyramid'],
    infographics: ['stats', 'features', 'team', 'pricing', 'testimonials']
  },

  templates: {
    createFlowchartNode: function(type, content) {
      const classes = {
        'start': 'component-flowchart-node component-flowchart-node-start',
        'process': 'component-flowchart-node component-flowchart-node-process',
        'decision': 'component-flowchart-node component-flowchart-node-decision',
        'input-output': 'component-flowchart-node component-flowchart-node-input-output',
        'terminator': 'component-flowchart-node component-flowchart-node-terminator'
      };
      return `<div class="${classes[type] || 'component-flowchart-node'}" contenteditable="true">${content || type}</div>`;
    },

    createArrow: function(direction) {
      return `<div class="component-flowchart-arrow component-flowchart-arrow-${direction}"></div>`;
    },

    createStatCard: function(icon, value, label) {
      return `
        <div class="component-infographic-item">
          <div class="component-infographic-icon"><i class="fas ${icon}"></i></div>
          <div class="component-infographic-value" contenteditable="true">${value}</div>
          <div class="component-infographic-label" contenteditable="true">${label}</div>
        </div>
      `;
    },

    createTimelineItem: function(year, title, description, color = 'primary') {
      return `
        <div class="component-timeline-infographic-item">
          <div class="component-timeline-infographic-marker">
            <div class="component-timeline-infographic-dot" style="background-color: var(--color-${color});"></div>
            <div class="component-timeline-infographic-line"></div>
          </div>
          <div class="component-timeline-infographic-content">
            <div class="component-timeline-infographic-year">${year}</div>
            <div class="component-timeline-infographic-title" contenteditable="true">${title}</div>
            <div class="component-timeline-infographic-desc" contenteditable="true">${description}</div>
          </div>
        </div>
      `;
    },

    createProcessStep: function(number, title, description) {
      return `
        <div class="component-infographic-step">
          <div class="component-infographic-step-number">${number}</div>
          <div class="component-infographic-step-content">
            <div class="component-infographic-step-title" contenteditable="true">${title}</div>
            <div class="component-infographic-step-desc" contenteditable="true">${description}</div>
          </div>
        </div>
      `;
    },

    createTeamMember: function(initials, name, role) {
      return `
        <div class="component-infographic-item">
          <div class="component-avatar component-avatar-lg" style="margin: 0 auto 1rem; background-color: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">${initials}</div>
          <div class="component-infographic-value" style="font-size: 1.25rem;" contenteditable="true">${name}</div>
          <div class="component-infographic-label" contenteditable="true">${role}</div>
        </div>
      `;
    },

    createComparisonRow: function(feature, ourValue, competitorValue, highlight = false) {
      return `
        <tr>
          <td contenteditable="true">${feature}</td>
          <td class="${highlight ? 'component-comparison-highlight' : ''}"><strong contenteditable="true">${ourValue}</strong></td>
          <td contenteditable="true">${competitorValue}</td>
        </tr>
      `;
    },

    createBarChartItem: function(label, percentage, color = 'primary') {
      return `
        <div class="component-bar-chart-item">
          <div class="component-bar-chart-label">${label}</div>
          <div class="component-bar-chart-bar-container">
            <div class="component-bar-chart-bar component-bar-chart-bar-${color}" style="width: ${percentage};">${percentage}</div>
          </div>
        </div>
      `;
    },

    createAlert: function(type, title, content) {
      const icons = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'warning': 'fa-exclamation-triangle',
        'danger': 'fa-times-circle'
      };
      return `
        <div class="component-alert component-alert-${type}">
          <div class="component-alert-icon"><i class="fas ${icons[type] || 'fa-info-circle'}"></i></div>
          <div class="component-alert-content">
            <div class="component-alert-title" contenteditable="true">${title}</div>
            <div class="component-alert-text" contenteditable="true">${content}</div>
          </div>
        </div>
      `;
    },

    createCard: function(icon, title, content, footer = '') {
      return `
        <div class="component-card">
          <div class="component-card-header">
            <div class="component-icon-circle"><i class="fas ${icon}"></i></div>
            <h3 class="component-card-title" contenteditable="true">${title}</h3>
          </div>
          <div class="component-card-body" contenteditable="true">${content}</div>
          ${footer ? `<div class="component-card-footer" contenteditable="true">${footer}</div>` : ''}
        </div>
      `;
    }
  }
};

window.ComponentLibrary = ComponentLibrary;
