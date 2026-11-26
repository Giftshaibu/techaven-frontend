import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffRequest } from '@/integrations/techaven/staff';
import { buttonClass, inputClass, PageHeader, Panel, Field, ErrorBlock, LoadingBlock, StatusPill, errorMessage, mwk, useStaffSession } from './kit';

type Campaign = { slug: string; headline: string };
type Candidate = { id: number; shop_name: string; product_name: string; condition: string; price: number; currency: string; quantity: number; ram_gb: string | null; storage_gb: number | null };
type Request = { id: number; campaign_slug: string; shop_name: string; product_name: string; listing_id: number; status: string; review_note: string | null; current_price: number; current_quantity: number; offer_snapshot: { price: string; currency: string } | string };
const base = '/api/promotion-participation';
const approvedPrice = (request: Request) => {
  try { return (typeof request.offer_snapshot === 'string' ? JSON.parse(request.offer_snapshot) : request.offer_snapshot).price as string; }
  catch { return ''; }
};

export function PromotionParticipationPage({ admin = false }: { admin?: boolean }) {
  const client = useQueryClient();
  const session = useStaffSession();
  const actor = session?.user.id;
  const [chosenCampaign, setCampaign] = useState('');
  const [search, setSearch] = useState('');
  const [listing, setListing] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const campaigns = useQuery({ queryKey: ['participation', 'campaigns'], queryFn: () => staffRequest<Campaign[]>(`${base}/campaigns`, { auth: false }) });
  const slug = chosenCampaign || campaigns.data?.[0]?.slug || '';
  const candidates = useQuery({ queryKey: ['participation', actor, admin, 'candidates', search], enabled: Boolean(slug && actor),
    queryFn: () => staffRequest<Candidate[]>(`${base}/candidates?search=${encodeURIComponent(search)}`) });
  const requests = useQuery({ queryKey: ['participation', actor, admin, 'requests', slug], enabled: Boolean(slug && actor),
    queryFn: () => staffRequest<Request[]>(`${base}/requests?campaign=${encodeURIComponent(slug)}`) });
  const refresh = () => client.invalidateQueries({ queryKey: ['participation'] });
  const submit = useMutation({ mutationFn: () => staffRequest(`${base}/requests`, { method: 'POST', body: { campaign_slug: slug, listing_id: Number(listing) } }),
    onSuccess: () => { setListing(''); toast.success(admin ? 'Shop offer approved for this promotion' : 'Offer submitted for staff review'); void refresh(); },
    onError: error => toast.error(errorMessage(error)) });
  const review = useMutation({ mutationFn: ({ id, status }: { id: number; status: string }) => staffRequest(`${base}/requests/${id}`, { method: 'PATCH', body: { status, note: notes[id] || '' } }),
    onSuccess: () => { toast.success('Participation review saved'); void refresh(); }, onError: error => toast.error(errorMessage(error)) });
  const withdraw = useMutation({ mutationFn: (id: number) => staffRequest(`${base}/requests/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Offer removed from the promotion'); void refresh(); }, onError: error => toast.error(errorMessage(error)) });

  return <div className="space-y-6">
    <PageHeader eyebrow="Shop participation" title="Promotions" description={admin
      ? 'Choose specific shop offers or review seller applications. Approval applies to the displayed offer and price.'
      : 'Submit an in-stock offer from your shop. Staff approval is required before it appears in a promotion.'} />
    {campaigns.isPending ? <LoadingBlock /> : campaigns.isError ? <ErrorBlock error={campaigns.error} /> : !campaigns.data?.length ?
      <Panel title="No promotions accepting offers"><p className="text-sm text-muted-foreground">{admin ? 'In Strapi, enable useParticipatingOffers on a banner rail or square tile, then publish it. It will appear here.' : 'Check back when Techaven opens a promotion for shop offers.'}</p></Panel> : <>
      <Field label="Promotion"><select className={inputClass} value={slug} onChange={event => { setCampaign(event.target.value); setListing(''); }}>
        {campaigns.data.map(item => <option key={item.slug} value={item.slug}>{item.headline}</option>)}
      </select></Field>
      <Panel title={admin ? 'Select a shop offer' : 'Apply with your shop offer'}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={event => { event.preventDefault(); submit.mutate(); }}>
          <Field label="Find a product"><input className={inputClass} value={search} placeholder="Search by product name" onChange={event => { setSearch(event.target.value); setListing(''); }} /></Field>
          <Field label={admin ? 'Shop and product offer' : 'Your available offers'}><select className={inputClass} required disabled={candidates.isPending || candidates.isError} value={listing} onChange={event => setListing(event.target.value)}>
            <option value="">Choose an offer</option>
            {candidates.data?.map(item => <option key={item.id} value={item.id}>{item.shop_name} · {item.product_name} · {item.storage_gb ? `${item.storage_gb} GB · ` : ''}{item.condition} · {item.currency} {item.price.toLocaleString()} · stock {item.quantity}</option>)}
          </select></Field>
          {candidates.isError && <ErrorBlock error={candidates.error} />}
          {!candidates.isPending && !candidates.isError && !candidates.data?.length && <p className="text-sm text-muted-foreground md:col-span-2">No eligible offers found. The shop and product must be active, approved and in stock.</p>}
          <div className="md:col-span-2"><button className={buttonClass.primary} disabled={!listing || submit.isPending}>{submit.isPending ? 'Saving…' : admin ? 'Add and approve offer' : 'Request to join'}</button></div>
        </form>
      </Panel>
      <Panel title={admin ? 'Participating shops and applications' : 'Your applications'}>
        {requests.isPending ? <LoadingBlock /> : requests.isError ? <ErrorBlock error={requests.error} /> : !requests.data?.length ?
          <p className="text-sm text-muted-foreground">{admin ? 'No shop offers selected or submitted for this promotion yet.' : 'Choose one of your offers above to request participation.'}</p> :
          <ul className="divide-y divide-border">{requests.data.map(item => <li key={item.id} className="space-y-3 py-5 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-ink-800">{item.product_name}</h2><p className="text-sm text-muted-foreground">{item.shop_name} · Offer #{item.listing_id} · {mwk(item.current_price)} · stock {item.current_quantity}</p></div><StatusPill status={item.status} /></div>
            {item.status === 'approved' && (item.current_quantity < 1 || Number(approvedPrice(item)) !== Number(item.current_price)) && <p role="status" className="text-sm text-amber-800">This offer is hidden because its stock or reviewed price changed. {admin ? 'Review it again before displaying it.' : 'Restock it or submit the changed offer for review.'}</p>}
            {item.review_note && <p className="text-sm text-ink-800">Review note: {item.review_note}</p>}
            {item.status !== 'withdrawn' && <div className="flex flex-wrap items-end gap-3">
              {admin && <><Field label="Review note (required for rejection)"><input maxLength={1000} className={inputClass} value={notes[item.id] || ''} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} /></Field>
                <button className={buttonClass.primary} disabled={review.isPending} onClick={() => review.mutate({ id: item.id, status: 'approved' })}>Approve current offer</button>
                <button className={buttonClass.secondary} disabled={review.isPending || !notes[item.id]?.trim()} onClick={() => review.mutate({ id: item.id, status: 'rejected' })}>Reject</button></>}
              <button className={buttonClass.secondary} disabled={withdraw.isPending} onClick={() => withdraw.mutate(item.id)}>{admin ? 'Remove from promotion' : 'Withdraw offer'}</button>
            </div>}
          </li>)}</ul>}
      </Panel>
    </>}
  </div>;
}
