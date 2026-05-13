import { UsersController } from "@/users/users.controller";

const usersMock = () => ({
  create: jest.fn().mockResolvedValue({ id: 3 }),
  disable: jest.fn().mockResolvedValue({ id: 3, status: "disabled" }),
  findById: jest.fn().mockResolvedValue({ id: 3 }),
  list: jest.fn().mockResolvedValue({ items: [] }),
  update: jest.fn().mockResolvedValue({ id: 3, name: "Admin Baru" }),
  updateStatus: jest.fn().mockResolvedValue({ id: 3, status: "active" }),
});

describe("UsersController", () => {
  it("proxies user management requests to the service", async () => {
    const users = usersMock();
    const controller = new UsersController(users as never);
    const query = { page: 1, q: "admin" } as never;
    const adminUser = { role: "super_admin" } as const;
    const request = { adminUser } as never;
    const createDto = { email: "admin@example.com", name: "Admin", password: "secret" } as never;
    const updateDto = { name: "Admin Baru" } as never;
    const statusDto = { status: "active" } as never;

    await expect(controller.list(query, request)).resolves.toEqual({ items: [] });
    await expect(controller.detail({ id: 3 }, request)).resolves.toEqual({ id: 3 });
    await expect(controller.create(createDto, request)).resolves.toEqual({ id: 3 });
    await expect(controller.update({ id: 3 }, updateDto, request)).resolves.toEqual({
      id: 3,
      name: "Admin Baru",
    });
    await expect(controller.updateStatus({ id: 3 }, statusDto, request)).resolves.toEqual({
      id: 3,
      status: "active",
    });
    await expect(controller.disable({ id: 3 }, request)).resolves.toEqual({
      id: 3,
      status: "disabled",
    });

    expect(users.list).toHaveBeenCalledWith(query, adminUser);
    expect(users.findById).toHaveBeenCalledWith(3, adminUser);
    expect(users.create).toHaveBeenCalledWith(createDto, adminUser);
    expect(users.update).toHaveBeenCalledWith(3, updateDto, adminUser);
    expect(users.updateStatus).toHaveBeenCalledWith(3, statusDto, adminUser);
    expect(users.disable).toHaveBeenCalledWith(3, adminUser);
  });
});
