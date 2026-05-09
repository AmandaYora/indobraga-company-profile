import {
  clearCookie,
  createCookieOptions,
  getCookieValue,
  setCsrfCookie,
  setSessionCookie,
} from "@/auth/cookie.utils";
import type { Request, Response } from "express";

describe("cookie utils", () => {
  it("reads non-empty cookie values", () => {
    expect(getCookieValue({ cookies: { token: "abc" } } as unknown as Request, "token")).toBe(
      "abc",
    );
    expect(
      getCookieValue({ cookies: { token: "" } } as unknown as Request, "token"),
    ).toBeUndefined();
    expect(
      getCookieValue({ cookies: { token: 123 } } as unknown as Request, "token"),
    ).toBeUndefined();
  });

  it("creates secure production cookie options", () => {
    expect(createCookieOptions(true, 1000)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1000,
    });
  });

  it("sets session and csrf cookies with expected httpOnly flags", () => {
    const cookieMock = jest.fn();
    const clearCookieMock = jest.fn();
    const response = { cookie: cookieMock, clearCookie: clearCookieMock } as unknown as Response;

    setSessionCookie(response, "session", "s1", false, 1000);
    setCsrfCookie(response, "csrf", "c1", false, 1000);
    clearCookie(response, "session", false);

    expect(cookieMock).toHaveBeenNthCalledWith(
      1,
      "session",
      "s1",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(cookieMock).toHaveBeenNthCalledWith(
      2,
      "csrf",
      "c1",
      expect.objectContaining({ httpOnly: false }),
    );
    expect(clearCookieMock).toHaveBeenCalledWith(
      "session",
      expect.objectContaining({ httpOnly: true, maxAge: undefined }),
    );
  });
});
