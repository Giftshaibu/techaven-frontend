import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BannerWithRail } from './PromotionCommerce';
import { promotionSchema } from '@/lib/cms/promotions';

vi.mock('./PromotionPrimitives', () => ({ PromotionMedia: () => null, PromotionCopy: () => null, PromotionAction: () => null }));
describe('banner rail desktop artwork', () => {
  const base = { id: 'rail', slug: 'rail', headline: 'Rail', subheadline: null, body: null, layout: 'banner_with_rail', placement: 'home_promo_rails', theme: 'brand',
    desktopBackground: { url: 'https://images.example/current.jpg', alt: 'Current' }, desktopStripArtwork: { url: 'https://images.example/old.jpg', alt: 'Old' },
    mobileBackground: null, foregroundImage: null, cta: null, commerceOfferKey: null, productRefs: [], shopRefs: [] };
  const render = (data: unknown) => renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><BannerWithRail promotion={promotionSchema.parse(data)} heading="h2" /></QueryClientProvider>);
  it('renders the image edited in desktopBackground even if legacy strip artwork exists', () => {
    const html = render(base);
    expect(html).toContain('https://images.example/current.jpg');
    expect(html).not.toContain('https://images.example/old.jpg');
  });
  it('preserves legacy strip artwork when the main image is absent', () => {
    expect(render({ ...base, desktopBackground: null })).toContain('https://images.example/old.jpg');
  });
});
