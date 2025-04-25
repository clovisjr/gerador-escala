const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// Obter todos os tipos de escala
router.get('/types', (req, res) => {
  db.all('SELECT * FROM schedule_types ORDER BY name', (err, types) => {
    if (err) {
      console.error('Erro ao buscar tipos de escala:', err);
      return res.status(500).json({ error: 'Erro ao buscar tipos de escala' });
    }
    res.json(types);
  });
});

// Obter todas as escalas
router.get('/', (req, res) => {
  db.all(`
    SELECT s.*, st.name as type_name 
    FROM schedules s
    JOIN schedule_types st ON s.type_id = st.id
    ORDER BY s.start_date DESC
  `, (err, schedules) => {
    if (err) {
      console.error('Erro ao buscar escalas:', err);
      return res.status(500).json({ error: 'Erro ao buscar escalas' });
    }
    res.json(schedules);
  });
});

// Obter uma escala específica
router.get('/:id', (req, res) => {
  db.get(`
    SELECT s.*, st.name as type_name 
    FROM schedules s
    JOIN schedule_types st ON s.type_id = st.id
    WHERE s.id = ?
  `, [req.params.id], (err, schedule) => {
    if (err) {
      console.error('Erro ao buscar escala:', err);
      return res.status(500).json({ error: 'Erro ao buscar escala' });
    }
    
    if (!schedule) {
      return res.status(404).json({ error: 'Escala não encontrada' });
    }
    
    // Buscar eventos associados a esta escala
    db.all(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM assignments a WHERE a.event_id = e.id) as assignment_count
      FROM events e
      WHERE e.schedule_id = ?
      ORDER BY e.event_date
    `, [schedule.id], (err, events) => {
      if (err) {
        console.error('Erro ao buscar eventos da escala:', err);
        return res.status(500).json({ error: 'Erro ao buscar eventos da escala' });
      }
      
      // Adicionar eventos à escala
      schedule.events = events;
      
      res.json(schedule);
    });
  });
});

// Criar uma nova escala
router.post('/', (req, res) => {
  const { type_id, title, start_date, end_date, status } = req.body;
  
  if (!type_id || !title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Tipo, título, data inicial e data final são obrigatórios' });
  }
  
  // Verificar se o tipo de escala existe
  db.get('SELECT * FROM schedule_types WHERE id = ?', [type_id], (err, scheduleType) => {
    if (err) {
      console.error('Erro ao verificar tipo de escala:', err);
      return res.status(500).json({ error: 'Erro ao criar escala' });
    }
    
    if (!scheduleType) {
      return res.status(400).json({ error: 'Tipo de escala inválido' });
    }
    
    db.run(
      'INSERT INTO schedules (type_id, title, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
      [type_id, title, start_date, end_date, status || 'draft'],
      function(err) {
        if (err) {
          console.error('Erro ao criar escala:', err);
          return res.status(500).json({ error: 'Erro ao criar escala' });
        }
        
        res.status(201).json({ 
          id: this.lastID,
          type_id,
          title,
          start_date,
          end_date,
          status: status || 'draft'
        });
      }
    );
  });
});

// Atualizar uma escala existente
router.put('/:id', (req, res) => {
  const { type_id, title, start_date, end_date, status } = req.body;
  const { id } = req.params;
  
  if (!type_id || !title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Tipo, título, data inicial e data final são obrigatórios' });
  }
  
  // Verificar se a escala existe
  db.get('SELECT * FROM schedules WHERE id = ?', [id], (err, existingSchedule) => {
    if (err) {
      console.error('Erro ao verificar escala existente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar escala' });
    }
    
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Escala não encontrada' });
    }
    
    // Verificar se o tipo de escala existe
    db.get('SELECT * FROM schedule_types WHERE id = ?', [type_id], (err, scheduleType) => {
      if (err) {
        console.error('Erro ao verificar tipo de escala:', err);
        return res.status(500).json({ error: 'Erro ao atualizar escala' });
      }
      
      if (!scheduleType) {
        return res.status(400).json({ error: 'Tipo de escala inválido' });
      }
      
      db.run(
        'UPDATE schedules SET type_id = ?, title = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [type_id, title, start_date, end_date, status || existingSchedule.status, id],
        function(err) {
          if (err) {
            console.error('Erro ao atualizar escala:', err);
            return res.status(500).json({ error: 'Erro ao atualizar escala' });
          }
          
          res.json({ 
            id: parseInt(id),
            type_id,
            title,
            start_date,
            end_date,
            status: status || existingSchedule.status
          });
        }
      );
    });
  });
});

// Excluir uma escala
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar se a escala existe
  db.get('SELECT * FROM schedules WHERE id = ?', [id], (err, existingSchedule) => {
    if (err) {
      console.error('Erro ao verificar escala existente:', err);
      return res.status(500).json({ error: 'Erro ao excluir escala' });
    }
    
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Escala não encontrada' });
    }
    
    // Iniciar uma transação para excluir a escala e seus eventos/atribuições
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Erro ao iniciar transação:', err);
        return res.status(500).json({ error: 'Erro ao excluir escala' });
      }
      
      // Buscar todos os eventos desta escala
      db.all('SELECT id FROM events WHERE schedule_id = ?', [id], (err, events) => {
        if (err) {
          console.error('Erro ao buscar eventos da escala:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Erro ao excluir escala' });
        }
        
        // Excluir atribuições de cada evento
        let completedEvents = 0;
        
        if (events.length === 0) {
          // Não há eventos, prosseguir para excluir a escala
          deleteSchedule();
        } else {
          events.forEach(event => {
            db.run('DELETE FROM assignments WHERE event_id = ?', [event.id], (err) => {
              if (err) {
                console.error('Erro ao excluir atribuições do evento:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Erro ao excluir escala' });
              }
              
              completedEvents++;
              
              if (completedEvents === events.length) {
                // Todas as atribuições foram excluídas, prosseguir para excluir os eventos
                deleteEvents();
              }
            });
          });
        }
        
        function deleteEvents() {
          db.run('DELETE FROM events WHERE schedule_id = ?', [id], (err) => {
            if (err) {
              console.error('Erro ao excluir eventos da escala:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Erro ao excluir escala' });
            }
            
            // Eventos excluídos, prosseguir para excluir a escala
            deleteSchedule();
          });
        }
        
        function deleteSchedule() {
          db.run('DELETE FROM schedules WHERE id = ?', [id], (err) => {
            if (err) {
              console.error('Erro ao excluir escala:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Erro ao excluir escala' });
            }
            
            // Confirmar a transação
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Erro ao confirmar transação:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Erro ao excluir escala' });
              }
              
              res.json({ message: 'Escala excluída com sucesso' });
            });
          });
        }
      });
    });
  });
});

// Gerar escala automaticamente
router.post('/:id/generate', (req, res) => {
  const { id } = req.params;
  
  // Verificar se a escala existe
  db.get('SELECT * FROM schedules WHERE id = ?', [id], (err, existingSchedule) => {
    if (err) {
      console.error('Erro ao verificar escala existente:', err);
      return res.status(500).json({ error: 'Erro ao gerar escala' });
    }
    
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Escala não encontrada' });
    }
    
    // Verificar o tipo de escala para aplicar regras específicas
    db.get('SELECT * FROM schedule_types WHERE id = ?', [existingSchedule.type_id], (err, scheduleType) => {
      if (err) {
        console.error('Erro ao verificar tipo de escala:', err);
        return res.status(500).json({ error: 'Erro ao gerar escala' });
      }
      
      if (!scheduleType) {
        return res.status(400).json({ error: 'Tipo de escala inválido' });
      }
      
      // Implementar lógica de geração automática de escala com base no tipo
      let generatedEvents = [];
      
      if (scheduleType.name === 'EBD') {
        // Lógica para gerar escala de EBD
        generateEBDSchedule(existingSchedule, (events) => {
          res.json({ 
            message: 'Escala gerada com sucesso',
            events: events
          });
        });
      } else if (scheduleType.name === 'Louvor') {
        // Lógica para gerar escala de Louvor
        generateWorshipSchedule(existingSchedule, (events) => {
          res.json({ 
            message: 'Escala gerada com sucesso',
            events: events
          });
        });
      } else if (scheduleType.name === 'Cultos') {
        // Lógica para gerar escala de Cultos
        generateChurchServiceSchedule(existingSchedule, (events) => {
          res.json({ 
            message: 'Escala gerada com sucesso',
            events: events
          });
        });
      } else {
        res.json({ 
          message: 'Tipo de escala não suporta geração automática',
          events: []
        });
      }
    });
  });
});

// Função para gerar escala de EBD
function generateEBDSchedule(schedule, callback) {
  // Implementação simplificada para teste
  const startDate = new Date(schedule.start_date);
  const endDate = new Date(schedule.end_date);
  const events = [];
  
  // Gerar domingos no período da escala
  let currentDate = new Date(startDate);
  let processedDates = 0;
  let totalDates = 0;
  
  // Contar quantos domingos existem no período
  let countDate = new Date(startDate);
  while (countDate <= endDate) {
    if (countDate.getDay() === 0) {
      totalDates++;
    }
    countDate.setDate(countDate.getDate() + 1);
  }
  
  if (totalDates === 0) {
    callback(events);
    return;
  }
  
  while (currentDate <= endDate) {
    // Verificar se é domingo
    if (currentDate.getDay() === 0) {
      // Criar evento para este domingo
      const eventDate = currentDate.toISOString().split('T')[0];
      const event = {
        schedule_id: schedule.id,
        title: `EBD - ${eventDate}`,
        event_date: eventDate,
        event_type: 'EBD',
        description: 'Aula da Escola Bíblica Dominical'
      };
      
      // Inserir evento no banco de dados
      db.run(
        'INSERT INTO events (schedule_id, title, event_date, event_type, description) VALUES (?, ?, ?, ?, ?)',
        [event.schedule_id, event.title, event.event_date, event.event_type, event.description],
        function(err) {
          if (err) {
            console.error('Erro ao inserir evento:', err);
          } else {
            event.id = this.lastID;
            events.push(event);
          }
          
          processedDates++;
          if (processedDates === totalDates) {
            callback(events);
          }
        }
      );
    }
    
    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

// Função para gerar escala de Louvor
function generateWorshipSchedule(schedule, callback) {
  // Implementação simplificada para teste
  const startDate = new Date(schedule.start_date);
  const endDate = new Date(schedule.end_date);
  const events = [];
  
  // Gerar domingos no período da escala
  let currentDate = new Date(startDate);
  let processedDates = 0;
  let totalDates = 0;
  
  // Contar quantos domingos existem no período
  let countDate = new Date(startDate);
  while (countDate <= endDate) {
    if (countDate.getDay() === 0) {
      totalDates++;
    }
    countDate.setDate(countDate.getDate() + 1);
  }
  
  if (totalDates === 0) {
    callback(events);
    return;
  }
  
  while (currentDate <= endDate) {
    // Verificar se é domingo
    if (currentDate.getDay() === 0) {
      // Criar evento para este domingo
      const eventDate = currentDate.toISOString().split('T')[0];
      const event = {
        schedule_id: schedule.id,
        title: `Culto de Louvor - ${eventDate}`,
        event_date: eventDate,
        event_type: 'Louvor',
        description: 'Culto de Louvor e Adoração'
      };
      
      // Inserir evento no banco de dados
      db.run(
        'INSERT INTO events (schedule_id, title, event_date, event_type, description) VALUES (?, ?, ?, ?, ?)',
        [event.schedule_id, event.title, event.event_date, event.event_type, event.description],
        function(err) {
          if (err) {
            console.error('Erro ao inserir evento:', err);
          } else {
            event.id = this.lastID;
            events.push(event);
          }
          
          processedDates++;
          if (processedDates === totalDates) {
            callback(events);
          }
        }
      );
    }
    
    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

// Função para gerar escala de Cultos
function generateChurchServiceSchedule(schedule, callback) {
  // Implementação simplificada para teste
  const startDate = new Date(schedule.start_date);
  const endDate = new Date(schedule.end_date);
  const events = [];
  
  // Gerar domingos e quartas no período da escala
  let currentDate = new Date(startDate);
  let processedDates = 0;
  let totalDates = 0;
  
  // Contar quantos domingos e quartas existem no período
  let countDate = new Date(startDate);
  while (countDate <= endDate) {
    if (countDate.getDay() === 0 || countDate.getDay() === 3) {
      totalDates++;
    }
    countDate.setDate(countDate.getDate() + 1);
  }
  
  if (totalDates === 0) {
    callback(events);
    return;
  }
  
  while (currentDate <= endDate) {
    // Verificar se é domingo ou quarta
    if (currentDate.getDay() === 0 || currentDate.getDay() === 3) {
      // Criar evento para este dia
      const eventDate = currentDate.toISOString().split('T')[0];
      const isSunday = currentDate.getDay() === 0;
      const event = {
        schedule_id: schedule.id,
        title: isSunday ? `Culto de Celebração - ${eventDate}` : `Culto de Oração - ${eventDate}`,
        event_date: eventDate,
        event_type: isSunday ? 'Celebração' : 'Oração',
        description: isSunday ? 'Culto de Celebração Dominical' : 'Culto de Oração e Estudo Bíblico'
      };
      
      // Inserir evento no banco de dados
      db.run(
        'INSERT INTO events (schedule_id, title, event_date, event_type, description) VALUES (?, ?, ?, ?, ?)',
        [event.schedule_id, event.title, event.event_date, event.event_type, event.description],
        function(err) {
          if (err) {
            console.error('Erro ao inserir evento:', err);
          } else {
            event.id = this.lastID;
            events.push(event);
          }
          
          processedDates++;
          if (processedDates === totalDates) {
            callback(events);
          }
        }
      );
    }
    
    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

module.exports = router;
