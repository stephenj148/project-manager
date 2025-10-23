// Personal Project Manager - Web Application JavaScript with Firebase Sync (Modular SDK, Corrected Config)
// Note: Use Firebase Modular SDK v10+. Include as <script type="module" src="script.js"></script> in HTML.

// Firebase imports (full CDN URLs for browser compatibility)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, collection, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase config (corrected storageBucket to .appspot.com format)
const firebaseConfig = {
  apiKey: "AIzaSyBSV2aIyJNTWqLcmEKNswQeYekznkraiU4",
  authDomain: "sj-design-project-management.firebaseapp.com",
  projectId: "sj-design-project-management",
  storageBucket: "sj-design-project-management.appspot.com",  // Fixed: Use .appspot.com, not .firebasestorage.app
  messagingSenderId: "1036574888660",
  appId: "1:1036574888660:web:0a00006d6b613de86a2141",
  measurementId: "G-V5EWKF8NB8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Optional
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Persistence failed: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.log('Persistence failed: Browser does not support.');
  }
});

class ProjectManager {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.tasks = [];
        this.reminders = [];
        this.currentEditingId = null;
        this.reminderCheckInterval = null;
        this.unsubscribes = {};
        this.isDarkMode = false;
        
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        onAuthStateChanged(auth, (user) => {
            console.log('Auth state:', user ? `Logged in: ${user.email}` : 'Logged out');
            if (user) {
                this.currentUser = user.uid;
                this.setupDataListeners();
                this.checkReminders();
                this.startReminderChecker();
                this.showDashboard();  // Show dashboard on login
            } else {
                this.currentUser = null;
                this.projects = [];
                this.tasks = [];
                this.reminders = [];
                Object.values(this.unsubscribes).forEach(unsub => unsub());
                this.unsubscribes = {};
                this.showLoginScreen();
            }
        });
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
        if (!button) return;
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

    // Event Listeners
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.nav-item').dataset.tab));
        });

        const addProjectBtn = document.getElementById('addProjectBtn');
        if (addProjectBtn) addProjectBtn.addEventListener('click', () => this.openProjectModal());

        const projectForm = document.getElementById('projectForm');
        if (projectForm) projectForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveProject(); });

        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) addTaskBtn.addEventListener('click', () => this.openTaskModal());

        const taskForm = document.getElementById('taskForm');
        if (taskForm) taskForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveTask(); });

        const addReminderBtn = document.getElementById('addReminderBtn');
        if (addReminderBtn) addReminderBtn.addEventListener('click', () => this.openReminderModal());

        const reminderForm = document.getElementById('reminderForm');
        if (reminderForm) reminderForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveReminder(); });

        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) changePasswordForm.addEventListener('submit', (e) => { e.preventDefault(); this.changePassword(); });

        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) exportDataBtn.addEventListener('click', () => this.exportData());

        const importDataBtn = document.getElementById('importDataBtn');
        if (importDataBtn) importDataBtn.addEventListener('click', () => document.getElementById('importFile').click());

        const importFile = document.getElementById('importFile');
        if (importFile) importFile.addEventListener('change', (e) => this.importData(e.target.files[0]));

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.addEventListener('change', () => this.renderProjects());

        const taskStatusFilter = document.getElementById('taskStatusFilter');
        if (taskStatusFilter) taskStatusFilter.addEventListener('change', () => this.renderTasks());

        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) projectFilter.addEventListener('change', () => this.renderTasks());

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal);
            });
        });
    }

    async handleLogin() {
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            this.showError('Email and password are required');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            if (error.code === 'auth/user-not-found') {
                if (password.length < 6) {
                    this.showError('Password must be at least 6 characters long');
                    return;
                }
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                    this.showNotification('Account created successfully!', 'success');
                } catch (createError) {
                    console.error('Create error:', createError);
                    this.showError(createError.message);
                }
            } else {
                this.showError(error.message);
            }
        }
    }

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }

    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        if (loginScreen) loginScreen.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        this.renderProjects();
        this.renderTasks();
        this.renderReminders();
        this.updateProjectFilter();
        this.updateStats();
    }

    // Data Listeners
    setupDataListeners() {
        if (!this.currentUser) return;
        const userId = this.currentUser;

        const projectsRef = collection(db, `users/${userId}/projects`);
        this.unsubscribes.projects = onSnapshot(projectsRef, (snapshot) => {
            this.projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            this.renderProjects();
            this.updateProjectFilter();
            this.updateStats();
        });

        const tasksRef = collection(db, `users/${userId}/tasks`);
        this.unsubscribes.tasks = onSnapshot(tasksRef, (snapshot) => {
            this.tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            this.renderTasks();
            this.updateStats();
        });

        const remindersRef = collection(db, `users/${userId}/reminders`);
        this.unsubscribes.reminders = onSnapshot(remindersRef, (snapshot) => {
            this.reminders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            this.renderReminders();
        });
    }

    // Tab Switching
    switchTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const activeTab = document.getElementById(`${tabName}Tab`);
        if (activeTab) activeTab.classList.add('active');

        this.updatePageHeader(tabName);

        switch (tabName) {
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
        if (!pageTitle || !pageSubtitle || !headerRight) return;

        switch (tabName) {
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
        const totalProjectsEl = document.getElementById('totalProjects');
        const activeProjectsEl = document.getElementById('activeProjects');
        const totalTasksEl = document.getElementById('totalTasks');
        const completedTasksEl = document.getElementById('completedTasks');
        if (!totalProjectsEl || !activeProjectsEl || !totalTasksEl || !completedTasksEl) return;

        const totalProjects = this.projects.length;
        const activeProjects = this.projects.filter(p => p.status === 'active').length;
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;

        totalProjectsEl.textContent = totalProjects;
        activeProjectsEl.textContent = activeProjects;
        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
    }

    // Project Methods
    openProjectModal(projectId = null) {
        this.currentEditingId = projectId;
        const modal = document.getElementById('projectModal');
        const title = document.getElementById('projectModalTitle');
        const form = document.getElementById('projectForm');
        if (!modal || !title || !form) return;

        if (projectId) {
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                title.textContent = 'Edit Project';
                document.getElementById('projectName').value = project.name;
                document.getElementById('projectUrl').value = project.url || '';
                document.getElementById('projectDescription').value = project.description || '';
                document.getElementById('projectStatus').value = project.status;
                document.getElementById('projectPriority').value = project.priority;
            }
        } else {
            title.textContent = 'New Project';
            form.reset();
        }
        modal.classList.add('show');
    }

    async saveProject() {
        if (!this.currentUser) {
            this.showError('Not logged in');
            return;
        }
        const formData = {
            name: document.getElementById('projectName')?.value || '',
            url: document.getElementById('projectUrl')?.value || '',
            description: document.getElementById('projectDescription')?.value || '',
            status: document.getElementById('projectStatus')?.value || 'active',
            priority: document.getElementById('projectPriority')?.value || 'medium'
        };
        const userId = this.currentUser;
        const projectsRef = collection(db, `users/${userId}/projects`);
        const timestamp = serverTimestamp();
        try {
            if (this.currentEditingId) {
                await setDoc(doc(projectsRef, this.currentEditingId), { ...formData, updatedAt: timestamp }, { merge: true });
            } else {
                await addDoc(projectsRef, { ...formData, createdAt: timestamp, updatedAt: timestamp });
            }
            this.closeModal(document.getElementById('projectModal'));
            this.showNotification('Project saved successfully!', 'success');
        } catch (error) {
            console.error('Save project error:', error);
            this.showError('Error saving project: ' + error.message);
        }
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure? This deletes associated tasks too.')) return;
        if (!this.currentUser) {
            this.showError('Not logged in');
            return;
        }
        const userId = this.currentUser;
        const projectsRef = collection(db, `users/${userId}/projects`);
        const tasksRef = collection(db, `users/${userId}/tasks`);
        try {
            const tasksQuery = query(tasksRef, where('projectId', '==', projectId));
            const tasksSnapshot = await getDocs(tasksQuery);
            const batch = writeBatch(db);
            tasksSnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            batch.delete(doc(projectsRef, projectId));
            await batch.commit();
            this.showNotification('Project deleted successfully!', 'success');
        } catch (error) {
            console.error('Delete project error:', error);
            this.showError('Error deleting project: ' + error.message);
        }
    }

    renderProjects() {
        const container = document.getElementById('projectsList');
        if (!container) return;
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        let filteredProjects = this.projects;
        if (statusFilter !== 'all') filteredProjects = this.projects.filter(p => p.status === statusFilter);
        if (filteredProjects.length === 0) {
            container.innerHTML = '<div class="no-data">No projects found. Create your first project!</div>';
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
                            <button class="btn btn-sm btn-primary" onclick="pm.openProjectModal('${project.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="pm.deleteProject('${project.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${project.url ? `<a href="${project.url}" target="_blank" class="project-url"><i class="fas fa-external-link-alt"></i> ${project.url}</a>` : ''}
                    ${project.description ? `<div class="project-description">${project.description}</div>` : ''}
                    <div class="project-stats">
                        <span><i class="fas fa-tasks"></i> ${completedTasks}/${totalTasks} tasks completed</span>
                        <span><i class="fas fa-flag"></i> ${project.priority}</span>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-sm btn-primary" onclick="pm.openTaskModal(null, '${project.id}')"><i class="fas fa-plus"></i> Add Task</button>
                        <button class="btn btn-sm btn-secondary" onclick="pm.viewProjectTasks('${project.id}')"><i class="fas fa-list"></i> View Tasks</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Task Methods (similar structure - abbreviated for brevity)
    openTaskModal(taskId = null, projectId = null) {
        this.currentEditingId = taskId;
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        const form = document.getElementById('taskForm');
        if (!modal || !title || !form) return;
        const projectSelect = document.getElementById('taskProject');
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">Select a project</option>' + this.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                title.textContent = 'Edit Task';
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskProject').value = task.projectId;
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskStatus').value = task.status;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskDueDate').value = task.dueDate || '';
            }
        } else {
            title.textContent = 'New Task';
            form.reset();
            if (projectId && document.getElementById('taskProject')) document.getElementById('taskProject').value = projectId;
        }
        modal.classList.add('show');
    }

    async saveTask() {
        if (!this.currentUser) {
            this.showError('Not logged in');
            return;
        }
        const formData = {
            title: document.getElementById('taskTitle')?.value || '',
            projectId: document.getElementById('taskProject')?.value || '',
            description: document.getElementById('taskDescription')?.value || '',
            status: document.getElementById('taskStatus')?.value || 'pending',
            priority: document.getElementById('taskPriority')?.value || 'medium',
            dueDate: document.getElementById('taskDueDate')?.value || ''
        };
        const userId = this.currentUser;
        const tasksRef = collection(db, `users/${userId}/tasks`);
        const timestamp = serverTimestamp();
        try {
            if (this.currentEditingId) {
                await setDoc(doc(tasksRef, this.currentEditingId), { ...formData, updatedAt: timestamp }, { merge: true });
            } else {
                await addDoc(tasksRef, { ...formData, createdAt: timestamp, updatedAt: timestamp });
            }
            this.closeModal(document.getElementById('taskModal'));
            this.showNotification('Task saved successfully!', 'success');
        } catch (error) {
            console.error('Save task error:', error);
            this.showError('Error saving task: ' + error.message);
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure?')) return;
        if (!this.currentUser) {
            this.showError('Not logged in');
            return;
        }
        const userId = this.currentUser;
        const tasksRef = collection(db, `users/${userId}/tasks`);
        try {
            await deleteDoc(doc(tasksRef, taskId));
            this.showNotification('Task deleted successfully!', 'success');
        } catch (error) {
            console.error('Delete task error:', error);
            this.showError('Error deleting task: ' + error.message);
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksTableBody');
        if (!container) return;
        const statusFilter = document.getElementById('taskStatusFilter')?.value || 'all';
        const projectFilter = document.getElementById('projectFilter')?.value || 'all';
        let filteredTasks = this.tasks;
        if (statusFilter !== 'all') filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
        if (projectFilter !== 'all') filteredTasks = filteredTasks.filter(t => t.projectId === projectFilter);
        if (filteredTasks.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="no-data">No tasks found. Create your first task!</td></tr>';
            return;
        }
        container.innerHTML = filteredTasks.map(task => {
            const project = this.projects.find(p => p.id === task.projectId);
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
            const isOverdue = dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            return `
                <tr>
                    <td><div class="task-title">${task.title}</div>${task.description ? `<div class="task-description">${task.description}</div>` : ''}</td>
                    <td><div class="task-project">${project ? project.name : 'No Project'}</div></td>
                    <td><span class="task-status ${task.status}">${task.status.replace('-', ' ')}</span></td>
                    <td><span class="task-priority ${task.priority}">${task.priority}</span></td>
                    <td><span class="task-due-date ${isOverdue ? 'overdue' : ''}">${dueDate || 'No due date'}</span></td>
                    <td><div class="task-actions">
                        <button class="btn btn-sm btn-primary" onclick="pm.openTaskModal('${task.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="pm.deleteTask('${task.id}')"><i class="fas fa-trash"></i></button>
                    </div></td>
                </tr>
            `;
        }).join('');
    }

    updateProjectFilter() {
        const projectFilter = document.getElementById('projectFilter');
        if (!projectFilter) return;
        projectFilter.innerHTML = '<option value="all">All Projects</option>' + this.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    viewProjectTasks(projectId) {
        this.switchTab('tasks');
        const filterEl = document.getElementById('projectFilter');
        if (filterEl) filterEl.value = projectId;
        this.renderTasks();
    }

    // Reminder Methods (similar - abbreviated)
    openReminderModal(reminderId = null) {
        this.currentEditingId = reminderId;
        const modal = document.getElementById('reminderModal');
        const title = document.getElementById('reminderModalTitle');
        const form = document.getElementById('reminderForm');
        if (!modal || !title || !form) return;
        const projectSelect = document.getElementById('reminderProject');
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">No specific project</option>' + this.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
        if (reminderId) {
            const reminder = this.reminders.find(r => r.id === reminderId);
            if (reminder) {
                title.textContent = 'Edit Reminder';
                document.getElementById('reminderTitle').value = reminder.title;
                document.getElementById('reminderDescription').value = reminder.description || '';
                document.getElementById('reminderDateTime').value = reminder.dateTime;
                document.getElementById('reminderProject').value = reminder.projectId || '';
            }
        } else {
            title.textContent = 'New Reminder';
            form.reset();
            const now = new Date();
            now.setHours(now.getHours() + 1);
            document.getElementById('reminderDateTime').value = now.toISOString().slice(0, 16);
        }
        modal.classList.add('show');
    }

    async saveReminder() {
        if (!this.currentUser) {
            this.showError('Not logged in');
            return;
        }
        const formData = {
            title: document.getElementById('reminderTitle')?.value || '',
            description: document.getElementById('reminderDescription')?.value || '',
            dateTime: document.getElementById('reminderDateTime')?.value || '',
            projectId: document.getElementById('reminderProject')?.value || null,
            notified: false
        };
        const userId = this.currentUser;
        const remindersRef = collection(db, `users/${userId}/reminders`);
        const timestamp = serverTimestamp();
        try {
            if (this.currentEditingId) {
                await setDoc(doc(remindersRef, this.currentEditingId), { ...formData, updatedAt: timestamp }, { merge: true });
            } else {
                await addDoc(remindersRef, { ...formData, createdAt: timestamp, updatedAt: timestamp });
            }
            this.closeModal(document.getElementById('reminderModal'));
            this.showNotification('Reminder saved successfully!', 'success');
        } catch (error) {
            console.error('Save reminder error:', error);
            this.showError('Error saving reminder: ' + error.message);
        }
    }

    async deleteReminder(reminderId) {
        if (!confirm('Are you sure?')) return;
        if (!this.currentUser) {
            this.showError('Not logged in');
            return;
        }
        const userId = this.currentUser;
        const remindersRef = collection(db, `users/${userId}/reminders`);
        try {
            await deleteDoc(doc(remindersRef, reminderId));
            this.showNotification('Reminder deleted successfully!', 'success');
        } catch (error) {
            console.error('Delete reminder error:', error);
            this.showError('Error deleting reminder: ' + error.message);
        }
    }

    renderReminders() {
        const container = document.getElementById('remindersList');
        if (!container) return;
        if (this.reminders.length === 0) {
            container.innerHTML = '<div class="no-data">No reminders found. Create your first reminder!</div>';
            return;
        }
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
                    <div class="reminder-datetime"><i class="fas fa-clock"></i> ${reminderDate.toLocaleString()}</div>
                    ${reminder.description ? `<div class="reminder-description">${reminder.description}</div>` : ''}
                    ${project ? `<div class="reminder-project">Related to: ${project.name}</div>` : ''}
                    <div class="reminder-actions">
                        <button class="btn btn-sm btn-primary" onclick="pm.openReminderModal('${reminder.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="pm.deleteReminder('${reminder.id}')"><i class="fas fa-trash"></i></button>
                        ${isOverdue ? '<button class="btn btn-sm btn-secondary" onclick="pm.markReminderNotified(\'' + reminder.id + '\')"><i class="fas fa-check"></i> Mark Notified</button>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async markReminderNotified(reminderId) {
        if (!this.currentUser) {
            this.showError('Not logged in');
            return;
        }
        const userId = this.currentUser;
        const remindersRef = collection(db, `users/${userId}/reminders`);
        try {
            await updateDoc(doc(remindersRef, reminderId), { notified: true });
            this.showNotification('Reminder marked as notified!', 'success');
        } catch (error) {
            console.error('Mark notified error:', error);
            this.showError('Error updating reminder: ' + error.message);
        }
    }

    // Reminder Checker
    startReminderChecker() {
        if (this.reminderCheckInterval) clearInterval(this.reminderCheckInterval);
        this.reminderCheckInterval = setInterval(() => this.checkReminders(), 60000);
    }

    async checkReminders() {
        const now = new Date();
        const upcomingReminders = this.reminders.filter(reminder => {
            const reminderTime = new Date(reminder.dateTime);
            const timeDiff = reminderTime - now;
            return timeDiff > 0 && timeDiff <= 5 * 60 * 1000 && !reminder.notified;
        });
        for (const reminder of upcomingReminders) {
            this.showNotification(`Reminder: ${reminder.title}`, 'info');
            if (this.currentUser) {
                const userId = this.currentUser;
                await updateDoc(doc(collection(db, `users/${userId}/reminders`), reminder.id), { notified: true });
            }
        }
    }

    // Settings
    async changePassword() {
        const currentPassword = document.getElementById('currentPassword')?.value || '';
        const newPassword = document.getElementById('newPassword')?.value || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value || '';
        if (newPassword.length < 6) {
            this.showError('New password must be at least 6 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            this.showError('New passwords do not match');
            return;
        }
        const user = auth.currentUser;
        if (!user) {
            this.showError('Not logged in');
            return;
        }
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            document.getElementById('changePasswordForm').reset();
            this.showNotification('Password changed successfully!', 'success');
        } catch (error) {
            console.error('Password change error:', error);
            if (error.code === 'auth/wrong-password') {
                this.showError('Current password is incorrect');
            } else {
                this.showError(error.message);
            }
        }
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

    async importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!confirm('This will replace all current data. Continue?')) return;
                if (!this.currentUser) {
                    this.showError('Not logged in');
                    return;
                }
                const userId = this.currentUser;
                const batch = writeBatch(db);
                const [projectsSnap, tasksSnap, remindersSnap] = await Promise.all([
                    getDocs(collection(db, `users/${userId}/projects`)),
                    getDocs(collection(db, `users/${userId}/tasks`)),
                    getDocs(collection(db, `users/${userId}/reminders`))
                ]);
                projectsSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
                tasksSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
                remindersSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
                const timestamp = serverTimestamp();
                (data.projects || []).forEach(proj => {
                    const docRef = doc(collection(db, `users/${userId}/projects`), proj.id);
                    batch.set(docRef, { ...proj, createdAt: proj.createdAt || timestamp, updatedAt: timestamp });
                });
                (data.tasks || []).forEach(task => {
                    const docRef = doc(collection(db, `users/${userId}/tasks`), task.id);
                    batch.set(docRef, { ...task, createdAt: task.createdAt || timestamp, updatedAt: timestamp });
                });
                (data.reminders || []).forEach(rem => {
                    const docRef = doc(collection(db, `users/${userId}/reminders`), rem.id);
                    batch.set(docRef, { ...rem, createdAt: rem.createdAt || timestamp, updatedAt: timestamp, notified: rem.notified || false });
                });
                await batch.commit();
                this.showNotification('Data imported successfully!', 'success');
            } catch (error) {
                console.error('Import error:', error);
                this.showError('Invalid file or import error: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // Utilities
    closeModal(modal) {
        if (modal) modal.classList.remove('show');
        this.currentEditingId = null;
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 5000);
        }
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
        setTimeout(() => notification.remove(), 5000);
    }
}

// Initialize
const pm = new ProjectManager();
window.pm = pm;  // For onclick handlers
