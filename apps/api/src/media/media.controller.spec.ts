import type { Request } from "express";
import { MediaController } from "@/media/media.controller";

const request = { adminUser: { id: 9 } } as unknown as Request;
const file = {
  buffer: Buffer.from("image"),
  mimetype: "image/png",
  originalname: "a.png",
} as Express.Multer.File;

const mediaMock = () => ({
  detail: jest.fn().mockResolvedValue({ id: 5 }),
  list: jest.fn().mockResolvedValue({ items: [] }),
  remove: jest.fn().mockResolvedValue({ id: 5, status: "deleted" }),
  retry: jest.fn().mockResolvedValue({ id: 5, status: "processing" }),
  upload: jest.fn().mockResolvedValue({ id: 5 }),
});

describe("MediaController", () => {
  it("proxies media management requests with the authenticated actor id", async () => {
    const media = mediaMock();
    const controller = new MediaController(media as never);
    const query = { page: 1, type: "image" } as never;
    const uploadDto = { alt_text: "Logo" } as never;

    await expect(controller.upload(file, uploadDto, request)).resolves.toEqual({ id: 5 });
    await expect(controller.list(query)).resolves.toEqual({ items: [] });
    await expect(controller.detail({ id: 5 })).resolves.toEqual({ id: 5 });
    await expect(controller.remove({ id: 5 }, request)).resolves.toEqual({
      id: 5,
      status: "deleted",
    });
    await expect(controller.retry({ id: 5 }, request)).resolves.toEqual({
      id: 5,
      status: "processing",
    });

    expect(media.upload).toHaveBeenCalledWith(file, uploadDto, { id: 9 });
    expect(media.list).toHaveBeenCalledWith(query);
    expect(media.detail).toHaveBeenCalledWith(5);
    expect(media.remove).toHaveBeenCalledWith(5, { id: 9 });
    expect(media.retry).toHaveBeenCalledWith(5, { id: 9 });
  });
});
