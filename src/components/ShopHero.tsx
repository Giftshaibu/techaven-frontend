import type { CatalogShop } from "@/lib/catalog-api";
export function ShopHero({ shop }: { shop: CatalogShop }) {
  const profile = shop.profile;
  return <section className="bg-stage"><div className="shell grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_240px] md:py-14">
    <div><p className="mb-3 text-sm text-brand-700">{shop.location}</p><h1 className="text-4xl font-bold tracking-tight text-ink-800">{shop.name}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-800">{shop.blurb}</p>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        {[["Visit",shop.address],["Delivery",profile?.delivery],["Warranty",profile?.warranty],["Prices",profile?.tax_note]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt className="font-semibold text-ink-800">{label}</dt><dd className="mt-1 leading-relaxed text-muted-foreground">{value}</dd></div>)}
      </dl><div className="mt-6 flex flex-wrap gap-3">
        {[shop.phone,profile?.secondary_phone].filter(Boolean).map(phone=><a key={phone} href={`tel:${phone}`} className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white">Call {phone}</a>)}
        {profile?.website&&<a href={profile.website} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold">Visit website</a>}
      </div>
      {profile?.enquiries?.map(item=><div key={item.name} className="mt-6 border-t border-border pt-5"><h2 className="text-lg font-semibold">{item.name} · {item.storage_gb} GB</h2><p className="mt-1 text-sm text-muted-foreground">Pre-owned · Seller states {item.battery_health_percent}% battery health</p><p className="mt-2 font-semibold">{item.price_label}</p>{shop.phone&&<a href={`tel:${shop.phone}`} className="mt-2 inline-block text-sm underline">Ask the shop for a price</a>}</div>)}
    </div>{(shop.logoUrl||profile?.gallery?.[0])&&<div className="flex items-center justify-center"><img src={shop.logoUrl??profile?.gallery?.[0]?.url} alt={shop.logoUrl?`${shop.name} logo`:profile?.gallery?.[0]?.alt} className="max-h-56 w-full rounded-xl bg-white object-contain p-4" /></div>}
  </div></section>;
}
