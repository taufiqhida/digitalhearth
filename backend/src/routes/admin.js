const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
    try {
        const [patientCount, doctorCount, examCount, pendingExamCount] = await Promise.all([
            prisma.user.count({ where: { role: 'PATIENT' } }),
            prisma.user.count({ where: { role: 'DOCTOR' } }),
            prisma.examination.count(),
            prisma.examination.count({ where: { status: 'PENDING' } }),
        ]);

        const recentExams = await prisma.examination.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                patient: { select: { id: true, name: true } },
            },
        });

        res.json({
            stats: {
                patientCount,
                doctorCount,
                examCount,
                pendingExamCount,
            },
            recentExams,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Gagal memuat dashboard' });
    }
});

// ==================== LAB PARAMETERS ====================
// Get all lab parameters
router.get('/lab-params', async (req, res) => {
    try {
        const params = await prisma.labParameter.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(params);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat parameter lab' });
    }
});

// Create lab parameter
router.post('/lab-params', async (req, res) => {
    try {
        const { code, name, unit, normalMin, normalMax, attentionMin, attentionMax, actionMin, actionMax, normalMinMale, normalMaxMale, normalMinFemale, normalMaxFemale, inputType } = req.body;

        if (!code || !name || !unit) {
            return res.status(400).json({ error: 'Kode, nama, dan satuan harus diisi' });
        }

        const existing = await prisma.labParameter.findUnique({ where: { code } });
        if (existing) {
            return res.status(400).json({ error: 'Kode parameter sudah digunakan' });
        }

        const param = await prisma.labParameter.create({
            data: {
                code,
                name,
                unit,
                normalMin: normalMin ? parseFloat(normalMin) : null,
                normalMax: normalMax ? parseFloat(normalMax) : null,
                attentionMin: attentionMin ? parseFloat(attentionMin) : null,
                attentionMax: attentionMax ? parseFloat(attentionMax) : null,
                actionMin: actionMin ? parseFloat(actionMin) : null,
                actionMax: actionMax ? parseFloat(actionMax) : null,
                normalMinMale: normalMinMale ? parseFloat(normalMinMale) : null,
                normalMaxMale: normalMaxMale ? parseFloat(normalMaxMale) : null,
                normalMinFemale: normalMinFemale ? parseFloat(normalMinFemale) : null,
                normalMaxFemale: normalMaxFemale ? parseFloat(normalMaxFemale) : null,
                inputType: inputType || 'NUMBER',
            },
        });

        res.status(201).json(param);
    } catch (error) {
        console.error('Create lab param error:', error);
        res.status(500).json({ error: 'Gagal membuat parameter lab' });
    }
});

// Update lab parameter
router.put('/lab-params/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, unit, normalMin, normalMax, attentionMin, attentionMax, actionMin, actionMax, normalMinMale, normalMaxMale, normalMinFemale, normalMaxFemale, inputType, isActive } = req.body;

        const parseOrUndefined = (val) => val !== undefined && val !== '' ? parseFloat(val) : (val === '' ? null : undefined);

        const param = await prisma.labParameter.update({
            where: { id: parseInt(id) },
            data: {
                code,
                name,
                unit,
                normalMin: parseOrUndefined(normalMin),
                normalMax: parseOrUndefined(normalMax),
                attentionMin: parseOrUndefined(attentionMin),
                attentionMax: parseOrUndefined(attentionMax),
                actionMin: parseOrUndefined(actionMin),
                actionMax: parseOrUndefined(actionMax),
                normalMinMale: parseOrUndefined(normalMinMale),
                normalMaxMale: parseOrUndefined(normalMaxMale),
                normalMinFemale: parseOrUndefined(normalMinFemale),
                normalMaxFemale: parseOrUndefined(normalMaxFemale),
                inputType,
                isActive,
            },
        });

        res.json(param);
    } catch (error) {
        console.error('Update lab param error:', error);
        res.status(500).json({ error: 'Gagal mengupdate parameter lab' });
    }
});

// Delete lab parameter
router.delete('/lab-params/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.labParameter.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Parameter lab berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal menghapus parameter lab' });
    }
});

// ==================== PATIENTS ====================
// Get all patients
router.get('/patients', async (req, res) => {
    try {
        const patients = await prisma.user.findMany({
            where: { role: 'PATIENT' },
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
                isActive: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat daftar pasien' });
    }
});

// Get single patient
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
                isActive: true,
                createdAt: true,
            },
        });

        if (!patient) {
            return res.status(404).json({ error: 'Pasien tidak ditemukan' });
        }

        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat data pasien' });
    }
});

// Create patient (auto-generate account)
router.post('/patients', async (req, res) => {
    try {
        const { name, nik, bpjs, phone, address, birthDate, gender } = req.body;

        if (!name || !nik) {
            return res.status(400).json({ error: 'Nama dan NIK harus diisi' });
        }

        // Generate email from NIK
        const email = `${nik}@patient.health`;

        // Check if NIK already exists
        const existingNik = await prisma.user.findFirst({ where: { nik } });
        if (existingNik) {
            return res.status(400).json({ error: 'NIK sudah terdaftar' });
        }

        // Generate password (last 6 digits of NIK)
        const generatedPassword = nik.slice(-6);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const patient = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'PATIENT',
                nik,
                bpjs,
                phone,
                address,
                birthDate: birthDate ? new Date(birthDate) : null,
                gender,
            },
        });

        res.status(201).json({
            message: 'Pasien berhasil didaftarkan',
            patient: {
                id: patient.id,
                name: patient.name,
                email: patient.email,
            },
            credentials: {
                email: patient.email,
                password: generatedPassword,
                note: 'Password adalah 6 digit terakhir NIK',
            },
        });
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({ error: 'Gagal mendaftarkan pasien' });
    }
});

// Update patient
router.put('/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, bpjs, phone, address, birthDate, gender, isActive } = req.body;

        const patient = await prisma.user.update({
            where: { id: parseInt(id), role: 'PATIENT' },
            data: {
                name,
                bpjs,
                phone,
                address,
                birthDate: birthDate ? new Date(birthDate) : undefined,
                gender,
                isActive,
            },
        });

        res.json(patient);
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({ error: 'Gagal mengupdate pasien' });
    }
});

// ==================== DOCTORS ====================
// Get all doctors
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await prisma.user.findMany({
            where: { role: 'DOCTOR' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat daftar dokter' });
    }
});

// Create doctor
router.post('/doctors', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nama, email, dan password harus diisi' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email sudah digunakan' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const doctor = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'DOCTOR',
                phone,
            },
        });

        res.status(201).json({
            message: 'Dokter berhasil ditambahkan',
            doctor: {
                id: doctor.id,
                name: doctor.name,
                email: doctor.email,
            },
        });
    } catch (error) {
        console.error('Create doctor error:', error);
        res.status(500).json({ error: 'Gagal menambahkan dokter' });
    }
});

// Update doctor
router.put('/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, isActive } = req.body;

        const doctor = await prisma.user.update({
            where: { id: parseInt(id), role: 'DOCTOR' },
            data: { name, phone, isActive },
        });

        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengupdate dokter' });
    }
});

// ==================== EXAMINATIONS ====================
// Get all examinations
router.get('/examinations', async (req, res) => {
    try {
        const exams = await prisma.examination.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                patient: { select: { id: true, name: true, nik: true } },
                admin: { select: { id: true, name: true } },
            },
        });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat data pemeriksaan' });
    }
});

// Get active lab params for examination form
router.get('/examinations/params', async (req, res) => {
    try {
        const params = await prisma.labParameter.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        res.json(params);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat parameter' });
    }
});

// Create examination
router.post('/examinations', async (req, res) => {
    try {
        const { patientId, results } = req.body;

        if (!patientId || !results) {
            return res.status(400).json({ error: 'Pasien dan hasil lab harus diisi' });
        }

        // Get patient to check gender
        const patient = await prisma.user.findUnique({
            where: { id: parseInt(patientId) },
            select: { gender: true },
        });

        // Get lab params for status calculation
        const labParams = await prisma.labParameter.findMany({
            where: { isActive: true },
        });

        // Calculate status for each result based on patient gender
        const processedResults = {};
        for (const [code, value] of Object.entries(results)) {
            const param = labParams.find(p => p.code === code);
            if (param && value !== '' && value !== null) {
                const numValue = parseFloat(value);
                let status = 'normal';

                // Get the appropriate min/max based on gender
                let normalMin, normalMax;
                if (patient?.gender === 'MALE' && param.normalMinMale !== null && param.normalMaxMale !== null) {
                    normalMin = param.normalMinMale;
                    normalMax = param.normalMaxMale;
                } else if (patient?.gender === 'FEMALE' && param.normalMinFemale !== null && param.normalMaxFemale !== null) {
                    normalMin = param.normalMinFemale;
                    normalMax = param.normalMaxFemale;
                } else {
                    // Fallback to default values
                    normalMin = param.normalMin;
                    normalMax = param.normalMax;
                }

                // 3-tier status calculation: normal, warning (perhatian), danger (perlu tindakan)
                if (param.actionMin !== null && numValue >= param.actionMin) {
                    // Value >= actionMin means "Perlu Tindakan"
                    status = 'danger';
                } else if (param.actionMax !== null && numValue <= param.actionMax) {
                    // Value <= actionMax means "Perlu Tindakan" (for low values)
                    status = 'danger';
                } else if (param.attentionMin !== null && param.attentionMax !== null) {
                    // Check if in attention range
                    if (numValue >= param.attentionMin && numValue <= param.attentionMax) {
                        status = 'warning';
                    } else if (normalMin !== null && normalMax !== null) {
                        if (numValue >= normalMin && numValue <= normalMax) {
                            status = 'normal';
                        } else {
                            // Outside normal but not in defined ranges
                            status = 'warning';
                        }
                    }
                } else if (normalMin !== null && normalMax !== null) {
                    // Fallback: use old deviation-based calculation if no attention/action thresholds
                    if (numValue < normalMin || numValue > normalMax) {
                        const deviation = numValue < normalMin
                            ? (normalMin - numValue) / normalMin
                            : (numValue - normalMax) / normalMax;
                        status = deviation > 0.2 ? 'danger' : 'warning';
                    }
                }

                processedResults[code] = { value: numValue, status };
            }
        }

        const exam = await prisma.examination.create({
            data: {
                patientId: parseInt(patientId),
                adminId: req.user.id,
                results: processedResults,
                status: 'PENDING',
            },
            include: {
                patient: { select: { id: true, name: true } },
            },
        });

        res.status(201).json(exam);
    } catch (error) {
        console.error('Create examination error:', error);
        res.status(500).json({ error: 'Gagal menyimpan hasil pemeriksaan' });
    }
});

// Update examination (only for PENDING status)
router.put('/examinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { results } = req.body;

        // First check if exam is already validated
        const existingExam = await prisma.examination.findUnique({
            where: { id: parseInt(id) },
            include: { patient: { select: { gender: true } } },
        });

        if (!existingExam) {
            return res.status(404).json({ error: 'Pemeriksaan tidak ditemukan' });
        }

        if (existingExam.status === 'VALID') {
            return res.status(403).json({ error: 'Pemeriksaan yang sudah divalidasi tidak dapat diedit' });
        }

        // Get lab params for status calculation
        const labParams = await prisma.labParameter.findMany({
            where: { isActive: true },
        });

        // Calculate status for each result based on patient gender
        const processedResults = {};
        for (const [code, value] of Object.entries(results)) {
            const param = labParams.find(p => p.code === code);
            if (param && value !== '' && value !== null) {
                const numValue = parseFloat(value);
                let status = 'normal';

                // Get the appropriate min/max based on gender
                let normalMin, normalMax;
                if (existingExam.patient?.gender === 'MALE' && param.normalMinMale !== null && param.normalMaxMale !== null) {
                    normalMin = param.normalMinMale;
                    normalMax = param.normalMaxMale;
                } else if (existingExam.patient?.gender === 'FEMALE' && param.normalMinFemale !== null && param.normalMaxFemale !== null) {
                    normalMin = param.normalMinFemale;
                    normalMax = param.normalMaxFemale;
                } else {
                    normalMin = param.normalMin;
                    normalMax = param.normalMax;
                }

                // 3-tier status calculation
                if (param.actionMin !== null && numValue >= param.actionMin) {
                    status = 'danger';
                } else if (param.actionMax !== null && numValue <= param.actionMax) {
                    status = 'danger';
                } else if (param.attentionMin !== null && param.attentionMax !== null) {
                    if (numValue >= param.attentionMin && numValue <= param.attentionMax) {
                        status = 'warning';
                    } else if (normalMin !== null && normalMax !== null) {
                        if (numValue >= normalMin && numValue <= normalMax) {
                            status = 'normal';
                        } else {
                            status = 'warning';
                        }
                    }
                } else if (normalMin !== null && normalMax !== null) {
                    if (numValue < normalMin || numValue > normalMax) {
                        const deviation = numValue < normalMin
                            ? (normalMin - numValue) / normalMin
                            : (numValue - normalMax) / normalMax;
                        status = deviation > 0.2 ? 'danger' : 'warning';
                    }
                }

                processedResults[code] = { value: numValue, status };
            }
        }

        const exam = await prisma.examination.update({
            where: { id: parseInt(id) },
            data: {
                results: processedResults,
            },
            include: {
                patient: { select: { id: true, name: true, nik: true } },
            },
        });

        res.json({ message: 'Hasil pemeriksaan berhasil diupdate', exam });
    } catch (error) {
        console.error('Update examination error:', error);
        res.status(500).json({ error: 'Gagal mengupdate hasil pemeriksaan' });
    }
});

// Validate examination
router.put('/examinations/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;

        const exam = await prisma.examination.update({
            where: { id: parseInt(id) },
            data: {
                status: 'VALID',
                validatedAt: new Date(),
            },
        });

        res.json({ message: 'Hasil pemeriksaan berhasil divalidasi', exam });
    } catch (error) {
        res.status(500).json({ error: 'Gagal memvalidasi hasil' });
    }
});

// ==================== PASSWORD RESET ====================
// Reset password for any user (Admin only)
router.put('/users/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password minimal 6 karakter' });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { password: hashedPassword },
        });

        res.json({
            message: `Password untuk ${user.name} berhasil direset`,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Gagal mereset password' });
    }
});

module.exports = router;
