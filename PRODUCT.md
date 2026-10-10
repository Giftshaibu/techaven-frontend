# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Techaven serves shoppers discovering and comparing electronics from Malawian marketplace shops, and the marketing editors who curate timely promotions. Shopper discovery and marketing autonomy are equally important.

## Product Purpose

Techaven brings live multi-shop commerce inventory into a clear retail experience. Promotions should help shoppers discover relevant products and shops while allowing editors to schedule and publish campaigns without a frontend deployment.

## Positioning

Techaven combines a product-first marketplace with curated editorial merchandising while keeping product, price, inventory, and seller facts owned by the commerce service.

## Operating Context

Shoppers browse product, category, deal, shop, search, and campaign pages across mobile and desktop web. Editors manage promotional copy, media, schedules, targeting, and commerce references in a separate Strapi admin panel.

## Capabilities and Constraints

- The commerce API remains the source of truth for product and shop records.
- The promotions CMS stores references and merchandising content, not price, inventory, order, payment, customer, or seller-private data.
- Promotion failures must never prevent commerce pages from loading.
- Campaign pages use controlled templates rather than an arbitrary page builder.
- Commerce batch lookup is a documented future contract; the storefront must work with current individual endpoints meanwhile.

## Brand Commitments

Preserve the existing Techaven name, product-first retail voice, typography, palette, tokens, components, and restrained editorial character.

## Evidence on Hand

- Existing storefront implementation and live commerce adapters in this repository.
- Promotion visual direction and frontend slot specifications supplied by the user.
- Existing Strapi promotion service at `/home/giftshaibu/Documents/techaven_promotion`.
- No testimonials or unsupported commercial claims may be fabricated.

## Product Principles

- Put useful products and shops ahead of decorative promotion.
- Keep merchandising controlled, schedulable, and resilient.
- Preserve commerce truth and identity across systems.
- Make every promotion optional enrichment, never a page dependency.
- Keep navigation and recovery paths obvious.

## Accessibility & Inclusion

All new storefront work must meet WCAG 2.2 AA and remain usable with keyboard navigation, reduced motion, zoom, and responsive layouts.
