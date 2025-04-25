const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const jwt = require('jsonwebtoken');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'church-schedule-app-secret';

// Middleware para verificar autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    
    req.user = user;
    next();
  });
}

// Middleware para verificar permissão de administrador
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária' });
  }
  
  next();
}

// Obter todas as configurações
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM settings ORDER BY key', (err, settings) => {
    if (err) {
      console.error('Erro ao buscar configurações:', err);
      return res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
    res.json(settings);
  });
});

// Obter uma configuração específica por chave
router.get('/:key', authenticateToken, (req, res) => {
  const { key } = req.params;
  
  db.get('SELECT * FROM settings WHERE key = ?', [key], (err, setting) => {
    if (err) {
      console.error('Erro ao buscar configuração:', err);
      return res.status(500).json({ error: 'Erro ao buscar configuração' });
    }
    
    if (!setting) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    res.json(setting);
  });
});

// Atualizar uma configuração (apenas para administradores)
router.put('/:key', authenticateToken, isAdmin, (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;
  
  if (value === undefined) {
    return res.status(400).json({ error: 'Valor é obrigatório' });
  }
  
  // Verificar se a configuração existe
  db.get('SELECT * FROM settings WHERE key = ?', [key], (err, existingSetting) => {
    if (err) {
      console.error('Erro ao verificar configuração existente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
    
    if (!existingSetting) {
      // Se não existir, criar nova configuração
      db.run(
        'INSERT INTO settings (key, value, description) VALUES (?, ?, ?)',
        [key, value, description],
        function(err) {
          if (err) {
            console.error('Erro ao criar configuração:', err);
            return res.status(500).json({ error: 'Erro ao criar configuração' });
          }
          
          res.status(201).json({ 
            id: this.lastID,
            key,
            value,
            description
          });
        }
      );
    } else {
      // Se existir, atualizar
      db.run(
        'UPDATE settings SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [value, description || existingSetting.description, key],
        function(err) {
          if (err) {
            console.error('Erro ao atualizar configuração:', err);
            return res.status(500).json({ error: 'Erro ao atualizar configuração' });
          }
          
          res.json({ 
            id: existingSetting.id,
            key,
            value,
            description: description || existingSetting.description
          });
        }
      );
    }
  });
});

// Excluir uma configuração (apenas para administradores)
router.delete('/:key', authenticateToken, isAdmin, (req, res) => {
  const { key } = req.params;
  
  // Verificar se a configuração existe
  db.get('SELECT * FROM settings WHERE key = ?', [key], (err, existingSetting) => {
    if (err) {
      console.error('Erro ao verificar configuração existente:', err);
      return res.status(500).json({ error: 'Erro ao excluir configuração' });
    }
    
    if (!existingSetting) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    db.run('DELETE FROM settings WHERE key = ?', [key], function(err) {
      if (err) {
        console.error('Erro ao excluir configuração:', err);
        return res.status(500).json({ error: 'Erro ao excluir configuração' });
      }
      
      res.json({ message: 'Configuração excluída com sucesso' });
    });
  });
});

// Obter configurações da igreja
router.get('/church/info', (req, res) => {
  // Buscar todas as configurações da igreja de uma vez
  db.all("SELECT key, value FROM settings WHERE key LIKE 'church_%'", (err, settings) => {
    if (err) {
      console.error('Erro ao buscar informações da igreja:', err);
      return res.status(500).json({ error: 'Erro ao buscar informações da igreja' });
    }
    
    // Converter array de configurações para objeto
    const churchInfo = {
      name: 'Igreja',
      address: '',
      phone: '',
      email: ''
    };
    
    settings.forEach(setting => {
      if (setting.key === 'church_name') churchInfo.name = setting.value;
      if (setting.key === 'church_address') churchInfo.address = setting.value;
      if (setting.key === 'church_phone') churchInfo.phone = setting.value;
      if (setting.key === 'church_email') churchInfo.email = setting.value;
    });
    
    res.json(churchInfo);
  });
});

module.exports = router;
