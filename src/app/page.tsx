import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('nexedu_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  if (payload.isSuperAdmin && !payload.impersonatedSchoolId) {
    redirect('/super-admin');
  }

  // Check roles to direct user to their assigned dashboard
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const roleCodes = user.userRoles.map((ur) => ur.role.code);

  if (roleCodes.includes('STUDENT')) {
    redirect('/student');
  } else if (
    roleCodes.includes('SUBJECT_TEACHER') ||
    roleCodes.includes('JUNIOR_MATH_TEACHER') ||
    roleCodes.includes('TEACHER') ||
    roleCodes.includes('HOD')
  ) {
    redirect('/faculty');
  } else if (roleCodes.includes('PARENT')) {
    redirect('/student'); // parent child view
  } else {
    redirect('/admin');
  }
}
