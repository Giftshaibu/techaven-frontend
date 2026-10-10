import { createFileRoute } from "@tanstack/react-router";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";
import { getPromotionPreview } from "@/lib/cms/promotions";

type PreviewSearch = {
  documentId?: string;
  status: "draft" | "published";
  expires?: string;
  signature?: string;
};

export const Route = createFileRoute("/promotions/preview")({
  validateSearch: (search: Record<string, unknown>): PreviewSearch => ({
    documentId: typeof search.documentId === "string" ? search.documentId : undefined,
    status: search.status === "published" ? "published" : "draft",
    expires: typeof search.expires === "string" ? search.expires : undefined,
    signature: typeof search.signature === "string" ? search.signature : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => ({
    promotion: await getPromotionPreview({
      documentId: deps.documentId ?? "",
      status: deps.status,
      expires: deps.expires ?? "",
      signature: deps.signature ?? "",
    }),
  }),
  head: () => ({
    meta: [
      { title: "Promotion preview — Techaven" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PromotionPreviewPage,
});

function PromotionPreviewPage() {
  const { promotion } = Route.useLoaderData();
  const search = Route.useSearch();

  if (!promotion) {
    return (
      <section className="shell flex min-h-[55vh] items-center justify-center py-14">
        <div className="max-w-xl text-center">
          <h1 className="font-editorial text-4xl text-ink-800">Preview unavailable</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Return to Strapi and reopen Preview. The promotion may have been removed, or this secure
            preview link may have expired.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <aside className="border-y border-border bg-stage" aria-label="Preview status">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <p className="font-semibold text-ink-800">
            {search.status === "published" ? "Published preview" : "Draft preview"}
          </p>
          <p className="text-muted-foreground">
            Placement: <span className="font-medium text-ink-800">{promotion.placement}</span>
          </p>
        </div>
      </aside>
      <PromotionSlot
        placement={promotion.placement}
        promotions={[promotion]}
        heroHeading="h1"
        fallback={
          <section className="shell py-14">
            <h1 className="font-editorial text-4xl text-ink-800">Layout unavailable</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              This layout is not compatible with the selected placement. Return to Strapi and choose
              one of the layouts supported by {promotion.placement}.
            </p>
          </section>
        }
      />
    </>
  );
}
