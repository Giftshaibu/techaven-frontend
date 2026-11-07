import { ContactInfo } from "@/components/ContactInfo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/Icon";
import { MegaHeader } from "@/components/MegaHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { getPromotions } from "@/lib/cms/promotions";
import { PromotionSlot } from "@/components/promotions/PromotionSlot";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & buyer protection — Techaven" },
      {
        name: "description",
        content:
          "How buying on Techaven works: buyer protection, delivery and pickup, warranties, refurbished grades, trade-in and selling on Techaven.",
      },
      { property: "og:title", content: "Help & buyer protection — Techaven" },
      {
        property: "og:description",
        content: "Answers on buyer protection, delivery, warranties, refurbished grades and more.",
      },
    ],
  }),
  component: HelpPage,
});

const topics = [
  {
    icon: "shield-check-linear",
    title: "Buyer protection",
    body: "Your payment is held until the device reaches you and works as described. If it doesn't, you're covered.",
  },
  {
    icon: "box-linear",
    title: "Delivery & pickup",
    body: "Each shop sets its own delivery fee and timing. Where a shop offers collection, you'll see it on the product page.",
  },
  {
    icon: "medal-ribbon-linear",
    title: "Warranties",
    body: "New devices carry a 12-month shop warranty. Refurbished devices are covered by the Techaven refurbished warranty.",
  },
  {
    icon: "refresh-circle-linear",
    title: "Refurbished grades",
    body: "Excellent means barely visible marks. Good means visible marks but full working order. Both are tested before listing.",
  },
  {
    icon: "wallet-money-linear",
    title: "Paying",
    body: "Pay with mobile money, bank transfer or card at checkout. Prices are always shown in Malawi kwacha.",
  },
  {
    icon: "shop-linear",
    title: "Selling on Techaven",
    body: "Shops apply, get verified, then list their own stock and catalogs. Verification covers identity and stock checks.",
  },
];

function HelpPage() {
  const heroPromotions =
    useQuery({
      queryKey: ["promotions", "help_hero"],
      queryFn: () => getPromotions("help_hero"),
    }).data ?? [];
  return (
    <>
      <PromotionSlot
        placement="help_hero"
        promotions={heroPromotions}
        heroHeading="h1"
        fallback={
          <MegaHeader
            eyebrow="Help"
            title="How Techaven works"
            support="Techaven is a mall: many shops, one checkout, one set of protections. Here's what that means for your order."
            tone="neutral"
            stages={["accessories", "smartphones"]}
          />
        }
      />

      <section className="shell py-10 md:py-14">
        <SectionHeader title="Common questions" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <article key={topic.title} className="rounded-2xl border border-border bg-surface p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-info-soft text-brand-700">
                <Icon name={topic.icon} className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-bold text-ink-800">{topic.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl bg-ink-900 p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold">Still need a hand?</h2>
            <ContactInfo className="mt-3 text-white/85" />
            <p className="mt-1.5 text-sm text-white/75">
              Contact us for help with your account or order.
            </p>
          </div>
          <Link
            to="/shops"
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-neutral-200"
          >
            Browse the shops
          </Link>
        </div>
      </section>
    </>
  );
}
