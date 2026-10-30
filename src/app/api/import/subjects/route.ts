import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();
    const rows = body.rows || body.subjects;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'No rows provided' } }, { status: 400 });
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['Subject Name'] || row.name || row.subjectName;
      const code = String(row['Code'] || row.code || `SUB-${Date.now().toString().slice(-4)}-${i}`).toUpperCase().trim();
      const type = (row['Type'] || row.type || 'THEORY').toUpperCase();

      if (!name) {
        errors.push(`Row ${i + 1}: Missing subject name`);
        continue;
      }

      try {
        await prisma.subject.upsert({
          where: { schoolId_code: { schoolId: user.schoolId, code } },
          update: { name, type },
          create: {
            schoolId: user.schoolId,
            name,
            code,
            type: ['THEORY', 'PRACTICAL', 'ELECTIVE'].includes(type) ? type : 'THEORY',
          },
        });
        imported++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'EXCEL_IMPORT_SUBJECTS',
      resource: `Imported ${imported} subjects from Excel/CSV`,
    });

    return NextResponse.json({
      success: true,
      data: { imported, total: rows.length, errors },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
