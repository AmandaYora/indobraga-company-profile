export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      adminUser?: {
        id: number;
        name: string;
        email: string;
        role: "super_admin" | "content_editor";
        permissions: string[];
      };
    }
  }
}
