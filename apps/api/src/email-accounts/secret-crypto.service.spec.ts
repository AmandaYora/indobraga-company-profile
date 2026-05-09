import { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { SecretCryptoService } from "@/email-accounts/secret-crypto.service";

describe("SecretCryptoService", () => {
  it("encrypts and decrypts secrets without returning plaintext payloads", () => {
    const config = {
      get: () => "test-credential-encryption-key-32-chars",
    } as unknown as ConfigService<Env, true>;
    const service = new SecretCryptoService(config);
    const encrypted = service.encrypt("smtp-secret-password");

    expect(encrypted).not.toContain("smtp-secret-password");
    expect(encrypted.startsWith("v1:")).toBe(true);
    expect(service.decrypt(encrypted)).toBe("smtp-secret-password");
  });

  it("uses random IVs for the same plaintext", () => {
    const config = {
      get: () => "test-credential-encryption-key-32-chars",
    } as unknown as ConfigService<Env, true>;
    const service = new SecretCryptoService(config);

    expect(service.encrypt("same-secret")).not.toBe(service.encrypt("same-secret"));
  });
});
