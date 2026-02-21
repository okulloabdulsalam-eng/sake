# Notifications Sorting System

## Current Sorting Logic

Notifications are sorted using a **two-level priority system**:

### 1. **Primary Sort: By Status (Unread First)**
   - **Unread notifications** appear at the top
   - **Read notifications** appear below unread ones

### 2. **Secondary Sort: By Date (Newest First)**
   - Within each status group (unread/read), notifications are sorted by date
   - **Newest notifications** appear first
   - **Older notifications** appear later

---

## Implementation Details

### Frontend (localStorage-based)

**Location:** `notifications.html` → `loadNotificationsFromStorage()`

**Sorting Code:**
```javascript
const sortedNotifications = notificationsData.sort((a, b) => {
    // First, sort by status (unread comes before read)
    if (a.status === 'unread' && b.status !== 'unread') return -1;
    if (a.status !== 'unread' && b.status === 'unread') return 1;
    
    // If same status, sort by date (newest first)
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA; // Newest first
});
```

**Result:**
1. All unread notifications (newest to oldest)
2. All read notifications (newest to oldest)

---

### Backend (Database-based)

**Location:** `api/get_notifications.php`

**SQL Sorting:**
```sql
ORDER BY 
    CASE WHEN is_read = 0 THEN 0 ELSE 1 END,  -- Unread first (0), then read (1)
    created_date DESC                         -- Newest first
```

**Result:**
- Same sorting as frontend: Unread first, then sorted by date (newest first)

---

## Filter Options

Users can filter notifications:

1. **"All"** - Shows all notifications (sorted: unread first, then by date)
2. **"Unread"** - Shows only unread notifications (sorted by date, newest first)

---

## Example Display Order

```
┌─────────────────────────────────────────┐
│  [Unread] New Event - 2 hours ago       │ ← Unread, newest
│  [Unread] Quran Study - 5 hours ago     │ ← Unread, older
│  [Read]   Thank You - 1 day ago         │ ← Read, newest
│  [Read]   Prayer Reminder - 2 days ago  │ ← Read, older
│  [Read]   Community Iftar - 3 days ago  │ ← Read, oldest
└─────────────────────────────────────────┘
```

---

## When Sorting Happens

1. **On Page Load** - `loadNotificationsFromStorage()` sorts all notifications
2. **When Adding New Notification** - New notifications are added with `unshift()` (to beginning), then sorted
3. **When Filtering** - Filter function maintains sort order
4. **When Marking as Read** - Status changes, but sort order is maintained on next load

---

## Database Schema

The `notifications` table includes:
- `is_read` (BOOLEAN) - Used for status sorting
- `created_date` (TIMESTAMP) - Used for date sorting
- `type` (ENUM) - Notification type (info, reminder, announcement, etc.)

---

## Future Enhancements

Potential sorting options to add:
- Sort by type (reminders first, then announcements, etc.)
- Sort by priority (if priority field is added)
- Custom user sorting preferences
- Sort by "sent_date" for scheduled notifications

---

## Testing

To verify sorting works correctly:

1. **Add multiple notifications** (some unread, some read)
2. **Check display order** - Unread should be at top, newest first
3. **Mark one as read** - It should move to read section
4. **Filter by "Unread"** - Only unread should show
5. **Filter by "All"** - All should show, sorted correctly

---

## Notes

- Sorting is **automatic** - No user action needed
- Sorting happens **client-side** (localStorage) and **server-side** (database)
- Hardcoded notifications in HTML are displayed first, then sorted notifications from localStorage
- When switching between "All" and "Unread" filters, sort order is maintained

