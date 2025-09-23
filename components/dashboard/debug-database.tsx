"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function DebugDatabase() {
  const { user } = useAuth()
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const runTests = async () => {
    if (!user) {
      setResults({ error: "No user logged in" })
      return
    }

    setLoading(true)
    const testResults: any = {}

    try {
      // Test 1: Check user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
      
      testResults.user_profiles = profileError 
        ? `Error: ${profileError.message} - ${profileError.hint || ''}`
        : profileData ? "✅ Found profile" : "⚠️ No profile found"

      // Test 2: Check activities table
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .limit(1)
      
      testResults.activities = activitiesError
        ? `Error: ${activitiesError.message} - ${activitiesError.hint || ''}`
        : `✅ Activities table accessible (${activitiesData?.length || 0} records)`

      // Test 3: Check activity_attendance table
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("activity_attendance")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
      
      testResults.activity_attendance = attendanceError
        ? `Error: ${attendanceError.message} - ${attendanceError.hint || ''}`
        : `✅ Attendance table accessible (${attendanceData?.length || 0} records)`

      // Test 4: Check personal_letters table
      const { data: lettersData, error: lettersError } = await supabase
        .from("personal_letters")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
      
      testResults.personal_letters = lettersError
        ? `Error: ${lettersError.message} - ${lettersError.hint || ''}`
        : `✅ Letters table accessible (${lettersData?.length || 0} records)`

      // Test 5: Check group_members table
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
      
      testResults.group_members = membersError
        ? `Error: ${membersError.message} - ${membersError.hint || ''}`
        : `✅ Group members table accessible (${membersData?.length || 0} records)`

      // Test 6: Check social_groups table
      const { data: groupsData, error: groupsError } = await supabase
        .from("social_groups")
        .select("*")
        .limit(1)
      
      testResults.social_groups = groupsError
        ? `Error: ${groupsError.message} - ${groupsError.hint || ''}`
        : `✅ Social groups table accessible (${groupsData?.length || 0} records)`

      // Test 7: Check coffee_vouchers table
      const { data: vouchersData, error: vouchersError } = await supabase
        .from("coffee_vouchers")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
      
      testResults.coffee_vouchers = vouchersError
        ? `Error: ${vouchersError.message} - ${vouchersError.hint || ''}`
        : `✅ Vouchers table accessible (${vouchersData?.length || 0} records)`

      // Test 8: Check if user needs a profile created
      if (!profileData && !profileError) {
        // Try to create a profile
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            role: 'member'
          })
          .select()
          .single()
        
        testResults.profile_creation = createError
          ? `Error creating profile: ${createError.message}`
          : "✅ Profile created successfully"
      }

    } catch (error: any) {
      testResults.general = `Unexpected error: ${error.message}`
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">User ID: {user?.id || "Not logged in"}</p>
          <p className="text-sm text-muted-foreground">Email: {user?.email || "Not logged in"}</p>
        </div>
        
        <Button onClick={runTests} disabled={loading || !user}>
          {loading ? "Running tests..." : "Run Database Tests"}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2 mt-4 p-4 bg-muted rounded-lg font-mono text-sm">
            {Object.entries(results).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {String(value)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}