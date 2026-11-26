import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), devices: vi.fn(), map: vi.fn((device: unknown) => device) }));
vi.mock('@/integrations/techaven/client', () => ({ techavenRequest: mocks.request, TechavenApiError: class extends Error {} }));
vi.mock('@/integrations/techaven/customer', () => ({ getMarketplaceDevices: mocks.devices, getShop: vi.fn() }));
vi.mock('@/lib/catalog-api', () => ({ mapMarketplaceDeviceToCatalog: mocks.map, mapApiShopToCatalog: vi.fn() }));
import { resolveParticipatingOffers } from './promotion-commerce';
afterEach(() => vi.clearAllMocks());
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
