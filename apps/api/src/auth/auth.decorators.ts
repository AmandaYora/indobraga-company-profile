import { SetMetadata } from "@nestjs/common";

export const AUTH_REQUIRED_METADATA = "indobraga:auth-required";
export const PUBLIC_ROUTE_METADATA = "indobraga:public-route";
export const SKIP_CSRF_METADATA = "indobraga:skip-csrf";

export const RequireAuth = () => SetMetadata(AUTH_REQUIRED_METADATA, true);

export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE_METADATA, true);

export const SkipCsrf = () => SetMetadata(SKIP_CSRF_METADATA, true);
