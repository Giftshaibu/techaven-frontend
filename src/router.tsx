import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { RoutePendingScreen } from "./components/TechavenLoader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Pages that load data before rendering show the Techaven loader after a short pause,
    // and keep it briefly so it never just flashes.
    defaultPendingComponent: RoutePendingScreen,
    defaultPendingMs: 300,
    defaultPendingMinMs: 500,
  });

  return router;
};
