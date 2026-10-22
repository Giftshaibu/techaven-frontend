import { describe,it,expect } from 'vitest';
import { offerFacts, configurationFacts } from './offer-facts';
describe('public offer facts',()=>{
 it('preserves defects, exact versus minimum battery health and tax',()=>{
  expect(offerFacts({condition_details:{fingerprint_reader:'not_working',battery_health_above_percent:90},tax_exclusive:true})).toEqual([
   'Price excludes VAT. Confirm the final VAT-inclusive price with the shop.', 'Fingerprint reader does not work.', 'Battery health: above 90%.']);
  expect(offerFacts({condition_details:{battery_health_percent:88}})).toEqual(['Battery health: 88%.']);
 });
 it('keeps memory extension separate and never exposes source commentary',()=>{
  expect(offerFacts({extended_ram_gb:2})).toEqual(['2 GB extended RAM (uses storage).']);
  expect(offerFacts()).toEqual([]);
 });
});

it("shows only scalar seller configuration facts", () => {
 expect(configurationFacts({configuration: {cpu: "Core i5 11th generation", storage_type: "SSD", source: {raw: "private"}}})).toEqual([{label: "cpu", value: "Core i5 11th generation"}, {label: "storage type", value: "SSD"}]);
});
