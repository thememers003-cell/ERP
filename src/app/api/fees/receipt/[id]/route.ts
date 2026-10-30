import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Try finding by payment receipt id or invoice id
    let receipt = await prisma.paymentReceipt.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        school: {
          select: { name: true, code: true, address: true, phone: true, email: true },
        },
      },
    });

    let invoice = null;

    if (receipt) {
      invoice = await prisma.invoice.findUnique({
        where: { id: receipt.invoiceId },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              class: { select: { name: true } },
              section: { select: { name: true } },
              parentLinks: {
                include: {
                  parent: {
                    include: {
                      user: { select: { firstName: true, lastName: true, phone: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else {
      // Find invoice by ID and get its latest receipt
      invoice = await prisma.invoice.findFirst({
        where: { id: params.id, schoolId: user.schoolId },
        include: {
          school: {
            select: { name: true, code: true, address: true, phone: true, email: true },
          },
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              class: { select: { name: true } },
              section: { select: { name: true } },
              parentLinks: {
                include: {
                  parent: {
                    include: {
                      user: { select: { firstName: true, lastName: true, phone: true } },
                    },
                  },
                },
              },
            },
          },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });

      if (invoice && invoice.payments.length > 0) {
        receipt = invoice.payments[0] as any;
      }
    }

    if (!invoice) {
      return NextResponse.json({ success: false, error: { message: 'Receipt record not found' } }, { status: 404 });
    }

    const schoolInfo = (receipt as any)?.school || (invoice as any)?.school || {
      name: user.schoolName || 'NexEdu Academy',
      code: user.schoolCode || 'NX',
      address: 'Institutional Campus, Educational Enclave',
      phone: '+1 (555) 234-5678',
      email: 'bursar@school.edu',
    };

    const primaryParent = invoice.student?.parentLinks?.[0]?.parent?.user;

    return NextResponse.json({
      success: true,
      data: {
        receiptNumber: receipt?.receiptNumber || `REC-OFFICIAL-${invoice.invoiceNumber.slice(-6)}`,
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
        paymentDate: receipt?.paymentDate || invoice.updatedAt,
        paymentMethod: receipt?.paymentMethod || 'UPI / DIGITAL',
        transactionRef: receipt?.transactionRef || 'TRX-INST-VERIFIED',
        amountPaid: receipt?.amount || invoice.paidAmount,
        totalInvoiceAmount: invoice.totalAmount,
        remainingBalance: invoice.balance,
        status: invoice.status,
        school: schoolInfo,
        student: {
          name: `${invoice.student.user.firstName} ${invoice.student.user.lastName}`,
          admissionNumber: invoice.student.admissionNumber,
          rollNumber: invoice.student.rollNumber || '-',
          classGrade: invoice.student.class?.name || 'Class',
          section: invoice.student.section?.name || 'A',
          guardianName: primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : 'Guardian',
          guardianPhone: primaryParent?.phone || 'Available in records',
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
