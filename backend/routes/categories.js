const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Listar categorias (sistema + usuário)
router.get('/', async (req, res) => {
    try {
        const { tipo } = req.query;
        
        let query = `
            SELECT id, nome, icone, cor, tipo, sistema
            FROM categorias 
            WHERE (sistema = true OR usuario_id = $1)
        `;
        
        const params = [req.user.userId];

        if (tipo) {
            query += ` AND (tipo = $2 OR tipo = 'ambos')`;
            params.push(tipo);
        }

        query += ` ORDER BY sistema DESC, nome ASC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar categoria personalizada
router.post('/', async (req, res) => {
    try {
        const { nome, icone, cor, tipo } = req.body;

        // Validar dados
        if (!nome || !tipo) {
            return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        }

        const result = await db.query(
            `INSERT INTO categorias (usuario_id, nome, icone, cor, tipo)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [req.user.userId, nome, icone || '📦', cor || '#666666', tipo]
        );

        res.status(201).json({
            message: 'Categoria criada com sucesso',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        if (error.code === '23505') { // Unique violation
            res.status(400).json({ error: 'Já existe uma categoria com esse nome' });
        } else {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
});

// Atualizar categoria personalizada
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, icone, cor, tipo } = req.body;

        const result = await db.query(
            `UPDATE categorias 
             SET nome = $1, icone = $2, cor = $3, tipo = $4
             WHERE id = $5 AND usuario_id = $6 AND sistema = false
             RETURNING *`,
            [nome, icone, cor, tipo, id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada ou não pode ser editada' });
        }

        res.json({
            message: 'Categoria atualizada com sucesso',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar categoria personalizada
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se há transações vinculadas
        const transacoes = await db.query(
            'SELECT COUNT(*) as total FROM transacoes WHERE categoria_id = $1',
            [id]
        );

        if (parseInt(transacoes.rows[0].total) > 0) {
            return res.status(400).json({ 
                error: 'Não é possível excluir categoria com transações vinculadas' 
            });
        }

        const result = await db.query(
            'DELETE FROM categorias WHERE id = $1 AND usuario_id = $2 AND sistema = false RETURNING id',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada ou não pode ser excluída' });
        }

        res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;