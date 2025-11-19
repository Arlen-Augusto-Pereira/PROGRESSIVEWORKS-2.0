console.log('expenses.js carregado');

let ExpenseManager = class {
    constructor() {
        this.expenses = [];
        console.log('ExpenseManager inicializando...');
        this.init();
    }

    init() {
        this.loadExpenses();
        this.setupEventListeners();
        console.log('ExpenseManager inicializado');
    }

    setupEventListeners() {
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addExpense();
            });
        }
    }

    loadExpenses() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            const userExpenses = localStorage.getItem(`expenses_${currentUser.username}`);
            this.expenses = userExpenses ? JSON.parse(userExpenses) : [];
        }
    }

    saveExpenses() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            localStorage.setItem(`expenses_${currentUser.username}`, JSON.stringify(this.expenses));
        }
    }

    addExpense() {
        const amountEl = document.getElementById('amount');
        const descriptionEl = document.getElementById('description');
        const categoryEl = document.getElementById('category');
        const emotionEl = document.getElementById('emotion');
        const dateEl = document.getElementById('date');

        if (!amountEl || !descriptionEl || !categoryEl || !emotionEl || !dateEl) {
            alert('Erro: campos do formulário não encontrados');
            return;
        }

        const amount = parseFloat(amountEl.value);
        const description = descriptionEl.value;
        const category = categoryEl.value;
        const emotion = emotionEl.value;
        const date = dateEl.value;

        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, insira um valor válido');
            return;
        }

        if (!description.trim()) {
            alert('Por favor, insira uma descrição');
            return;
        }

        if (!category) {
            alert('Por favor, selecione uma categoria');
            return;
        }

        if (!emotion) {
            alert('Por favor, selecione uma emoção');
            return;
        }

        if (!date) {
            alert('Por favor, selecione uma data');
            return;
        }

        const expense = {
            id: Date.now(),
            amount,
            description: description.trim(),
            category,
            emotion,
            date,
            createdAt: new Date().toISOString()
        };

        this.expenses.push(expense);
        this.saveExpenses();

        // Reset form
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.reset();
        }
        
        // Set current date again
        if (dateEl) {
            dateEl.value = new Date().toISOString().split('T')[0];
        }

        // Update dashboard
        if (window.app) {
            window.app.loadDashboard();
        }

        // Show success message
        alert('Gasto registrado com sucesso!');

        // Switch to dashboard
        if (window.app) {
            window.app.switchTab('dashboard');
        }
    }

    getExpenses() {
        return this.expenses;
    }

    getExpensesByCategory() {
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        return categoryTotals;
    }

    getExpensesByEmotion() {
        const emotionTotals = {};
        this.expenses.forEach(expense => {
            emotionTotals[expense.emotion] = (emotionTotals[expense.emotion] || 0) + expense.amount;
        });
        return emotionTotals;
    }

    getMonthlyExpenses() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
    }

    deleteExpense(expenseId) {
        this.expenses = this.expenses.filter(expense => expense.id !== expenseId);
        this.saveExpenses();
        
        if (window.app) {
            window.app.loadDashboard();
        }
    }

    getTotalExpenses() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    getExpensesByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= start && expenseDate <= end;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando ExpenseManager...');
    window.expenseManager = new ExpenseManager();
});