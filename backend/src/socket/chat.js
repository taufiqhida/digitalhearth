const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function setupSocket(io) {
    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('🔌 User connected:', socket.id);

        // Authenticate socket connection
        socket.on('authenticate', async (token) => {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { id: true, name: true, role: true },
                });

                if (user) {
                    socket.userId = user.id;
                    socket.user = user;
                    onlineUsers.set(user.id, socket.id);

                    // Join personal room
                    socket.join(`user_${user.id}`);

                    console.log(`✅ User ${user.name} authenticated`);
                    socket.emit('authenticated', { user });
                }
            } catch (error) {
                console.error('Socket auth error:', error.message);
                socket.emit('auth_error', { error: 'Invalid token' });
            }
        });

        // Handle chat messages
        socket.on('send_message', async (data) => {
            try {
                const { receiverId, message } = data;

                if (!socket.userId) {
                    socket.emit('error', { error: 'Not authenticated' });
                    return;
                }

                // Save message to database
                const newMessage = await prisma.chatMessage.create({
                    data: {
                        senderId: socket.userId,
                        receiverId: parseInt(receiverId),
                        message,
                    },
                    include: {
                        sender: { select: { id: true, name: true, role: true } },
                    },
                });

                // Send to receiver if online
                const receiverSocketId = onlineUsers.get(parseInt(receiverId));
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('new_message', newMessage);
                }

                // Confirm to sender
                socket.emit('message_sent', newMessage);
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { error: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(parseInt(receiverId));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user_typing', {
                    userId: socket.userId,
                    userName: socket.user?.name,
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log(`👋 User ${socket.user?.name} disconnected`);
            }
        });
    });
}

module.exports = setupSocket;
