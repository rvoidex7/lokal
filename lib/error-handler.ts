import type { SupabaseError } from './types'

export interface ErrorHandler {
  logError: (message: string, error?: unknown) => void
  showUserError: (message: string) => void
  formatSupabaseError: (error: SupabaseError) => string
}

export const createErrorHandler = (): ErrorHandler => {
  return {
    logError: (message: string, error?: unknown) => {
      const timestamp = new Date().toISOString()
      
      // Properly extract error details
      let errorDetails: any = {}
      
      if (error instanceof Error) {
        errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      } else if (error && typeof error === 'object') {
        // Handle Supabase errors and other object errors
        // Safely extract known properties instead of spreading the whole error object
        errorDetails = {
          message: (error as any).message || 'Unknown error',
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
          statusCode: (error as any).statusCode,
        }
      } else {
        errorDetails = { raw: error }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`[${timestamp}] ${message}`, errorDetails)
      }
      // In production, you could send to logging service
    },
    showUserError: (message: string) => {
      // This could be integrated with a toast system
      if (process.env.NODE_ENV === 'development') {
        console.error('User Error:', message)
      }
    },
    formatSupabaseError: (error: SupabaseError) => {
      if (error.message) {
        return `Database error: ${error.message}`
      }
      return 'An unexpected database error occurred'
    }
  }
}

export const errorHandler = createErrorHandler()