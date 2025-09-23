# Lokal Cafe Web Application - Feature Documentation

## Overview
This is a comprehensive community management platform for Lokal Cafe, built with Next.js, TailwindCSS, and Supabase. The platform enables community engagement through social groups, activities, and a loyalty program.

## Key Features

### 1. User Role System
- **Admin (Yönetici)**: Full system control, activity approval, announcement management
- **Member (Üye)**: Basic user with ability to join groups and participate in activities
- **Club Member (Kulüp Üyesi)**: Members who have been approved to join specific social groups

### 2. Social Groups & Membership
- Create and manage various social groups (Book Club, Yoga, Film, etc.)
- **Membership Request System**:
  - Users can request to join groups
  - Admins review and approve/reject requests
  - Optional message when requesting membership
- Group capacity management
- Active/inactive status for groups

### 3. Club Comment Wall
- Each social group has its own discussion wall
- **Features**:
  - Real-time updates using Supabase subscriptions
  - Only club members can post
  - Comment reactions (like, heart, applause, thinking)
  - Edit and delete own comments
  - Pin important comments (admin only)
  - Shows author name, timestamp, and edit history

### 4. Enhanced Announcement System
- **General Announcements**: Visible to all users
- **Club-Specific Announcements**: Only visible to specific group members
- Meeting date/time for event announcements
- Image upload support
- Notification system for club members

### 5. Activity Management
- **Admin-Created Activities**: Direct creation with all details
- **User-Requested Activities**:
  - Members submit activity proposals
  - Admin can approve and assign managers
  - Delegation of activity management
- Track attendance and participants
- Activity status tracking (upcoming, ongoing, completed, cancelled)

### 6. Loyalty & Birthday System

#### Birthday Rewards
- Automatic detection of user birthdays
- Birthday dashboard for admins showing today's and upcoming birthdays
- Automatic "1 free coffee" voucher generation
- 7-day expiration on birthday vouchers
- Prevents duplicate birthday vouchers in the same year

#### Loyalty Program
- Track activity attendance for each user
- Automatic "1 free coffee" after every 6 activities attended
- Visual progress indicator showing activities until next reward
- Voucher code generation with unique codes
- Voucher management and redemption tracking

### 7. Admin Dashboard Features
- **Birthday Tracker**: View today's and upcoming birthdays
- **Membership Requests**: Approve/reject group join requests
- **Activity Requests**: Manage user-submitted activity proposals
- **Voucher Management**: Track and manage coffee vouchers
- **Attendance Reports**: View activity participation statistics

## Database Schema

### New Tables Added:
- `user_profiles`: Extended user information with roles and tracking
- `membership_requests`: Group membership request management
- `club_comments`: Group discussion walls
- `comment_reactions`: Reactions to comments
- `activities`: Enhanced activity management
- `coffee_vouchers`: Voucher tracking and redemption
- `activity_attendance`: Attendance tracking for loyalty program

## Technical Implementation

### Technologies Used:
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **File Upload**: UploadThing
- **Date Handling**: date-fns with Turkish locale

### Key Components:
- `membership-request-dialog.tsx`: User interface for requesting group membership
- `membership-requests-manager.tsx`: Admin interface for managing requests
- `club-comment-wall.tsx`: Real-time discussion wall for groups
- `enhanced-announcement-dialog.tsx`: Create club-specific announcements
- `birthday-tracker.tsx`: Admin dashboard for birthday management
- `coffee-voucher-display.tsx`: User's voucher and loyalty progress display

### Security Features:
- Row Level Security (RLS) policies for all tables
- Role-based access control
- User authentication required for sensitive operations
- Admin-only access to management features

## Setup Instructions

### 1. Database Setup
Run the SQL scripts from the `database/schemas` directory in the following order:
1. `01_base_tables.sql`
2. `02_social_groups.sql`
3. `03_products.sql`
4. `04_personal_letters.sql`
5. `05_enhancements.sql`

Alternatively, you can run the `setup-complete.sql` script from the `database/full` directory to set up the entire database at once.

### 2. Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

## User Flows

### Joining a Social Group:
1. User browses available social groups
2. Clicks "Join Group" button
3. Optionally adds a message with request
4. Admin receives notification of pending request
5. Admin approves/rejects request
6. User becomes group member and can access group features

### Birthday Voucher Flow:
1. System checks for birthdays daily
2. Admin sees birthday notifications in dashboard
3. Vouchers can be auto-generated or manually created
4. User receives voucher code valid for 7 days
5. Voucher appears in user's profile

### Loyalty Program Flow:
1. User attends activities
2. Admin marks attendance in system
3. System tracks attendance count
4. After 6 activities, voucher is automatically generated
5. User sees progress bar and voucher in profile

## Future Enhancements
- Email/SMS notifications for vouchers and announcements
- Mobile app integration
- QR code scanning for voucher redemption
- Advanced analytics and reporting
- Integration with POS systems
- Multi-language support beyond Turkish

## Maintenance Notes
- Birthday vouchers are checked and can be generated daily
- Expired vouchers are automatically hidden from user view
- Comment walls use real-time subscriptions - monitor Supabase usage
- Regular database backups recommended for user data and vouchers