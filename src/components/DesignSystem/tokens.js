/**
 * Design tokens for consistent styling across the application
 * AI-First Creative Studio - Teal + Orange palette
 *
 * NOTE: These are static light-mode tokens.
 * Dark mode colors are handled by CSS variables in design-system.css
 */

export const colors = {
  // Primary colors - Deep Teal
  primary: '#0D9488',      // Deep teal (500) - Main brand color
  primaryHover: '#0F766E', // Darker teal (600)
  primaryActive: '#115E59', // Even darker teal (700)

  // Primary color scale
  primary50: '#F0FDFA',
  primary100: '#CCFBF1',
  primary200: '#99F6E4',
  primary300: '#5EEAD4',
  primary400: '#2DD4BF',
  primary500: '#0D9488',   // Main
  primary600: '#0F766E',
  primary700: '#115E59',
  primary800: '#134E4A',
  primary900: '#134E4A',

  // Accent colors - Energetic Orange
  accent: '#F97316',       // Energetic orange (500)
  accentHover: '#EA580C',  // Darker orange (600)
  accentActive: '#C2410C', // Even darker orange (700)

  // Accent color scale
  accent50: '#FFF7ED',
  accent100: '#FFEDD5',
  accent200: '#FED7AA',
  accent300: '#FDBA74',
  accent400: '#FB923C',
  accent500: '#F97316',    // Main
  accent600: '#EA580C',
  accent700: '#C2410C',
  accent800: '#9A3412',
  accent900: '#7C2D12',

  // Status colors - Complementary palette
  success: '#10B981',      // Emerald green
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Warm red

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)',
    accent: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
    hero: 'linear-gradient(135deg, #0D9488 0%, #F97316 100%)'
  },

  // Text colors - Navy-based hierarchy
  text: {
    primary: '#0A2540',    // Navy (dark)
    secondary: '#425466',  // Medium gray
    tertiary: '#6B7C8E',   // Light gray
    disabled: '#97A6BA',   // Disabled state
    inverse: '#ffffff'
  },

  // Background colors - Minimal
  background: {
    body: '#ffffff',       // White
    container: '#FAFBFC',  // Subtle gray
    elevated: '#ffffff',
    overlay: 'rgba(10, 37, 64, 0.45)'
  },

  // Border colors - Subtle
  border: {
    light: '#F6F9FC',   // Very subtle
    base: '#E3E8EF',    // Subtle border
    dark: '#CDD7E6'     // Visible border
  },

  // Gray scale - Consistent with before
  gray: {
    50: '#FAFBFC',
    100: '#F6F9FC',
    200: '#E3E8EF',
    300: '#CDD7E6',
    400: '#97A6BA',
    500: '#6B7C8E',
    600: '#425466',
    700: '#283D54',
    800: '#0A2540',
    900: '#0A1929'
  }
};

export const spacing = {
  xs: '4px',    // 1 unit (half of base)
  sm: '8px',    // 2 units (base)
  md: '12px',   // 3 units
  lg: '16px',   // 4 units
  xl: '24px',   // 6 units
  xxl: '32px',  // 8 units
  xxxl: '48px'  // 12 units
};

export const typography = {
  fontFamily: {
    display: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',  // Display font for headings
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif', // Body font
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif', // Alias for backwards compatibility
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace'
  },

  fontSize: {
    xs: '12px',    // Captions
    sm: '14px',    // Secondary body
    base: '16px',  // Primary body
    lg: '18px',    // Subheadings
    xl: '20px',    // Section headers
    '2xl': '24px', // Page titles
    '3xl': '32px', // Hero headings
    '4xl': '40px', // Large display
    '5xl': '48px', // Extra large display
    '6xl': '60px', // Hero sections
    '7xl': '72px', // Large hero
    '8xl': '96px'  // Extra large hero
  },

  fontWeight: {
    light: '300',
    350: '350',       // Light-Medium
    normal: '400',
    450: '450',       // Medium-Regular
    medium: '500',    // Emphasis
    550: '550',       // Medium-Semibold
    semibold: '600',  // Headings
    650: '650',       // Semibold-Bold
    bold: '700',      // Strong emphasis
    extrabold: '800'
  },

  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },

  letterSpacing: {
    tighter: '-0.02em',  // Large headings
    tight: '-0.015em',   // Display text
    normal: '-0.01em',   // Section headers
    wide: '0',           // Body text
    wider: '0.05em'      // Uppercase text
  }
};

export const shadows = {
  // Subtle elevation
  xs: '0 1px 2px rgba(10, 37, 64, 0.03)',
  sm: '0 1px 2px rgba(10, 37, 64, 0.05), 0 1px 3px rgba(10, 37, 64, 0.03)',
  base: '0 1px 2px rgba(10, 37, 64, 0.05), 0 1px 3px rgba(10, 37, 64, 0.03)',

  // Standard elevation
  md: '0 2px 4px rgba(10, 37, 64, 0.06), 0 4px 8px rgba(10, 37, 64, 0.04)',

  // High elevation
  lg: '0 4px 8px rgba(10, 37, 64, 0.08), 0 8px 16px rgba(10, 37, 64, 0.06)',

  // Extra high elevation
  xl: '0 8px 16px rgba(10, 37, 64, 0.1), 0 16px 32px rgba(10, 37, 64, 0.08)',
  '2xl': '0 12px 24px rgba(10, 37, 64, 0.12), 0 24px 48px rgba(10, 37, 64, 0.1)',

  // Colored shadows for brand elements (teal/orange)
  primary: '0 4px 12px rgba(13, 148, 136, 0.15), 0 2px 4px rgba(13, 148, 136, 0.1)',
  accent: '0 4px 12px rgba(249, 115, 22, 0.15), 0 2px 4px rgba(249, 115, 22, 0.1)',

  // Focus ring (teal)
  focus: '0 0 0 3px rgba(13, 148, 136, 0.1)',

  // Context-specific
  elevated: '0 4px 12px rgba(10, 37, 64, 0.12)',  // Sidebar, prominent cards
  card: '0 2px 8px rgba(10, 37, 64, 0.10)',       // Audience cards
  dropdown: '0 12px 24px rgba(10, 37, 64, 0.12), 0 4px 8px rgba(10, 37, 64, 0.08), 0 0 0 1px rgba(10, 37, 64, 0.05)',

  inner: 'inset 0 1px 2px rgba(10, 37, 64, 0.05)'
};

export const borderRadius = {
  none: '0',
  sm: '3px',    // Tight corners
  base: '4px',  // Default
  md: '6px',    // Larger components
  lg: '8px',    // Rare, large panels
  xl: '12px',   // Very rare
  full: '9999px' // Pills, avatars only
};

export const animation = {
  transition: {
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)'
  },

  duration: {
    instant: '100ms',   // Immediate feedback
    fast: '200ms',      // Quick interactions
    normal: '300ms',    // Standard transitions
    slow: '500ms'       // Emphasis
  },

  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',          // Smooth deceleration
    easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce
    easeOutQuint: 'cubic-bezier(0.22, 1, 0.36, 1)'          // Gentle ease out
  },

  stagger: {
    delay: '40ms',      // Delay between staggered items
    children: '100ms'   // Delay between child animations
  }
};
