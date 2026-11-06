// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManualPayment } from "./ManualPayment";
import { AddressLocation } from "./AddressLocation";
const mock = vi.hoisted(() => ({ config: vi.fn(), context: vi.fn(), submit: vi.fn(), request: vi.fn() }));
vi.mock("@/lib/manual-payments", () => ({ getCommerceConfig: mock.config, getPaymentContext: mock.context, submitPaymentProof: mock.submit }));
vi.mock("@/integrations/techaven/client", () => ({ techavenRequest: mock.request }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => createElement("a", {}, children) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root | undefined;
async function mount(element: React.ReactElement) {
 const host=document.createElement("div");document.body.append(host);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 await act(async()=>{root=createRoot(host);root.render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);});
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30));});return host;
}
afterEach(async()=>{if(root)await act(async()=>root?.unmount());root=undefined;document.body.replaceChildren();vi.clearAllMocks();});
const context={orders:[{id:1,reference:"ORDER-ONE",total:"10.00",payment_status:"pending",status:"pending"},{id:2,reference:"ORDER-TWO",total:"20.00",payment_status:"pending",status:"pending"}],payable_order_ids:[1,2],amount:"30.00",submissions:[]};
describe("mobile commerce task states",()=>{
 it("preserves every checkout order and hides transfer form while configuration is incomplete",async()=>{
  mock.config.mockResolvedValue({manual_payment:{enabled:false}});mock.context.mockResolvedValue(context);
  const host=await mount(<ManualPayment orderId={1}/>);
  expect(host.textContent).toContain("ORDER-ONE");expect(host.textContent).toContain("ORDER-TWO");expect(host.querySelector("form")).toBeNull();
 });
 it("pending review remains distinct from payment approval and restores WhatsApp fallback",async()=>{
  mock.config.mockResolvedValue({manual_payment:{enabled:true}});mock.context.mockResolvedValue({...context,submissions:[{id:"proof",status:"pending_review",whatsapp_url:"https://wa.me/265991234567?text=fixture"}]});
  const host=await mount(<ManualPayment orderId={1}/>);
  expect(host.textContent).toContain("submitted for review");expect(host.textContent).not.toContain("payment has been approved");expect(host.querySelector("form")).toBeNull();expect(host.querySelector('a[href^="https://wa.me/"]')).not.toBeNull();
 });
 it("a rejected proof shows its reason and allows a corrected receipt",async()=>{
  mock.config.mockResolvedValue({manual_payment:{enabled:true,account_name:"Fixture",account_number:"123",provider:"Fixture bank"}});mock.context.mockResolvedValue({...context,submissions:[{id:"proof",status:"rejected",rejection_reason:"Incorrect reference"}]});
  const host=await mount(<ManualPayment orderId={1}/>);
  expect(host.textContent).toContain("Incorrect reference");expect(host.querySelector('input[name="receipt"]')).not.toBeNull();
 });
 it("does not request location on render and preserves manual entry when maps are unconfigured",async()=>{
  mock.request.mockResolvedValue({maps:{key:null}});const onChange=vi.fn();
  const host=await mount(<AddressLocation value={{label:"Home",recipient:"",phone:"",city:"",area:"",street:"",notes:""}} onChange={onChange}/>);
  expect(mock.request).not.toHaveBeenCalled();
  await act(async()=>{host.querySelector("button")?.click();await new Promise(resolve=>setTimeout(resolve,80));});
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,80));});
  await vi.waitFor(async () => { await act(async () => {}); expect(host.textContent).toContain("enter your address below"); }, { timeout: 3000 });expect(onChange).not.toHaveBeenCalled();
 });
});
