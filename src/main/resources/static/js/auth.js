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
    logout() {
        this.removeToken();
        window.location.hash = '#/login';
    }
};
