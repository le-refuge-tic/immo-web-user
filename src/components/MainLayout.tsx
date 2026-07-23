import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import PushPrompt from './PushPrompt'

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-dvh" style={{ background: '#F5F5F7' }}>

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
      <TopNav />

      {/* Contenu — z-index au-dessus de la bottom nav (z-50) pour que les éléments
          `fixed` d'une page (barre de validation, modale) puissent s'afficher par-dessus
          elle ; le flux normal du contenu reste cantonné à sa propre zone (flex-1) et
          ne chevauche jamais la bottom nav, donc rien ne change visuellement au repos. */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0 md:pt-16 relative z-[55]">
        <Outlet />
      </div>

      {/* Bottom nav mobile */}
      <div className="md:hidden relative z-50">
        <BottomNav />
      </div>

      <PushPrompt />
    </div>
  )
}
