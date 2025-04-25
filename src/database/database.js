const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbConfig = require('../config/database');

// Garantir que o diretório do banco de dados exista
const dbDir = path.dirname(dbConfig.database);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Inicializar o banco de dados
const db = new sqlite3.Database(dbConfig.database);

// Função para executar as migrações
function runMigrations() {
  console.log('Executando migrações do banco de dados...');
  
  return new Promise((resolve, reject) => {
    // Tabela de Membros
    db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        ministry TEXT,
        role TEXT,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela members:', err);
        return reject(err);
      }

      // Tabela de Ministérios
      db.run(`
        CREATE TABLE IF NOT EXISTS ministries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela ministries:', err);
          return reject(err);
        }

        // Tabela de Funções
        db.run(`
          CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ministry_id INTEGER,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ministry_id) REFERENCES ministries (id)
          )
        `, (err) => {
          if (err) {
            console.error('Erro ao criar tabela roles:', err);
            return reject(err);
          }

          // Tabela de Disponibilidade dos Membros
          db.run(`
            CREATE TABLE IF NOT EXISTS availability (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              member_id INTEGER NOT NULL,
              day_of_week INTEGER,
              available INTEGER DEFAULT 1,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (member_id) REFERENCES members (id)
            )
          `, (err) => {
            if (err) {
              console.error('Erro ao criar tabela availability:', err);
              return reject(err);
            }

            // Tabela de Habilidades dos Membros
            db.run(`
              CREATE TABLE IF NOT EXISTS member_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                weight INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (member_id) REFERENCES members (id),
                FOREIGN KEY (role_id) REFERENCES roles (id)
              )
            `, (err) => {
              if (err) {
                console.error('Erro ao criar tabela member_skills:', err);
                return reject(err);
              }

              // Tabela de Tipos de Escala
              db.run(`
                CREATE TABLE IF NOT EXISTS schedule_types (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL UNIQUE,
                  description TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
              `, (err) => {
                if (err) {
                  console.error('Erro ao criar tabela schedule_types:', err);
                  return reject(err);
                }

                // Tabela de Escalas
                db.run(`
                  CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    status TEXT DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (type_id) REFERENCES schedule_types (id)
                  )
                `, (err) => {
                  if (err) {
                    console.error('Erro ao criar tabela schedules:', err);
                    return reject(err);
                  }

                  // Tabela de Eventos
                  db.run(`
                    CREATE TABLE IF NOT EXISTS events (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      schedule_id INTEGER NOT NULL,
                      title TEXT NOT NULL,
                      event_date TEXT NOT NULL,
                      event_type TEXT,
                      description TEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (schedule_id) REFERENCES schedules (id)
                    )
                  `, (err) => {
                    if (err) {
                      console.error('Erro ao criar tabela events:', err);
                      return reject(err);
                    }

                    // Tabela de Atribuições
                    db.run(`
                      CREATE TABLE IF NOT EXISTS assignments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_id INTEGER NOT NULL,
                        member_id INTEGER NOT NULL,
                        role_id INTEGER NOT NULL,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (event_id) REFERENCES events (id),
                        FOREIGN KEY (member_id) REFERENCES members (id),
                        FOREIGN KEY (role_id) REFERENCES roles (id)
                      )
                    `, (err) => {
                      if (err) {
                        console.error('Erro ao criar tabela assignments:', err);
                        return reject(err);
                      }

                      // Tabela de Usuários
                      db.run(`
                        CREATE TABLE IF NOT EXISTS users (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          username TEXT NOT NULL UNIQUE,
                          password TEXT NOT NULL,
                          email TEXT UNIQUE,
                          role TEXT DEFAULT 'user',
                          member_id INTEGER,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (member_id) REFERENCES members (id)
                        )
                      `, (err) => {
                        if (err) {
                          console.error('Erro ao criar tabela users:', err);
                          return reject(err);
                        }

                        // Tabela de Configurações
                        db.run(`
                          CREATE TABLE IF NOT EXISTS settings (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            key TEXT NOT NULL UNIQUE,
                            value TEXT,
                            description TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                          )
                        `, (err) => {
                          if (err) {
                            console.error('Erro ao criar tabela settings:', err);
                            return reject(err);
                          }

                          console.log('Migrações concluídas com sucesso!');
                          resolve();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Função para inserir dados iniciais
function seedDatabase() {
  console.log('Inserindo dados iniciais...');

  return new Promise((resolve, reject) => {
    // Inserir tipos de escala
    const scheduleTypes = [
      { name: 'EBD', description: 'Escala de Professores da Escola Bíblica Dominical' },
      { name: 'Louvor', description: 'Escala do Ministério de Louvor' },
      { name: 'Cultos', description: 'Escala de Cultos e Trabalhos Ministeriais' }
    ];

    const insertScheduleType = db.prepare('INSERT OR IGNORE INTO schedule_types (name, description) VALUES (?, ?)');
    
    let completed = 0;
    scheduleTypes.forEach(type => {
      insertScheduleType.run([type.name, type.description], (err) => {
        if (err) {
          console.error('Erro ao inserir tipo de escala:', err);
          return reject(err);
        }
        
        completed++;
        if (completed === scheduleTypes.length) {
          // Inserir ministérios
          const ministries = [
            { name: 'EBD', description: 'Escola Bíblica Dominical' },
            { name: 'Louvor', description: 'Ministério de Louvor' },
            { name: 'Pastoral', description: 'Ministério Pastoral' },
            { name: 'Mulheres', description: 'Ministério de Mulheres' },
            { name: 'Família', description: 'Ministério da Família' },
            { name: 'Missões', description: 'Ministério de Missões' }
          ];

          const insertMinistry = db.prepare('INSERT OR IGNORE INTO ministries (name, description) VALUES (?, ?)');
          
          let ministriesCompleted = 0;
          ministries.forEach(ministry => {
            insertMinistry.run([ministry.name, ministry.description], (err) => {
              if (err) {
                console.error('Erro ao inserir ministério:', err);
                return reject(err);
              }
              
              ministriesCompleted++;
              if (ministriesCompleted === ministries.length) {
                // Continuar com outras inserções...
                console.log('Dados iniciais inseridos com sucesso!');
                resolve();
              }
            });
          });
        }
      });
    });
  });
}

// Executar migrações e seed
async function initialize() {
  try {
    await runMigrations();
    await seedDatabase();
    return db;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

module.exports = {
  db,
  initialize,
  runMigrations,
  seedDatabase
};
