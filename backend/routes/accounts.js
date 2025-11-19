const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Listar contas do usuário
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, nome, tipo, saldo, limite_credito, icone, cor, descricao, ativo
             FROM contas 
             WHERE usuario_id = $1 AND ativo = true
             ORDER BY nome ASC`,
            [req.user.userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar contas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar nova conta
router.post('/', async (req, res) => {
    try {
        const { nome, tipo, saldo, limite_credito, icone, cor, descricao } = req.body;

        // Validar dados obrigatórios
        if (!nome || !tipo) {
            return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        }

        const result = await db.query(
            `INSERT INTO contas (usuario_id, nome, tipo, saldo, limite_credito, icone, cor, descricao)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                req.user.userId,
                nome,
                tipo,
                saldo || 0,
                limite_credito || null,
                icone || '💳',
                cor || '#2196F3',
                descricao || null
            ]
        );

        res.status(201).json({
            message: 'Conta criada com sucesso',
            conta: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter conta específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM contas WHERE id = $1 AND usuario_id = $2',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar conta:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar conta
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo, limite_credito, icone, cor, descricao } = req.body;

        const result = await db.query(
            `UPDATE contas 
             SET nome = $1, tipo = $2, limite_credito = $3, icone = $4, cor = $5, descricao = $6
             WHERE id = $7 AND usuario_id = $8
             RETURNING *`,
            [nome, tipo, limite_credito, icone, cor, descricao, id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        res.json({
            message: 'Conta atualizada com sucesso',
            conta: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar conta
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se há transações vinculadas
        const transacoes = await db.query(
            'SELECT COUNT(*) as total FROM transacoes WHERE conta_id = $1 OR conta_destino_id = $1',
            [id]
        );

        if (parseInt(transacoes.rows[0].total) > 0) {
            return res.status(400).json({ 
                error: 'Não é possível excluir conta com transações vinculadas' 
            });
        }

        const result = await db.query(
            'UPDATE contas SET ativo = false WHERE id = $1 AND usuario_id = $2 RETURNING id',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;