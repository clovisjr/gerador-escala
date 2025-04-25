const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../database/database');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'church-schedule-app-secret';
const JWT_EXPIRES_IN = '24h';

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

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    
    // Buscar usuário pelo nome de usuário
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro ao fazer login' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      
      // Verificar senha
      try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        // Gerar token JWT
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            member_id: user.member_id
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            member_id: user.member_id
          }
        });
      } catch (bcryptError) {
        console.error('Erro ao verificar senha:', bcryptError);
        res.status(500).json({ error: 'Erro no login' });
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no login' });
  }
});

// Registrar novo usuário
router.post('/register', (req, res) => {
  try {
    const { username, password, email, role, member_id } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    
    // Verificar se o usuário já existe
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        console.error('Erro ao verificar usuário existente:', err);
        return res.status(500).json({ error: 'Erro ao registrar usuário' });
      }
      
      if (existingUser) {
        return res.status(400).json({ error: 'Nome de usuário já está em uso' });
      }
      
      // Verificar se o email já existe
      if (email) {
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingEmail) => {
          if (err) {
            console.error('Erro ao verificar email existente:', err);
            return res.status(500).json({ error: 'Erro ao registrar usuário' });
          }
          
          if (existingEmail) {
            return res.status(400).json({ error: 'Email já está em uso' });
          }
          
          try {
            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Inserir novo usuário
            db.run(
              'INSERT INTO users (username, password, email, role, member_id) VALUES (?, ?, ?, ?, ?)',
              [username, hashedPassword, email, role || 'user', member_id],
              function(err) {
                if (err) {
                  console.error('Erro ao inserir usuário:', err);
                  return res.status(500).json({ error: 'Erro ao registrar usuário' });
                }
                
                res.status(201).json({ 
                  id: this.lastID,
                  username,
                  email,
                  role: role || 'user',
                  member_id
                });
              }
            );
          } catch (bcryptError) {
            console.error('Erro ao gerar hash da senha:', bcryptError);
            res.status(500).json({ error: 'Erro ao registrar usuário' });
          }
        });
      } else {
        try {
          // Hash da senha
          const hashedPassword = await bcrypt.hash(password, 10);
          
          // Inserir novo usuário
          db.run(
            'INSERT INTO users (username, password, email, role, member_id) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email, role || 'user', member_id],
            function(err) {
              if (err) {
                console.error('Erro ao inserir usuário:', err);
                return res.status(500).json({ error: 'Erro ao registrar usuário' });
              }
              
              res.status(201).json({ 
                id: this.lastID,
                username,
                email,
                role: role || 'user',
                member_id
              });
            }
          );
        } catch (bcryptError) {
          console.error('Erro ao gerar hash da senha:', bcryptError);
          res.status(500).json({ error: 'Erro ao registrar usuário' });
        }
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Obter perfil do usuário autenticado
router.get('/profile', authenticateToken, (req, res) => {
  try {
    db.get('SELECT id, username, email, role, member_id FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        console.error('Erro ao buscar perfil:', err);
        return res.status(500).json({ error: 'Erro ao buscar perfil' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Se o usuário estiver associado a um membro, buscar informações do membro
      if (user.member_id) {
        db.get('SELECT * FROM members WHERE id = ?', [user.member_id], (err, member) => {
          if (err) {
            console.error('Erro ao buscar membro:', err);
            return res.status(500).json({ error: 'Erro ao buscar perfil' });
          }
          
          user.member = member;
          res.json(user);
        });
      } else {
        res.json(user);
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Atualizar senha
router.put('/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }
    
    // Buscar usuário
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro ao atualizar senha' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      try {
        // Verificar senha atual
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Senha atual incorreta' });
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Atualizar senha
        db.run(
          'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [hashedPassword, req.user.id],
          function(err) {
            if (err) {
              console.error('Erro ao atualizar senha:', err);
              return res.status(500).json({ error: 'Erro ao atualizar senha' });
            }
            
            res.json({ message: 'Senha atualizada com sucesso' });
          }
        );
      } catch (bcryptError) {
        console.error('Erro ao verificar/gerar hash da senha:', bcryptError);
        res.status(500).json({ error: 'Erro ao atualizar senha' });
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

// Listar todos os usuários (apenas para administradores)
router.get('/users', authenticateToken, isAdmin, (req, res) => {
  try {
    db.all(`
      SELECT u.id, u.username, u.email, u.role, u.member_id, m.name as member_name
      FROM users u
      LEFT JOIN members m ON u.member_id = m.id
      ORDER BY u.username
    `, [], (err, users) => {
      if (err) {
        console.error('Erro ao listar usuários:', err);
        return res.status(500).json({ error: 'Erro ao listar usuários' });
      }
      
      res.json(users);
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Atualizar usuário (apenas para administradores)
router.put('/users/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, member_id, password } = req.body;
    
    // Verificar se o usuário existe
    db.get('SELECT * FROM users WHERE id = ?', [id], async (err, existingUser) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
      }
      
      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Verificar se o novo nome de usuário já está em uso
      if (username && username !== existingUser.username) {
        db.get('SELECT * FROM users WHERE username = ? AND id != ?', [username, id], (err, userWithSameName) => {
          if (err) {
            console.error('Erro ao verificar nome de usuário:', err);
            return res.status(500).json({ error: 'Erro ao atualizar usuário' });
          }
          
          if (userWithSameName) {
            return res.status(400).json({ error: 'Nome de usuário já está em uso' });
          }
          
          continueUpdate();
        });
      } else {
        continueUpdate();
      }
      
      async function continueUpdate() {
        try {
          // Preparar dados para atualização
          const updateData = {
            username: username || existingUser.username,
            email: email || existingUser.email,
            role: role || existingUser.role,
            member_id: member_id === null ? null : (member_id || existingUser.member_id)
          };
          
          // Se uma nova senha foi fornecida, hash e atualizar
          if (password) {
            updateData.password = await bcrypt.hash(password, 10);
            
            db.run(`
              UPDATE users 
              SET username = ?, email = ?, role = ?, member_id = ?, password = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [
              updateData.username, 
              updateData.email, 
              updateData.role, 
              updateData.member_id, 
              updateData.password, 
              id
            ], function(err) {
              if (err) {
                console.error('Erro ao atualizar usuário:', err);
                return res.status(500).json({ error: 'Erro ao atualizar usuário' });
              }
              
              res.json({ 
                id: parseInt(id),
                username: updateData.username,
                email: updateData.email,
                role: updateData.role,
                member_id: updateData.member_id
              });
            });
          } else {
            db.run(`
              UPDATE users 
              SET username = ?, email = ?, role = ?, member_id = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [
              updateData.username, 
              updateData.email, 
              updateData.role, 
              updateData.member_id, 
              id
            ], function(err) {
              if (err) {
                console.error('Erro ao atualizar usuário:', err);
                return res.status(500).json({ error: 'Erro ao atualizar usuário' });
              }
              
              res.json({ 
                id: parseInt(id),
                username: updateData.username,
                email: updateData.email,
                role: updateData.role,
                member_id: updateData.member_id
              });
            });
          }
        } catch (bcryptError) {
          console.error('Erro ao gerar hash da senha:', bcryptError);
          res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Excluir usuário (apenas para administradores)
router.delete('/users/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Não permitir excluir o próprio usuário
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário' });
    }
    
    // Verificar se o usuário existe
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, existingUser) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro ao excluir usuário' });
      }
      
      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Erro ao excluir usuário:', err);
          return res.status(500).json({ error: 'Erro ao excluir usuário' });
        }
        
        res.json({ message: 'Usuário excluído com sucesso' });
      });
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// Exportar apenas o router
module.exports = router;
