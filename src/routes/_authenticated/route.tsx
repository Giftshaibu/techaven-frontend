import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getAccessToken } from "@/integrations/techaven/token";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (!getAccessToken()) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
