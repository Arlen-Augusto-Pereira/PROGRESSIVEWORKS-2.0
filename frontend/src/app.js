// Classe principal da aplicação
class FinanceApp {
    constructor() {
        this.currentUser = null;
        this.accounts = [];
        this.transactions = [];
        this.categories = [];
        
        this.init();
    }

    async init() {
        // Verificar se usuário está logado
        if (api.isAuthenticated()) {
            try {
                await this.loadUserData();
                this.showDashboard();
            } catch (error) {
                console.error('Erro ao carregar dados do usuário:', error);
                api.logout();
                this.showLogin();
            }
        } else {
            this.showLogin();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Eventos de autenticação
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('show-register').addEventListener('click', (e) => this.showRegister(e));
        document.getElementById('show-login').addEventListener('click', (e) => this.showLogin(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Eventos do dashboard
        document.getElementById('add-income-btn').addEventListener('click', () => this.showAddTransactionModal('receita'));
        document.getElementById('add-expense-btn').addEventListener('click', () => this.showAddTransactionModal('despesa'));
        document.getElementById('manage-accounts-btn').addEventListener('click', () => this.showAccountsModal());
    }

    // Métodos de navegação
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showLogin(e) {
        if (e) e.preventDefault();
        this.showScreen('login-screen');
    }

    showRegister(e) {
        if (e) e.preventDefault();
        this.showScreen('register-screen');
    }

    showDashboard() {
        this.showScreen('dashboard-screen');
        this.loadDashboardData();
    }

    // Métodos de autenticação
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-password').value;

        // Validações
        if (!validateEmail(email)) {
            showNotification('Email inválido', 'error');
            return;
        }

        if (!validateRequired(senha)) {
            showNotification('Senha é obrigatória', 'error');
            return;
        }

        try {
            showLoading();
            
            const response = await api.login({ email, senha });
            
            this.currentUser = response.user;
            localStorage.setItem('userData', JSON.stringify(response.user));
            
            showNotification('Login realizado com sucesso!', 'success');
            this.showDashboard();
            
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const nome = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const senha = document.getElementById('register-password').value;

        // Validações
        if (!validateRequired(nome)) {
            showNotification('Nome é obrigatório', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showNotification('Email inválido', 'error');
            return;
        }

        if (!validatePassword(senha)) {
            showNotification('Senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            showLoading();
            
            const response = await api.register({ nome, email, senha });
            
            this.currentUser = response.user;
            localStorage.setItem('userData', JSON.stringify(response.user));
            
            showNotification('Conta criada com sucesso!', 'success');
            this.showDashboard();
            
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    handleLogout() {
        api.logout();
        this.currentUser = null;
        this.accounts = [];
        this.transactions = [];
        this.categories = [];
        
        showNotification('Logout realizado com sucesso!', 'info');
        this.showLogin();
    }

    // Métodos de dados
    async loadUserData() {
        try {
            const userData = localStorage.getItem('userData');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            } else {
                this.currentUser = await api.getUserProfile();
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            throw new Error('Erro ao carregar dados do usuário');
        }
    }

    async loadDashboardData() {
        try {
            showLoading();

            // Carregar dados em paralelo
            const [accounts, transactions, categories] = await Promise.all([
                api.getAccounts(),
                api.getTransactions({ limit: 10 }),
                api.getCategories()
            ]);

            this.accounts = accounts;
            this.transactions = transactions;
            this.categories = categories;

            this.updateDashboard();

        } catch (error) {
            showNotification('Erro ao carregar dados do dashboard', 'error');
            console.error('Erro:', error);
        } finally {
            hideLoading();
        }
    }

    updateDashboard() {
        // Atualizar nome do usuário
        document.getElementById('user-name').textContent = this.currentUser.nome;

        // Calcular totais
        const totalBalance = this.accounts.reduce((sum, account) => sum + parseFloat(account.saldo || 0), 0);
        
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const monthlyTransactions = this.transactions.filter(t => t.data.startsWith(thisMonth));
        
        const totalIncome = monthlyTransactions
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + parseFloat(t.valor), 0);
            
        const totalExpense = monthlyTransactions
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + parseFloat(t.valor), 0);

        // Atualizar cards
        document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        document.getElementById('total-expense').textContent = formatCurrency(totalExpense);

        // Atualizar lista de transações
        this.updateTransactionsList();
    }

    updateTransactionsList() {
        const container = document.getElementById('transactions-list');
        
        if (this.transactions.length === 0) {
            container.innerHTML = '<p class="no-data">Nenhuma transação encontrada</p>';
            return;
        }

        const transactionsHTML = this.transactions.map(transaction => {
            const typeIcon = transaction.tipo === 'receita' ? 'arrow-up' : 'arrow-down';
            const typeClass = transaction.tipo === 'receita' ? 'income' : 'expense';
            const sign = transaction.tipo === 'receita' ? '+' : '-';
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon ${typeClass}">
                            <i class="fas fa-${typeIcon}"></i>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-description">${transaction.descricao}</div>
                            <div class="transaction-meta">
                                ${transaction.categoria_nome || 'Sem categoria'} • ${formatDate(transaction.data)}
                            </div>
                        </div>
                    </div>
                    <div class="transaction-amount ${typeClass}">
                        ${sign}${formatCurrency(Math.abs(transaction.valor))}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = transactionsHTML;

        // Adicionar estilos para transações se não existirem
        if (!document.querySelector('#transaction-styles')) {
            const styles = document.createElement('style');
            styles.id = 'transaction-styles';
            styles.textContent = `
                .transaction-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 0;
                    border-bottom: 1px solid #e1e5e9;
                }
                
                .transaction-item:last-child {
                    border-bottom: none;
                }
                
                .transaction-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .transaction-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .transaction-icon.income {
                    background: #28a745;
                }
                
                .transaction-icon.expense {
                    background: #dc3545;
                }
                
                .transaction-description {
                    font-weight: 600;
                    color: #333;
                }
                
                .transaction-meta {
                    font-size: 0.9rem;
                    color: #666;
                }
                
                .transaction-amount {
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                
                .transaction-amount.income {
                    color: #28a745;
                }
                
                .transaction-amount.expense {
                    color: #dc3545;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Métodos de modal (placeholder - implementar depois)
    showAddTransactionModal(tipo) {
        showNotification(`Modal de ${tipo} será implementado em breve!`, 'info');
    }

    showAccountsModal() {
        showNotification('Modal de contas será implementado em breve!', 'info');
    }
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
});

// Tratamento de erros globais
window.addEventListener('unhandledrejection', (event) => {
    console.error('Erro não tratado:', event.reason);
    showNotification('Ocorreu um erro inesperado', 'error');
});