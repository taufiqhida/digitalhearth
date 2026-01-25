import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiUser, FiCopy, FiCheck, FiKey } from 'react-icons/fi'
import api from '../../services/api'
import { Card, Modal, LoadingSpinner, EmptyState } from '../../components/UI'

export default function AdminPatients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showCredentials, setShowCredentials] = useState(null)
    const [editingPatient, setEditingPatient] = useState(null)
    const [copied, setCopied] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [form, setForm] = useState({
        name: '',
        nik: '',
        bpjs: '',
        phone: '',
        address: '',
        birthDate: '',
        gender: '',
    })

    useEffect(() => {
        loadPatients()
    }, [])

    const loadPatients = async () => {
        try {
            const res = await api.get('/admin/patients')
            setPatients(res.data)
        } catch (error) {
            console.error('Failed to load patients:', error)
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingPatient(null)
        setForm({
            name: '',
            nik: '',
            bpjs: '',
            phone: '',
            address: '',
            birthDate: '',
            gender: '',
        })
        setShowModal(true)
    }

    const openEditModal = (patient) => {
        setEditingPatient(patient)
        setForm({
            name: patient.name,
            nik: patient.nik || '',
            bpjs: patient.bpjs || '',
            phone: patient.phone || '',
            address: patient.address || '',
            birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
            gender: patient.gender || '',
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingPatient) {
                await api.put(`/admin/patients/${editingPatient.id}`, form)
                loadPatients()
                setShowModal(false)
            } else {
                const res = await api.post('/admin/patients', form)
                setShowCredentials(res.data.credentials)
                loadPatients()
                setShowModal(false)
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal menyimpan')
        }
    }

    const copyCredentials = () => {
        const text = `Email: ${showCredentials.email}\nPassword: ${showCredentials.password}`
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!newPassword || newPassword.length < 6) {
            alert('Password minimal 6 karakter')
            return
        }
        try {
            await api.put(`/admin/users/${showPasswordModal.id}/reset-password`, { newPassword })
            alert('Password berhasil direset!')
            setShowPasswordModal(null)
            setNewPassword('')
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal mereset password')
        }
    }

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-'
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return `${age} tahun`
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Manajemen Pasien</h1>
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <FiPlus /> Tambah Pasien
                </button>
            </div>

            <Card>
                {patients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>NIK</th>
                                    <th>BPJS</th>
                                    <th>Umur</th>
                                    <th>No HP</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((patient) => (
                                    <tr key={patient.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <FiUser className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{patient.name}</p>
                                                    <p className="text-xs text-gray-500">{patient.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-mono text-sm">{patient.nik || '-'}</td>
                                        <td>{patient.bpjs || '-'}</td>
                                        <td>{calculateAge(patient.birthDate)}</td>
                                        <td>{patient.phone || '-'}</td>
                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${patient.isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {patient.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(patient)}
                                                    className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => setShowPasswordModal(patient)}
                                                    className="p-2 hover:bg-amber-50 rounded-lg text-amber-600"
                                                    title="Reset Password"
                                                >
                                                    <FiKey />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        icon={FiUser}
                        title="Belum Ada Pasien"
                        description="Tambahkan pasien baru untuk memulai"
                    />
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingPatient ? 'Edit Pasien' : 'Tambah Pasien Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">NIK *</label>
                        <input
                            type="text"
                            value={form.nik}
                            onChange={(e) => setForm({ ...form, nik: e.target.value })}
                            className="input-field"
                            maxLength={16}
                            required
                            disabled={!!editingPatient}
                        />
                        {!editingPatient && (
                            <p className="text-xs text-gray-500 mt-1">Password akan digenerate dari 6 digit terakhir NIK</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">No BPJS</label>
                            <input
                                type="text"
                                value={form.bpjs}
                                onChange={(e) => setForm({ ...form, bpjs: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">No HP</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Lahir</label>
                            <input
                                type="date"
                                value={form.birthDate}
                                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Jenis Kelamin</label>
                            <select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Pilih</option>
                                <option value="MALE">Laki-laki</option>
                                <option value="FEMALE">Perempuan</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Alamat</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="input-field"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                            Batal
                        </button>
                        <button type="submit" className="btn-primary flex-1">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Credentials Modal */}
            <Modal
                isOpen={!!showCredentials}
                onClose={() => setShowCredentials(null)}
                title="Akun Pasien Berhasil Dibuat"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-2">Email:</p>
                        <p className="font-mono font-medium">{showCredentials?.email}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-2">Password:</p>
                        <p className="font-mono font-medium">{showCredentials?.password}</p>
                    </div>
                    <p className="text-sm text-gray-500">{showCredentials?.note}</p>

                    <button
                        onClick={copyCredentials}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {copied ? <FiCheck /> : <FiCopy />}
                        {copied ? 'Tersalin!' : 'Salin Kredensial'}
                    </button>
                </div>
            </Modal>

            {/* Password Reset Modal */}
            <Modal
                isOpen={!!showPasswordModal}
                onClose={() => { setShowPasswordModal(null); setNewPassword(''); }}
                title={`Reset Password - ${showPasswordModal?.name}`}
            >
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Password Baru *</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input-field"
                            placeholder="Minimal 6 karakter"
                            minLength={6}
                            required
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => { setShowPasswordModal(null); setNewPassword(''); }} className="btn-secondary flex-1">
                            Batal
                        </button>
                        <button type="submit" className="btn-primary flex-1">
                            Reset Password
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
