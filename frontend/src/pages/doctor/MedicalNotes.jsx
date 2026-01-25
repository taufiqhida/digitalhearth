import { useState, useEffect } from 'react'
import { FiFileText, FiUser } from 'react-icons/fi'
import api from '../../services/api'
import { Card, LoadingSpinner, EmptyState } from '../../components/UI'

export default function DoctorMedicalNotes() {
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadNotes()
    }, [])

    const loadNotes = async () => {
        try {
            const res = await api.get('/doctor/medical-notes')
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
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <FiUser className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{note.patient?.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(note.createdAt).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 pl-13">
                                    <div>
                                        <p className="text-xs font-medium text-emerald-600">Diagnosa:</p>
                                        <p className="text-sm">{note.diagnosis}</p>
                                    </div>
                                    {note.education && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-600">Edukasi:</p>
                                            <p className="text-sm">{note.education}</p>
                                        </div>
                                    )}
                                    {note.followUp && (
                                        <div>
                                            <p className="text-xs font-medium text-amber-600">Tindak Lanjut:</p>
                                            <p className="text-sm">{note.followUp}</p>
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
                        description="Catatan medis yang Anda buat akan muncul di sini"
                    />
                )}
            </Card>
        </div>
    )
}
