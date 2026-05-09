export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      adminUser?: {
        id: number;
        name: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}
