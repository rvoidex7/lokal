# Todo List

This file tracks features that are planned for future releases of the Lokal Cafe web application.

## Top Priority
### 1. Revise Existing Functional Features

*   **Separate Events (`Aktiviteler`) from Announcements (`Duyurular`):**
    *   The current "Add Announcement" dialog is used for both, which is confusing.
    *   **Action:** Create a distinct "Create Event" form/dialog with specific fields: `date`, `time`.
    *   **Action:** Ensure the database schema correctly supports these new event-specific fields.

### 2. Post Announcements

*   **Current Status:** Implemented. The `add-announcement-dialog.tsx` component works for creating general announcements.
*   **File:** `@\components\admin\add-announcement-dialog.tsx`
*   **Action:** No major revisions are needed for announcements, but the UI should be clarified to distinguish it from event creation.

### 3. Create Events

*   **Current Status:** Partially implemented. The backend seems to use the `activities` table, but the frontend UI for creating events is missing.
*   **Action:** Develop a new "Create Event" component that allows administrators to add events with all necessary details (date, time, location, description).

### 4. Encourage Participation in Events

*   **Current Status:** Not fully implemented on the frontend. A backend API at `/api/activities/[id]/join/route.ts` exists for joining an "activity," but there is no button or UI for users to interact with it.
*   **Action:** Add a "Join Event" or "RSVP" button to event details.
*   **Action:** Display a list of participants for each event to encourage social engagement.
*   **Action:** Consider creating a "My Events" page for users to track the events they have joined.