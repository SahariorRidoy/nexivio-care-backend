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

const simpleServices = [
  {
    slug: 'physiotherapy-rehabilitation',
    nameEn: 'Physiotherapy & Rehabilitation Services',
    nameBn: 'ফিজিওথেরাপি ও পুনর্বাসন সেবা',
    category: 'physiotherapy',
    shortDescEn: 'Professional physiotherapy and rehabilitation care at home by certified therapists.',
    shortDescBn: 'সার্টিফাইড থেরাপিস্টদের দ্বারা বাড়িতে পেশাদার ফিজিওথেরাপি ও পুনর্বাসন সেবা।',
    descriptionEn: 'Nexivio Care provides professional physiotherapy and rehabilitation services in the comfort of your home. Our certified physiotherapists design personalized treatment plans to help patients recover from injuries, surgeries, strokes, and chronic conditions.',
    descriptionBn: 'নেক্সিভিও কেয়ার আপনার বাড়িতে পেশাদার ফিজিওথেরাপি ও পুনর্বাসন সেবা প্রদান করে। আমাদের সার্টিফাইড ফিজিওথেরাপিস্টরা আঘাত, অস্ত্রোপচার, স্ট্রোক এবং দীর্ঘস্থায়ী রোগ থেকে সুস্থ হতে ব্যক্তিগতকৃত চিকিৎসা পরিকল্পনা তৈরি করেন।',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop',
    featuresEn: ['Post-surgical rehabilitation', 'Stroke & neurological rehabilitation', 'Orthopedic physiotherapy', 'Sports injury recovery', 'Geriatric physiotherapy', 'Respiratory physiotherapy', 'Pain management therapy'],
    featuresBn: ['অস্ত্রোপচার পরবর্তী পুনর্বাসন', 'স্ট্রোক ও নিউরোলজিক্যাল পুনর্বাসন', 'অর্থোপেডিক ফিজিওথেরাপি', 'স্পোর্টস ইনজুরি রিকভারি', 'জেরিয়াট্রিক ফিজিওথেরাপি', 'রেসপিরেটরি ফিজিওথেরাপি', 'ব্যথা ব্যবস্থাপনা থেরাপি'],
    order: 6,
  },
  {
    slug: 'on-demand-nursing',
    nameEn: 'On-Demand Nursing',
    nameBn: 'অন-ডিমান্ড নার্সিং',
    category: 'onDemandNursing',
    shortDescEn: 'Flexible, on-demand nursing services available whenever you need them.',
    shortDescBn: 'যখন প্রয়োজন তখনই পাওয়া যায় এমন নমনীয় অন-ডিমান্ড নার্সিং সেবা।',
    descriptionEn: 'Nexivio Care On-Demand Nursing gives you access to a qualified nurse exactly when you need one — no long-term commitment required. We dispatch trained nurses to your home within hours.',
    descriptionBn: 'নেক্সিভিও কেয়ারের অন-ডিমান্ড নার্সিং সেবা আপনাকে ঠিক যখন প্রয়োজন তখনই একজন যোগ্য নার্সের সুবিধা দেয় — কোনো দীর্ঘমেয়াদী চুক্তির প্রয়োজন নেই।',
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&auto=format&fit=crop',
    featuresEn: ['Wound dressing & injection', 'IV drip & catheter care', 'Post-operative nursing', 'Vital signs monitoring', 'Medication management', 'Emergency home nursing', 'Night duty on request'],
    featuresBn: ['ক্ষত ড্রেসিং ও ইনজেকশন', 'আইভি ড্রিপ ও ক্যাথেটার যত্ন', 'অস্ত্রোপচার পরবর্তী নার্সিং', 'ভাইটাল সাইন মনিটরিং', 'ওষুধ ব্যবস্থাপনা', 'জরুরি হোম নার্সিং', 'অনুরোধে নাইট ডিউটি'],
    order: 7,
  },
  {
    slug: 'home-diagnostics',
    nameEn: 'Home Diagnostics',
    nameBn: 'হোম ডায়াগনস্টিক্স',
    category: 'homeDiagnostics',
    shortDescEn: 'Lab tests and diagnostic services conducted at the comfort of your home.',
    shortDescBn: 'আপনার বাড়িতে বসেই ল্যাব টেস্ট ও ডায়াগনস্টিক সেবা গ্রহণ করুন।',
    descriptionEn: 'Nexivio Care brings certified diagnostic and laboratory services directly to your doorstep. Our trained phlebotomists collect samples at your home and deliver accurate results promptly.',
    descriptionBn: 'নেক্সিভিও কেয়ার সার্টিফাইড ডায়াগনস্টিক ও ল্যাবরেটরি সেবা সরাসরি আপনার দরজায় নিয়ে আসে। আমাদের প্রশিক্ষিত ফ্লেবোটমিস্টরা বাড়িতে নমুনা সংগ্রহ করেন।',
    image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&auto=format&fit=crop',
    featuresEn: ['Complete Blood Count (CBC)', 'Blood glucose & HbA1c', 'Lipid & liver function tests', 'Thyroid function tests', 'Urine routine & culture', 'ECG at home', 'COVID-19 & rapid tests'],
    featuresBn: ['কমপ্লিট ব্লাড কাউন্ট (CBC)', 'ব্লাড গ্লুকোজ ও HbA1c', 'লিপিড ও লিভার ফাংশন টেস্ট', 'থাইরয়েড ফাংশন টেস্ট', 'ইউরিন রুটিন ও কালচার', 'বাড়িতে ECG', 'COVID-19 ও র্যাপিড টেস্ট'],
    order: 8,
  },
];

const simpleOtherServices = [
  {
    slug: 'doctor-consultation',
    nameEn: 'Doctor Consultation',
    nameBn: 'ডাক্তার পরামর্শ',
    shortDescEn: 'Online and in-person doctor consultation services at your convenience.',
    shortDescBn: 'আপনার সুবিধামতো অনলাইন ও সরাসরি ডাক্তার পরামর্শ সেবা।',
    descriptionEn: 'Nexivio Care connects you with qualified doctors for both online and in-person consultations. All doctors are registered and verified. Appointments can be booked same-day.',
    descriptionBn: 'নেক্সিভিও কেয়ার আপনাকে অনলাইন ও সরাসরি উভয় পরামর্শের জন্য যোগ্য ডাক্তারদের সাথে সংযুক্ত করে। সকল ডাক্তার নিবন্ধিত ও যাচাইকৃত।',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&auto=format&fit=crop',
    icon: 'Stethoscope',
    featuresEn: ['General physician consultations', 'Specialist referrals', 'Online video consultations', 'In-person clinic visits', 'Follow-up & prescription renewals', 'Chronic disease management', 'Pediatric & geriatric consultations'],
    featuresBn: ['সাধারণ চিকিৎসক পরামর্শ', 'বিশেষজ্ঞ রেফারেল', 'অনলাইন ভিডিও পরামর্শ', 'সরাসরি ক্লিনিক ভিজিট', 'ফলো-আপ ও প্রেসক্রিপশন নবায়ন', 'দীর্ঘস্থায়ী রোগ ব্যবস্থাপনা', 'শিশু ও বয়স্কদের পরামর্শ'],
    order: 1,
  },
  {
    slug: 'doctor-home-visit',
    nameEn: 'Doctor Home Visit',
    nameBn: 'ডাক্তার হোম ভিজিট',
    shortDescEn: 'Qualified doctors visiting your home for check-ups and treatment.',
    shortDescBn: 'যোগ্য ডাক্তার পরীক্ষা ও চিকিৎসার জন্য আপনার বাড়িতে আসবেন।',
    descriptionEn: 'Nexivio Care brings qualified doctors directly to your home. Ideal for elderly, bedridden, or patients who prefer home care. Visits can be scheduled in advance or on short notice.',
    descriptionBn: 'নেক্সিভিও কেয়ার যোগ্য ডাক্তারদের সরাসরি আপনার বাড়িতে নিয়ে আসে। বয়স্ক, শয্যাশায়ী বা বাড়িতে সেবা নিতে পছন্দ করেন এমন রোগীদের জন্য আদর্শ।',
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop',
    icon: 'Home',
    featuresEn: ['Physical examination & diagnosis', 'Prescription & medication guidance', 'Chronic disease monitoring', 'Post-hospitalization follow-up', 'Pediatric home visits', 'Geriatric care', 'Emergency home visits'],
    featuresBn: ['শারীরিক পরীক্ষা ও রোগ নির্ণয়', 'প্রেসক্রিপশন ও ওষুধ নির্দেশনা', 'দীর্ঘস্থায়ী রোগ পর্যবেক্ষণ', 'হাসপাতাল পরবর্তী ফলো-আপ', 'শিশুদের হোম ভিজিট', 'বয়স্কদের জেরিয়াট্রিক সেবা', 'জরুরি হোম ভিজিট'],
    order: 2,
  },
  {
    slug: 'hospital-visit-assistance',
    nameEn: 'Hospital Visit Assistance',
    nameBn: 'হাসপাতাল ভিজিট সহায়তা',
    shortDescEn: 'Professional assistance and escort for hospital appointments.',
    shortDescBn: 'হাসপাতালের অ্যাপয়েন্টমেন্টে পেশাদার সহায়তা ও সঙ্গ।',
    descriptionEn: 'Nexivio Care ensures patients — especially the elderly — can attend hospital appointments safely. Our trained attendants accompany patients from home to hospital and back.',
    descriptionBn: 'নেক্সিভিও কেয়ার নিশ্চিত করে যে রোগীরা — বিশেষত বয়স্করা — নিরাপদে হাসপাতালের অ্যাপয়েন্টমেন্টে যেতে পারেন।',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop',
    icon: 'Building2',
    featuresEn: ['Escort home to hospital & back', 'Appointment booking & queue management', 'Hospital registration assistance', 'Accompanying during consultations', 'Post-visit report collection', 'Admission & discharge assistance', 'Interpreter services'],
    featuresBn: ['বাড়ি থেকে হাসপাতাল ও ফিরে সঙ্গ', 'অ্যাপয়েন্টমেন্ট বুকিং ও কিউ ব্যবস্থাপনা', 'হাসপাতাল নিবন্ধন সহায়তা', 'পরামর্শের সময় সঙ্গ', 'ভিজিট পরবর্তী রিপোর্ট সংগ্রহ', 'ভর্তি ও ছাড়পত্র সহায়তা', 'দোভাষী সেবা'],
    order: 4,
  },
  {
    slug: 'ambulance-service',
    nameEn: 'Ambulance Service',
    nameBn: 'অ্যাম্বুলেন্স সেবা',
    shortDescEn: '24/7 ambulance service for emergencies and non-emergency medical transport.',
    shortDescBn: 'জরুরি ও অ-জরুরি চিকিৎসা পরিবহনের জন্য ২৪/৭ অ্যাম্বুলেন্স সেবা।',
    descriptionEn: 'Nexivio Care operates a reliable ambulance service 24/7. Whether emergency or planned hospital transfer, our well-equipped ambulances ensure safe and timely transport.',
    descriptionBn: 'নেক্সিভিও কেয়ার সপ্তাহের ৭ দিন ২৪ ঘণ্টা নির্ভরযোগ্য অ্যাম্বুলেন্স সেবা পরিচালনা করে।',
    image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=600&auto=format&fit=crop',
    icon: 'Ambulance',
    featuresEn: ['Emergency dispatch 24/7', 'Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'Non-emergency transport', 'Inter-hospital transfers', 'Airport & long-distance transport', 'Trained paramedics on board'],
    featuresBn: ['জরুরি ডিসপ্যাচ ২৪/৭', 'বেসিক লাইফ সাপোর্ট (BLS)', 'অ্যাডভান্সড লাইফ সাপোর্ট (ALS)', 'অ-জরুরি রোগী পরিবহন', 'আন্তঃহাসপাতাল স্থানান্তর', 'বিমানবন্দর ও দূরপাল্লার পরিবহন', 'প্রশিক্ষিত প্যারামেডিক সহ'],
    order: 5,
  },
  {
    slug: 'other-support-services',
    nameEn: 'Other Support Services',
    nameBn: 'অন্যান্য সহায়তা সেবা',
    shortDescEn: 'Additional support services tailored to your unique healthcare needs.',
    shortDescBn: 'আপনার অনন্য স্বাস্থ্যসেবার প্রয়োজন অনুযায়ী অতিরিক্ত সহায়তা সেবা।',
    descriptionEn: 'Nexivio Care provides flexible, personalized assistance for a wide range of healthcare situations that do not fit standard categories.',
    descriptionBn: 'নেক্সিভিও কেয়ার বিভিন্ন স্বাস্থ্যসেবার পরিস্থিতির জন্য নমনীয়, ব্যক্তিগতকৃত সহায়তা প্রদান করে।',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop',
    icon: 'LifeBuoy',
    featuresEn: ['Caregiver & attendant placement', 'Medicine procurement & delivery', 'Health record management', 'Appointment scheduling', 'Post-discharge care coordination', 'Mental health referrals', 'Elderly companionship services'],
    featuresBn: ['কেয়ারগিভার ও অ্যাটেন্ডেন্ট নিয়োগ', 'ওষুধ সংগ্রহ ও ডেলিভারি', 'স্বাস্থ্য রেকর্ড ব্যবস্থাপনা', 'অ্যাপয়েন্টমেন্ট নির্ধারণ', 'হাসপাতাল পরবর্তী সেবা সমন্বয়', 'মানসিক স্বাস্থ্য রেফারেল', 'বয়স্কদের সঙ্গ সেবা'],
    order: 7,
  },
];

async function seedContent() {
  for (const s of simpleServices) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: s, create: s });
  }
  for (const s of simpleOtherServices) {
    await prisma.otherService.upsert({ where: { slug: s.slug }, update: s, create: s });
  }
  console.log('Content seeded.');
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
