import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { categories, shops } from "@/data/catalog";

export function Footer() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="shell py-12 md:py-16 lg:py-20">
        <div className="bg-ink-900 px-0 py-8 md:px-0 lg:px-0">
          <div className="grid gap-10 border-0 lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.85fr_0.85fr] lg:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center">
                <img
                  src="/techaven-logo-transparent.png"
                  alt="Techaven"
                  className="h-[30px] w-auto brightness-0 invert"
                />
              </div>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/70 md:text-[15px]">
                Malawi's electronics mall. From phones and laptops to home gear and audio,
                everything is gathered in one trusted place.
              </p>
              <div className="mt-6 flex gap-2.5">
                {["facebook", "instagram", "whatsapp", "tiktok"].map((name) => (
                  <span
                    key={name}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5"
                    aria-hidden
                  >
                    <Icon name="global-linear" className="h-4 w-4" />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-normal text-white">Shop</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {categories.slice(0, 6).map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="text-white/80 transition-colors hover:text-white hover:underline"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/deals"
                    className="text-white/80 transition-colors hover:text-white hover:underline"
                  >
                    Deals
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-normal text-white">Stores</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {shops.slice(0, 5).map((s) => (
                  <li key={s.slug}>
                    <Link
                      to="/shops/$shopSlug"
                      params={{ shopSlug: s.slug }}
                      className="text-white/80 transition-colors hover:text-white hover:underline"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/shops"
                    className="text-white/80 transition-colors hover:text-white hover:underline"
                  >
                    All shops
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-normal text-white">Help</h3>
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
                      className="text-white/80 transition-colors hover:text-white hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-normal text-white">Company</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: "About Techaven", to: "/" },
                  { label: "Careers", to: "/help" },
                  { label: "Shipping", to: "/help" },
                  { label: "Privacy", to: "/help" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      to={l.to as any}
                      className="text-white/80 transition-colors hover:text-white hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 md:pt-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-white/65">hello@techaven.mw • +265 999 000 000</p>
                <p className="mt-1 text-sm text-white/65">Lilongwe • Blantyre • Mzuzu</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs tracking-normal text-white/50">
                <span>Newsletter</span>
                <span>WhatsApp</span>
                <span>Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-ink-900">
        <div className="shell flex flex-col gap-3 py-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Techaven. All prices in Malawi kwacha.</p>
          <p>Demo catalogue — products and shops shown are placeholders.</p>
        </div>
      </div>

      <div className="bg-ink-900 pb-7 text-white">
        <div className="shell overflow-hidden">
          <div className="border-t border-white/10 pt-5 text-center">
            <img
              src="/techaven-logo-transparent.png"
              alt="Techaven"
              className="mx-auto block w-full max-w-[1400px] brightness-0 invert opacity-90"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
