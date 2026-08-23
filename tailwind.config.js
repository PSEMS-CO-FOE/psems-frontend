/** @type {import('tailwindcss').Config} */

// Tokens that must change between light and dark are CSS variables holding raw
// RGB channels, so Tailwind can still apply an alpha (`bg-line/60`). Shades that
// look right on either ground — solid button fills, accent borders, chart series
// — stay literal, which keeps the variable list short enough to reason about.
const themed = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Faculty of Engineering, USJ accent, sampled from eng.sjp.ac.lk (#3DB166).
        // Reserved for the active nav item, primary actions and positive status —
        // it is a signal colour on that site, not a fill, and stays one here.
        brand: {
          50: themed('brand-soft'),
          100: '#DCF3E4',
          200: themed('brand-ring'),
          300: '#8DD5A8',
          400: '#5FC188',
          500: '#3DB166',
          600: '#2E9152',
          700: themed('brand-strong'),
          800: '#235C38',
          900: '#1E4C30',
          950: '#0C2A19',
        },
        canvas: {
          DEFAULT: themed('canvas'),
          sunken: themed('canvas-sunken'),
        },
        surface: {
          DEFAULT: themed('surface'),
          raised: themed('surface-raised'),
        },
        line: {
          DEFAULT: themed('line'),
          strong: themed('line-strong'),
        },
        ink: {
          DEFAULT: themed('ink'),
          muted: themed('ink-muted'),
          subtle: themed('ink-subtle'),
        },
        // Status colours are desaturated so the brand green stays the loudest
        // thing on screen; each pairs a soft ground with readable text.
        positive: { 50: themed('positive-soft'), 500: '#2E9152', 700: themed('positive-strong') },
        caution: { 50: themed('caution-soft'), 500: '#C8871A', 700: themed('caution-strong') },
        critical: { 50: themed('critical-soft'), 500: '#D0453D', 700: themed('critical-strong') },
        info: { 50: themed('info-soft'), 500: '#3B72C4', 700: themed('info-strong') },
        // A fixed series order, so a measure keeps its colour on every screen
        // once analytics lands.
        chart: { 1: '#3DB166', 2: '#2A548F', 3: '#C8871A', 4: '#7C5BAF', 5: '#4A5D55' },
      },
      // Tailwind's preflight paints every element's border with
      // `borderColor.DEFAULT`, which ships as a light grey. A `border` or a
      // `divide-y` written without a colour therefore drew a pale rule that
      // stayed pale on the dark theme. Pointing the default at the token makes
      // an omitted colour correct rather than a leak.
      borderColor: {
        DEFAULT: themed('line'),
      },
      divideColor: {
        DEFAULT: themed('line'),
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Display sizes carry their own leading and tracking; at 2rem and up the
      // default line height leaves headings looking loose.
      fontSize: {
        display: ['2.125rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        title: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.018em' }],
      },
      letterSpacing: {
        eyebrow: '0.16em',
      },
      borderRadius: {
        card: '1.125rem',
        control: '0.625rem',
        pill: '9999px',
      },
      // Slate-tinted rather than pure black, so elevation reads as depth
      // instead of grime on a near-white canvas.
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 1px -0.5px rgba(16, 24, 40, 0.03)',
        raised: '0 2px 8px -2px rgba(16, 24, 40, 0.08), 0 1px 3px -1px rgba(16, 24, 40, 0.04)',
        pop: '0 12px 28px -8px rgba(16, 24, 40, 0.14), 0 4px 10px -4px rgba(16, 24, 40, 0.06)',
        // Green-tinted, for the elements actually made of brand colour — the
        // primary button, the crest block. A neutral shadow under a saturated
        // fill reads as dirt.
        brand: '0 6px 16px -6px rgba(24, 92, 55, 0.45), 0 2px 5px -2px rgba(24, 92, 55, 0.28)',
        'brand-lg': '0 18px 40px -14px rgba(24, 92, 55, 0.5)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        // Slight overshoot, for controls that appear rather than merely change.
        emphasis: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      maxWidth: {
        content: '72rem',
        // Used when the rail is collapsed, so the reclaimed width becomes
        // content rather than gutter. Still capped: an unbounded line length is
        // the reason the cap exists at all.
        wide: '86rem',
      },
      // Entrance motion for the sign-in split. Every use is behind `motion-safe:`,
      // so a reduced-motion preference gets the layout with nothing moving.
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(28px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // Shorter than `fade-up`: for content that arrives on every navigation,
        // where a long entrance turns into a wait.
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Keeps the decorative rings from reading as a static print.
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -1.5%, 0) scale(1.05)' },
        },
        // Skeletons: a sweep reads as loading where a pulse reads as an error.
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 600ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in': 'fade-in 900ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-in': 'slide-in 650ms cubic-bezier(0.4, 0, 0.2, 1) both',
        rise: 'rise 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        drift: 'drift 20s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
