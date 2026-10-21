import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Sem as duas variáveis o app roda em modo demonstração (dados em memória, sem login).
export const supabaseConfigurado = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)

// Cliente com a sessão do usuário (cookies http-only): toda consulta passa pela RLS.
export async function criarClienteServidor() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // chamado de Server Component: o proxy já renova a sessão
        }
      },
    },
  })
}
