const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require DOCTOR role
router.use(authenticate, authorize('DOCTOR'));

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
    try {
        const [patientCount, pendingConsultations, recentNotes] = await Promise.all([
            prisma.user.count({ where: { role: 'PATIENT', isActive: true } }),
            prisma.chatMessage.count({
                where: {
                    receiverId: req.user.id,
                    readAt: null,
                },
            }),
            prisma.medicalNote.findMany({
                where: { doctorId: req.user.id },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    patient: { select: { id: true, name: true } },
                },
            }),
        ]);

        res.json({
            stats: {
                patientCount,
                pendingConsultations,
            },
            recentNotes,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Gagal memuat dashboard' });
    }
});

// ==================== PATIENTS ====================
// Get all patients with latest exam status
router.get('/patients', async (req, res) => {
    try {
        const patients = await prisma.user.findMany({
            where: { role: 'PATIENT', isActive: true },
            select: {
                id: true,
                name: true,
                nik: true,
                bpjs: true,
                phone: true,
                birthDate: true,
                gender: true,
                examinationsAsPatient: {
                    where: { status: 'VALID' },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, results: true, createdAt: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat daftar pasien' });
    }
});

// Get patient detail with all exams
router.get('/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await prisma.user.findUnique({
            where: { id: parseInt(id), role: 'PATIENT' },
            select: {
                id: true,
                name: true,
                email: true,
                nik: true,
                bpjs: true,
                phone: true,
                address: true,
                birthDate: true,
                gender: true,
                createdAt: true,
            },
        });

        if (!patient) {
            return res.status(404).json({ error: 'Pasien tidak ditemukan' });
        }

        // Get all validated examinations
        const examinations = await prisma.examination.findMany({
            where: { patientId: parseInt(id), status: 'VALID' },
            orderBy: { createdAt: 'desc' },
        });

        // Get medical notes by this doctor
        const medicalNotes = await prisma.medicalNote.findMany({
            where: { patientId: parseInt(id), doctorId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Get prescriptions for this patient by this doctor
        const prescriptions = await prisma.prescription.findMany({
            where: { patientId: parseInt(id), doctorId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Get lab parameters for reference
        const labParams = await prisma.labParameter.findMany({
            where: { isActive: true },
        });

        res.json({
            patient,
            examinations,
            medicalNotes,
            prescriptions,
            labParams,
        });
    } catch (error) {
        console.error('Get patient detail error:', error);
        res.status(500).json({ error: 'Gagal memuat data pasien' });
    }
});

// ==================== MEDICAL NOTES ====================
// Create medical note
router.post('/medical-notes', async (req, res) => {
    try {
        const { patientId, diagnosis, education, followUp } = req.body;

        if (!patientId || !diagnosis) {
            return res.status(400).json({ error: 'Pasien dan diagnosa harus diisi' });
        }

        const note = await prisma.medicalNote.create({
            data: {
                patientId: parseInt(patientId),
                doctorId: req.user.id,
                diagnosis,
                education,
                followUp,
            },
            include: {
                patient: { select: { id: true, name: true } },
            },
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Create medical note error:', error);
        res.status(500).json({ error: 'Gagal menyimpan catatan medis' });
    }
});

// Update medical note
router.put('/medical-notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnosis, education, followUp } = req.body;

        const note = await prisma.medicalNote.update({
            where: { id: parseInt(id), doctorId: req.user.id },
            data: { diagnosis, education, followUp },
        });

        res.json(note);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengupdate catatan medis' });
    }
});

// Get all medical notes by this doctor
router.get('/medical-notes', async (req, res) => {
    try {
        const notes = await prisma.medicalNote.findMany({
            where: { doctorId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                patient: { select: { id: true, name: true } },
            },
        });

        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat catatan medis' });
    }
});

// ==================== PRESCRIPTIONS ====================
// Get all prescriptions by this doctor
router.get('/prescriptions', async (req, res) => {
    try {
        const prescriptions = await prisma.prescription.findMany({
            where: { doctorId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                patient: { select: { id: true, name: true, nik: true } },
            },
        });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat daftar resep' });
    }
});

// Get prescriptions for a specific patient
router.get('/prescriptions/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await prisma.prescription.findMany({
            where: {
                patientId: parseInt(patientId),
                doctorId: req.user.id
            },
            orderBy: { createdAt: 'desc' },
            include: {
                doctor: { select: { id: true, name: true } },
            },
        });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat resep pasien' });
    }
});

// Create prescription
router.post('/prescriptions', async (req, res) => {
    try {
        const { patientId, medication, dosage, instructions, notes } = req.body;

        if (!patientId || !medication || !dosage) {
            return res.status(400).json({ error: 'Pasien, obat, dan dosis harus diisi' });
        }

        const prescription = await prisma.prescription.create({
            data: {
                patientId: parseInt(patientId),
                doctorId: req.user.id,
                medication,
                dosage,
                instructions,
                notes,
            },
            include: {
                patient: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } },
            },
        });

        res.status(201).json(prescription);
    } catch (error) {
        console.error('Create prescription error:', error);
        res.status(500).json({ error: 'Gagal menyimpan resep' });
    }
});

// Get single prescription
router.get('/prescriptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const prescription = await prisma.prescription.findUnique({
            where: { id: parseInt(id) },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        nik: true,
                        bpjs: true,
                        birthDate: true,
                        gender: true,
                        address: true,
                        phone: true,
                    }
                },
                doctor: { select: { id: true, name: true } },
            },
        });

        if (!prescription) {
            return res.status(404).json({ error: 'Resep tidak ditemukan' });
        }

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat resep' });
    }
});

// Update prescription
router.put('/prescriptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { medication, dosage, instructions, notes } = req.body;

        const prescription = await prisma.prescription.update({
            where: { id: parseInt(id), doctorId: req.user.id },
            data: { medication, dosage, instructions, notes },
        });

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengupdate resep' });
    }
});

// Delete prescription
router.delete('/prescriptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.prescription.delete({
            where: { id: parseInt(id), doctorId: req.user.id },
        });
        res.json({ message: 'Resep berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal menghapus resep' });
    }
});

module.exports = router;
