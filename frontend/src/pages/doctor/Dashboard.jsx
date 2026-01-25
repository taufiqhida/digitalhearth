import { useState, useEffect } from 'react'
import { FiUsers, FiMessageSquare, FiFileText } from 'react-icons/fi'
import api from '../../services/api'
import { StatCard, Card, LoadingSpinner } from '../../components/UI'

export default function DoctorDashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const res = await api.get('/doctor/dashboard')
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
            <h1 className="text-2xl font-bold text-white">Dashboard Dokter</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    icon={FiUsers}
                    label="Total Pasien Aktif"
                    value={data?.stats?.patientCount || 0}
                    color="emerald"
                />
                <StatCard
                    icon={FiMessageSquare}
                    label="Konsultasi Belum Dibaca"
                    value={data?.stats?.pendingConsultations || 0}
                    color="blue"
                />
            </div>

            <Card>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Catatan Medis Terbaru</h2>
                {data?.recentNotes?.length > 0 ? (
                    <div className="space-y-3">
                        {data.recentNotes.map((note) => (
                            <div key={note.id} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium">{note.patient?.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(note.createdAt).toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{note.diagnosis}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Belum ada catatan medis</p>
                )}
            </Card>
        </div>
    )
}
