import { describe, it, expect } from "vitest";
import {
  uploadGateSchema,
  phoneNormalizationSchema,
  createJobUploadSchema,
  takedownRequestSchema,
} from "./index";

describe("Validation Schemas & Gate Constraints", () => {
  it("strictly enforces the upload gate agreement", () => {
    // Missing agreement fails
    expect(uploadGateSchema.safeParse({}).success).toBe(false);
    expect(uploadGateSchema.safeParse({ confirmOwnership: false }).success).toBe(false);

    // True agreement succeeds
    expect(uploadGateSchema.safeParse({ confirmOwnership: true }).success).toBe(true);
  });

  it("validates direct storage upload paths strictly", () => {
    // Valid user uuid / file id path
    const valid = createJobUploadSchema.safeParse({
      confirmOwnership: true,
      sourceType: "upload",
      sourcePath: "d83f3e2b-7c42-4f33-b452-9b21a719c8f1/raw_video.mp4",
    });
    expect(valid.success).toBe(true);

    // Path traversal attempt fails
    const traversal = createJobUploadSchema.safeParse({
      confirmOwnership: true,
      sourceType: "upload",
      sourcePath: "../../etc/passwd",
    });
    expect(traversal.success).toBe(false);
  });

  it("normalizes Kenyan phone numbers correctly for Daraja / M-Pesa", () => {
    expect(phoneNormalizationSchema.parse("0712345678")).toBe("254712345678");
    expect(phoneNormalizationSchema.parse("0112345678")).toBe("254112345678");
    expect(phoneNormalizationSchema.parse("+254 712 345 678")).toBe("254712345678");
    expect(phoneNormalizationSchema.parse("254712345678")).toBe("254712345678");
    expect(phoneNormalizationSchema.parse("712345678")).toBe("254712345678");
  });

  it("rejects invalid phone numbers", () => {
    expect(() => phoneNormalizationSchema.parse("abc-not-a-number")).toThrow();
    expect(() => phoneNormalizationSchema.parse("123")).toThrow();
  });

  it("validates takedown requests strictly", () => {
    const valid = takedownRequestSchema.safeParse({
      reporterName: "Content Owner",
      reporterEmail: "legal@copyright.org",
      contentUrl: "https://cliplane.tech/clips/123",
      description: "This footage is taken directly from my livestream without permission.",
    });
    expect(valid.success).toBe(true);

    // Too short description fails
    const invalid = takedownRequestSchema.safeParse({
      reporterName: "Content Owner",
      reporterEmail: "legal@copyright.org",
      contentUrl: "https://cliplane.tech/clips/123",
      description: "Delete this",
    });
    expect(invalid.success).toBe(false);
  });
});
