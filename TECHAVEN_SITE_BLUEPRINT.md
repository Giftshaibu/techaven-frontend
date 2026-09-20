# Techaven Website & Commerce Experience Blueprint

> **Purpose:** This file describes what the Techaven website contains, how pages are structured, where marketplace features live, how grids/cards behave, and how the system stays extensible for future features and Strapi-managed content.
>
> Pair this file with `TECHAVEN_DESIGN_LANGUAGE.md`. The design-language file controls **how things look**; this blueprint controls **what exists, where it goes, and how the pieces connect**.

---

## 1. Product model

Techaven is an **electronics marketplace / digital mall**.

The mental model is:

```txt
Techaven
├── Categories
│   ├── Smartphones
│   ├── Laptops
│   ├── Tablets
│   ├── Audio
│   └── ...
├── Shops
│   ├── Shop A
│   │   ├── Products
│   │   └── Catalogs
│   ├── Shop B
│   └── ...
├── Catalogs / Collections
├── Products
├── Compare
├── Trade-in
├── Deals / Promotions
└── Editorial / Buying guides (future)
```

A user should be able to browse in three directions:

1. **By product/category** — "I want a phone."
2. **By shop** — "I want to see everything from this store."
3. **By curated catalog** — "Show me this Back-to-School / Gaming / Apple / Budget Phones collection."

This three-path structure is central to Techaven's differentiation.

---

## 2. Core route map

Recommended route architecture:

```txt
/
/search?q=
/deals
/categories
/category/[slug]
/brand/[slug]

/shops
/shops/[shopSlug]
/shops/[shopSlug]/catalogs
/shops/[shopSlug]/catalogs/[catalogSlug]

/catalogs
/catalogs/[catalogSlug]

/product/[productSlug]

/compare
/compare/[comparisonSlug]

/trade-in
/trade-in/[deviceType]

/help
/help/[articleSlug]
/account/*
/cart
/checkout/*

/guides                 # future
/guides/[slug]          # future
```

Do not encode CMS campaign names into hardcoded page templates. Campaign pages should be data-driven.

---

## 3. Global desktop shell

### 3.1 Optional top announcement bar

CMS-controlled.

Examples:

- delivery campaign
- Techaven sale
- trade-in incentive
- seller onboarding notice
- payment method announcement

Fields should support text, optional CTA, theme, start/end scheduling, and dismissibility.

### 3.2 Utility row

Small, low-emphasis links such as:

- Buyer protection / How Techaven works
- Help
- Track order
- For shops / Sell on Techaven
- delivery/location selector if added later

### 3.3 Main header row

Left → right:

```txt
Techaven logo
Search
Shops
Compare
Trade-in
Help
Account icon
Wishlist icon
Cart icon
```

Search receives the majority of the middle space.

### 3.4 Category nav row

```txt
Deals
Smartphones
Laptops
Tablets
Gaming
Audio
Wearables
Accessories
Home electronics
More
```

Desktop category links can open mega menus.

### 3.5 Sticky behavior

The complete header can be sticky at first. If vertical height becomes excessive, on downward scroll collapse to a compact header containing:

```txt
logo + search + account + cart
```

and restore the fuller navigation when the user scrolls upward.

---

# 4. Homepage

The homepage is modular and CMS-driven. Do not hardcode a fixed sequence that requires a deployment whenever merchandising changes.

Recommended default sequence:

```txt
Header
↓
Hero / campaign banner
↓
Quick category links
↓
Featured shops
↓
Hot deals / popular products
↓
Editorial split-promo banners
↓
Browse by category
↓
Featured catalog
↓
Compare callout
↓
Trade-in callout
↓
Recently viewed / recommended (personalized when available)
↓
Marketplace trust strip
↓
Large footer
```

Not every module must appear at all times.

---

## 4.1 Hero

The homepage hero is a CMS slot that supports multiple presentation variants.

### Variant A — Mega commerce hero

Large live text + product renders.

Recommended structure:

```txt
Eyebrow
Large headline
1–2 line description
Primary CTA
Optional secondary CTA
Product composition / campaign artwork
```

### Variant B — Full campaign creative

Single image/creative linking to a catalog, category, store, product, deal page, or external campaign destination.

### Variant C — Carousel

Use only for genuinely different high-priority campaigns. Maximum 3–4 slides.

Do not rotate automatically so quickly that users cannot read the slide.

---

## 4.2 Quick categories

Desktop: `4 × 2` or `8 × 1` depending on width.

Each tile contains:

- product/category image
- concise label
- optional subtle brand background

Examples:

- Smartphones
- Laptops
- Tablets
- Gaming
- Audio
- Wearables
- TVs
- Accessories

These are shortcuts, not product cards.

---

## 4.3 Featured shops

This section exists because Techaven is a mall.

Header:

```txt
Featured shops                              View all shops
```

Grid/rail cards should show:

- cover image or branded product collage
- store logo
- store name
- verified marker if applicable
- specialty/descriptor
- rating/order count only when real data exists
- optional location/fulfillment hint

Desktop: 4 cards across.
Mobile: horizontal rail or 2-column grid depending on card density.

Click leads to `/shops/[slug]`.

---

## 4.4 Hot deals / product modules

Use the standard flat `ProductCard`.

Section sources can be:

- manually selected products
- dynamic sale query
- best sellers
- newest
- trending
- category-specific
- store-specific
- personalized API source later

The presentation component should not care which source supplied the products.

---

## 4.5 Editorial promo pair

Use two large campaign tiles side-by-side on desktop.

Each has:

- product visual
- strong short headline
- short support copy
- CTA
- controlled theme

Potential Techaven use cases:

- Compare before you buy
- Trade in old tech
- Shop trusted local stores
- Student laptop campaign
- Gaming setup campaign

On mobile these stack vertically.

---

## 4.6 Featured catalog

A catalog is a curated set of products with a theme and an owner.

Example:

```txt
Back to School Essentials
Curated by ABC Electronics
[large feature image]
[4–6 product preview cards]
[Browse catalog]
```

The catalog can be owned by:

- a Techaven shop
- Techaven editorial/merchandising itself

---

## 4.7 Compare callout

The homepage should teach users that comparison exists.

Structure:

```txt
Compare before you buy
Pick two to four devices and see the differences side-by-side.
[Start comparing]
[product renders]
```

Link to `/compare` or a popular comparison page.

---

## 4.8 Trade-in callout

Structure:

```txt
Give your old device another life
Check whether your device qualifies and see the available trade-in path.
[Start trade-in]
```

Eligibility, pricing, payout, credit, logistics, and seller participation come from backend configuration. Do not invent these in static UI.

---

# 5. Categories landing page

Route: `/categories`

Purpose: show the entire mall taxonomy without forcing the header mega menu to carry everything.

Layout:

```txt
Mega header: Browse electronics
↓
Large category grid
↓
Popular brands
↓
Featured catalogs
↓
Featured shops by specialty
↓
Footer
```

Category cards may be larger and more visual than homepage quick links.

---

# 6. Category page

Route: `/category/[slug]`

Example: `/category/smartphones`

Structure:

```txt
Breadcrumb
Mega category hero with product renders
Subcategory shortcuts
Brand shortcuts
Featured promo/catalog slot
Product result header
Filter system + sort
Product grid
Optional inline promo tile(s)
Pagination / load more
Related guides / compare callout
Footer
```

### Desktop product result header

```txt
Smartphones
1,284 products                         Sort: Recommended
[Price] [Brand] [Shop] [Storage] [Condition] [More filters]
```

Large categories may use left filters instead of pill popovers.

### Grid

- 4 columns default
- 5 columns wide desktop
- 3 columns tablet
- 2 columns mobile

Product cards remain visually flat.

### Inline promotions

A CMS promotion may be inserted after configurable product positions, e.g. after item 8 or row 3.

Do not insert more than one heavy promo every 2–3 rows.

---

# 7. Search results

Route: `/search?q=`

Search is broader than category pages and should accept mixed intent.

First area may include entity suggestions:

```txt
Search results for "iphone"

Categories: iPhones · Smartphones · Phone accessories
Shops: XYZ Mobile · ABC Electronics
```

Then product results with facets.

Search should eventually support:

- products
- categories
- brands
- shops
- catalogs

Catalog/store results may appear as compact blocks above product results or in dedicated tabs once enough data exists.

---

# 8. Shops index

Route: `/shops`

This is a major destination, not a hidden seller directory.

### Hero

```txt
Shop the mall
Browse electronics stores on Techaven.
```

May include 2–4 product/shop visuals.

### Controls

- search shops
- specialty/category filter
- location filter when reliable data exists
- verified filter if meaningful
- sort

### Shop grid

Desktop: 3–4 columns.

Shop card includes:

- visual cover
- logo/avatar
- name
- specialty
- verified status
- rating/order data only if supported
- `Browse shop`

### Additional sections

- New shops
- Popular shops
- Shops by category
- Featured catalogs from shops

---

# 9. Shop storefront

Route: `/shops/[shopSlug]`

A shop is a storefront **inside Techaven**, not a standalone microsite that breaks the global experience.

### Page structure

```txt
Global Techaven header
↓
Shop mega header
↓
Shop mini-nav
↓
Featured products / campaign
↓
Catalogs
↓
All products
↓
Shop information / policies
↓
Global Techaven footer
```

### Shop mega header

Contains:

- shop name/logo
- verified state
- short description/specialty
- optional location
- rating/order count if real
- campaign image/product composition
- `Follow` can be added later without redesigning the header

### Shop mini-nav

```txt
Home
Products
Catalogs
About
Reviews (future/if supported)
```

### Product filtering

Same reusable product grid/filter components, but shop facet is implicitly fixed to the current store.

---

# 10. Catalogs

## 10.1 Catalog index

Route: `/catalogs`

Browse curated collections from Techaven and shops.

Controls may include:

- category
- shop
- newest
- featured

## 10.2 Catalog page

Route: `/catalogs/[catalogSlug]` or nested store route.

Page:

```txt
Catalog mega header
Owner/shop attribution
Description
Optional campaign banner
Product grid
Related catalogs
Owner shop CTA
Footer
```

Catalogs should be linkable targets from any promotion banner.

---

# 11. Product detail page

Route: `/product/[productSlug]`

Desktop first viewport:

```txt
Breadcrumb

[gallery / image stage]       [title]
                              [rating]
                              [seller / shops]
                              [price]
                              [variant/config]
                              [delivery]
                              [Add to cart]
                              [wishlist] [compare]
                              [buyer protection info]
```

### 11.1 Canonical product vs seller offer

Techaven should be designed to support both models:

**Model A — one listing = one seller offer**

PDP clearly identifies the store.

**Model B — canonical product with multiple seller offers**

PDP shows a main offer plus an `Other shops` panel/table.

Design the data layer so the UI can evolve from A to B without replacing the whole PDP.

### 11.2 Below the fold

Recommended order:

```txt
Key specifications
Description
Delivery / returns / warranty / protection
Seller information
Other offers from shops (if applicable)
Compare with similar products
Reviews
Related products
Recently viewed
```

### 11.3 Sticky buy bar

After scrolling beyond the primary CTA:

```txt
thumbnail · product name/config                 price    Add to cart
```

On mobile use a sticky bottom buy bar.

---

# 12. Compare

Route: `/compare`

Comparison is a first-class shopping utility.

## 12.1 Entry points

- product card `Compare`
- PDP `Compare`
- homepage callout
- header `Compare`
- prebuilt SEO/editorial comparisons

## 12.2 Compare tray

When users select products, show a sticky tray containing 2–4 slots.

Actions:

- remove product
- add another
- clear
- compare now

Persist selection locally/session-side.

## 12.3 Comparison page

Top:

```txt
Compare products
[Product A] [Product B] [Product C?]
image       image       image
price       price       price
shop(s)     shop(s)     shop(s)
CTA         CTA         CTA
```

Then structured groups:

```txt
Highlights
Display
Performance
Storage
Camera
Battery
Connectivity
Dimensions
Warranty / condition
Seller / delivery
```

Use real product attributes only.

### Difference mode

Optional toggle:

```txt
[ ] Show differences only
```

### Editorial layer

Below the spec tool, Strapi may provide buying-guide content:

- what the differences mean
- who each product may suit
- FAQs
- related comparisons

Keep this content factual and product-oriented.

---

# 13. Trade-in

Route: `/trade-in`

This should use a guided wizard.

Recommended stages:

```txt
1. Device type
2. Brand/model
3. Storage/spec variant
4. Condition questions
5. Estimated result / next step
6. Customer details
7. Handover / inspection path
8. Confirmation
```

The exact commercial logic is backend-configured.

### Landing page

```txt
Trade in your old tech
[hero device visuals]
How it works: 3 concise steps
Eligible device categories
FAQ / reassurance
Start trade-in
```

### Trade-in inside PDP/cart

Where relevant, surface a small module:

```txt
Have an old device?
Check trade-in options
```

Do not allow this module to overpower the purchase flow.

---

# 14. Deals / promotions

Route: `/deals`

Deals are a merchandised landing page, not just `discount > 0` search.

Possible modules:

- campaign hero
- deal categories
- flash/limited campaigns if backend supports actual timing
- discounted product grid
- store promotions
- special catalogs

Do not fake urgency timers.

---

# 15. Cards

## 15.1 ProductCard

Must support:

```ts
product
image
name
price
compareAtPrice?
rating?
reviewCount?
shop?
shopCount?
condition?
badge?
availability?
wishlistState
compareState
```

Display order:

1. image stage
2. badge/wishlist
3. title
4. shop attribution
5. rating
6. price
7. optional secondary metadata

Avoid button-heavy cards.

## 15.2 ShopCard

Supports:

```ts
shop
logo
cover
name
verified
specialties
rating?
orderCount?
location?
```

## 15.3 CatalogCard

Supports:

```ts
catalog
heroMedia
name
ownerShop?
description?
productCount?
theme
```

## 15.4 PromoTile

A generic card that can link to any supported destination.

```ts
headline
body?
media
ctaLabel
linkTarget
theme
```

---

# 16. Promotion linking system

Every promo/banner should use a common destination model so marketing content can link to any commerce surface without code changes.

Recommended type:

```ts
type LinkTarget =
  | { type: 'product'; productId: string }
  | { type: 'category'; categoryId: string }
  | { type: 'shop'; shopId: string }
  | { type: 'catalog'; catalogId: string }
  | { type: 'brand'; brandId: string }
  | { type: 'search'; query: string; filters?: Record<string, unknown> }
  | { type: 'compare'; comparisonId?: string }
  | { type: 'trade_in' }
  | { type: 'internal_url'; path: string }
  | { type: 'external_url'; url: string };
```

The rendering component resolves this link target centrally.

Do not put raw URL strings everywhere in CMS content when a typed internal relation is possible.

---

# 17. Strapi content architecture

The goal is to make merchandising flexible without letting CMS authors break the UI.

## 17.1 Collection types

Recommended Strapi collections:

```txt
Product
Category
Brand
Shop
Catalog
Promotion
CampaignPage
BuyingGuide
ComparisonArticle
HelpArticle
NavigationItem
FooterGroup
SiteAnnouncement
```

Commerce-critical data such as inventory, pricing, orders, seller settlement, carts, and checkout should usually remain in the commerce/backend domain rather than becoming Strapi-owned state.

Strapi is best for **content and merchandising**, not transactional truth.

---

## 17.2 Promotion

Fields:

```txt
internalName
status
headline
subheadline
body
mediaDesktop
mediaMobile
altText
ctaLabel
linkTarget
presentationVariant
colorTheme
placementTags[]
startAt?
endAt?
priority
analyticsKey
```

`presentationVariant` examples:

```txt
hero
split_banner
wide_banner
inline_grid_tile
compact_strip
footer_promo
```

`placementTags` examples:

```txt
home.hero
home.after_featured_shops
category.smartphones.top
category.smartphones.grid
shop.*.top
catalog.*.middle
```

A placement resolver in the frontend decides what to render.

---

## 17.3 Catalog

Fields:

```txt
title
slug
ownerType: techaven | shop
shop?
shortDescription
longDescription?
heroMedia
mobileHeroMedia?
theme
products[]
category?
status
startAt?
endAt?
seo
```

Catalog product order should be manually sortable.

---

## 17.4 Shop content profile

Transactional/store data may live in the marketplace backend, while Strapi stores presentation content.

Content fields can include:

```txt
shopId (backend reference)
slug
logo
coverMedia
shortDescription
about
specialties[]
featuredProducts[]
featuredCatalogs[]
seo
```

Do not duplicate mutable inventory/pricing in Strapi.

---

# 18. Modular page-builder sections

Use a constrained dynamic-zone/page-builder pattern.

Allowed block types might be:

```txt
HeroBlock
CategoryQuickLinksBlock
ProductRailBlock
ProductGridBlock
ShopGridBlock
CatalogFeatureBlock
PromoPairBlock
WideBannerBlock
CompareCalloutBlock
TradeInCalloutBlock
EditorialTextBlock
TrustStripBlock
NewsletterBlock
```

Each block has a small controlled set of style variants.

Do **not** give CMS editors arbitrary margins, colors, font sizes, or HTML layout controls. That destroys consistency.

---

# 19. Homepage section data model

A generic section wrapper can be represented as:

```ts
interface CommerceSection {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  sourceMode?: 'manual' | 'query' | 'relation';
  sourceConfig?: Record<string, unknown>;
  presentationVariant?: string;
  theme?: 'neutral' | 'brand' | 'brand-soft' | 'dark' | 'info' | 'success';
  itemLimit?: number;
  linkTarget?: LinkTarget;
  enabled: boolean;
}
```

This allows future home modules to be inserted or reordered without rewriting the homepage.

---

# 20. Future-feature safety

The layout must allow future features to arrive without structural rewrites.

Design extension points for:

- financing / installments
- store following
- saved searches
- price alerts
- seller chat/support
- pickup locations
- subscriptions/warranties
- bundles
- wishlists
- recently viewed
- recommendations
- loyalty program
- used/refurbished condition grading
- richer reviews
- product Q&A

Do not show these features before they exist. The architecture simply must not block them.

---

# 21. Grid design rules

Do not turn the site into a decorative grid experiment. It is e-commerce first.

Use grid to establish predictable browsing rhythm.

### Main product grids

```txt
Desktop wide: 5 columns
Desktop normal: 4 columns
Tablet: 3 columns
Mobile: 2 columns
```

### Shop grids

```txt
Desktop: 4 columns
Tablet: 2–3 columns
Mobile: 1–2 columns
```

### Catalog grids

Catalogs are more visual:

```txt
Desktop: 3 columns or one featured + two secondary
Tablet: 2 columns
Mobile: 1 column / controlled rail
```

### Promotional asymmetry

Asymmetry is acceptable only in dedicated campaign sections:

```txt
[wide promo      ][small promo]
[wide promo      ][small promo]
```

Do not mix random card spans inside core product search results unless the promo insertion is deliberate.

---

# 22. Responsive page behavior

## Desktop

Desktop gets the richest marketplace controls:

- mega menu
- broad search
- product-rich mega headers
- multi-column grids
- filters
- compare tray
- large footer

## Mobile web

Preserve the current Techaven mobile/app language while aligning component hierarchy.

Recommended mobile header:

```txt
logo        icons
search full-width next row
```

or compact sticky search pattern once scrolled.

Mobile category/product pages:

- 2-column grids
- filter/sort opens bottom sheets
- compare tray becomes bottom sheet/sticky strip
- PDP CTA becomes sticky bottom bar
- shop/catalog hero simplifies product artwork

---

# 23. Footer information architecture

The footer is intentionally oversized.

Suggested top-to-bottom layout:

```txt
Newsletter / stay in the loop
Marketplace promise / reassurance row

Shop
  Categories
  Deals
  Shops
  Catalogs
  Compare
  Trade-in

Help
  Help centre
  Orders
  Delivery
  Returns
  Payments

For shops
  Sell on Techaven
  Seller help
  Shop dashboard

Company
  About
  Contact
  Careers (future)
  Techaven journal/guides (future)

Legal
  Terms
  Privacy
  Marketplace policies
  Seller terms

Social / contact / locale
Payment and fulfillment marks if real

────────────────────────
Copyright / legal microcopy

TECHAVEN  ← massive decorative wordmark spanning the viewport
```

The giant wordmark should be part of the layout, not an image pasted into the footer.

---

# 24. Navigation rules

### Products are reachable from

- search
- categories
- shop storefronts
- catalogs
- promotion banners
- compare results
- recommendations

### Shops are reachable from

- global `Shops`
- product seller attribution
- search suggestions/results
- featured shop sections
- catalog ownership

### Catalogs are reachable from

- homepage merchandising
- shop storefront
- catalogs index
- promo banners
- category pages

This cross-linking makes the mall model understandable.

---

# 25. SEO and content structure

Make routes server-rendered/static where practical.

Every category, shop, catalog, product, comparison, and guide page should support:

```txt
seoTitle
seoDescription
canonical
ogImage
index/follow controls where needed
structured data when applicable
```

Important marketplace structured-data candidates:

- Product
- Offer / AggregateOffer
- Organization
- BreadcrumbList
- ItemList
- Review/AggregateRating only with real valid data

Do not generate fake ratings or fake schema content.

---

# 26. Analytics hooks

All CMS promotions and major commerce interactions should include stable analytics keys.

Track events such as:

```txt
promotion_view
promotion_click
product_view
product_card_click
add_to_cart
wishlist_add
compare_add
compare_open
shop_view
shop_product_click
catalog_view
catalog_product_click
trade_in_start
trade_in_step_complete
search_submit
filter_apply
```

Do not derive analytics identifiers from visible copy because marketing text changes.

---

# 27. Implementation boundaries

### Frontend owns

- layout
- responsive presentation
- component state
- URL/query-state for filters
- CMS section rendering
- compare tray UI
- graceful loading/skeletons

### Commerce/backend owns

- product truth
- offers
- prices
- stock
- sellers
- carts
- orders
- checkout
- account commerce state
- trade-in calculation/eligibility

### Strapi owns

- marketing copy
- media
- banners
- catalogs/curation metadata
- merchandising section order
- buying guides
- help/editorial content
- SEO metadata

Avoid putting the same truth in all three systems.

---

# 28. Agent implementation priorities

Build in this order:

1. global tokens + typography
2. global header/search/category nav
3. ProductCard + ProductGrid
4. homepage section framework
5. category/search pages + filters
6. PDP
7. Shops index + shop storefront
8. Catalogs
9. Compare tray + compare page
10. Trade-in experience shell
11. CMS promotion renderer / Strapi integration
12. large footer
13. personalization/recommendations later

Do not start by making one perfect homepage mockup with hardcoded content. Build the reusable commerce primitives first.

---

# 29. Acceptance criteria

A design/build agent has succeeded when:

- Techaven still reads as the same brand as the supplied mobile UI.
- Desktop feels substantially more mature and information-rich.
- Product cards are clean, flat, and easy to scan.
- A user can browse products **or** browse shops.
- Every shop can have catalogs.
- Promotions can link to products, categories, shops, catalogs, search states, comparisons, trade-in, or pages.
- Homepage sections can be rearranged from CMS without redesigning the page.
- Compare can start from a grid and continue into a dedicated page.
- Trade-in has a coherent first-class place in navigation and PDP merchandising.
- Category/shop/catalog headers can use large product-visible compositions.
- The footer feels like a major final page section and ends with a giant Techaven wordmark.
- The site remains obviously e-commerce; it does not become a design-gallery grid.
- New marketplace features can be added as modules rather than forcing a redesign.

---

# 30. Final experience statement

Techaven desktop should feel like entering a **large electronics mall with one consistent checkout and trust layer**. The user can walk the mall by category, discover individual stores, browse a store's curated catalogs, compare products across the marketplace, and access services such as trade-in without losing their sense of where they are.

The visual system should stay quiet and retail-focused during browsing, then become more expressive in mega headers, campaigns, catalogs, and the oversized footer. Strapi should act as the merchandising brain for those expressive areas while the commerce backend remains the source of truth for products, sellers, pricing, inventory, carts, and orders.
