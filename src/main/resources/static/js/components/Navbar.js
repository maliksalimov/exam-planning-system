import { Auth } from '../auth.js';

export const Navbar = {
    getHtml() {
        if (!Auth.isAuthenticated()) return '';
        
        return `
        <nav class="navbar">
            <div class="navbar-brand">ExamPlanning <span>Sistemi</span></div>
            <div class="navbar-links">
                <a href="#/dashboard" class="${window.location.hash === '#/dashboard' ? 'active' : ''}">Ana Sayfa</a>
                <a href="#/faculties" class="${window.location.hash === '#/faculties' ? 'active' : ''}">Fakülteler</a>
                <a href="#/departments" class="${window.location.hash === '#/departments' ? 'active' : ''}">Bölümler</a>
                <a href="#/courses" class="${window.location.hash === '#/courses' ? 'active' : ''}">Dersler</a>
                <a href="#/classrooms" class="${window.location.hash === '#/classrooms' ? 'active' : ''}">Derslikler</a>
                <a href="#/students" class="${window.location.hash === '#/students' ? 'active' : ''}">Öğrenciler</a>
                <a href="#/instructors" class="${window.location.hash === '#/instructors' ? 'active' : ''}">Öğr. Elemanları</a>
                <a href="#/exams" class="${window.location.hash === '#/exams' ? 'active' : ''}">Sınavlar</a>
                <a href="#/exam-planning" class="${window.location.hash === '#/exam-planning' ? 'active' : ''}">Planlama</a>
                <a href="#/reports" class="${window.location.hash === '#/reports' ? 'active' : ''}">📊 Raporlar</a>
                <a href="#/conflicts" class="${window.location.hash === '#/conflicts' ? 'active' : ''}">Çakışmalar</a>
                <button class="btn-danger" id="nav-logout">Çıkış</button>
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
