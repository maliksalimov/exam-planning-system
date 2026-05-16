import { Api } from '../api.js';
import { Auth } from '../auth.js';

export default class LoginView {

    getHtml() {
        return `
        <div class="login-shell">
            <div class="login-card glass-panel">
                <div class="login-header">
                    <h1 class="login-brand">Exam Planning<span class="login-brand-accent"> Console</span></h1>
                    <p class="login-subtitle">Secure Administrative Access</p>
                </div>
                <div class="form-group">
                    <label class="form-label" for="login-username">Username</label>
                    <input class="form-input" type="text" id="login-username" placeholder="Enter username" autocomplete="username" />
                </div>
                <div class="form-group">
                    <label class="form-label" for="login-password">Password</label>
                    <input class="form-input" type="password" id="login-password" placeholder="Enter password" autocomplete="current-password" />
                </div>
                <p id="login-error" class="login-error"></p>
                <button class="btn-primary login-btn" id="login-submit">Sign In</button>
            </div>
        </div>
        `;
    }

    mount() {
        this._btn = document.getElementById('login-submit');
        this._usernameInput = document.getElementById('login-username');
        this._passwordInput = document.getElementById('login-password');
        this._errorEl = document.getElementById('login-error');

        // Use named function stored on instance — required for proper removeEventListener
        this._onSubmit = async () => {
            const username = this._usernameInput.value.trim();
            const password = this._passwordInput.value.trim();

            this._errorEl.textContent = '';

            if (!username || !password) {
                this._errorEl.textContent = 'Username and password are required.';
                return;
            }

            this._btn.disabled = true;
            this._btn.textContent = 'Signing in...';

            try {
                const data = await Api.request('auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });
                Auth.setToken(data.token);
                window.location.hash = '#/dashboard';
            } catch (err) {
                // Inline error — NOT a Toast. Auth failures belong beside the form.
                this._errorEl.textContent = 'Invalid credentials. Please try again.';
            } finally {
                this._btn.disabled = false;
                this._btn.textContent = 'Sign In';
            }
        };

        this._btn.addEventListener('click', this._onSubmit);

        // Allow Enter key on password field
        this._onKeydown = (e) => {
            if (e.key === 'Enter') this._onSubmit();
        };
        this._passwordInput.addEventListener('keydown', this._onKeydown);
        this._usernameInput.addEventListener('keydown', this._onKeydown);
    }

    unmount() {
        if (this._btn) this._btn.removeEventListener('click', this._onSubmit);
        if (this._passwordInput) this._passwordInput.removeEventListener('keydown', this._onKeydown);
        if (this._usernameInput) this._usernameInput.removeEventListener('keydown', this._onKeydown);
        this._btn = null;
        this._usernameInput = null;
        this._passwordInput = null;
        this._errorEl = null;
    }
}
