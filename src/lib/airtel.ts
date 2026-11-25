/** Airtel Malawi numbers: 9 digits starting with 9 once the leading 0 / +265 is removed. */
export function isAirtelNumber(value: string) {
  const local = value
    .replace(/[\s-]/g, "")
    .replace(/^\+?265/, "")
    .replace(/^0/, "");
  return /^9\d{8}$/.test(local);
}

type Transaction = { status?: unknown };

/** Reads an Airtel enquiry using the same codes as the server; anything unknown is undecided. */
export function airtelState(raw: unknown): "paid" | "failed" | "pending" {
  const body = (raw ?? {}) as {
    data?: { transaction?: Transaction };
    transaction?: Transaction;
  };
  const code = String(
    body.data?.transaction?.status ?? body.transaction?.status ?? "",
  ).toUpperCase();
  if (code === "TS" || code === "SUCCESS") return "paid";
  if (code === "TF" || code === "FAILED" || code === "TE") return "failed";
  return "pending";
}
