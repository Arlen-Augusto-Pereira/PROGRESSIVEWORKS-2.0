// MindSpend App - Arquivo Principal
console.log('app.js carregado');

class MindSpendApp {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'dashboard';
        console.log('MindSpendApp inicializando...');
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupNavigation();
        this.setCurrentDate();
        console.log('MindSpendApp inicializado');
    }

    checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                this.showApp();
            } catch (e) {
                console.error('Erro ao carregar usuário:', e);
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const registerScreen = document.getElementById('registerScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (loginScreen) loginScreen.classList.add('active');
        if (registerScreen) registerScreen.classList.remove('active');
        if (appScreen) appScreen.classList.remove('active');
    }

    showRegister() {
        const loginScreen = document.getElementById('loginScreen');
        const registerScreen = document.getElementById('registerScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (loginScreen) loginScreen.classList.remove('active');
        if (registerScreen) registerScreen.classList.add('active');
        if (appScreen) appScreen.classList.remove('active');
    }

    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        const registerScreen = document.getElementById('registerScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (loginScreen) loginScreen.classList.remove('active');
        if (registerScreen) registerScreen.classList.remove('active');
        if (appScreen) appScreen.classList.add('active');
        
        this.updateUserGreeting();
        this.loadDashboard();
    }

    setupEventListeners() {
        // Navigation between login/register
        const showRegisterBtn = document.getElementById('showRegister');
        const showLoginBtn = document.getElementById('showLogin');
        const logoutBtn = document.getElementById('logoutBtn');

        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegister();
            });
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLogin();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });
    }

    // Adicionar ao método switchTab() existente
// Adicionar ao método switchTab() existente
switchTab(tabName) {
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Update content tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(tabName);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    this.currentTab = tabName;

    // Load specific tab content
    switch(tabName) {
        case 'dashboard':
            this.loadDashboard();
            break;
        case 'add-expense':
            // Garantir que as contas estejam carregadas nos selects
            if (window.unifiedTransactionManager) {
                setTimeout(() => {
                    window.unifiedTransactionManager.reloadAccountsInSelects();
                }, 100);
            }
            break;
        case 'accounts':  // NOVA ABA
            if (window.accountManagerUI) {
                window.accountManagerUI.loadAccountsPage();
            }
            break;
        case 'insights':
            if (window.insightsManager) {
                window.insightsManager.generateInsights();
            }
            break;
        case 'profile':
            this.loadProfile();
            break;
    }
}
    updateUserGreeting() {
        const greeting = document.getElementById('userGreeting');
        if (greeting && this.currentUser) {
            const hour = new Date().getHours();
            let timeGreeting = '';
            
            if (hour < 12) {
                timeGreeting = 'Bom dia';
            } else if (hour < 18) {
                timeGreeting = 'Boa tarde';
            } else {
                timeGreeting = 'Boa noite';
            }
            
            greeting.textContent = `${timeGreeting}, ${this.currentUser.username}!`;
        }
    }

 async loadDashboard() {
    // Aguardar inicialização dos managers
    if (!window.unifiedTransactionManager || !window.unifiedAccountManager) {
        setTimeout(() => this.loadDashboard(), 100);
        return;
    }

    await this.updateSummaryCards();
    await this.updateRecentExpenses();
    
    if (window.chartManager) {
        const expenses = window.unifiedTransactionManager.getExpenses();
        window.chartManager.updateCategoryChart(expenses);
    }
    
    await this.loadAccounts();
}

// Substituir o método getExpenses() existente:
getExpenses() {
    return window.unifiedTransactionManager ? window.unifiedTransactionManager.getExpenses() : [];
}

// Substituir o método updateSummaryCards() existente:
async updateSummaryCards(expenses = null) {
    // Se não foram passados gastos específicos, usar os do mês atual
    let expensesToUse;
    if (expenses === null) {
        const allExpenses = window.unifiedTransactionManager ? window.unifiedTransactionManager.getExpenses() : [];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        expensesToUse = allExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
    } else {
        expensesToUse = expenses;
    }

    // Monthly total
    const monthlyTotal = expensesToUse.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    if (monthlyTotalEl) {
        monthlyTotalEl.textContent = `R$ ${monthlyTotal.toFixed(2).replace('.', ',')}`;
    }

    // Top category
    const categoryTotals = {};
    expensesToUse.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    let topCategory = 'Nenhuma';
    if (Object.keys(categoryTotals).length > 0) {
        topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b);
    }
    
    const topCategoryEl = document.getElementById('topCategory');
    if (topCategoryEl) {
        topCategoryEl.textContent = topCategory !== 'Nenhuma' ? this.getCategoryName(topCategory) : 'Nenhuma';
    }

    // Top emotion
    const emotionCounts = {};
    expensesToUse.forEach(expense => {
        emotionCounts[expense.emotion] = (emotionCounts[expense.emotion] || 0) + 1;
    });
    
    let topEmotion = 'Nenhuma';
    if (Object.keys(emotionCounts).length > 0) {
        topEmotion = Object.keys(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b);
    }
    
    const topEmotionEl = document.getElementById('topEmotion');
    if (topEmotionEl) {
        topEmotionEl.textContent = topEmotion !== 'Nenhuma' ? this.getEmotionName(topEmotion) : 'Nenhuma';
    }
}

// Substituir o método updateRecentExpenses() existente:
async updateRecentExpenses(expenses = null) {
    // Se não foram passados gastos específicos, usar todos
    const expensesToUse = expenses || (window.unifiedTransactionManager ? window.unifiedTransactionManager.getExpenses() : []);
    
    const recentExpenses = expensesToUse
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const container = document.getElementById('recentExpensesList');
    if (!container) return;

    container.innerHTML = '';

    if (recentExpenses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum gasto encontrado com os filtros aplicados.</p>';
        return;
    }

    recentExpenses.forEach(expense => {
        const expenseElement = document.createElement('div');
        expenseElement.className = 'expense-item';
        expenseElement.innerHTML = `
            <div class="expense-info">
                <h4>${expense.description}</h4>
                <p>${this.getCategoryName(expense.category)} • ${this.getEmotionName(expense.emotion)} • ${this.formatDate(expense.date)}</p>
            </div>
            <div class="expense-amount">R$ ${expense.amount.toFixed(2).replace('.', ',')}</div>
        `;
        container.appendChild(expenseElement);
    });
}

// Substituir o método loadAccounts() existente:
async loadAccounts() {
    if (!window.unifiedAccountManager) return;

    const accounts = window.unifiedAccountManager.getAccounts();
    const accountsGrid = document.getElementById('accountsGrid');
    
    if (!accountsGrid) return;

    accountsGrid.innerHTML = '';

    accounts.forEach(account => {
        const accountCard = document.createElement('div');
        accountCard.className = 'account-card';
        accountCard.style.setProperty('--account-color', account.color);
        accountCard.style.setProperty('--account-color-dark', this.darkenColor(account.color, 20));
        
        accountCard.innerHTML = `
            <div class="account-header">
                <span class="account-icon">${account.icon}</span>
                <span class="account-name">${account.name}</span>
            </div>
            <div class="account-balance">R$ ${account.balance.toFixed(2).replace('.', ',')}</div>
        `;
        
        accountsGrid.appendChild(accountCard);
    });

    // Atualizar resumo
    const summary = window.unifiedAccountManager.getAccountSummary();
    
    const totalBalanceEl = document.getElementById('totalBalance');
    const creditDebtEl = document.getElementById('creditDebt');
    
    if (totalBalanceEl) {
        totalBalanceEl.textContent = `R$ ${summary.totalBalance.toFixed(2).replace('.', ',')}`;
    }
    if (creditDebtEl) {
        creditDebtEl.textContent = `R$ ${summary.creditDebt.toFixed(2).replace('.', ',')}`;
    }
}

// Substituir o método clearData() existente:
async clearData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) return;

            // Limpar transações
            const transactions = await window.dbManager.getAllByIndex('transactions', 'userId', currentUser.username);
            for (const transaction of transactions) {
                await window.dbManager.delete('transactions', transaction.id);
            }

            // Resetar saldos das contas
            if (window.unifiedAccountManager) {
                const accounts = window.unifiedAccountManager.getAccounts();
                for (const account of accounts) {
                    account.balance = 0;
                    await window.unifiedAccountManager.saveAccount(account);
                }
            }

            // Recarregar dados
            if (window.unifiedTransactionManager) {
                await window.unifiedTransactionManager.loadTransactions();
            }
            if (window.unifiedAccountManager) {
                await window.unifiedAccountManager.loadAccounts();
            }

            this.loadDashboard();
            alert('Dados limpos com sucesso!');
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            alert('Erro ao limpar dados. Tente novamente.');
        }
    }
}

  getExpenses() {
        return window.expenseManager ? window.expenseManager.getExpenses() : [];
    }
    updateSummaryCards(expenses = null) {
    // Se não foram passados gastos específicos, usar os do mês atual
    let expensesToUse;
    if (expenses === null) {
        const allExpenses = window.expenseManager ? window.expenseManager.getExpenses() : [];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        expensesToUse = allExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
    } else {
        expensesToUse = expenses;
    }

    // Monthly total
    const monthlyTotal = expensesToUse.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    if (monthlyTotalEl) {
        monthlyTotalEl.textContent = `R$ ${monthlyTotal.toFixed(2).replace('.', ',')}`;
    }

    // Top category
    const categoryTotals = {};
    expensesToUse.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    let topCategory = 'Nenhuma';
    if (Object.keys(categoryTotals).length > 0) {
        topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b);
    }
    
    const topCategoryEl = document.getElementById('topCategory');
    if (topCategoryEl) {
        topCategoryEl.textContent = topCategory !== 'Nenhuma' ? this.getCategoryName(topCategory) : 'Nenhuma';
    }

    // Top emotion
    const emotionCounts = {};
    expensesToUse.forEach(expense => {
        emotionCounts[expense.emotion] = (emotionCounts[expense.emotion] || 0) + 1;
    });
    
    let topEmotion = 'Nenhuma';
    if (Object.keys(emotionCounts).length > 0) {
        topEmotion = Object.keys(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b);
    }
    
    const topEmotionEl = document.getElementById('topEmotion');
    if (topEmotionEl) {
        topEmotionEl.textContent = topEmotion !== 'Nenhuma' ? this.getEmotionName(topEmotion) : 'Nenhuma';
    }
}

updateRecentExpenses(expenses = null) {
    // Se não foram passados gastos específicos, usar todos
    const expensesToUse = expenses || (window.expenseManager ? window.expenseManager.getExpenses() : []);
    
    const recentExpenses = expensesToUse
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const container = document.getElementById('recentExpensesList');
    if (!container) return;

    container.innerHTML = '';

    if (recentExpenses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum gasto encontrado com os filtros aplicados.</p>';
        return;
    }

    recentExpenses.forEach(expense => {
        const expenseElement = document.createElement('div');
        expenseElement.className = 'expense-item';
        expenseElement.innerHTML = `
            <div class="expense-info">
                <h4>${expense.description}</h4>
                <p>${this.getCategoryName(expense.category)} • ${this.getEmotionName(expense.emotion)} • ${this.formatDate(expense.date)}</p>
            </div>
            <div class="expense-amount">R$ ${expense.amount.toFixed(2).replace('.', ',')}</div>
        `;
        container.appendChild(expenseElement);
    });
}

    loadProfile() {
        if (!this.currentUser) return;

        const profileUsername = document.getElementById('profileUsername');
        if (profileUsername) {
            profileUsername.textContent = this.currentUser.username;
        }
        
        const expenses = window.expenseManager ? window.expenseManager.getExpenses() : [];
        const totalExpensesEl = document.getElementById('totalExpenses');
        if (totalExpensesEl) {
            totalExpensesEl.textContent = expenses.length;
        }
        
        const memberSince = new Date(this.currentUser.createdAt);
        const memberSinceEl = document.getElementById('memberSince');
        if (memberSinceEl) {
            memberSinceEl.textContent = this.formatDate(memberSince.toISOString().split('T')[0]);
        }

        // Setup profile actions
        const exportBtn = document.getElementById('exportData');
        const clearBtn = document.getElementById('clearData');
        
        if (exportBtn) {
            exportBtn.onclick = () => this.exportData();
        }
        if (clearBtn) {
            clearBtn.onclick = () => this.clearData();
        }
    }
    loadAccounts() {
        if (!window.accountManager) return;

        const accounts = window.accountManager.getAccounts();
        const accountsGrid = document.getElementById('accountsGrid');
        
        if (!accountsGrid) return;

        accountsGrid.innerHTML = '';

        accounts.forEach(account => {
            const accountCard = document.createElement('div');
            accountCard.className = 'account-card';
            accountCard.style.setProperty('--account-color', account.color);
            accountCard.style.setProperty('--account-color-dark', this.darkenColor(account.color, 20));
            
            accountCard.innerHTML = `
                <div class="account-header">
                    <span class="account-icon">${account.icon}</span>
                    <span class="account-name">${account.name}</span>
                </div>
                <div class="account-balance">R\$ ${account.balance.toFixed(2).replace('.', ',')}</div>
            `;
            
            accountsGrid.appendChild(accountCard);
        });

        // Atualizar resumo
        const totalBalance = window.accountManager.getTotalBalance();
        const creditDebt = window.accountManager.getCreditCardDebt();
        
        document.getElementById('totalBalance').textContent = `R\$ ${totalBalance.toFixed(2).replace('.', ',')}`;
        document.getElementById('creditDebt').textContent = `R\$ ${creditDebt.toFixed(2).replace('.', ',')}`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    exportData() {
        const expenses = window.expenseManager ? window.expenseManager.getExpenses() : [];
        const dataStr = JSON.stringify(expenses, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'mindspend-expenses.json';
        link.click();
    }

    clearData() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            if (this.currentUser) {
                localStorage.removeItem(`expenses_${this.currentUser.username}`);
                if (window.expenseManager) {
                    window.expenseManager.expenses = [];
                }
                this.loadDashboard();
                alert('Dados limpos com sucesso!');
            }
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.showLogin();
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    getCategoryName(category) {
        const categories = {
            'alimentacao': '🍽️ Alimentação',
            'transporte': '🚗 Transporte',
            'lazer': '🎮 Lazer',
            'saude': '🏥 Saúde',
            'educacao': '📚 Educação',
            'roupas': '👕 Roupas',
            'casa': '🏠 Casa',
            'outros': '📦 Outros'
        };
        return categories[category] || category;
    }

    getEmotionName(emotion) {
        const emotions = {
            'feliz': '😊 Feliz',
            'triste': '😢 Triste',
            'estressado': '😤 Estressado',
            'ansioso': '😰 Ansioso',
            'entediado': '😐 Entediado',
            'empolgado': '🤩 Empolgado',
            'calmo': '😌 Calmo',
            'irritado': '😠 Irritado'
        };
        return emotions[emotion] || emotion;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            return dateString;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando app...');
    window.app = new MindSpendApp();
});