import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { AuthUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'nexedu-super-secret-jwt-key-2026-production-grade';
const COOKIE_NAME = 'nexedu_token';

export interface TokenPayload {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  schoolId: string | null;
  roles?: string[];
  impersonatedSchoolId?: string | null;
}

export function getUserRolePortal(roles?: string[], isSuperAdmin?: boolean): string {
  if (isSuperAdmin) return '/super-admin';
  const roleList = roles || [];
  if (roleList.includes('STUDENT') || roleList.includes('PARENT')) return '/student';
  if (
    roleList.includes('SUBJECT_TEACHER') ||
    roleList.includes('JUNIOR_MATH_TEACHER') ||
    roleList.includes('TEACHER') ||
    roleList.includes('HOD') ||
    roleList.includes('FACULTY')
  ) {
    return '/faculty';
  }
  return '/admin';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<AuthUser | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get(COOKIE_NAME)?.value;
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Resolve user from DB
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      school: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      scopes: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') return null;

  // Active School Tenant determination
  // Super Admin can impersonate a school or run platform-wide
  const effectiveSchoolId = payload.impersonatedSchoolId || user.schoolId;

  // Fetch school enabled modules if schoolId is present
  let enabledModules: string[] = [];
  let schoolDetails: { name: string; code: string; logoUrl?: string | null; primaryColor?: string | null; accentColor?: string | null } | null = null;

  if (effectiveSchoolId) {
    const school = await prisma.school.findUnique({
      where: { id: effectiveSchoolId },
      include: {
        modules: {
          where: { isEnabled: true },
        },
      },
    });

    if (school) {
      enabledModules = school.modules.map((m) => m.moduleKey);
      schoolDetails = {
        name: school.name,
        code: school.code,
        logoUrl: school.logoUrl,
        primaryColor: school.primaryColor,
        accentColor: school.accentColor,
      };
    }
  }

  // Aggregate user permissions across roles
  const permissionsMap = new Map<string, { module: string; action: string }>();
  const roleNames: string[] = [];

  for (const ur of user.userRoles) {
    roleNames.push(ur.role.code);
    for (const rp of ur.role.permissions) {
      if (rp.granted) {
        const key = `${rp.permission.moduleKey}:${rp.permission.action}`;
        permissionsMap.set(key, {
          module: rp.permission.moduleKey,
          action: rp.permission.action,
        });
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    isSuperAdmin: user.isSuperAdmin,
    schoolId: effectiveSchoolId,
    schoolName: schoolDetails?.name || null,
    schoolCode: schoolDetails?.code || null,
    schoolLogo: schoolDetails?.logoUrl || null,
    primaryColor: schoolDetails?.primaryColor || '#2563eb',
    accentColor: schoolDetails?.accentColor || '#059669',
    roles: roleNames,
    permissions: Array.from(permissionsMap.values()),
    enabledModules,
    scopes: user.scopes.map((s) => ({
      classId: s.classId,
      sectionId: s.sectionId,
      subjectId: s.subjectId,
      departmentId: s.departmentId,
    })),
  };
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
