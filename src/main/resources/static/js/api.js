import { Auth } from './auth.js';

export const Toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
    error(message) { this.show(message, 'error'); },
    success(message) { this.show(message, 'success'); }
};

export const Api = {
    async request(endpoint, options = {}) {
        const url = `/api/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (Auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        }

        const config = { ...options, headers };

        try {
            const response = await fetch(url, config);

            if (response.status === 401 || response.status === 403) {
                Auth.logout();
                Toast.error('Authentication expired. Please log in again.');
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                let errorMsg = 'Application Error';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) {}
                Toast.error(`[Error] ${errorMsg}`);
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return null;
        } catch (err) {
            if (err.message !== 'Unauthorized') console.error('API Error:', err);
            throw err;
        }
    },

    async getAll(endpoint) {
        const res = await this.request(`${endpoint}?size=1000`);
        if (res && Array.isArray(res.content)) return res.content;
        if (Array.isArray(res)) return res;
        return [];
    }
};
