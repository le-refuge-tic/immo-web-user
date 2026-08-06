import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import PushPrompt from './PushPrompt'

/** Pages "assistant plein écran" qui gèrent leur propre en-tête/navigation
 *  — la nav client (Accueil/Favoris/Messages/Profil) n'a pas sa place ici,
 *  qu'on y arrive en tant que client, propriétaire ou démarcheur. */
const HIDE_CHROME_PATHS = ['/nouveau-bien']

/** Pages atteintes depuis un dashboard rôle (propriétaire/démarcheur/locataire,
 *  qui n'utilisent pas ce layout) via un lien interne (ex. la cloche Alertes) :
 *  le topbar client (Accueil/Favoris/Messages/Profil) n'a pas de sens dans ce
 *  contexte — la page garde son propre en-tête + bouton retour. Messagerie :
 *  aussi plein écran sur desktop (le topbar mange de la hauteur utile pour un
 *  panneau liste+fil de discussion) — mais garde la bottom nav mobile, la
 *  messagerie reste une destination courante de la navigation. */
const HIDE_TOPNAV_PREFIXES = ['/conversations', '/notifications']

export default function MainLayout() {
  const location = useLocation()
  const hideChrome = HIDE_CHROME_PATHS.includes(location.pathname)
  const hideTopNav = hideChrome || HIDE_TOPNAV_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: '#F5F5F7' }}>

      {/* Orbes pastel Liquid Glass — sur fond clair, couleurs vives traversent le verre */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb absolute top-[-20%] right-[-10%] w-[900px] h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(100,130,255,0.22) 0%, rgba(100,130,255,0.06) 50%, transparent 70%)' }} />
        <div className="orb-2 absolute top-[5%] left-[-20%] w-[750px] h-[750px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(160,100,255,0.18) 0%, rgba(160,100,255,0.05) 50%, transparent 70%)' }} />
        <div className="orb-3 absolute bottom-[-15%] left-[20%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,120,80,0.14) 0%, rgba(255,120,80,0.04) 50%, transparent 70%)' }} />
        <div className="orb absolute bottom-[15%] right-[-8%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(50,210,140,0.12) 0%, rgba(50,210,140,0.04) 50%, transparent 70%)', animationDelay: '8s' }} />
        <div className="orb-2 absolute top-[40%] left-[35%] w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,190,60,0.10) 0%, transparent 70%)', animationDelay: '12s' }} />
      </div>

      {/* Header desktop */}
      {!hideTopNav && <TopNav />}

      {/* Contenu — pas de z-index ici : un z-index sur ce conteneur créerait
          un contexte d'empilement qui plafonnerait TOUT son contenu (y
          compris les éléments `fixed` des pages enfants) sous ce niveau,
          quel que soit leur propre z-index. En restant à z-auto, le
          contenu se compare directement à la bottom nav (z-50) et reste
          toujours en dessous ; les rares barres `fixed` de page qui
          doivent apparaître au-dessus (ex. bouton de validation en bas
          d'écran) portent leur propre z-index supérieur (z-[60]). */}
      <div className={`flex-1 overflow-y-auto relative ${hideChrome ? '' : hideTopNav ? 'pb-20 md:pb-0' : 'pb-20 md:pb-0 md:pt-16'}`}>
        <Outlet />
      </div>

      {/* Bottom nav mobile */}
      {!hideChrome && (
        <div className="md:hidden relative z-50">
          <BottomNav />
        </div>
      )}

      <PushPrompt />
    </div>
  )
}
