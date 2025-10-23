// Personal Project Manager - Web Application JavaScript
class ProjectManager {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.tasks = [];
        this.reminders = [];
        this.currentEditingId = null;
        this.reminderCheckInterval = null;
        this.isDarkMode = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.loadTheme();
        this.setupEventListeners();
        this.checkReminders();
        this.startReminderChecker();
    }

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('projectManagerTheme');
        if (savedTheme === 'dark') {
            this.isDarkMode = true;
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateDarkModeButton();
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('projectManagerTheme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('projectManagerTheme', 'light');
        }
        
        this.updateDarkModeButton();
    }

    updateDarkModeButton() {
        const button = document.getElementById('darkModeToggle');
        const icon = button.querySelector('i');
        const text = button.querySelector('span');
        
        if (this.isDarkMode) {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }

    // Authentication
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-item').dataset.tab);
            });
        });

        // Project management
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.openProjectModal();
        });

        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProject();
        });

        // Task management
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Reminder management
        document.getElementById('addReminderBtn').addEventListener('click', () => {
            this.openReminderModal();
        });

        document.getElementById('reminderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReminder();
        });

        // Settings
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderProjects();
        });

        document.getElementById('taskStatusFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('projectFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    handleLogin() {
        const password = document.getElementById('password').value;
        const storedPassword = localStorage.getItem('projectManagerPassword');
        
        if (!storedPassword) {
            // First time setup
            if (password.length < 6) {
                this.showError('Password must be at least 6 characters long');
                return;
            }
            localStorage.setItem('projectManagerPassword', btoa(password));
            this.showNotification('Password set successfully!', 'success');
        } else {
            // Verify existing password
            if (btoa(password) !== storedPassword) {
                this.showError('Invalid password');
                return;
            }
        }

        this.currentUser = 'user';
        this.showDashboard();
    }

    logout() {
        this.currentUser = null;
        document.getElementById('password').value = '';
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        this.renderProjects();
        this.renderTasks();
        this.renderReminders();
        this.updateProjectFilter();
        this.updateStats();
    }

    // Data Management
    loadData() {
        const projectsData = localStorage.getItem('projectManagerProjects');
        const tasksData = localStorage.getItem('projectManagerTasks');
        const remindersData = localStorage.getItem('projectManagerReminders');

        this.projects = projectsData ? JSON.parse(projectsData) : [];
        this.tasks = tasksData ? JSON.parse(tasksData) : [];
        this.reminders = remindersData ? JSON.parse(remindersData) : [];
    }

    saveData() {
        localStorage.setItem('projectManagerProjects', JSON.stringify(this.projects));
        localStorage.setItem('projectManagerTasks', JSON.stringify(this.tasks));
        localStorage.setItem('projectManagerReminders', JSON.stringify(this.reminders));
    }

    // Tab Management
    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Update page title and header button
        this.updatePageHeader(tabName);

        // Render appropriate content
        switch(tabName) {
            case 'projects':
                this.renderProjects();
                this.updateStats();
                break;
            case 'tasks':
                this.renderTasks();
                break;
            case 'reminders':
                this.renderReminders();
                break;
        }
    }

    updatePageHeader(tabName) {
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        const headerRight = document.querySelector('.header-right');

        switch(tabName) {
            case 'projects':
                pageTitle.textContent = 'Projects';
                pageSubtitle.textContent = 'Manage your projects and track progress';
                headerRight.innerHTML = '<button id="addProjectBtn" class="btn btn-primary"><i class="fas fa-plus"></i> New Project</button>';
                document.getElementById('addProjectBtn').addEventListener('click', () => this.openProjectModal());
                break;
            case 'tasks':
                pageTitle.textContent = 'Tasks';
                pageSubtitle.textContent = 'Track and manage all your tasks';
                headerRight.innerHTML = '<button id="addTaskBtn" class="btn btn-primary"><i class="fas fa-plus"></i> New Task</button>';
                document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
                break;
            case 'reminders':
                pageTitle.textContent = 'Reminders';
                pageSubtitle.textContent = 'Set and manage your reminders';
                headerRight.innerHTML = '<button id="addReminderBtn" class="btn btn-primary"><i class="fas fa-plus"></i> New Reminder</button>';
                document.getElementById('addReminderBtn').addEventListener('click', () => this.openReminderModal());
                break;
            case 'settings':
                pageTitle.textContent = 'Settings';
                pageSubtitle.textContent = 'Manage your account and data';
                headerRight.innerHTML = '';
                break;
        }
    }

    updateStats() {
        const totalProjects = this.projects.length;
        const activeProjects = this.projects.filter(p => p.status === 'active').length;
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;

        document.getElementById('totalProjects').textContent = totalProjects;
        document.getElementById('activeProjects').textContent = activeProjects;
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
    }

    // Project Management
    openProjectModal(projectId = null) {
        this.currentEditingId = projectId;
        const modal = document.getElementById('projectModal');
        const title = document.getElementById('projectModalTitle');
        const form = document.getElementById('projectForm');

        if (projectId) {
            const project = this.projects.find(p => p.id === projectId);
            title.textContent = 'Edit Project';
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectUrl').value = project.url || '';
            document.getElementById('projectDescription').value = project.description || '';
            document.getElementById('projectStatus').value = project.status;
            document.getElementById('projectPriority').value = project.priority;
        } else {
            title.textContent = 'New Project';
            form.reset();
        }

        modal.classList.add('show');
    }

    saveProject() {
        const formData = {
            name: document.getElementById('projectName').value,
            url: document.getElementById('projectUrl').value,
            description: document.getElementById('projectDescription').value,
            status: document.getElementById('projectStatus').value,
            priority: document.getElementById('projectPriority').value
        };

        if (this.currentEditingId) {
            // Update existing project
            const index = this.projects.findIndex(p => p.id === this.currentEditingId);
            this.projects[index] = { ...this.projects[index], ...formData };
        } else {
            // Create new project
            const project = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.projects.push(project);
        }

        this.saveData();
        this.renderProjects();
        this.updateProjectFilter();
        this.updateStats();
        this.closeModal(document.getElementById('projectModal'));
        this.showNotification('Project saved successfully!', 'success');
    }

    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.tasks = this.tasks.filter(t => t.projectId !== projectId);
            this.saveData();
            this.renderProjects();
            this.renderTasks();
            this.updateProjectFilter();
            this.updateStats();
            this.showNotification('Project deleted successfully!', 'success');
        }
    }

    renderProjects() {
        const container = document.getElementById('projectsList');
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filteredProjects = this.projects;
        if (statusFilter !== 'all') {
            filteredProjects = this.projects.filter(p => p.status === statusFilter);
        }

        if (filteredProjects.length === 0) {
            container.innerHTML = '<div class="no-data">No projects found. Create your first project to get started!</div>';
            return;
        }

        container.innerHTML = filteredProjects.map(project => {
            const projectTasks = this.tasks.filter(t => t.projectId === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
            const totalTasks = projectTasks.length;

            return `
                <div class="project-card ${project.priority}-priority">
                    <div class="project-header">
                        <div>
                            <div class="project-title">${project.name}</div>
                            <span class="project-status ${project.status}">${project.status.replace('-', ' ')}</span>
                        </div>
                        <div class="project-actions">
                            <button class="btn btn-sm btn-primary" onclick="pm.openProjectModal('${project.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="pm.deleteProject('${project.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${project.url ? `<a href="${project.url}" target="_blank" class="project-url"><i class="fas fa-external-link-alt"></i> ${project.url}</a>` : ''}
                    ${project.description ? `<div class="project-description">${project.description}</div>` : ''}
                    <div class="project-stats">
                        <span><i class="fas fa-tasks"></i> ${completedTasks}/${totalTasks} tasks completed</span>
                        <span><i class="fas fa-flag"></i> ${project.priority}</span>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-sm btn-primary" onclick="pm.openTaskModal(null, '${project.id}')">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="pm.viewProjectTasks('${project.id}')">
                            <i class="fas fa-list"></i> View Tasks
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Task Management
    openTaskModal(taskId = null, projectId = null) {
        this.currentEditingId = taskId;
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        const form = document.getElementById('taskForm');

        // Update project dropdown
        const projectSelect = document.getElementById('taskProject');
        projectSelect.innerHTML = '<option value="">Select a project</option>' +
            this.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            title.textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskProject').value = task.projectId;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDueDate').value = task.dueDate || '';
        } else {
            title.textContent = 'New Task';
            form.reset();
            if (projectId) {
                document.getElementById('taskProject').value = projectId;
            }
        }

        modal.classList.add('show');
    }

    saveTask() {
        const formData = {
            title: document.getElementById('taskTitle').value,
            projectId: document.getElementById('taskProject').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value
        };

        if (this.currentEditingId) {
            // Update existing task
            const index = this.tasks.findIndex(t => t.id === this.currentEditingId);
            this.tasks[index] = { ...this.tasks[index], ...formData, updatedAt: new Date().toISOString() };
        } else {
            // Create new task
            const task = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.tasks.push(task);
        }

        this.saveData();
        this.renderTasks();
        this.renderProjects();
        this.updateStats();
        this.closeModal(document.getElementById('taskModal'));
        this.showNotification('Task saved successfully!', 'success');
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.renderTasks();
            this.renderProjects();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksTableBody');
        const statusFilter = document.getElementById('taskStatusFilter').value;
        const projectFilter = document.getElementById('projectFilter').value;
        
        let filteredTasks = this.tasks;
        
        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
        }
        
        if (projectFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.projectId === projectFilter);
        }

        if (filteredTasks.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="no-data">No tasks found. Create your first task to get started!</td></tr>';
            return;
        }

        container.innerHTML = filteredTasks.map(task => {
            const project = this.projects.find(p => p.id === task.projectId);
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
            const isOverdue = dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

            return `
                <tr>
                    <td>
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    </td>
                    <td>
                        <div class="task-project">${project ? project.name : 'No Project'}</div>
                    </td>
                    <td>
                        <span class="task-status ${task.status}">${task.status.replace('-', ' ')}</span>
                    </td>
                    <td>
                        <span class="task-priority ${task.priority}">${task.priority}</span>
                    </td>
                    <td>
                        <span class="task-due-date ${isOverdue ? 'overdue' : ''}">${dueDate || 'No due date'}</span>
                    </td>
                    <td>
                        <div class="task-actions">
                            <button class="btn btn-sm btn-primary" onclick="pm.openTaskModal('${task.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="pm.deleteTask('${task.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateProjectFilter() {
        const projectFilter = document.getElementById('projectFilter');
        projectFilter.innerHTML = '<option value="all">All Projects</option>' +
            this.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    viewProjectTasks(projectId) {
        this.switchTab('tasks');
        document.getElementById('projectFilter').value = projectId;
        this.renderTasks();
    }

    // Reminder Management
    openReminderModal(reminderId = null) {
        this.currentEditingId = reminderId;
        const modal = document.getElementById('reminderModal');
        const title = document.getElementById('reminderModalTitle');
        const form = document.getElementById('reminderForm');

        // Update project dropdown
        const projectSelect = document.getElementById('reminderProject');
        projectSelect.innerHTML = '<option value="">No specific project</option>' +
            this.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        if (reminderId) {
            const reminder = this.reminders.find(r => r.id === reminderId);
            title.textContent = 'Edit Reminder';
            document.getElementById('reminderTitle').value = reminder.title;
            document.getElementById('reminderDescription').value = reminder.description || '';
            document.getElementById('reminderDateTime').value = reminder.dateTime;
            document.getElementById('reminderProject').value = reminder.projectId || '';
        } else {
            title.textContent = 'New Reminder';
            form.reset();
            // Set default time to 1 hour from now
            const now = new Date();
            now.setHours(now.getHours() + 1);
            document.getElementById('reminderDateTime').value = now.toISOString().slice(0, 16);
        }

        modal.classList.add('show');
    }

    saveReminder() {
        const formData = {
            title: document.getElementById('reminderTitle').value,
            description: document.getElementById('reminderDescription').value,
            dateTime: document.getElementById('reminderDateTime').value,
            projectId: document.getElementById('reminderProject').value || null
        };

        if (this.currentEditingId) {
            // Update existing reminder
            const index = this.reminders.findIndex(r => r.id === this.currentEditingId);
            this.reminders[index] = { ...this.reminders[index], ...formData, updatedAt: new Date().toISOString() };
        } else {
            // Create new reminder
            const reminder = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                notified: false
            };
            this.reminders.push(reminder);
        }

        this.saveData();
        this.renderReminders();
        this.closeModal(document.getElementById('reminderModal'));
        this.showNotification('Reminder saved successfully!', 'success');
    }

    deleteReminder(reminderId) {
        if (confirm('Are you sure you want to delete this reminder?')) {
            this.reminders = this.reminders.filter(r => r.id !== reminderId);
            this.saveData();
            this.renderReminders();
            this.showNotification('Reminder deleted successfully!', 'success');
        }
    }

    renderReminders() {
        const container = document.getElementById('remindersList');
        
        if (this.reminders.length === 0) {
            container.innerHTML = '<div class="no-data">No reminders found. Create your first reminder to get started!</div>';
            return;
        }

        // Sort reminders by date
        const sortedReminders = [...this.reminders].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

        container.innerHTML = sortedReminders.map(reminder => {
            const reminderDate = new Date(reminder.dateTime);
            const now = new Date();
            const isOverdue = reminderDate < now && !reminder.notified;
            const isUpcoming = reminderDate > now && reminderDate < new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const project = reminder.projectId ? this.projects.find(p => p.id === reminder.projectId) : null;

            return `
                <div class="reminder-item ${isOverdue ? 'overdue' : isUpcoming ? 'upcoming' : ''}">
                    <div class="reminder-title">${reminder.title}</div>
                    <div class="reminder-datetime">
                        <i class="fas fa-clock"></i> ${reminderDate.toLocaleString()}
                    </div>
                    ${reminder.description ? `<div class="reminder-description">${reminder.description}</div>` : ''}
                    ${project ? `<div class="reminder-project">Related to: ${project.name}</div>` : ''}
                    <div class="reminder-actions">
                        <button class="btn btn-sm btn-primary" onclick="pm.openReminderModal('${reminder.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="pm.deleteReminder('${reminder.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${isOverdue ? '<button class="btn btn-sm btn-secondary" onclick="pm.markReminderNotified(\'' + reminder.id + '\')"><i class="fas fa-check"></i> Mark Notified</button>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    markReminderNotified(reminderId) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (reminder) {
            reminder.notified = true;
            this.saveData();
            this.renderReminders();
            this.showNotification('Reminder marked as notified!', 'success');
        }
    }

    // Reminder Checking
    startReminderChecker() {
        this.reminderCheckInterval = setInterval(() => {
            this.checkReminders();
        }, 60000); // Check every minute
    }

    checkReminders() {
        const now = new Date();
        const upcomingReminders = this.reminders.filter(reminder => {
            const reminderTime = new Date(reminder.dateTime);
            const timeDiff = reminderTime - now;
            return timeDiff > 0 && timeDiff <= 5 * 60 * 1000 && !reminder.notified; // 5 minutes before
        });

        upcomingReminders.forEach(reminder => {
            this.showNotification(`Reminder: ${reminder.title}`, 'info');
            reminder.notified = true;
        });

        if (upcomingReminders.length > 0) {
            this.saveData();
        }
    }

    // Settings
    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const storedPassword = localStorage.getItem('projectManagerPassword');
        if (btoa(currentPassword) !== storedPassword) {
            this.showError('Current password is incorrect');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('New password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('New passwords do not match');
            return;
        }

        localStorage.setItem('projectManagerPassword', btoa(newPassword));
        document.getElementById('changePasswordForm').reset();
        this.showNotification('Password changed successfully!', 'success');
    }

    exportData() {
        const data = {
            projects: this.projects,
            tasks: this.tasks,
            reminders: this.reminders,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('This will replace all your current data. Are you sure you want to continue?')) {
                    this.projects = data.projects || [];
                    this.tasks = data.tasks || [];
                    this.reminders = data.reminders || [];
                    this.saveData();
                    this.renderProjects();
                    this.renderTasks();
                    this.renderReminders();
                    this.updateProjectFilter();
                    this.updateStats();
                    this.showNotification('Data imported successfully!', 'success');
                }
            } catch (error) {
                this.showError('Invalid file format. Please select a valid backup file.');
            }
        };
        reader.readAsText(file);
    }

    // Utility Functions
    closeModal(modal) {
        modal.classList.remove('show');
        this.currentEditingId = null;
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the application
const pm = new ProjectManager();
