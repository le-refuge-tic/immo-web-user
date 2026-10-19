// Applique le thème avant le premier rendu React pour éviter un flash clair → sombre.
// Doit rester aligné sur src/context/ThemeContext.tsx (clé rg_theme, défaut « system »).
(function () {
  var pref = 'system'
  try { pref = localStorage.getItem('rg_theme') || 'system' } catch (e) { /* ignore */ }
  var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (dark) document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
})()
