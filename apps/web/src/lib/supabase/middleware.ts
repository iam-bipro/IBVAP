import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // Check for demo bypass session or demo URL param
  const demoParam = request.nextUrl.searchParams.get("demo");
  const isDemoCookie = request.cookies.get("ibvap-demo-user")?.value === "true";
  const isDemo = isDemoCookie || demoParam === "true";

  if (demoParam === "true" && !isDemoCookie) {
    response.cookies.set("ibvap-demo-user", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  const isLanding = request.nextUrl.pathname === "/";
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isOnboardRoute = request.nextUrl.pathname.startsWith("/onboard");
  const isProtectedRoute = !isLanding && !isAuthRoute && !isOnboardRoute;

  // If in demo mode, allow access to protected and onboard routes
  if (isDemo) {
    if (isAuthRoute) {
      const redirectUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  let user = null;
  let error = null;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
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

      const authRes = await supabase.auth.getUser();
      user = authRes.data?.user ?? null;
      error = authRes.error;
    }
  } catch (err) {
    // Supabase endpoint unavailable or offline
    console.warn("Supabase auth unreachable:", err);
  }

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
    const isOnboard = user?.user_metadata?.onboard;
    if (isOnboard) {
      const redirectUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isProtectedRoute) {
    const isOnboard = user?.user_metadata?.onboard;
    if (!isOnboard) {
      const redirectUrl = new URL("/onboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
