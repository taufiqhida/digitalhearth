import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiActivity, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const user = await login(email, password)
            // Redirect based on role
            navigate(`/${user.role.toLowerCase()}`)
        } catch (err) {
            setError(err.response?.data?.error || 'Login gagal')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
                        <FiActivity className="text-white text-4xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">HealthCare</h1>
                    <p className="text-emerald-300 mt-2">Sistem Informasi Kesehatan Digital</p>
                </div>

                {/* Login form */}
                <div className="glass-card p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Masuk</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                            <FiAlertCircle className="text-xl flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder="Masukkan email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder="Masukkan password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 text-center mb-3">Akun Demo:</p>
                        <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="font-medium">Admin:</span>
                                <span>admin@health.com / admin123</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="font-medium">Dokter:</span>
                                <span>dokter@health.com / dokter123</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="font-medium">Pasien:</span>
                                <span>budi@health.com / pasien123</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
