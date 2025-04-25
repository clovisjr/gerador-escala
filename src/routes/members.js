const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// Obter todos os membros
router.get('/', (req, res) => {
  db.all('SELECT * FROM members ORDER BY name', (err, members) => {
    if (err) {
      console.error('Erro ao buscar membros:', err);
      return res.status(500).json({ error: 'Erro ao buscar membros' });
    }
    res.json(members);
  });
});

// Obter um membro específico
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM members WHERE id = ?', [req.params.id], (err, member) => {
    if (err) {
      console.error('Erro ao buscar membro:', err);
      return res.status(500).json({ error: 'Erro ao buscar membro' });
    }
    
    if (!member) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }
    
    res.json(member);
  });
});

// Criar um novo membro
router.post('/', (req, res) => {
  const { name, email, phone, ministry, role, active } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  
  const activeValue = active === undefined ? 1 : active;
  
  db.run(
    'INSERT INTO members (name, email, phone, ministry, role, active) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, phone, ministry, role, activeValue],
    function(err) {
      if (err) {
        console.error('Erro ao criar membro:', err);
        return res.status(500).json({ error: 'Erro ao criar membro' });
      }
      
      res.status(201).json({ 
        id: this.lastID,
        name,
        email,
        phone,
        ministry,
        role,
        active: activeValue
      });
    }
  );
});

// Atualizar um membro existente
router.put('/:id', (req, res) => {
  const { name, email, phone, ministry, role, active } = req.body;
  const { id } = req.params;
  
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  
  // Verificar se o membro existe
  db.get('SELECT * FROM members WHERE id = ?', [id], (err, existingMember) => {
    if (err) {
      console.error('Erro ao buscar membro:', err);
      return res.status(500).json({ error: 'Erro ao buscar membro' });
    }
    
    if (!existingMember) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }
    
    const activeValue = active === undefined ? existingMember.active : active;
    
    db.run(
      'UPDATE members SET name = ?, email = ?, phone = ?, ministry = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, phone, ministry, role, activeValue, id],
      function(err) {
        if (err) {
          console.error('Erro ao atualizar membro:', err);
          return res.status(500).json({ error: 'Erro ao atualizar membro' });
        }
        
        res.json({ 
          id: parseInt(id),
          name,
          email,
          phone,
          ministry,
          role,
          active: activeValue
        });
      }
    );
  });
});

// Excluir um membro
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar se o membro existe
  db.get('SELECT * FROM members WHERE id = ?', [id], (err, existingMember) => {
    if (err) {
      console.error('Erro ao buscar membro:', err);
      return res.status(500).json({ error: 'Erro ao buscar membro' });
    }
    
    if (!existingMember) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }
    
    // Verificar se o membro está em alguma escala
    db.get('SELECT COUNT(*) as count FROM assignments WHERE member_id = ?', [id], (err, result) => {
      if (err) {
        console.error('Erro ao verificar atribuições:', err);
        return res.status(500).json({ error: 'Erro ao verificar atribuições' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir o membro pois ele está em uma ou mais escalas',
          assignmentCount: result.count
        });
      }
      
      db.run('DELETE FROM members WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Erro ao excluir membro:', err);
          return res.status(500).json({ error: 'Erro ao excluir membro' });
        }
        
        res.json({ message: 'Membro excluído com sucesso' });
      });
    });
  });
});

// Obter membros por ministério
router.get('/ministry/:ministry', (req, res) => {
  db.all('SELECT * FROM members WHERE ministry = ? ORDER BY name', [req.params.ministry], (err, members) => {
    if (err) {
      console.error('Erro ao buscar membros por ministério:', err);
      return res.status(500).json({ error: 'Erro ao buscar membros por ministério' });
    }
    res.json(members);
  });
});

// Obter membros por função
router.get('/role/:role', (req, res) => {
  db.all('SELECT * FROM members WHERE role = ? ORDER BY name', [req.params.role], (err, members) => {
    if (err) {
      console.error('Erro ao buscar membros por função:', err);
      return res.status(500).json({ error: 'Erro ao buscar membros por função' });
    }
    res.json(members);
  });
});

module.exports = router;
