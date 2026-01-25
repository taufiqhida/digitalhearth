export function StatusBadge({ status }) {
    const styles = {
        normal: 'status-normal',
        warning: 'status-warning',
        danger: 'status-danger',
    }

    const labels = {
        normal: 'Normal',
        warning: 'Perhatian',
        danger: 'Bahaya',
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.normal}`}>
            {labels[status] || status}
        </span>
    )
}

export function Card({ children, className = '' }) {
    return (
        <div className={`glass-card p-6 animate-fade-in ${className}`}>
            {children}
        </div>
    )
}

export function StatCard({ icon: Icon, label, value, color = 'emerald' }) {
    const colors = {
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
        amber: 'from-amber-500 to-amber-600',
        red: 'from-red-500 to-red-600',
    }

    return (
        <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
                    <Icon className="text-white text-2xl" />
                </div>
                <div>
                    <p className="text-gray-500 text-sm">{label}</p>
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                </div>
            </div>
        </div>
    )
}

export function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
    )
}

export function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">{title}</h3>
            <p className="text-gray-500 mt-1">{description}</p>
        </div>
    )
}
