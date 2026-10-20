/* ── Tokens thème centralisés ── */
export function useTokens(isDark: boolean) {
  return {
    textPrimary:  isDark ? '#E8E8EF'                : '#1D1D1F',
    textSecond:   isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    textMuted:    isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.58)',
    fieldBg:      isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.80)',
    fieldBdr:     isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    divider:      isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    cardBg:       isDark ? 'rgba(25,25,36,0.90)'    : 'rgba(255,255,255,0.80)',
    cardBdr:      isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.88)',
    sectionBg:    isDark ? 'rgba(18,18,28,0.85)'    : 'rgba(248,249,255,1)',
    sectionBdr:   isDark ? 'rgba(75,107,255,0.12)'  : 'rgba(75,107,255,0.08)',
    pillIdle: {
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.90)'}`,
      color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
      boxShadow: isDark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.05)',
      backdropFilter: 'blur(20px)',
    } as React.CSSProperties,
    pillActive: {
      background: 'rgba(75,107,255,0.14)',
      border: '1px solid rgba(75,107,255,0.35)',
      color: isDark ? '#9DB0FF' : '#3550D8',
      boxShadow: isDark ? '0 0 0 1px rgba(75,107,255,0.20)' : 'inset 0 1.5px 0 rgba(255,255,255,0.9), 0 2px 12px rgba(75,107,255,0.15)',
      backdropFilter: 'blur(20px)',
    } as React.CSSProperties,
  }
}

export type Tokens = ReturnType<typeof useTokens>

/* ── Pills recherche panel (panneau flottant et filtres mobiles) ── */
export function panelColors(isDark: boolean, tk: Tokens) {
  return {
    panelBg:    isDark ? 'rgba(14,14,24,0.97)'   : 'rgba(255,255,255,0.97)',
    panelBdr:   isDark ? 'rgba(75,107,255,0.30)' : 'rgba(75,107,255,0.25)',
    panelSep:   isDark ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.07)',
    closeBg:    isDark ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.06)',
    closeClr:   isDark ? 'rgba(255,255,255,0.55)': 'rgba(0,0,0,0.45)',
    suggestBg:  isDark ? 'rgba(18,18,30,0.99)'   : '#ffffff',
    suggestBdr: isDark ? 'rgba(255,255,255,0.10)': 'rgba(0,0,0,0.10)',
    suggestRow: isDark ? 'rgba(255,255,255,0.06)': 'rgba(0,0,0,0.05)',
    suggestHov: isDark ? 'rgba(75,107,255,0.14)' : 'rgba(75,107,255,0.08)',
    panelPillActive: { background: '#4160F2', color: '#fff', border: '1px solid #4160F2' } as React.CSSProperties,
    panelPillIdle:   { background: tk.fieldBg, color: tk.textMuted, border: `1px solid ${tk.fieldBdr}` } as React.CSSProperties,
  }
}
