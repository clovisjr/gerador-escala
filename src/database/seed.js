// Arquivo de seed para inserir dados iniciais no banco de dados
const bcrypt = require('bcrypt');

// Função para inserir dados iniciais no banco de dados
async function seedDatabase(db) {
  console.log('Inserindo dados iniciais no banco de dados...');

  try {
    // Inserir tipos de escala
    const scheduleTypes = [
      { name: 'EBD', description: 'Escala de Professores da Escola Bíblica Dominical' },
      { name: 'Louvor', description: 'Escala do Ministério de Louvor' },
      { name: 'Cultos', description: 'Escala de Cultos e Trabalhos Ministeriais' }
    ];

    const insertScheduleType = db.prepare('INSERT OR IGNORE INTO schedule_types (name, description) VALUES (?, ?)');
    for (const type of scheduleTypes) {
      insertScheduleType.run(type.name, type.description);
    }

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
    for (const ministry of ministries) {
      insertMinistry.run(ministry.name, ministry.description);
    }

    // Obter IDs dos ministérios inseridos
    const getMinistryId = db.prepare('SELECT id FROM ministries WHERE name = ?');
    
    // Inserir funções
    const roles = [
      // EBD
      { name: 'Professor Adultos', ministry: 'EBD', description: 'Professor da classe de adultos' },
      { name: 'Professor Jovens', ministry: 'EBD', description: 'Professor da classe de jovens' },
      { name: 'Professor Adolescentes', ministry: 'EBD', description: 'Professor da classe de adolescentes' },
      { name: 'Professor Juniores', ministry: 'EBD', description: 'Professor da classe de juniores' },
      
      // Louvor
      { name: 'Bateria', ministry: 'Louvor', description: 'Instrumentista - Bateria' },
      { name: 'Teclado', ministry: 'Louvor', description: 'Instrumentista - Teclado' },
      { name: 'Baixo', ministry: 'Louvor', description: 'Instrumentista - Baixo' },
      { name: 'Guitarra', ministry: 'Louvor', description: 'Instrumentista - Guitarra' },
      { name: 'Violão', ministry: 'Louvor', description: 'Instrumentista - Violão' },
      { name: 'Back', ministry: 'Louvor', description: 'Vocal de apoio' },
      { name: 'Ministro', ministry: 'Louvor', description: 'Ministro de louvor' },
      { name: 'Fotografia', ministry: 'Louvor', description: 'Fotografia do culto' },
      
      // Cultos
      { name: 'Dirigente', ministry: 'Pastoral', description: 'Dirigente do culto' },
      { name: 'Pregador', ministry: 'Pastoral', description: 'Pregador do culto' }
    ];
    
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name, ministry_id, description) VALUES (?, ?, ?)');
    
    for (const role of roles) {
      const ministry = getMinistryId.get(role.ministry);
      if (ministry) {
        insertRole.run(role.name, ministry.id, role.description);
      }
    }

    // Inserir membros da EBD com base no arquivo fornecido
    const ebdMembers = [
      { name: 'Pr Salvador', ministry: 'EBD', role: 'Professor Adultos' },
      { name: 'Sildete', ministry: 'EBD', role: 'Professor Jovens' },
      { name: 'Deusilene', ministry: 'EBD', role: 'Professor Adolescentes' },
      { name: 'Dora', ministry: 'EBD', role: 'Professor Juniores' },
      { name: 'Clovis', ministry: 'EBD', role: 'Professor Adultos' },
      { name: 'Marta', ministry: 'EBD', role: 'Professor Jovens' },
      { name: 'Dc Silvania', ministry: 'EBD', role: 'Professor Adolescentes' },
      { name: 'Diwene', ministry: 'EBD', role: 'Professor Juniores' },
      { name: 'Pra Josélia', ministry: 'EBD', role: 'Professor Adultos' },
      { name: 'Pb Deyviton', ministry: 'EBD', role: 'Professor Jovens' },
      { name: 'Mary', ministry: 'EBD', role: 'Professor Adolescentes' },
      { name: 'Pb Paulo', ministry: 'EBD', role: 'Professor Adultos' },
      { name: 'Pr Edilson', ministry: 'EBD', role: 'Professor Adultos' },
      { name: 'Pr Carlos', ministry: 'EBD', role: 'Professor Adultos' }
    ];

    // Inserir membros do Louvor com base no arquivo fornecido
    const louvorMembers = [
      { name: 'Luiz Felipe', ministry: 'Louvor', role: 'Bateria' },
      { name: 'Clovis J.', ministry: 'Louvor', role: 'Teclado' },
      { name: 'Jonas', ministry: 'Louvor', role: 'Baixo' },
      { name: 'Davi', ministry: 'Louvor', role: 'Guitarra' },
      { name: 'Moisés', ministry: 'Louvor', role: 'Violão' },
      { name: 'Silvânia', ministry: 'Louvor', role: 'Back' },
      { name: 'Vitória', ministry: 'Louvor', role: 'Back' },
      { name: 'Ingrid', ministry: 'Louvor', role: 'Back' },
      { name: 'Thauana', ministry: 'Louvor', role: 'Back' },
      { name: 'Thiele', ministry: 'Louvor', role: 'Back' },
      { name: 'Maria Clara', ministry: 'Louvor', role: 'Back' },
      { name: 'Joyce', ministry: 'Louvor', role: 'Back' },
      { name: 'Sueli', ministry: 'Louvor', role: 'Back' },
      { name: 'Danilo', ministry: 'Louvor', role: 'Bateria' }
    ];

    // Inserir membros dos Cultos com base no arquivo fornecido
    const cultosMembers = [
      { name: 'Pb Deyviton', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'PR Ribamar', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'Pb Paulo', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'PR Edilson', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'Dca Sildete', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'Pra Josélia', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'DCA Sueli', ministry: 'Mulheres', role: 'Dirigente' },
      { name: 'Convidado', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'Dca Silvana', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'DCA Deusilene', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'DCA Katiane', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'DCA mariuce', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'PR Carlos', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'Pb Clóvis', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'PR Salvador', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'DCA Doralice', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'PB Elias', ministry: 'Pastoral', role: 'Pregador' },
      { name: 'Dc Doralice/Joel', ministry: 'Pastoral', role: 'Dirigente' },
      { name: 'Pb Walney', ministry: 'Pastoral', role: 'Pregador' }
    ];

    // Combinar todos os membros em uma única lista, removendo duplicatas por nome
    const allMembers = [...ebdMembers];
    
    // Adicionar membros do louvor que não estão na lista
    for (const member of louvorMembers) {
      if (!allMembers.some(m => m.name === member.name)) {
        allMembers.push(member);
      }
    }
    
    // Adicionar membros dos cultos que não estão na lista
    for (const member of cultosMembers) {
      if (!allMembers.some(m => m.name === member.name)) {
        allMembers.push(member);
      }
    }

    // Inserir membros no banco de dados
    const insertMember = db.prepare('INSERT OR IGNORE INTO members (name, ministry, role) VALUES (?, ?, ?)');
    for (const member of allMembers) {
      insertMember.run(member.name, member.ministry, member.role);
    }

    // Inserir configurações padrão
    const settings = [
      { key: 'church_name', value: 'Igreja Assembleia de Deus', description: 'Nome da igreja' },
      { key: 'church_address', value: 'Rua Exemplo, 123', description: 'Endereço da igreja' },
      { key: 'church_phone', value: '(00) 0000-0000', description: 'Telefone da igreja' },
      { key: 'church_email', value: 'contato@igreja.com', description: 'Email da igreja' },
      { key: 'schedule_notification_days', value: '7', description: 'Dias de antecedência para notificação de escala' }
    ];

    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)');
    for (const setting of settings) {
      insertSetting.run(setting.key, setting.value, setting.description);
    }

    // Criar usuário administrador padrão (senha: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, email, role) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', hashedPassword, 'admin@igreja.com', 'admin');

    console.log('Dados iniciais inseridos com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inserir dados iniciais:', error);
    return false;
  }
}

module.exports = seedDatabase;
