import { describe, expect, it } from "vitest";
import { bankProofProblem, emptyBankProof, toProofPayload } from "./bank-proof";

const complete = {
  ...emptyBankProof("1500"),
  payerBank: " National Bank ",
  payerName: " Test Shopper ",
  receipt: { key: "payment-proofs/u1/a.pdf", url: null, name: "a.pdf" },
};

describe("bank transfer proof", () => {
  it("requires bank, account name, a positive amount and a finished upload", () => {
    expect(bankProofProblem(emptyBankProof())).toMatch(/bank/);
    expect(bankProofProblem({ ...complete, payerName: "" })).toMatch(/account name/);
    for (const amount of ["", "0", "-5", "12.345", "1e3"]) {
      expect(bankProofProblem({ ...complete, amount })).toMatch(/amount/);
    }
    expect(bankProofProblem({ ...complete, uploading: true })).toMatch(/uploading/);
    expect(bankProofProblem({ ...complete, receipt: null })).toMatch(/proof of payment/);
    expect(bankProofProblem(complete)).toBeNull();
  });

  it("sends trimmed fields and the stored receipt key, omitting an empty reference", () => {
    expect(toProofPayload(complete)).toEqual({
      payer_name: "Test Shopper",
      payer_bank: "National Bank",
      declared_amount: "1500",
      receipt_key: "payment-proofs/u1/a.pdf",
    });
    expect(toProofPayload({ ...complete, reference: " TX1 " }).payment_reference).toBe("TX1");
  });
});
