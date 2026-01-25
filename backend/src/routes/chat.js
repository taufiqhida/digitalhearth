const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get chat history with a specific user
router.get('/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const otherUserId = parseInt(userId);

        const messages = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: req.user.id, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: req.user.id },
                ],
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
        });

        // Mark messages as read
        await prisma.chatMessage.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: req.user.id,
                readAt: null,
            },
            data: { readAt: new Date() },
        });

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Gagal memuat pesan' });
    }
});

// Send message
router.post('/messages', async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        if (!receiverId || !message) {
            return res.status(400).json({ error: 'Penerima dan pesan harus diisi' });
        }

        const newMessage = await prisma.chatMessage.create({
            data: {
                senderId: req.user.id,
                receiverId: parseInt(receiverId),
                message,
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
});

// Get list of conversations
router.get('/conversations', async (req, res) => {
    try {
        // Get unique users this user has chatted with
        const sentMessages = await prisma.chatMessage.findMany({
            where: { senderId: req.user.id },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });

        const receivedMessages = await prisma.chatMessage.findMany({
            where: { receiverId: req.user.id },
            select: { senderId: true },
            distinct: ['senderId'],
        });

        const userIds = new Set([
            ...sentMessages.map(m => m.receiverId),
            ...receivedMessages.map(m => m.senderId),
        ]);

        const users = await prisma.user.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: { id: true, name: true, role: true },
        });

        // Get last message and unread count for each conversation
        const conversations = await Promise.all(
            users.map(async (user) => {
                const lastMessage = await prisma.chatMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: req.user.id, receiverId: user.id },
                            { senderId: user.id, receiverId: req.user.id },
                        ],
                    },
                    orderBy: { createdAt: 'desc' },
                });

                const unreadCount = await prisma.chatMessage.count({
                    where: {
                        senderId: user.id,
                        receiverId: req.user.id,
                        readAt: null,
                    },
                });

                return {
                    user,
                    lastMessage,
                    unreadCount,
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Gagal memuat percakapan' });
    }
});

module.exports = router;
