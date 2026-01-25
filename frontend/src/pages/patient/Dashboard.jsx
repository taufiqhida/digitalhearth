import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiActivity, FiMessageSquare, FiAlertTriangle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import api from '../../services/api'
import { StatCard, Card, LoadingSpinner, StatusBadge } from '../../components/UI'

export default function PatientDashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const res = await api.get('/patient/dashboard')
            setData(res.data)
        } catch (error) {
            console.error('Failed to load dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingSpinner />

    const { latestExam, labParams, stats } = data || {}

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard Kesehatan</h1>

            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={FiMessageSquare}
                    label="Pesan Belum Dibaca"
                    value={stats?.unreadMessages || 0}
                    color="blue"
                />
                <StatCard
                    icon={FiAlertTriangle}
                    label="Perlu Perhatian"
                    value={stats?.warningCount || 0}
                    color="amber"
                />
                <StatCard
                    icon={FiAlertCircle}
                    label="Perlu Tindakan"
                    value={stats?.dangerCount || 0}
                    color="red"
                />
            </div>

            {/* Latest results summary */}
            {latestExam ? (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Hasil Pemeriksaan Terakhir
                        </h2>
                        <span className="text-sm text-gray-500">
                            {new Date(latestExam.createdAt).toLocaleDateString('id-ID')}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(latestExam.results || {}).map(([code, result]) => {
                            const param = labParams?.find(p => p.code === code)
                            return (
                                <div
                                    key={code}
                                    className="p-4 bg-gray-50 rounded-xl"
                                >
                                    <p className="text-xs text-gray-500 mb-1">{param?.name || code}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-bold text-gray-800">
                                            {result.value}
                                            <span className="text-xs font-normal text-gray-500 ml-1">{param?.unit}</span>
                                        </p>
                                        <StatusBadge status={result.status} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Normal: {param?.normalMin} - {param?.normalMax}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    <Link
                        to="/patient/lab-results"
                        className="mt-4 flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        Lihat Semua Hasil <FiArrowRight />
                    </Link>
                </Card>
            ) : (
                <Card>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <FiActivity className="text-3xl text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700">Belum Ada Hasil Pemeriksaan</h3>
                        <p className="text-gray-500 mt-1">Hasil pemeriksaan LAB Anda akan muncul di sini</p>
                    </div>
                </Card>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/patient/lab-results" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <FiActivity className="text-white text-2xl" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                Hasil LAB
                            </h3>
                            <p className="text-sm text-gray-500">Lihat riwayat dan grafik hasil pemeriksaan</p>
                        </div>
                        <FiArrowRight className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                </Link>

                <Link to="/patient/chat" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <FiMessageSquare className="text-white text-2xl" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                Konsultasi Dokter
                            </h3>
                            <p className="text-sm text-gray-500">Chat dengan dokter untuk konsultasi</p>
                        </div>
                        <FiArrowRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
