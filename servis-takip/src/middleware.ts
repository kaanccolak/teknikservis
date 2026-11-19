import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login sayfasına gidiyorsa ve zaten giriş yaptıysa dashboard'a yönlendir
  if (request.nextUrl.pathname === "/login" && user) {
    if (user.email === "kaanccolak@gmail.com") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.email !== "kaanccolak@gmail.com") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  // Korumasız sayfalar
  const publicPaths = ["/login", "/landing", "/blog", "/blog/:path*", "/sorgula", "/reset-password", "/sitemap.xml", "/robots.txt", "/api/cron", "/email-dogrulama", "/gizlilik-politikasi", "/hizmet-sartlari", "/kvkk", "/iade-politikasi", "/bayi-kargo-fisi", "/satis-sozlesmesi", "/hizmet-teslimat", "/odeme/basarili", "/odeme/basarisiz"];

  const isPublic = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(path + "/"),
  );

  if (isPublic) {
    return supabaseResponse;
  }

  // Admin olmayan personel için kısıtlı rotalar
  const restrictedForNonAdmin = ["/sirketim", "/raporlar", "/planlarim"];
  const isRestricted = restrictedForNonAdmin.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(path + "/"),
  );
  if (isRestricted && user) {
    const personnelIsAdmin = request.cookies.get("personnelIsAdmin")?.value;
    if (personnelIsAdmin === "false") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Bilinen uygulama rotaları. Giriş yoksa /landing.
  // "/" aynı kuralın parçası. Listede olmayan yollar Next.js 404 sayfasına düşer.
  const appPaths = [
    "/",
    "/bekleyen-cihazlar",
    "/bayiler",
    "/cari",
    "/cihaz-kayit",
    "/cihaz-sorgula",
    "/dis-servis",
    "/dukkan-nushasi",
    "/fis",
    "/ikinci-el",
    "/ikinci-el-fis",
    "/ikinci-el-satis-fisi",
    "/is-emirleri",
    "/kargo-fisi",
    "/paket-sec",
    "/planlarim",
    "/raporlar",
    "/servis-detay",
    "/sirketim",
    "/stok",
    "/teslim-fisi",
    "/whatsapp-mesajlari",
  ];

  const isAppPath = appPaths.some((path) =>
    path === "/"
      ? request.nextUrl.pathname === "/"
      : request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(path + "/"),
  );

  if (isAppPath && !user) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
