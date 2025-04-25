const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// Obter todos os eventos
router.get('/', (req, res) => {
  db.all(`
    SELECT e.*, s.title as schedule_title, s.type_id,
      (SELECT COUNT(*) FROM assignments a WHERE a.event_id = e.id) as assignment_count
    FROM events e
    JOIN schedules s ON e.schedule_id = s.id
    ORDER BY e.event_date DESC
  `, (err, events) => {
    if (err) {
      console.error('Erro ao buscar eventos:', err);
      return res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
    res.json(events);
  });
});

// Obter eventos por escala
router.get('/schedule/:scheduleId', (req, res) => {
  const { scheduleId } = req.params;
  
  db.all(`
    SELECT e.*, 
      (SELECT COUNT(*) FROM assignments a WHERE a.event_id = e.id) as assignment_count
    FROM events e
    WHERE e.schedule_id = ?
    ORDER BY e.event_date
  `, [scheduleId], (err, events) => {
    if (err) {
      console.error('Erro ao buscar eventos por escala:', err);
      return res.status(500).json({ error: 'Erro ao buscar eventos por escala' });
    }
    res.json(events);
  });
});

// Obter um evento específico com suas atribuições
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT e.*, s.title as schedule_title, s.type_id, st.name as schedule_type
    FROM events e
    JOIN schedules s ON e.schedule_id = s.id
    JOIN schedule_types st ON s.type_id = st.id
    WHERE e.id = ?
  `, [id], (err, event) => {
    if (err) {
      console.error('Erro ao buscar evento:', err);
      return res.status(500).json({ error: 'Erro ao buscar evento' });
    }
    
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Buscar atribuições deste evento
    db.all(`
      SELECT a.*, m.name as member_name, r.name as role_name
      FROM assignments a
      JOIN members m ON a.member_id = m.id
      JOIN roles r ON a.role_id = r.id
      WHERE a.event_id = ?
      ORDER BY r.name
    `, [id], (err, assignments) => {
      if (err) {
        console.error('Erro ao buscar atribuições do evento:', err);
        return res.status(500).json({ error: 'Erro ao buscar atribuições do evento' });
      }
      
      // Adicionar atribuições ao evento
      event.assignments = assignments;
      
      res.json(event);
    });
  });
});

// Criar um novo evento
router.post('/', (req, res) => {
  const { schedule_id, title, event_date, event_type, description } = req.body;
  
  if (!schedule_id || !title || !event_date) {
    return res.status(400).json({ error: 'Escala, título e data são obrigatórios' });
  }
  
  // Verificar se a escala existe
  db.get('SELECT * FROM schedules WHERE id = ?', [schedule_id], (err, schedule) => {
    if (err) {
      console.error('Erro ao verificar escala:', err);
      return res.status(500).json({ error: 'Erro ao criar evento' });
    }
    
    if (!schedule) {
      return res.status(400).json({ error: 'Escala inválida' });
    }
    
    db.run(
      'INSERT INTO events (schedule_id, title, event_date, event_type, description) VALUES (?, ?, ?, ?, ?)',
      [schedule_id, title, event_date, event_type, description],
      function(err) {
        if (err) {
          console.error('Erro ao criar evento:', err);
          return res.status(500).json({ error: 'Erro ao criar evento' });
        }
        
        res.status(201).json({ 
          id: this.lastID,
          schedule_id,
          title,
          event_date,
          event_type,
          description
        });
      }
    );
  });
});

// Atualizar um evento existente
router.put('/:id', (req, res) => {
  const { schedule_id, title, event_date, event_type, description } = req.body;
  const { id } = req.params;
  
  if (!schedule_id || !title || !event_date) {
    return res.status(400).json({ error: 'Escala, título e data são obrigatórios' });
  }
  
  // Verificar se o evento existe
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, existingEvent) => {
    if (err) {
      console.error('Erro ao verificar evento:', err);
      return res.status(500).json({ error: 'Erro ao atualizar evento' });
    }
    
    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Verificar se a escala existe
    db.get('SELECT * FROM schedules WHERE id = ?', [schedule_id], (err, schedule) => {
      if (err) {
        console.error('Erro ao verificar escala:', err);
        return res.status(500).json({ error: 'Erro ao atualizar evento' });
      }
      
      if (!schedule) {
        return res.status(400).json({ error: 'Escala inválida' });
      }
      
      db.run(
        'UPDATE events SET schedule_id = ?, title = ?, event_date = ?, event_type = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [schedule_id, title, event_date, event_type, description, id],
        function(err) {
          if (err) {
            console.error('Erro ao atualizar evento:', err);
            return res.status(500).json({ error: 'Erro ao atualizar evento' });
          }
          
          res.json({ 
            id: parseInt(id),
            schedule_id,
            title,
            event_date,
            event_type,
            description
          });
        }
      );
    });
  });
});

// Excluir um evento
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar se o evento existe
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, existingEvent) => {
    if (err) {
      console.error('Erro ao verificar evento:', err);
      return res.status(500).json({ error: 'Erro ao excluir evento' });
    }
    
    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Iniciar uma transação para excluir o evento e suas atribuições
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Erro ao iniciar transação:', err);
        return res.status(500).json({ error: 'Erro ao excluir evento' });
      }
      
      // Excluir atribuições
      db.run('DELETE FROM assignments WHERE event_id = ?', [id], (err) => {
        if (err) {
          console.error('Erro ao excluir atribuições:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Erro ao excluir evento' });
        }
        
        // Excluir o evento
        db.run('DELETE FROM events WHERE id = ?', [id], (err) => {
          if (err) {
            console.error('Erro ao excluir evento:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Erro ao excluir evento' });
          }
          
          // Confirmar a transação
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Erro ao confirmar transação:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Erro ao excluir evento' });
            }
            
            res.json({ message: 'Evento excluído com sucesso' });
          });
        });
      });
    });
  });
});

// Adicionar atribuição a um evento
router.post('/:id/assignments', (req, res) => {
  const { id } = req.params;
  const { member_id, role_id, notes } = req.body;
  
  if (!member_id || !role_id) {
    return res.status(400).json({ error: 'Membro e função são obrigatórios' });
  }
  
  // Verificar se o evento existe
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      console.error('Erro ao verificar evento:', err);
      return res.status(500).json({ error: 'Erro ao adicionar atribuição' });
    }
    
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Verificar se o membro existe
    db.get('SELECT * FROM members WHERE id = ?', [member_id], (err, member) => {
      if (err) {
        console.error('Erro ao verificar membro:', err);
        return res.status(500).json({ error: 'Erro ao adicionar atribuição' });
      }
      
      if (!member) {
        return res.status(400).json({ error: 'Membro inválido' });
      }
      
      // Verificar se a função existe
      db.get('SELECT * FROM roles WHERE id = ?', [role_id], (err, role) => {
        if (err) {
          console.error('Erro ao verificar função:', err);
          return res.status(500).json({ error: 'Erro ao adicionar atribuição' });
        }
        
        if (!role) {
          return res.status(400).json({ error: 'Função inválida' });
        }
        
        // Verificar se já existe uma atribuição para este membro e função neste evento
        db.get(
          'SELECT * FROM assignments WHERE event_id = ? AND member_id = ? AND role_id = ?',
          [id, member_id, role_id],
          (err, existingAssignment) => {
            if (err) {
              console.error('Erro ao verificar atribuição existente:', err);
              return res.status(500).json({ error: 'Erro ao adicionar atribuição' });
            }
            
            if (existingAssignment) {
              return res.status(400).json({ error: 'Já existe uma atribuição para este membro e função neste evento' });
            }
            
            db.run(
              'INSERT INTO assignments (event_id, member_id, role_id, notes) VALUES (?, ?, ?, ?)',
              [id, member_id, role_id, notes],
              function(err) {
                if (err) {
                  console.error('Erro ao adicionar atribuição:', err);
                  return res.status(500).json({ error: 'Erro ao adicionar atribuição' });
                }
                
                res.status(201).json({ 
                  id: this.lastID,
                  event_id: parseInt(id),
                  member_id,
                  role_id,
                  notes,
                  member_name: member.name,
                  role_name: role.name
                });
              }
            );
          }
        );
      });
    });
  });
});

// Remover atribuição de um evento
router.delete('/:eventId/assignments/:assignmentId', (req, res) => {
  const { eventId, assignmentId } = req.params;
  
  // Verificar se o evento existe
  db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      console.error('Erro ao verificar evento:', err);
      return res.status(500).json({ error: 'Erro ao remover atribuição' });
    }
    
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Verificar se a atribuição existe e pertence a este evento
    db.get('SELECT * FROM assignments WHERE id = ? AND event_id = ?', [assignmentId, eventId], (err, assignment) => {
      if (err) {
        console.error('Erro ao verificar atribuição:', err);
        return res.status(500).json({ error: 'Erro ao remover atribuição' });
      }
      
      if (!assignment) {
        return res.status(404).json({ error: 'Atribuição não encontrada ou não pertence a este evento' });
      }
      
      db.run('DELETE FROM assignments WHERE id = ?', [assignmentId], function(err) {
        if (err) {
          console.error('Erro ao remover atribuição:', err);
          return res.status(500).json({ error: 'Erro ao remover atribuição' });
        }
        
        res.json({ message: 'Atribuição removida com sucesso' });
      });
    });
  });
});

module.exports = router;
