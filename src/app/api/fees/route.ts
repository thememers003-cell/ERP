import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAuditTrail } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const isStudentOrParent = user.roles.includes('STUDENT') || user.roles.includes('PARENT');
    if (!isStudentOrParent && !hasPermission(user, 'fees_billing', 'VIEW')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: fees_billing.VIEW' } }, { status: 403 });
    }

    const invoiceWhere: any = { schoolId: user.schoolId };

    if (user.roles.includes('STUDENT')) {
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
      });
      invoiceWhere.studentId = student?.id || 'none';
    }

    const [invoices, structures] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              class: { select: { name: true } },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      user.roles.includes('STUDENT')
        ? []
        : prisma.feeStructure.findMany({
            where: { schoolId: user.schoolId },
            include: { class: { select: { name: true } } },
          }),
    ]);

    // Financial KPIs
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    for (const inv of invoices) {
      totalBilled += inv.totalAmount;
      totalCollected += inv.paidAmount;
      totalOutstanding += inv.balance;
    }

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      title: inv.title,
      studentName: inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : 'Enrolled Student',
      studentAdmNo: inv.student?.admissionNumber || 'N/A',
      className: inv.student?.class?.name || 'Class',
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balance: inv.balance,
      status: inv.status,
      dueDate: inv.dueDate,
      paymentsCount: inv.payments.length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        invoices: formattedInvoices,
        structures,
        metrics: {
          totalBilled,
          totalCollected,
          totalOutstanding,
          collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'fees_billing', 'COLLECT')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: fees_billing.COLLECT' } }, { status: 403 });
    }

    const body = await req.json();
    const { invoiceId, amount, paymentMethod, transactionRef } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json({ success: false, error: { message: 'invoiceId and amount are required' } }, { status: 400 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, schoolId: user.schoolId },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: { message: 'Invoice not found' } }, { status: 404 });
    }

    const payAmount = Number(amount);
    const newPaid = invoice.paidAmount + payAmount;
    const newBalance = Math.max(0, invoice.totalAmount - newPaid);
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

    // 1. Create Receipt
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const receipt = await prisma.paymentReceipt.create({
      data: {
        schoolId: user.schoolId,
        invoiceId: invoice.id,
        receiptNumber,
        amount: payAmount,
        paymentMethod: paymentMethod || 'CASH',
        transactionRef: transactionRef || null,
      },
    });

    // 2. Update Invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid,
        balance: newBalance,
        status: newStatus,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'PAYMENT_COLLECTED',
      resource: `Receipt #${receiptNumber} for Invoice #${invoice.invoiceNumber}`,
      newValue: { amount: payAmount, receiptNumber },
    });

    return NextResponse.json({
      success: true,
      data: {
        receipt,
        invoice: updatedInvoice,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
