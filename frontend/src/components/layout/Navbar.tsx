import { Bell, Search, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export function Navbar() {
  const { user } = useAuth()
  const [dark, setDark] = useState(true)

  const toggleTheme = () => {
    setDark(!dark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="h-16 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-dark-800 border border-dark-700 text-dark-200 placeholder-dark-500
                       rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500
                       focus:ring-1 focus:ring-primary-500/30 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center
                     text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-all"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center
                     text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-dark-950" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500
                        flex items-center justify-center text-white text-xs font-bold cursor-pointer
                        hover:opacity-90 transition-opacity shadow-glow">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  )
}
