export const Auth = {
    setToken(token) {
        localStorage.setItem('jwt_token', token);
    },
    getToken() {
        return localStorage.getItem('jwt_token');
    },
    removeToken() {
        localStorage.removeItem('jwt_token');
    },
    isAuthenticated() {
        return !!this.getToken();
    },
    async logout() {
        const token = this.getToken();
        try {
            if (token) {
                await fetch('http://localhost:8081/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (_) {
            // network error — proceed with local logout regardless
        } finally {
            this.removeToken();
            window.location.hash = '#/login';
        }
    }
};
