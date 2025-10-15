"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signInWithMagicLink(email: string) {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return { error: "Supabase接続エラー" }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signUpWithCode(email: string, code: string) {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return { error: "Supabase接続エラー" }
  }

  const { data: securitySettings } = await supabase.from("security_settings").select("signup_code").single()

  if (!securitySettings || securitySettings.signup_code !== code) {
    return { error: "認証コードが正しくありません" }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function checkAuth() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
