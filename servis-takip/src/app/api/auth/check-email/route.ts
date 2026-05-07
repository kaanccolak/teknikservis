import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ exists: false });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ exists: false }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const normalized = email.toLowerCase();
    let page = 1;
    const perPage = 1000;

    for (;;) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        return NextResponse.json({ exists: false }, { status: 500 });
      }

      const exists = data.users.some(
        (u) => u.email?.toLowerCase() === normalized,
      );
      if (exists) {
        return NextResponse.json({ exists: true });
      }

      if (data.users.length < perPage) {
        break;
      }
      page += 1;
    }

    return NextResponse.json({ exists: false });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
