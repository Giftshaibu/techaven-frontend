// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test } from 'vitest';
import { PromotionMedia } from './PromotionPrimitives';
import { promotionSchema } from '@/lib/cms/promotions';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
test('a replacement banner image can load after the previous image failed', () => {
  const host = document.createElement('div'), root = createRoot(host);
  const promotion = promotionSchema.parse({ id: 'rail', slug: 'rail', headline: 'Rail', subheadline: null, body: null, layout: 'banner_with_rail', placement: 'home_promo_rails', theme: 'brand',
    desktopBackground: { url: 'https://images.example/old.jpg', alt: 'Old' }, mobileBackground: null, foregroundImage: null, cta: null, commerceOfferKey: null, productRefs: [], shopRefs: [] });
  try {
    act(() => root.render(<PromotionMedia promotion={promotion} />));
    act(() => host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.querySelector('img')).toBeNull();
    act(() => root.render(<PromotionMedia promotion={{ ...promotion, desktopBackground: { url: 'https://images.example/new.jpg', alt: 'New' } }} />));
    expect(host.querySelector('img')?.getAttribute('src')).toBe('https://images.example/new.jpg');
  } finally { act(() => root.unmount()); }
});
