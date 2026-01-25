import { useState, useEffect, useRef } from 'react'
import { FiSend, FiMessageSquare, FiUserCheck } from 'react-icons/fi'
import api from '../../services/api'
import { initSocket, getSocket, disconnectSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { Card, LoadingSpinner, EmptyState } from '../../components/UI'

export default function PatientChat() {
    const { user, token } = useAuth()
    const [doctors, setDoctors] = useState([])
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        loadDoctors()
        loadConversations()
        const socket = initSocket(token)

        socket.on('new_message', (message) => {
            if (selectedDoctor && message.senderId === selectedDoctor.id) {
                setMessages(prev => [...prev, message])
            }
        })

        return () => {
            disconnectSocket()
        }
    }, [token])

    useEffect(() => {
        if (selectedDoctor) {
            loadMessages(selectedDoctor.id)
        }
    }, [selectedDoctor])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadDoctors = async () => {
        try {
            const res = await api.get('/patient/doctors')
            setDoctors(res.data)
        } catch (error) {
            console.error('Failed to load doctors:', error)
        }
    }

    const loadConversations = async () => {
        try {
            const res = await api.get('/chat/conversations')
            if (res.data.length > 0) {
                const doctorConv = res.data.find(c => c.user.role === 'DOCTOR')
                if (doctorConv) {
                    setSelectedDoctor(doctorConv.user)
                }
            }
        } catch (error) {
            console.error('Failed to load conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (doctorId) => {
        try {
            const res = await api.get(`/chat/messages/${doctorId}`)
            setMessages(res.data)
        } catch (error) {
            console.error('Failed to load messages:', error)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedDoctor) return

        try {
            const socket = getSocket()
            if (socket) {
                socket.emit('send_message', {
                    receiverId: selectedDoctor.id,
                    message: newMessage,
                })
            } else {
                await api.post('/chat/messages', {
                    receiverId: selectedDoctor.id,
                    message: newMessage,
                })
                loadMessages(selectedDoctor.id)
            }

            setMessages(prev => [...prev, {
                id: Date.now(),
                senderId: user.id,
                message: newMessage,
                createdAt: new Date().toISOString(),
                sender: { id: user.id, name: user.name, role: user.role },
            }])
            setNewMessage('')
        } catch (error) {
            console.error('Failed to send message:', error)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Konsultasi dengan Dokter</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doctor list */}
                <Card className="lg:col-span-1">
                    <h2 className="font-semibold text-gray-800 mb-4">Pilih Dokter</h2>
                    {doctors.length > 0 ? (
                        <div className="space-y-2">
                            {doctors.map((doctor) => (
                                <button
                                    key={doctor.id}
                                    onClick={() => setSelectedDoctor(doctor)}
                                    className={`w-full p-3 rounded-xl text-left transition-colors ${selectedDoctor?.id === doctor.id
                                            ? 'bg-emerald-100'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <FiUserCheck className="text-blue-600" />
                                        </div>
                                        <p className="font-medium text-gray-800">{doctor.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={FiUserCheck}
                            title="Tidak Ada Dokter"
                            description="Belum ada dokter tersedia"
                        />
                    )}
                </Card>

                {/* Chat area */}
                <Card className="lg:col-span-2 flex flex-col h-[600px]">
                    {selectedDoctor ? (
                        <>
                            {/* Chat header */}
                            <div className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <FiUserCheck className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedDoctor.name}</p>
                                        <p className="text-xs text-emerald-600">Dokter</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <EmptyState
                                            icon={FiMessageSquare}
                                            title="Mulai Konsultasi"
                                            description="Kirim pesan untuk memulai konsultasi"
                                        />
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.senderId === user.id
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn
                                                        ? 'bg-emerald-500 text-white rounded-br-md'
                                                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                                    }`}>
                                                    <p>{msg.message}</p>
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-emerald-100' : 'text-gray-500'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="pt-4 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="input-field flex-1"
                                        placeholder="Ketik pesan..."
                                    />
                                    <button type="submit" className="btn-primary px-4">
                                        <FiSend />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState
                                icon={FiMessageSquare}
                                title="Pilih Dokter"
                                description="Pilih dokter untuk memulai konsultasi"
                            />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
