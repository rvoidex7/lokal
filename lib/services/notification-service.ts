import { createClient } from '@/lib/supabase/client'
import type { 
  Notification, 
  NotificationTemplate, 
  UserPreferences, 
  Activity, 
  UserProfile 
} from '@/lib/types'

export interface NotificationData {
  userId: string
  type: Notification['type']
  title: string
  message: string
  relatedId?: string
  relatedType?: Notification['related_type']
  actionUrl?: string
  scheduledFor?: string
}

export interface EmailData {
  to: string
  subject: string
  html: string
}

class NotificationService {
  private supabase = createClient()
  
  /**
   * Create a new notification
   */
  async createNotification(data: NotificationData): Promise<Notification | null> {
    try {
      // Check user preferences first
      const preferences = await this.getUserPreferences(data.userId)
      if (!preferences) {
        console.warn(`No preferences found for user ${data.userId}`)
      }

      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          category: this.getCategoryFromType(data.type),
          related_id: data.relatedId,
          related_type: data.relatedType,
          action_url: data.actionUrl,
          scheduled_for: data.scheduledFor
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return null
      }

      // Send email if user has email notifications enabled
      if (preferences?.email_notifications && this.shouldSendEmail(data.type, preferences)) {
        await this.sendEmailNotification(data.userId, notification)
      }

      return notification
    } catch (error) {
      console.error('Error in createNotification:', error)
      return null
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(notifications: NotificationData[]): Promise<boolean> {
    try {
      const notificationRows = notifications.map(data => ({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        category: this.getCategoryFromType(data.type),
        related_id: data.relatedId,
        related_type: data.relatedType,
        action_url: data.actionUrl,
        scheduled_for: data.scheduledFor
      }))

      const { error } = await this.supabase
        .from('notifications')
        .insert(notificationRows)

      if (error) {
        console.error('Error creating bulk notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in createBulkNotifications:', error)
      return false
    }
  }

  /**
   * Send activity reminder notifications
   */
  async sendActivityReminders(activityId: string, hoursBeforeEvent: number): Promise<boolean> {
    try {
      // Get activity details
      const { data: activity, error: activityError } = await this.supabase
        .from('activities')
        .select('*, activity_attendance(user_id)')
        .eq('id', activityId)
        .single()

      if (activityError || !activity) {
        console.error('Error fetching activity:', activityError)
        return false
      }

      // Get registered users for this activity
      const userIds = activity.activity_attendance?.map((a: any) => a.user_id) || []
      
      if (userIds.length === 0) {
        console.log('No registered users for activity:', activityId)
        return true
      }

      const reminderType = hoursBeforeEvent === 24 ? 'activity_reminder_24h' : 'activity_reminder_1h'
      const title = hoursBeforeEvent === 24 ? 'Etkinlik Hatırlatması' : 'Etkinlik Yakında'
      const message = `${activity.title} etkinliği ${hoursBeforeEvent === 24 ? 'yarın' : '1 saat içinde'} başlayacak!`

      const notifications: NotificationData[] = userIds.map((userId: string) => ({
        userId,
        type: reminderType as Notification['type'],
        title,
        message,
        relatedId: activityId,
        relatedType: 'activity',
        actionUrl: `/activities/${activityId}`
      }))

      return await this.createBulkNotifications(notifications)
    } catch (error) {
      console.error('Error sending activity reminders:', error)
      return false
    }
  }

  /**
   * Send new activity notifications to interested users
   */
  async notifyNewActivity(activityId: string): Promise<boolean> {
    try {
      // Get activity details
      const { data: activity, error: activityError } = await this.supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single()

      if (activityError || !activity) {
        console.error('Error fetching activity:', activityError)
        return false
      }

      // Get users who have new activity notifications enabled
      const { data: users, error: usersError } = await this.supabase
        .from('user_preferences')
        .select('user_id')
        .eq('new_activities', true)

      if (usersError || !users) {
        console.error('Error fetching user preferences:', usersError)
        return false
      }

      if (users.length === 0) {
        console.log('No users subscribed to new activity notifications')
        return true
      }

      const notifications: NotificationData[] = users.map(user => ({
        userId: user.user_id,
        type: 'new_activity',
        title: 'Yeni Etkinlik',
        message: `${activity.title} adlı yeni bir etkinlik eklendi!`,
        relatedId: activityId,
        relatedType: 'activity',
        actionUrl: `/activities/${activityId}`
      }))

      return await this.createBulkNotifications(notifications)
    } catch (error) {
      console.error('Error notifying new activity:', error)
      return false
    }
  }

  /**
   * Send activity update/cancellation notifications
   */
  async notifyActivityUpdate(activityId: string, updateType: 'update' | 'cancelled', reason?: string): Promise<boolean> {
    try {
      // Get activity details and registered users
      const { data: activity, error: activityError } = await this.supabase
        .from('activities')
        .select('*, activity_attendance(user_id)')
        .eq('id', activityId)
        .single()

      if (activityError || !activity) {
        console.error('Error fetching activity:', activityError)
        return false
      }

      const userIds = activity.activity_attendance?.map((a: any) => a.user_id) || []
      
      if (userIds.length === 0) {
        console.log('No registered users for activity:', activityId)
        return true
      }

      const type = updateType === 'cancelled' ? 'activity_cancelled' : 'activity_update'
      const title = updateType === 'cancelled' ? 'Etkinlik İptal Edildi' : 'Etkinlik Güncellendi'
      const message = updateType === 'cancelled' 
        ? `${activity.title} etkinliği iptal edilmiştir.${reason ? ` Sebep: ${reason}` : ''}`
        : `${activity.title} etkinliğinde güncelleme yapıldı.`

      const notifications: NotificationData[] = userIds.map((userId: string) => ({
        userId,
        type: type as Notification['type'],
        title,
        message,
        relatedId: activityId,
        relatedType: 'activity',
        actionUrl: `/activities/${activityId}`
      }))

      return await this.createBulkNotifications(notifications)
    } catch (error) {
      console.error('Error notifying activity update:', error)
      return false
    }
  }

  /**
   * Send social interaction notifications
   */
  async notifyNewFollower(userId: string, followerId: string): Promise<boolean> {
    try {
      // Get follower info
      const { data: follower, error: followerError } = await this.supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', followerId)
        .single()

      if (followerError || !follower) {
        console.error('Error fetching follower info:', followerError)
        return false
      }

      const notification: NotificationData = {
        userId,
        type: 'social_interaction',
        title: 'Yeni Takipçi',
        message: `${follower.full_name} sizi takip etmeye başladı!`,
        relatedId: followerId,
        relatedType: 'user',
        actionUrl: `/profile/${followerId}`
      }

      return !!(await this.createNotification(notification))
    } catch (error) {
      console.error('Error notifying new follower:', error)
      return false
    }
  }

  /**
   * Send comment notification
   */
  async notifyNewComment(activityId: string, commenterId: string, comment: string): Promise<boolean> {
    try {
      // Get activity and commenter info
      const [activityResult, commenterResult] = await Promise.all([
        this.supabase.from('activities').select('title, created_by').eq('id', activityId).single(),
        this.supabase.from('user_profiles').select('full_name').eq('user_id', commenterId).single()
      ])

      if (activityResult.error || !activityResult.data) {
        console.error('Error fetching activity:', activityResult.error)
        return false
      }

      if (commenterResult.error || !commenterResult.data) {
        console.error('Error fetching commenter:', commenterResult.error)
        return false
      }

      const activity = activityResult.data
      const commenter = commenterResult.data

      // Don't notify if commenter is the activity creator
      if (activity.created_by === commenterId) {
        return true
      }

      const notification: NotificationData = {
        userId: activity.created_by!,
        type: 'social_interaction',
        title: 'Yeni Yorum',
        message: `${commenter.full_name} "${activity.title}" etkinliğinize yorum yaptı`,
        relatedId: activityId,
        relatedType: 'activity',
        actionUrl: `/activities/${activityId}#comments`
      }

      return !!(await this.createNotification(notification))
    } catch (error) {
      console.error('Error notifying new comment:', error)
      return false
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, notificationIds: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .in('id', notificationIds)

      if (error) {
        console.error('Error marking notifications as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markAsRead:', error)
      return false
    }
  }

  /**
   * Delete notifications
   */
  async deleteNotifications(userId: string, notificationIds: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .in('id', notificationIds)

      if (error) {
        console.error('Error deleting notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteNotifications:', error)
      return false
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string, 
    options: { 
      page?: number, 
      limit?: number, 
      filter?: 'all' | 'unread' | 'activity' | 'social',
      orderBy?: 'created_at' | 'updated_at'
    } = {}
  ): Promise<{ notifications: Notification[], count: number, hasMore: boolean }> {
    try {
      const { page = 1, limit = 20, filter = 'all', orderBy = 'created_at' } = options
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Apply filters
      if (filter === 'unread') {
        query = query.eq('is_read', false)
      } else if (filter === 'activity') {
        query = query.eq('category', 'activity')
      } else if (filter === 'social') {
        query = query.eq('category', 'social')
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: notifications, count, error } = await query

      if (error) {
        console.error('Error fetching notifications:', error)
        return { notifications: [], count: 0, hasMore: false }
      }

      const hasMore = (count || 0) > offset + (notifications?.length || 0)

      return {
        notifications: notifications || [],
        count: count || 0,
        hasMore
      }
    } catch (error) {
      console.error('Error in getUserNotifications:', error)
      return { notifications: [], count: 0, hasMore: false }
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0
    }
  }

  /**
   * Private helper methods
   */
  private async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserPreferences:', error)
      return null
    }
  }

  private getCategoryFromType(type: Notification['type']): Notification['category'] {
    if (type.startsWith('activity_')) return 'activity'
    if (type === 'social_interaction') return 'social'
    return 'system'
  }

  private shouldSendEmail(type: Notification['type'], preferences: UserPreferences): boolean {
    switch (type) {
      case 'activity_reminder_24h':
        return preferences.activity_reminders_24h
      case 'activity_reminder_1h':
        return preferences.activity_reminders_1h
      case 'activity_update':
      case 'activity_cancelled':
        return preferences.activity_updates
      case 'new_activity':
        return preferences.new_activities
      case 'social_interaction':
        return preferences.social_notifications
      default:
        return false
    }
  }

  private async sendEmailNotification(userId: string, notification: Notification): Promise<boolean> {
    try {
      // 1. Get user's email address
      const { data: userProfile, error: userError } = await this.supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      if (userError || !userProfile || !userProfile.email) {
        console.error('Error fetching user email or email is missing:', userError);
        return false;
      }
      
      // 2. Construct email content
      const emailHtml = `
        <div>
          <h1>${notification.title}</h1>
          <p>${notification.message}</p>
          ${notification.action_url ? `<p><a href="${process.env.NEXT_PUBLIC_BASE_URL}${notification.action_url}">View Details</a></p>` : ''}
          <p><small>You are receiving this because your notification preferences are enabled.</small></p>
        </div>
      `;

      // 3. Call the new API route
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userProfile.email,
          subject: notification.title,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error('Failed to send email via API route:', errorBody);
        return false;
      }

      // 4. Update notification to mark email as sent
      await this.supabase
        .from('notifications')
        .update({ is_email_sent: true })
        .eq('id', notification.id);

      console.log(`Email notification sent successfully to ${userProfile.email}`);
      return true;
    } catch (error) {
      console.error('Error in sendEmailNotification:', error);
      return false;
    }
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<boolean> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (error) {
        console.error('Error cleaning up old notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in cleanupOldNotifications:', error)
      return false
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<boolean> {
    try {
      const now = new Date().toISOString()

      const { data: scheduledNotifications, error } = await this.supabase
        .from('notifications')
        .select('*')
        .lte('scheduled_for', now)
        .is('scheduled_for', null)

      if (error) {
        console.error('Error fetching scheduled notifications:', error)
        return false
      }

      if (!scheduledNotifications || scheduledNotifications.length === 0) {
        return true
      }

      // Process each scheduled notification
      for (const notification of scheduledNotifications) {
        // Mark as processed by clearing scheduled_for
        await this.supabase
          .from('notifications')
          .update({ scheduled_for: null })
          .eq('id', notification.id)

        // Send email if needed
        if (!notification.is_email_sent) {
          const preferences = await this.getUserPreferences(notification.user_id)
          if (preferences?.email_notifications && this.shouldSendEmail(notification.type, preferences)) {
            await this.sendEmailNotification(notification.user_id, notification)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
      return false
    }
  }
}

// Singleton instance
const notificationService = new NotificationService()
export default notificationService

// Export helper functions
export const createNotification = (data: NotificationData) => 
  notificationService.createNotification(data)

export const sendActivityReminders = (activityId: string, hours: number) => 
  notificationService.sendActivityReminders(activityId, hours)

export const notifyNewActivity = (activityId: string) => 
  notificationService.notifyNewActivity(activityId)

export const notifyActivityUpdate = (activityId: string, type: 'update' | 'cancelled', reason?: string) => 
  notificationService.notifyActivityUpdate(activityId, type, reason)

export const getUserNotifications = (userId: string, options?: any) => 
  notificationService.getUserNotifications(userId, options)

export const getUnreadCount = (userId: string) => 
  notificationService.getUnreadCount(userId)

export const markAsRead = (userId: string, notificationIds: string[]) => 
  notificationService.markAsRead(userId, notificationIds)

export const deleteNotifications = (userId: string, notificationIds: string[]) => 
  notificationService.deleteNotifications(userId, notificationIds)