import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { categories as fallbackCategories, popularBrands, shops as fallbackShops } from "@/data/catalog";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { enrichCategoryIcons, mapApiCategoryToCatalog, mapApiShopToCatalog } from "@/lib/catalog-api";
import { useTechavenCategories, useTechavenShops } from "@/lib/techaven-hooks";
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
    <Link to="/" className="flex items-center" aria-label="Techaven home">
      <img src="/techaven-logo-transparent.png" alt="Techaven" className="h-[30px] w-auto" />
    </Link>
  );
}

function SearchField({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
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
        onNavigate?.();
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

function MegaMenu({
  slug,
  categories,
  shops,
}: {
  slug: string;
  categories: typeof fallbackCategories;
  shops: typeof fallbackShops;
}) {
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  const featuredShops = shops.slice(0, 3);

  return (
    <div className="absolute left-0 right-0 top-full z-40 hidden border-b border-border bg-surface shadow-[0_12px_24px_-18px_rgba(5,5,38,0.35)] group-hover:block">
      <div className="shell grid gap-8 py-8 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-normal text-ink-800">
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
          <h3 className="mb-3 text-sm font-semibold tracking-normal text-ink-800">Brands</h3>
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
          <h3 className="mb-3 text-sm font-semibold tracking-normal text-ink-800">
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
          <p className="text-sm font-semibold tracking-normal text-brand-700">Techaven</p>
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
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const apiCategories = useTechavenCategories();
  const apiShops = useTechavenShops();
  const categories =
    apiCategories.data && apiCategories.data.length > 0
      ? enrichCategoryIcons(apiCategories.data.map(mapApiCategoryToCatalog))
      : fallbackCategories;
  const shops =
    apiShops.data && apiShops.data.length > 0
      ? apiShops.data.map(mapApiShopToCatalog)
      : fallbackShops;
  const [announcement, setAnnouncement] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileNav) return;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNav(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [mobileNav]);

  const closeMobileNav = () => setMobileNav(false);

  return (
    <header className="sticky top-0 z-50 bg-surface shadow-[0_1px_0_rgba(5,5,38,0.04)]">
      {announcement && !scrolled ? (
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

      <div
        className={cn(
          "hidden border-b border-border bg-neutral-050 transition-[max-height,opacity] duration-200 lg:block",
          scrolled ? "max-h-0 overflow-hidden opacity-0" : "max-h-10 opacity-100",
        )}
      >
        <div className="shell flex items-center justify-end gap-5 py-1.5 text-xs text-muted-foreground">
          {utilityLinks.map((link) => (
            <Link key={link.label} to={link.to} className="hover:text-brand-500 hover:underline">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-b border-border">
        <div
          className={cn(
            "shell flex items-center gap-4 transition-[padding] duration-200",
            scrolled ? "py-2" : "py-3",
          )}
        >
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileNav}
            aria-controls="mobile-navigation"
            className="grid h-11 w-11 place-items-center rounded-lg text-ink-800 transition-colors hover:bg-stage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Icon name="hamburger-menu-linear" className="h-6 w-6" />
          </button>

          <div
            className={cn(
              "transition-transform duration-200",
              scrolled && "scale-[0.9] origin-left",
            )}
          >
            <Wordmark />
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <SearchField />
          </div>

          <nav className="ml-auto flex items-center gap-1">
            <Link
              to="/products"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:text-brand-500 lg:block"
            >
              Products
            </Link>
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
            {signedIn ? (
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
              to={signedIn ? "/account/saved" : "/auth"}
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

        {!scrolled ? (
          <div className="shell pb-3 md:hidden">
            <SearchField mobile />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "relative hidden border-b border-border bg-surface transition-[max-height,opacity] duration-200 lg:block",
          scrolled ? "max-h-0 overflow-hidden opacity-0" : "max-h-14 opacity-100",
        )}
      >
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
              <MegaMenu slug={category.slug} categories={categories} shops={shops} />
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
        <div className="fixed inset-0 z-[70] lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileNav}
            className="absolute inset-0 bg-ink-900/55"
          />
          <aside
            ref={drawerRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 flex w-[min(92vw,390px)] flex-col bg-surface shadow-[12px_0_32px_-16px_rgba(5,5,38,0.45)]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Wordmark />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobileNav}
                aria-label="Close navigation menu"
                className="grid h-11 w-11 place-items-center rounded-lg text-ink-800 transition-colors hover:bg-stage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon name="close-square-linear" className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
              <SearchField mobile onNavigate={closeMobileNav} />

              <section className="mt-5" aria-labelledby="quick-access-heading">
                <h2
                  id="quick-access-heading"
                  className="text-sm font-semibold tracking-normal text-ink-800"
                >
                  Quick access
                </h2>
                <nav className="mt-2" aria-label="Quick access">
                  {[
                    {
                      label: signedIn ? "Account" : "Sign in",
                      to: signedIn ? "/account" : "/auth",
                      icon: "user-circle-linear",
                    },
                    {
                      label: "Saved",
                      to: signedIn ? "/account/saved" : "/auth",
                      icon: "heart-linear",
                    },
                    {
                      label: count ? `Basket ${count}` : "Basket",
                      to: "/cart",
                      icon: "cart-large-2-linear",
                    },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      to={item.to as any}
                      onClick={closeMobileNav}
                      className="flex min-h-12 items-center gap-3 px-1 py-2 text-[15px] font-medium text-ink-800 transition-colors hover:text-brand-500 active:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon
                        name={item.icon}
                        className="h-[22px] w-[22px] shrink-0 text-brand-500"
                      />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </section>

              <section className="mt-6" aria-labelledby="shop-category-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id="shop-category-heading"
                    className="text-sm font-semibold tracking-normal text-ink-800"
                  >
                    Shop by category
                  </h2>
                  <Link
                    to="/categories"
                    onClick={closeMobileNav}
                    className="text-xs font-semibold text-brand-500 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <nav className="mt-2 divide-y divide-border" aria-label="Product categories">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      onClick={closeMobileNav}
                      className="flex min-h-12 items-center justify-between gap-3 py-2.5 text-[15px] font-medium text-ink-800 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span>{category.name}</span>
                      <Icon
                        name="alt-arrow-right-linear"
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </Link>
                  ))}
                </nav>
              </section>

              <section className="mt-6" aria-labelledby="explore-heading">
                <h2
                  id="explore-heading"
                  className="text-sm font-semibold tracking-normal text-ink-800"
                >
                  Explore Techaven
                </h2>
                <nav className="mt-2 grid grid-cols-2 gap-2" aria-label="Marketplace shortcuts">
                  {[
                    { label: "Deals", to: "/deals", icon: "sale-square-linear" },
                    { label: "All products", to: "/products", icon: "box-minimalistic-linear" },
                    { label: "Shops", to: "/shops", icon: "shop-linear" },
                    { label: "Compare", to: "/compare", icon: "scale-linear" },
                    { label: "Trade-in", to: "/trade-in", icon: "smartphone-update-linear" },
                    { label: "Help", to: "/help", icon: "question-circle-linear" },
                    { label: "Track order", to: "/help", icon: "delivery-linear" },
                    { label: "Catalogs", to: "/catalogs", icon: "notebook-bookmark-linear" },
                    { label: "Categories", to: "/categories", icon: "widget-4-linear" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      to={item.to as any}
                      onClick={closeMobileNav}
                      className="flex min-h-12 items-center gap-2.5 rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800 active:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </section>

              <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                Popular brands: {popularBrands.slice(0, 6).join(" · ")}
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
