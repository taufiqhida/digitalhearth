import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'

export default function ProtectedRoute({ role }) {
    const { user, loading, isAuthenticated } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (role && user.role !== role) {
        // Redirect to correct dashboard based on role
        const redirectPath = `/${user.role.toLowerCase()}`
        return <Navigate to={redirectPath} replace />
    }

    return (
        <Layout>
            <Outlet />
        </Layout>
    )
}
