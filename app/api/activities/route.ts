import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import notificationService from '@/lib/services/notification-service'
import type { Activity } from '@/lib/types'

// GET /api/activities - Fetch activities with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') as Activity['status'] || undefined
    const activity_type = searchParams.get('type') || ''
    const location = searchParams.get('location') || ''
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const sortBy = searchParams.get('sort_by') as 'date_time' | 'created_at' | 'title' || 'date_time'
    const sortOrder = searchParams.get('sort_order') as 'asc' | 'desc' || 'asc'

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const validSortBy = ['date_time', 'created_at', 'title']
    if (!validSortBy.includes(sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sort_by parameter' },
        { status: 400 }
      )
    }

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('activities')
      .select(`
        *,
        activity_attendance(count),
        activity_ratings(rating),
        activity_statistics(
          total_views,
          total_registrations,
          average_rating
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status) {
      const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status parameter' },
          { status: 400 }
        )
      }
      query = query.eq('status', status)
    }

    if (activity_type) {
      query = query.eq('activity_type', activity_type)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (dateFrom) {
      query = query.gte('date_time', dateFrom)
    }

    if (dateTo) {
      query = query.lte('date_time', dateTo)
    }

    // Apply sorting and pagination
    const ascending = sortOrder === 'asc'
    query = query
      .order(sortBy, { ascending })
      .range(offset, offset + limit - 1)

    const { data: activities, count, error } = await query

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    // Process activities data
    const processedActivities = activities?.map(activity => ({
      ...activity,
      participant_count: activity.activity_attendance?.[0]?.count || 0,
      average_rating: activity.activity_statistics?.[0]?.average_rating || 0,
      total_views: activity.activity_statistics?.[0]?.total_views || 0
    })) || []

    const hasMore = (count || 0) > offset + (activities?.length || 0)

    return NextResponse.json({
      success: true,
      data: {
        activities: processedActivities,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/activities - Create new activity (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      activity_type,
      date_time,
      duration_hours,
      location,
      max_participants,
      image_url,
      group_id,
      request_id 
    } = body

    // Validate required fields
    if (!title || !description || !date_time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, date_time' },
        { status: 400 }
      )
    }

    // Validate date_time format
    const dateTime = new Date(date_time)
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date_time format' },
        { status: 400 }
      )
    }

    // Check if activity is in the future
    if (dateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Activity date must be in the future' },
        { status: 400 }
      )
    }

    // Create activity
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        title,
        description,
        activity_type,
        date_time: dateTime.toISOString(),
        duration_hours: duration_hours || 2,
        location,
        max_participants: max_participants || null,
        image_url,
        created_by: user.id,
        managed_by: user.id,
        group_id: group_id || null,
        request_id: request_id || null,
        status: 'upcoming'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    // Create activity statistics entry
    await supabase
      .from('activity_statistics')
      .insert({
        activity_id: activity.id,
        total_views: 0,
        total_registrations: 0,
        total_attendees: 0,
        total_ratings: 0,
        average_rating: 0,
        total_comments: 0,
        completion_rate: 0,
        no_show_rate: 0
      })

    // Send notifications to interested users
    await notificationService.notifyNewActivity(activity.id)

    return NextResponse.json({
      success: true,
      data: activity
    })

  } catch (error) {
    console.error('Error in POST /api/activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/activities - Update activity details
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      id,
      title, 
      description, 
      activity_type,
      date_time,
      duration_hours,
      location,
      max_participants,
      image_url,
      status,
      cancellation_reason
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Check if user can update this activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('created_by, managed_by, status')
      .eq('id', id)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isOwner = activity.created_by === user.id || activity.managed_by === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: Partial<Activity> = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (activity_type !== undefined) updateData.activity_type = activity_type
    if (duration_hours !== undefined) updateData.duration_hours = duration_hours
    if (location !== undefined) updateData.location = location
    if (max_participants !== undefined) updateData.max_participants = max_participants
    if (image_url !== undefined) updateData.image_url = image_url

    // Validate and handle date_time update
    if (date_time !== undefined) {
      const dateTime = new Date(date_time)
      if (isNaN(dateTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date_time format' },
          { status: 400 }
        )
      }
      updateData.date_time = dateTime.toISOString()
    }

    // Handle status change
    if (status !== undefined) {
      const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    // Update activity
    const { data: updatedActivity, error: updateError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating activity:', updateError)
      return NextResponse.json(
        { error: 'Failed to update activity' },
        { status: 500 }
      )
    }

    // Send notifications for significant changes
    if (status === 'cancelled') {
      await notificationService.notifyActivityUpdate(id, 'cancelled', cancellation_reason)
    } else if (date_time !== undefined || title !== undefined || location !== undefined) {
      await notificationService.notifyActivityUpdate(id, 'update')
    }

    return NextResponse.json({
      success: true,
      data: updatedActivity
    })

  } catch (error) {
    console.error('Error in PATCH /api/activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities - Delete/cancel activity
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, cancellation_reason } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Check if user can delete this activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('created_by, managed_by, status, title')
      .eq('id', id)
      .single()

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isOwner = activity.created_by === user.id || activity.managed_by === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Instead of deleting, mark as cancelled (soft delete)
    const { error: updateError } = await supabase
      .from('activities')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling activity:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel activity' },
        { status: 500 }
      )
    }

    // Send cancellation notifications
    await notificationService.notifyActivityUpdate(id, 'cancelled', cancellation_reason)

    return NextResponse.json({
      success: true,
      data: { message: 'Activity cancelled successfully' }
    })

  } catch (error) {
    console.error('Error in DELETE /api/activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}