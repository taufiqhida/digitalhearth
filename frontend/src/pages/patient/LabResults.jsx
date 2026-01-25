import { useState, useEffect } from 'react'
import { FiActivity, FiCalendar, FiDownload } from 'react-icons/fi'
import html2canvas from 'html2canvas'
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
import { Card, LoadingSpinner, StatusBadge, EmptyState } from '../../components/UI'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function PatientLabResults() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedParam, setSelectedParam] = useState(null)
    const [selectedExam, setSelectedExam] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const res = await api.get('/patient/examinations')
            setData(res.data)
            if (res.data.examinations.length > 0) {
                setSelectedExam(res.data.examinations[0])
            }
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
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

    // Download lab result as PNG card
    const downloadLabResultCard = async (exam) => {
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

        const getOverallStatus = (results) => {
            if (!results) return 'normal'
            const statuses = Object.values(results).map(r => r.status)
            if (statuses.includes('danger')) return 'danger'
            if (statuses.includes('warning')) return 'warning'
            return 'normal'
        }

        let resultsHTML = ''
        Object.entries(exam.results || {}).forEach(([code, resultData]) => {
            const param = labParams.find(p => p.code === code)
            const statusInfo = getStatusLabel(resultData.status)
            if (param) {
                resultsHTML += `
                    <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${param.name}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${resultData.value}</td>
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
                                <span style="font-size: 11px; color: #6b7280; display: block;">Tanggal Pemeriksaan</span>
                                <span style="font-weight: 600; color: #111827; font-size: 14px;">${examDate}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; color: #6b7280; display: block;">Status</span>
                                <span style="font-weight: 600; color: #111827; font-size: 14px;">✅ Tervalidasi</span>
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
                        </div>
                    </div>
                </div>
            </div>
        `

        document.body.appendChild(container)

        try {
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#059669'
            })

            const link = document.createElement('a')
            link.download = `Hasil_LAB_${new Date(exam.createdAt).toISOString().split('T')[0]}.png`
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

    const { examinations, labParams } = data || { examinations: [], labParams: [] }

    if (examinations.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">Hasil Pemeriksaan LAB</h1>
                <Card>
                    <EmptyState
                        icon={FiActivity}
                        title="Belum Ada Hasil"
                        description="Hasil pemeriksaan LAB Anda akan muncul di sini setelah divalidasi"
                    />
                </Card>
            </div>
        )
    }

    // Get available params from examinations
    const availableParams = [...new Set(
        examinations.flatMap(e => Object.keys(e.results || {}))
    )]

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Hasil Pemeriksaan LAB</h1>

            {/* Examination history */}
            <Card>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Pemeriksaan</h2>
                <div className="flex flex-wrap gap-2">
                    {examinations.map((exam) => (
                        <button
                            key={exam.id}
                            onClick={() => setSelectedExam(exam)}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${selectedExam?.id === exam.id
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FiCalendar />
                            {new Date(exam.createdAt).toLocaleDateString('id-ID')}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Selected exam results */}
            {selectedExam && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Hasil Tanggal {new Date(selectedExam.createdAt).toLocaleDateString('id-ID')}
                        </h2>
                        <button
                            onClick={() => downloadLabResultCard(selectedExam)}
                            className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
                        >
                            <FiDownload /> Download PNG
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(selectedExam.results || {}).map(([code, result]) => {
                            const param = labParams.find(p => p.code === code)
                            return (
                                <button
                                    key={code}
                                    onClick={() => setSelectedParam(code)}
                                    className={`p-4 rounded-xl text-left transition-colors ${selectedParam === code
                                        ? 'bg-emerald-50 ring-2 ring-emerald-500'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
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
                                </button>
                            )
                        })}
                    </div>
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
        </div>
    )
}
