import { io } from 'socket.io-client'

let socket = null

export function initSocket(token) {
    if (socket) return socket

    socket = io('http://localhost:5001', {
        autoConnect: false,
    })

    socket.connect()
    socket.emit('authenticate', token)

    return socket
}

export function getSocket() {
    return socket
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}
