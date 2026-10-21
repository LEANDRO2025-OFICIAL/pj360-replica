import "server-only"
import { supabaseConfigurado } from "@/lib/supabase/server"
import { dados as fake } from "./fake"
import { dados as supabase } from "./supabase"

// Com as chaves do Supabase no .env.local, dados reais com RLS; sem elas, demonstração em memória.
export const dados = supabaseConfigurado ? supabase : fake
