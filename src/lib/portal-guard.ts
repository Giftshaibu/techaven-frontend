import { redirect } from "@tanstack/react-router";

import { getStaffSession, ROLE_HOME, type StaffRole } from "@/integrations/techaven/staff";

/** Route `beforeLoad` guard: only the given staff role may enter, others are sent to their own portal. */
export function requireStaffRole(role: StaffRole) {
  return ({ location }: { location: { href: string } }) => {
    const session = getStaffSession();
    if (!session) throw redirect({ to: "/portal", search: { redirect: location.href } });
    if (session.user.role !== role) {
      const home = ROLE_HOME[session.user.role as StaffRole];
      throw redirect({ to: home ?? "/portal" });
    }
    return { staff: session };
  };
}
