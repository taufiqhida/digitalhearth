import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiUser, FiCalendar, FiPhone, FiMapPin, FiDownload, FiFileText } from 'react-icons/fi'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import api from '../../services/api'
import { Card, Modal, LoadingSpinner, StatusBadge } from '../../components/UI'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function DoctorPatientDetail() {
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showNoteModal, setShowNoteModal] = useState(false)
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
    const [selectedParam, setSelectedParam] = useState(null)
    const [noteForm, setNoteForm] = useState({ diagnosis: '', education: '', followUp: '' })
    const [prescriptionForm, setPrescriptionForm] = useState({ medication: '', dosage: '', instructions: '', notes: '' })

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            const res = await api.get(`/doctor/patients/${id}`)
            setData(res.data)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveNote = async (e) => {
        e.preventDefault()
        try {
            await api.post('/doctor/medical-notes', {
                patientId: id,
                ...noteForm,
            })
            loadData()
            setShowNoteModal(false)
            setNoteForm({ diagnosis: '', education: '', followUp: '' })
        } catch (error) {
            alert('Gagal menyimpan catatan')
        }
    }

    const handleSavePrescription = async (e) => {
        e.preventDefault()
        try {
            await api.post('/doctor/prescriptions', {
                patientId: id,
                ...prescriptionForm,
            })
            loadData()
            setShowPrescriptionModal(false)
            setPrescriptionForm({ medication: '', dosage: '', instructions: '', notes: '' })
        } catch (error) {
            alert('Gagal menyimpan resep')
        }
    }

    const handleDownloadPrescription = (prescription) => {
        const content = `
========================================
           RESEP OBAT
     Sistem Kesehatan Digital
========================================

Tanggal: ${new Date(prescription.createdAt).toLocaleDateString('id-ID')}

PASIEN
------
Nama    : ${data.patient.name}
NIK     : ${data.patient.nik || '-'}

OBAT
----
Nama Obat   : ${prescription.medication}
Dosis       : ${prescription.dosage}

ATURAN PAKAI
------------
${prescription.instructions || '-'}

CATATAN DOKTER
--------------
${prescription.notes || '-'}

========================================
        Dokter Penanggung Jawab
========================================
`
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resep_${data.patient.name.replace(/\s+/g, '_')}_${new Date(prescription.createdAt).toISOString().split('T')[0]}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const getChartData = (paramCode) => {
        const param = data.labParams.find(p => p.code === paramCode)
        const examData = data.examinations
            .filter(e => e.results?.[paramCode])
            .reverse()
            .slice(-10)

        return {
            labels: examData.map(e => new Date(e.createdAt).toLocaleDateString('id-ID')),
            datasets: [
                {
                    label: param?.name || paramCode,
                    data: examData.map(e => e.results[paramCode].value),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Batas Normal Atas',
                    data: examData.map(() => param?.normalMax || 0),
                    borderColor: '#f59e0b',
                    borderDash: [5, 5],
                    pointRadius: 0,
                },
                {
                    label: 'Batas Normal Bawah',
                    data: examData.map(() => param?.normalMin || 0),
                    borderColor: '#f59e0b',
                    borderDash: [5, 5],
                    pointRadius: 0,
                },
            ],
        }
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
        },
        scales: {
            y: { beginAtZero: false },
        },
    }

    if (loading) return <LoadingSpinner />
    if (!data) return <p className="text-white">Data tidak ditemukan</p>

    const { patient, examinations, medicalNotes, prescriptions, labParams } = data
    const latestExam = examinations[0]

    // Get available params from examinations
    const availableParams = [...new Set(
        examinations.flatMap(e => Object.keys(e.results || {}))
    )]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/doctor/patients" className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20">
                    <FiArrowLeft />
                </Link>
                <h1 className="text-2xl font-bold text-white">Detail Pasien</h1>
            </div>

            {/* Patient Info */}
            <Card>
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <FiUser className="text-emerald-600 text-3xl" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
                            <p className="text-gray-500">{patient.nik}</p>
                        </div>
                        <div className="space-y-2">
                            {patient.birthDate && (
                                <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiCalendar className="text-emerald-500" />
                                    {new Date(patient.birthDate).toLocaleDateString('id-ID')}
                                </p>
                            )}
                            {patient.phone && (
                                <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiPhone className="text-emerald-500" />
                                    {patient.phone}
                                </p>
                            )}
                            {patient.address && (
                                <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiMapPin className="text-emerald-500" />
                                    {patient.address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Latest Lab Results */}
            {latestExam && (
                <Card>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Hasil LAB Terbaru ({new Date(latestExam.createdAt).toLocaleDateString('id-ID')})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(latestExam.results || {}).map(([code, result]) => {
                            const param = labParams.find(p => p.code === code)
                            return (
                                <button
                                    key={code}
                                    onClick={() => setSelectedParam(code)}
                                    className="p-4 bg-gray-50 rounded-xl text-left hover:bg-emerald-50 transition-colors"
                                >
                                    <p className="text-xs text-gray-500 mb-1">{param?.name || code}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-bold text-gray-800">
                                            {result.value} <span className="text-xs font-normal text-gray-500">{param?.unit}</span>
                                        </p>
                                        <StatusBadge status={result.status} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Therapy Recommendations for Danger Status */}
                    {Object.values(latestExam.results || {}).some(r => r.status === 'danger') && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">🚨</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-700 mb-2">Perlu Konsultasi & Terapi</h4>
                                    <p className="text-sm text-red-600 mb-3">
                                        Berdasarkan hasil lab, pasien memerlukan penanganan khusus:
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                                            <span className="text-lg">🍽️</span>
                                            <div>
                                                <p className="font-medium text-gray-800">Diet Gula</p>
                                                <p className="text-xs text-gray-500">Kurangi konsumsi makanan/minuman manis</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                                            <span className="text-lg">🏃</span>
                                            <div>
                                                <p className="font-medium text-gray-800">Olahraga Teratur</p>
                                                <p className="text-xs text-gray-500">Minimal 30 menit/hari, 3-5x seminggu</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                                            <span className="text-lg">💊</span>
                                            <div>
                                                <p className="font-medium text-gray-800">Monitoring Kepatuhan Obat</p>
                                                <p className="text-xs text-gray-500">Pastikan pasien minum obat sesuai resep</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => setShowPrescriptionModal(true)}
                                            className="btn-primary py-2 text-sm flex items-center gap-2"
                                        >
                                            <FiFileText /> Buat Resep Obat
                                        </button>
                                        <button
                                            onClick={() => setShowNoteModal(true)}
                                            className="btn-secondary py-2 text-sm flex items-center gap-2"
                                        >
                                            <FiPlus /> Tambah Catatan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Chart */}
            {selectedParam && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Grafik: {labParams.find(p => p.code === selectedParam)?.name}
                        </h3>
                        <select
                            value={selectedParam}
                            onChange={(e) => setSelectedParam(e.target.value)}
                            className="input-field w-auto"
                        >
                            {availableParams.map(code => (
                                <option key={code} value={code}>
                                    {labParams.find(p => p.code === code)?.name || code}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Line data={getChartData(selectedParam)} options={chartOptions} />
                </Card>
            )}

            {/* Medical Notes */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Catatan Medis</h3>
                    <button onClick={() => setShowNoteModal(true)} className="btn-primary py-2 flex items-center gap-2">
                        <FiPlus /> Tambah Catatan
                    </button>
                </div>
                {medicalNotes.length > 0 ? (
                    <div className="space-y-4">
                        {medicalNotes.map((note) => (
                            <div key={note.id} className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 mb-2">
                                    {new Date(note.createdAt).toLocaleDateString('id-ID')}
                                </p>
                                <div className="space-y-2">
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
                    <p className="text-gray-500 text-center py-4">Belum ada catatan medis</p>
                )}
            </Card>

            {/* Add Note Modal */}
            <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Tambah Catatan Medis">
                <form onSubmit={handleSaveNote} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Diagnosa *</label>
                        <textarea
                            value={noteForm.diagnosis}
                            onChange={(e) => setNoteForm({ ...noteForm, diagnosis: e.target.value })}
                            className="input-field"
                            rows={3}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Edukasi</label>
                        <textarea
                            value={noteForm.education}
                            onChange={(e) => setNoteForm({ ...noteForm, education: e.target.value })}
                            className="input-field"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tindak Lanjut</label>
                        <textarea
                            value={noteForm.followUp}
                            onChange={(e) => setNoteForm({ ...noteForm, followUp: e.target.value })}
                            className="input-field"
                            rows={2}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowNoteModal(false)} className="btn-secondary flex-1">
                            Batal
                        </button>
                        <button type="submit" className="btn-primary flex-1">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Prescriptions Section */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FiFileText className="text-emerald-600" />
                        Resep Obat
                    </h3>
                    <button onClick={() => setShowPrescriptionModal(true)} className="btn-primary py-2 flex items-center gap-2">
                        <FiPlus /> Buat Resep
                    </button>
                </div>
                {prescriptions && prescriptions.length > 0 ? (
                    <div className="space-y-4">
                        {prescriptions.map((prescription) => (
                            <div key={prescription.id} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-2">
                                            {new Date(prescription.createdAt).toLocaleDateString('id-ID')}
                                        </p>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-medium text-emerald-600">Obat:</p>
                                                <p className="text-sm font-semibold">{prescription.medication}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-blue-600">Dosis:</p>
                                                <p className="text-sm">{prescription.dosage}</p>
                                            </div>
                                            {prescription.instructions && (
                                                <div>
                                                    <p className="text-xs font-medium text-amber-600">Aturan Pakai:</p>
                                                    <p className="text-sm">{prescription.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadPrescription(prescription)}
                                        className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-600 transition-colors"
                                        title="Download Resep"
                                    >
                                        <FiDownload />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Belum ada resep obat</p>
                )}
            </Card>

            {/* Add Prescription Modal */}
            <Modal isOpen={showPrescriptionModal} onClose={() => setShowPrescriptionModal(false)} title="Buat Resep Obat">
                <form onSubmit={handleSavePrescription} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nama Obat *</label>
                        <input
                            type="text"
                            value={prescriptionForm.medication}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                            className="input-field"
                            placeholder="Metformin 500mg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Dosis *</label>
                        <input
                            type="text"
                            value={prescriptionForm.dosage}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                            className="input-field"
                            placeholder="3x1 tablet sehari"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Aturan Pakai</label>
                        <textarea
                            value={prescriptionForm.instructions}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Diminum setelah makan"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Catatan</label>
                        <textarea
                            value={prescriptionForm.notes}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Kurangi konsumsi gula"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowPrescriptionModal(false)} className="btn-secondary flex-1">
                            Batal
                        </button>
                        <button type="submit" className="btn-primary flex-1">
                            Simpan Resep
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
