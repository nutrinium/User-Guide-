import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <div className="pl-[72px] transition-all duration-300 ease-in-out peer-hover/sidebar:pl-64 lg:pl-20 lg:peer-hover/sidebar:pl-64">
        <TopNav />
        <main className="p-4 sm:p-6 dark:text-white">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
