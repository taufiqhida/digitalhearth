import { useState, useEffect } from 'react'
import { FiUsers, FiUserCheck, FiActivity, FiClock } from 'react-icons/fi'
import api from '../../services/api'
import { StatCard, Card, LoadingSpinner } from '../../components/UI'

export default function AdminDashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const res = await api.get('/admin/dashboard')
            setData(res.data)
        } catch (error) {
            console.error('Failed to load dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={FiUsers}
                    label="Total Pasien"
                    value={data?.stats?.patientCount || 0}
                    color="emerald"
                />
                <StatCard
                    icon={FiUserCheck}
                    label="Total Dokter"
                    value={data?.stats?.doctorCount || 0}
                    color="blue"
                />
                <StatCard
                    icon={FiActivity}
                    label="Total Pemeriksaan"
                    value={data?.stats?.examCount || 0}
                    color="amber"
                />
                <StatCard
                    icon={FiClock}
                    label="Menunggu Validasi"
                    value={data?.stats?.pendingExamCount || 0}
                    color="red"
                />
            </div>

            {/* Recent examinations */}
            <Card>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pemeriksaan Terbaru</h2>
                {data?.recentExams?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Pasien</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentExams.map((exam) => (
                                    <tr key={exam.id}>
                                        <td>{new Date(exam.createdAt).toLocaleDateString('id-ID')}</td>
                                        <td className="font-medium">{exam.patient?.name}</td>
                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${exam.status === 'VALID'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {exam.status === 'VALID' ? 'Valid' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Belum ada pemeriksaan</p>
                )}
            </Card>
        </div>
    )
}
