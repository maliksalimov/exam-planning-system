import { Auth } from './auth.js';
import { Navbar } from './components/Navbar.js';
import LoginView from './views/LoginView.js';
import DashboardView from './views/DashboardView.js';
import ExamPlanningView from './views/ExamPlanningView.js';
import FacultyView from './views/FacultyView.js';
import DepartmentView from './views/DepartmentView.js';
import CourseView from './views/CourseView.js';
import ClassroomView from './views/ClassroomView.js';
import StudentView from './views/StudentView.js';
import InstructorView from './views/InstructorView.js';
import ExamView from './views/ExamView.js';
import StudentQueryView from './views/StudentQueryView.js';
import InstructorQueryView from './views/InstructorQueryView.js';
import ConflictsView from './views/ConflictsView.js';
import ReportsView from './views/ReportsView.js';


const routes = {
    '#/login': { view: LoginView, protected: false },
    '#/dashboard': { view: DashboardView, protected: true },
    '#/exam-planning': { view: ExamPlanningView, protected: true },
    '#/faculties': { view: FacultyView, protected: true },
    '#/departments': { view: DepartmentView, protected: true },
    '#/courses': { view: CourseView, protected: true },
    '#/classrooms': { view: ClassroomView, protected: true },
    '#/students': { view: StudentView, protected: true },
    '#/instructors': { view: InstructorView, protected: true },
    '#/exams': { view: ExamView, protected: true },
    '#/student-query': { view: StudentQueryView, protected: false },
    '#/instructor-duties': { view: InstructorQueryView, protected: true },
    '#/conflicts': { view: ConflictsView, protected: true },
    '#/reports': { view: ReportsView, protected: true }
};

let currentView = null;

const router = async () => {
    let hash = window.location.hash || '#/login';
    const route = routes[hash];
    const navSlot = document.getElementById('nav-slot');

    // Unknown route → go home based on auth state
    if (!route) {
        window.location.hash = Auth.isAuthenticated() ? '#/dashboard' : '#/login';
        return;
    }

    // Authenticated user trying to open login → send to dashboard
    if (hash === '#/login' && Auth.isAuthenticated()) {
        window.location.hash = '#/dashboard';
        return;
    }

    // Protected route without a valid session → send to login
    if (route.protected && !Auth.isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    const appRoot = document.getElementById('app-root');
    const ViewClass = route.view;

    // Strict Memory Teardown Sequence
    if (currentView && typeof currentView.unmount === 'function') {
        currentView.unmount();
    }

    // Handle Navbar
    if (Auth.isAuthenticated()) {
        navSlot.innerHTML = Navbar.getHtml();
        if (typeof Navbar.mount === 'function') {
            Navbar.mount();
        }
    } else {
        navSlot.innerHTML = '';
    }

    currentView = new ViewClass();
    
    // DOM Injection
    appRoot.innerHTML = currentView.getHtml();
    
    // Lifecycle Mount
    if (typeof currentView.mount === 'function') {
        await currentView.mount();
    }
};

export const initRouter = () => {
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
};
