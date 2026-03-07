const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper: random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: random float between min and max with decimals
function randFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Helper: random date in October 2025
function randomOctoberDate() {
  const day = randInt(1, 31);
  const hour = randInt(7, 17);
  const minute = randInt(0, 59);
  return new Date(2025, 9, day, hour, minute); // month is 0-indexed, so 9 = October
}

// Helper: pick random item from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Indonesian names for realistic dummy data
const firstNamesMale = [
  'Andi', 'Budi', 'Cahyo', 'Dimas', 'Eko', 'Fajar', 'Gilang', 'Hadi',
  'Irfan', 'Joko', 'Kurnia', 'Lukman', 'Mulyadi', 'Naufal', 'Oscar',
  'Putra', 'Qodir', 'Rizky', 'Surya', 'Teguh', 'Umar', 'Vino', 'Wahyu',
  'Yusuf', 'Zaki', 'Arif', 'Bayu', 'Deni', 'Farel', 'Galih'
];

const firstNamesFemale = [
  'Ani', 'Bunga', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hana',
  'Indah', 'Jasmine', 'Kartika', 'Lestari', 'Mega', 'Nadia', 'Oktavia',
  'Putri', 'Qory', 'Rina', 'Sari', 'Tiara', 'Utami', 'Vina', 'Wulan',
  'Yuni', 'Zahra', 'Aulia', 'Bella', 'Dian', 'Farah', 'Gadis'
];

const lastNames = [
  'Santoso', 'Wijaya', 'Pratama', 'Saputra', 'Hidayat', 'Kusuma', 'Nugraha',
  'Permana', 'Ramadhan', 'Susanto', 'Utomo', 'Wibowo', 'Setiawan', 'Purnama',
  'Hakim', 'Firmansyah', 'Gunawan', 'Hartono', 'Ibrahim', 'Kurniawan',
  'Maulana', 'Nurdiyanto', 'Prasetyo', 'Rahmadi', 'Suryadi', 'Tambunan',
  'Wahyudi', 'Yulianto', 'Aditya', 'Budiman'
];

const streets = [
  'Jl. Merdeka', 'Jl. Sudirman', 'Jl. Ahmad Yani', 'Jl. Gatot Subroto',
  'Jl. Diponegoro', 'Jl. Kartini', 'Jl. Pahlawan', 'Jl. Cendrawasih',
  'Jl. Mawar', 'Jl. Kenanga', 'Jl. Melati', 'Jl. Anggrek',
  'Jl. Raya Bogor', 'Jl. Veteran', 'Jl. Pemuda'
];

const cities = [
  'Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta',
  'Medan', 'Makassar', 'Palembang', 'Tangerang', 'Bekasi',
  'Depok', 'Bogor', 'Malang', 'Solo', 'Denpasar'
];

// Generate lab result status based on value and thresholds
function getLabStatus(code, value) {
  const thresholds = {
    GDP: { normalMax: 130, attentionMax: 150, actionMin: 200 },
    GDS: { normalMax: 140, attentionMax: 199, actionMin: 200 },
    KOLESTEROL: { normalMax: 199, attentionMax: 239, actionMin: 240 },
    TRIGLISERIDA: { normalMax: 149, attentionMax: 199, actionMin: 200 },
    ASAM_URAT: { normalMax: 7.0, actionMin: 8.0 },
    HDL: { normalMin: 40 },
    LDL: { normalMax: 99, attentionMax: 159, actionMin: 160 },
    HBA1C: { normalMax: 5.6, attentionMax: 6.4, actionMin: 6.5 },
  };

  const t = thresholds[code];
  if (!t) return 'normal';

  if (code === 'HDL') {
    return value >= 40 ? 'normal' : value >= 30 ? 'warning' : 'danger';
  }

  if (value <= (t.normalMax || 999)) return 'normal';
  if (t.attentionMax && value <= t.attentionMax) return 'warning';
  if (t.actionMin && value >= t.actionMin) return 'danger';
  return 'warning';
}

// Generate random lab results
function generateLabResults(gender) {
  const gdp = randInt(65, 250);
  const gds = randInt(70, 280);
  const kolesterol = randInt(120, 300);
  const trigliserida = randInt(80, 280);
  const asamUrat = randFloat(2.0, 10.0, 1);
  const hdl = randInt(20, 75);
  const ldl = randInt(50, 200);
  const hba1c = randFloat(4.0, 9.0, 1);

  return {
    GDP: { value: gdp, status: getLabStatus('GDP', gdp) },
    GDS: { value: gds, status: getLabStatus('GDS', gds) },
    KOLESTEROL: { value: kolesterol, status: getLabStatus('KOLESTEROL', kolesterol) },
    TRIGLISERIDA: { value: trigliserida, status: getLabStatus('TRIGLISERIDA', trigliserida) },
    HDL: { value: hdl, status: getLabStatus('HDL', hdl) },
    LDL: { value: ldl, status: getLabStatus('LDL', ldl) },
    HBA1C: { value: hba1c, status: getLabStatus('HBA1C', hba1c) },
    ASAM_URAT: { value: asamUrat, status: getLabStatus('ASAM_URAT', asamUrat) },
  };
}

// Diagnosis templates based on lab results
function generateDiagnosis(results) {
  const issues = [];
  if (results.GDP.status !== 'normal' || results.GDS.status !== 'normal') {
    issues.push('Hiperglikemia / Diabetes Mellitus Tipe 2');
  }
  if (results.KOLESTEROL.status !== 'normal') {
    issues.push('Hiperkolesterolemia');
  }
  if (results.TRIGLISERIDA.status !== 'normal') {
    issues.push('Hipertrigliseridemia');
  }
  if (results.ASAM_URAT.status !== 'normal') {
    issues.push('Hiperurisemia');
  }
  if (results.HBA1C.status !== 'normal') {
    issues.push('Kontrol gula darah tidak optimal');
  }
  if (issues.length === 0) {
    issues.push('Hasil pemeriksaan dalam batas normal');
  }
  return issues.join('. ') + '.';
}

const medications = [
  { medication: 'Metformin 500mg', dosage: '2x1 sehari', instructions: 'Diminum setelah makan pagi dan malam' },
  { medication: 'Simvastatin 20mg', dosage: '1x1 sehari', instructions: 'Diminum malam hari sebelum tidur' },
  { medication: 'Allopurinol 100mg', dosage: '1x1 sehari', instructions: 'Diminum setelah makan' },
  { medication: 'Gemfibrozil 300mg', dosage: '2x1 sehari', instructions: 'Diminum 30 menit sebelum makan' },
  { medication: 'Glimepiride 2mg', dosage: '1x1 sehari', instructions: 'Diminum sebelum makan pagi' },
  { medication: 'Amlodipine 5mg', dosage: '1x1 sehari', instructions: 'Diminum pagi hari' },
  { medication: 'Atorvastatin 20mg', dosage: '1x1 sehari', instructions: 'Diminum malam hari' },
  { medication: 'Losartan 50mg', dosage: '1x1 sehari', instructions: 'Diminum pagi setelah makan' },
];

async function main() {
  console.log('🌱 Seeding 50 dummy patients with October 2025 data...\n');

  // Ensure admin and doctor exist first
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@health.com' },
    update: {},
    create: {
      email: 'admin@health.com',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin ready:', admin.email);

  const doctorPassword = await bcrypt.hash('dokter123', 10);
  const doctor = await prisma.user.upsert({
    where: { email: 'dokter@health.com' },
    update: {},
    create: {
      email: 'dokter@health.com',
      password: doctorPassword,
      name: 'Dr. Ahmad Sehat',
      role: 'DOCTOR',
      phone: '081234567890',
      isActive: true,
    },
  });
  console.log('✅ Doctor ready:', doctor.email);

  // Also ensure second doctor
  const doctor2Password = await bcrypt.hash('dokter123', 10);
  const doctor2 = await prisma.user.upsert({
    where: { email: 'dokter2@health.com' },
    update: {},
    create: {
      email: 'dokter2@health.com',
      password: doctor2Password,
      name: 'Dr. Siti Nurhaliza',
      role: 'DOCTOR',
      phone: '081234567891',
      isActive: true,
    },
  });
  console.log('✅ Doctor 2 ready:', doctor2.email);

  const doctors = [doctor, doctor2];

  // Ensure lab parameters exist
  const labParams = [
    { code: 'GDP', name: 'Gula Darah Puasa', unit: 'mg/dL', normalMin: 70, normalMax: 130, attentionMin: 131, attentionMax: 150, actionMin: 200, actionMax: null, inputType: 'NUMBER' },
    { code: 'GDS', name: 'Gula Darah Sewaktu', unit: 'mg/dL', normalMin: 70, normalMax: 140, attentionMin: 141, attentionMax: 199, actionMin: 200, actionMax: null, inputType: 'NUMBER' },
    { code: 'KOLESTEROL', name: 'Kolesterol Total', unit: 'mg/dL', normalMin: 0, normalMax: 199, attentionMin: 200, attentionMax: 239, actionMin: 240, actionMax: null, inputType: 'NUMBER' },
    { code: 'TRIGLISERIDA', name: 'Trigliserida', unit: 'mg/dL', normalMin: 0, normalMax: 149, attentionMin: 150, attentionMax: 199, actionMin: 200, actionMax: null, inputType: 'NUMBER' },
    { code: 'ASAM_URAT', name: 'Asam Urat', unit: 'mg/dL', normalMin: 2.6, normalMax: 7.0, normalMinMale: 3.0, normalMaxMale: 7.0, normalMinFemale: 2.6, normalMaxFemale: 6.0, attentionMin: null, attentionMax: null, actionMin: 8.0, actionMax: null, inputType: 'NUMBER' },
    { code: 'HDL', name: 'HDL Kolesterol', unit: 'mg/dL', normalMin: 40, normalMax: 60, attentionMin: 30, attentionMax: 39, actionMin: null, actionMax: 29, inputType: 'NUMBER' },
    { code: 'LDL', name: 'LDL Kolesterol', unit: 'mg/dL', normalMin: 0, normalMax: 99, attentionMin: 130, attentionMax: 159, actionMin: 160, actionMax: null, inputType: 'NUMBER' },
    { code: 'HBA1C', name: 'HbA1c', unit: '%', normalMin: 0, normalMax: 5.6, attentionMin: 5.7, attentionMax: 6.4, actionMin: 6.5, actionMax: null, inputType: 'NUMBER' },
  ];

  for (const param of labParams) {
    await prisma.labParameter.upsert({
      where: { code: param.code },
      update: {},
      create: param,
    });
  }
  console.log('✅ Lab Parameters ready:', labParams.length, 'parameters\n');

  // Generate 50 dummy patients
  const patientPassword = await bcrypt.hash('pasien123', 10);
  const createdPatients = [];

  for (let i = 1; i <= 50; i++) {
    const gender = pick(['MALE', 'FEMALE']);
    const firstName = gender === 'MALE' ? pick(firstNamesMale) : pick(firstNamesFemale);
    const lastName = pick(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `pasien${i}@health.com`;
    const nik = `32${String(randInt(10, 99))}${String(randInt(1000000000, 9999999999))}`;
    const bpjs = `000${String(randInt(1000000000, 9999999999))}`;
    const phone = `08${randInt(10, 99)}${randInt(10000000, 99999999)}`;
    const address = `${pick(streets)} No. ${randInt(1, 200)}, ${pick(cities)}`;
    const birthYear = randInt(1960, 2000);
    const birthMonth = randInt(1, 12);
    const birthDay = randInt(1, 28);

    const patient = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: patientPassword,
        name: fullName,
        role: 'PATIENT',
        nik,
        bpjs,
        phone,
        address,
        birthDate: new Date(birthYear, birthMonth - 1, birthDay),
        gender,
        isActive: true,
      },
    });

    createdPatients.push(patient);
    process.stdout.write(`\r👤 Patients created: ${i}/50`);
  }
  console.log('\n✅ All 50 patients created!\n');

  // Create examinations for each patient (dated October 2025)
  let examCount = 0;
  for (const patient of createdPatients) {
    const examDate = randomOctoberDate();
    const labResults = generateLabResults(patient.gender);

    // Randomly set status: 80% VALID, 20% PENDING
    const isValid = Math.random() < 0.8;

    const examination = await prisma.examination.create({
      data: {
        patientId: patient.id,
        adminId: admin.id,
        results: labResults,
        status: isValid ? 'VALID' : 'PENDING',
        validatedAt: isValid ? examDate : null,
        createdAt: examDate,
      },
    });

    // For validated examinations, create medical notes and prescriptions
    if (isValid) {
      const selectedDoctor = pick(doctors);
      const noteDate = new Date(examDate.getTime() + randInt(1, 48) * 60 * 60 * 1000); // 1-48 hours after exam

      const diagnosis = generateDiagnosis(labResults);
      const hasIssues = diagnosis !== 'Hasil pemeriksaan dalam batas normal.';

      await prisma.medicalNote.create({
        data: {
          patientId: patient.id,
          doctorId: selectedDoctor.id,
          diagnosis,
          education: hasIssues
            ? 'Disarankan untuk menjaga pola makan sehat, olahraga teratur minimal 30 menit per hari, dan mengurangi konsumsi makanan berlemak serta bergula tinggi.'
            : 'Pertahankan gaya hidup sehat. Lanjutkan pola makan seimbang dan olahraga rutin.',
          followUp: hasIssues
            ? `Kontrol ulang ${randInt(2, 4)} minggu lagi. Bawa hasil lab terbaru saat kontrol.`
            : 'Kontrol rutin 3 bulan lagi.',
          createdAt: noteDate,
        },
      });

      // Create prescription if there are issues
      if (hasIssues) {
        const med = pick(medications);
        await prisma.prescription.create({
          data: {
            patientId: patient.id,
            doctorId: selectedDoctor.id,
            medication: med.medication,
            dosage: med.dosage,
            instructions: med.instructions,
            notes: `Minum obat secara teratur. Jangan menghentikan obat tanpa konsultasi dokter.`,
            createdAt: noteDate,
          },
        });
      }
    }

    examCount++;
    process.stdout.write(`\r🔬 Examinations processed: ${examCount}/50`);
  }

  console.log('\n✅ All 50 examinations created (with medical notes & prescriptions)!\n');
  console.log('🎉 Seeding 50 dummy data complete!');
  console.log('📅 All examination dates are in October 2025');
  console.log('🔑 Default password for all patients: pasien123');
  console.log('🔑 Admin login: admin@health.com / admin123');
  console.log('🔑 Doctor login: dokter@health.com / dokter123');
  console.log('🔑 Doctor 2 login: dokter2@health.com / dokter123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
