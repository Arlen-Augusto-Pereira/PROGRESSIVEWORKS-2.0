console.log('filters.js carregado');

class FilterManager {
    constructor() {
        this.activeFilters = {
            dateRange: 'all',
            category: 'all',
            emotion: 'all',
            minAmount: '',
            maxAmount: '',
            search: '',
            startDate: '',
            endDate: ''
        };
        
        this.categoryNames = {
            'alimentacao': '🍽️ Alimentação',
            'transporte': '🚗 Transporte',
            'lazer': '🎮 Lazer',
            'saude': '🏥 Saúde',
            'educacao': '📚 Educação',
            'roupas': '👕 Roupas',
            'casa': '🏠 Casa',
            'outros': '📦 Outros'
        };
        
        this.emotionNames = {
            'feliz': '😊 Feliz',
            'triste': '😢 Triste',
            'estressado': '😤 Estressado',
            'ansioso': '😰 Ansioso',
            'entediado': '😐 Entediado',
            'empolgado': '🤩 Empolgado',
            'calmo': '😌 Calmo',
            'irritado': '😠 Irritado'
        };
        
        console.log('FilterManager inicializando...');
        this.init();
    }

    init() {
        this.createFilterInterface();
        this.setupEventListeners();
        console.log('FilterManager inicializado');
    }

    createFilterInterface() {
        const dashboardTab = document.getElementById('dashboard');
        if (!dashboardTab) return;

        const summaryCards = dashboardTab.querySelector('.summary-cards');
        if (!summaryCards) return;

        const filtersHTML = `
            <div class="filters-container">
                <div class="filters-header" onclick="window.filterManager.toggleFilters()">
                    <h3>🔍 Filtros de Busca</h3>
                    <button class="filters-toggle">▼</button>
                </div>
                
                <div class="filters-content" id="filtersContent">
                    <!-- Filtros Rápidos -->
                    <div class="quick-filters">
                        <button class="quick-filter-btn active" data-period="all">📊 Todos</button>
                        <button class="quick-filter-btn" data-period="today">📅 Hoje</button>
                        <button class="quick-filter-btn" data-period="week">📆 Esta Semana</button>
                        <button class="quick-filter-btn" data-period="month">🗓️ Este Mês</button>
                        <button class="quick-filter-btn" data-period="year">📋 Este Ano</button>
                    </div>
                    
                    <!-- Grid de Filtros -->
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label for="searchFilter">🔍 Buscar Descrição</label>
                            <input type="text" id="searchFilter" class="filter-input" placeholder="Digite para buscar...">
                        </div>
                        
                        <div class="filter-group">
                            <label for="categoryFilter">📊 Categoria</label>
                            <select id="categoryFilter" class="filter-input">
                                <option value="all">Todas as categorias</option>
                                <option value="alimentacao">🍽️ Alimentação</option>
                                <option value="transporte">🚗 Transporte</option>
                                <option value="lazer">🎮 Lazer</option>
                                <option value="saude">🏥 Saúde</option>
                                <option value="educacao">📚 Educação</option>
                                <option value="roupas">👕 Roupas</option>
                                <option value="casa">🏠 Casa</option>
                                <option value="outros">📦 Outros</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="emotionFilter">😊 Emoção</label>
                            <select id="emotionFilter" class="filter-input">
                                <option value="all">Todas as emoções</option>
                                <option value="feliz">😊 Feliz</option>
                                <option value="triste">😢 Triste</option>
                                <option value="estressado">😤 Estressado</option>
                                <option value="ansioso">😰 Ansioso</option>
                                <option value="entediado">😐 Entediado</option>
                                <option value="empolgado">🤩 Empolgado</option>
                                <option value="calmo">😌 Calmo</option>
                                <option value="irritado">😠 Irritado</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="minAmount">💰 Valor Mínimo</label>
                            <input type="number" id="minAmount" class="filter-input" placeholder="R$ 0,00" min="0" step="0.01">
                        </div>
                        
                        <div class="filter-group">
                            <label for="maxAmount">💰 Valor Máximo</label>
                            <input type="number" id="maxAmount" class="filter-input" placeholder="R$ 999,99" min="0" step="0.01">
                        </div>
                        
                        <div class="filter-group">
                            <label for="startDate">📅 Data Inicial</label>
                            <input type="date" id="startDate" class="filter-input">
                        </div>
                        
                        <div class="filter-group">
                            <label for="endDate">📅 Data Final</label>
                            <input type="date" id="endDate" class="filter-input">
                        </div>
                    </div>
                    
                    <!-- Ações -->
                    <div class="filters-actions">
                        <button class="btn-filter btn-clear" onclick="window.filterManager.clearFilters()">🗑️ Limpar</button>
                        <button class="btn-filter btn-apply" onclick="window.filterManager.applyFilters()">✅ Aplicar</button>
                    </div>
                    
                    <!-- Filtros Ativos -->
                    <div class="active-filters" id="activeFilters"></div>
                </div>
                
                <!-- Resultados -->
                <div class="filter-results" id="filterResults" style="display: none;"></div>
            </div>
        `;

        summaryCards.insertAdjacentHTML('beforebegin', filtersHTML);
    }

    setupEventListeners() {
        // Filtros rápidos
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const period = e.target.dataset.period;
                this.applyQuickFilter(period);
            });
        });

        // Busca em tempo real
        const searchInput = document.getElementById('searchFilter');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.activeFilters.search = e.target.value;
                    this.applyFilters();
                }, 300);
            });
        }

        // Enter para aplicar filtros
        document.querySelectorAll('.filter-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        });
    }

    toggleFilters() {
        const content = document.getElementById('filtersContent');
        const toggle = document.querySelector('.filters-toggle');
        
        if (content.classList.contains('active')) {
            content.classList.remove('active');
            toggle.classList.remove('expanded');
        } else {
            content.classList.add('active');
            toggle.classList.add('expanded');
        }
    }

    applyQuickFilter(period) {
        const now = new Date();
        let startDate = '';
        let endDate = '';

        switch(period) {
            case 'today':
                startDate = endDate = now.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                startDate = weekStart.toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'all':
            default:
                startDate = endDate = '';
                break;
        }

        // Atualizar campos de data
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        if (startDateInput) startDateInput.value = startDate;
        if (endDateInput) endDateInput.value = endDate;

        this.activeFilters.startDate = startDate;
        this.activeFilters.endDate = endDate;
        this.activeFilters.dateRange = period;

        this.applyFilters();
    }

    applyFilters() {
        // Coletar valores dos filtros
        this.activeFilters.search = document.getElementById('searchFilter')?.value || '';
        this.activeFilters.category = document.getElementById('categoryFilter')?.value || 'all';
        this.activeFilters.emotion = document.getElementById('emotionFilter')?.value || 'all';
        this.activeFilters.minAmount = document.getElementById('minAmount')?.value || '';
        this.activeFilters.maxAmount = document.getElementById('maxAmount')?.value || '';
        this.activeFilters.startDate = document.getElementById('startDate')?.value || '';
        this.activeFilters.endDate = document.getElementById('endDate')?.value || '';

        // Filtrar gastos
        const allExpenses = window.expenseManager ? window.expenseManager.getExpenses() : [];
        const filteredExpenses = this.filterExpenses(allExpenses);

        // Atualizar interface
        this.updateActiveFiltersDisplay();
        this.updateFilterResults(filteredExpenses, allExpenses);
        this.updateDashboard(filteredExpenses);
    }

    filterExpenses(expenses) {
        return expenses.filter(expense => {
            // Filtro de busca
            if (this.activeFilters.search && 
                !expense.description.toLowerCase().includes(this.activeFilters.search.toLowerCase())) {
                return false;
            }

            // Filtro de categoria
            if (this.activeFilters.category !== 'all' && 
                expense.category !== this.activeFilters.category) {
                return false;
            }

            // Filtro de emoção
            if (this.activeFilters.emotion !== 'all' && 
                expense.emotion !== this.activeFilters.emotion) {
                return false;
            }

            // Filtro de valor mínimo
            if (this.activeFilters.minAmount && 
                expense.amount < parseFloat(this.activeFilters.minAmount)) {
                return false;
            }

            // Filtro de valor máximo
            if (this.activeFilters.maxAmount && 
                expense.amount > parseFloat(this.activeFilters.maxAmount)) {
                return false;
            }

            // Filtro de data inicial
            if (this.activeFilters.startDate && 
                expense.date < this.activeFilters.startDate) {
                return false;
            }

            // Filtro de data final
            if (this.activeFilters.endDate && 
                expense.date > this.activeFilters.endDate) {
                return false;
            }

            return true;
        });
    }

    updateActiveFiltersDisplay() {
        const container = document.getElementById('activeFilters');
        if (!container) return;

        container.innerHTML = '';

        // Adicionar tags dos filtros ativos
        if (this.activeFilters.search) {
            this.addFilterTag(container, 'Busca', this.activeFilters.search, 'search');
        }

        if (this.activeFilters.category !== 'all') {
            this.addFilterTag(container, 'Categoria', this.categoryNames[this.activeFilters.category], 'category');
        }

        if (this.activeFilters.emotion !== 'all') {
            this.addFilterTag(container, 'Emoção', this.emotionNames[this.activeFilters.emotion], 'emotion');
        }

        if (this.activeFilters.minAmount) {
            this.addFilterTag(container, 'Min', `R$ ${this.activeFilters.minAmount}`, 'minAmount');
        }

        if (this.activeFilters.maxAmount) {
            this.addFilterTag(container, 'Max', `R$ ${this.activeFilters.maxAmount}`, 'maxAmount');
        }

        if (this.activeFilters.startDate) {
            this.addFilterTag(container, 'De', this.formatDate(this.activeFilters.startDate), 'startDate');
        }

        if (this.activeFilters.endDate) {
            this.addFilterTag(container, 'Até', this.formatDate(this.activeFilters.endDate), 'endDate');
        }
    }

    addFilterTag(container, label, value, filterKey) {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
            <span>${label}: ${value}</span>
            <span class="remove" onclick="window.filterManager.removeFilter('${filterKey}')">×</span>
        `;
        container.appendChild(tag);
    }

    removeFilter(filterKey) {
        // Limpar filtro específico
        switch(filterKey) {
            case 'search':
                this.activeFilters.search = '';
                document.getElementById('searchFilter').value = '';
                break;
            case 'category':
                this.activeFilters.category = 'all';
                document.getElementById('categoryFilter').value = 'all';
                break;
            case 'emotion':
                this.activeFilters.emotion = 'all';
                document.getElementById('emotionFilter').value = 'all';
                break;
            case 'minAmount':
                this.activeFilters.minAmount = '';
                document.getElementById('minAmount').value = '';
                break;
            case 'maxAmount':
                this.activeFilters.maxAmount = '';
                document.getElementById('maxAmount').value = '';
                break;
            case 'startDate':
                this.activeFilters.startDate = '';
                document.getElementById('startDate').value = '';
                break;
            case 'endDate':
                this.activeFilters.endDate = '';
                document.getElementById('endDate').value = '';
                break;
        }

        this.applyFilters();
    }

    clearFilters() {
        // Resetar todos os filtros
        this.activeFilters = {
            dateRange: 'all',
            category: 'all',
            emotion: 'all',
            minAmount: '',
            maxAmount: '',
            search: '',
            startDate: '',
            endDate: ''
        };

        // Limpar campos
        document.getElementById('searchFilter').value = '';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('emotionFilter').value = 'all';
        document.getElementById('minAmount').value = '';
        document.getElementById('maxAmount').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';

        // Resetar filtros rápidos
        document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.quick-filter-btn[data-period="all"]').classList.add('active');

        this.applyFilters();
    }

    updateFilterResults(filteredExpenses, allExpenses) {
        const resultsDiv = document.getElementById('filterResults');
        if (!resultsDiv) return;

        if (filteredExpenses.length === allExpenses.length) {
            resultsDiv.style.display = 'none';
        } else {
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `
                📊 Mostrando <strong>${filteredExpenses.length}</strong> de <strong>${allExpenses.length}</strong> gastos
                ${filteredExpenses.length === 0 ? '❌ Nenhum resultado encontrado' : ''}
            `;
        }
    }

    updateDashboard(filteredExpenses) {
        // Atualizar cards de resumo
        if (window.app) {
            window.app.updateSummaryCards(filteredExpenses);
            window.app.updateRecentExpenses(filteredExpenses);
        }

        // Atualizar gráfico
        if (window.chartManager) {
            window.chartManager.updateCategoryChart(filteredExpenses);
        }
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando FilterManager...');
    window.filterManager = new FilterManager();
});