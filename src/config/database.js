const path = require('path');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
  // Configuração do banco de dados SQLite
  database: path.join(__dirname, '../../database/church_schedule.sqlite'),
  
  // Opções de configuração
  options: {
    verbose: console.log, // Log de queries em desenvolvimento
  }
};
