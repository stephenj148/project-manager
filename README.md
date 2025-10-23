# Personal Project Manager

A secure, password-protected project management system for tracking websites, tasks, and reminders.

## Features

### 🔐 Security
- Password-protected access
- All data stored locally in your browser
- No external servers or data transmission

### 📊 Project Management
- Track multiple websites/projects
- Set project status (Active, On Hold, Completed)
- Assign priority levels (Low, Medium, High)
- Add descriptions and website URLs
- View task completion statistics

### ✅ Task Tracking
- Create tasks for each project
- Set task status (Pending, In Progress, Waiting, Completed)
- Assign due dates and priorities
- Filter tasks by status and project
- Track completion progress

### 🔔 Reminder System
- Set custom reminders with date/time
- Link reminders to specific projects
- Visual indicators for overdue and upcoming reminders
- Automatic notifications (5 minutes before due time)

### 📱 Responsive Design
- Works on desktop, tablet, and mobile devices
- Modern, intuitive interface
- Smooth animations and transitions

### 💾 Data Management
- Export all data as JSON backup
- Import data from backup files
- Change password securely
- All data persists between sessions

## Getting Started

1. **Open the Application**
   - Open `index.html` in your web browser
   - The application will work offline once loaded

2. **Set Up Password**
   - On first use, enter a password (minimum 6 characters)
   - This password will be required for all future access

3. **Create Your First Project**
   - Click "New Project" button
   - Fill in project details (name, URL, description, status, priority)
   - Save the project

4. **Add Tasks**
   - Click "Add Task" from a project card or use the "All Tasks" tab
   - Assign tasks to projects and set due dates
   - Update task status as you work

5. **Set Reminders**
   - Use the "Reminders" tab to create time-based reminders
   - Link reminders to specific projects if needed
   - Get notified 5 minutes before reminder time

## Usage Tips

### Project Organization
- Use descriptive project names
- Add website URLs for easy access
- Set appropriate priority levels
- Update status as projects progress

### Task Management
- Break large tasks into smaller ones
- Use the "Waiting" status for tasks blocked by external factors
- Set realistic due dates
- Regularly update task status

### Reminder Best Practices
- Set reminders for important deadlines
- Use project-specific reminders for context
- Mark overdue reminders as notified when addressed
- Set reminders for follow-up actions

### Data Backup
- Regularly export your data using the Settings tab
- Keep backup files in a safe location
- Import data if you switch browsers or devices

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with JavaScript support

## Data Storage

All data is stored locally in your browser's localStorage. This means:
- Data persists between browser sessions
- Data is private and secure
- No internet connection required after initial load
- Data can be exported/imported for backup

## Security Notes

- Password is encoded using base64 (basic security)
- All data remains on your device
- No external servers or data transmission
- Suitable for personal use

## Troubleshooting

### Can't Access Dashboard
- Ensure you're using the correct password
- Check if caps lock is enabled
- Try refreshing the page

### Data Not Saving
- Ensure JavaScript is enabled
- Check browser storage permissions
- Try clearing browser cache

### Reminders Not Working
- Ensure browser notifications are allowed
- Check system date/time settings
- Verify reminder date/time is set correctly

## Support

This is a personal project management tool. For issues or suggestions, refer to the code comments or modify the application as needed.

---

**Note**: This application is designed for personal use and stores all data locally. Make sure to regularly backup your data using the export feature.
