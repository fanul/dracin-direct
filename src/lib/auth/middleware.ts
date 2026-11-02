import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for Supabase Auth session management.
 * 
 * This middleware refreshes the session on each request and handles
 * auth cookie management. It should be added to your middleware.ts.
 * 
 * Usage in middleware.ts:
 * ```ts
 * import { authMiddleware } from '@/lib/auth/middleware';
 * 
 * export async function middleware(request: NextRequest) {
 *   return authMiddleware(request);
 * }
 * 
 * export const config = {
 *   matcher: [
 *     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 *   ],
 * };
 * ```
 */
export async function authMiddleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Skip auth middleware if env vars are not set
        return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make your application
    // vulnerable to attacks.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Optional: Protect routes that require authentication
    // Uncomment and modify as needed:
    // if (!user && request.nextUrl.pathname.startsWith('/protected')) {
    //   const url = request.nextUrl.clone();
    //   url.pathname = '/login';
    //   return NextResponse.redirect(url);
    // }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next()
    // make sure to:
    // 1. Pass the request in the NextResponse.next() method like so:
    //    const res = NextResponse.next({ request });
    // 2. Copy over the cookies from the supabaseResponse to the new response
    //    res.cookies.setAll(supabaseResponse.cookies.getAll());
    // 3. Change the supabaseResponse variable to the new response object.

    return supabaseResponse;
}