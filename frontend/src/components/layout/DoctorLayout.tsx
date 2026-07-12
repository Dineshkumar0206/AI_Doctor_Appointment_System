import { Outlet } from 'react-router-dom'
import { DoctorSidebar } from './DoctorSidebar'
import { DoctorNavbar } from './DoctorNavbar'

export function DoctorLayout() {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DoctorNavbar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
