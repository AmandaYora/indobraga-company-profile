import type { CookieOptions, Request, Response } from "express";

export function getCookieValue(request: Request, name: string): string | undefined {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[name];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function createCookieOptions(isProduction: boolean, maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function setSessionCookie(
  response: Response,
  name: string,
  value: string,
  isProduction: boolean,
  maxAgeMs: number,
): void {
  response.cookie(name, value, createCookieOptions(isProduction, maxAgeMs));
}

export function setCsrfCookie(
  response: Response,
  name: string,
  value: string,
  isProduction: boolean,
  maxAgeMs: number,
): void {
  response.cookie(name, value, {
    ...createCookieOptions(isProduction, maxAgeMs),
    httpOnly: false,
  });
}

export function clearCookie(response: Response, name: string, isProduction: boolean): void {
  response.clearCookie(name, {
    ...createCookieOptions(isProduction),
    maxAge: undefined,
  });
}
