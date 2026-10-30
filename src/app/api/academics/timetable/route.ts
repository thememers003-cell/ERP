import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const teacherId = searchParams.get('teacherId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    const isStudent = user.roles.includes('STUDENT');
    const isParent = user.roles.includes('PARENT');
    const isTeacher = user.roles.some((r) =>
      ['SUBJECT_TEACHER', 'JUNIOR_MATH_TEACHER', 'TEACHER', 'HOD'].includes(r)
    ) && !user.roles.includes('ADMIN') && !user.roles.includes('SCHOOL_OWNER') && !user.isSuperAdmin;

    const whereClause: any = { schoolId: user.schoolId };

    let studentContext: any = null;
    let teacherContext: any = null;

    // 1. Strict Student Tenancy & Class Scope
    if (isStudent) {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          class: true,
          section: {
            include: {
              classTeacher: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      });
      if (student) {
        whereClause.classId = student.classId;
        whereClause.sectionId = student.sectionId;
        studentContext = {
          studentId: student.id,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber || '-',
          classId: student.classId,
          className: student.class.name,
          sectionId: student.sectionId,
          sectionName: student.section.name,
          roomNumber: student.section.roomNumber,
          classTeacherName: student.section.classTeacher
            ? `${student.section.classTeacher.user.firstName} ${student.section.classTeacher.user.lastName}`
            : null,
          classTeacherEmail: student.section.classTeacher?.user.email || null,
        };
      }
    } else if (isParent) {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: {
          children: {
            include: { student: { include: { class: true, section: true } } },
          },
        },
      });
      const firstChild = parent?.children?.[0]?.student;
      if (firstChild) {
        whereClause.classId = firstChild.classId;
        whereClause.sectionId = firstChild.sectionId;
        studentContext = {
          studentId: firstChild.id,
          classId: firstChild.classId,
          className: firstChild.class.name,
          sectionId: firstChild.sectionId,
          sectionName: firstChild.section.name,
          roomNumber: firstChild.section.roomNumber,
        };
      }
    } else if (isTeacher) {
      // 2. Strict Faculty Schedule Scope (Default to personal teaching load)
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { department: true },
      });
      if (teacher) {
        teacherContext = {
          teacherId: teacher.id,
          employeeCode: teacher.employeeCode,
          designation: teacher.designation,
          department: teacher.department?.name || null,
        };
        // If teacher is viewing personal schedule without explicit class query
        if (!classId && !sectionId) {
          whereClause.teacherId = teacher.id;
        } else {
          if (classId) whereClause.classId = classId;
          if (sectionId) whereClause.sectionId = sectionId;
        }
      }
    } else {
      // Admin / School Owner: flexible query
      if (classId) whereClause.classId = classId;
      if (sectionId) whereClause.sectionId = sectionId;
      if (teacherId) whereClause.teacherId = teacherId;
    }

    if (dayOfWeek) whereClause.dayOfWeek = dayOfWeek;

    const [slots, classes, subjects, teachers] = await Promise.all([
      prisma.timetableSlot.findMany({
        where: whereClause,
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
      }),
      prisma.classGrade.findMany({
        where: { schoolId: user.schoolId },
        include: { sections: { orderBy: { name: 'asc' } } },
        orderBy: { numericLevel: 'asc' },
      }),
      prisma.subject.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { name: 'asc' },
      }),
      prisma.teacher.findMany({
        where: { schoolId: user.schoolId },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { employeeCode: 'asc' },
      }),
    ]);

    // Fast lookup maps
    const classMap = new Map<string, any>();
    const sectionMap = new Map<string, any>();
    for (const c of classes) {
      classMap.set(c.id, c);
      for (const s of c.sections) {
        sectionMap.set(s.id, { ...s, className: c.name });
      }
    }

    const subjectMap = new Map<string, any>();
    for (const sub of subjects) {
      subjectMap.set(sub.id, sub);
    }

    const formattedSlots = slots.map((s) => {
      const cls = classMap.get(s.classId);
      const sec = sectionMap.get(s.sectionId);
      const sub = subjectMap.get(s.subjectId);

      return {
        id: s.id,
        schoolId: s.schoolId,
        classId: s.classId,
        className: cls?.name || 'Unknown Class',
        classCode: cls?.code || '',
        sectionId: s.sectionId,
        sectionName: sec?.name || 'Unknown Section',
        subjectId: s.subjectId,
        subjectName: sub?.name || 'Unknown Subject',
        subjectCode: sub?.code || '',
        subjectType: sub?.type || 'THEORY',
        teacherId: s.teacherId,
        teacherName: s.teacher
          ? `${s.teacher.user.firstName} ${s.teacher.user.lastName}`
          : 'Unassigned',
        teacherEmail: s.teacher?.user?.email || null,
        dayOfWeek: s.dayOfWeek,
        periodNumber: s.periodNumber,
        startTime: s.startTime,
        endTime: s.endTime,
        roomNumber: s.roomNumber || sec?.roomNumber || 'Room Unassigned',
      };
    });

    // Real-Time Today Schedule Calculation
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDayOfWeek = dayNames[now.getDay()];
    const activeScheduleDay = currentDayOfWeek === 'SUNDAY' ? 'MONDAY' : currentDayOfWeek;

    const parseTimeStr = (timeStr: string): number => {
      if (!timeStr) return 0;
      const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridian = match[3]?.toUpperCase();
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todaySlots = formattedSlots
      .filter((s) => s.dayOfWeek === activeScheduleDay)
      .sort((a, b) => a.periodNumber - b.periodNumber)
      .map((s) => {
        const startMin = parseTimeStr(s.startTime);
        const endMin = parseTimeStr(s.endTime);
        let status = 'UPCOMING';
        if (currentMinutes > endMin && endMin > 0) {
          status = 'COMPLETED';
        } else if (currentMinutes >= startMin && currentMinutes <= endMin) {
          status = 'IN_PROGRESS';
        }
        return {
          ...s,
          status,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        slots: formattedSlots,
        todaySlots,
        currentDay: activeScheduleDay,
        isWeekend: currentDayOfWeek === 'SUNDAY',
        viewerRole: isStudent ? 'STUDENT' : isTeacher ? 'TEACHER' : isParent ? 'PARENT' : 'ADMIN',
        studentContext,
        teacherContext,
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          numericLevel: c.numericLevel,
          sections: c.sections.map((sec) => ({
            id: sec.id,
            name: sec.name,
            roomNumber: sec.roomNumber,
          })),
        })),
        subjects: subjects.map((sub) => ({
          id: sub.id,
          name: sub.name,
          code: sub.code,
          type: sub.type,
        })),
        teachers: teachers.map((t) => ({
          id: t.id,
          employeeCode: t.employeeCode,
          name: `${t.user.firstName} ${t.user.lastName}`,
          designation: t.designation,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching timetable slots:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();

    // Check for bulk operations first
    if (body.action === 'POPULATE_DEFAULT') {
      const { classId, sectionId } = body;
      if (!classId || !sectionId) {
        return NextResponse.json(
          { success: false, error: { message: 'classId and sectionId are required' } },
          { status: 400 }
        );
      }

      // Fetch subjects and assignments for this section
      const [subjects, assignments, section] = await Promise.all([
        prisma.subject.findMany({ where: { schoolId: user.schoolId } }),
        prisma.classSubject.findMany({
          where: { classId, sectionId },
          include: { teacher: true },
        }),
        prisma.section.findUnique({ where: { id: sectionId } }),
      ]);

      if (subjects.length === 0) {
        return NextResponse.json(
          { success: false, error: { message: 'No subjects configured for this school.' } },
          { status: 400 }
        );
      }

      const defaultBellSchedule = [
        { period: 1, start: '08:30 AM', end: '09:15 AM' },
        { period: 2, start: '09:15 AM', end: '10:00 AM' },
        { period: 3, start: '10:00 AM', end: '10:45 AM' },
        { period: 4, start: '11:00 AM', end: '11:45 AM' },
        { period: 5, start: '11:45 AM', end: '12:30 PM' },
        { period: 6, start: '01:15 PM', end: '02:00 PM' },
        { period: 7, start: '02:00 PM', end: '02:45 PM' },
        { period: 8, start: '02:45 PM', end: '03:30 PM' },
      ];

      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const defaultRoom = section?.roomNumber || 'Room 101';

      // Delete existing slots for this section to prevent duplicates
      await prisma.timetableSlot.deleteMany({
        where: { schoolId: user.schoolId, classId, sectionId },
      });

      let subIdx = 0;
      const createdSlots = [];

      for (const day of days) {
        for (const bell of defaultBellSchedule) {
          const currentSubject = subjects[subIdx % subjects.length];
          const assignedCS = assignments.find((a) => a.subjectId === currentSubject.id);

          const slot = await prisma.timetableSlot.create({
            data: {
              schoolId: user.schoolId,
              classId,
              sectionId,
              subjectId: currentSubject.id,
              teacherId: assignedCS?.teacherId || null,
              dayOfWeek: day,
              periodNumber: bell.period,
              startTime: bell.start,
              endTime: bell.end,
              roomNumber: defaultRoom,
            },
          });
          createdSlots.push(slot);
          subIdx++;
        }
      }

      await logAuditTrail({
        schoolId: user.schoolId,
        actorId: user.id,
        action: 'TIMETABLE_POPULATE_DEFAULT',
        resource: 'TimetableSlot',
        newValue: { classId, sectionId, count: createdSlots.length },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully populated standard weekly timetable with ${createdSlots.length} slots.`,
      });
    }

    if (body.action === 'COPY_SECTION') {
      const { sourceClassId, sourceSectionId, targetClassId, targetSectionId } = body;
      if (!sourceSectionId || !targetSectionId) {
        return NextResponse.json(
          { success: false, error: { message: 'Source and Target sections are required' } },
          { status: 400 }
        );
      }

      const sourceSlots = await prisma.timetableSlot.findMany({
        where: { schoolId: user.schoolId, classId: sourceClassId, sectionId: sourceSectionId },
      });

      if (sourceSlots.length === 0) {
        return NextResponse.json(
          { success: false, error: { message: 'Source section has no timetable slots to copy.' } },
          { status: 400 }
        );
      }

      const targetSection = await prisma.section.findUnique({ where: { id: targetSectionId } });

      // Clear target section slots
      await prisma.timetableSlot.deleteMany({
        where: { schoolId: user.schoolId, classId: targetClassId, sectionId: targetSectionId },
      });

      for (const slot of sourceSlots) {
        await prisma.timetableSlot.create({
          data: {
            schoolId: user.schoolId,
            classId: targetClassId,
            sectionId: targetSectionId,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
            dayOfWeek: slot.dayOfWeek,
            periodNumber: slot.periodNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            roomNumber: targetSection?.roomNumber || slot.roomNumber,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Copied ${sourceSlots.length} slots to target section successfully.`,
      });
    }

    // Individual Slot Create/Update
    const {
      id,
      classId,
      sectionId,
      subjectId,
      teacherId,
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      roomNumber,
    } = body;

    if (!classId || !sectionId || !subjectId || !dayOfWeek || !periodNumber || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required timetable slot fields.' } },
        { status: 400 }
      );
    }

    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    if (!validDays.includes(dayOfWeek.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: { message: `Invalid dayOfWeek. Must be one of: ${validDays.join(', ')}` } },
        { status: 400 }
      );
    }

    const cleanDayOfWeek = dayOfWeek.toUpperCase();
    const cleanPeriod = parseInt(periodNumber, 10);
    const cleanTeacherId = teacherId || null;
    const cleanRoom = roomNumber?.trim() || null;

    // ----------------------------------------------------
    // CONFLICT RESOLUTION ENGINE
    // ----------------------------------------------------

    // 1. Check Faculty Double-Booking
    if (cleanTeacherId) {
      const conflictingTeacherSlot = await prisma.timetableSlot.findFirst({
        where: {
          schoolId: user.schoolId,
          dayOfWeek: cleanDayOfWeek,
          periodNumber: cleanPeriod,
          teacherId: cleanTeacherId,
          ...(id ? { id: { not: id } } : {}),
        },
        include: {
          teacher: { include: { user: true } },
        },
      });

      if (conflictingTeacherSlot && (conflictingTeacherSlot.classId !== classId || conflictingTeacherSlot.sectionId !== sectionId)) {
        // Fetch class and section names
        const conflictClass = await prisma.classGrade.findUnique({
          where: { id: conflictingTeacherSlot.classId },
        });
        const conflictSection = await prisma.section.findUnique({
          where: { id: conflictingTeacherSlot.sectionId },
        });

        const teacherName = conflictingTeacherSlot.teacher?.user
          ? `${conflictingTeacherSlot.teacher.user.firstName} ${conflictingTeacherSlot.teacher.user.lastName}`
          : 'Selected Faculty';

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FACULTY_SCHEDULE_CONFLICT',
              message: `Double-booking conflict: ${teacherName} is already scheduled in ${conflictClass?.name || 'Class'} (${conflictSection?.name || 'Section'}) on ${cleanDayOfWeek} Period ${cleanPeriod} (${conflictingTeacherSlot.startTime} - ${conflictingTeacherSlot.endTime}).`,
            },
          },
          { status: 409 }
        );
      }
    }

    // 2. Check Classroom Room Double-Booking
    if (cleanRoom) {
      const conflictingRoomSlot = await prisma.timetableSlot.findFirst({
        where: {
          schoolId: user.schoolId,
          dayOfWeek: cleanDayOfWeek,
          periodNumber: cleanPeriod,
          roomNumber: cleanRoom,
          ...(id ? { id: { not: id } } : {}),
        },
      });

      if (conflictingRoomSlot && (conflictingRoomSlot.classId !== classId || conflictingRoomSlot.sectionId !== sectionId)) {
        const conflictClass = await prisma.classGrade.findUnique({
          where: { id: conflictingRoomSlot.classId },
        });
        const conflictSection = await prisma.section.findUnique({
          where: { id: conflictingRoomSlot.sectionId },
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ROOM_SCHEDULE_CONFLICT',
              message: `Room conflict: ${cleanRoom} is already occupied by ${conflictClass?.name || 'Class'} (${conflictSection?.name || 'Section'}) on ${cleanDayOfWeek} Period ${cleanPeriod}.`,
            },
          },
          { status: 409 }
        );
      }
    }

    // 3. Upsert or Update existing slot
    let savedSlot;
    if (id) {
      savedSlot = await prisma.timetableSlot.update({
        where: { id },
        data: {
          classId,
          sectionId,
          subjectId,
          teacherId: cleanTeacherId,
          dayOfWeek: cleanDayOfWeek,
          periodNumber: cleanPeriod,
          startTime,
          endTime,
          roomNumber: cleanRoom,
        },
        include: {
          teacher: { include: { user: true } },
        },
      });
    } else {
      // Check if slot already exists for this exact class, section, day, period
      const existingSlot = await prisma.timetableSlot.findFirst({
        where: {
          schoolId: user.schoolId,
          classId,
          sectionId,
          dayOfWeek: cleanDayOfWeek,
          periodNumber: cleanPeriod,
        },
      });

      if (existingSlot) {
        savedSlot = await prisma.timetableSlot.update({
          where: { id: existingSlot.id },
          data: {
            subjectId,
            teacherId: cleanTeacherId,
            startTime,
            endTime,
            roomNumber: cleanRoom,
          },
          include: {
            teacher: { include: { user: true } },
          },
        });
      } else {
        savedSlot = await prisma.timetableSlot.create({
          data: {
            schoolId: user.schoolId,
            classId,
            sectionId,
            subjectId,
            teacherId: cleanTeacherId,
            dayOfWeek: cleanDayOfWeek,
            periodNumber: cleanPeriod,
            startTime,
            endTime,
            roomNumber: cleanRoom,
          },
          include: {
            teacher: { include: { user: true } },
          },
        });
      }
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: id ? 'TIMETABLE_SLOT_UPDATED' : 'TIMETABLE_SLOT_CREATED',
      resource: 'TimetableSlot',
      resourceId: savedSlot.id,
      newValue: {
        classId,
        sectionId,
        subjectId,
        teacherId: cleanTeacherId,
        dayOfWeek: cleanDayOfWeek,
        periodNumber: cleanPeriod,
        startTime,
        endTime,
        roomNumber: cleanRoom,
      },
    });

    return NextResponse.json({
      success: true,
      data: savedSlot,
    });
  } catch (error: any) {
    console.error('Error saving timetable slot:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');

    // If clearing section
    if (classId && sectionId && searchParams.get('action') === 'CLEAR_SECTION') {
      await prisma.timetableSlot.deleteMany({
        where: { schoolId: user.schoolId, classId, sectionId },
      });
      return NextResponse.json({ success: true, message: 'Section timetable cleared successfully.' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Slot ID is required' } }, { status: 400 });
    }

    const existing = await prisma.timetableSlot.findUnique({
      where: { id },
    });

    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Timetable slot not found' } }, { status: 404 });
    }

    await prisma.timetableSlot.delete({
      where: { id },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'TIMETABLE_SLOT_DELETED',
      resource: 'TimetableSlot',
      resourceId: id,
    });

    return NextResponse.json({ success: true, message: 'Slot removed successfully' });
  } catch (error: any) {
    console.error('Error deleting timetable slot:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
