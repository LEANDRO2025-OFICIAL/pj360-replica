import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server"

// Destino dos links de e-mail do Supabase (convite, redefinir senha). Aceita PKCE (code) e token_hash.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  if (!supabaseConfigurado) return NextResponse.redirect(new URL("/login", origin))
  // só caminhos deste site: resolve a URL e compara a origem (pega "//x", "/\x" e afins)
  const alvo = new URL(searchParams.get("next") ?? "/", origin)
  const destino = alvo.origin === origin ? alvo.pathname + alvo.search : "/"
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  const sb = await criarClienteServidor()
  const { error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await sb.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("link sem código") }

  if (!error) await sb.rpc("garantir_escritorio")
  return NextResponse.redirect(new URL(error ? "/login?link=expirado" : destino, origin))
}
