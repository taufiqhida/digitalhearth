import { useState, useEffect, useRef } from 'react'
import { FiSend, FiMessageSquare, FiUser } from 'react-icons/fi'
import api from '../../services/api'
import { initSocket, getSocket, disconnectSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { Card, LoadingSpinner, EmptyState } from '../../components/UI'

export default function DoctorChat() {
    const { user, token } = useAuth()
    const [conversations, setConversations] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        loadConversations()
        const socket = initSocket(token)

        socket.on('new_message', (message) => {
            if (selectedUser && message.senderId === selectedUser.id) {
                setMessages(prev => [...prev, message])
            }
            loadConversations()
        })

        return () => {
            disconnectSocket()
        }
    }, [token])

    useEffect(() => {
        if (selectedUser) {
            loadMessages(selectedUser.id)
        }
    }, [selectedUser])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadConversations = async () => {
        try {
            const res = await api.get('/chat/conversations')
            setConversations(res.data)
        } catch (error) {
            console.error('Failed to load conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (userId) => {
        try {
            const res = await api.get(`/chat/messages/${userId}`)
            setMessages(res.data)
        } catch (error) {
            console.error('Failed to load messages:', error)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedUser) return

        try {
            const socket = getSocket()
            if (socket) {
                socket.emit('send_message', {
                    receiverId: selectedUser.id,
                    message: newMessage,
                })
            } else {
                await api.post('/chat/messages', {
                    receiverId: selectedUser.id,
                    message: newMessage,
                })
                loadMessages(selectedUser.id)
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
            <h1 className="text-2xl font-bold text-white">Konsultasi</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversations list */}
                <Card className="lg:col-span-1">
                    <h2 className="font-semibold text-gray-800 mb-4">Percakapan</h2>
                    {conversations.length > 0 ? (
                        <div className="space-y-2">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.user.id}
                                    onClick={() => setSelectedUser(conv.user)}
                                    className={`w-full p-3 rounded-xl text-left transition-colors ${selectedUser?.id === conv.user.id
                                            ? 'bg-emerald-100'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                                            <FiUser className="text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{conv.user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {conv.lastMessage?.message || 'Belum ada pesan'}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={FiMessageSquare}
                            title="Belum Ada Percakapan"
                            description="Percakapan dengan pasien akan muncul di sini"
                        />
                    )}
                </Card>

                {/* Chat area */}
                <Card className="lg:col-span-2 flex flex-col h-[600px]">
                    {selectedUser ? (
                        <>
                            {/* Chat header */}
                            <div className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <FiUser className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedUser.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {selectedUser.role === 'PATIENT' ? 'Pasien' : 'Dokter'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                                {messages.map((msg) => {
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
                                })}
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
                                title="Pilih Percakapan"
                                description="Pilih percakapan untuk memulai chat"
                            />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
