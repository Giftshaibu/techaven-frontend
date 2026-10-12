import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { ensureSession, getAccessToken } from "@/integrations/techaven/token";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await ensureSession();
    if (!getAccessToken()) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
