class MCPServer {
  constructor(registry, project) {
    this.registry = registry;
    this.project = project;
    this.tools = this.defineTools();
  }

  defineTools() {
    return {
      get_available_components: {
        name: 'get_available_components',
        description: 'Get all available layouts and components that can be used for content generation',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category (presentation, social-media, resume, website)',
              optional: true
            }
          }
        },
        handler: async (args) => {
          const layouts = args?.category
            ? this.registry.getLayoutsByCategory(args.category)
            : Object.values(this.registry.getLayouts());

          const themes = Object.values(this.registry.getThemes()).map(t => ({
            id: t.id,
            name: t.name,
            colors: t.colors
          }));

          return {
            success: true,
            layouts: layouts.map(l => ({
              id: l.id,
              name: l.name,
              category: l.category,
              slots: l.slots,
              constraints: l.constraints,
              editableProperties: l.editableProperties,
              animations: l.animations
            })),
            themes,
            totalLayouts: layouts.length
          };
        }
      },

      get_component_details: {
        name: 'get_component_details',
        description: 'Get detailed information about a specific layout or component including its constraints',
        parameters: {
          type: 'object',
          properties: {
            layoutId: { type: 'string', description: 'The ID of the layout to get details for' }
          },
          required: ['layoutId']
        },
        handler: async (args) => {
          const layout = this.registry.getLayout(args.layoutId);
          if (!layout) {
            return { success: false, error: `Layout "${args.layoutId}" not found` };
          }

          return {
            success: true,
            layout: {
              id: layout.id,
              name: layout.name,
              category: layout.category,
              slots: layout.slots,
              constraints: layout.constraints,
              defaultCSS: layout.css.default,
              editableProperties: layout.editableProperties,
              animations: layout.animations
            }
          };
        }
      },

      generate_content: {
        name: 'generate_content',
        description: 'Generate content for a specific layout based on user requirements or topic',
        parameters: {
          type: 'object',
          properties: {
            layoutId: { type: 'string', description: 'Which layout to generate content for' },
            topic: { type: 'string', description: 'The topic or subject matter' },
            tone: { type: 'string', description: 'Tone of the content (professional, casual, etc.)', optional: true },
            language: { type: 'string', description: 'Language for the content (default: en)', optional: true },
            constraints: { type: 'object', description: 'Any specific constraints to follow', optional: true }
          },
          required: ['layoutId', 'topic']
        },
        handler: async (args) => {
          const layout = this.registry.getLayout(args.layoutId);
          if (!layout) {
            return { success: false, error: `Layout "${args.layoutId}" not found` };
          }

          const generatedContent = {};
          const constraints = args.constraints || {};

          layout.slots.forEach(slot => {
            const slotConstraint = layout.constraints?.[slot];
            const maxChars = slotConstraint?.maxChars || 100;
            const isRequired = slotConstraint?.required !== false;

            generatedContent[slot] = {
              text: this.generateSlotContent(slot, args.topic, args.tone, args.language, maxChars),
              constraints: {
                maxChars,
                required: isRequired,
                currentLength: 0
              },
              metadata: {
                generated: true,
                timestamp: new Date().toISOString()
              }
            };
          });

          return {
            success: true,
            content: generatedContent,
            layoutId: args.layoutId,
            topic: args.topic,
            language: args.language || 'en'
          };
        }
      },

      create_page: {
        name: 'create_page',
        description: 'Create a new page in the project using a layout and content',
        parameters: {
          type: 'object',
          properties: {
            layoutId: { type: 'string', description: 'Layout ID to use for the page' },
            content: { type: 'object', description: 'Content object with slot names as keys' },
            theme: { type: 'string', description: 'Theme ID to apply (optional)' }
          },
          required: ['layoutId', 'content']
        },
        handler: async (args) => {
          const layout = this.registry.getLayout(args.layoutId);
          if (!layout) {
            return { success: false, error: `Layout "${args.layoutId}" not found` };
          }

          const page = this.project.addPage(args.layoutId);

          Object.entries(args.content).forEach(([slot, value]) => {
            const text = typeof value === 'string' ? value : value.text;
            if (text) {
              this.project.updatePageContent(page.id, { [slot]: text });
            }
          });

          if (args.theme) {
            this.project.setTheme(args.theme);
          }

          this.project.saveToStorage();

          return {
            success: true,
            pageId: page.id,
            layoutId: args.layoutId,
            totalPages: this.project.pages.length,
            message: `Page created successfully using layout "${layout.name}"`
          };
        }
      },

      update_page_content: {
        name: 'update_page_content',
        description: 'Update content for a specific page and slot',
        parameters: {
          type: 'object',
          properties: {
            pageId: { type: 'string', description: 'Page ID to update' },
            slot: { type: 'string', description: 'Slot name to update' },
            content: { type: 'string', description: 'New content value' }
          },
          required: ['pageId', 'slot', 'content']
        },
        handler: async (args) => {
          const page = this.project.getPage(args.pageId);
          if (!page) {
            return { success: false, error: `Page "${args.pageId}" not found` };
          }

          this.project.updatePageContent(args.pageId, { [args.slot]: args.content });
          this.project.saveToStorage();

          return {
            success: true,
            pageId: args.pageId,
            slot: args.slot,
            newLength: args.content.length
          };
        }
      },

      get_project_status: {
        name: 'get_project_status',
        description: 'Get the current status of the project including pages, theme, and metadata',
        parameters: {
          type: 'object',
          properties: {}
        },
        handler: async (args) => {
          return {
            success: true,
            project: {
              id: this.project.id,
              name: this.project.name,
              theme: this.project.theme,
              totalPages: this.project.pages.length,
              pages: this.project.pages.map(p => ({
                id: p.id,
                layoutId: p.layoutId,
                order: p.order,
                contentCount: Object.keys(p.content || {}).length
              })),
              createdAt: this.project.createdAt,
              updatedAt: this.project.updatedAt
            }
          };
        }
      },

      apply_theme: {
        name: 'apply_theme',
        description: 'Apply a different theme to the project',
        parameters: {
          type: 'object',
          properties: {
            themeId: { type: 'string', description: 'Theme ID to apply' }
          },
          required: ['themeId']
        },
        handler: async (args) => {
          const theme = this.registry.getTheme(args.themeId);
          if (!theme) {
            return { success: false, error: `Theme "${args.themeId}" not found` };
          }

          this.project.setTheme(args.themeId);
          this.project.saveToStorage();

          return {
            success: true,
            themeId: args.themeId,
            themeName: theme.name
          };
        }
      },

      generate_presentation: {
        name: 'generate_presentation',
        description: 'Generate a complete presentation with multiple slides based on a topic',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Presentation topic' },
            slideCount: { type: 'number', description: 'Number of slides (default: 3)', optional: true },
            layoutType: { type: 'string', description: 'Type of layouts to use', optional: true },
            tone: { type: 'string', description: 'Content tone', optional: true }
          },
          required: ['topic']
        },
        handler: async (args) => {
          const layouts = Object.values(this.registry.getLayouts())
            .filter(l => l.category === 'presentation');
          const slideCount = args.slideCount || 3;

          const slideContents = [];

          for (let i = 0; i < slideCount; i++) {
            const layout = layouts[i % layouts.length];
            const content = {};

            layout.slots.forEach(slot => {
              content[slot] = this.generateSlotContent(
                slot,
                args.topic,
                args.tone,
                'en',
                layout.constraints?.[slot]?.maxChars || 100
              );
            });

            slideContents.push({
              layoutId: layout.id,
              layoutName: layout.name,
              content,
              order: i
            });

            this.project.addPage(layout.id);
            this.project.updatePageContent(this.project.pages[this.project.pages.length - 1].id, content);
          }

          this.project.saveToStorage();

          return {
            success: true,
            topic: args.topic,
            slidesCreated: slideContents.length,
            slides: slideContents,
            totalPages: this.project.pages.length
          };
        }
      },

      validate_content: {
        name: 'validate_content',
        description: 'Validate content against layout constraints',
        parameters: {
          type: 'object',
          properties: {
            layoutId: { type: 'string', description: 'Layout ID' },
            content: { type: 'object', description: 'Content object to validate' }
          },
          required: ['layoutId', 'content']
        },
        handler: async (args) => {
          const layout = this.registry.getLayout(args.layoutId);
          if (!layout) {
            return { success: false, error: `Layout "${args.layoutId}" not found` };
          }

          const validation = {
            valid: true,
            errors: [],
            warnings: [],
            slotStatus: {}
          };

          Object.entries(args.content).forEach(([slot, value]) => {
            const result = this.registry.validateContent(args.layoutId, slot, value);
            const constraint = layout.constraints?.[slot];

            validation.slotStatus[slot] = {
              valid: result.valid,
              currentLength: String(value).length,
              maxChars: constraint?.maxChars || null,
              required: constraint?.required !== false
            };

            if (!result.valid) {
              validation.valid = false;
              validation.errors.push(...result.errors);
            }
          });

          return {
            success: true,
            validation
          };
        }
      },

      export_project: {
        name: 'export_project',
        description: 'Export the project in various formats',
        parameters: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['html', 'json'], description: 'Export format' }
          },
          required: ['format']
        },
        handler: async (args) => {
          if (args.format === 'json') {
            return {
              success: true,
              format: 'json',
              data: JSON.parse(this.project.exportProject())
            };
          }

          return {
            success: true,
            format: 'html',
            message: 'HTML export available through editor export function'
          };
        }
      }
    };
  }

  generateSlotContent(slot, topic, tone, language, maxChars) {
    const slotGenerators = {
      title: (t) => `Introduction to ${t}`,
      subtitle: (t) => `Exploring the fundamentals and key concepts`,
      heading: (t) => `Understanding ${t}`,
      body: (t) => `${t} is an important concept that encompasses various aspects. In this section, we will explore the fundamental principles, practical applications, and best practices for implementing ${t} effectively. Understanding these core elements will help you build a strong foundation.`,
      headline: (t) => `${t}: Everything You Need to Know`,
      subheadline: (t) => `A comprehensive guide to understanding and implementing ${t} in your projects`,
      cta: () => `Learn More`,
      ctaPrimary: () => `Get Started`,
      ctaSecondary: () => `Learn More`,
      contact: () => `info@example.com`,
      footer: (t) => `© 2024 ${t} Project`,
      visual: () => '',
      image: () => '',
      photo: () => '',
      background: () => ''
    };

    const generator = slotGenerators[slot] || ((t) => `Content for ${slot}`);
    let content = generator(topic, tone, language);

    if (content.length > maxChars) {
      content = content.substring(0, maxChars - 3) + '...';
    }

    return content;
  }

  async callTool(toolName, args = {}) {
    const tool = this.tools[toolName];
    if (!tool) {
      return { success: false, error: `Unknown tool: ${toolName}` };
    }

    try {
      const result = await tool.handler(args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getToolDescriptions() {
    return Object.values(this.tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}

window.MCPServer = MCPServer;
