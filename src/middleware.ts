export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/goals/:path*",
    "/api/weight/:path*",
    "/api/partners/:path*",
    "/api/user/:path*"
  ]
}; 