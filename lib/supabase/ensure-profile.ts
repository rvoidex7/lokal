import { createClient } from "./client"
import type { User } from "@supabase/supabase-js"

export async function ensureUserProfile(user: User) {
  const supabase = createClient()
  
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // If profile exists, return it
    if (existingProfile) {
      return { profile: existingProfile, created: false }
    }

    // If error is not "no rows", throw it
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: 'member',
        coffee_voucher_count: 0,
        activity_attendance_count: 0
      })
      .select()
      .single()

    if (createError) throw createError

    console.log("Created new user profile for:", user.email)
    return { profile: newProfile, created: true }
    
  } catch (error) {
    console.error("Error ensuring user profile:", error)
    throw error
  }
}