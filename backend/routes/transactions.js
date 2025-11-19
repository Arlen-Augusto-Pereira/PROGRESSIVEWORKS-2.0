const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Listar transações do usuário
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, conta_id, categoria_id, tipo, data_inicio, data_fim } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT t.*, c.nome as conta_nome, cat.nome as categoria_nome, cat.icone as categoria_icone
            FROM transacoes t
            LEFT JOIN contas c ON t.conta_id = c.id
            LEFT JOIN categorias cat ON t.categoria_id = cat.id
            WHERE t.usuario_id = $1
        `;
        
        const params = [req.user.userId];
        let paramIndex = 2;

        // Filtros opcionais
        if (conta_id) {
            query += ` AND t.conta_id = $${paramIndex}`;
            params.push(conta_id);
            paramIndex++;
        }

        if (categoria_id) {
            query += ` AND t.categoria_id = $${paramIndex}`;
            params.push(categoria_id);
            paramIndex++;
        }

        if (tipo) {
            query += ` AND t.tipo = $${paramIndex}`;
            params.push(tipo);
            paramIndex++;
        }

        if (data_inicio) {
            query += ` AND t.data >= $${paramIndex}`;
            params.push(data_inicio);
            paramIndex++;
        }

        if (data_fim) {
            query += ` AND t.data <= $${paramIndex}`;
            params.push(data_fim);
            paramIndex++;
        }

        query += ` ORDER BY t.data DESC, t.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar nova transação
router.post('/', async (req, res) => {
    try {
        const { 
            conta_id, 
            categoria_id, 
            valor, 
            tipo, 
            descricao, 
            data, 
            conta_destino_id, 
            taxa_transferencia,
            emocao,
            tags,
            localizacao
        } = req.body;

        // Validar dados obrigatórios
        if (!conta_id || !valor || !tipo || !descricao || !data) {
            return res.status(400).json({ error: 'Campos obrigatórios: conta_id, valor, tipo, descricao, data' });
        }

        // Validar transferência
        if (tipo === 'transferencia' && !conta_destino_id) {
            return res.status(400).json({ error: 'Conta destino é obrigatória para transferências' });
        }

        const result = await db.query(
            `INSERT INTO transacoes 
             (usuario_id, conta_id, categoria_id, valor, tipo, descricao, data, conta_destino_id, taxa_transferencia, emocao, tags, localizacao)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                req.user.userId,
                conta_id,
                categoria_id || null,
                valor,
                tipo,
                descricao,
                data,
                conta_destino_id || null,
                taxa_transferencia || 0,
                emocao || null,
                tags || null,
                localizacao || null
            ]
        );

        res.status(201).json({
            message: 'Transação criada com sucesso',
            transacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter transação específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT t.*, c.nome as conta_nome, cat.nome as categoria_nome
             FROM transacoes t
             LEFT JOIN contas c ON t.conta_id = c.id
             LEFT JOIN categorias cat ON t.categoria_id = cat.id
             WHERE t.id = $1 AND t.usuario_id = $2`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar transação
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { categoria_id, valor, descricao, data, emocao, tags, localizacao } = req.body;

        const result = await db.query(
            `UPDATE transacoes 
             SET categoria_id = $1, valor = $2, descricao = $3, data = $4, emocao = $5, tags = $6, localizacao = $7
             WHERE id = $8 AND usuario_id = $9
             RETURNING *`,
            [categoria_id, valor, descricao, data, emocao, tags, localizacao, id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        res.json({
            message: 'Transação atualizada com sucesso',
            transacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar transação
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2 RETURNING id',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        res.json({ message: 'Transação excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;