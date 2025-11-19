console.log('ai-insights.js carregado');

let AIInsightsManager = class {
    constructor() {
        this.insights = [];
        console.log('AIInsightsManager inicializando...');
        this.init();
    }

    init() {
        console.log('AIInsightsManager inicializado');
    }

    generateInsights() {
        const expenses = window.expenseManager ? window.expenseManager.getExpenses() : [];
        
        if (expenses.length < 3) {
            this.showPlaceholder();
            return;
        }

        this.insights = [];
        
        // Análise básica por emoção
        this.analyzeEmotionalPatterns(expenses);
        
        // Análise por categoria
        this.analyzeCategoryPatterns(expenses);
        
        this.displayInsights();
    }

    analyzeEmotionalPatterns(expenses) {
        const emotionTotals = {};
        const emotionCounts = {};

        expenses.forEach(expense => {
            emotionTotals[expense.emotion] = (emotionTotals[expense.emotion] || 0) + expense.amount;
            emotionCounts[expense.emotion] = (emotionCounts[expense.emotion] || 0) + 1;
        });

        // Emoção que mais gasta
        const topEmotion = Object.keys(emotionTotals).reduce((a, b) => 
            emotionTotals[a] > emotionTotals[b] ? a : b);

        const topEmotionAmount = emotionTotals[topEmotion];
        const totalAmount = Object.values(emotionTotals).reduce((sum, val) => sum + val, 0);
        const percentage = ((topEmotionAmount / totalAmount) * 100).toFixed(1);

        this.insights.push({
            type: 'emotion',
            title: '💭 Padrão Emocional Dominante',
            content: `Você tende a gastar mais quando está ${this.getEmotionName(topEmotion).toLowerCase()}. ${percentage}% dos seus gastos acontecem neste estado emocional.`,
            suggestion: this.getEmotionSuggestion(topEmotion)
        });

        // Análise de gastos impulsivos
        const impulsiveEmotions = ['estressado', 'ansioso', 'triste', 'irritado'];
        const impulsiveTotal = impulsiveEmotions.reduce((sum, emotion) => 
            sum + (emotionTotals[emotion] || 0), 0);

        if (impulsiveTotal > totalAmount * 0.3) {
            this.insights.push({
                type: 'warning',
                title: '⚠️ Gastos Emocionais Elevados',
                content: `${((impulsiveTotal / totalAmount) * 100).toFixed(1)}% dos seus gastos acontecem em momentos de estresse, ansiedade ou tristeza.`,
                suggestion: 'Considere implementar uma pausa de 24h antes de compras não essenciais quando estiver se sentindo assim.'
            });
        }
    }

    analyzeCategoryPatterns(expenses) {
        const categoryTotals = {};

        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        // Categoria com mais gastos
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b);

        const topCategoryAmount = categoryTotals[topCategory];
        const totalAmount = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        const percentage = ((topCategoryAmount / totalAmount) * 100).toFixed(1);

        this.insights.push({
            type: 'category',
            title: '📊 Categoria Principal',
            content: `Sua maior categoria de gastos é ${this.getCategoryName(topCategory).toLowerCase()}, representando ${percentage}% do total.`,
            suggestion: this.getCategorySuggestion(topCategory)
        });
    }

    getEmotionName(emotion) {
        const emotions = {
            'feliz': 'Feliz',
            'triste': 'Triste',
            'estressado': 'Estressado',
            'ansioso': 'Ansioso',
            'entediado': 'Entediado',
            'empolgado': 'Empolgado',
            'calmo': 'Calmo',
            'irritado': 'Irritado'
        };
        return emotions[emotion] || emotion;
    }

    getCategoryName(category) {
        const categories = {
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'roupas': 'Roupas',
            'casa': 'Casa',
            'outros': 'Outros'
        };
        return categories[category] || category;
    }

    getEmotionSuggestion(emotion) {
        const suggestions = {
            'estressado': 'Quando estressado, tente técnicas de respiração antes de fazer compras.',
            'ansioso': 'Em momentos de ansiedade, faça uma lista do que realmente precisa.',
            'triste': 'Quando triste, busque atividades gratuitas que tragam bem-estar.',
            'entediado': 'Para combater o tédio, explore hobbies que não envolvam gastos.',
            'empolgado': 'Quando empolgado, celebre de formas que não impactem o orçamento.',
            'irritado': 'Quando irritado, evite decisões financeiras até se acalmar.',
            'feliz': 'Aproveite momentos felizes para planejar metas financeiras.',
            'calmo': 'Estados calmos são ideais para revisar e planejar gastos.'
        };
        return suggestions[emotion] || 'Observe como suas emoções influenciam seus gastos.';
    }

    getCategorySuggestion(category) {
        const suggestions = {
            'alimentacao': 'Considere planejar refeições quando estiver calmo para evitar gastos impulsivos.',
            'lazer': 'Estabeleça um orçamento mensal fixo para entretenimento.',
            'roupas': 'Faça uma lista de necessidades antes de ir às compras.',
            'transporte': 'Avalie alternativas de transporte mais econômicas.',
            'casa': 'Para itens de casa, compare preços em diferentes lojas.',
            'saude': 'Invista em prevenção para reduzir gastos futuros.',
            'educacao': 'Gastos com educação são investimentos no seu futuro.',
            'outros': 'Categorize melhor seus gastos para ter mais controle.'
        };
        return suggestions[category] || 'Monitore esta categoria regularmente.';
    }

    displayInsights() {
        const container = document.getElementById('insightsList');
        if (!container) return;

        container.innerHTML = '';

        if (this.insights.length === 0) {
            this.showPlaceholder();
            return;
        }

        this.insights.forEach(insight => {
            const insightElement = document.createElement('div');
            insightElement.className = 'insight-card';
            insightElement.innerHTML = `
                <h3>${insight.title}</h3>
                <p>${insight.content}</p>
                <div style="margin-top: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 4px; font-style: italic;">
                    💡 <strong>Sugestão:</strong> ${insight.suggestion}
                </div>
            `;
            container.appendChild(insightElement);
        });
    }

    showPlaceholder() {
        const container = document.getElementById('insightsList');
        if (!container) return;

        container.innerHTML = `
            <div class="insight-placeholder">
                <p>Registre pelo menos 3 gastos para receber insights personalizados sobre seus padrões emocionais de consumo!</p>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando AIInsightsManager...');
    window.insightsManager = new AIInsightsManager();
});