import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import notificationService, { NotificationData } from '@/lib/services/notification-service'
import type { Notification } from '@/lib/types'

// GET /api/notifications - Fetch user notifications
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
    const filter = searchParams.get('filter') as 'all' | 'unread' | 'activity' | 'social' || 'all'
    const orderBy = searchParams.get('orderBy') as 'created_at' | 'updated_at' || 'created_at'

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const validFilters = ['all', 'unread', 'activity', 'social']
    if (!validFilters.includes(filter)) {
      return NextResponse.json(
        { error: 'Invalid filter parameter' },
        { status: 400 }
      )
    }

    const result = await notificationService.getUserNotifications(user.id, {
      page,
      limit,
      filter,
      orderBy
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          page,
          limit,
          total: result.count,
          hasMore: result.hasMore
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create new notification
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

    // Check if user is admin for system notifications
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { 
      userId, 
      type, 
      title, 
      message, 
      relatedId, 
      relatedType, 
      actionUrl,
      scheduledFor
    }: Partial<NotificationData> = body

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      )
    }

    // Validate notification type
    const validTypes = [
      'activity_reminder', 'activity_update', 'activity_cancelled', 
      'new_activity', 'social_interaction', 'system'
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      )
    }

    // Only admins can create system notifications or notifications for other users
    if ((type === 'system' || userId !== user.id) && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const notificationData: NotificationData = {
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      actionUrl,
      scheduledFor
    }

    const notification = await notificationService.createNotification(notificationData)

    if (!notification) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notification
    })

  } catch (error) {
    console.error('Error in POST /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Update notification status (read/unread)
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
    const { notificationIds, action }: { notificationIds: string[], action: 'read' | 'unread' } = body

    // Validate input
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid notificationIds array' },
        { status: 400 }
      )
    }

    if (!['read', 'unread'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "read" or "unread"' },
        { status: 400 }
      )
    }

    // Update notification status
    const isRead = action === 'read'
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: isRead })
      .eq('user_id', user.id)
      .in('id', notificationIds)

    if (error) {
      console.error('Error updating notifications:', error)
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { 
        updatedCount: notificationIds.length,
        action 
      }
    })

  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete notifications
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
    const { notificationIds }: { notificationIds: string[] } = body

    // Validate input
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid notificationIds array' },
        { status: 400 }
      )
    }

    // Delete notifications
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .in('id', notificationIds)

    if (error) {
      console.error('Error deleting notifications:', error)
      return NextResponse.json(
        { error: 'Failed to delete notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { 
        deletedCount: notificationIds.length
      }
    })

  } catch (error) {
    console.error('Error in DELETE /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}