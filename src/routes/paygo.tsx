import { createFileRoute, Link } from "@tanstack/react-router";
import { getCategories, getMarketplaceDevices, getShops } from "@/integrations/techaven/customer";
import { mapApiShopToCatalog, mapMarketplaceDeviceToCatalog } from "@/lib/catalog-api";
import { ShopCard } from "@/components/ShopCard";
import { ProductGrid } from "@/components/ProductGrid";

export const Route = createFileRoute("/paygo")({
  loader: async () => {
    const [categories, shops] = await Promise.all([getCategories(), getShops()]);
    const category = categories.find(c => c.name === "Pay as you go (PAYGO)" || c.name === "Loans");
    const results = category ? await getMarketplaceDevices({ category_id: category.id, limit: 100 }) : { devices: [] };
    return { shops: shops.filter(s => s.profile?.paygo).map(mapApiShopToCatalog), products: results.devices.map(mapMarketplaceDeviceToCatalog) };
  },
  head: () => ({ meta: [{ title: "Pay as you go (PAYGO) — Techaven" }, { name: "description", content: "Explore participating phone shops and learn how payment plans work in Malawi." }] }),
  component: PaygoPage,
});
function PaygoPage() {
  const { shops, products } = Route.useLoaderData();
  return <>
    <section className="bg-brand-100"><div className="shell py-12 md:py-16"><p className="mb-3 text-sm text-brand-700">Payment plans</p><h1 className="text-4xl font-bold text-ink-800">Pay as you go (PAYGO)</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-800">Explore phones available with installment plans. Speak to the shop about the deposit, repayment schedule and total cost before applying.</p><a href="#yellow-guide" className="mt-6 inline-block rounded-lg bg-ink-900 px-5 py-3 text-sm font-semibold text-white">Read the Yellow payment-plan guide</a></div></section>
    <section className="shell py-10"><h2 className="mb-5 text-2xl font-bold">Participating shops</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shops.map(shop=><ShopCard key={shop.slug} shop={shop} />)}</div></section>
    <section className="shell pb-12"><h2 className="mb-5 text-2xl font-bold">Available phones</h2><p className="mb-5 text-sm text-muted-foreground">Displayed amounts are cash prices, not the total installment cost. Innovative Electronics’ quoted prices exclude VAT.</p><ProductGrid products={products} /></section>
    <article id="yellow-guide" className="border-t border-border bg-stage"><div className="shell py-12"><div className="max-w-3xl">
      <img src="/yellow-logo.png" alt="Yellow — Live better" className="mb-7 h-20 w-auto rounded-lg" />
      <h2 className="text-3xl font-bold">A guide to Yellow payment plans in Malawi</h2>
      <p className="mt-4 leading-relaxed">Yellow offers payment plans for smartphones and solar energy systems. Start at the <a className="underline" href="https://yellow.africa/" target="_blank" rel="noopener noreferrer">official Yellow website</a> and select Malawi, or ask a participating shop about the application process.</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">The details below summarise the supplied Yellow advertisements. Eligibility, deposits and payment channels can change; confirm the current Malawi terms directly with Yellow before submitting an application or making a payment. The supplied buy portal ends in /zm, so it is not presented here as a verified Malawi application link.</p>
      <h3 className="mt-7 text-xl font-semibold">Deposits and repayments</h3><p className="mt-3 leading-relaxed">The supplied adverts describe deposits of roughly 25–34% and repayment periods of 6–12 months, with some agreements offering 3, 6, 9 or 12 months. The schedule depends on the product and approved agreement. Ask for the complete repayment total, payment dates and any fees.</p>
      <h3 className="mt-7 text-xl font-semibold">Devices and PAYGO locking</h3><p className="mt-3 leading-relaxed">Advertised phone brands include Samsung, Tecno, itel and Infinix. PAYGO technology can restrict a device or solar system while payments are outstanding. Confirm how missed payments affect access and when the device is fully unlocked.</p>
      <h3 className="mt-7 text-xl font-semibold">What to prepare</h3><ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed"><li>A valid National ID; the supplied Malawi advert states an age range of 21–60.</li><li>Proof of income, such as a payslip, mobile-money statement or bank statement.</li><li>Contact numbers for two guarantors.</li><li>Consent to the required credit assessment; approval is subject to Yellow’s checks.</li></ul>
      <h3 className="mt-7 text-xl font-semibold">Making payments</h3><p className="mt-3 leading-relaxed">Use the payment instructions attached to your approved agreement. The supplied Malawi post lists Airtel *3020#, TNM *444# and Airtel support number 3020. Confirm these channels with Yellow and check the recipient before paying.</p>
      <div className="mt-7 flex flex-wrap gap-4 text-sm"><a className="underline" href="https://yellow.africa/smartphone" target="_blank" rel="noopener noreferrer">Yellow smartphones</a><a className="underline" href="https://yellow.africa/solar" target="_blank" rel="noopener noreferrer">Yellow solar</a><a className="underline" href="https://www.facebook.com/YellowMalawi/" target="_blank" rel="noopener noreferrer">Yellow Malawi</a><Link to="/shops" className="underline">Browse local shops</Link></div>
    </div></div></article>
  </>;
}
