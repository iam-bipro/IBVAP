import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("sentinelx-demo-user")?.value === "true";

  // If in demo mode or demo cookie exists, allow access directly
  if (isDemo) {
    return <>{children}</>;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return <>{children}</>;
    }
  } catch (err) {
    // Supabase endpoint offline or unconfigured
    console.warn("Supabase auth check failed in ProtectedLayout, falling back to demo session:", err);
    return <>{children}</>;
  }

  redirect("/auth");
}