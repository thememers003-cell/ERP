import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isStudentOrParent = user.roles.includes('STUDENT') || user.roles.includes('PARENT');

    // Base school filter
    const schoolFilter = user.isSuperAdmin || !user.schoolId ? {} : { schoolId: user.schoolId };

    const calendarEvents: any[] = [];

    // 1. Fetch approved staff leaves ONLY for Faculty, Administration & Staff
    // Students & Parents must NEVER see staff personal HR leave applications!
    if (!isStudentOrParent) {
      const approvedLeaves = await prisma.leaveApplication.findMany({
        where: {
          ...schoolFilter,
          status: 'APPROVED',
        },
        include: {
          teacher: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      // Deduplicate leaves to prevent identical duplicate entries
      const seenLeaveDays = new Set<string>();

      for (const leave of approvedLeaves) {
        const teacherName = leave.teacher
          ? `${leave.teacher.user.firstName} ${leave.teacher.user.lastName}`
          : 'Faculty Member';

        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);

        // Expand to each day in the range
        const cur = new Date(start);
        while (cur <= end) {
          const dateStr = cur.toISOString().slice(0, 10);
          const uniqueKey = `${leave.employeeId}-${dateStr}`;

          if (!seenLeaveDays.has(uniqueKey)) {
            seenLeaveDays.add(uniqueKey);
            calendarEvents.push({
              id: `leave-${leave.id}-${dateStr}`,
              leaveId: leave.id,
              date: dateStr,
              day: cur.getDate(),
              month: cur.getMonth(),
              year: cur.getFullYear(),
              title: `${teacherName} (${leave.leaveType})`,
              type: 'STAFF_LEAVE',
              color: '#ef4444',
              teacherName,
              leaveType: leave.leaveType,
              reason: leave.reason,
              startDate: leave.startDate,
              endDate: leave.endDate,
            });
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    // 2. Fetch Institutional Exams & Exam Schedules (Visible to Students & Staff)
    const exams = await prisma.exam.findMany({
      where: schoolFilter,
      include: {
        schedules: {
          include: {
            subject: { select: { name: true } },
          },
        },
      },
      take: 30,
    });

    for (const exam of exams) {
      for (const sched of exam.schedules) {
        const schedDate = new Date(sched.date);
        calendarEvents.push({
          id: `exam-${sched.id}`,
          date: schedDate.toISOString().slice(0, 10),
          day: schedDate.getDate(),
          month: schedDate.getMonth(),
          year: schedDate.getFullYear(),
          title: `${exam.name}: ${sched.subject?.name || 'Subject'}`,
          type: 'EXAM',
          color: '#8b5cf6',
          subtitle: `Max Marks: ${sched.maxMarks} | Pass: ${sched.passingMarks}`,
        });
      }
    }

    // 3. Official Institutional Academic Calendar Milestones & Holidays (October 2026 - March 2027)
    const year = 2026;
    const academicMilestones = [
      // October 2026
      { day: 2, month: 9, year, title: 'Gandhi Jayanti (National Holiday)', type: 'HOLIDAY', color: '#10b981', desc: 'National Holiday - Campus Closed' },
      { day: 5, month: 9, year, title: 'World Teachers Day - Special Assembly', type: 'ACADEMIC', color: '#3b82f6', desc: 'Special Student Cultural Assembly' },
      { day: 12, month: 9, year, title: 'Term 1 Project & Lab Journal Submission', type: 'ACADEMIC', color: '#06b6d4', desc: 'Final date to submit Science & Maths portfolios' },
      { day: 19, month: 9, year, title: 'Dussehra Fest & Dandiya Night', type: 'EVENT', color: '#ec4899', desc: 'Inter-House Cultural Celebration' },
      { day: 20, month: 9, year, title: 'Autumn / Dussehra Vacation (Day 1)', type: 'HOLIDAY', color: '#10b981', desc: 'Autumn Institutional Holiday' },
      { day: 21, month: 9, year, title: 'Autumn / Dussehra Vacation (Day 2)', type: 'HOLIDAY', color: '#10b981', desc: 'Autumn Institutional Holiday' },
      { day: 28, month: 9, year, title: 'Parent-Teacher Conference (PTM - Term 1)', type: 'MEETING', color: '#f59e0b', desc: 'Academic Report Review with Class Mentors' },

      // November 2026
      { day: 1, month: 10, year, title: 'Diwali & Deepavali Break', type: 'HOLIDAY', color: '#10b981', desc: 'Festival of Lights Holiday' },
      { day: 14, month: 10, year, title: 'Childrens Day & Annual Sports Meet', type: 'EVENT', color: '#ec4899', desc: 'Track & Field Athletic Championship' },
      { day: 25, month: 10, year, title: 'CBSE Pre-Board Phase 1 Briefing', type: 'ACADEMIC', color: '#8b5cf6', desc: 'Exam format and syllabus orientation' },

      // December 2026
      { day: 10, month: 11, year, title: 'Annual STEM & Robotics Exhibition', type: 'EVENT', color: '#06b6d4', desc: 'Student Science & Innovation Expo' },
      { day: 24, month: 11, year, title: 'Christmas Eve & Winter Break Starts', type: 'HOLIDAY', color: '#10b981', desc: 'Winter Institutional Recess' },
      { day: 25, month: 11, year, title: 'Christmas Day', type: 'HOLIDAY', color: '#10b981', desc: 'Public Holiday' },
    ];

    for (const m of academicMilestones) {
      const monthStr = String(m.month + 1).padStart(2, '0');
      const dayStr = String(m.day).padStart(2, '0');
      calendarEvents.push({
        id: `milestone-${m.year}-${monthStr}-${dayStr}-${m.type}`,
        date: `${m.year}-${monthStr}-${dayStr}`,
        day: m.day,
        month: m.month,
        year: m.year,
        title: m.title,
        type: m.type,
        color: m.color,
        subtitle: m.desc,
      });
    }

    return NextResponse.json({
      success: true,
      data: calendarEvents,
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch calendar' }, { status: 500 });
  }
}
