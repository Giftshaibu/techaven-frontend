import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { ImageStage } from "@/components/ImageStage";
import { MegaHeader } from "@/components/MegaHeader";
import { SectionHeader } from "@/components/SectionHeader";

export const Route = createFileRoute("/trade-in")({
  head: () => ({
    meta: [
      { title: "Trade in your old device — Techaven" },
      {
        name: "description",
        content:
          "Check whether your phone, laptop or tablet qualifies for trade-in and put its value towards your next device on Techaven.",
      },
      { property: "og:title", content: "Trade in your old device — Techaven" },
      {
        property: "og:description",
        content: "Give your old device another life and put its value towards your next one.",
      },
    ],
  }),
  component: TradeInPage,
});

const deviceTypes = [
  { label: "Phone", icon: "smartphone-2-linear", category: "smartphones" },
  { label: "Laptop", icon: "laptop-minimalistic-linear", category: "laptops" },
  { label: "Tablet", icon: "tablet-linear", category: "tablets" },
  { label: "Watch", icon: "smart-watch-linear", category: "wearables" },
];

const steps = [
  {
    title: "Tell us what you have",
    body: "Device type, model, storage and rough condition. It takes about a minute.",
  },
  {
    title: "See the available path",
    body: "Participating shops tell you whether they accept it and what happens next.",
  },
  {
    title: "Hand it over, buy the new one",
    body: "Drop off or arrange collection, then apply the value to your next purchase.",
  },
];

function TradeInPage() {
  return (
    <>
      <MegaHeader
        eyebrow="Trade-in"
        title="Give your old device another life"
        support="Check whether your device qualifies and see the available trade-in path. Eligibility and value are set by the participating shop."
        actions={[{ label: "Browse devices to upgrade to", to: "/deals" }]}
        stages={["smartphones", "laptops"]}
        tone="brand-soft"
      />

      <section className="shell py-10 md:py-14">
        <SectionHeader title="What are you trading in?" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {deviceTypes.map((d) => (
            <div
              key={d.label}
              className="rounded-2xl border border-border bg-surface p-5 text-center"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-800">
                <Icon name={d.icon} className="h-7 w-7" />
              </span>
              <h3 className="mt-3 text-base font-bold text-ink-800">{d.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Accepted by selected shops</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell pb-10 md:pb-14">
        <div className="grid gap-8 rounded-3xl bg-surface p-6 md:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionHeader title="How a trade-in works" />
            <ol className="space-y-5">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-ink-800">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-2xl bg-info-soft p-5 text-sm text-ink-800/80">
              Trade-in values, payout method and collection options come from each participating
              shop, so they are confirmed once the shop reviews your device.
            </p>
            <Link
              to="/help"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ask about a trade-in
              <Icon name="alt-arrow-right-linear" className="h-4 w-4" />
            </Link>
          </div>
          <ImageStage category="smartphones" ratio="portrait" tone="stage" />
        </div>
      </section>
    </>
  );
}
