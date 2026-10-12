// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from './cart';
import { getCart } from '@/integrations/techaven/customer';
import { getSession } from '@/integrations/techaven/token';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let identity: { user: { id: number } | null; loading: boolean } = { user: null, loading: true };
vi.mock('@/lib/auth', () => ({ useAuth: () => identity }));
vi.mock('@/integrations/techaven/token', () => ({ getSession: vi.fn() }));
vi.mock('@/integrations/techaven/customer', () => ({ getCart: vi.fn(), addCartItem: vi.fn(), clearCart: vi.fn(), removeCartItem: vi.fn(), updateCartItem: vi.fn() }));
let root: ReturnType<typeof createRoot>;
function Basket() { const cart = useCart(); return <span>{cart.count}</span>; }
afterEach(async () => { if (root) await act(async () => root.unmount()); localStorage.clear(); document.body.replaceChildren(); vi.clearAllMocks(); });
describe('basket session ownership', () => {
  it('waits for authentication restoration and does not copy account items into the guest basket on logout', async () => {
    const item = { id: 1, seller_listing_id: 123, quantity: 1, unit_price: 499000, is_available: true,
      listing: { variant: { device: { id: 42, slug: 'test-phone', name: 'Test Phone' } }, shop: { id: 1, name: 'Shop' }, images: [] } };
    vi.mocked(getCart).mockResolvedValue({ items: [item] } as Awaited<ReturnType<typeof getCart>>);
    identity = { user: null, loading: true };
    const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    await act(async () => root.render(<CartProvider><Basket /></CartProvider>));
    expect(getCart).not.toHaveBeenCalled(); expect(localStorage.getItem('techaven.cart.v2')).toBeNull();
    identity = { user: { id: 12 }, loading: false };
    vi.mocked(getSession).mockReturnValue({ user: { id: 12 } } as ReturnType<typeof getSession>);
    await act(async () => root.render(<CartProvider><Basket /></CartProvider>));
    expect(container.textContent).toBe('1');
    identity = { user: null, loading: false }; vi.mocked(getSession).mockReturnValue(null);
    await act(async () => root.render(<CartProvider><Basket /></CartProvider>));
    expect(container.textContent).toBe('0'); expect(localStorage.getItem('techaven.cart.v2')).toBe('[]');
  });
});
