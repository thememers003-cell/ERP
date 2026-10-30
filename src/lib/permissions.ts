import { AuthUser } from '@/types';

export interface PermissionCheckTarget {
  classId?: string | null;
  sectionId?: string | null;
  subjectId?: string | null;
  departmentId?: string | null;
}

export function hasPermission(
  user: AuthUser | null,
  moduleKey: string,
  action: string,
  target?: PermissionCheckTarget
): boolean {
  if (!user) return false;

  // 1. Super Admin has unrestricted platform access
  if (user.isSuperAdmin) return true;

  // 2. Must belong to an active school
  if (!user.schoolId) return false;

  // 3. Module must be enabled in the school tenant
  if (!user.enabledModules.includes(moduleKey)) {
    return false;
  }

  // 4. School Owner / Admin has full tenant permissions
  if (user.roles.includes('SCHOOL_OWNER') || user.roles.includes('ADMIN')) {
    return true;
  }

  // 5. Check if user holds the specific module:action grant
  const hasAction = user.permissions.some(
    (p) => p.module === moduleKey && p.action === action
  );
  if (!hasAction) return false;

  // 6. Granular Scope Resolution (ABAC)
  // If user has specific scopes assigned, they can only act on records within those scopes
  if (user.scopes && user.scopes.length > 0 && target) {
    const isWithinScope = user.scopes.some((scope) => {
      if (target.classId && scope.classId && target.classId !== scope.classId) return false;
      if (target.sectionId && scope.sectionId && target.sectionId !== scope.sectionId) return false;
      if (target.subjectId && scope.subjectId && target.subjectId !== scope.subjectId) return false;
      if (target.departmentId && scope.departmentId && target.departmentId !== scope.departmentId) return false;
      return true;
    });

    if (!isWithinScope) return false;
  }

  return true;
}
