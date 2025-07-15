import { createClient } from "@supabase/supabase-js"
import type { User, Session } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface AuthUser extends User {
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface AuthSession extends Session {
  user: AuthUser
}

// Sign up with email and password
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  return { data, error }
}

// Sign in with email and password
export async function signIn(email: string, password: string, rememberMe = false) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Store remember me preference in localStorage
  if (data.session && rememberMe) {
    localStorage.setItem("rememberMe", "true")
    localStorage.setItem("userEmail", email)
  } else {
    localStorage.removeItem("rememberMe")
    localStorage.removeItem("userEmail")
  }

  return { data, error }
}

// Sign out
export async function signOut() {
  localStorage.removeItem("rememberMe")
  localStorage.removeItem("userEmail")
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Get current session
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}

// Get current user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

// Reset password
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  return { data, error }
}

// Update password
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: password,
  })
  return { data, error }
}

// Get remembered email
export function getRememberedEmail(): string | null {
  if (typeof window !== "undefined") {
    const rememberMe = localStorage.getItem("rememberMe")
    if (rememberMe === "true") {
      return localStorage.getItem("userEmail")
    }
  }
  return null
}
