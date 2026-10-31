// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { ShopHero } from "./ShopHero";
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
test("shop hero exposes contacts, delivery and price enquiry without a fabricated price",()=>{
 const node=document.createElement("div");const root=createRoot(node);
 act(()=>root.render(<ShopHero shop={{apiId:9,slug:'s-9',name:'Tech Central',location:'Lilongwe',specialty:'Phones',blurb:'Phones at Olympic Mall.',verified:false,rating:0,orders:3,address:'Shop 50',phone:'+265888228315',profile:{delivery:'Delivery in Lilongwe',enquiries:[{name:'iPhone 13 Pro Max',storage_gb:128,battery_health_percent:87,condition:'used',price_label:'Price on enquiry'}]}}} />));
 expect(node.textContent).toContain('Shop 50');expect(node.textContent).toContain('Price on enquiry');expect(node.textContent).toContain('87%');expect(node.querySelector('a')?.href).toBe('tel:+265888228315');expect(node.textContent).not.toContain('MWK 0');
 act(()=>root.unmount());
});
