# Techaven Commerce Design Language

> **Purpose:** This file defines how Techaven should look, feel, and behave across desktop and mobile. It is written for design/code agents and should be treated as the visual source of truth.
>
> **Design direction:** Keep Techaven recognizably Techaven, but raise the desktop commerce experience to the clarity, density, trust, and editorial confidence of mature marketplaces such as Back Market. Do not reproduce Back Market branding, logos, copy, proprietary artwork, or licensed font files. Reuse interaction ideas and layout principles, then express them through Techaven's own palette, marketplace model, content, and components.

---

## 1. Brand premise

Techaven is not a single electronics retailer. It is a **digital electronics mall made up of many shops**. The interface must communicate three things at the same time:

1. **This is one trusted marketplace.** Users should feel they are shopping inside Techaven, not bouncing between unrelated seller sites.
2. **Products come from real shops.** Store identity, seller trust, catalog ownership, and shop browsing are first-class parts of the product.
3. **Buying electronics should feel easy and informed.** Search, comparison, specifications, seller information, pricing, delivery, condition, warranty, and trade-in should be easy to scan.

The visual hierarchy should therefore be:

**product first → price second → trust/context third → brand color fourth.**

Do not flood the interface with Techaven purple. The purple should behave like a strong brand signal and action color, while product photography, white space, neutral surfaces, and dark typography do most of the commerce work.

---

## 2. Techaven color system

The colors below are taken from the **actual color-swatch rectangles in the supplied Techaven design assets**, not from incidental colors inside product images or illustrations.

### 2.1 Core brand palette

| Token | Value | Role |
|---|---:|---|
| `brand-500` | `#404DFE` | Main Techaven brand color; primary interactive accent |
| `brand-300` | `#737DFF` | Bright brand highlight; selected accents, decorative panels, hover-support |
| `brand-700` | `#303194` | Darker brand state; hover/pressed accents, secondary brand surfaces |
| `brand-800` | `#0A1279` | Deep brand/navy; high-contrast branded sections |
| `brand-100` | `#D8DAFF` | Soft brand wash; selected backgrounds and large quiet brand surfaces |
| `ink-900` | `#050526` | Deepest ink; large dark branded regions / footer where required |
| `ink-800` | `#11123A` | Primary headline and strong text color |

### 2.2 Neutral palette

| Token | Value | Role |
|---|---:|---|
| `neutral-400` | `#C4C5C4` | Disabled controls, muted borders, secondary metadata |
| `neutral-200` | `#EDEDED` | Dividers, input outlines, subtle section separation |
| `neutral-050` | `#FAFAFA` | Main page canvas / neutral image stage |
| `surface` | `#FFFFFF` | Header, cards when a true surface is needed, modal/dialog panels |

### 2.3 Semantic soft surfaces

| Token | Value | Role |
|---|---:|---|
| `info-soft` | `#EFF5FB` | Delivery, help, reassurance, informational blocks |
| `success-soft` | `#EEFAF6` | Positive status, verified, available, completed |
| `danger-soft` | `#FCECEF` | Error, unavailable, failed, destructive confirmation |
| `rating` | `#FFC120` | Rating stars only; do not use as a general brand accent |

### 2.4 Usage rule

The mature-commerce optimization is to **ration color by meaning**:

- Use `#404DFE` for primary actions, active navigation, links that need emphasis, focused controls, and important branded moments.
- Use `#11123A` / `#050526` for text and dark sections.
- Use neutral backgrounds for most product/card surfaces.
- Use `brand-100` or `brand-300` for selected states, campaign art, and occasional visual punctuation.
- Use semantic pale backgrounds for trust/reassurance/status.
- Product images should remain the most colorful objects on catalog pages.

### 2.5 Recommended CSS variables

```css
:root {
  --brand-100: #D8DAFF;
  --brand-300: #737DFF;
  --brand-500: #404DFE;
  --brand-700: #303194;
  --brand-800: #0A1279;

  --ink-900: #050526;
  --ink-800: #11123A;

  --neutral-400: #C4C5C4;
  --neutral-200: #EDEDED;
  --neutral-050: #FAFAFA;
  --surface: #FFFFFF;

  --info-soft: #EFF5FB;
  --success-soft: #EEFAF6;
  --danger-soft: #FCECEF;
  --rating: #FFC120;
}
```

---

## 3. Typography

### 3.1 Direction

The typography should feel **plain enough for commerce, distinctive enough for brand/editorial moments**.

Back Market's reference system uses a neutral sans for almost all interface text and a softer editorial serif for selected large marketing headlines. Techaven should adopt the same *strategy*, not illegally copy font files.

### 3.2 Font stack

#### Production-safe default

```css
--font-ui: "Public Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-editorial: "Source Serif 4", Georgia, serif;
```

Preferred first choice: **Public Sans** because it is neutral, highly legible, and slightly less generic-feeling than default Inter while still working well in dense e-commerce UI.

Use **Source Serif 4** only for selected editorial/mega-promo headlines.

#### If the project acquires the proper font licenses

The visual reference uses `BMDupletTXT`, `BMDupletDSP`, and `IvarSoft`. If legally licensed font files are supplied to the Techaven project, they may replace the fallback stack. **Do not scrape, copy, commit, or redistribute Back Market's hosted font files.**

### 3.3 Type roles

| Role | Font | Desktop | Mobile | Weight | Line-height |
|---|---|---:|---:|---:|---:|
| Mega display | Editorial or UI display | 56–72px | 36–48px | 600 | 0.98–1.05 |
| Hero H1 | UI display | 44–56px | 30–38px | 650–700 | 1.05–1.12 |
| Section H2 | UI display | 28–36px | 22–28px | 650–700 | 1.15–1.25 |
| Card title | UI | 15–17px | 14–16px | 600 | 1.25–1.35 |
| Body | UI | 15–16px | 14–16px | 400 | 1.45–1.55 |
| Price | UI | 20–28px | 18–24px | 700–800 | 1.1 |
| Caption/meta | UI | 12–14px | 11–13px | 400–600 | 1.35 |
| Nav | UI | 13–15px | 14–16px | 500–600 | 1.2 |

### 3.4 Typography rules

- No all-caps section headings unless a campaign creative explicitly calls for it.
- Avoid excessive letter spacing.
- Prices should be visually stronger than seller names and metadata.
- Store name must be visible but never louder than the product name.
- Editorial serif appears in **10% or less** of the interface.
- Do not use the serif inside filters, product cards, forms, navigation, cart, checkout, tables, or account UI.

---

## 4. Layout system

### 4.1 Desktop canvas

- Page background: `#FAFAFA` or white depending on section.
- Main max width: **1440px**.
- Standard content width: **1280–1360px**.
- Full-bleed campaign/mega sections may extend edge-to-edge.
- Desktop side padding: `32–48px`.
- Tablet side padding: `24px`.
- Mobile side padding: `16px`.

### 4.2 Base rhythm

Use a **4px base unit**.

Recommended spacing scale:

```txt
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
```

Normal page sections should use `48–80px` vertical spacing on desktop and `32–48px` mobile.

### 4.3 Corners

Techaven's existing mobile UI is rounded. Keep that warmth, but reduce the "everything is a bubble" feeling on desktop.

- Product image stage: `12–16px`
- Promo banners: `16–24px`
- Inputs/search: `999px` for search; `8–12px` for normal inputs
- Buttons: `8px`
- Chips: `999px`
- Modals/drawers: `16–24px`
- Tiny badges: `4–6px`

### 4.4 Shadows

Use almost none.

- Default card: **no shadow**.
- Header/popover: optional very subtle shadow or 1px border.
- Dialogs: restrained soft shadow.
- Product cards should not look like floating dashboard widgets.

---

## 5. Header and navigation style

Desktop Techaven should feel like a complete shopping destination.

### 5.1 Desktop header structure

Use three possible layers:

**Layer A — optional announcement strip**

For campaigns, delivery notices, trade-in promotions, seasonal sales, or marketplace announcements. CMS-controlled and dismissible.

**Layer B — main commerce bar**

- Techaven wordmark/logo left
- large centered/flex search field
- right-side actions: Help, Shops, Compare, Account, Wishlist, Cart
- optional `Sell / Become a seller` link if needed later

**Layer C — category navigation**

- Deals
- Smartphones
- Laptops
- Tablets
- Audio
- Gaming
- Wearables
- Accessories
- Home Electronics / More
- Trade-in

Category navigation may open a mega menu.

### 5.2 Search

Search is a major object, not a small input.

- Pill shape
- neutral gray background
- magnifier left
- optional rotating examples such as `Search iPhone`, `Search gaming laptop`, `Search headphones`
- desktop width approximately `460–680px` depending on viewport
- results dropdown should support products, categories, brands, and shops

### 5.3 Mega menu

The desktop category mega menu may include:

- category columns
- brands
- "shop by use" shortcuts
- featured stores
- one or two product-image promo tiles

Keep the menu commerce-first. Do not turn it into an editorial magazine wall.

---

## 6. Product cards

This is one of the most important components in the system.

### 6.1 Card philosophy

Use the mature marketplace pattern: **flat card, strong image stage, text underneath, minimal chrome**.

Do not put every card inside a bordered white box.

### 6.2 Anatomy

```txt
[ image stage                              ]
[ wishlist icon                    badge?  ]

Product title, maximum 2 lines
Sold by Store Name / Verified Shop
★ 4.8 (82)
MWK 1,500,000
Optional: old price / discount / payment hint
```

Optional marketplace-specific secondary information:

- `Available from 3 shops`
- `Verified shop`
- `Pickup available`
- stock status
- delivery estimate

### 6.3 Image stage

- Neutral background (`#F2F2F2`, `#FAFAFA`, or subtle brand wash)
- Aspect ratio typically `1:1` or `4:5`
- Product centered with generous breathing room
- Images use `object-fit: contain`
- Product imagery must not touch the edges
- No large drop shadows behind devices unless the source asset itself contains one

### 6.4 Card interactions

- Entire product title/image area links to PDP
- Wishlist icon top-right
- Optional compare checkbox/button appears on hover desktop and persistent secondary action on compare-enabled listings
- Quick add only for simple SKU products; otherwise open PDP/configuration
- Image may gently scale `1.02–1.04` on hover
- Text/card layout must not jump on hover

### 6.5 Seller attribution

Because Techaven is a mall, seller context should be visible without making the card noisy.

Preferred pattern:

```txt
Sold by Digital World
```

or

```txt
Digital World · Verified
```

Use small metadata text. On aggregator cards where multiple sellers offer the same canonical product, show:

```txt
From MWK X · 4 shops
```

and resolve seller choice on the PDP.

---

## 7. Product grids

### Desktop

- 4 columns at normal laptop widths
- 5 columns on wide desktop when images remain readable
- `20–28px` column gap
- `40–56px` row gap because text sits below images

### Tablet

- 3 columns

### Mobile

- 2 columns
- compact text, but keep price readable
- no horizontal card carousels for primary catalog browsing

Carousels are reserved for homepage modules such as "Recently viewed", "Hot deals", "From shops you follow", or "Recommended".

---

## 8. Banners and promotional surfaces

Techaven should use several banner families so promotions do not all look identical.

### 8.1 Editorial split banner

Inspired by high-quality marketplace campaign cards.

Layout:

- 2-column desktop promo block
- each tile uses a calm neutral/pastel background
- one strong product composition
- short large headline
- one sentence of supporting copy
- compact dark or brand CTA
- no excessive badges

Example content structure:

```txt
[ product photography ]

Upgrade without the guesswork.
Compare phones from verified Techaven shops.
[Compare phones]
```

### 8.2 Full-width campaign banner

May be CMS-managed as either:

1. **Composed banner** — live text, media, CTA, theme token; or
2. **Creative banner** — entire marketing artwork delivered as an image with one clickable destination.

Prefer composed banners for accessibility, SEO, responsive control, localization, and analytics. Use flattened creative banners only when marketing needs exact artwork.

### 8.3 Inline catalog promotion

A promo tile can occupy the space of 1–2 product cards inside a grid.

Use for:

- store campaign
- delivery offer
- trade-in reminder
- category campaign
- financing/payment campaign

It must visually belong to the catalog and should not interrupt browsing every few rows.

### 8.4 Promotion theme variants

CMS should select from controlled themes rather than arbitrary colors:

- `neutral`
- `brand`
- `brand-soft`
- `dark`
- `info`
- `success`
- `custom-creative` only when an image itself contains the art direction

---

## 9. Giant product-visible mega headers

Techaven should have reusable **Mega Commerce Headers** for major categories, shops, catalogs, and campaigns.

### 9.1 Visual recipe

- Height: `420–620px` desktop
- Strong solid or very subtle tonal background
- oversized H1
- one short supporting line
- one primary CTA and optional secondary CTA
- 1–4 large product renders partially entering/leaving the frame
- product renders may overlap each other, but no cluttered collage
- crop intentionally at edges so the section feels larger than the viewport

### 9.2 Variants

**Category mega header**

```txt
Smartphones
Find the right phone across Malawi's electronics shops.
[Shop smartphones] [Compare phones]
          [large phone renders]
```

**Store mega header**

```txt
Digital World
Verified Techaven shop · Lilongwe
[Browse store] [View catalogs]
          [store's featured products]
```

**Catalog mega header**

```txt
Back to School Tech
A curated catalog from XYZ Shop
          [laptops + accessories]
```

**Campaign mega header**

More expressive; may use editorial serif for the headline.

### 9.3 Mobile behavior

Do not merely scale the desktop collage down. Recompose:

- text first
- media below/behind
- 1–2 products maximum
- `300–420px` total height
- CTA remains visible without scrolling inside the hero

---

## 10. Buttons and controls

### Primary button

- background `#404DFE`
- white text
- 8px radius
- medium weight
- hover: `#303194`
- pressed: `#0A1279`

### Dark commerce button

Use `#11123A` or `#050526` for editorial/campaign CTA moments and high-confidence purchase actions where a dark button creates clearer hierarchy.

Do not mix dark and purple primaries randomly. A section should have one obvious primary action.

### Secondary button

- transparent or white
- 1px neutral border
- dark text

### Tertiary/link action

- text only
- underline on hover/focus where appropriate

### Filter chips

- pill shape
- neutral surface
- selected state uses `brand-100` and dark text/ring

---

## 11. Filters and sort

Desktop catalog filters should feel compact and powerful.

Two supported modes:

1. **Horizontal filter pills + popovers** for broad marketplace search.
2. **Left filter rail** for deep category pages with many facets.

Recommended facets:

- Price
- Shop
- Brand
- Category
- Condition
- Storage
- RAM
- Screen size
- Availability
- Location / delivery option
- Rating

Every filter application should show a live or immediate result count when possible.

Use the selected-state brand wash rather than large solid-purple controls.

---

## 12. Product detail page visual system

Desktop PDP uses a strong two-column first viewport.

### Left

- thumbnail rail
- large neutral image stage
- product gallery
- optional badge/sticker for verified condition, promotion, or Techaven guarantee

### Right

- breadcrumb
- H1
- rating/review link
- seller / available-shops context
- price
- savings/old price if real
- variant selectors
- delivery/pickup info
- primary purchase CTA
- wishlist
- compare
- trust/reassurance cards

Use soft semantic panels for delivery, returns, warranty, buyer protection, and verified seller context.

### Marketplace seller block

A dedicated seller module should include:

- store name
- verified status
- store rating
- fulfillment/delivery summary
- link to shop page
- optional `Other shops selling this product` trigger

This should look like commerce metadata, not a social profile card.

---

## 13. Compare design language

Comparison must be easy to start from product grids.

- Add a small `Compare` affordance on eligible cards.
- Once 2+ items are selected, show a compact sticky compare tray.
- Comparison tables use plain rows, clear labels, and very light separators.
- Highlight differences carefully; do not paint entire rows purple.
- Product image/name/price/CTA remain sticky at the top on long comparison pages.
- On mobile, comparison becomes horizontal swipe/scroll with sticky attribute labels where practical.

Editorial buying advice may appear below the structured comparison, not instead of it.

---

## 14. Trade-in design language

Trade-in should feel like a Techaven-level service, not an isolated form.

Visual pattern:

- prominent icon/illustration or device image
- step-by-step question flow
- progress indicator
- large selectable option rows
- live estimate panel when backend supports it
- reassurance cards for inspection, data handling, payout/credit, and timing

Use `brand-100`, `info-soft`, and neutral surfaces to keep the flow calm and trustworthy.

Do not hardcode eligibility rules or quote logic into presentation components.

---

## 15. Shops and catalogs visual language

### Shop card

A shop card should be more editorial than a product card but still compact.

```txt
[shop cover / product collage]
[logo] Shop Name          [Verified]
Short specialty line
4.8 ★ · 1.2k orders
[Browse shop]
```

### Catalog card

Catalogs are curated groups published by a shop or Techaven.

```txt
[large themed image/product composition]
Catalog title
Shop name
Short description
12 products
```

Catalogs should visually feel like **mini storefront campaigns**, not folders.

---

## 16. Large footer: "another page" feeling

The footer should feel like the user has arrived at a final destination, not a thin legal strip.

### Desktop target

- minimum `65vh`; may reach `80vh` on wide screens
- dark `#050526` or `#11123A` background
- generous padding `72–96px`
- newsletter / app / marketplace callout near the top
- 4–6 navigation columns
- support/help links
- categories
- shops / seller onboarding links
- company/legal
- payments / delivery / trust information where applicable
- locale/country control if introduced

### Giant wordmark ending

At the absolute bottom, render a **huge Techaven wordmark** spanning most or all of the width, inspired by large agency/Webflow-style footers.

- can be `clamp(96px, 16vw, 260px)`
- tight line-height
- partially clipped at the bottom edge if visually stronger
- use `#404DFE`, `#737DFF`, or a low-contrast tint depending on footer theme
- decorative only if the real logo also appears elsewhere; use `aria-hidden="true"` for duplicate decorative wordmark

The footer should make the site feel premium and finished.

---

## 17. Motion

Motion exists to explain state, not to show off.

- Hover: `120–180ms`
- Menus/popovers: `160–220ms`
- Drawers/modals: `220–320ms`
- Product image hover scale: subtle
- Mega menu: fade + small vertical translation
- Sticky compare tray/footer actions: smooth but restrained

Respect `prefers-reduced-motion`.

Avoid:

- bouncy cards
- floating gradient blobs
- excessive scroll reveal
- animated shadows
- decorative 3D transforms on normal commerce content

---

## 18. Responsive behavior

### Desktop-first enhancements

Desktop is allowed to be denser than the current mobile design:

- multi-row header
- mega menus
- 4–5 column grids
- filter popovers/rails
- side-by-side promo tiles
- large category hero compositions

### Mobile continuity

The supplied Techaven mobile flow already establishes the core brand language. Preserve:

- white/clean canvas
- purple action color
- rounded image/card stages
- compact bottom navigation where appropriate
- straightforward product browsing

But update mobile cards and hierarchy to match the cleaner desktop system:

- reduce unnecessary containers
- let products breathe
- use consistent typography
- use seller attribution in a predictable location
- reserve purple for actions/selection rather than filling every card

---

## 19. Accessibility

- Minimum 4.5:1 contrast for normal text.
- Do not place small white text directly over busy product imagery without a controlled overlay.
- Focus indicators must be visible and use brand + outline contrast.
- All promo media needs alt strategy.
- Flattened image banners require useful link labels and alternate accessible text.
- Icon-only controls need labels/tooltips.
- Comparison tables require semantic table markup.

---

## 20. Anti-slop rules for agents

Do **not** generate generic AI-commerce styling.

Avoid:

- random blue-to-purple gradients as default backgrounds
- excessive glassmorphism
- dashboard-style cards around every section
- huge radius on every rectangle
- giant centered text above every section
- meaningless feature icon triples
- repeated "Shop now" buttons everywhere
- fake trust numbers or seller metrics
- invented discounts
- arbitrary neon colors outside the palette
- serif font on regular UI
- overuse of Techaven purple backgrounds
- unnecessary floating badges
- 3D blobs / abstract AI illustrations when product photography is available

The target is **structured retail confidence**.

---

## 21. Component naming convention

Use reusable component names that remain valid as the platform grows:

```txt
CommerceHeader
AnnouncementBar
SearchOmnibox
CategoryNav
MegaMenu
MegaCommerceHero
PromoBanner
PromoTile
SectionHeader
ProductCard
ProductGrid
ProductRail
ShopCard
ShopGrid
CatalogCard
CatalogGrid
CompareToggle
CompareTray
FilterBar
FilterPopover
FilterRail
SortControl
SellerSummary
TrustPanel
PriceBlock
VariantSelector
DeliveryPanel
TradeInEstimator
NewsletterBlock
MegaFooter
```

Do not name reusable components after Back Market.

---

## 22. Final design principle

**Techaven should look like one large, trustworthy electronics mall whose individual stores remain visible and discoverable.**

The system should be visually quiet where users compare products and prices, expressive where campaigns and catalogs need personality, and modular enough that future product types, shops, banners, CMS sections, comparison tools, and commerce services can be added without redesigning the whole site.
