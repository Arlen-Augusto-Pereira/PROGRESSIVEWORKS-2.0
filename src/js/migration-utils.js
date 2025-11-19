// src/js/migration-utils.js
console.log('migration-utils.js carregado');

class MigrationUtils {
    static async checkAndMigrate() {
        console.log('Verificando necessidade de migração...');
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) return;

        try {
            // Verificar se já foi migrado
            const migrationFlag = localStorage.getItem(`migrated_${currentUser.username}`);
            if (migrationFlag === 'true') {
                console.log('Dados já migrados anteriormente');
                return;
            }

            // Verificar se há dados antigos para migrar
            const hasOldExpenses = localStorage.getItem(`expenses_${currentUser.username}`);
            const hasOldAccounts = localStorage.getItem(`accounts_${currentUser.username}`);
            const hasOldTransactions = localStorage.getItem(`transactions_${currentUser.username}`);

            if (hasOldExpenses || hasOldAccounts || hasOldTransactions) {
                console.log('Dados antigos encontrados, iniciando migração...');
                await this.performMigration(currentUser.username);
                
                // Marcar como migrado
                localStorage.setItem(`migrated_${currentUser.username}`, 'true');
                console.log('Migração concluída com sucesso');
            }
        } catch (error) {
            console.error('Erro durante migração:', error);
        }
    }

    static async performMigration(username) {
        if (!window.dbManager || !window.dbManager.db) {
            console.log('Aguardando inicialização do banco...');
            setTimeout(() => this.performMigration(username), 500);
            return;
        }

        try {
            // Migrar contas
            await this.migrateAccounts(username);
            
            // Migrar transações antigas (expenses)
            await this.migrateExpenses(username);
            
            // Migrar transações
            await this.migrateTransactions(username);
            
            // Recalcular saldos
            if (window.unifiedAccountManager) {
                await window.unifiedAccountManager.syncAccountBalances();
            }
            
            console.log('Todos os dados migrados com sucesso');
        } catch (error) {
            console.error('Erro na migração:', error);
            throw error;
        }
    }

    static async migrateAccounts(username) {
        const accountsKey = `accounts_${username}`;
        const storedAccounts = localStorage.getItem(accountsKey);
        
        if (!storedAccounts) return;

        try {
            const accounts = JSON.parse(storedAccounts);
            console.log(`Migrando ${accounts.length} contas...`);
            
            for (const account of accounts) {
                account.userId = username;
                account.createdAt = account.createdAt || new Date().toISOString();
                account.updatedAt = new Date().toISOString();
                
                // Garantir que cartões de crédito tenham limite
                if (account.type === 'credit_card' && !account.creditLimit) {
                    account.creditLimit = 1000.00;
                }
                
                await window.dbManager.put('accounts', account);
            }
            
            console.log('Contas migradas com sucesso');
        } catch (error) {
            console.error('Erro ao migrar contas:', error);
        }
    }

    static async migrateExpenses(username) {
        const expensesKey = `expenses_${username}`;
        const storedExpenses = localStorage.getItem(expensesKey);
        
        if (!storedExpenses) return;

        try {
            const expenses = JSON.parse(storedExpenses);
            console.log(`Migrando ${expenses.length} despesas antigas...`);
            
            for (const expense of expenses) {
                const transaction = {
                    id: `migrated_expense_${expense.id}`,
                    userId: username,
                    accountId: 'conta_corrente', // Conta padrão para migração
                    type: 'expense',
                    amount: expense.amount,
                    description: expense.description,
                    category: expense.category,
                    emotion: expense.emotion,
                    date: expense.date,
                    createdAt: expense.createdAt || new Date().toISOString()
                };
                
                await window.dbManager.put('transactions', transaction);
            }
            
            console.log('Despesas migradas como transações');
        } catch (error) {
            console.error('Erro ao migrar despesas:', error);
        }
    }

    static async migrateTransactions(username) {
        const transactionsKey = `transactions_${username}`;
        const storedTransactions = localStorage.getItem(transactionsKey);
        
        if (!storedTransactions) return;

        try {
            const transactions = JSON.parse(storedTransactions);
            console.log(`Migrando ${transactions.length} transações...`);
            
            for (const transaction of transactions) {
                transaction.userId = username;
                
                // Garantir que todas as transações tenham os campos necessários
                if (!transaction.createdAt) {
                    transaction.createdAt = new Date().toISOString();
                }
                
                // Corrigir campo de conta se necessário
                if (transaction.account && !transaction.accountId) {
                    transaction.accountId = transaction.account;
                    delete transaction.account;
                }
                
                // Corrigir campo de conta de destino se necessário
                if (transaction.targetAccount && !transaction.targetAccountId) {
                    transaction.targetAccountId = transaction.targetAccount;
                    delete transaction.targetAccount;
                }
                
                await window.dbManager.put('transactions', transaction);
            }
            
            console.log('Transações migradas com sucesso');
        } catch (error) {
            console.error('Erro ao migrar transações:', error);
        }
    }

    static async cleanupOldData(username) {
        if (!confirm('Deseja limpar os dados antigos do localStorage? (Recomendado após migração bem-sucedida)')) {
            return;
        }

        try {
            // Remover dados antigos
            localStorage.removeItem(`expenses_${username}`);
            localStorage.removeItem(`accounts_${username}`);
            localStorage.removeItem(`transactions_${username}`);
            
            console.log('Dados antigos removidos do localStorage');
            alert('Limpeza concluída! O app agora usa apenas o novo sistema de banco de dados.');
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
        }
    }

    static async exportAllData() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                alert('Usuário não autenticado');
                return;
            }

            console.log('Exportando todos os dados...');

            // Buscar todos os dados
            const accounts = await window.dbManager.getAllByIndex('accounts', 'userId', currentUser.username);
            const transactions = await window.dbManager.getAllByIndex('transactions', 'userId', currentUser.username);

            const exportData = {
                user: currentUser,
                accounts: accounts,
                transactions: transactions,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };

            // Criar arquivo para download
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `mindspend-backup-${currentUser.username}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            console.log('Exportação concluída');
        } catch (error) {
            console.error('Erro na exportação:', error);
            alert('Erro ao exportar dados');
        }
    }

    static async validateDataIntegrity() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) return { valid: false, issues: ['Usuário não autenticado'] };

            console.log('Validando integridade dos dados...');

            const issues = [];

            // Validar contas
            if (window.unifiedAccountManager) {
                const accountValidation = await window.unifiedAccountManager.validateDataIntegrity();
                if (!accountValidation.valid) {
                    issues.push(...accountValidation.issues);
                }
            }

            // Validar transações
            const transactions = await window.dbManager.getAllByIndex('transactions', 'userId', currentUser.username);
            const accounts = await window.dbManager.getAllByIndex('accounts', 'userId', currentUser.username);
            const accountIds = accounts.map(a => a.id);

            transactions.forEach(transaction => {
                if (!accountIds.includes(transaction.accountId)) {
                    issues.push(`Transação ${transaction.id} referencia conta inexistente: ${transaction.accountId}`);
                }
                
                if (transaction.type === 'transfer' && transaction.targetAccountId && !accountIds.includes(transaction.targetAccountId)) {
                    issues.push(`Transferência ${transaction.id} referencia conta de destino inexistente: ${transaction.targetAccountId}`);
                }
            });

            const result = {
                valid: issues.length === 0,
                issues: issues,
                summary: {
                    totalAccounts: accounts.length,
                    totalTransactions: transactions.length,
                    issuesFound: issues.length
                }
            };

            console.log('Validação concluída:', result);
            return result;
        } catch (error) {
            console.error('Erro na validação:', error);
            return { valid: false, issues: ['Erro durante validação'] };
        }
    }
}

// Auto-executar migração quando necessário
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar inicialização completa
    setTimeout(() => {
        MigrationUtils.checkAndMigrate();
    }, 1000);
});

// Expor utilitários globalmente para debug
window.MigrationUtils = MigrationUtils;