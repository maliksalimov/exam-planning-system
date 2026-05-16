import { Auth } from '../auth.js';

export const Navbar = {
    getHtml() {
        if (!Auth.isAuthenticated()) return '';
        
        return `
        <nav class="navbar">
            <div class="navbar-brand">ExamPlanning <span style="color:white; opacity:0.6; font-weight:normal">Console</span></div>
            <div class="navbar-links">
                <a href="#/dashboard" class="${window.location.hash === '#/dashboard' ? 'active' : ''}">Dashboard</a>
                <a href="#/exam-planning" class="${window.location.hash === '#/exam-planning' ? 'active' : ''}">Exam Planner</a>
                <button class="btn-danger" id="nav-logout" style="padding: 4px 12px; margin-left: var(--space-md)">Logout</button>
            </div>
        </nav>
        `;
    },
    mount() {
        const logoutBtn = document.getElementById('nav-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => Auth.logout();
        }
    }
};
