import { NextRequest, NextResponse } from 'next/server';

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  periodNumber: number;
  timeRange: string;
  className: string;
  subject: string;
  teacherName: string;
  teacherId: string;
  room: string;
  isSubstituted?: boolean;
  originalTeacherName?: string;
  substitutionReason?: string;
}

// In-memory persistent master schedule for the demo
let masterSchedule: TimetableSlot[] = [
  // Monday - Grade 10-A
  { id: 'm-10a-1', day: 'Monday', periodNumber: 1, timeRange: '08:30 - 09:15', className: '10-A', subject: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'm-10a-2', day: 'Monday', periodNumber: 2, timeRange: '09:15 - 10:00', className: '10-A', subject: 'Physics', teacherName: 'Dr. Vikram Seth', teacherId: 't-2', room: 'Physics Lab 1' },
  { id: 'm-10a-3', day: 'Monday', periodNumber: 3, timeRange: '10:15 - 11:00', className: '10-A', subject: 'English Lit', teacherName: 'Ms. Anita Patel', teacherId: 't-3', room: 'Room 301' },
  { id: 'm-10a-4', day: 'Monday', periodNumber: 4, timeRange: '11:00 - 11:45', className: '10-A', subject: 'Biology', teacherName: 'Ms. Sunita Rao', teacherId: 't-4', room: 'Bio Lab' },
  { id: 'm-10a-5', day: 'Monday', periodNumber: 5, timeRange: '12:30 - 01:15', className: '10-A', subject: 'Computer Science', teacherName: 'Mr. Amit Verma', teacherId: 't-5', room: 'Computer Lab 2' },
  { id: 'm-10a-6', day: 'Monday', periodNumber: 6, timeRange: '01:15 - 02:00', className: '10-A', subject: 'Chemistry', teacherName: 'Dr. Neha Gupta', teacherId: 't-6', room: 'Chem Lab' },
  { id: 'm-10a-7', day: 'Monday', periodNumber: 7, timeRange: '02:15 - 03:00', className: '10-A', subject: 'History & Civics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'm-10a-8', day: 'Monday', periodNumber: 8, timeRange: '03:00 - 03:45', className: '10-A', subject: 'Physical Education', teacherName: 'Coach R. Singh', teacherId: 't-7', room: 'Sports Complex' },

  // Tuesday - Grade 10-A
  { id: 'tu-10a-1', day: 'Tuesday', periodNumber: 1, timeRange: '08:30 - 09:15', className: '10-A', subject: 'Physics', teacherName: 'Dr. Vikram Seth', teacherId: 't-2', room: 'Physics Lab 1' },
  { id: 'tu-10a-2', day: 'Tuesday', periodNumber: 2, timeRange: '09:15 - 10:00', className: '10-A', subject: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'tu-10a-3', day: 'Tuesday', periodNumber: 3, timeRange: '10:15 - 11:00', className: '10-A', subject: 'Chemistry', teacherName: 'Dr. Neha Gupta', teacherId: 't-6', room: 'Chem Lab' },
  { id: 'tu-10a-4', day: 'Tuesday', periodNumber: 4, timeRange: '11:00 - 11:45', className: '10-A', subject: 'English Lit', teacherName: 'Ms. Anita Patel', teacherId: 't-3', room: 'Room 301' },
  { id: 'tu-10a-5', day: 'Tuesday', periodNumber: 5, timeRange: '12:30 - 01:15', className: '10-A', subject: 'Biology', teacherName: 'Ms. Sunita Rao', teacherId: 't-4', room: 'Bio Lab' },
  { id: 'tu-10a-6', day: 'Tuesday', periodNumber: 6, timeRange: '01:15 - 02:00', className: '10-A', subject: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'tu-10a-7', day: 'Tuesday', periodNumber: 7, timeRange: '02:15 - 03:00', className: '10-A', subject: 'Art & Design', teacherName: 'Ms. Anita Patel', teacherId: 't-3', room: 'Art Studio' },
  { id: 'tu-10a-8', day: 'Tuesday', periodNumber: 8, timeRange: '03:00 - 03:45', className: '10-A', subject: 'Library & Reading', teacherName: 'Mr. Amit Verma', teacherId: 't-5', room: 'Library' },

  // Wednesday - Grade 10-A
  { id: 'w-10a-1', day: 'Wednesday', periodNumber: 1, timeRange: '08:30 - 09:15', className: '10-A', subject: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'w-10a-2', day: 'Wednesday', periodNumber: 2, timeRange: '09:15 - 10:00', className: '10-A', subject: 'English Lit', teacherName: 'Ms. Anita Patel', teacherId: 't-3', room: 'Room 301' },
  { id: 'w-10a-3', day: 'Wednesday', periodNumber: 3, timeRange: '10:15 - 11:00', className: '10-A', subject: 'Computer Science', teacherName: 'Mr. Amit Verma', teacherId: 't-5', room: 'Computer Lab 2' },
  { id: 'w-10a-4', day: 'Wednesday', periodNumber: 4, timeRange: '11:00 - 11:45', className: '10-A', subject: 'Physics', teacherName: 'Dr. Vikram Seth', teacherId: 't-2', room: 'Room 301' },
  { id: 'w-10a-5', day: 'Wednesday', periodNumber: 5, timeRange: '12:30 - 01:15', className: '10-A', subject: 'Chemistry', teacherName: 'Dr. Neha Gupta', teacherId: 't-6', room: 'Chem Lab' },
  { id: 'w-10a-6', day: 'Wednesday', periodNumber: 6, timeRange: '01:15 - 02:00', className: '10-A', subject: 'Biology', teacherName: 'Ms. Sunita Rao', teacherId: 't-4', room: 'Bio Lab' },
  { id: 'w-10a-7', day: 'Wednesday', periodNumber: 7, timeRange: '02:15 - 03:00', className: '10-A', subject: 'Geography', teacherName: 'Dr. Vikram Seth', teacherId: 't-2', room: 'Room 301' },
  { id: 'w-10a-8', day: 'Wednesday', periodNumber: 8, timeRange: '03:00 - 03:45', className: '10-A', subject: 'Physical Education', teacherName: 'Coach R. Singh', teacherId: 't-7', room: 'Sports Complex' },

  // Thursday - Grade 10-A
  { id: 'th-10a-1', day: 'Thursday', periodNumber: 1, timeRange: '08:30 - 09:15', className: '10-A', subject: 'Chemistry', teacherName: 'Dr. Neha Gupta', teacherId: 't-6', room: 'Chem Lab' },
  { id: 'th-10a-2', day: 'Thursday', periodNumber: 2, timeRange: '09:15 - 10:00', className: '10-A', subject: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'th-10a-3', day: 'Thursday', periodNumber: 3, timeRange: '10:15 - 11:00', className: '10-A', subject: 'Physics', teacherName: 'Dr. Vikram Seth', teacherId: 't-2', room: 'Physics Lab 1' },
  { id: 'th-10a-4', day: 'Thursday', periodNumber: 4, timeRange: '11:00 - 11:45', className: '10-A', subject: 'English Lit', teacherName: 'Ms. Anita Patel', teacherId: 't-3', room: 'Room 301' },
  { id: 'th-10a-5', day: 'Thursday', periodNumber: 5, timeRange: '12:30 - 01:15', className: '10-A', subject: 'History & Civics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'th-10a-6', day: 'Thursday', periodNumber: 6, timeRange: '01:15 - 02:00', className: '10-A', subject: 'Computer Science', teacherName: 'Mr. Amit Verma', teacherId: 't-5', room: 'Computer Lab 2' },
  { id: 'th-10a-7', day: 'Thursday', periodNumber: 7, timeRange: '02:15 - 03:00', className: '10-A', subject: 'Biology', teacherName: 'Ms. Sunita Rao', teacherId: 't-4', room: 'Bio Lab' },
  { id: 'th-10a-8', day: 'Thursday', periodNumber: 8, timeRange: '03:00 - 03:45', className: '10-A', subject: 'Club Activities', teacherName: 'Ms. Anita Patel', teacherId: 't-3', room: 'Auditorium' },

  // Friday - Grade 10-A
  { id: 'f-10a-1', day: 'Friday', periodNumber: 1, timeRange: '08:30 - 09:15', className: '10-A', subject: 'English Lit', teacherName: 'Ms. Anita Patel', teacherId: 't-3', room: 'Room 301' },
  { id: 'f-10a-2', day: 'Friday', periodNumber: 2, timeRange: '09:15 - 10:00', className: '10-A', subject: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' },
  { id: 'f-10a-3', day: 'Friday', periodNumber: 3, timeRange: '10:15 - 11:00', className: '10-A', subject: 'Biology', teacherName: 'Ms. Sunita Rao', teacherId: 't-4', room: 'Bio Lab' },
  { id: 'f-10a-4', day: 'Friday', periodNumber: 4, timeRange: '11:00 - 11:45', className: '10-A', subject: 'Chemistry', teacherName: 'Dr. Neha Gupta', teacherId: 't-6', room: 'Chem Lab' },
  { id: 'f-10a-5', day: 'Friday', periodNumber: 5, timeRange: '12:30 - 01:15', className: '10-A', subject: 'Physics', teacherName: 'Dr. Vikram Seth', teacherId: 't-2', room: 'Physics Lab 1' },
  { id: 'f-10a-6', day: 'Friday', periodNumber: 6, timeRange: '01:15 - 02:00', className: '10-A', subject: 'Computer Science', teacherName: 'Mr. Amit Verma', teacherId: 't-5', room: 'Computer Lab 2' },
  { id: 'f-10a-7', day: 'Friday', periodNumber: 7, timeRange: '02:15 - 03:00', className: '10-A', subject: 'Physical Education', teacherName: 'Coach R. Singh', teacherId: 't-7', room: 'Sports Complex' },
  { id: 'f-10a-8', day: 'Friday', periodNumber: 8, timeRange: '03:00 - 03:45', className: '10-A', subject: 'Ethics & Value Ed', teacherName: 'Mr. Rajesh Sharma', teacherId: 't-1', room: 'Room 301' }
];

export const TEACHERS_LIST = [
  { id: 't-1', name: 'Mr. Rajesh Sharma', department: 'Mathematics & Social Studies', periodsThisWeek: 22 },
  { id: 't-2', name: 'Dr. Vikram Seth', department: 'Physics & Geography', periodsThisWeek: 18 },
  { id: 't-3', name: 'Ms. Anita Patel', department: 'English Literature & Arts', periodsThisWeek: 20 },
  { id: 't-4', name: 'Ms. Sunita Rao', department: 'Biology & Environmental Science', periodsThisWeek: 16 },
  { id: 't-5', name: 'Mr. Amit Verma', department: 'Computer Science & AI', periodsThisWeek: 17 },
  { id: 't-6', name: 'Dr. Neha Gupta', department: 'Chemistry', periodsThisWeek: 15 },
  { id: 't-7', name: 'Coach R. Singh', department: 'Physical Education & Athletics', periodsThisWeek: 14 }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const className = searchParams.get('className') || '10-A';
  const teacherId = searchParams.get('teacherId');

  let filtered = masterSchedule;

  if (teacherId) {
    filtered = filtered.filter(s => s.teacherId === teacherId);
  } else if (className) {
    filtered = filtered.filter(s => s.className === className);
  }

  return NextResponse.json({
    slots: filtered,
    teachers: TEACHERS_LIST,
    classes: ['10-A', '10-B', '9-A', '9-B']
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, absentTeacherId, targetDay, reason, assignments } = body;

    if (action === 'FIND_SUBSTITUTES') {
      // Find all slots where absent teacher is teaching on targetDay
      const affectedSlots = masterSchedule.filter(
        s => s.teacherId === absentTeacherId && s.day === targetDay
      );

      // For each affected slot, find which teachers have NO period scheduled at that periodNumber on that day
      const recommendations = affectedSlots.map(slot => {
        const busyTeacherIds = masterSchedule
          .filter(s => s.day === targetDay && s.periodNumber === slot.periodNumber)
          .map(s => s.teacherId);

        // Qualified free teachers
        const freeTeachers = TEACHERS_LIST.filter(
          t => t.id !== absentTeacherId && !busyTeacherIds.includes(t.id)
        ).sort((a, b) => a.periodsThisWeek - b.periodsThisWeek); // lowest workload first

        return {
          slotId: slot.id,
          periodNumber: slot.periodNumber,
          timeRange: slot.timeRange,
          subject: slot.subject,
          className: slot.className,
          room: slot.room,
          freeTeachers
        };
      });

      return NextResponse.json({ success: true, recommendations });
    }

    if (action === 'APPLY_SUBSTITUTION') {
      // assignments: { slotId: string, substituteTeacherId: string, reason: string }[]
      for (const assign of assignments) {
        const idx = masterSchedule.findIndex(s => s.id === assign.slotId);
        if (idx !== -1) {
          const substitute = TEACHERS_LIST.find(t => t.id === assign.substituteTeacherId);
          if (substitute) {
            masterSchedule[idx] = {
              ...masterSchedule[idx],
              originalTeacherName: masterSchedule[idx].teacherName,
              teacherName: substitute.name,
              teacherId: substitute.id,
              isSubstituted: true,
              substitutionReason: assign.reason || 'Medical / Emergency Leave'
            };
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Substitutes assigned successfully', slots: masterSchedule });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Substitution operation failed' }, { status: 500 });
  }
}
