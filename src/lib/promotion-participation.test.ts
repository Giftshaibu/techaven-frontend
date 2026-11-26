import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), device: vi.fn(), devices: vi.fn(), map: vi.fn((device: unknown) => device) }));
vi.mock('@/integrations/techaven/client', () => ({ techavenRequest: mocks.request, TechavenApiError: class extends Error {} }));
vi.mock('@/integrations/techaven/customer', () => ({ getMarketplaceDevice: mocks.device, getMarketplaceDevices: mocks.devices, getShop: vi.fn() }));
vi.mock('@/lib/catalog-api', () => ({ mapMarketplaceDeviceToCatalog: mocks.map, mapApiShopToCatalog: vi.fn() }));
import { resolveParticipatingOffers, resolvePromotionProducts } from './promotion-commerce';
afterEach(() => vi.clearAllMocks());

test('CMS references resolve by slug when production has different numeric IDs', async () => {
  mocks.device.mockResolvedValueOnce({ id: 143384, slug: 'galaxy-a57-5g' });
  expect(await resolvePromotionProducts([{ externalId: 'device:28083', slug: 'galaxy-a57-5g' }]))
    .toEqual([{ id: 143384, slug: 'galaxy-a57-5g' }]);
  expect(mocks.device).toHaveBeenCalledWith('galaxy-a57-5g');
  expect(mocks.devices).not.toHaveBeenCalled();
});

test('a missing slug cannot resolve to an unrelated device with the old numeric ID', async () => {
  mocks.device.mockRejectedValueOnce(new Error('Not found'));
  expect(await resolvePromotionProducts([{ externalId: 'device:28083', slug: 'missing-phone' }])).toEqual([]);
  expect(mocks.devices).not.toHaveBeenCalled();
});
test('participation reads only the campaign-approved shop offers', async () => {
  const approved = [{ id: 1, offers: [{ id: 101, shop: { id: 9 } }] }, { id: 1, offers: [{ id: 102, shop: { id: 10 } }] }];
  mocks.request.mockResolvedValue(approved);
  expect(await resolveParticipatingOffers('used-iphones')).toEqual(approved);
  expect(mocks.request).toHaveBeenCalledWith('/api/promotion-participation/offers/used-iphones', { auth: false });
  expect(mocks.devices).not.toHaveBeenCalled();
});
test('a failed participation service cannot substitute unrelated marketplace offers', async () => {
  mocks.request.mockRejectedValue(new Error('Unavailable'));
  expect(await resolveParticipatingOffers('used-iphones')).toEqual([]);
  expect(mocks.devices).not.toHaveBeenCalled();
});
