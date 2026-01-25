const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin
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
  console.log('✅ Admin created:', admin.email);

  // Create Doctor
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
  console.log('✅ Doctor created:', doctor.email);

  // Create Sample Patient
  const patientPassword = await bcrypt.hash('pasien123', 10);
  const patient = await prisma.user.upsert({
    where: { email: 'budi@health.com' },
    update: {},
    create: {
      email: 'budi@health.com',
      password: patientPassword,
      name: 'Budi Santoso',
      role: 'PATIENT',
      nik: '3201234567890001',
      bpjs: '0001234567890',
      phone: '082345678901',
      address: 'Jl. Merdeka No. 123, Jakarta',
      birthDate: new Date('1990-05-15'),
      gender: 'MALE',
      isActive: true,
    },
  });
  console.log('✅ Patient created:', patient.email);

  // Create Lab Parameters with 3-tier thresholds
  const labParams = [
    // 1. GDP - Gula Darah Puasa
    {
      code: 'GDP',
      name: 'Gula Darah Puasa',
      unit: 'mg/dL',
      normalMin: 70,
      normalMax: 130,
      attentionMin: 131,
      attentionMax: 150,
      actionMin: 200,
      actionMax: null,
      inputType: 'NUMBER'
    },
    // 2. GDS - Gula Darah Sewaktu
    {
      code: 'GDS',
      name: 'Gula Darah Sewaktu',
      unit: 'mg/dL',
      normalMin: 70,
      normalMax: 140,
      attentionMin: 141,
      attentionMax: 199,
      actionMin: 200,
      actionMax: null,
      inputType: 'NUMBER'
    },
    // 3. Kolesterol Total
    {
      code: 'KOLESTEROL',
      name: 'Kolesterol Total',
      unit: 'mg/dL',
      normalMin: 0,
      normalMax: 199,
      attentionMin: 200,
      attentionMax: 239,
      actionMin: 240,
      actionMax: null,
      inputType: 'NUMBER'
    },
    // 4. Trigliserida
    {
      code: 'TRIGLISERIDA',
      name: 'Trigliserida',
      unit: 'mg/dL',
      normalMin: 0,
      normalMax: 149,
      attentionMin: 150,
      attentionMax: 199,
      actionMin: 200,
      actionMax: null,
      inputType: 'NUMBER'
    },
    // 5. Asam Urat (with gender-specific ranges)
    {
      code: 'ASAM_URAT',
      name: 'Asam Urat',
      unit: 'mg/dL',
      normalMin: 2.6,
      normalMax: 7.0,
      normalMinMale: 3.0,
      normalMaxMale: 7.0,
      normalMinFemale: 2.6,
      normalMaxFemale: 6.0,
      attentionMin: null,
      attentionMax: null,
      actionMin: 8.0, // Male threshold
      actionMax: null,
      inputType: 'NUMBER'
    },
    // 6. HDL (low is bad)
    {
      code: 'HDL',
      name: 'HDL Kolesterol',
      unit: 'mg/dL',
      normalMin: 40,
      normalMax: 60,
      attentionMin: 30,
      attentionMax: 39,
      actionMin: null,
      actionMax: 29,  // < 30 is dangerous
      inputType: 'NUMBER'
    },
    // 7. LDL
    {
      code: 'LDL',
      name: 'LDL Kolesterol',
      unit: 'mg/dL',
      normalMin: 0,
      normalMax: 99,
      attentionMin: 130,
      attentionMax: 159,
      actionMin: 160,
      actionMax: null,
      inputType: 'NUMBER'
    },
    // 8. HbA1c
    {
      code: 'HBA1C',
      name: 'HbA1c',
      unit: '%',
      normalMin: 0,
      normalMax: 5.6,
      attentionMin: 5.7,
      attentionMax: 6.4,
      actionMin: 6.5,
      actionMax: null,
      inputType: 'NUMBER'
    },
  ];

  for (const param of labParams) {
    await prisma.labParameter.upsert({
      where: { code: param.code },
      update: {},
      create: param,
    });
  }
  console.log('✅ Lab Parameters created:', labParams.length);

  // Create sample examination
  const examination = await prisma.examination.create({
    data: {
      patientId: patient.id,
      adminId: admin.id,
      results: {
        GDP: { value: 95, status: 'normal' },
        GDS: { value: 130, status: 'normal' },
        KOLESTEROL: { value: 210, status: 'warning' },
        TRIGLISERIDA: { value: 160, status: 'warning' },
        HDL: { value: 45, status: 'normal' },
        LDL: { value: 85, status: 'normal' },
        HBA1C: { value: 5.2, status: 'normal' },
        ASAM_URAT: { value: 5.5, status: 'normal' },
      },
      status: 'VALID',
      validatedAt: new Date(),
    },
  });
  console.log('✅ Sample examination created');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
