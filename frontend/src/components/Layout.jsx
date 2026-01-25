import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    FiHome, FiUsers, FiActivity, FiFileText, FiMessageSquare,
    FiSettings, FiLogOut, FiMenu, FiX, FiUser, FiClipboard
} from 'react-icons/fi'

const menuItems = {
    ADMIN: [
        { path: '/admin', icon: FiHome, label: 'Dashboard' },
        { path: '/admin/lab-params', icon: FiSettings, label: 'Parameter LAB' },
        { path: '/admin/patients', icon: FiUsers, label: 'Pasien' },
        { path: '/admin/doctors', icon: FiUser, label: 'Dokter' },
        { path: '/admin/examinations', icon: FiActivity, label: 'Pemeriksaan' },
    ],
    DOCTOR: [
        { path: '/doctor', icon: FiHome, label: 'Dashboard' },
        { path: '/doctor/patients', icon: FiUsers, label: 'Pasien' },
        { path: '/doctor/medical-notes', icon: FiFileText, label: 'Catatan Medis' },
        { path: '/doctor/chat', icon: FiMessageSquare, label: 'Konsultasi' },
    ],
    PATIENT: [
        { path: '/patient', icon: FiHome, label: 'Dashboard' },
        { path: '/patient/lab-results', icon: FiActivity, label: 'Hasil LAB' },
        { path: '/patient/medical-notes', icon: FiClipboard, label: 'Catatan Medis' },
        { path: '/patient/chat', icon: FiMessageSquare, label: 'Konsultasi' },
    ],
}

const roleLabels = {
    ADMIN: 'Administrator',
    DOCTOR: 'Dokter',
    PATIENT: 'Pasien',
}

export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const items = menuItems[user?.role] || []

    return (
        <div className="min-h-screen flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-gradient-to-b from-emerald-900 to-emerald-950
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                            <FiActivity className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg">HealthCare</h1>
                            <p className="text-emerald-300 text-xs">Sistem Kesehatan Digital</p>
                        </div>
                    </div>
                </div>

                {/* User info */}
                <div className="p-4 mx-4 mt-4 rounded-xl bg-white/5">
                    <p className="text-white font-medium">{user?.name}</p>
                    <p className="text-emerald-300 text-sm">{roleLabels[user?.role]}</p>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {items.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === `/${user?.role?.toLowerCase()}`}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="text-xl" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-300 hover:bg-red-500/20 hover:text-red-200"
                    >
                        <FiLogOut className="text-xl" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-lg border-b border-white/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg bg-white/10 text-white"
                        >
                            <FiMenu className="text-xl" />
                        </button>
                        <div className="hidden lg:block">
                            <h2 className="text-white text-lg font-medium">
                                Selamat Datang, {user?.name}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-emerald-300 text-sm">
                                {new Date().toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
