# Goal
Implement an easy way for the Admin to edit an employee's attendance time for the current day directly from the main Admin Panel interface (without having to navigate into the historical calendar modal).

## Proposed Changes
1. **Add Quick Edit Attendance Modal States**:
   - `showQuickEditModal`, `quickEditForm`, `quickEditLoading`, `quickEditError`, `quickEditLog`.
2. **Add Quick Edit Attendance Handlers**:
   - `handleOpenQuickEdit`: Initializes the form using the employee's today's log.
   - `handleSaveQuickEdit`: Submits the updated time and status to the existing backend endpoint (`updateAttendanceRecord`) for the current date (`new Date()`).
3. **Update Right Sidebar (Daily Summary)**:
   - Change the existing `Edit` button (which confusingly opens the Employee Profile edit modal) to trigger `handleOpenQuickEdit(log)`. This makes logical sense as it sits right next to their check-in/out times.
4. **Update Main Employee List**:
   - Add a "Today's Log" / "Attendance" action button in the actions column for each employee. This will find the employee's current day log from `dailySummary` and open the `QuickEditAttendanceModal`.
5. **Render Quick Edit Modal**:
   - Build a clean UI modal identical in design language to the other modals. It will contain inputs for Status, Check-In, and Check-Out.
