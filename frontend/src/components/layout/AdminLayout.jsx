import {useState} from 'react'
import {NavLink, Outlet, useNavigate} from 'react-router-dom'
import {useAuth} from '../../hooks/useAuth'

const links = [
  {to: '/admin/dashboard', label: 'Dashboard'},
  {to: '/admin/assignments', label: 'Assignments'},
  {to: '/admin/assignments/create', label: 'Create assignment'},
  {to: '/admin/admins/create', label: 'Add admin'},
]

function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
                <span className="text-xl font-bold">
                    Joineazy
                </span>
                <button className="rounded border border-slate-300 px-3 py-2 text-sm md:hidden" onClick={() => setMenuOpen(!menuOpen)} type="button">
                    Menu
                </button>
                <div className="hidden items-center gap-4 md:flex">
                    <span className="text-sm text-slate-600">
                        {user?.name}
                    </span>
                    <button className="rounded border border-slate-300 px-3 py-1.5 text-sm" onClick={handleLogout} type="button">
                        Log out
                    </button>
                </div>
            </div>
            <nav className={`${menuOpen ? 'block' : 'hidden'} border-t border-slate-200 px-4 py-3 md:block md:border-0 md:px-6 md:py-0`}>
                <div className="mx-auto flex max-w-7xl flex-col gap-1 md:flex-row md:gap-6">
                    {
                    links.map((link) => (
                        <NavLink key={link.to} className={({ isActive }) => `rounded px-2 py-2 text-sm font-medium ${isActive ?
                            'bg-blue-50 text-blue-700' :
                            'text-slate-600 hover:text-slate-900'}`}
                             onClick={() => setMenuOpen(false)} to={link.to}>{link.label}
                        </NavLink>))
                    }<div className="flex items-center justify-between border-t border-slate-200 py-2 md:hidden">
                        <span className="text-sm text-slate-600">
                            {user?.name}
                        </span>
                        <button className="text-sm text-slate-700" onClick={handleLogout} type="button">
                            Log out
                        </button>
                    </div>
                </div>
            </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Outlet />
        </main>
    </div>)
}

export default AdminLayout