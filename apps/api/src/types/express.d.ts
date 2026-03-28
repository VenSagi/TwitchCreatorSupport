import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    clerkUserId?: string;
    clerkSession?: Record<string, unknown>;
  }
}
