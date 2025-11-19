// src/js/account-manager-ui.js
console.log('account-manager-ui.js carregado');

class AccountManagerUI {
    constructor() {
        this.isInitialized = false;
        this.currentEditingAccount = null;
        console.log('AccountManagerUI inicializando...');
    }

    async init() {
        if (this.isInitialized) return;
        
        // Aguardar inicialização do unifiedAccountManager
        let attempts = 0;
        while ((!window.unifiedAccountManager || !window.unifiedAccountManager.isInitialized) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.unifiedAccountManager) {
            console.error('UnifiedAccountManager não disponível');
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('AccountManagerUI inicializado');
    }

    setupEventListeners() {
        // Botão para adicionar nova conta
        const addAccountBtn = document.getElementById('addAccountBtn');
        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', () => this.openAddAccountModal());
        }

        // Formulário de conta
        const accountForm = document.getElementById('accountForm');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => this.handleAccountSubmit(e));
        }

        // Botões de fechar modal
        const closeButtons = document.querySelectorAll('.modal-close, #cancelAccountBtn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Clique fora do modal para fechar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Seletor de tipo de conta
        const accountType = document.getElementById('accountType');
        if (accountType) {
            accountType.addEventListener('change', () => this.handleAccountTypeChange());
        }

        // Seletores de ícone
        const iconOptions = document.querySelectorAll('.icon-option');
        iconOptions.forEach(option => {
            option.addEventListener('click', (e) => this.selectIcon(e.target.dataset.icon));
        });

        // Seletores de cor
        const colorPresets = document.querySelectorAll('.color-preset');
        colorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });

        // Modal de confirmação
        const confirmCancel = document.getElementById('confirmCancel');
        const confirmAction = document.getElementById('confirmAction');
        const closeConfirmModal = document.getElementById('closeConfirmModal');

        if (confirmCancel) confirmCancel.addEventListener('click', () => this.closeConfirmModal());
        if (closeConfirmModal) closeConfirmModal.addEventListener('click', () => this.closeConfirmModal());
        if (confirmAction) confirmAction.addEventListener('click', () => this.executeConfirmedAction());
    }

    async loadAccountsPage() {
        console.log('Carregando página de contas...');
        
        if (!window.unifiedAccountManager) {
            console.error('UnifiedAccountManager não disponível');
            return;
        }

        await this.updateAccountsSummary();
        await this.loadAccountsList();
    }

    async updateAccountsSummary() {
        const summary = window.unifiedAccountManager.getAccountSummary();
        
        const totalBalanceEl = document.getElementById('summaryTotalBalance');
        const creditDebtEl = document.getElementById('summaryCreditDebt');
        const accountCountEl = document.getElementById('summaryAccountCount');

        if (totalBalanceEl) {
            totalBalanceEl.textContent = `R$ ${summary.totalBalance.toFixed(2).replace('.', ',')}`;
            totalBalanceEl.className = `amount ${summary.totalBalance >= 0 ? 'positive' : 'negative'}`;
        }

        if (creditDebtEl) {
            creditDebtEl.textContent = `R$ ${summary.creditDebt.toFixed(2).replace('.', ',')}`;
        }

        if (accountCountEl) {
            accountCountEl.textContent = summary.totalAccounts.toString();
        }
    }

    async loadAccountsList() {
        const accounts = window.unifiedAccountManager.accounts; // Incluir inativas também
        const accountsList = document.getElementById('accountsList');
        
        if (!accountsList) return;

        accountsList.innerHTML = '';

        if (accounts.length === 0) {
            accountsList.innerHTML = `
                <div class="empty-state">
                    <p>Nenhuma conta encontrada.</p>
                    <button class="btn-primary" onclick="window.accountManagerUI.openAddAccountModal()">
                        ➕ Criar Primeira Conta
                    </button>
                </div>
            `;
            return;
        }

        accounts.forEach(account => {
            const accountItem = this.createAccountItem(account);
            accountsList.appendChild(accountItem);
        });
    }

    createAccountItem(account) {
        const accountItem = document.createElement('div');
        accountItem.className = `account-item ${!account.isActive ? 'inactive' : ''}`;
        accountItem.style.setProperty('--account-color', account.color);

        const accountTypeName = this.getAccountTypeName(account.type);
        const isCredit = account.type === 'credit_card';
        const balanceClass = isCredit ? 
            (account.balance <= 0 ? 'positive' : 'negative') : 
            (account.balance >= 0 ? 'positive' : 'negative');

        accountItem.innerHTML = `
            <div class="account-item-header">
                <div class="account-info">
                    <div class="account-icon">${account.icon}</div>
                    <div class="account-details">
                        <h4>${account.name}</h4>
                        <span class="account-type">${accountTypeName}</span>
                    </div>
                </div>
                <div class="account-actions">
                    <button class="btn-icon edit" onclick="window.accountManagerUI.editAccount('${account.id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon toggle ${!account.isActive ? 'inactive' : ''}" 
                            onclick="window.accountManagerUI.toggleAccount('${account.id}')" 
                            title="${account.isActive ? 'Desativar' : 'Ativar'}">
                        ${account.isActive ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>
            </div>
            <div class="account-item-body">
                <div class="account-balance">
                    <label>${isCredit ? 'Saldo Atual' : 'Saldo'}</label>
                    <div class="balance-value ${balanceClass}">
                        R$ ${Math.abs(account.balance).toFixed(2).replace('.', ',')}
                        ${isCredit && account.balance < 0 ? ' (devendo)' : ''}
                    </div>
                </div>
                ${isCredit ? `
                    <div class="account-limit">
                        <label>Limite Disponível</label>
                        <div class="limit-value">
                            R$ ${(account.creditLimit - Math.abs(Math.min(0, account.balance))).toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                ` : `
                    <div class="account-limit">
                        <label>Status</label>
                        <div class="limit-value">
                            ${account.isActive ? '✅ Ativa' : '⏸️ Inativa'}
                        </div>
                    </div>
                `}
            </div>
        `;

        return accountItem;
    }

    getAccountTypeName(type) {
        const types = {
            'checking': '🏦 Conta Corrente',
            'savings': '💰 Poupança',
            'cash': '💵 Dinheiro',
            'credit_card': '💳 Cartão de Crédito',
            'investment': '📈 Investimentos',
            'other': '📦 Outros'
        };
        return types[type] || '📦 Outros';
    }

    openAddAccountModal() {
        this.currentEditingAccount = null;
        this.resetAccountForm();
        
        const modal = document.getElementById('accountModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modalTitle) modalTitle.textContent = 'Nova Conta';
        if (modal) modal.classList.add('active');
    }

    async editAccount(accountId) {
        const account = await window.unifiedAccountManager.getAccount(accountId);
        if (!account) {
            alert('Conta não encontrada');
            return;
        }

        this.currentEditingAccount = account;
        this.populateAccountForm(account);
        
        const modal = document.getElementById('accountModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modalTitle) modalTitle.textContent = 'Editar Conta';
        if (modal) modal.classList.add('active');
    }

    populateAccountForm(account) {
        document.getElementById('accountId').value = account.id;
        document.getElementById('accountName').value = account.name;
        document.getElementById('accountType').value = account.type;
        document.getElementById('accountIcon').value = account.icon;
        document.getElementById('accountColor').value = account.color;
        document.getElementById('initialBalance').value = account.balance.toFixed(2);
        
        if (account.creditLimit) {
            document.getElementById('creditLimit').value = account.creditLimit.toFixed(2);
        }

        // Atualizar seletores visuais
        this.selectIcon(account.icon);
        this.selectColor(account.color);
        this.handleAccountTypeChange();
    }

    resetAccountForm() {
        document.getElementById('accountForm').reset();
        document.getElementById('accountId').value = '';
        document.getElementById('accountColor').value = '#2196F3';
        document.getElementById('initialBalance').value = '0.00';
        
        // Reset visual selectors
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.classList.remove('selected');
        });
        
        this.handleAccountTypeChange();
    }

    selectIcon(icon) {
        document.getElementById('accountIcon').value = icon;
        
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-icon="${icon}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    selectColor(color) {
        document.getElementById('accountColor').value = color;
        
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.classList.remove('selected');
        });
        
        const selectedPreset = document.querySelector(`[data-color="${color}"]`);
        if (selectedPreset) {
            selectedPreset.classList.add('selected');
        }
    }

    handleAccountTypeChange() {
        const accountType = document.getElementById('accountType').value;
        const creditLimitSection = document.getElementById('creditLimitSection');
        
        if (creditLimitSection) {
            if (accountType === 'credit_card') {
                creditLimitSection.style.display = 'block';
                document.getElementById('creditLimit').required = true;
            } else {
                creditLimitSection.style.display = 'none';
                document.getElementById('creditLimit').required = false;
            }
        }
    }

    async handleAccountSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('accountName').value.trim(),
            type: document.getElementById('accountType').value,
            icon: document.getElementById('accountIcon').value || '🏦',
            color: document.getElementById('accountColor').value,
            balance: parseFloat(document.getElementById('initialBalance').value) || 0,
            creditLimit: null
        };

        // Validações
        if (!formData.name) {
            alert('Por favor, insira um nome para a conta');
            return;
        }

        if (!formData.type) {
            alert('Por favor, selecione um tipo de conta');
            return;
        }

        if (formData.type === 'credit_card') {
            const creditLimit = parseFloat(document.getElementById('creditLimit').value);
            if (!creditLimit || creditLimit <= 0) {
                alert('Por favor, insira um limite válido para o cartão de crédito');
                return;
            }
            formData.creditLimit = creditLimit;
        }

        try {
            let success = false;
            
            if (this.currentEditingAccount) {
                // Editar conta existente
                const updatedAccount = {
                    ...this.currentEditingAccount,
                    ...formData
                };
                success = await window.unifiedAccountManager.saveAccount(updatedAccount);
            } else {
                // Criar nova conta
                const newAccount = await window.unifiedAccountManager.addAccount(formData);
                success = newAccount !== null;
            }

            if (success) {
                this.closeModals();
                await this.loadAccountsPage();
                
                // Atualizar selects em outras telas
                if (window.unifiedTransactionManager) {
                    await window.unifiedTransactionManager.loadAccountsInSelects();
                }
                
                // Atualizar dashboard
                if (window.app) {
                    window.app.loadDashboard();
                }
                
                this.showToast(
                    this.currentEditingAccount ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!',
                    'success'
                );
            } else {
                alert('Erro ao salvar conta. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao salvar conta:', error);
            alert('Erro ao salvar conta. Tente novamente.');
        }
    }

    async toggleAccount(accountId) {
        const account = await window.unifiedAccountManager.getAccount(accountId);
        if (!account) {
            alert('Conta não encontrada');
            return;
        }

        const action = account.isActive ? 'desativar' : 'ativar';
        const message = `Tem certeza que deseja ${action} a conta "${account.name}"?`;
        
        if (account.isActive) {
            // Verificar se há transações recentes
            const transactions = window.unifiedTransactionManager ? 
                window.unifiedTransactionManager.getTransactions().filter(t => t.accountId === accountId) : [];
            
            if (transactions.length > 0) {
                const recentTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return transactionDate >= thirtyDaysAgo;
                });
                
                if (recentTransactions.length > 0) {
                    message += `\n\nAtenção: Esta conta possui ${recentTransactions.length} transação(ões) nos últimos 30 dias.`;
                }
            }
        }

        this.showConfirmModal(message, async () => {
            account.isActive = !account.isActive;
            const success = await window.unifiedAccountManager.saveAccount(account);
            
            if (success) {
                await this.loadAccountsPage();
                
                // Atualizar selects em outras telas
                if (window.unifiedTransactionManager) {
                    await window.unifiedTransactionManager.loadAccountsInSelects();
                }
                
                this.showToast(
                    `Conta ${account.isActive ? 'ativada' : 'desativada'} com sucesso!`,
                    'success'
                );
            } else {
                alert('Erro ao atualizar conta. Tente novamente.');
            }
        });
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmAction');
        
        if (messageEl) messageEl.textContent = message;
        if (modal) modal.classList.add('active');
        
        // Remover listeners anteriores e adicionar novo
        if (confirmBtn) {
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            newBtn.addEventListener('click', () => {
                this.closeConfirmModal();
                onConfirm();
            });
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('active'));
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.remove('active');
    }

    executeConfirmedAction() {
        // Este método será sobrescrito pelo showConfirmModal
        this.closeConfirmModal();
    }

    showToast(message, type = 'info') {
        // Reutilizar o sistema de toast do unified-transactions
        if (window.unifiedTransactionManager && window.unifiedTransactionManager.showToast) {
            window.unifiedTransactionManager.showToast(message, type);
        } else {
            // Fallback simples
            alert(message);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando AccountManagerUI...');
    window.accountManagerUI = new AccountManagerUI();
    
    // Aguardar inicialização do unifiedAccountManager
    const waitForAccountManager = () => {
        if (window.unifiedAccountManager && window.unifiedAccountManager.isInitialized) {
            window.accountManagerUI.init();
        } else {
            setTimeout(waitForAccountManager, 100);
        }
    };
    waitForAccountManager();
});