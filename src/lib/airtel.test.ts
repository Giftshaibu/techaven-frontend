import { describe, expect, it } from "vitest";

import { airtelState, isAirtelNumber } from "./airtel";

describe("airtel", () => {
  it("accepts Airtel numbers only", () => {
    for (const value of ["0991 234 567", "+265991234567", "991234567"])
      expect(isAirtelNumber(value)).toBe(true);
    for (const value of ["0881234567", "099123", ""]) expect(isAirtelNumber(value)).toBe(false);
  });

  it("only treats explicit TS/TF transaction codes as final", () => {
    expect(airtelState({ data: { transaction: { status: "TS" } } })).toBe("paid");
    expect(airtelState({ transaction: { status: "TF" } })).toBe("failed");
    expect(airtelState({ data: { transaction: { status: "TIP" } } })).toBe("pending");
    // The envelope reports that the enquiry worked, not that the customer paid.
    expect(airtelState({ status: { success: true, code: "200" } })).toBe("pending");
    expect(airtelState(undefined)).toBe("pending");
  });
});
