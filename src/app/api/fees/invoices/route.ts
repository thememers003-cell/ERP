import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAuditTrail } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'fees_billing', 'CREATE')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: fees_billing.CREATE' } }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      classId,
      title,
      amount,
      dueDate,
      cadence = 'MONTHLY', // MONTHLY, TERM_WISE, YEARLY, ONE_TIME
      category = 'Tuition Fee',
    } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: { message: 'A valid fee amount is required' } }, { status: 400 });
    }

    const targetDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const formattedTitle = `[${cadence}] ${title || category}`;

    // Bulk issue to a whole class
    if (classId && !studentId) {
      const studentsInClass = await prisma.student.findMany({
        where: { classId, schoolId: user.schoolId, status: 'ACTIVE' },
      });

      if (studentsInClass.length === 0) {
        return NextResponse.json({ success: false, error: { message: 'No active students found in the selected class' } }, { status: 400 });
      }

      const createdInvoices = [];
      for (const s of studentsInClass) {
        const invNum = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const inv = await prisma.invoice.create({
          data: {
            schoolId: user.schoolId,
            studentId: s.id,
            invoiceNumber: invNum,
            title: formattedTitle,
            totalAmount: numAmount,
            paidAmount: 0,
            balance: numAmount,
            status: 'UNPAID',
            dueDate: targetDueDate,
          },
        });
        createdInvoices.push(inv);
      }

      await logAuditTrail({
        schoolId: user.schoolId,
        actorId: user.id,
        action: 'INVOICES_BULK_GENERATED',
        resource: `Generated ${createdInvoices.length} invoices for Class`,
      });

      return NextResponse.json({ success: true, count: createdInvoices.length, data: createdInvoices });
    }

    // Individual student invoice
    if (!studentId) {
      return NextResponse.json({ success: false, error: { message: 'Student ID or Class ID is required' } }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: user.schoolId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: { message: 'Student not found' } }, { status: 404 });
    }

    const invNum = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const invoice = await prisma.invoice.create({
      data: {
        schoolId: user.schoolId,
        studentId: student.id,
        invoiceNumber: invNum,
        title: formattedTitle,
        totalAmount: numAmount,
        paidAmount: 0,
        balance: numAmount,
        status: 'UNPAID',
        dueDate: targetDueDate,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'INVOICE_GENERATED',
      resource: `Invoice #${invNum} for ${student.user.firstName} ${student.user.lastName}`,
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    console.error('Error generating fee invoice:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
