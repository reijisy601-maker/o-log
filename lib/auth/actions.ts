"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const DEFAULT_REDIRECT = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`

export async function signInWithMagicLink(email: string) {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return { error: "Supabase接続エラー" }
  }

  const { data: isAllowed, error: domainError } = await supabase.rpc("is_domain_allowed", { p_email: email })
  if (domainError) {
    return { error: domainError.message }
  }
  if (isAllowed === false) {
    return { error: "このドメインのメールアドレスは許可されていません" }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: DEFAULT_REDIRECT,
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

  const trimmedCode = code.trim()

  const { data: isAllowed, error: domainError } = await supabase.rpc("is_domain_allowed", { p_email: email })
  if (domainError) {
    return { error: domainError.message }
  }
  if (isAllowed === false) {
    return { error: "このドメインのメールアドレスは許可されていません" }
  }

  const { error: validationError } = await supabase.rpc("register_magic_link", {
    p_email: email,
    p_passcode: trimmedCode || null,
  })

  if (validationError) {
    if (validationError.message?.includes("invalid_passcode")) {
      return { error: "認証コードが正しくありません" }
    }
    if (validationError.message?.includes("invalid_email")) {
      return { error: "メールアドレスが不正です" }
    }
    return { error: validationError.message }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: DEFAULT_REDIRECT,
      shouldCreateUser: true,
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
