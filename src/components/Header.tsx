import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/Icon";
import {
  categories as fallbackCategories,
  popularBrands,
  shops as fallbackShops,
} from "@/data/catalog";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import {
  enrichCategoryIcons,
  mapApiCategoryToCatalog,
  mapApiShopToCatalog,
} from "@/lib/catalog-api";
import { useTechavenCategories, useTechavenShops } from "@/lib/techaven-hooks";
import { cn } from "@/lib/utils";
import { ctaHref, getPromotions, matchesTarget, type Promotion } from "@/lib/cms/promotions";
import { PromotionMedia } from "@/components/promotions/PromotionPrimitives";
import { BrandTiles } from "@/components/BrandTiles";

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
  promotion,
  open,
  menuId,
  onEnter,
  onLeave,
  onNavigate,
}: {
  slug: string;
  categories: typeof fallbackCategories;
  shops: typeof fallbackShops;
  promotion?: Promotion;
  open: boolean;
  menuId: string;
  onEnter: () => void;
  onLeave: () => void;
  onNavigate: () => void;
}) {
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  const featuredShops = shops.slice(0, 3);

  if (category.brandTiles?.length) return (
    <div id={menuId} role="region" aria-label={`${category.name} menu`} onPointerEnter={onEnter} onPointerLeave={onLeave}
      className={cn("absolute left-0 right-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-border bg-surface", open ? "block" : "hidden")}>
      <div className="shell grid gap-8 py-7 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="border-r border-border pr-6">
          <h3 className="text-sm font-semibold text-ink-800">Explore {category.name.toLowerCase()}</h3>
          <Link to="/category/$slug" params={{ slug: category.slug }} onClick={onNavigate} className="mt-5 block text-sm underline underline-offset-4">See all {category.name.toLowerCase()}</Link>
          <Link to="/shops" onClick={onNavigate} className="mt-4 block text-sm hover:underline">Browse shops</Link>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">Compare available models and prices from local shops.</p>
        </aside>
        <div className="min-w-0"><div className="mb-5 flex items-center justify-between"><h3 className="text-sm font-semibold">Shop by brand</h3>
          <Link to="/category/$slug" params={{ slug: category.slug }} onClick={onNavigate} className="text-xs underline">See all</Link></div>
          <BrandTiles category={category} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );


  return (
    <div
      id={menuId}
      role="region"
      aria-label={`${category.name} menu`}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={cn(
        "absolute left-0 right-0 top-full z-40 border-b border-border bg-surface shadow-[0_12px_24px_-18px_rgba(5,5,38,0.35)]",
        open ? "block" : "hidden",
      )}
    >
      <div
        className={cn(
          "shell grid gap-8 py-8",
          promotion ? "lg:grid-cols-[1.1fr_0.9fr_0.9fr_1.2fr]" : "lg:grid-cols-3",
        )}
      >
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
                  onClick={onNavigate}
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
                  onClick={onNavigate}
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
                  onClick={onNavigate}
                >
                  {shop.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {promotion ? (
          <div className="overflow-hidden rounded-2xl bg-brand-100">
            <PromotionMedia
              promotion={promotion}
              ratio="compact"
              className="max-h-36 rounded-none"
            />
            <div className="p-5">
              <p className="text-lg font-bold leading-snug text-brand-800">{promotion.headline}</p>
              {promotion.subheadline ? (
                <p className="mt-2 text-sm text-brand-800/75">{promotion.subheadline}</p>
              ) : null}
              {promotion.cta && ctaHref(promotion.cta) ? (
                <a
                  href={ctaHref(promotion.cta)!}
                  onClick={onNavigate}
                  className="mt-4 inline-flex rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {promotion.cta.label}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
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
  const announcementPromotion = useQuery({
    queryKey: ["promotions", "site_announcement"],
    queryFn: () => getPromotions("site_announcement"),
  }).data?.[0];
  const menuPromotions =
    useQuery({
      queryKey: ["promotions", "header_mega_menu"],
      queryFn: () => getPromotions("header_mega_menu"),
    }).data ?? [];
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeMenuTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const cancelMenuClose = useCallback(() => {
    if (closeMenuTimer.current) window.clearTimeout(closeMenuTimer.current);
    closeMenuTimer.current = null;
  }, []);
  const showMenu = useCallback(
    (slug: string) => {
      cancelMenuClose();
      setOpenMenu(slug);
    },
    [cancelMenuClose],
  );
  const scheduleMenuClose = useCallback(() => {
    cancelMenuClose();
    closeMenuTimer.current = window.setTimeout(() => setOpenMenu(null), 180);
  }, [cancelMenuClose]);
  const closeMenu = useCallback(() => {
    cancelMenuClose();
    setOpenMenu(null);
  }, [cancelMenuClose]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (scrolled) closeMenu();
  }, [closeMenu, scrolled]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (openMenu && !headerRef.current?.contains(event.target as Node)) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelMenuClose();
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [cancelMenuClose, closeMenu, openMenu]);

  useEffect(() => {
    if (
      announcementPromotion &&
      sessionStorage.getItem(`dismissed-promotion:${announcementPromotion.id}`) === "1"
    ) {
      setAnnouncement(false);
    }
  }, [announcementPromotion]);

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
    <header
      ref={headerRef}
      className="sticky top-0 z-50 bg-surface shadow-[0_1px_0_rgba(5,5,38,0.04)]"
    >
      {announcement && !scrolled && announcementPromotion ? (
        <div className="bg-ink-900 text-white">
          <div className="shell flex items-center justify-center gap-3 py-2 text-[13px]">
            <p className="text-center">
              {announcementPromotion.headline}
              {announcementPromotion.cta && ctaHref(announcementPromotion.cta) ? (
                <>
                  {" "}
                  —{" "}
                  <a href={ctaHref(announcementPromotion.cta)!} className="font-semibold underline">
                    {announcementPromotion.cta.label}
                  </a>
                </>
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => {
                setAnnouncement(false);
                if (announcementPromotion)
                  sessionStorage.setItem(`dismissed-promotion:${announcementPromotion.id}`, "1");
              }}
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
            <div
              key={category.slug}
              onPointerEnter={() => showMenu(category.slug)}
              onPointerLeave={scheduleMenuClose}
              onFocus={() => showMenu(category.slug)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  scheduleMenuClose();
                }
              }}
            >
              <Link
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="inline-flex rounded-full px-3 py-1.5 font-medium text-ink-800 hover:bg-stage"
                aria-expanded={openMenu === category.slug}
                aria-controls={`mega-menu-${category.slug}`}
                onClick={closeMenu}
              >
                {category.name}
              </Link>
              <MegaMenu
                slug={category.slug}
                categories={categories}
                shops={shops}
                promotion={menuPromotions.find((p) =>
                  matchesTarget(p, { categorySlug: category.slug }),
                )}
                open={openMenu === category.slug}
                menuId={`mega-menu-${category.slug}`}
                onEnter={() => showMenu(category.slug)}
                onLeave={scheduleMenuClose}
                onNavigate={closeMenu}
              />
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
