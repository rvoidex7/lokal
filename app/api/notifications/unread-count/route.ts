import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import notificationService from '@/lib/services/notification-service'

// GET /api/notifications/unread-count - Get unread notifications count
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

    const count = await notificationService.getUnreadCount(user.id)

    return NextResponse.json({
      success: true,
      data: { count }
    })

  } catch (error) {
    console.error('Error in GET /api/notifications/unread-count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}