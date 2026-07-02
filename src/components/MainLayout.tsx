import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import BottomNav from './BottomNav'

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-dvh bg-app-bg">
      {/* Header desktop */}
      <TopNav />

      {/* Content — espace bas pour bottom nav sur mobile uniquement */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </div>

      {/* Bottom nav mobile uniquement */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
