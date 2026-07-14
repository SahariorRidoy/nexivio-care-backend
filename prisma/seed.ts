import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@nexivio.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin account already exists:', email);
    return;
  }
  const password = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.create({
    data: { email, password, name: 'Super Admin', role: 'ADMIN', isVerified: true },
  });
  console.log('Admin account created:', admin.email);
}

const services = [
  {
    slug: 'nursing-service',
    nameEn: 'Nursing Service',
    nameBn: 'নার্সিং সার্ভিস',
    category: 'nursing',
    shortDescEn: 'Trained & professional nurses providing quality home care.',
    shortDescBn: 'অভিজ্ঞ ও প্রশিক্ষিত নার্স দ্বারা রোগীর সঠিক সেবা প্রদান।',
    icon: 'Stethoscope',
    order: 1,
  },
  {
    slug: 'caregiver-service',
    nameEn: 'Caregiver Service',
    nameBn: 'কেয়ারগিভার সার্ভিস',
    category: 'caregiver',
    shortDescEn: 'Trained caregivers for daily assistance and patient care.',
    shortDescBn: 'বয়স্ক ও অসুস্থ ব্যক্তির দৈনন্দিন কাজে সহযোগিতা ও যত্ন।',
    icon: 'Heart',
    order: 2,
  },
  {
    slug: 'baby-nanny-care',
    nameEn: 'Baby / Nanny Care',
    nameBn: 'বেবি কেয়ার সার্ভিস',
    category: 'babyCare',
    shortDescEn: 'Experienced nannies and baby specialists for your child.',
    shortDescBn: 'শিশুর লালন-পালন, যত্ন ও নিরাপত্তার জন্য বিশেষ সেবা।',
    icon: 'Baby',
    order: 3,
  },
  {
    slug: 'elder-care',
    nameEn: 'Elder Care',
    nameBn: 'এল্ডার কেয়ার',
    category: 'elderCare',
    shortDescEn: 'Compassionate care and companionship for the elderly.',
    shortDescBn: 'বয়স্কদের জন্য সহানুভূতিশীল সেবা, সঙ্গ ও যত্ন।',
    icon: 'Users',
    order: 4,
  },
  {
    slug: 'other-services',
    nameEn: 'Other Services',
    nameBn: 'অন্যান্য সেবা',
    category: 'others',
    shortDescEn: 'Additional specialized healthcare services tailored for you.',
    shortDescBn: 'গৃহকর্মী, আয়া, হোম কেয়ারসহ বিভিন্ন সেবা প্রদান করা হয়।',
    icon: 'Plus',
    order: 5,
  },
];

const trainings = [
  {
    slug: 'caregiver-training',
    titleEn: 'Caregiver Training',
    titleBn: 'কেয়ারগিভার প্রশিক্ষণ',
    category: 'caregiver',
    duration: '3 Months',
    fee: 8000,
    descriptionEn: 'Professional caregiver training with certification.',
    descriptionBn: 'সনদসহ পেশাদার কেয়ারগিভার প্রশিক্ষণ।',
    order: 1,
  },
  {
    slug: 'basic-nursing-training',
    titleEn: 'Basic Nursing Training',
    titleBn: 'বেসিক নার্সিং প্রশিক্ষণ',
    category: 'basicNursing',
    duration: '6 Months',
    fee: 15000,
    descriptionEn: 'Foundational nursing skills for aspiring caregivers.',
    descriptionBn: 'নতুন কেয়ারগিভারদের জন্য মৌলিক নার্সিং দক্ষতা।',
    order: 2,
  },
];

const reviews = [
  {
    customerName: 'Fatema Khanam',
    rating: 5,
    commentEn: "Nexivio Care's nurse was incredibly professional and caring.",
    commentBn: 'নেক্সিভিও কেয়ারের নার্স অত্যন্ত পেশাদার ও যত্নশীল ছিলেন।',
    serviceUsed: 'Nursing Service',
    isApproved: true,
  },
  {
    customerName: 'Mohammad Hasan',
    rating: 5,
    commentEn: 'The caregiver they sent for my father was excellent.',
    commentBn: 'আমার বাবার জন্য পাঠানো কেয়ারগিভার অসাধারণ ছিলেন।',
    serviceUsed: 'Caregiver Service',
    isApproved: true,
  },
  {
    customerName: 'Nafisa Rahman',
    rating: 4,
    commentEn: 'Very happy with the baby care service.',
    commentBn: 'বেবি কেয়ার সেবায় খুবই খুশি।',
    serviceUsed: 'Baby Care',
    isApproved: true,
  },
];

const notices = [
  {
    titleEn: 'New Caregiver Batch Admission Open',
    titleBn: 'নতুন কেয়ারগিভার ব্যাচে ভর্তি চলছে',
    contentEn: 'Admission for the new caregiver training batch is now open.',
    contentBn: 'নতুন কেয়ারগিভার প্রশিক্ষণ ব্যাচের ভর্তি শুরু হয়েছে।',
    type: 'training',
    order: 1,
  },
];

async function seedContent() {
  for (const s of services) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: s, create: s });
  }
  for (const t of trainings) {
    await prisma.training.upsert({ where: { slug: t.slug }, update: t, create: t });
  }
  if ((await prisma.review.count()) === 0) {
    await prisma.review.createMany({ data: reviews });
  }
  if ((await prisma.notice.count()) === 0) {
    await prisma.notice.createMany({ data: notices });
  }
  console.log('Sample content seeded.');
}

async function main() {
  await seedAdmin();
  await seedContent();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
