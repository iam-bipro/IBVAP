import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isLanding = request.nextUrl.pathname === "/";
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isOnboardRoute = request.nextUrl.pathname.startsWith("/onboard");
  const isProtectedRoute = !isLanding && !isAuthRoute && !isOnboardRoute;

  if (error || !user) {
    if (isProtectedRoute || isOnboardRoute) {
      const redirectUrl = new URL("/auth", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  if (isAuthRoute) {
    const redirectUrl = new URL("/onboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (isOnboardRoute) {
    const isOnboard = user?.user_metadata.onboard;
    if (isOnboard) {
      const redirectUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isProtectedRoute) {
    const isOnboard = user?.user_metadata.onboard;
    if (!isOnboard) {
      const redirectUrl = new URL("/onboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}