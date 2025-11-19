console.log('transactions.js carregado');

class TransactionManager {
    constructor() {
        this.transactions = [];
        console.log('TransactionManager inicializando...');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTransactions();
        this.loadAccountsInSelects();
        this.setCurrentDates();
        console.log('TransactionManager inicializado');
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

    loadAccountsInSelects() {
        if (!window.accountManager) return;

        const accounts = window.accountManager.getAccounts();
        const selects = [
            'expenseAccount', 'incomeAccount', 
            'fromAccount', 'toAccount'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

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
        });
    }

    setCurrentDates() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = ['date', 'incomeDate', 'transferDate'];
        
        dateInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) input.value = today;
        });
    }

    handleExpenseSubmit(e) {
        e.preventDefault();
        
        const formData = {
            type: 'expense',
            account: document.getElementById('expenseAccount').value,
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            emotion: document.getElementById('emotion').value,
            date: document.getElementById('date').value
        };

        if (this.addTransaction(formData)) {
            this.clearForm('expenseForm');
            this.showSuccess('Despesa registrada com sucesso!');
        }
    }

    handleIncomeSubmit(e) {
        e.preventDefault();
        
        const formData = {
            type: 'income',
            account: document.getElementById('incomeAccount').value,
            amount: parseFloat(document.getElementById('incomeAmount').value),
            description: document.getElementById('incomeDescription').value,
            category: document.getElementById('incomeCategory').value,
            emotion: document.getElementById('incomeEmotion').value,
            date: document.getElementById('incomeDate').value
        };

        if (this.addTransaction(formData)) {
            this.clearForm('incomeForm');
            this.showSuccess('Receita registrada com sucesso!');
        }
    }

    handleTransferSubmit(e) {
        e.preventDefault();
        
        const fromAccount = document.getElementById('fromAccount').value;
        const toAccount = document.getElementById('toAccount').value;
        
        if (fromAccount === toAccount) {
            alert('As contas de origem e destino devem ser diferentes!');
            return;
        }

        const formData = {
            type: 'transfer',
            account: fromAccount,
            targetAccount: toAccount,
            amount: parseFloat(document.getElementById('transferAmount').value),
            description: document.getElementById('transferDescription').value,
            date: document.getElementById('transferDate').value
        };

        if (this.addTransaction(formData)) {
            this.clearForm('transferForm');
            this.showSuccess('Transferência realizada com sucesso!');
        }
    }

    addTransaction(data) {
        try {
            const transaction = {
                id: `transaction_${Date.now()}`,
                ...data,
                createdAt: new Date().toISOString(),
                userId: JSON.parse(localStorage.getItem('currentUser'))?.username
            };

            // Atualizar saldos das contas
            if (data.type === 'expense') {
                window.accountManager.updateAccountBalance(data.account, data.amount, 'subtract');
            } else if (data.type === 'income') {
                window.accountManager.updateAccountBalance(data.account, data.amount, 'add');
            } else if (data.type === 'transfer') {
                window.accountManager.updateAccountBalance(data.account, data.amount, 'subtract');
                window.accountManager.updateAccountBalance(data.targetAccount, data.amount, 'add');
            }

            this.transactions.push(transaction);
            this.saveTransactions();
            
            // Atualizar interface
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

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            this.setCurrentDates();
        }
    }

    showSuccess(message) {
        // Implementação simples - pode ser melhorada com toast/modal
        alert(message);
    }

    loadTransactions() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        const storageKey = `transactions_${currentUser.username}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            try {
                this.transactions = JSON.parse(stored);
            } catch (e) {
                console.error('Erro ao carregar transações:', e);
                this.transactions = [];
            }
        }
    }

    saveTransactions() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        const storageKey = `transactions_${currentUser.username}`;
        localStorage.setItem(storageKey, JSON.stringify(this.transactions));
    }

    getTransactions() {
        return this.transactions;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando TransactionManager...');
    window.transactionManager = new TransactionManager();
});