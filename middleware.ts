import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Əgər istifadəçi Admin panelə girmək istəyirsə
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Cookie yoxlayırıq
    const adminToken = request.cookies.get("admin_token");

    // Əgər cookie yoxdursa, Login səhifəsinə yönləndir
    if (!adminToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Middleware yalnız bu adreslərdə işləsin
export const config = {
  matcher: ["/admin/:path*"],
};
