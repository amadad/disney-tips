/**
 * Design tokens for Disney Tips email
 * Matches the disney.bound.tips dark-blue palette
 */

const sansFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const serifFont = 'Georgia, "Times New Roman", Times, serif'

export const emailColors = {
  background: {
    primary: '#ffffff',
    card: '#ffffff',
  },
  text: {
    primary: '#000000',
    secondary: '#374151',
    muted: '#6b7280',
  },
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
  },
  accent: {
    gold: '#fcd34d', // Soft gold from site
    goldBorder: '#f59e0b', // Amber-500 for borders
  },
  priority: {
    high: '#f59e0b', // Gold left border
    medium: '#d1d5db', // Gray left border
    low: '#e5e7eb', // Light gray left border
  },
  button: {
    bg: '#021024', // Site's --bg-color (dark navy)
    text: '#ffffff',
  },
}

export const emailSpacing = {
  section: '32px',
  block: '24px',
  card: '16px',
  inline: '12px',
  tight: '8px',
  none: '0',
}

export const text = {
  body: {
    fontSize: '18px',
    fontWeight: '400' as const,
    lineHeight: '1.6',
    fontFamily: serifFont,
    color: emailColors.text.secondary,
    margin: '0',
  },
  bodySmall: {
    fontSize: '16px',
    fontWeight: '400' as const,
    lineHeight: '1.5',
    fontFamily: serifFont,
    color: emailColors.text.secondary,
    margin: '0',
  },
  muted: {
    fontSize: '15px',
    fontWeight: '400' as const,
    lineHeight: '1.5',
    fontFamily: serifFont,
    color: emailColors.text.muted,
    margin: '0',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600' as const,
    lineHeight: '1.4',
    fontFamily: sansFont,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: emailColors.text.muted,
    margin: '0 0 12px 0',
  },
  hero: {
    fontSize: '36px',
    fontWeight: '400' as const,
    lineHeight: '1.15',
    letterSpacing: '-0.02em',
    fontFamily: serifFont,
    color: emailColors.text.primary,
    margin: '0 0 16px 0',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '400' as const,
    lineHeight: '1.3',
    fontFamily: serifFont,
    color: emailColors.text.primary,
    margin: '0 0 8px 0',
  },
}

export const container = {
  section: {
    padding: `0 0 ${emailSpacing.block} 0`,
  },
  card: {
    padding: emailSpacing.card,
    backgroundColor: emailColors.background.card,
    borderRadius: '8px',
    marginBottom: emailSpacing.inline,
  },
}

export const divider = {
  borderColor: emailColors.border.light,
  margin: `${emailSpacing.block} 0`,
}

export const emailButton = {
  primary: {
    backgroundColor: emailColors.button.bg,
    color: emailColors.button.text,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600' as const,
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: sansFont,
  },
}

export const emailCompat = {
  fontStack: {
    serif: serifFont,
    sansSerif: sansFont,
  },
}
