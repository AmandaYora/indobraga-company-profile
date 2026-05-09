import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Env } from "@/config/env";

@Injectable()
export class SecretCryptoService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
      "v1",
      iv.toString("base64url"),
      tag.toString("base64url"),
      encrypted.toString("base64url"),
    ].join(":");
  }

  decrypt(payload: string): string {
    const [version, iv, tag, encrypted] = payload.split(":");
    if (version !== "v1" || !iv || !tag || !encrypted) {
      throw new Error("Invalid encrypted secret payload.");
    }

    const decipher = createDecipheriv("aes-256-gcm", this.key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }

  private key(): Buffer {
    return createHash("sha256")
      .update(this.config.get("CREDENTIAL_ENCRYPTION_KEY", { infer: true }))
      .digest();
  }
}
