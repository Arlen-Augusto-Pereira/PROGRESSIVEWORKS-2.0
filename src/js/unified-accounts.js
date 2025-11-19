// src/js/unified-accounts.js
console.log('unified-accounts.js carregado');

class UnifiedAccountManager {
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
                isActive: true,
                creditLimit: null
            },
            {
                id: 'poupanca',
                name: 'Poupança',
                type: 'savings',
                icon: '💰',
                balance: 0.00,
                color: '#4CAF50',
                isActive: true,
                creditLimit: null
            },
            {
                id: 'dinheiro',
                name: 'Dinheiro',
                type: 'cash',
                icon: '💵',
                balance: 0.00,
                color: '#FF9800',
                isActive: true,
                creditLimit: null
            },
            {
                id: 'cartao_credito',
                name: 'Cartão de Crédito',
                type: 'credit_card',
                icon: '💳',
                balance: 0.00,
                color: '#F44336',
                isActive: true,
                creditLimit: 1000.00
            }
        ];
        
        this.isInitialized = false;
        console.log('UnifiedAccountManager inicializando...');
    }

    async init() {
        if (this.isInitialized) return;
        
        // Aguardar inicialização do banco
        if (!window.dbManager || !window.dbManager.db) {
            setTimeout(() => this.init(), 100);
            return;
        }

        await this.loadAccounts();
        this.isInitialized = true;
        console.log('UnifiedAccountManager inicializado');
    }

    async loadAccounts() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser || !window.dbManager) return;

            // Buscar contas do usuário no banco
            const userAccounts = await window.dbManager.getAllByIndex('accounts', 'userId', currentUser.username);
            
            if (userAccounts.length === 0) {
                // Primeira vez - criar contas padrão
                await this.createDefaultAccounts(currentUser.username);
            } else {
                this.accounts = userAccounts;
            }
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            // Fallback para contas padrão
            this.accounts = [...this.defaultAccounts];
        }
    }

    async createDefaultAccounts(userId) {
        try {
            this.accounts = [];
            
            for (const defaultAccount of this.defaultAccounts) {
                const account = {
                    ...defaultAccount,
                    userId: userId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await window.dbManager.add('accounts', account);
                this.accounts.push(account);
            }
            
            console.log('Contas padrão criadas com sucesso');
        } catch (error) {
            console.error('Erro ao criar contas padrão:', error);
        }
    }

    async saveAccount(account) {
        try {
            account.updatedAt = new Date().toISOString();
            await window.dbManager.put('accounts', account);
            
            // Atualizar cache local
            const index = this.accounts.findIndex(a => a.id === account.id);
            if (index >= 0) {
                this.accounts[index] = account;
            } else {
                this.accounts.push(account);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar conta:', error);
            return false;
        }
    }

    getAccounts() {
        return this.accounts.filter(account => account.isActive);
    }

    async getAccount(accountId) {
        // Primeiro tentar do cache
        let account = this.accounts.find(account => account.id === accountId);
        
        // Se não encontrar no cache, buscar no banco
        if (!account && window.dbManager) {
            try {
                account = await window.dbManager.get('accounts', accountId);
                if (account) {
                    // Adicionar ao cache
                    this.accounts.push(account);
                }
            } catch (error) {
                console.error('Erro ao buscar conta no banco:', error);
            }
        }
        
        return account;
    }

    async updateAccountBalance(accountId, amount, operation = 'add') {
        try {
            const account = await this.getAccount(accountId);
            if (!account) {
                console.error('Conta não encontrada:', accountId);
                return false;
            }

            const oldBalance = account.balance;

            if (operation === 'add') {
                account.balance += amount;
            } else if (operation === 'subtract') {
                account.balance -= amount;
            } else if (operation === 'set') {
                account.balance = amount;
            }

            // Validações específicas por tipo de conta
            if (account.type === 'credit_card') {
                // Para cartão de crédito, verificar limite
                if (Math.abs(account.balance) > account.creditLimit) {
                    console.warn('Limite do cartão excedido');
                    account.balance = oldBalance; // Reverter
                    return false;
                }
            } else {
                // Para outras contas, não permitir saldo muito negativo (tolerância pequena para arredondamentos)
                if (account.balance < -0.01) {
                    console.warn('Saldo insuficiente');
                    account.balance = oldBalance; // Reverter
                    return false;
                }
            }

            await this.saveAccount(account);
            return true;
        } catch (error) {
            console.error('Erro ao atualizar saldo da conta:', error);
            return false;
        }
    }

    getTotalBalance() {
        return this.accounts
            .filter(account => account.isActive && account.type !== 'credit_card')
            .reduce((total, account) => total + account.balance, 0);
    }

    getCreditCardDebt() {
        return this.accounts
            .filter(account => account.isActive && account.type === 'credit_card')
            .reduce((total, account) => total + Math.abs(Math.min(0, account.balance)), 0);
    }

    getCreditCardAvailable() {
        return this.accounts
            .filter(account => account.isActive && account.type === 'credit_card')
            .reduce((total, account) => total + (account.creditLimit - Math.abs(Math.min(0, account.balance))), 0);
    }

    async addAccount(accountData) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) return null;

            const newAccount = {
                id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: currentUser.username,
                name: accountData.name,
                type: accountData.type,
                icon: accountData.icon || '💼',
                balance: accountData.balance || 0,
                color: accountData.color || '#2196F3',
                creditLimit: accountData.creditLimit || null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await window.dbManager.add('accounts', newAccount);
            this.accounts.push(newAccount);
            
            return newAccount;
        } catch (error) {
            console.error('Erro ao adicionar conta:', error);
            return null;
        }
    }

    async removeAccount(accountId) {
        try {
            // Verificar se há transações associadas
            if (window.unifiedTransactionManager) {
                const transactions = await window.dbManager.getAllByIndex('transactions', 'accountId', accountId);
                if (transactions.length > 0) {
                    throw new Error('Não é possível remover conta com transações associadas');
                }
            }

            const account = await this.getAccount(accountId);
            if (account) {
                account.isActive = false;
                await this.saveAccount(account);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao remover conta:', error);
            return false;
        }
    }

    // Métodos para relatórios e análises
    getAccountsByType() {
        const accountsByType = {};
        this.getAccounts().forEach(account => {
            if (!accountsByType[account.type]) {
                accountsByType[account.type] = [];
            }
            accountsByType[account.type].push(account);
        });
        return accountsByType;
    }

    getAccountSummary() {
        const accounts = this.getAccounts();
        const summary = {
            totalAccounts: accounts.length,
            totalBalance: this.getTotalBalance(),
            creditDebt: this.getCreditCardDebt(),
            creditAvailable: this.getCreditCardAvailable(),
            accountsByType: this.getAccountsByType()
        };

        return summary;
    }

    // Método para sincronizar saldos (útil para correções)
    async syncAccountBalances() {
        try {
            if (!window.unifiedTransactionManager) return;

            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) return;

            console.log('Sincronizando saldos das contas...');

            // Resetar todos os saldos
            for (const account of this.accounts) {
                if (account.type === 'credit_card') {
                    account.balance = 0; // Cartão começa zerado
                } else {
                    account.balance = 0; // Outras contas começam zeradas
                }
            }

            // Recalcular com base nas transações
            const allTransactions = await window.dbManager.getAllByIndex('transactions', 'userId', currentUser.username);
            
            for (const transaction of allTransactions) {
                const account = this.accounts.find(a => a.id === transaction.accountId);
                if (!account) continue;

                if (transaction.type === 'expense') {
                    account.balance -= transaction.amount;
                } else if (transaction.type === 'income') {
                    account.balance += transaction.amount;
                } else if (transaction.type === 'transfer') {
                    // Para transferências, a conta de origem já foi processada
                    // Processar conta de destino se for diferente
                    if (transaction.targetAccountId) {
                        const targetAccount = this.accounts.find(a => a.id === transaction.targetAccountId);
                        if (targetAccount) {
                            targetAccount.balance += transaction.amount;
                        }
                    }
                }
            }

            // Salvar todas as contas atualizadas
            for (const account of this.accounts) {
                await this.saveAccount(account);
            }

            console.log('Sincronização de saldos concluída');
            return true;
        } catch (error) {
            console.error('Erro na sincronização de saldos:', error);
            return false;
        }
    }

    // Método para exportar dados das contas
    exportAccountsData() {
        const data = {
            accounts: this.getAccounts(),
            summary: this.getAccountSummary(),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mindspend-accounts-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Método para validar integridade dos dados
    async validateDataIntegrity() {
        const issues = [];

        try {
            // Verificar se todas as contas têm IDs únicos
            const ids = this.accounts.map(a => a.id);
            const uniqueIds = [...new Set(ids)];
            if (ids.length !== uniqueIds.length) {
                issues.push('Contas com IDs duplicados encontradas');
            }

            // Verificar se todas as contas têm userId
            const accountsWithoutUser = this.accounts.filter(a => !a.userId);
            if (accountsWithoutUser.length > 0) {
                issues.push(`${accountsWithoutUser.length} contas sem userId`);
            }

            // Verificar limites de cartão de crédito
            const creditCards = this.accounts.filter(a => a.type === 'credit_card');
            creditCards.forEach(card => {
                if (!card.creditLimit || card.creditLimit <= 0) {
                    issues.push(`Cartão ${card.name} sem limite definido`);
                }
                if (Math.abs(card.balance) > card.creditLimit) {
                    issues.push(`Cartão ${card.name} com limite excedido`);
                }
            });

            console.log('Validação de integridade concluída:', issues.length === 0 ? 'Sem problemas' : `${issues.length} problemas encontrados`);
            return { valid: issues.length === 0, issues };
        } catch (error) {
            console.error('Erro na validação de integridade:', error);
            return { valid: false, issues: ['Erro durante a validação'] };
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando UnifiedAccountManager...');
    window.unifiedAccountManager = new UnifiedAccountManager();
    
    // Aguardar inicialização do banco antes de inicializar
    const waitForDb = () => {
        if (window.dbManager && window.dbManager.db) {
            window.unifiedAccountManager.init();
        } else {
            setTimeout(waitForDb, 100);
        }
    };
    waitForDb();
});