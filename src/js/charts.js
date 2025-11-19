console.log('charts.js carregado');

class ChartManager {
    constructor() {
        this.currentChartType = 'pie';
        this.colors = [
            '#2196F3', '#FFC107', '#4CAF50', '#F44336', 
            '#9C27B0', '#FF9800', '#00BCD4', '#795548'
        ];
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
        console.log('ChartManager inicializando...');
        this.init();
    }

    init() {
        this.setupChartControls();
        console.log('ChartManager inicializado');
    }

    setupChartControls() {
        // Adicionar controles se não existirem
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer && !chartContainer.querySelector('.chart-controls')) {
            const controlsHTML = `
                <div class="chart-controls">
                    <button class="chart-btn active" data-type="pie">📊 Pizza</button>
                    <button class="chart-btn" data-type="bar">�� Barras</button>
                    <button class="chart-btn" data-type="doughnut">🍩 Rosca</button>
                </div>
            `;
            chartContainer.insertAdjacentHTML('afterbegin', controlsHTML);
            
            // Event listeners para os botões
            chartContainer.querySelectorAll('.chart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Atualizar botão ativo
                    chartContainer.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Mudar tipo de gráfico
                    this.currentChartType = e.target.dataset.type;
                    
                    // Redesenhar gráfico
                    const expenses = window.expenseManager ? window.expenseManager.getExpenses() : [];
                    this.updateCategoryChart(expenses);
                });
            });
        }
    }

    updateCategoryChart(expenses) {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) {
            console.log('Canvas não encontrado');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (expenses.length === 0) {
            this.drawEmptyState(ctx, canvas);
            return;
        }

        // Calcular totais por categoria
        const categoryTotals = this.calculateCategoryTotals(expenses);
        
        if (Object.keys(categoryTotals).length === 0) {
            this.drawEmptyState(ctx, canvas);
            return;
        }

        // Desenhar gráfico baseado no tipo selecionado
        switch(this.currentChartType) {
            case 'pie':
                this.drawPieChart(ctx, canvas, categoryTotals);
                break;
            case 'bar':
                this.drawBarChart(ctx, canvas, categoryTotals);
                break;
            case 'doughnut':
                this.drawDoughnutChart(ctx, canvas, categoryTotals);
                break;
        }

        // Atualizar legenda e estatísticas
        this.updateChartLegend(categoryTotals);
        this.updateChartStats(categoryTotals, expenses);
    }

    calculateCategoryTotals(expenses) {
        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        return categoryTotals;
    }

    drawEmptyState(ctx, canvas) {
        ctx.fillStyle = '#666';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📊', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Nenhum gasto registrado', canvas.width / 2, canvas.height / 2 + 10);
    }

    drawPieChart(ctx, canvas, categoryTotals) {
        const categories = Object.keys(categoryTotals);
        const values = Object.values(categoryTotals);
        const total = values.reduce((sum, value) => sum + value, 0);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;

        let currentAngle = -Math.PI / 2; // Começar do topo

        categories.forEach((category, index) => {
            const sliceAngle = (values[index] / total) * 2 * Math.PI;
            
            // Desenhar fatia
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            // Cor da fatia
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            
            // Borda da fatia
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Desenhar porcentagem
            const percentage = ((values[index] / total) * 100).toFixed(1);
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${percentage}%`, labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Desenhar título no centro
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Gastos por', centerX, centerY - 10);
        ctx.fillText('Categoria', centerX, centerY + 10);
    }

    drawDoughnutChart(ctx, canvas, categoryTotals) {
        const categories = Object.keys(categoryTotals);
        const values = Object.values(categoryTotals);
        const total = values.reduce((sum, value) => sum + value, 0);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const outerRadius = Math.min(centerX, centerY) - 40;
        const innerRadius = outerRadius * 0.6;

        let currentAngle = -Math.PI / 2;

        categories.forEach((category, index) => {
            const sliceAngle = (values[index] / total) * 2 * Math.PI;
            
            // Desenhar fatia
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        // Texto central
        ctx.fillStyle = '#333';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`R$ ${total.toFixed(0)}`, centerX, centerY - 5);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Total', centerX, centerY + 15);
    }

    drawBarChart(ctx, canvas, categoryTotals) {
        const categories = Object.keys(categoryTotals);
        const values = Object.values(categoryTotals);
        const maxValue = Math.max(...values);

        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / categories.length * 0.8;
        const barSpacing = chartWidth / categories.length * 0.2;

        // Desenhar eixos
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        categories.forEach((category, index) => {
            const barHeight = (values[index] / maxValue) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = canvas.height - padding - barHeight;

            // Desenhar barra com gradiente
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, this.colors[index % this.colors.length]);
            gradient.addColorStop(1, this.colors[index % this.colors.length] + '80');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Borda da barra
            ctx.strokeStyle = this.colors[index % this.colors.length];
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Valor no topo da barra
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`R$ ${values[index].toFixed(0)}`, x + barWidth / 2, y - 5);

            // Nome da categoria
            ctx.save();
            ctx.translate(x + barWidth / 2, canvas.height - padding + 15);
            ctx.rotate(-Math.PI / 4);
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(this.categoryNames[category] || category, 0, 0);
            ctx.restore();
        });
    }

    updateChartLegend(categoryTotals) {
        const chartContainer = document.querySelector('.chart-container');
        let legend = chartContainer.querySelector('.chart-legend');
        
        if (!legend) {
            legend = document.createElement('div');
            legend.className = 'chart-legend';
            chartContainer.appendChild(legend);
        }

        legend.innerHTML = '';
        
        Object.keys(categoryTotals).forEach((category, index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${this.colors[index % this.colors.length]}"></div>
                <span>${this.categoryNames[category] || category}</span>
            `;
            legend.appendChild(legendItem);
        });
    }

    updateChartStats(categoryTotals, expenses) {
        const chartContainer = document.querySelector('.chart-container');
        let stats = chartContainer.querySelector('.chart-stats');
        
        if (!stats) {
            stats = document.createElement('div');
            stats.className = 'chart-stats';
            chartContainer.appendChild(stats);
        }

        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        const avgExpense = total / expenses.length;
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b);

        stats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">R$ ${total.toFixed(0)}</span>
                <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">R$ ${avgExpense.toFixed(0)}</span>
                <span class="stat-label">Média</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${Object.keys(categoryTotals).length}</span>
                <span class="stat-label">Categorias</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.categoryNames[topCategory]?.replace('��️ ', '').replace('�� ', '').replace('🎮 ', '').replace('🏥 ', '').replace('📚 ', '').replace('👕 ', '').replace('🏠 ', '').replace('📦 ', '') || topCategory}</span>
                <span class="stat-label">Top Categoria</span>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando ChartManager...');
    window.chartManager = new ChartManager();
});