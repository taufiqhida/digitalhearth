import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiUserCheck, FiKey } from 'react-icons/fi'
import api from '../../services/api'
import { Card, Modal, LoadingSpinner, EmptyState } from '../../components/UI'

export default function AdminDoctors() {
    const [doctors, setDoctors] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingDoctor, setEditingDoctor] = useState(null)
    const [showPasswordModal, setShowPasswordModal] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    })

    useEffect(() => {
        loadDoctors()
    }, [])

    const loadDoctors = async () => {
        try {
            const res = await api.get('/admin/doctors')
            setDoctors(res.data)
        } catch (error) {
            console.error('Failed to load doctors:', error)
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingDoctor(null)
        setForm({ name: '', email: '', password: '', phone: '' })
        setShowModal(true)
    }

    const openEditModal = (doctor) => {
        setEditingDoctor(doctor)
        setForm({
            name: doctor.name,
            email: doctor.email,
            password: '',
            phone: doctor.phone || '',
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingDoctor) {
                await api.put(`/admin/doctors/${editingDoctor.id}`, {
                    name: form.name,
                    phone: form.phone,
                })
            } else {
                await api.post('/admin/doctors', form)
            }
            loadDoctors()
            setShowModal(false)
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal menyimpan')
        }
    }

    const toggleActive = async (doctor) => {
        try {
            await api.put(`/admin/doctors/${doctor.id}`, { isActive: !doctor.isActive })
            loadDoctors()
        } catch (error) {
            alert('Gagal mengubah status')
        }
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

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Manajemen Dokter</h1>
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <FiPlus /> Tambah Dokter
                </button>
            </div>

            <Card>
                {doctors.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Email</th>
                                    <th>No HP</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map((doctor) => (
                                    <tr key={doctor.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <FiUserCheck className="text-blue-600" />
                                                </div>
                                                <span className="font-medium">{doctor.name}</span>
                                            </div>
                                        </td>
                                        <td>{doctor.email}</td>
                                        <td>{doctor.phone || '-'}</td>
                                        <td>
                                            <button
                                                onClick={() => toggleActive(doctor)}
                                                className={`w-10 h-6 rounded-full relative transition-colors ${doctor.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${doctor.isActive ? 'left-5' : 'left-1'
                                                    }`} />
                                            </button>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(doctor)}
                                                    className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => setShowPasswordModal(doctor)}
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
                        icon={FiUserCheck}
                        title="Belum Ada Dokter"
                        description="Tambahkan dokter untuk memulai"
                    />
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingDoctor ? 'Edit Dokter' : 'Tambah Dokter'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nama *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>

                    {!editingDoctor && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">No HP</label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="input-field"
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
