// src/js/database.js
console.log('database.js carregado');

class DatabaseManager {
    constructor() {
        this.dbName = 'MindSpendDB';
        this.dbVersion = 1;
        this.db = null;
        console.log('DatabaseManager inicializando...');
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Erro ao abrir banco de dados:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Banco de dados aberto com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Criando/atualizando estrutura do banco...');

                // Store para usuários
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'username' });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // Store para contas
                if (!db.objectStoreNames.contains('accounts')) {
                    const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
                    accountStore.createIndex('userId', 'userId', { unique: false });
                    accountStore.createIndex('type', 'type', { unique: false });
                }

                // Store para transações
                if (!db.objectStoreNames.contains('transactions')) {
                    const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
                    transactionStore.createIndex('userId', 'userId', { unique: false });
                    transactionStore.createIndex('accountId', 'accountId', { unique: false });
                    transactionStore.createIndex('type', 'type', { unique: false });
                    transactionStore.createIndex('date', 'date', { unique: false });
                    transactionStore.createIndex('category', 'category', { unique: false });
                    transactionStore.createIndex('emotion', 'emotion', { unique: false });
                }

                console.log('Estrutura do banco criada');
            };
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async executeTransaction(operations) {
        const transaction = this.db.transaction(['accounts', 'transactions'], 'readwrite');
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(new Error('Transação cancelada'));

            try {
                operations(transaction);
            } catch (error) {
                transaction.abort();
                reject(error);
            }
        });
    }

    // Migração de dados do localStorage
    async migrateFromLocalStorage() {
        console.log('Iniciando migração do localStorage...');
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) return;

        try {
            // Migrar contas
            const accountsKey = `accounts_${currentUser.username}`;
            const storedAccounts = localStorage.getItem(accountsKey);
            if (storedAccounts) {
                const accounts = JSON.parse(storedAccounts);
                for (const account of accounts) {
                    account.userId = currentUser.username;
                    await this.put('accounts', account);
                }
                console.log('Contas migradas com sucesso');
            }

            // Migrar transações antigas (expenses)
            const expensesKey = `expenses_${currentUser.username}`;
            const storedExpenses = localStorage.getItem(expensesKey);
            if (storedExpenses) {
                const expenses = JSON.parse(storedExpenses);
                for (const expense of expenses) {
                    const transaction = {
                        id: `migrated_expense_${expense.id}`,
                        userId: currentUser.username,
                        accountId: 'conta_corrente', // Conta padrão para migração
                        type: 'expense',
                        amount: expense.amount,
                        description: expense.description,
                        category: expense.category,
                        emotion: expense.emotion,
                        date: expense.date,
                        createdAt: expense.createdAt || new Date().toISOString()
                    };
                    await this.put('transactions', transaction);
                }
                console.log('Despesas migradas como transações');
            }

            // Migrar transações
            const transactionsKey = `transactions_${currentUser.username}`;
            const storedTransactions = localStorage.getItem(transactionsKey);
            if (storedTransactions) {
                const transactions = JSON.parse(storedTransactions);
                for (const transaction of transactions) {
                    transaction.userId = currentUser.username;
                    await this.put('transactions', transaction);
                }
                console.log('Transações migradas com sucesso');
            }

            console.log('Migração concluída com sucesso');
        } catch (error) {
            console.error('Erro na migração:', error);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando DatabaseManager...');
    window.dbManager = new DatabaseManager();
    try {
        await window.dbManager.init();
        await window.dbManager.migrateFromLocalStorage();
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        // Fallback para localStorage se IndexedDB falhar
        console.log('Usando localStorage como fallback');
    }
});