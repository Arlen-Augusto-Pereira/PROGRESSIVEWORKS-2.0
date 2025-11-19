console.log('auth.js carregado');

let AuthManager = class {
    constructor() {
        console.log('AuthManager inicializando...');
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('AuthManager inicializado');
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    handleLogin() {
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        
        if (!usernameEl || !passwordEl) {
            alert('Erro: campos não encontrados');
            return;
        }

        const username = usernameEl.value;
        const password = passwordEl.value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            if (window.app) {
                window.app.showApp();
            }
        } else {
            alert('Usuário ou senha incorretos!');
        }
    }

    handleRegister() {
        const usernameEl = document.getElementById('newUsername');
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('newPassword');
        
        if (!usernameEl || !emailEl || !passwordEl) {
            alert('Erro: campos não encontrados');
            return;
        }

        const username = usernameEl.value;
        const email = emailEl.value;
        const password = passwordEl.value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existingUser = users.find(u => u.username === username || u.email === email);

        if (existingUser) {
            alert('Usuário ou e-mail já cadastrado!');
            return;
        }

        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        alert('Cadastro realizado com sucesso!');
        if (window.app) {
            window.app.showApp();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando AuthManager...');
    window.authManager = new AuthManager();
});