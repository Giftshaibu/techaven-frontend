import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { categories, popularBrands, shops } from "@/data/catalog";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const utilityLinks = [
  { label: "How Techaven works", to: "/help" },
  { label: "Help", to: "/help" },
  { label: "Track order", to: "/help" },
  { label: "Sell on Techaven", to: "/help" },
];

const searchExamples = ["iPhone 15", "gaming laptop", "wireless earbuds", "4K TV", "power bank"];

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Techaven home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white">
        <Icon name="bolt-circle-bold" className="h-5 w-5" />
      </span>
      <span className="text-[19px] font-extrabold tracking-tight text-ink-800">Techaven</span>
    </Link>
  );
}

function SearchField({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setExampleIndex((i) => (i + 1) % searchExamples.length),
      3200,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/search", search: { q: value } });
      }}
      className={cn("relative w-full", !mobile && "max-w-[680px]")}
    >
      <Icon
        name="magnifer-linear"
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Search ${searchExamples[exampleIndex]}`}
        aria-label="Search Techaven"
        className="h-11 w-full rounded-full bg-stage pl-11 pr-24 text-[15px] text-ink-800 outline-none ring-brand-500 placeholder:text-muted-foreground focus:bg-surface focus:ring-2"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 h-8 rounded-full bg-brand-500 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Search
      </button>
    </form>
  );
}

function MegaMenu({ slug }: { slug: string }) {
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  const featuredShops = shops.slice(0, 3);

  return (
    <div className="absolute left-0 right-0 top-full z-40 hidden border-b border-border bg-surface shadow-[0_12px_24px_-18px_rgba(5,5,38,0.35)] group-hover:block">
      <div className="shell grid gap-8 py-8 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Shop {category.name.toLowerCase()}
          </h3>
          <ul className="space-y-2 text-sm">
            {category.subcategories.map((sub) => (
              <li key={sub}>
                <Link
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  className="text-ink-800 hover:text-brand-500 hover:underline"
                >
                  {sub}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Brands
          </h3>
          <ul className="space-y-2 text-sm">
            {category.brands.map((brand) => (
              <li key={brand}>
                <Link
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  search={{ brand }}
                  className="text-ink-800 hover:text-brand-500 hover:underline"
                >
                  {brand}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Featured shops
          </h3>
          <ul className="space-y-2 text-sm">
            {featuredShops.map((shop) => (
              <li key={shop.slug}>
                <Link
                  to="/shops/$shopSlug"
                  params={{ shopSlug: shop.slug }}
                  className="text-ink-800 hover:text-brand-500 hover:underline"
                >
                  {shop.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-brand-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700">
            Techaven
          </p>
          <p className="mt-2 text-lg font-bold leading-snug text-brand-800">
            Compare {category.name.toLowerCase()} side by side
          </p>
          <Link
            to="/compare"
            className="mt-4 inline-flex rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Start comparing
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const { count } = useCart();
  const { session } = useAuth();
  const [announcement, setAnnouncement] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface">
      {announcement ? (
        <div className="bg-ink-900 text-white">
          <div className="shell flex items-center justify-center gap-3 py-2 text-[13px]">
            <Icon name="box-minimalistic-linear" className="h-4 w-4 shrink-0" />
            <p className="text-center">
              Free delivery on orders over MWK 900,000 —{" "}
              <Link to="/deals" className="font-semibold underline">
                see this week's deals
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setAnnouncement(false)}
              aria-label="Dismiss announcement"
              className="ml-2 shrink-0 opacity-70 hover:opacity-100"
            >
              <Icon name="close-circle-linear" className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="hidden border-b border-border bg-neutral-050 lg:block">
        <div className="shell flex items-center justify-end gap-5 py-1.5 text-xs text-muted-foreground">
          {utilityLinks.map((link) => (
            <Link key={link.label} to={link.to} className="hover:text-brand-500 hover:underline">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-b border-border">
        <div className="shell flex items-center gap-4 py-3">
          <button
            type="button"
            onClick={() => setMobileNav((v) => !v)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-800 lg:hidden"
          >
            <Icon name={mobileNav ? "close-square-linear" : "hamburger-menu-linear"} className="h-6 w-6" />
          </button>

          <Wordmark />

          <div className="hidden flex-1 justify-center md:flex">
            <SearchField />
          </div>

          <nav className="ml-auto flex items-center gap-1">
            <Link
              to="/shops"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:text-brand-500 lg:block"
            >
              Shops
            </Link>
            <Link
              to="/compare"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:text-brand-500 lg:block"
            >
              Compare
            </Link>
            <Link
              to="/trade-in"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:text-brand-500 lg:block"
            >
              Trade-in
            </Link>
            {session ? (
              <Link
                to="/account"
                aria-label="Your account"
                className="grid h-10 w-10 place-items-center rounded-lg text-brand-500 hover:text-brand-700"
              >
                <Icon name="user-circle-bold" className="h-[22px] w-[22px]" />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink-800 hover:text-brand-500"
              >
                <Icon name="user-circle-linear" className="h-[22px] w-[22px]" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
            <Link
              to={session ? "/account/saved" : "/auth"}
              aria-label="Saved products"
              className="hidden h-10 w-10 place-items-center rounded-lg text-ink-800 hover:text-brand-500 sm:grid"
            >
              <Icon name="heart-linear" className="h-[22px] w-[22px]" />
            </Link>
            <Link
              to="/cart"
              aria-label="Basket"
              className="relative grid h-10 w-10 place-items-center rounded-lg text-ink-800 hover:text-brand-500"
            >
              <Icon name="cart-large-2-linear" className="h-[22px] w-[22px]" />
              {count > 0 ? (
                <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          </nav>
        </div>

        <div className="shell pb-3 md:hidden">
          <SearchField mobile />
        </div>
      </div>

      <div className="relative hidden border-b border-border bg-surface lg:block">
        <div className="shell flex items-center gap-1 overflow-visible py-2 text-sm">
          <Link
            to="/deals"
            className="rounded-full px-3 py-1.5 font-semibold text-brand-500 hover:bg-brand-100"
          >
            Deals
          </Link>
          {categories.slice(0, 7).map((category) => (
            <div key={category.slug} className="group">
              <Link
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="inline-flex rounded-full px-3 py-1.5 font-medium text-ink-800 hover:bg-stage"
              >
                {category.name}
              </Link>
              <MegaMenu slug={category.slug} />
            </div>
          ))}
          <Link
            to="/categories"
            className="rounded-full px-3 py-1.5 font-medium text-ink-800 hover:bg-stage"
          >
            More
          </Link>
          <Link
            to="/trade-in"
            className="ml-auto rounded-full px-3 py-1.5 font-medium text-ink-800 hover:bg-stage"
          >
            Trade-in
          </Link>
        </div>
      </div>

      {mobileNav ? (
        <div className="border-b border-border bg-surface lg:hidden">
          <nav className="shell grid gap-1 py-4">
            <Link to="/deals" className="py-2 font-semibold text-brand-500">
              Deals
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                to="/category/$slug"
                params={{ slug: category.slug }}
                onClick={() => setMobileNav(false)}
                className="py-2 text-[15px] font-medium text-ink-800"
              >
                {category.name}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              {[
                { label: "All categories", to: "/categories" },
                { label: "Shops", to: "/shops" },
                { label: "Catalogs", to: "/catalogs" },
                { label: "Compare", to: "/compare" },
                { label: "Trade-in", to: "/trade-in" },
                { label: "Help", to: "/help" },
                session
                  ? { label: "Your account", to: "/account" }
                  : { label: "Sign in", to: "/auth" },
              ].map((l) => (
                <Link
                  key={l.label}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={l.to as any}
                  onClick={() => setMobileNav(false)}
                  className="block py-2 text-[15px] text-ink-800"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Popular brands: {popularBrands.slice(0, 6).join(" · ")}
            </p>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
