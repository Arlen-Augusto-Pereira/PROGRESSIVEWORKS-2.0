// src/js/unified-transactions.js
console.log('unified-transactions.js carregado');

class UnifiedTransactionManager {
    constructor() {
        this.transactions = [];
        this.isInitialized = false;
        console.log('UnifiedTransactionManager inicializando...');
    }

   async init() {
    if (this.isInitialized) return;
    
    console.log('Inicializando UnifiedTransactionManager...');
    
    // Aguardar inicialização do banco
    let dbAttempts = 0;
    while ((!window.dbManager || !window.dbManager.db) && dbAttempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        dbAttempts++;
    }
    
    if (!window.dbManager || !window.dbManager.db) {
        console.error('Banco de dados não disponível após timeout');
        return;
    }

    await this.loadTransactions();
    this.setupEventListeners();
    this.setCurrentDates();
    
    // Carregar contas nos selects com retry
    await this.loadAccountsInSelects();
    
    // Configurar observer para recarregar quando a aba de transações for ativada
    this.setupTabObserver();
    
    this.isInitialized = true;
    console.log('UnifiedTransactionManager inicializado com sucesso');
}

setupTabObserver() {
    // Observer para detectar quando a aba add-expense é ativada
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'add-expense' && target.classList.contains('active')) {
                    // Aba de adicionar transação foi ativada, recarregar contas
                    setTimeout(() => this.reloadAccountsInSelects(), 100);
                }
            }
        });
    });

    const addExpenseTab = document.getElementById('add-expense');
    if (addExpenseTab) {
        observer.observe(addExpenseTab, { attributes: true });
    }
}

    setupEventListeners() {
        // Seletores de tipo de transação
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTransactionType(e.target.dataset.type);
            });
        });

        // Formulários
        const expenseForm = document.getElementById('expenseForm');
        const incomeForm = document.getElementById('incomeForm');
        const transferForm = document.getElementById('transferForm');

        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        }
        if (incomeForm) {
            incomeForm.addEventListener('submit', (e) => this.handleIncomeSubmit(e));
        }
        if (transferForm) {
            transferForm.addEventListener('submit', (e) => this.handleTransferSubmit(e));
        }
    }

    switchTransactionType(type) {
        // Atualizar botões
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Atualizar formulários
        document.querySelectorAll('.transaction-form').forEach(form => {
            form.classList.remove('active');
        });

        switch(type) {
            case 'expense':
                document.getElementById('expenseForm').classList.add('active');
                break;
            case 'income':
                document.getElementById('incomeForm').classList.add('active');
                break;
            case 'transfer':
                document.getElementById('transferForm').classList.add('active');
                break;
        }
    }
async loadAccountsInSelects() {
    console.log('Carregando contas nos selects...');
    
    // Aguardar o accountManager estar pronto
    let attempts = 0;
    while ((!window.unifiedAccountManager || !window.unifiedAccountManager.isInitialized) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.unifiedAccountManager) {
        console.error('AccountManager não disponível');
        return;
    }

    try {
        const accounts = window.unifiedAccountManager.getAccounts();
        console.log('Contas encontradas:', accounts.length);
        
        const selects = [
            'expenseAccount', 'incomeAccount', 
            'fromAccount', 'toAccount'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) {
                console.warn(`Select ${selectId} não encontrado`);
                return;
            }

            // Limpar opções existentes (exceto a primeira)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            // Adicionar contas
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.icon} ${account.name}`;
                select.appendChild(option);
            });
            
            console.log(`Select ${selectId} populado com ${accounts.length} contas`);
        });
        
        // Forçar atualização visual
        this.refreshSelectsVisually();
        
    } catch (error) {
        console.error('Erro ao carregar contas nos selects:', error);
    }
}

refreshSelectsVisually() {
    // Força uma atualização visual dos selects
    const selects = document.querySelectorAll('select[id$="Account"]');
    selects.forEach(select => {
        select.style.display = 'none';
        select.offsetHeight; // Trigger reflow
        select.style.display = '';
    });
}

// Método para recarregar contas quando necessário
async reloadAccountsInSelects() {
    console.log('Recarregando contas nos selects...');
    await this.loadAccountsInSelects();
}
    
    setCurrentDates() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = ['date', 'incomeDate', 'transferDate'];
        
        dateInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) input.value = today;
        });
    }

    async handleExpenseSubmit(e) {
        e.preventDefault();
        
        const formData = {
            type: 'expense',
            accountId: document.getElementById('expenseAccount').value,
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            emotion: document.getElementById('emotion').value,
            date: document.getElementById('date').value
        };

        if (await this.addTransaction(formData)) {
            this.clearForm('expenseForm');
            this.showSuccess('Despesa registrada com sucesso!');
        }
    }

    async handleIncomeSubmit(e) {
        e.preventDefault();
        
        const formData = {
            type: 'income',
            accountId: document.getElementById('incomeAccount').value,
            amount: parseFloat(document.getElementById('incomeAmount').value),
            description: document.getElementById('incomeDescription').value,
            category: document.getElementById('incomeCategory').value,
            emotion: document.getElementById('incomeEmotion').value,
            date: document.getElementById('incomeDate').value
        };

        if (await this.addTransaction(formData)) {
            this.clearForm('incomeForm');
            this.showSuccess('Receita registrada com sucesso!');
        }
    }

    async handleTransferSubmit(e) {
        e.preventDefault();
        
        const fromAccount = document.getElementById('fromAccount').value;
        const toAccount = document.getElementById('toAccount').value;
        
        if (fromAccount === toAccount) {
            alert('As contas de origem e destino devem ser diferentes!');
            return;
        }

        const formData = {
            type: 'transfer',
            accountId: fromAccount,
            targetAccountId: toAccount,
            amount: parseFloat(document.getElementById('transferAmount').value),
            description: document.getElementById('transferDescription').value,
            date: document.getElementById('transferDate').value
        };

        if (await this.addTransaction(formData)) {
            this.clearForm('transferForm');
            this.showSuccess('Transferência realizada com sucesso!');
        }
    }

    async addTransaction(data) {
        try {
            // Validações básicas
            if (!data.accountId || !data.amount || !data.description) {
                alert('Por favor, preencha todos os campos obrigatórios');
                return false;
            }

            if (data.amount <= 0) {
                alert('O valor deve ser maior que zero');
                return false;
            }

            // Validar saldo para despesas e transferências
            if (data.type === 'expense' || data.type === 'transfer') {
                const account = await window.unifiedAccountManager.getAccount(data.accountId);
                if (!account) {
                    alert('Conta não encontrada');
                    return false;
                }

                // Para cartão de crédito, permitir saldo negativo até um limite
                if (account.type === 'credit_card') {
                    const creditLimit = account.creditLimit || 1000; // Limite padrão
                    if (Math.abs(account.balance - data.amount) > creditLimit) {
                        alert('Limite do cartão de crédito excedido');
                        return false;
                    }
                } else {
                    // Para outras contas, não permitir saldo negativo
                    if (account.balance < data.amount) {
                        alert('Saldo insuficiente na conta selecionada');
                        return false;
                    }
                }
            }

            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                alert('Usuário não autenticado');
                return false;
            }

            const transaction = {
                id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: currentUser.username,
                ...data,
                createdAt: new Date().toISOString()
            };

            // Executar transação atômica
            await window.dbManager.executeTransaction(async (dbTransaction) => {
                // Salvar transação
                const transactionStore = dbTransaction.objectStore('transactions');
                transactionStore.add(transaction);

                // Atualizar saldos das contas
                const accountStore = dbTransaction.objectStore('accounts');

                if (data.type === 'expense') {
                    const account = await this.getAccountFromStore(accountStore, data.accountId);
                    account.balance -= data.amount;
                    accountStore.put(account);
                } else if (data.type === 'income') {
                    const account = await this.getAccountFromStore(accountStore, data.accountId);
                    account.balance += data.amount;
                    accountStore.put(account);
                } else if (data.type === 'transfer') {
                    const fromAccount = await this.getAccountFromStore(accountStore, data.accountId);
                    const toAccount = await this.getAccountFromStore(accountStore, data.targetAccountId);
                    
                    fromAccount.balance -= data.amount;
                    toAccount.balance += data.amount;
                    
                    accountStore.put(fromAccount);
                    accountStore.put(toAccount);
                }
            });

            // Atualizar cache local
            this.transactions.push(transaction);
            
            // Atualizar interface
            if (window.unifiedAccountManager) {
                await window.unifiedAccountManager.loadAccounts();
            }
            if (window.app) {
                window.app.loadDashboard();
            }

            return true;
        } catch (error) {
            console.error('Erro ao adicionar transação:', error);
            alert('Erro ao registrar transação. Tente novamente.');
            return false;
        }
    }

    async getAccountFromStore(store, accountId) {
        return new Promise((resolve, reject) => {
            const request = store.get(accountId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async loadTransactions() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser || !window.dbManager) return;

            this.transactions = await window.dbManager.getAllByIndex('transactions', 'userId', currentUser.username);
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
            this.transactions = [];
        }
    }

    getTransactions() {
        return this.transactions;
    }

    // Métodos para compatibilidade com ExpenseManager
    getExpenses() {
        return this.transactions.filter(t => t.type === 'expense');
    }

    getExpensesByCategory() {
        const expenses = this.getExpenses();
        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        return categoryTotals;
    }

    getExpensesByEmotion() {
        const expenses = this.getExpenses();
        const emotionTotals = {};
        expenses.forEach(expense => {
            emotionTotals[expense.emotion] = (emotionTotals[expense.emotion] || 0) + expense.amount;
        });
        return emotionTotals;
    }

    getMonthlyExpenses() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.getExpenses().filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            this.setCurrentDates();
        }
    }

    showSuccess(message) {
        // Implementação melhorada com toast
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        // Criar toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// CSS para animações do toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando UnifiedTransactionManager...');
    window.unifiedTransactionManager = new UnifiedTransactionManager();
    
    // Aguardar inicialização do banco antes de inicializar
    const waitForDb = () => {
        if (window.dbManager && window.dbManager.db) {
            window.unifiedTransactionManager.init();
        } else {
            setTimeout(waitForDb, 100);
        }
    };
    waitForDb();
});