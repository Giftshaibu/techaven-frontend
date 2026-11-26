import { ContactInfo, TECHAVEN_PHONE } from "./ContactInfo";
import { useQuery } from "@tanstack/react-query";
import { techavenRequest } from "@/integrations/techaven/client";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Phone } from "lucide-react";
import { categories } from "@/data/catalog";
import { useShopsTabVisible } from "@/lib/techaven-hooks";

const socialProfiles = [
  { label: "X", url: import.meta.env["VITE_TECHAVEN_X_URL"], icon: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.4L5.5 22H2.4l7.3-8.4L2 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.5 4H5.7l12.1 16Z" /></svg> },
  { label: "Facebook", url: import.meta.env["VITE_TECHAVEN_FACEBOOK_URL"], icon: <Facebook className="size-4" aria-hidden="true" /> },
  { label: "Instagram", url: import.meta.env["VITE_TECHAVEN_INSTAGRAM_URL"], icon: <Instagram className="size-4" aria-hidden="true" /> },
];

function ContactLinks() {
  const links = [
    { label: "WhatsApp", url: `https://wa.me/${TECHAVEN_PHONE.slice(1)}`, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.4-1.3l-.3-.2-2.5.7.7-2.4-.2-.4A8 8 0 1 1 12 20Zm4.5-6.2c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.2l-.7.8c-.1.2-.3.2-.6.1a7 7 0 0 1-3.3-2.9c-.2-.3 0-.4.1-.5l.5-.6c.1-.2.2-.3.1-.5L9.5 8c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.2.3-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.7 2.6 4.2 3.7 1.9.8 2.6.7 3.3.6.5-.1 1.4-.6 1.6-1.2.2-.5.2-1 .1-1.1l-.6-.5Z" /></svg> },
    { label: "Call Techaven", url: `tel:${TECHAVEN_PHONE}`, icon: <Phone className="size-4" aria-hidden="true" /> },
    ...socialProfiles.filter(({ url }) => typeof url === "string" && /^https:\/\//i.test(url)),
  ];
  return (
    <div className="my-4 flex flex-wrap gap-2.5">
      {links.map(({ label, url, icon }) => (
        <a key={label} href={url} aria-label={label} className="grid size-11 place-items-center rounded-full border border-white/20 hover:bg-white/15 focus-visible:outline focus-visible:outline-2">
          {icon}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  const config = useQuery({
    queryKey: ["footer-config"],
    queryFn: () =>
      techavenRequest<{ legal: { privacy: string; terms: string } }>("/api/commerce-config"),
    staleTime: 300000,
  });
  const showShops = useShopsTabVisible();
  return (
    <footer className="bg-ink-900 text-white">
      <div className="shell py-7 md:hidden">
        <img
          src="/techaven-logo-transparent.png"
          alt="Techaven"
          className="h-7 w-auto brightness-0 invert"
        />
        <p className="mt-3 text-sm text-white/70">Shop electronics from Malawian shops.</p>
        <ContactInfo className="my-3 text-white/85" />
        <ContactLinks />
        {[
          {
            title: "Shop",
            links: [
              { label: "Products", to: "/products" },
              { label: "Shops", to: "/shops" },
              { label: "Deals", to: "/deals" },
            ].filter((link) => showShops || link.to !== "/shops"),
          },
          {
            title: "Help",
            links: [
              { label: "Help centre", to: "/help" },
              { label: "Your orders", to: "/account/orders" },
              { label: "Trade-in", to: "/trade-in" },
            ],
          },
          { title: "Company", links: [{ label: "About Techaven", to: "/help" }] },
        ].map((group) => (
          <details key={group.title} className="border-t border-white/15">
            <summary className="cursor-pointer py-4 text-sm font-semibold">{group.title}</summary>
            <ul className="pb-3">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to as "/help"}
                    className="inline-flex min-h-11 items-center text-sm text-white/80"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
        <div className="flex flex-wrap gap-4 border-t border-white/15 pt-4 text-xs">
          <a href={config.data?.legal?.privacy || "/help"} className="py-2 underline">
            Privacy
          </a>
          <a href={config.data?.legal?.terms || "/help"} className="py-2 underline">
            Terms
          </a>
        </div>
        <p className="mt-3 text-xs text-white/60">
          © {new Date().getFullYear()} Techaven · Prices in MWK
        </p>
      </div>
      <div className="hidden md:block">
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
                <ContactInfo className="mt-4 text-white/85" />
                <ContactLinks />
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

              {showShops ? (
                <div>
                  <h3 className="text-sm font-semibold tracking-normal text-white">Stores</h3>
                  <ul className="mt-4 space-y-2.5 text-sm">
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
              ) : null}

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
                  <p className="text-sm text-white/65">Contact Techaven through the help centre</p>
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
            {import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY?.trim().startsWith("pk_") && (
              <a href="https://www.logo.dev/" className="hover:underline">Logos provided by Logo.dev</a>
            )}
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
      </div>
    </footer>
  );
}
