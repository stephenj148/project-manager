// Personal Project Manager - Web Application JavaScript with Firebase Sync (Modular SDK, Secure Config + URL Auto-Fix)
// Note: Use Firebase Modular SDK v10+. Include as <script type="module" src="script.js"></script> in HTML.

// Firebase imports (full CDN URLs for browser compatibility)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, collection, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase config (your secure updated version)
const firebaseConfig = {
  apiKey: "AIzaSyDwgmzGLkwduT75hAwgA-60T4ei3w2YnDA",
  authDomain: "sj-design-project-management.firebaseapp.com",
  projectId: "sj-design-project-management",
  storageBucket: "sj-design-project-management.firebasestorage.app",
  messagingSenderId: "1036574888660",
  appId: "1:1036574888660:web:875672378aaef8f46a2141",
  measurementId: "G-ZMTQCGRKBD"
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
        let url = document.getElementById('projectUrl')?.value.trim() || '';
        
        // Auto-fix URL: Prepend "https://" if no protocol
        if (url && !url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }
        
        const formData = {
            name: document.getElementById('projectName')?.value || '',
            url: url,  // Use the fixed version
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
                            <button class="btn btn-sm btn-primary" onclick="pm.openProjectModal('${project.id}')"><i class
