import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiUser, FiChevronRight, FiSearch } from 'react-icons/fi'
import api from '../../services/api'
import { Card, LoadingSpinner, EmptyState, StatusBadge } from '../../components/UI'

export default function DoctorPatients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadPatients()
    }, [])

    const loadPatients = async () => {
        try {
            const res = await api.get('/doctor/patients')
            setPatients(res.data)
        } catch (error) {
            console.error('Failed to load patients:', error)
        } finally {
            setLoading(false)
        }
    }

    const getLatestStatus = (patient) => {
        const exam = patient.examinationsAsPatient?.[0]
        if (!exam) return null
        const results = exam.results
        if (!results) return 'normal'
        const statuses = Object.values(results).map(r => r.status)
        if (statuses.includes('danger')) return 'danger'
        if (statuses.includes('warning')) return 'warning'
        return 'normal'
    }

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nik?.includes(search)
    )

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Daftar Pasien</h1>

            <Card>
                <div className="relative mb-4">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-11"
                        placeholder="Cari nama atau NIK..."
                    />
                </div>

                {filteredPatients.length > 0 ? (
                    <div className="space-y-3">
                        {filteredPatients.map((patient) => {
                            const status = getLatestStatus(patient)
                            return (
                                <Link
                                    key={patient.id}
                                    to={`/doctor/patients/${patient.id}`}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <FiUser className="text-emerald-600 text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{patient.name}</p>
                                            <p className="text-sm text-gray-500">{patient.nik}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {status && <StatusBadge status={status} />}
                                        <FiChevronRight className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={FiUser}
                        title="Tidak Ada Pasien"
                        description={search ? 'Tidak ditemukan pasien dengan pencarian tersebut' : 'Belum ada pasien terdaftar'}
                    />
                )}
            </Card>
        </div>
    )
}
