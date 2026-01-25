import { useState, useEffect } from 'react'
import { FiPlus, FiCheck, FiActivity, FiClock, FiEdit2, FiEye, FiAlertTriangle, FiDownload } from 'react-icons/fi'
import html2canvas from 'html2canvas'
import api from '../../services/api'
import { Card, Modal, LoadingSpinner, EmptyState, StatusBadge } from '../../components/UI'

export default function AdminExaminations() {
    const [exams, setExams] = useState([])
    const [patients, setPatients] = useState([])
    const [labParams, setLabParams] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState('')
    const [results, setResults] = useState({})
    const [editingExam, setEditingExam] = useState(null) // For edit mode
    const [showConfirmModal, setShowConfirmModal] = useState(false) // Confirmation dialog
    const [examToValidate, setExamToValidate] = useState(null) // Exam pending validation
    const [viewMode, setViewMode] = useState(false) // View only mode

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [examsRes, paramsRes, patientsRes] = await Promise.all([
                api.get('/admin/examinations'),
                api.get('/admin/examinations/params'),
                api.get('/admin/patients'),
            ])
            setExams(examsRes.data)
            setLabParams(paramsRes.data)
            setPatients(patientsRes.data)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setSelectedPatient('')
        setResults({})
        setEditingExam(null)
        setViewMode(false)
        setShowModal(true)
    }

    // Open modal to view exam (read-only)
    const openViewModal = (exam) => {
        setEditingExam(exam)
        setSelectedPatient(exam.patientId.toString())
        // Convert results to simple values for display
        const simpleResults = {}
        Object.entries(exam.results || {}).forEach(([code, data]) => {
            simpleResults[code] = data.value
        })
        setResults(simpleResults)
        setViewMode(true)
        setShowModal(true)
    }

    // Open modal to edit exam (only for pending)
    const openEditModal = (exam) => {
        if (exam.status === 'VALID') {
            alert('Pemeriksaan yang sudah divalidasi tidak bisa diedit')
            return
        }
        setEditingExam(exam)
        setSelectedPatient(exam.patientId.toString())
        // Convert results to simple values for editing
        const simpleResults = {}
        Object.entries(exam.results || {}).forEach(([code, data]) => {
            simpleResults[code] = data.value
        })
        setResults(simpleResults)
        setViewMode(false)
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedPatient) {
            alert('Pilih pasien terlebih dahulu')
            return
        }
        try {
            if (editingExam) {
                // Update existing exam
                await api.put(`/admin/examinations/${editingExam.id}`, {
                    results,
                })
            } else {
                // Create new exam
                await api.post('/admin/examinations', {
                    patientId: selectedPatient,
                    results,
                })
            }
            loadData()
            setShowModal(false)
            setEditingExam(null)
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal menyimpan')
        }
    }

    // Show confirmation before validating
    const confirmValidate = (exam) => {
        setExamToValidate(exam)
        setShowConfirmModal(true)
    }

    // Actually validate after confirmation
    const handleValidate = async () => {
        if (!examToValidate) return
        try {
            await api.put(`/admin/examinations/${examToValidate.id}/validate`)
            loadData()
            setShowConfirmModal(false)
            setExamToValidate(null)
        } catch (error) {
            alert('Gagal memvalidasi')
        }
    }

    const getOverallStatus = (results) => {
        if (!results) return 'normal'
        const statuses = Object.values(results).map(r => r.status)
        if (statuses.includes('danger')) return 'danger'
        if (statuses.includes('warning')) return 'warning'
        return 'normal'
    }

    // Download lab result as PNG card/report
    const downloadLabResultCard = async (exam) => {
        const patient = patients.find(p => p.id === exam.patientId) || exam.patient
        const examDate = new Date(exam.createdAt).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const getStatusLabel = (status) => {
            if (status === 'danger') return { text: 'Perlu Tindakan', color: '#dc2626', bg: '#fef2f2' }
            if (status === 'warning') return { text: 'Perhatian', color: '#d97706', bg: '#fffbeb' }
            return { text: 'Normal', color: '#059669', bg: '#ecfdf5' }
        }

        let resultsHTML = ''
        Object.entries(exam.results || {}).forEach(([code, data]) => {
            const param = labParams.find(p => p.code === code)
            const statusInfo = getStatusLabel(data.status)
            if (param) {
                resultsHTML += `
                    <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${param.name}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${data.value}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${param.unit}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                            <span style="background: ${statusInfo.bg}; color: ${statusInfo.color}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                ${statusInfo.text}
                            </span>
                        </td>
                    </tr>
                `
            }
        })

        const overallStatus = getOverallStatus(exam.results)
        const overallInfo = getStatusLabel(overallStatus)

        // Create temporary container for rendering
        const container = document.createElement('div')
        container.style.position = 'absolute'
        container.style.left = '-9999px'
        container.style.top = '0'
        container.style.width = '700px'
        container.innerHTML = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px;">
                <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 24px; text-align: center;">
                        <div style="width: 50px; height: 50px; background: white; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🏥</div>
                        <h1 style="font-size: 20px; margin: 0 0 4px 0;">HASIL PEMERIKSAAN LABORATORIUM</h1>
                        <p style="opacity: 0.9; font-size: 12px; margin: 0;">Sistem Informasi Kesehatan Digital</p>
                    </div>
                    
                    <div style="padding: 20px 24px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <span style="font-size: 11px; color: #6b7280; display: block;">Nama Pasien</span>
                                <span style="font-weight: 600; color: #111827; font-size: 14px;">${patient?.name || '-'}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; color: #6b7280; display: block;">Tanggal Pemeriksaan</span>
                                <span style="font-weight: 600; color: #111827; font-size: 14px;">${examDate}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; color: #6b7280; display: block;">NIK</span>
                                <span style="font-weight: 600; color: #111827; font-size: 14px;">${patient?.nik || '-'}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; color: #6b7280; display: block;">Status Validasi</span>
                                <span style="font-weight: 600; color: #111827; font-size: 14px;">${exam.status === 'VALID' ? '✅ Tervalidasi' : '⏳ Pending'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding: 20px 24px;">
                        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">📊 Hasil Pemeriksaan</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Parameter</th>
                                    <th style="background: #f3f4f6; padding: 10px 12px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Nilai</th>
                                    <th style="background: #f3f4f6; padding: 10px 12px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Satuan</th>
                                    <th style="background: #f3f4f6; padding: 10px 12px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resultsHTML}
                            </tbody>
                        </table>
                    </div>

                    ${(overallStatus === 'warning' || overallStatus === 'danger') ? `
                    <div style="padding: 20px 24px; background: ${overallStatus === 'danger' ? '#fef2f2' : '#fffbeb'}; border-top: 1px solid ${overallStatus === 'danger' ? '#fecaca' : '#fde68a'};">
                        <h3 style="margin: 0 0 12px 0; color: ${overallStatus === 'danger' ? '#dc2626' : '#d97706'}; font-size: 14px;">
                            ${overallStatus === 'danger' ? '🚨 Saran Penanganan:' : '⚠️ Saran Kesehatan:'}
                        </h3>
                        <div style="display: grid; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px; background: white; padding: 10px 14px; border-radius: 10px;">
                                <span style="font-size: 18px;">🍽️</span>
                                <div>
                                    <p style="margin: 0; font-weight: 600; font-size: 13px; color: #111827;">Diet Gula</p>
                                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">Kurangi konsumsi makanan/minuman manis</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; background: white; padding: 10px 14px; border-radius: 10px;">
                                <span style="font-size: 18px;">🏃</span>
                                <div>
                                    <p style="margin: 0; font-weight: 600; font-size: 13px; color: #111827;">Olahraga Teratur</p>
                                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">Minimal 30 menit/hari, 3-5x seminggu</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; background: white; padding: 10px 14px; border-radius: 10px;">
                                <span style="font-size: 18px;">💊</span>
                                <div>
                                    <p style="margin: 0; font-weight: 600; font-size: 13px; color: #111827;">Monitoring Kepatuhan Obat</p>
                                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">Minum obat sesuai resep dokter</p>
                                </div>
                            </div>
                            ${overallStatus === 'danger' ? `
                            <div style="display: flex; align-items: center; gap: 10px; background: white; padding: 10px 14px; border-radius: 10px;">
                                <span style="font-size: 18px;">🏥</span>
                                <div>
                                    <p style="margin: 0; font-weight: 600; font-size: 13px; color: #111827;">Konsultasi Dokter</p>
                                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">Segera hubungi dokter untuk pemeriksaan lanjutan</p>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}

                    <div style="padding: 20px 24px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">Status Kesehatan Keseluruhan</p>
                        <span style="display: inline-block; padding: 6px 20px; border-radius: 20px; font-weight: 600; font-size: 14px; background: ${overallInfo.bg}; color: ${overallInfo.color};">
                            ${overallInfo.text}
                        </span>
                        <div style="margin-top: 16px; font-size: 10px; color: #9ca3af;">
                            <p style="margin: 0;">Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
                            <p style="margin: 4px 0 0 0;">Dokumen ini dihasilkan secara otomatis oleh sistem</p>
                        </div>
                    </div>
                </div>
            </div>
        `

        document.body.appendChild(container)

        try {
            // Use html2canvas to capture as image
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#059669'
            })

            // Convert to PNG and download
            const link = document.createElement('a')
            link.download = `Hasil_LAB_${patient?.name?.replace(/\s+/g, '_')}_${new Date(exam.createdAt).toISOString().split('T')[0]}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (error) {
            console.error('Error generating PNG:', error)
            alert('Gagal mengunduh kartu hasil. Silakan coba lagi.')
        } finally {
            document.body.removeChild(container)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Pemeriksaan LAB</h1>
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <FiPlus /> Input Hasil LAB
                </button>
            </div>

            <Card>
                {exams.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Pasien</th>
                                    <th>NIK</th>
                                    <th>Hasil</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map((exam) => (
                                    <tr key={exam.id}>
                                        <td>{new Date(exam.createdAt).toLocaleDateString('id-ID')}</td>
                                        <td className="font-medium">{exam.patient?.name}</td>
                                        <td className="font-mono text-sm">{exam.patient?.nik}</td>
                                        <td>
                                            <StatusBadge status={getOverallStatus(exam.results)} />
                                        </td>
                                        <td>
                                            {exam.status === 'VALID' ? (
                                                <span className="flex items-center gap-1 text-emerald-600">
                                                    <FiCheck /> Valid
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-amber-600">
                                                    <FiClock /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {/* View button - always visible */}
                                                <button
                                                    onClick={() => openViewModal(exam)}
                                                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Lihat Hasil"
                                                >
                                                    <FiEye />
                                                </button>

                                                {/* Download button - always visible */}
                                                <button
                                                    onClick={() => downloadLabResultCard(exam)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Download Kartu Hasil"
                                                >
                                                    <FiDownload />
                                                </button>

                                                {/* Edit button - only for pending */}
                                                {exam.status !== 'VALID' && (
                                                    <button
                                                        onClick={() => openEditModal(exam)}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Hasil"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                )}

                                                {/* Validate button - only for pending */}
                                                {exam.status !== 'VALID' && (
                                                    <button
                                                        onClick={() => confirmValidate(exam)}
                                                        className="btn-primary py-2 px-4 text-sm"
                                                    >
                                                        Validasi
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        icon={FiActivity}
                        title="Belum Ada Pemeriksaan"
                        description="Mulai input hasil LAB pasien"
                    />
                )}
            </Card>

            {/* Add/Edit/View Examination Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingExam(null); setViewMode(false); }}
                title={viewMode ? 'Lihat Hasil Pemeriksaan' : (editingExam ? 'Edit Hasil Pemeriksaan' : 'Input Hasil Pemeriksaan LAB')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Pasien</label>
                        <select
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            className="input-field"
                            required
                            disabled={editingExam || viewMode}
                        >
                            <option value="">-- Pilih Pasien --</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.nik})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-700 mb-3">Parameter LAB</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {labParams.map((param) => (
                                <div key={param.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{param.name}</p>
                                        <p className="text-xs text-gray-500">
                                            Normal: {param.normalMin} - {param.normalMax} {param.unit}
                                        </p>
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type={param.inputType === 'NUMBER' ? 'number' : 'text'}
                                            step="any"
                                            value={results[param.code] || ''}
                                            onChange={(e) => setResults({ ...results, [param.code]: e.target.value })}
                                            className="input-field py-2 text-sm"
                                            placeholder={param.unit}
                                            disabled={viewMode}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => { setShowModal(false); setEditingExam(null); setViewMode(false); }} className="btn-secondary flex-1">
                            {viewMode ? 'Tutup' : 'Batal'}
                        </button>
                        {!viewMode && (
                            <button type="submit" className="btn-primary flex-1">
                                {editingExam ? 'Update' : 'Simpan'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>

            {/* Confirmation Modal for Validation */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => { setShowConfirmModal(false); setExamToValidate(null); }}
                title="Konfirmasi Validasi"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <FiAlertTriangle className="text-amber-600 text-xl" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-700 mb-1">Perhatian!</h4>
                            <p className="text-sm text-amber-600">
                                Apakah Anda yakin ingin memvalidasi hasil pemeriksaan ini?
                            </p>
                            <p className="text-sm text-amber-600 mt-2">
                                <strong>Setelah divalidasi, hasil pemeriksaan tidak dapat diedit lagi.</strong>
                            </p>
                        </div>
                    </div>

                    {examToValidate && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>Pasien:</strong> {examToValidate.patient?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Tanggal:</strong> {new Date(examToValidate.createdAt).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => { setShowConfirmModal(false); setExamToValidate(null); }}
                            className="btn-secondary flex-1"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleValidate}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <FiCheck /> Ya, Saya Setuju
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
