import { Auth } from './auth.js';
import { Navbar } from './components/Navbar.js';
import LoginView from './views/LoginView.js';
import DashboardView from './views/DashboardView.js';
import ExamPlanningView from './views/ExamPlanningView.js';

const routes = {
    '#/login': { view: LoginView, protected: false },
    '#/dashboard': { view: DashboardView, protected: true },
    '#/exam-planning': { view: ExamPlanningView, protected: true }
};

let currentView = null;

const router = async () => {
    let hash = window.location.hash || '#/login';
    const route = routes[hash] || routes['#/login'];
    const navSlot = document.getElementById('nav-slot');

    // Route Guard
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
