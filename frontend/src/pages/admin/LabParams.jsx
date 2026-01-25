import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import api from '../../services/api'
import { Card, Modal, LoadingSpinner, EmptyState } from '../../components/UI'

export default function AdminLabParams() {
    const [params, setParams] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingParam, setEditingParam] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [form, setForm] = useState({
        code: '',
        name: '',
        unit: '',
        normalMin: '',
        normalMax: '',
        attentionMin: '',
        attentionMax: '',
        actionMin: '',
        actionMax: '',
        normalMinMale: '',
        normalMaxMale: '',
        normalMinFemale: '',
        normalMaxFemale: '',
        inputType: 'NUMBER',
    })

    useEffect(() => {
        loadParams()
    }, [])

    const loadParams = async () => {
        try {
            const res = await api.get('/admin/lab-params')
            setParams(res.data)
        } catch (error) {
            console.error('Failed to load params:', error)
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingParam(null)
        setForm({
            code: '',
            name: '',
            unit: '',
            normalMin: '',
            normalMax: '',
            attentionMin: '',
            attentionMax: '',
            actionMin: '',
            actionMax: '',
            normalMinMale: '',
            normalMaxMale: '',
            normalMinFemale: '',
            normalMaxFemale: '',
            inputType: 'NUMBER',
        })
        setShowModal(true)
    }

    const openEditModal = (param) => {
        setEditingParam(param)
        setForm({
            code: param.code,
            name: param.name,
            unit: param.unit,
            normalMin: param.normalMin ?? '',
            normalMax: param.normalMax ?? '',
            attentionMin: param.attentionMin ?? '',
            attentionMax: param.attentionMax ?? '',
            actionMin: param.actionMin ?? '',
            actionMax: param.actionMax ?? '',
            normalMinMale: param.normalMinMale ?? '',
            normalMaxMale: param.normalMaxMale ?? '',
            normalMinFemale: param.normalMinFemale ?? '',
            normalMaxFemale: param.normalMaxFemale ?? '',
            inputType: param.inputType,
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingParam) {
                await api.put(`/admin/lab-params/${editingParam.id}`, form)
            } else {
                await api.post('/admin/lab-params', form)
            }
            loadParams()
            setShowModal(false)
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal menyimpan')
        }
    }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/lab-params/${id}`)
            loadParams()
            setDeleteConfirm(null)
        } catch (error) {
            alert('Gagal menghapus')
        }
    }

    const toggleActive = async (param) => {
        try {
            await api.put(`/admin/lab-params/${param.id}`, { isActive: !param.isActive })
            loadParams()
        } catch (error) {
            alert('Gagal mengubah status')
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Parameter LAB</h1>
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <FiPlus /> Tambah Parameter
                </button>
            </div>

            <Card>
                {params.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama Parameter</th>
                                    <th>Satuan</th>
                                    <th>Normal</th>
                                    <th>Perhatian</th>
                                    <th>Perlu Tindakan</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {params.map((param) => (
                                    <tr key={param.id}>
                                        <td className="font-mono text-emerald-600">{param.code}</td>
                                        <td className="font-medium">{param.name}</td>
                                        <td>{param.unit}</td>
                                        <td>
                                            <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                                                {param.normalMin !== null && param.normalMax !== null
                                                    ? `${param.normalMin} - ${param.normalMax}`
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs">
                                                {param.attentionMin !== null && param.attentionMax !== null
                                                    ? `${param.attentionMin} - ${param.attentionMax}`
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                                                {param.actionMin !== null
                                                    ? `≥${param.actionMin}`
                                                    : param.actionMax !== null
                                                        ? `≤${param.actionMax}`
                                                        : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleActive(param)}
                                                className={`w-10 h-6 rounded-full relative transition-colors ${param.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${param.isActive ? 'left-5' : 'left-1'
                                                    }`} />
                                            </button>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(param)}
                                                    className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(param)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                                >
                                                    <FiTrash2 />
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
                        icon={FiPlus}
                        title="Belum Ada Parameter"
                        description="Tambahkan parameter LAB untuk mulai mencatat hasil pemeriksaan"
                    />
                )}
            </Card>

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingParam ? 'Edit Parameter' : 'Tambah Parameter'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Kode</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                className="input-field"
                                placeholder="gdp"
                                required
                                disabled={!!editingParam}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Satuan</label>
                            <input
                                type="text"
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                className="input-field"
                                placeholder="mg/dL"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nama Parameter</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="input-field"
                            placeholder="Gula Darah Puasa"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Default Min</label>
                            <input
                                type="number"
                                step="any"
                                value={form.normalMin}
                                onChange={(e) => setForm({ ...form, normalMin: e.target.value })}
                                className="input-field"
                                placeholder="70"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Default Max</label>
                            <input
                                type="number"
                                step="any"
                                value={form.normalMax}
                                onChange={(e) => setForm({ ...form, normalMax: e.target.value })}
                                className="input-field"
                                placeholder="130"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-xl">
                        <p className="text-sm font-medium text-orange-700 mb-3">⚠️ Perhatian (Warning Range)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Min</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.attentionMin}
                                    onChange={(e) => setForm({ ...form, attentionMin: e.target.value })}
                                    className="input-field"
                                    placeholder="131"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Max</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.attentionMax}
                                    onChange={(e) => setForm({ ...form, attentionMax: e.target.value })}
                                    className="input-field"
                                    placeholder="150"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-xl">
                        <p className="text-sm font-medium text-red-700 mb-3">🚨 Perlu Tindakan (Danger Threshold)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Min (≥ nilai ini = danger)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.actionMin}
                                    onChange={(e) => setForm({ ...form, actionMin: e.target.value })}
                                    className="input-field"
                                    placeholder="200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Max (≤ nilai ini = danger)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.actionMax}
                                    onChange={(e) => setForm({ ...form, actionMax: e.target.value })}
                                    className="input-field"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl">
                        <p className="text-sm font-medium text-blue-700 mb-3">👨 Nilai Normal Laki-laki (opsional)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Min</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.normalMinMale}
                                    onChange={(e) => setForm({ ...form, normalMinMale: e.target.value })}
                                    className="input-field"
                                    placeholder="3.0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Max</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.normalMaxMale}
                                    onChange={(e) => setForm({ ...form, normalMaxMale: e.target.value })}
                                    className="input-field"
                                    placeholder="7.2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-pink-50 rounded-xl">
                        <p className="text-sm font-medium text-pink-700 mb-3">👩 Nilai Normal Perempuan (opsional)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Min</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.normalMinFemale}
                                    onChange={(e) => setForm({ ...form, normalMinFemale: e.target.value })}
                                    className="input-field"
                                    placeholder="2.6"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Max</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.normalMaxFemale}
                                    onChange={(e) => setForm({ ...form, normalMaxFemale: e.target.value })}
                                    className="input-field"
                                    placeholder="6.0"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tipe Input</label>
                        <select
                            value={form.inputType}
                            onChange={(e) => setForm({ ...form, inputType: e.target.value })}
                            className="input-field"
                        >
                            <option value="NUMBER">Number</option>
                            <option value="TEXT">Text</option>
                        </select>
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Konfirmasi Hapus"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-xl text-center">
                        <p className="text-red-600 font-medium">Apakah Anda yakin ingin menghapus parameter ini?</p>
                        <p className="text-lg font-bold text-gray-800 mt-2">{deleteConfirm?.name}</p>
                        <p className="text-sm text-gray-500">Kode: {deleteConfirm?.code}</p>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                        ⚠️ Tindakan ini tidak dapat dibatalkan
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="btn-secondary flex-1"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleDelete(deleteConfirm?.id)}
                            className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
