"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types"

let browserClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    return null
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("[v0] Supabase環境変数が設定されていません。テストモードで動作します。")
    return null
  }

  if (!browserClient) {
    browserClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    )
  }

  return browserClient
}
