const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require PATIENT role
router.use(authenticate, authorize('PATIENT'));

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
    try {
        // Get latest examination
        const latestExam = await prisma.examination.findFirst({
            where: { patientId: req.user.id, status: 'VALID' },
            orderBy: { createdAt: 'desc' },
        });

        // Get unread messages count
        const unreadMessages = await prisma.chatMessage.count({
            where: {
                receiverId: req.user.id,
                readAt: null,
            },
        });

        // Get lab parameters for reference
        const labParams = await prisma.labParameter.findMany({
            where: { isActive: true },
        });

        // Count abnormal results
        let warningCount = 0;
        let dangerCount = 0;
        if (latestExam && latestExam.results) {
            Object.values(latestExam.results).forEach(result => {
                if (result.status === 'warning') warningCount++;
                if (result.status === 'danger') dangerCount++;
            });
        }

        res.json({
            latestExam,
            labParams,
            stats: {
                unreadMessages,
                warningCount,
                dangerCount,
            },
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Gagal memuat dashboard' });
    }
});

// ==================== PROFILE ====================
router.get('/profile', async (req, res) => {
    const { password: _, ...profile } = req.user;
    res.json(profile);
});

// ==================== LAB RESULTS ====================
// Get all examinations (read-only)
router.get('/examinations', async (req, res) => {
    try {
        const examinations = await prisma.examination.findMany({
            where: { patientId: req.user.id, status: 'VALID' },
            orderBy: { createdAt: 'desc' },
        });

        const labParams = await prisma.labParameter.findMany({
            where: { isActive: true },
        });

        res.json({ examinations, labParams });
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat hasil lab' });
    }
});

// Get single examination
router.get('/examinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await prisma.examination.findUnique({
            where: { id: parseInt(id), patientId: req.user.id, status: 'VALID' },
        });

        if (!exam) {
            return res.status(404).json({ error: 'Data tidak ditemukan' });
        }

        const labParams = await prisma.labParameter.findMany({
            where: { isActive: true },
        });

        res.json({ exam, labParams });
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat hasil lab' });
    }
});

// ==================== MEDICAL NOTES ====================
router.get('/medical-notes', async (req, res) => {
    try {
        const notes = await prisma.medicalNote.findMany({
            where: { patientId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                doctor: { select: { id: true, name: true } },
            },
        });

        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat catatan medis' });
    }
});

// ==================== DOCTORS LIST (for chat) ====================
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await prisma.user.findMany({
            where: { role: 'DOCTOR', isActive: true },
            select: { id: true, name: true },
        });

        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat daftar dokter' });
    }
});

module.exports = router;
