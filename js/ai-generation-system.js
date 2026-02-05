/**
 * AIGenerationSystem.js
 * Handles AI content generation and output management
 * Allows natural language interaction for creating presentations
 */

class AIGenerationSystem {
  constructor() {
    this.outputFolder = 'output/generated/';
    this.templatesFolder = 'output/templates/';
    this.generatedContent = [];
  }

  /**
   * Generate content from natural language input
   * @param {string} userInput - Natural language description
   * @param {string} contentType - Type: presentation, website, resume, social, analytics
   * @returns {Promise<Object>} Generated content structure
   */
  async generateFromText(userInput, contentType = 'presentation') {
    console.log(`Generating ${contentType} from: "${userInput}"`);
    
    // Parse the input to understand requirements
    const requirements = this.parseRequirements(userInput, contentType);
    
    // Select appropriate layouts based on content
    const selectedLayouts = this.selectLayouts(requirements, contentType);
    
    // Generate content for each layout
    const generatedItems = await this.generateContent(selectedLayouts, requirements);
    
    // Create project structure
    const project = {
      type: contentType,
      name: requirements.title || `Generated ${contentType}`,
      createdAt: new Date().toISOString(),
      items: generatedItems,
      theme: this.selectTheme(requirements),
      metadata: {
        generatedBy: 'AI',
        prompt: userInput,
        layoutCount: generatedItems.length
      }
    };
    
    // Save to output folder
    const filename = this.saveProject(project);
    
    return {
      success: true,
      project: project,
      filename: filename,
      summary: this.generateSummary(project)
    };
  }

  /**
   * Parse user input to extract requirements
   */
  parseRequirements(input, contentType) {
    const requirements = {
      title: '',
      topic: '',
      sections: [],
      tone: 'professional',
      estimatedSlides: 5,
      keywords: []
    };

    // Extract title/topic
    const titleMatch = input.match(/(?:about|for|on)\s+(.+?)(?:\s+with|\s+including|$)/i);
    if (titleMatch) {
      requirements.topic = titleMatch[1].trim();
      requirements.title = this.capitalizeFirst(requirements.topic);
    }

    // Detect tone
    if (input.match(/\b(fun|casual|friendly|relaxed)\b/i)) {
      requirements.tone = 'casual';
    } else if (input.match(/\b(professional|business|corporate|formal)\b/i)) {
      requirements.tone = 'professional';
    } else if (input.match(/\b(technical|detailed|advanced)\b/i)) {
      requirements.tone = 'technical';
    }

    // Estimate number of slides/sections
    const numberMatch = input.match(/(\d+)\s+(?:slides?|pages?|sections?)/i);
    if (numberMatch) {
      requirements.estimatedSlides = parseInt(numberMatch[1]);
    }

    // Extract section topics
    const sectionKeywords = ['intro', 'introduction', 'overview', 'problem', 'solution', 
                            'features', 'benefits', 'market', 'competition', 'team', 
                            'financial', 'revenue', 'growth', 'conclusion', 'summary',
                            'thank you', 'cta', 'call to action'];
    
    sectionKeywords.forEach(keyword => {
      if (input.toLowerCase().includes(keyword)) {
        requirements.sections.push(keyword);
      }
    });

    return requirements;
  }

  /**
   * Select appropriate layouts based on requirements
   */
  selectLayouts(requirements, contentType) {
    const layouts = [];
    const layoutLibrary = this.getLayoutLibrary(contentType);
    
    // Always start with a title/header
    const titleLayouts = layoutLibrary.headings || layoutLibrary.headers || [];
    if (titleLayouts.length > 0) {
      layouts.push({
        ...titleLayouts[Math.floor(Math.random() * titleLayouts.length)],
        sectionType: 'title'
      });
    }

    // Add content sections based on requirements
    const remainingSlides = requirements.estimatedSlides - 1;
    const sectionsPerSlide = Math.ceil(requirements.sections.length / remainingSlides) || 1;
    
    requirements.sections.forEach((section, index) => {
      const layout = this.matchLayoutToSection(section, layoutLibrary);
      if (layout) {
        layouts.push({
          ...layout,
          sectionType: section,
          content: this.generateSectionContent(section, requirements)
        });
      }
    });

    // Fill remaining slots with appropriate layouts
    while (layouts.length < requirements.estimatedSlides) {
      const randomCategory = this.getRandomCategory(layoutLibrary);
      const categoryLayouts = layoutLibrary[randomCategory] || [];
      if (categoryLayouts.length > 0) {
        const randomLayout = categoryLayouts[Math.floor(Math.random() * categoryLayouts.length)];
        layouts.push({
          ...randomLayout,
          sectionType: 'content',
          content: this.generateGenericContent(requirements.topic)
        });
      }
    }

    // Always end with closing slide
    const closingLayouts = layoutLibrary.closing || [];
    if (closingLayouts.length > 0) {
      layouts.push({
        ...closingLayouts[Math.floor(Math.random() * closingLayouts.length)],
        sectionType: 'closing'
      });
    }

    return layouts.slice(0, requirements.estimatedSlides + 2);
  }

  /**
   * Match a section type to the best layout
   */
  matchLayoutToSection(section, layoutLibrary) {
    const sectionMap = {
      'intro': ['headings', 'bullets', 'visuals'],
      'introduction': ['headings', 'bullets'],
      'overview': ['headings', 'bullets', 'charts'],
      'problem': ['headings', 'bullets', 'comparison'],
      'solution': ['headings', 'visuals', 'features'],
      'features': ['features', 'bullets', 'visuals'],
      'benefits': ['bullets', 'comparison', 'stats'],
      'market': ['charts', 'stats', 'comparison'],
      'competition': ['comparison', 'charts'],
      'team': ['team', 'visuals'],
      'financial': ['stats', 'charts', 'metrics'],
      'revenue': ['stats', 'charts'],
      'growth': ['stats', 'timeline', 'charts'],
      'conclusion': ['bullets', 'headings'],
      'summary': ['bullets', 'headings'],
      'thank you': ['closing'],
      'cta': ['closing', 'conversion']
    };

    const categories = sectionMap[section.toLowerCase()] || ['bullets'];
    
    for (const category of categories) {
      const layouts = layoutLibrary[category] || [];
      if (layouts.length > 0) {
        return layouts[Math.floor(Math.random() * layouts.length)];
      }
    }

    return null;
  }

  /**
   * Generate content for each layout
   */
  async generateContent(layouts, requirements) {
    const items = [];
    
    for (const layout of layouts) {
      const content = {};
      
      // Generate content for each slot
      Object.keys(layout.slots || {}).forEach(slotId => {
        content[slotId] = this.generateSlotContent(slotId, layout.sectionType, requirements);
      });

      items.push({
        id: this.generateId(),
        layout: layout.id,
        content: content,
        colors: this.getThemeColors(requirements.theme || 'clean-white'),
        animation: 'none'
      });
    }

    return items;
  }

  /**
   * Generate content for a specific slot
   */
  generateSlotContent(slotId, sectionType, requirements) {
    const generators = {
      // Titles and Headings
      title: () => this.capitalizeFirst(requirements.topic),
      heading: () => this.generateHeading(sectionType, requirements.topic),
      subtitle: () => this.generateSubtitle(requirements.topic),
      
      // Content
      body: () => this.generateBody(sectionType, requirements.topic),
      content: () => this.generateBody(sectionType, requirements.topic),
      description: () => this.generateDescription(requirements.topic),
      
      // Lists
      item1: () => `First ${sectionType} point`,
      item2: () => `Second ${sectionType} point`,
      item3: () => `Third ${sectionType} point`,
      point1: () => `Key point about ${requirements.topic}`,
      point2: () => `Another important point`,
      point3: () => `Additional insight`,
      
      // Stats
      stat1: () => '100%',
      stat2: () => '50+',
      stat3: () => '10K',
      label1: () => 'Complete',
      label2: () => 'Projects',
      label3: () => 'Users',
      
      // Contact/CTA
      email: () => 'contact@example.com',
      phone: () => '+1 (555) 123-4567',
      website: () => 'www.example.com',
      cta: () => 'Get Started',
      'ctaPrimary': () => 'Learn More',
      
      // Quotes
      quote: () => `"Success in ${requirements.topic} requires dedication and innovation."`,
      author: () => 'Industry Expert',
      
      // Default
      default: () => `${slotId}: ${requirements.topic}`
    };

    const generator = generators[slotId] || generators.default;
    return generator();
  }

  /**
   * Generate section-specific content
   */
  generateSectionContent(section, requirements) {
    const contentMap = {
      'intro': `Introduction to ${requirements.topic}`,
      'overview': `Overview of ${requirements.topic}`,
      'problem': `The challenges in ${requirements.topic}`,
      'solution': `Our solution for ${requirements.topic}`,
      'features': `Key features of ${requirements.topic}`,
      'benefits': `Benefits of ${requirements.topic}`,
      'market': `Market opportunity for ${requirements.topic}`,
      'team': `Meet the team behind ${requirements.topic}`,
      'financial': `Financial projections for ${requirements.topic}`,
      'conclusion': `Conclusion about ${requirements.topic}`,
      'summary': `Summary of ${requirements.topic}`
    };

    return contentMap[section.toLowerCase()] || `${section}: ${requirements.topic}`;
  }

  /**
   * Generate generic content
   */
  generateGenericContent(topic) {
    const templates = [
      `Exploring ${topic}`,
      `Understanding ${topic}`,
      `${topic} in detail`,
      `Key aspects of ${topic}`,
      `${topic} insights`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate a heading for a section
   */
  generateHeading(sectionType, topic) {
    const headings = {
      'title': this.capitalizeFirst(topic),
      'intro': `Welcome to ${topic}`,
      'introduction': `Introduction: ${topic}`,
      'overview': `${topic} Overview`,
      'problem': `The Problem`,
      'solution': `Our Solution`,
      'features': `Key Features`,
      'benefits': `Benefits`,
      'market': `Market Analysis`,
      'team': `Our Team`,
      'financial': `Financials`,
      'conclusion': `In Conclusion`,
      'summary': `Summary`,
      'closing': 'Thank You!'
    };

    return headings[sectionType] || this.capitalizeFirst(topic);
  }

  /**
   * Generate a subtitle
   */
  generateSubtitle(topic) {
    const subtitles = [
      `A comprehensive look at ${topic}`,
      `Everything you need to know about ${topic}`,
      `Discover the power of ${topic}`,
      `Transform your approach to ${topic}`,
      `The future of ${topic}`
    ];
    return subtitles[Math.floor(Math.random() * subtitles.length)];
  }

  /**
   * Generate body content
   */
  generateBody(sectionType, topic) {
    const bodies = {
      'intro': `${topic} represents a significant opportunity in today's market. This presentation will explore key aspects and opportunities.`,
      'overview': `This overview covers the essential elements of ${topic}, including current trends, challenges, and opportunities.`,
      'problem': `Many organizations struggle with ${topic}. Common challenges include efficiency, scalability, and integration.`,
      'solution': `Our approach to ${topic} addresses these challenges through innovative solutions and proven methodologies.`,
      'features': `Key features include:\n• Advanced ${topic} capabilities\n• Seamless integration\n• Scalable architecture\n• User-friendly interface`,
      'benefits': `Benefits of implementing ${topic}:\n• Increased efficiency\n• Cost savings\n• Better outcomes\n• Competitive advantage`,
      'team': `Our experienced team brings expertise in ${topic} and a track record of successful implementations.`,
      'conclusion': `In conclusion, ${topic} offers significant potential for growth and improvement. We look forward to discussing this further.`
    };

    return bodies[sectionType] || `Learn more about ${topic} and how it can benefit your organization.`;
  }

  /**
   * Generate description
   */
  generateDescription(topic) {
    return `Detailed information about ${topic} and its applications.`;
  }

  /**
   * Select a theme based on requirements
   */
  selectTheme(requirements) {
    const themeMap = {
      'professional': 'clean-white',
      'technical': 'slate-corporate',
      'casual': 'nature-green',
      'creative': 'berry-purple'
    };

    return themeMap[requirements.tone] || 'clean-white';
  }

  /**
   * Get theme colors
   */
  getThemeColors(themeId) {
    const themes = {
      'clean-white': { bg: '#ffffff', text: '#333333', primary: '#3b82f6', secondary: '#64748b' },
      'dark-mode': { bg: '#1a1a2e', text: '#ffffff', primary: '#6366f1', secondary: '#94a3b8' },
      'nature-green': { bg: '#ecfdf5', text: '#064e3b', primary: '#10b981', secondary: '#059669' },
      'slate-corporate': { bg: '#f8fafc', text: '#0f172a', primary: '#475569', secondary: '#64748b' },
      'berry-purple': { bg: '#faf5ff', text: '#581c87', primary: '#a855f7', secondary: '#9333ea' }
    };

    return themes[themeId] || themes['clean-white'];
  }

  /**
   * Get layout library for content type
   */
  getLayoutLibrary(contentType) {
    // This would load from config.json
    // For now, return a simplified version
    const libraries = {
      'presentation': {
        headings: [
          { id: 'title-slide', slots: { title: {}, subtitle: {} } },
          { id: 'title-centered', slots: { title: {}, subtitle: {} } },
          { id: 'title-split', slots: { title: {}, sideText: {} } }
        ],
        bullets: [
          { id: 'content-slide', slots: { heading: {}, body: {} } },
          { id: 'bullets-icon', slots: { heading: {}, point1: {}, point2: {}, point3: {} } }
        ],
        closing: [
          { id: 'thank-you-slide', slots: { mainText: {}, subtitle: {} } },
          { id: 'cta-final', slots: { heading: {}, cta: {}, contact: {} } }
        ]
      }
    };

    return libraries[contentType] || libraries['presentation'];
  }

  /**
   * Get random category from layout library
   */
  getRandomCategory(library) {
    const categories = Object.keys(library);
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Save project to output folder
   */
  saveProject(project) {
    const timestamp = Date.now();
    const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${sanitizedName}-${timestamp}.json`;
    
    // In a real implementation, this would save to file system
    // For browser, we'll store in memory and provide download
    this.generatedContent.push({
      filename,
      project,
      timestamp
    });

    console.log(`Project saved: ${filename}`);
    return filename;
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(project) {
    return `
✅ Generated ${project.type}: "${project.name}"
📊 ${project.items.length} slides/sections created
🎨 Theme: ${project.theme}
📁 Saved as: ${project.metadata.filename || 'generated-project.json'}

Content includes:
${project.items.map((item, i) => `  ${i + 1}. ${item.layout}`).join('\n')}

💡 To view: Open this file in the Visual Editor
    `;
  }

  /**
   * Export generated content for download
   */
  exportToFile(project) {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Utility: Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Utility: Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Create global instance
window.aiGenerationSystem = new AIGenerationSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIGenerationSystem;
}
