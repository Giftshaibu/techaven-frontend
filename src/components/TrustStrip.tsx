import { Icon } from "@/components/Icon";

const items = [
  {
    icon: "shield-check-linear",
    title: "Buyer protection",
    body: "Every order is covered until the device is in your hands and working.",
  },
  {
    icon: "verified-check-linear",
    title: "Verified shops",
    body: "Shops are checked before they can sell on Techaven.",
  },
  {
    icon: "box-linear",
    title: "Delivery or pickup",
    body: "Nationwide delivery, or collect in store where the shop offers it.",
  },
  {
    icon: "refresh-circle-linear",
    title: "Trade-in ready",
    body: "Put your old device towards the price of the new one.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="shell grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-info-soft text-brand-700">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink-800">{item.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
