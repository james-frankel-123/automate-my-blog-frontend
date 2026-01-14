/**
 * Highlight Box Preset Templates
 * 8 professionally designed presets for different content highlighting use cases
 */

export const highlightPresets = [
  {
    id: 'statistic',
    name: 'Statistic',
    description: 'Large numbers with supporting text - perfect for data points',
    icon: 'FaChartBar',
    category: 'data',
    config: {
      type: 'statistic',
      width: '100%',
      fontSize: 'xxlarge',  // 72px
      layout: 'block',
      align: 'center',
      customBg: '#e6f7ff',
      customBorder: '#1890ff',
      iconName: 'FaChartBar'
    },
    example: '73% increase in engagement',
    useCases: ['Statistics', 'Data points', 'Key metrics', 'Survey results']
  },
  {
    id: 'pullquote',
    name: 'Pull Quote',
    description: 'Floated quote with text wrapping - like professional magazines',
    icon: 'FaQuoteLeft',
    category: 'content',
    config: {
      type: 'pullquote',
      width: '50%',
      fontSize: 'large',  // 24px
      layout: 'float-right',
      align: 'left',
      customBg: '#f6ffed',
      customBorder: '#52c41a',
      iconName: 'FaQuoteLeft'
    },
    example: 'Content marketing generates 3x more leads than traditional advertising',
    useCases: ['Expert quotes', 'Testimonials', 'Key insights', 'Memorable statements']
  },
  {
    id: 'takeaway',
    name: 'Key Takeaway',
    description: 'Full-width highlighted insight - emphasize main points',
    icon: 'FaLightbulb',
    category: 'content',
    config: {
      type: 'takeaway',
      width: '100%',
      fontSize: 'medium',  // 16px
      layout: 'block',
      align: 'left',
      customBg: '#fff7e6',
      customBorder: '#fa8c16',
      iconName: 'FaLightbulb'
    },
    example: 'The bottom line: Email marketing remains the highest ROI digital channel',
    useCases: ['Key takeaways', 'Bottom line', 'Main points', 'Conclusions']
  },
  {
    id: 'warning',
    name: 'Warning / Alert',
    description: 'Critical information box - grab attention for important details',
    icon: 'FaExclamationTriangle',
    category: 'info',
    config: {
      type: 'warning',
      width: '100%',
      fontSize: 'medium',  // 16px
      layout: 'block',
      align: 'left',
      customBg: '#fff1f0',
      customBorder: '#ff4d4f',
      iconName: 'FaExclamationTriangle'
    },
    example: 'Critical: Never buy email lists! This can result in spam penalties and legal issues.',
    useCases: ['Warnings', 'Alerts', 'Critical info', 'Compliance notes']
  },
  {
    id: 'tip',
    name: 'Tip / Advice',
    description: 'Helpful tip floating beside content - subtle guidance',
    icon: 'FaInfoCircle',
    category: 'info',
    config: {
      type: 'tip',
      width: '50%',
      fontSize: 'small',  // 14px
      layout: 'float-left',
      align: 'left',
      customBg: '#e6f7ff',
      customBorder: '#1890ff',
      iconName: 'FaInfoCircle'
    },
    example: 'Pro tip: Test subject lines with A/B testing to improve open rates by 20-30%',
    useCases: ['Tips', 'Pro tips', 'Helpful advice', 'Best practices']
  },
  {
    id: 'definition',
    name: 'Definition',
    description: 'Term definition box - explain jargon inline',
    icon: 'FaBook',
    category: 'content',
    config: {
      type: 'definition',
      width: '100%',
      fontSize: 'small',  // 14px
      layout: 'block',
      align: 'left',
      customBg: '#f0f5ff',
      customBorder: '#2f54eb',
      iconName: 'FaBook'
    },
    example: '<strong>SEO (Search Engine Optimization):</strong> The practice of increasing website visibility in search engine results through organic (non-paid) methods.',
    useCases: ['Definitions', 'Glossary terms', 'Acronym explanations', 'Technical terms']
  },
  {
    id: 'process',
    name: 'Process Step',
    description: 'Sequential step indicator - guide readers through processes',
    icon: 'FaClipboardList',
    category: 'instructional',
    config: {
      type: 'process',
      width: '100%',
      fontSize: 'medium',  // 16px
      layout: 'block',
      align: 'left',
      customBg: '#f9f0ff',
      customBorder: '#722ed1',
      iconName: 'FaClipboardList'
    },
    example: '<strong>Step 3:</strong> Set up automated email sequences with 48-hour response triggers',
    useCases: ['Process steps', 'Instructions', 'How-to guides', 'Tutorials']
  },
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Side-by-side comparison - highlight differences and choices',
    icon: 'FaBalanceScale',
    category: 'data',
    config: {
      type: 'comparison',
      width: '100%',
      fontSize: 'medium',  // 16px
      layout: 'block',
      align: 'left',
      customBg: '#e6fffb',
      customBorder: '#13c2c2',
      iconName: 'FaBalanceScale'
    },
    example: '<strong>Free Plan vs Pro:</strong> Free includes 1,000 contacts, Pro includes unlimited contacts with advanced segmentation',
    useCases: ['Comparisons', 'Versus', 'Plan differences', 'Feature comparisons']
  }
];

/**
 * Get preset by ID
 */
export const getPresetById = (id) => {
  return highlightPresets.find(preset => preset.id === id);
};

/**
 * Get presets by category
 */
export const getPresetsByCategory = (category) => {
  return highlightPresets.filter(preset => preset.category === category);
};

/**
 * Get all categories
 */
export const getCategories = () => {
  return [...new Set(highlightPresets.map(preset => preset.category))];
};

export default highlightPresets;
