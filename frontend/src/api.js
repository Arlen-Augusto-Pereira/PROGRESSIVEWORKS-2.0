// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Classe para gerenciar chamadas à API
class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // Método para fazer requisições HTTP
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adicionar token de autenticação se existir
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Erro HTTP: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // Métodos de autenticação
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Métodos de usuário
    async getUserProfile() {
        return await this.request('/users/profile');
    }

    async updateUserProfile(userData) {
        return await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // Métodos de contas
    async getAccounts() {
        return await this.request('/accounts');
    }

    async createAccount(accountData) {
        return await this.request('/accounts', {
            method: 'POST',
            body: JSON.stringify(accountData)
        });
    }

    async updateAccount(accountId, accountData) {
        return await this.request(`/accounts/${accountId}`, {
            method: 'PUT',
            body: JSON.stringify(accountData)
        });
    }

    async deleteAccount(accountId) {
        return await this.request(`/accounts/${accountId}`, {
            method: 'DELETE'
        });
    }

    // Métodos de transações
    async getTransactions(filters = {}) {
        const queryParams = new URLSearchParams(filters);
        const endpoint = `/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return await this.request(endpoint);
    }

    async createTransaction(transactionData) {
        return await this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }

    async updateTransaction(transactionId, transactionData) {
        return await this.request(`/transactions/${transactionId}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        });
    }

    async deleteTransaction(transactionId) {
        return await this.request(`/transactions/${transactionId}`, {
            method: 'DELETE'
        });
    }

    // Métodos de categorias
    async getCategories(tipo = null) {
        const endpoint = tipo ? `/categories?tipo=${tipo}` : '/categories';
        return await this.request(endpoint);
    }

    async createCategory(categoryData) {
        return await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateCategory(categoryId, categoryData) {
        return await this.request(`/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async deleteCategory(categoryId) {
        return await this.request(`/categories/${categoryId}`, {
            method: 'DELETE'
        });
    }
}

// Instância global da API
const api = new ApiService();

// Utilitários para formatação
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

const formatDateForInput = (date) => {
    return new Date(date).toISOString().split('T')[0];
};

// Utilitários para notificações
const showNotification = (message, type = 'info') => {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // Adicionar estilos se não existirem
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .notification-success { background: #28a745; }
            .notification-error { background: #dc3545; }
            .notification-warning { background: #ffc107; color: #333; }
            .notification-info { background: #17a2b8; }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }

    // Adicionar ao DOM
    document.body.appendChild(notification);

    // Remover após 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
};

const getNotificationIcon = (type) => {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
};

// Utilitário para loading
const showLoading = () => {
    document.getElementById('loading').classList.remove('hidden');
};

const hideLoading = () => {
    document.getElementById('loading').classList.add('hidden');
};

// Validações
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => {
    return password.length >= 6;
};

const validateRequired = (value) => {
    return value && value.trim().length > 0;
};