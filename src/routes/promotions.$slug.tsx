import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";
import { CampaignProducts, CampaignShops } from "@/components/promotions/CampaignCommerceSections";
import { getPromotion, getPromotions } from "@/lib/cms/promotions";

export const Route = createFileRoute("/promotions/$slug")({
  loader: async ({ params }) => {
    const [campaign, one, two, three] = await Promise.all([
      getPromotion(params.slug),
      getPromotions("promotion_page_inline_1"),
      getPromotions("promotion_page_inline_2"),
      getPromotions("promotion_page_inline_3"),
    ]);
    if (!campaign) throw redirect({ to: "/deals" });
    return { campaign, promotions: [...one, ...two, ...three] };
  },
  head: ({ loaderData }) => {
    const campaign = loaderData?.campaign;
    if (!campaign) return { meta: [{ title: "Deals — Techaven" }] };
    const title = campaign.seo.title ?? `${campaign.headline} — Techaven`;
    const description =
      campaign.seo.description ??
      campaign.subheadline ??
      campaign.body ??
      "Explore this Techaven promotion.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(campaign.seo.image ? [{ property: "og:image", content: campaign.seo.image.url }] : []),
      ],
    };
  },
  component: PromotionPage,
});

function PromotionPage() {
  const { campaign, promotions } = Route.useLoaderData();
  const context = { campaignSlug: campaign.slug };
  return (
    <>
      <div className="shell py-4 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-brand-500">
          Techaven
        </Link>
        <span className="px-2">/</span>
        <span>{campaign.headline}</span>
      </div>
      <PromotionSlot
        placement="promotion_page_hero"
        promotions={[{ ...campaign, placement: "promotion_page_hero" }]}
        context={context}
        heroHeading="h1"
      />
      {campaign.campaignIntro || campaign.body ? (
        <section className="shell py-10 md:py-14">
          <div className="max-w-3xl">
            <h2 className="font-editorial text-3xl text-ink-800 md:text-4xl">
              About this campaign
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-800/75">
              {campaign.campaignIntro ?? campaign.body}
            </p>
          </div>
        </section>
      ) : null}
      <CampaignProducts campaign={campaign} />
      <PromotionSlot
        placement="promotion_page_inline_1"
        promotions={promotions}
        context={context}
        exclude={[campaign.id, campaign.slug]}
      />
      <CampaignShops campaign={campaign} />
      <PromotionSlot
        placement="promotion_page_inline_2"
        promotions={promotions}
        context={context}
        exclude={[campaign.id, campaign.slug]}
      />
      <CampaignProducts campaign={campaign} secondary />
      <PromotionSlot
        placement="promotion_page_inline_3"
        promotions={promotions}
        context={context}
        exclude={[campaign.id, campaign.slug]}
      />
    </>
  );
}
