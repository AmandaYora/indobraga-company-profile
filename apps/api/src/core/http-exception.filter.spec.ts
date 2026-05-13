import { BadRequestException, HttpStatus, InternalServerErrorException } from "@nestjs/common";
import type { Request, Response } from "express";
import { HttpExceptionFilter } from "@/core/http-exception.filter";

const host = (request: Partial<Request>, response: Partial<Response>) =>
  ({
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  }) as never;

describe("HttpExceptionFilter", () => {
  it("wraps known HTTP exceptions in API error envelope", () => {
    const filter = new HttpExceptionFilter();
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    const response = { status: statusMock, json: jsonMock } as unknown as Response;
    const request = {
      requestId: "req_1",
      method: "POST",
      originalUrl: "/admin/users",
    } as unknown as Request;

    filter.catch(
      new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Data tidak valid.",
        details: [{ field: "email", message: "Email wajib diisi." }, { message: "Global" }],
      }),
      host(request, response),
    );

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tidak valid.",
        details: [
          { field: "email", message: "Email wajib diisi." },
          { field: undefined, message: "Global" },
        ],
      },
      meta: { request_id: "req_1", timestamp: expect.any(String) as string },
    });
  });

  it("normalizes unknown exceptions as internal errors", () => {
    const filter = new HttpExceptionFilter();
    const loggerSpy = jest.spyOn(filter["logger"], "error").mockImplementation(() => undefined);
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    const response = { status: statusMock, json: jsonMock } as unknown as Response;
    const request = {
      requestId: "req_2",
      method: "GET",
      originalUrl: "/admin",
    } as unknown as Request;

    filter.catch(new Error("boom"), host(request, response));

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Sistem sedang mengalami kendala." },
      }),
    );
    expect(loggerSpy).toHaveBeenCalled();
  });

  it("uses default error code when payload code is not part of API contract", () => {
    const filter = new HttpExceptionFilter();
    jest.spyOn(filter["logger"], "error").mockImplementation(() => undefined);
    const jsonMock = jest.fn();
    const response = { status: jest.fn().mockReturnThis(), json: jsonMock } as unknown as Response;
    const request = { requestId: "req_3" } as unknown as Request;

    filter.catch(new InternalServerErrorException({ code: "UNKNOWN" }), host(request, response));

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          code: "INTERNAL_ERROR",
          details: undefined,
          message: "Sistem sedang mengalami kendala.",
        },
      }),
    );
  });

  it("uses friendly defaults when framework exceptions do not provide API codes", () => {
    const filter = new HttpExceptionFilter();
    const jsonMock = jest.fn();
    const response = { status: jest.fn().mockReturnThis(), json: jsonMock } as unknown as Response;
    const request = { requestId: "req_4" } as unknown as Request;

    filter.catch(
      new BadRequestException("Response payload should not leak"),
      host(request, response),
    );

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          code: "BAD_REQUEST",
          details: undefined,
          message: "Permintaan belum bisa diproses.",
        },
      }),
    );
  });
});
