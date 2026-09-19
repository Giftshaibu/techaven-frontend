# Techaven — marketplace front end (first pass)

Build the Techaven electronics mall front end following the two uploaded documents: the design language for look and feel, the blueprint for structure and page content. Demo products and shops are written into the code as placeholder data, and the basket works in the browser.

## Visual foundation

- Techaven palette from the design doc: brand blue `#404DFE` (with its lighter and darker steps), deep ink `#11123A` / `#050526`, neutral canvas `#FAFAFA`, white surfaces, and the soft info/success/danger/rating tints.
- Public Sans for all interface text, Source Serif 4 reserved for occasional large campaign headlines only.
- 1440px max page width, 4px spacing rhythm, near-zero shadows, flat product cards, pill-shaped search, 8px buttons.
- Colour is rationed: product images stay the most colourful thing on browse pages.

## Pages in this pass

1. **Home** — announcement strip, utility row, main header with big search, category nav; then hero, quick category tiles, featured shops, hot deals, two-up editorial promos, browse by category, featured catalog, compare callout, trade-in callout, trust strip, large footer.
2. **All categories** — full taxonomy grid, popular brands, featured catalogs, shops by specialty.
3. **Category page** — large category header with product renders, subcategory and brand shortcuts, result count, sort and filter controls, 4-column product grid with one inline promo tile, load more.
4. **Shops index** — "Shop the mall" header, shop search and sorting, grid of shop cards.
5. **Shop page** — store header with verified marker and location, store catalogs, store product grid.
6. **Product page** — image stage with thumbnails, title, price, condition and warranty, seller block with other shops offering the same item, delivery and trust notes, specifications, add to basket, related products.
7. **Basket** — line items, quantity changes, remove, totals.

Compare, trade-in, help, search results and account are linked from navigation and get simple placeholder pages so nothing is a dead link.

## Data and basket

- Demo catalogue in code: roughly 8 categories, 8 shops, 40 products, a few curated catalogs, all with Malawi kwacha pricing and realistic names.
- Basket lives in the browser (persists across refresh), with a count badge in the header.
- Product image areas are neutral stages with a clean placeholder mark rather than generated artwork, per your choice.

## Technical notes

- Tokens go into `src/styles.css` as theme variables; fonts load via a link tag in the root route.
- Routes: `/`, `/categories`, `/category/$slug`, `/shops`, `/shops/$shopSlug`, `/product/$slug`, `/cart`, plus stubs for `/deals`, `/compare`, `/trade-in`, `/search`, `/help`, `/catalogs`.
- Shared components: `Header`, `MegaMenu`, `Footer`, `ProductCard`, `ShopCard`, `CategoryTile`, `PromoTile`, `MegaHeader`, `FilterBar`, `TrustStrip`, section header with "view all".
- Sections are driven by data arrays so modules can be reordered or removed without rewriting layout — matching the blueprint's modular intent.
- Basket state in a React context backed by localStorage.
- Each page gets its own title and description metadata.

## Not in this pass

Real accounts, checkout, a database, Strapi/CMS wiring, working compare and trade-in flows, editorial guides.
