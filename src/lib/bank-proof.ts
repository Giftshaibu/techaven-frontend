/** Bank-transfer proof the shopper fills in at checkout or on the order page. */
export type BankProof = {
  payerName: string;
  payerBank: string;
  amount: string;
  reference: string;
  receipt: { key: string; url: string | null; name: string } | null;
  uploading: boolean;
};

export const emptyBankProof = (amount = ""): BankProof => ({
  payerName: "",
  payerBank: "",
  amount,
  reference: "",
  receipt: null,
  uploading: false,
});

/** Returns a message describing what is still missing, or null when the proof is complete. */
export function bankProofProblem(proof: BankProof): string | null {
  if (!proof.payerBank.trim()) return "Enter the bank you paid from.";
  if (!proof.payerName.trim()) return "Enter the account name used for the transfer.";
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(proof.amount.trim()) || Number(proof.amount) <= 0) {
    return "Enter the amount you transferred.";
  }
  if (proof.uploading) return "Wait for the receipt to finish uploading.";
  if (!proof.receipt) return "Upload your proof of payment.";
  return null;
}

/** API fields for POST /api/payment-submissions. Call only when bankProofProblem() is null. */
export function toProofPayload(proof: BankProof) {
  if (!proof.receipt) throw new Error("Upload your proof of payment.");
  return {
    payer_name: proof.payerName.trim(),
    payer_bank: proof.payerBank.trim(),
    declared_amount: proof.amount.trim(),
    ...(proof.reference.trim() ? { payment_reference: proof.reference.trim() } : {}),
    receipt_key: proof.receipt.key,
  };
}
