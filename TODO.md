# Todo List

This file tracks features that are planned for future releases of the Lokal Cafe web application.

## Top Priority
### 1. Revise Existing Functional Features **DONE!**

* **This is not tested. `Test it` when you can do**
*   **Separate Events (`Aktiviteler`) from Announcements (`Duyurular`):**
    *    A new "Create Event" dialog has been created with specific fields for `date`, `time`, and `location`. The admin dashboard has been updated with a button to open this new dialog. The database schema has been verified to be compatible.

### 2. Post Announcements

*   **Current Status:** Implemented. The `add-announcement-dialog.tsx` component works for creating general announcements.
*   **File:** `@\components\admin\add-announcement-dialog.tsx`
*   **Action:** No major revisions are needed for announcements, but the UI should be clarified to distinguish it from event creation.

### 3. Create Events

*   **Current Status:** Partially implemented. The backend seems to use the `activities` table, but the frontend UI for creating events is missing.
*   **Action:** Develop a new "Create Event" component that allows administrators to add events with all necessary details (date, time, location, description).

### 4. Encourage Participation in Events **DONE!**

*   **Current Status:** A "Join/Leave" button has been added to the `ActivityCard` and `ActivityDetailModal` components, allowing users to register for events. The UI provides optimistic updates for a responsive user experience.
*   **Action:** Display a list of participants for each event to encourage social engagement.
*   **Action:** Consider creating a "My Events" page for users to track the events they have joined.