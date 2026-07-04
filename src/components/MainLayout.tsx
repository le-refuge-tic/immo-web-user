import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import BottomNav from './BottomNav'

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-dvh" style={{ background: '#07071A' }}>

      {/* Orbes de fond Liquid Glass */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(75,107,255,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="orb-2 absolute top-[10%] left-[-15%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(120,80,255,0.14) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="orb-3 absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="orb absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '8s' }} />
      </div>

      {/* Header desktop */}
      <TopNav />

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0 md:pt-16 relative z-10">
        <Outlet />
      </div>

      {/* Bottom nav mobile */}
      <div className="md:hidden relative z-50">
        <BottomNav />
      </div>
    </div>
  )
}
