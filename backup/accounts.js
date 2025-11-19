console.log('accounts.js carregado');

class AccountManager {
    constructor() {
        this.accounts = [];
        this.defaultAccounts = [
            {
                id: 'conta_corrente',
                name: 'Conta Corrente',
                type: 'checking',
                icon: '🏦',
                balance: 0.00,
                color: '#2196F3',
                isActive: true
            },
            {
                id: 'poupanca',
                name: 'Poupança',
                type: 'savings',
                icon: '💰',
                balance: 0.00,
                color: '#4CAF50',
                isActive: true
            },
            {
                id: 'dinheiro',
                name: 'Dinheiro',
                type: 'cash',
                icon: '💵',
                balance: 0.00,
                color: '#FF9800',
                isActive: true
            },
            {
                id: 'cartao_credito',
                name: 'Cartão de Crédito',
                type: 'credit_card',
                icon: '💳',
                balance: 0.00,
                color: '#F44336',
                isActive: true
            }
        ];
        
        console.log('AccountManager inicializando...');
        this.init();
    }

    init() {
        this.loadAccounts();
        console.log('AccountManager inicializado');
    }

    loadAccounts() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        const storageKey = `accounts_${currentUser.username}`;
        const storedAccounts = localStorage.getItem(storageKey);

        if (storedAccounts) {
            try {
                this.accounts = JSON.parse(storedAccounts);
            } catch (e) {
                console.error('Erro ao carregar contas:', e);
                this.accounts = [...this.defaultAccounts];
                this.saveAccounts();
            }
        } else {
            // Primeira vez - criar contas padrão
            this.accounts = [...this.defaultAccounts];
            this.saveAccounts();
        }
    }

    saveAccounts() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        const storageKey = `accounts_${currentUser.username}`;
        localStorage.setItem(storageKey, JSON.stringify(this.accounts));
    }

    getAccounts() {
        return this.accounts.filter(account => account.isActive);
    }

    getAccount(accountId) {
        return this.accounts.find(account => account.id === accountId);
    }

    updateAccountBalance(accountId, amount, operation = 'add') {
        const account = this.getAccount(accountId);
        if (!account) return false;

        if (operation === 'add') {
            account.balance += amount;
        } else if (operation === 'subtract') {
            account.balance -= amount;
        } else if (operation === 'set') {
            account.balance = amount;
        }

        this.saveAccounts();
        return true;
    }

    getTotalBalance() {
        return this.accounts
            .filter(account => account.isActive && account.type !== 'credit_card')
            .reduce((total, account) => total + account.balance, 0);
    }

    getCreditCardDebt() {
        return this.accounts
            .filter(account => account.isActive && account.type === 'credit_card')
            .reduce((total, account) => total + Math.abs(account.balance), 0);
    }

    addAccount(accountData) {
        const newAccount = {
            id: `account_${Date.now()}`,
            name: accountData.name,
            type: accountData.type,
            icon: accountData.icon || '💼',
            balance: accountData.balance || 0,
            color: accountData.color || '#2196F3',
            isActive: true
        };

        this.accounts.push(newAccount);
        this.saveAccounts();
        return newAccount;
    }

    removeAccount(accountId) {
        const accountIndex = this.accounts.findIndex(account => account.id === accountId);
        if (accountIndex > -1) {
            this.accounts[accountIndex].isActive = false;
            this.saveAccounts();
            return true;
        }
        return false;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando AccountManager...');
    window.accountManager = new AccountManager();
});