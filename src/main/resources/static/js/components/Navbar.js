import { Auth } from '../auth.js';

export const Navbar = {
    getHtml() {
        if (!Auth.isAuthenticated()) return '';
        
        return `
        <nav class="navbar">
            <div class="navbar-brand">ExamPlanning <span>System</span></div>
            <div class="navbar-links">
                <a href="#/dashboard" class="${window.location.hash === '#/dashboard' ? 'active' : ''}">Dashboard</a>
                <a href="#/faculties" class="${window.location.hash === '#/faculties' ? 'active' : ''}">Faculties</a>
                <a href="#/departments" class="${window.location.hash === '#/departments' ? 'active' : ''}">Departments</a>
                <a href="#/courses" class="${window.location.hash === '#/courses' ? 'active' : ''}">Courses</a>
                <a href="#/classrooms" class="${window.location.hash === '#/classrooms' ? 'active' : ''}">Classrooms</a>
                <a href="#/students" class="${window.location.hash === '#/students' ? 'active' : ''}">Students</a>
                <a href="#/instructors" class="${window.location.hash === '#/instructors' ? 'active' : ''}">Instructors</a>
                <a href="#/exams" class="${window.location.hash === '#/exams' ? 'active' : ''}">Exams</a>
                <a href="#/exam-planning" class="${window.location.hash === '#/exam-planning' ? 'active' : ''}">Planning</a>
                <a href="#/reports" class="${window.location.hash === '#/reports' ? 'active' : ''}">📊 Reports</a>
                <a href="#/conflicts" class="${window.location.hash === '#/conflicts' ? 'active' : ''}">Conflicts</a>
                <button class="btn-danger" id="nav-logout">Logout</button>
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
