import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal")({
  ssr: false,
  head: () => ({ meta: [{ title: "Techaven Portals" }, { name: "robots", content: "noindex" }] }),
  component: () => <Outlet />,
});
