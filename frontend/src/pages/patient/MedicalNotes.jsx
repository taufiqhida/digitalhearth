import { useState, useEffect } from 'react'
import { FiFileText, FiUserCheck } from 'react-icons/fi'
import api from '../../services/api'
import { Card, LoadingSpinner, EmptyState } from '../../components/UI'

export default function PatientMedicalNotes() {
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadNotes()
    }, [])

    const loadNotes = async () => {
        try {
            const res = await api.get('/patient/medical-notes')
            setNotes(res.data)
        } catch (error) {
            console.error('Failed to load notes:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Catatan Medis</h1>

            <Card>
                {notes.length > 0 ? (
                    <div className="space-y-4">
                        {notes.map((note) => (
                            <div key={note.id} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <FiUserCheck className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{note.doctor?.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(note.createdAt).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3 ml-13">
                                    <div className="p-3 bg-white rounded-lg">
                                        <p className="text-xs font-medium text-emerald-600 mb-1">Diagnosa</p>
                                        <p className="text-sm text-gray-700">{note.diagnosis}</p>
                                    </div>
                                    {note.education && (
                                        <div className="p-3 bg-white rounded-lg">
                                            <p className="text-xs font-medium text-blue-600 mb-1">Edukasi & Saran</p>
                                            <p className="text-sm text-gray-700">{note.education}</p>
                                        </div>
                                    )}
                                    {note.followUp && (
                                        <div className="p-3 bg-white rounded-lg">
                                            <p className="text-xs font-medium text-amber-600 mb-1">Tindak Lanjut</p>
                                            <p className="text-sm text-gray-700">{note.followUp}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={FiFileText}
                        title="Belum Ada Catatan"
                        description="Catatan medis dari dokter akan muncul di sini"
                    />
                )}
            </Card>
        </div>
    )
}
