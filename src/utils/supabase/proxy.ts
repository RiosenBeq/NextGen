import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey } from './env'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session tazeleme + Auth kontrolü
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // API rotaları için auth kontrolü yapma (kendi içlerinde yapacaklar)
  if (isApiRoute) {
    return supabaseResponse
  }

  // Yönlendirme oluştururken Supabase'in yeni set ettiği session cookie'lerini
  // koru. Aksi takdirde refreshlenen access token kaybolur ve kullanıcı bir
  // sonraki istekte tekrar login'e yönlendirilir (redirect loop).
  function redirectWithCookies(targetPath: string) {
    const url = request.nextUrl.clone()
    url.pathname = targetPath
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie)
    })
    return redirect
  }

  // Kullanıcı giriş yapmamış ve login sayfasında değilse → login'e yönlendir
  if (!user && !isLoginPage) {
    return redirectWithCookies('/login')
  }

  // Kullanıcı giriş yapmış ve login sayfasındaysa → dashboard'a yönlendir
  if (user && isLoginPage) {
    return redirectWithCookies('/')
  }

  return supabaseResponse
}
