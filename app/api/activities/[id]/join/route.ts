import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/activities/[id]/join - Join activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { id: activityId } = await params

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Get activity details
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, status, max_participants, date_time')
      .eq('id', activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    // Check if activity is still available for registration
    if (activity.status !== 'upcoming') {
      return NextResponse.json(
        { error: 'Activity is not available for registration' },
        { status: 400 }
      )
    }

    // Check if activity is in the future
    const activityDate = new Date(activity.date_time)
    if (activityDate <= new Date()) {
      return NextResponse.json(
        { error: 'Cannot join past activities' },
        { status: 400 }
      )
    }

    // Check if user is already registered
    const { data: existingAttendance } = await supabase
      .from('activity_attendance')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .single()

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'You are already registered for this activity' },
        { status: 400 }
      )
    }

    // Check if activity is full (if max_participants is set)
    if (activity.max_participants) {
      const { count: currentParticipants } = await supabase
        .from('activity_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId)

      if ((currentParticipants || 0) >= activity.max_participants) {
        return NextResponse.json(
          { error: 'Activity is full' },
          { status: 400 }
        )
      }
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()

    // Register user for activity
    const { error: joinError } = await supabase
      .from('activity_attendance')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown User',
        attended: false
      })

    if (joinError) {
      console.error('Error joining activity:', joinError)
      return NextResponse.json(
        { error: 'Failed to join activity' },
        { status: 500 }
      )
    }

    // Update activity statistics - removed for now as it requires RPC functions

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Successfully joined activity',
        activity_id: activityId 
      }
    })

  } catch (error) {
    console.error('Error in POST /api/activities/[id]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities/[id]/join - Leave activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { id: activityId } = await params

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Get activity details
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, status, date_time')
      .eq('id', activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    // Check if user can still leave (activity hasn't started yet)
    const activityDate = new Date(activity.date_time)
    const now = new Date()
    const timeDifference = activityDate.getTime() - now.getTime()
    const hoursUntilActivity = timeDifference / (1000 * 60 * 60)

    // Don't allow leaving if activity starts in less than 2 hours
    if (hoursUntilActivity < 2) {
      return NextResponse.json(
        { error: 'Cannot leave activity less than 2 hours before start time' },
        { status: 400 }
      )
    }

    if (activity.status === 'completed' || activity.status === 'ongoing') {
      return NextResponse.json(
        { error: 'Cannot leave completed or ongoing activity' },
        { status: 400 }
      )
    }

    // Check if user is registered
    const { data: attendance, error: attendanceError } = await supabase
      .from('activity_attendance')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .single()

    if (attendanceError || !attendance) {
      return NextResponse.json(
        { error: 'You are not registered for this activity' },
        { status: 400 }
      )
    }

    // Remove user from activity
    const { error: leaveError } = await supabase
      .from('activity_attendance')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user.id)

    if (leaveError) {
      console.error('Error leaving activity:', leaveError)
      return NextResponse.json(
        { error: 'Failed to leave activity' },
        { status: 500 }
      )
    }

    // Update activity statistics - removed for now as it requires RPC functions

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Successfully left activity',
        activity_id: activityId 
      }
    })

  } catch (error) {
    console.error('Error in DELETE /api/activities/[id]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}