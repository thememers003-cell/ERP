import { NextRequest, NextResponse } from 'next/server';

export interface SchoolNotice {
  id: string;
  circularNumber: string;
  title: string;
  category: 'FIELD_TRIP' | 'EXAM_SCHEDULE' | 'GENERAL_POLICY' | 'EMERGENCY' | 'SPORTS';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  issueDate: string;
  targetAudience: string;
  content: string;
  requiresConsent: boolean;
  consentDetails?: {
    destination: string;
    eventDate: string;
    departureTime: string;
    returnTime: string;
    feeAmount: number;
    safetyGuidelines: string[];
    totalEligibleParents: number;
    consentedCount: number;
    declinedCount: number;
    pendingCount: number;
    signatures: {
      parentName: string;
      studentName: string;
      phone: string;
      medicalNotes: string;
      signedAt: string;
      status: 'APPROVED' | 'DECLINED';
    }[];
  };
}

let mockNotices: SchoolNotice[] = [
  {
    id: 'not-001',
    circularNumber: 'CIR/2026-27/042',
    title: 'Grade 10 Educational Excursion: National Aerospace & Science Observatory',
    category: 'FIELD_TRIP',
    priority: 'HIGH',
    issueDate: '2026-10-22',
    targetAudience: 'Grade 10 (Sections A & B)',
    content: 'The Department of Science is organizing a day-long observational excursion to the National Aerospace Observatory. Students will interact with astrophysicists, observe planetarium star charts, and attend a hands-on rocketry workshop. Transportation by air-conditioned school transit buses.',
    requiresConsent: true,
    consentDetails: {
      destination: 'National Aerospace & Science Center, Sector 4',
      eventDate: '2026-11-08',
      departureTime: '08:00 AM',
      returnTime: '04:30 PM',
      feeAmount: 850,
      safetyGuidelines: [
        'Students must report in full school uniform with digital student ID cards.',
        'School medic and two emergency paramedic responders will accompany the transit fleet.',
        'Nutritious lunch and refreshments provided under school catering protocol.',
        'Personal mobile phones permitted solely for educational photography.'
      ],
      totalEligibleParents: 50,
      consentedCount: 41,
      declinedCount: 2,
      pendingCount: 7,
      signatures: [
        {
          parentName: 'Ramesh Verma',
          studentName: 'Aarav Verma (10-A, Roll 01)',
          phone: '+91 98765 43210',
          medicalNotes: 'Mild dust allergy, carries inhaler.',
          signedAt: '2026-10-23 10:14 AM',
          status: 'APPROVED'
        },
        {
          parentName: 'Sunita Sharma',
          studentName: 'Ananya Sharma (10-A, Roll 02)',
          phone: '+91 98221 11223',
          medicalNotes: 'None.',
          signedAt: '2026-10-23 02:45 PM',
          status: 'APPROVED'
        }
      ]
    }
  },
  {
    id: 'not-002',
    circularNumber: 'CIR/2026-27/041',
    title: 'Term-II Mid-Semester Summative Examination Schedule & Guidelines',
    category: 'EXAM_SCHEDULE',
    priority: 'HIGH',
    issueDate: '2026-10-20',
    targetAudience: 'Grades 6 to 12 & Parents',
    content: 'Summative Term II assessments commence from November 15, 2026. Hall tickets will be downloadable via the student portal 7 days prior. Zero electronic communication devices permitted inside examination halls. Revision classes will be held after lunch.',
    requiresConsent: false
  },
  {
    id: 'not-003',
    circularNumber: 'CIR/2026-27/040',
    title: 'Annual Inter-School Athletics Championship & Sports Meet Trials',
    category: 'SPORTS',
    priority: 'NORMAL',
    issueDate: '2026-10-18',
    targetAudience: 'All Grades & Student Athletes',
    content: 'Selection trials for 100m sprint, 4x100m relay, long jump, and basketball squads will occur between Oct 28 - Oct 31 at the central stadium. Interested students should register with Coach R. Singh.',
    requiresConsent: false
  },
  {
    id: 'not-004',
    circularNumber: 'CIR/2026-27/039',
    title: 'Advisory: Air Quality Monitoring Protocol & Indoor Sports Contingency',
    category: 'GENERAL_POLICY',
    priority: 'URGENT',
    issueDate: '2026-10-15',
    targetAudience: 'Entire School Community',
    content: 'In accordance with municipal health directives, outdoor sports will temporarily shift indoors to the air-purified gymnasium if the Air Quality Index exceeds 250. Clean HEPA filters have been installed across all academic blocks.',
    requiresConsent: false
  }
];

export async function GET(req: NextRequest) {
  return NextResponse.json({ notices: mockNotices });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, priority, targetAudience, content, requiresConsent, destination, eventDate, feeAmount } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const newNotice: SchoolNotice = {
      id: `not-${Date.now()}`,
      circularNumber: `CIR/2026-27/0${Math.floor(Math.random() * 90 + 10)}`,
      title,
      category: category || 'GENERAL_POLICY',
      priority: priority || 'NORMAL',
      issueDate: new Date().toISOString().split('T')[0],
      targetAudience: targetAudience || 'All Parents & Students',
      content,
      requiresConsent: !!requiresConsent,
      consentDetails: requiresConsent ? {
        destination: destination || 'Educational Excursion Venue',
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        departureTime: '08:30 AM',
        returnTime: '04:00 PM',
        feeAmount: Number(feeAmount) || 0,
        safetyGuidelines: [
          'Full school uniform and student ID badge required.',
          'Supervised by authorized faculty mentors.',
          'First aid kit and licensed emergency transport on stand-by.'
        ],
        totalEligibleParents: 50,
        consentedCount: 0,
        declinedCount: 0,
        pendingCount: 50,
        signatures: []
      } : undefined
    };

    mockNotices.unshift(newNotice);
    return NextResponse.json({ success: true, notice: newNotice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to publish notice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { noticeId, parentName, studentName, phone, medicalNotes, status } = body;

    const notice = mockNotices.find(n => n.id === noticeId);
    if (!notice || !notice.consentDetails) {
      return NextResponse.json({ error: 'Notice or consent record not found' }, { status: 404 });
    }

    const isApprove = status !== 'DECLINED';

    const newSig = {
      parentName: parentName || 'Verified Guardian',
      studentName: studentName || 'Grade 10 Student',
      phone: phone || '+91 99999 88888',
      medicalNotes: medicalNotes || 'None',
      signedAt: new Date().toLocaleString(),
      status: isApprove ? ('APPROVED' as const) : ('DECLINED' as const)
    };

    notice.consentDetails.signatures.unshift(newSig);
    if (isApprove) {
      notice.consentDetails.consentedCount += 1;
    } else {
      notice.consentDetails.declinedCount += 1;
    }
    if (notice.consentDetails.pendingCount > 0) {
      notice.consentDetails.pendingCount -= 1;
    }

    return NextResponse.json({ success: true, notice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit parent consent' }, { status: 500 });
  }
}
