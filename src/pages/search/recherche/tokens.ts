/* ── Tokens thème centralisés ── */
export function useTokens(isDark: boolean) {
  return {
    sidebarBg:      isDark ? 'rgba(14,14,24,0.97)'    : 'rgba(255,255,255,0.90)',
    sidebarBdr:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    fieldBg:        isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)',
    fieldBdr:       isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    divider:        isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    textClr:        isDark ? '#E8E8EF'                : '#1D1D1F',
    labelClr:       isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.58)',
    pageBg:         isDark ? 'rgba(15,15,20,1)'       : 'rgba(245,245,247,1)',
    headerBg:       isDark ? 'rgba(14,14,24,0.97)'    : 'rgba(245,245,247,0.96)',
    headerBdr:      isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    suggestBg:      isDark ? 'rgba(20,20,32,0.98)'    : '#ffffff',
    suggestBdr:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    suggestHover:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    pillIdle: {
      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.70)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.09)'}`,
      color: isDark ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.52)',
      boxShadow: isDark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
    } as React.CSSProperties,
    pillActive: {
      background: 'rgba(75,107,255,0.14)',
      border: '1px solid rgba(75,107,255,0.40)',
      color: 'var(--tx-blue)',
      boxShadow: isDark ? '0 0 0 1px rgba(75,107,255,0.20)' : 'inset 0 1.5px 0 rgba(255,255,255,0.9)',
    } as React.CSSProperties,
    chipStyle: {
      background: 'rgba(75,107,255,0.12)',
      border: '1px solid rgba(75,107,255,0.30)',
      color: 'var(--tx-blue)',
    } as React.CSSProperties,
  }
}

export type Tokens = ReturnType<typeof useTokens>
