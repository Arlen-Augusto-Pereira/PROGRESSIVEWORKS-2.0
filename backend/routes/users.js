const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Obter perfil do usuário
router.get('/profile', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, nome, email, avatar_url, criado_em FROM usuarios WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar perfil do usuário
router.put('/profile', async (req, res) => {
    try {
        const { nome, avatar_url } = req.body;

        const result = await db.query(
            'UPDATE usuarios SET nome = $1, avatar_url = $2 WHERE id = $3 RETURNING id, nome, email, avatar_url',
            [nome, avatar_url, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            message: 'Perfil atualizado com sucesso',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;