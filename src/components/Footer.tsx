import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { categories, shops } from "@/data/catalog";

export function Footer() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500">
              <Icon name="bolt-circle-bold" className="h-5 w-5" />
            </span>
            <span className="text-[19px] font-extrabold tracking-tight">Techaven</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Malawi's electronics mall. Many shops, one trusted place to buy phones, laptops, audio
            and everything around them.
          </p>
          <div className="mt-6 flex gap-2">
            {["facebook", "instagram", "whatsapp", "tiktok"].map((name) => (
              <span
                key={name}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
                aria-hidden
              >
                <Icon name="global-linear" className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-white/50">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="text-white/80 hover:text-white hover:underline"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/deals" className="text-white/80 hover:text-white hover:underline">
                Deals
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-white/50">Shops</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {shops.slice(0, 5).map((s) => (
              <li key={s.slug}>
                <Link
                  to="/shops/$shopSlug"
                  params={{ shopSlug: s.slug }}
                  className="text-white/80 hover:text-white hover:underline"
                >
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shops" className="text-white/80 hover:text-white hover:underline">
                All shops
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-white/50">Techaven</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { label: "Buyer protection", to: "/help" },
              { label: "Trade-in", to: "/trade-in" },
              { label: "Compare", to: "/compare" },
              { label: "Catalogs", to: "/catalogs" },
              { label: "Help centre", to: "/help" },
            ].map((l) => (
              <li key={l.label}>
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={l.to as any}
                  className="text-white/80 hover:text-white hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-white/60">
          <p>© {new Date().getFullYear()} Techaven. All prices in Malawi kwacha.</p>
          <p>Demo catalogue — products and shops shown are placeholders.</p>
        </div>
      </div>
    </footer>
  );
}
