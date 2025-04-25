// app.js - Arquivo principal de JavaScript para o sistema de escalas

// Variáveis globais
let currentPage = 'dashboard';
let schedulesList = [];
let membersList = [];
let ministryList = [];
let rolesList = [];

// Inicializar a aplicação quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar autenticação
  await Auth.initAuth();
  
  // Configurar navegação
  setupNavigation();
  
  // Configurar manipuladores de eventos para modais
  setupModalHandlers();
});

// Configurar navegação
function setupNavigation() {
  // Dashboard
  document.getElementById('nav-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('dashboard');
  });
  
  // Escalas
  document.getElementById('nav-schedules').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('schedules');
  });
  
  // Membros
  document.getElementById('nav-members').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('members');
  });
  
  // Ministérios
  document.getElementById('nav-ministries').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('ministries');
  });
  
  // Usuários (admin)
  const navUsers = document.getElementById('nav-users');
  if (navUsers) {
    navUsers.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('users');
    });
  }
  
  // Configurações (admin)
  const navSettings = document.getElementById('nav-settings');
  if (navSettings) {
    navSettings.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('settings');
    });
  }
  
  // Logout
  document.getElementById('nav-logout').addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });
}

// Navegar para uma página
function navigateTo(page) {
  // Atualizar página atual
  currentPage = page;
  
  // Atualizar classes ativas na navegação
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(`nav-${page}`).classList.add('active');
  
  // Ocultar todos os containers
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('schedules-container').style.display = 'none';
  document.getElementById('members-container').style.display = 'none';
  
  // Mostrar container da página selecionada
  document.getElementById(`${page}-container`).style.display = 'block';
  
  // Atualizar título da página
  updatePageTitle(page);
  
  // Atualizar botões de ação
  updatePageActions(page);
  
  // Carregar dados da página
  loadPageData(page);
}

// Atualizar título da página
function updatePageTitle(page) {
  let title = '';
  
  switch (page) {
    case 'dashboard':
      title = 'Dashboard';
      break;
    case 'schedules':
      title = 'Escalas';
      break;
    case 'members':
      title = 'Membros';
      break;
    case 'ministries':
      title = 'Ministérios';
      break;
    case 'users':
      title = 'Usuários';
      break;
    case 'settings':
      title = 'Configurações';
      break;
    default:
      title = 'Dashboard';
  }
  
  document.getElementById('page-title').textContent = title;
}

// Atualizar botões de ação
function updatePageActions(page) {
  const actionsContainer = document.getElementById('page-actions');
  actionsContainer.innerHTML = '';
  
  switch (page) {
    case 'schedules':
      actionsContainer.innerHTML = `
        <button type="button" class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#scheduleModal">
          <i class="bi bi-plus-circle"></i> Nova Escala
        </button>
      `;
      break;
    case 'members':
      actionsContainer.innerHTML = `
        <button type="button" class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#memberModal">
          <i class="bi bi-plus-circle"></i> Novo Membro
        </button>
      `;
      break;
    case 'ministries':
      actionsContainer.innerHTML = `
        <button type="button" class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#ministryModal">
          <i class="bi bi-plus-circle"></i> Novo Ministério
        </button>
      `;
      break;
    case 'users':
      if (Auth.isAdmin()) {
        actionsContainer.innerHTML = `
          <button type="button" class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#userModal">
            <i class="bi bi-plus-circle"></i> Novo Usuário
          </button>
        `;
      }
      break;
  }
}

// Carregar dados da página
async function loadPageData(page) {
  try {
    switch (page) {
      case 'dashboard':
        await loadDashboardData();
        break;
      case 'schedules':
        await loadSchedulesData();
        break;
      case 'members':
        await loadMembersData();
        break;
      case 'ministries':
        await loadMinistriesData();
        break;
      case 'users':
        if (Auth.isAdmin()) {
          await loadUsersData();
        }
        break;
      case 'settings':
        if (Auth.isAdmin()) {
          await loadSettingsData();
        }
        break;
    }
  } catch (error) {
    console.error(`Erro ao carregar dados da página ${page}:`, error);
    Auth.showToast(`Erro ao carregar dados: ${error.message}`, 'danger');
  }
}

// Carregar dados do dashboard
async function loadDashboardData() {
  try {
    // Carregar contadores
    const [members, schedules, events, ministries] = await Promise.all([
      API.members.getAll(),
      API.schedules.getAll(),
      API.events.getAll(),
      loadMinistries()
    ]);
    
    // Atualizar contadores
    document.getElementById('total-members').textContent = members.length;
    
    // Contar escalas ativas
    const activeSchedules = schedules.filter(schedule => schedule.status === 'active');
    document.getElementById('active-schedules').textContent = activeSchedules.length;
    
    // Filtrar eventos futuros
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= today;
    }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    
    document.getElementById('upcoming-events').textContent = upcomingEvents.length;
    
    // Atualizar lista de ministérios
    document.getElementById('total-ministries').textContent = ministries.length;
    
    // Preencher tabela de próximos eventos
    const upcomingEventsList = document.getElementById('upcoming-events-list');
    upcomingEventsList.innerHTML = '';
    
    // Limitar a 5 eventos
    const eventsToShow = upcomingEvents.slice(0, 5);
    
    if (eventsToShow.length === 0) {
      upcomingEventsList.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum evento próximo</td></tr>';
    } else {
      eventsToShow.forEach(event => {
        const date = new Date(event.event_date).toLocaleDateString('pt-BR');
        upcomingEventsList.innerHTML += `
          <tr>
            <td>${date}</td>
            <td>${event.title}</td>
            <td>${event.event_type || '-'}</td>
          </tr>
        `;
      });
    }
    
    // Carregar minhas atribuições
    await loadMyAssignments();
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    Auth.showToast('Erro ao carregar dados do dashboard', 'danger');
  }
}

// Carregar minhas atribuições
async function loadMyAssignments() {
  try {
    const user = Auth.getUser();
    
    // Verificar se o usuário está associado a um membro
    if (!user.member_id) {
      const myAssignmentsList = document.getElementById('my-assignments-list');
      myAssignmentsList.innerHTML = '<tr><td colspan="3" class="text-center">Usuário não associado a um membro</td></tr>';
      return;
    }
    
    // Buscar todos os eventos
    const events = await API.events.getAll();
    
    // Filtrar eventos futuros
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureEvents = events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= today;
    });
    
    // Buscar detalhes de cada evento para verificar atribuições
    const myAssignments = [];
    
    for (const event of futureEvents) {
      const eventDetails = await API.events.getById(event.id);
      
      // Verificar se há atribuições para o membro do usuário
      const memberAssignments = eventDetails.assignments.filter(
        assignment => assignment.member_id === user.member_id
      );
      
      if (memberAssignments.length > 0) {
        memberAssignments.forEach(assignment => {
          myAssignments.push({
            event_date: eventDetails.event_date,
            event_title: eventDetails.title,
            role_name: assignment.role_name
          });
        });
      }
    }
    
    // Ordenar por data
    myAssignments.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    
    // Preencher tabela
    const myAssignmentsList = document.getElementById('my-assignments-list');
    myAssignmentsList.innerHTML = '';
    
    if (myAssignments.length === 0) {
      myAssignmentsList.innerHTML = '<tr><td colspan="3" class="text-center">Nenhuma atribuição encontrada</td></tr>';
    } else {
      // Limitar a 5 atribuições
      const assignmentsToShow = myAssignments.slice(0, 5);
      
      assignmentsToShow.forEach(assignment => {
        const date = new Date(assignment.event_date).toLocaleDateString('pt-BR');
        myAssignmentsList.innerHTML += `
          <tr>
            <td>${date}</td>
            <td>${assignment.event_title}</td>
            <td>${assignment.role_name}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error('Erro ao carregar minhas atribuições:', error);
    Auth.showToast('Erro ao carregar suas atribuições', 'danger');
  }
}

// Carregar dados de escalas
async function loadSchedulesData() {
  try {
    // Buscar escalas
    schedulesList = await API.schedules.getAll();
    
    // Ordenar por data de início (mais recente primeiro)
    schedulesList.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    
    // Preencher tabela
    const scheduleListElement = document.getElementById('schedules-list');
    scheduleListElement.innerHTML = '';
    
    if (schedulesList.length === 0) {
      scheduleListElement.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma escala encontrada</td></tr>';
    } else {
      schedulesList.forEach(schedule => {
        const startDate = new Date(schedule.start_date).toLocaleDateString('pt-BR');
        const endDate = new Date(schedule.end_date).toLocaleDateString('pt-BR');
        
        // Definir classe de status
        let statusClass = '';
        let statusText = '';
        
        switch (schedule.status) {
          case 'draft':
            statusClass = 'badge bg-secondary';
            statusText = 'Rascunho';
            break;
          case 'active':
            statusClass = 'badge bg-success';
            statusText = 'Ativa';
            break;
          case 'completed':
            statusClass = 'badge bg-dark';
            statusText = 'Concluída';
            break;
          default:
            statusClass = 'badge bg-secondary';
            statusText = schedule.status;
        }
        
        scheduleListElement.innerHTML += `
          <tr>
            <td>${schedule.title}</td>
            <td>${schedule.type_name}</td>
            <td>${startDate} a ${endDate}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
              <button class="btn btn-sm btn-info btn-action" onclick="viewSchedule(${schedule.id})">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary btn-action" onclick="editSchedule(${schedule.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-success btn-action" onclick="generateSchedule(${schedule.id})">
                <i class="bi bi-calendar-check"></i>
              </button>
              <button class="btn btn-sm btn-danger btn-action" onclick="deleteSchedule(${schedule.id})">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error('Erro ao carregar escalas:', error);
    Auth.showToast('Erro ao carregar escalas', 'danger');
  }
}

// Carregar dados de membros
async function loadMembersData() {
  try {
    // Buscar membros
    membersList = await API.members.getAll();
    
    // Ordenar por nome
    membersList.sort((a, b) => a.name.localeCompare(b.name));
    
    // Preencher tabela
    const membersListElement = document.getElementById('members-list');
    membersListElement.innerHTML = '';
    
    if (membersList.length === 0) {
      membersListElement.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum membro encontrado</td></tr>';
    } else {
      membersList.forEach(member => {
        // Definir status
        const statusBadge = member.active 
          ? '<span class="badge bg-success">Ativo</span>' 
          : '<span class="badge bg-danger">Inativo</span>';
        
        membersListElement.innerHTML += `
          <tr>
            <td>${member.name}</td>
            <td>${member.ministry || '-'}</td>
            <td>${member.role || '-'}</td>
            <td>${member.phone || member.email || '-'}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-sm btn-primary btn-action" onclick="editMember(${member.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger btn-action" onclick="deleteMember(${member.id})">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error('Erro ao carregar membros:', error);
    Auth.showToast('Erro ao carregar membros', 'danger');
  }
}

// Carregar ministérios
async function loadMinistries() {
  try {
    // Buscar ministérios do banco de dados
    // Como não temos uma API específica para ministérios, vamos extrair dos membros
    const members = await API.members.getAll();
    
    // Extrair ministérios únicos
    const ministries = [...new Set(members.map(member => member.ministry).filter(Boolean))];
    
    return ministries;
  } catch (error) {
    console.error('Erro ao carregar ministérios:', error);
    throw error;
  }
}

// Carregar dados de ministérios
async function loadMinistriesData() {
  // Implementação futura
  Auth.showToast('Funcionalidade em desenvolvimento', 'info');
}

// Carregar dados de usuários
async function loadUsersData() {
  // Implementação futura
  Auth.showToast('Funcionalidade em desenvolvimento', 'info');
}

// Carregar dados de configurações
async function loadSettingsData() {
  // Implementação futura
  Auth.showToast('Funcionalidade em desenvolvimento', 'info');
}

// Configurar manipuladores de eventos para modais
function setupModalHandlers() {
  // Modal de Membro
  document.getElementById('memberModal').addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget;
    const isEdit = button && button.getAttribute('data-action') === 'edit';
    
    // Atualizar título do modal
    document.getElementById('memberModalTitle').textContent = isEdit ? 'Editar Membro' : 'Adicionar Membro';
    
    // Limpar formulário se for adição
    if (!isEdit) {
      document.getElementById('member-form').reset();
      document.getElementById('member-id').value = '';
    }
  });
  
  // Salvar membro
  document.getElementById('save-member').addEventListener('click', saveMember);
  
  // Modal de Escala
  document.getElementById('scheduleModal').addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget;
    const isEdit = button && button.getAttribute('data-action') === 'edit';
    
    // Atualizar título do modal
    document.getElementById('scheduleModalTitle').textContent = isEdit ? 'Editar Escala' : 'Adicionar Escala';
    
    // Limpar formulário se for adição
    if (!isEdit) {
      document.getElementById('schedule-form').reset();
      document.getElementById('schedule-id').value = '';
      
      // Preencher tipos de escala
      loadScheduleTypes();
    }
  });
  
  // Salvar escala
  document.getElementById('save-schedule').addEventListener('click', saveSchedule);
  
  // Modal de Evento
  document.getElementById('eventModal').addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget;
    const isEdit = button && button.getAttribute('data-action') === 'edit';
    
    // Atualizar título do modal
    document.getElementById('eventModalTitle').textContent = isEdit ? 'Editar Evento' : 'Adicionar Evento';
    
    // Limpar formulário se for adição
    if (!isEdit) {
      document.getElementById('event-form').reset();
      document.getElementById('event-id').value = '';
    }
  });
  
  // Salvar evento
  document.getElementById('save-event').addEventListener('click', saveEvent);
  
  // Modal de Atribuição
  document.getElementById('assignmentModal').addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget;
    const isEdit = button && button.getAttribute('data-action') === 'edit';
    
    // Atualizar título do modal
    document.getElementById('assignmentModalTitle').textContent = isEdit ? 'Editar Atribuição' : 'Adicionar Atribuição';
    
    // Limpar formulário se for adição
    if (!isEdit) {
      document.getElementById('assignment-form').reset();
      document.getElementById('assignment-id').value = '';
      
      // Carregar membros e funções
      loadMembersForAssignment();
      loadRolesForAssignment();
    }
  });
  
  // Salvar atribuição
  document.getElementById('save-assignment').addEventListener('click', saveAssignment);
}

// Carregar tipos de escala
async function loadScheduleTypes() {
  try {
    const types = await API.schedules.getTypes();
    const selectElement = document.getElementById('schedule-type');
    
    // Limpar opções existentes, mantendo a primeira
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    
    // Adicionar tipos
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type.id;
      option.textContent = type.name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar tipos de escala:', error);
    Auth.showToast('Erro ao carregar tipos de escala', 'danger');
  }
}

// Carregar membros para atribuição
async function loadMembersForAssignment() {
  try {
    const members = await API.members.getAll();
    const selectElement = document.getElementById('assignment-member');
    
    // Limpar opções existentes, mantendo a primeira
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    
    // Adicionar membros ativos
    members.filter(member => member.active).forEach(member => {
      const option = document.createElement('option');
      option.value = member.id;
      option.textContent = member.name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar membros:', error);
    Auth.showToast('Erro ao carregar membros', 'danger');
  }
}

// Carregar funções para atribuição
async function loadRolesForAssignment() {
  // Implementação futura - quando tivermos uma API para funções
  // Por enquanto, vamos usar as funções extraídas dos membros
  try {
    const members = await API.members.getAll();
    const roles = [...new Set(members.map(member => member.role).filter(Boolean))];
    
    const selectElement = document.getElementById('assignment-role');
    
    // Limpar opções existentes, mantendo a primeira
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    
    // Adicionar funções
    roles.forEach(role => {
      const option = document.createElement('option');
      option.value = role;
      option.textContent = role;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar funções:', error);
    Auth.showToast('Erro ao carregar funções', 'danger');
  }
}

// Salvar membro
async function saveMember() {
  try {
    const memberId = document.getElementById('member-id').value;
    const memberData = {
      name: document.getElementById('member-name').value,
      email: document.getElementById('member-email').value,
      phone: document.getElementById('member-phone').value,
      ministry: document.getElementById('member-ministry').value,
      role: document.getElementById('member-role').value,
      active: document.getElementById('member-active').checked ? 1 : 0
    };
    
    if (!memberData.name) {
      Auth.showToast('Nome é obrigatório', 'warning');
      return;
    }
    
    let result;
    
    if (memberId) {
      // Atualizar membro existente
      result = await API.members.update(memberId, memberData);
      Auth.showToast('Membro atualizado com sucesso!', 'success');
    } else {
      // Criar novo membro
      result = await API.members.create(memberData);
      Auth.showToast('Membro criado com sucesso!', 'success');
    }
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('memberModal'));
    modal.hide();
    
    // Recarregar dados
    await loadMembersData();
  } catch (error) {
    console.error('Erro ao salvar membro:', error);
    Auth.showToast(`Erro ao salvar membro: ${error.message}`, 'danger');
  }
}

// Editar membro
async function editMember(memberId) {
  try {
    // Buscar dados do membro
    const member = membersList.find(m => m.id === memberId);
    
    if (!member) {
      Auth.showToast('Membro não encontrado', 'warning');
      return;
    }
    
    // Preencher formulário
    document.getElementById('member-id').value = member.id;
    document.getElementById('member-name').value = member.name || '';
    document.getElementById('member-email').value = member.email || '';
    document.getElementById('member-phone').value = member.phone || '';
    document.getElementById('member-ministry').value = member.ministry || '';
    document.getElementById('member-role').value = member.role || '';
    document.getElementById('member-active').checked = member.active === 1;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('memberModal'));
    modal.show();
  } catch (error) {
    console.error('Erro ao editar membro:', error);
    Auth.showToast('Erro ao carregar dados do membro', 'danger');
  }
}

// Excluir membro
async function deleteMember(memberId) {
  try {
    // Confirmar exclusão
    if (!confirm('Tem certeza que deseja excluir este membro?')) {
      return;
    }
    
    // Excluir membro
    await API.members.delete(memberId);
    
    // Recarregar dados
    await loadMembersData();
    
    Auth.showToast('Membro excluído com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao excluir membro:', error);
    Auth.showToast(`Erro ao excluir membro: ${error.message}`, 'danger');
  }
}

// Salvar escala
async function saveSchedule() {
  try {
    const scheduleId = document.getElementById('schedule-id').value;
    const scheduleData = {
      type_id: document.getElementById('schedule-type').value,
      title: document.getElementById('schedule-title').value,
      start_date: document.getElementById('schedule-start-date').value,
      end_date: document.getElementById('schedule-end-date').value,
      status: document.getElementById('schedule-status').value
    };
    
    if (!scheduleData.type_id || !scheduleData.title || !scheduleData.start_date || !scheduleData.end_date) {
      Auth.showToast('Todos os campos são obrigatórios', 'warning');
      return;
    }
    
    let result;
    
    if (scheduleId) {
      // Atualizar escala existente
      result = await API.schedules.update(scheduleId, scheduleData);
      Auth.showToast('Escala atualizada com sucesso!', 'success');
    } else {
      // Criar nova escala
      result = await API.schedules.create(scheduleData);
      Auth.showToast('Escala criada com sucesso!', 'success');
    }
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
    modal.hide();
    
    // Recarregar dados
    await loadSchedulesData();
  } catch (error) {
    console.error('Erro ao salvar escala:', error);
    Auth.showToast(`Erro ao salvar escala: ${error.message}`, 'danger');
  }
}

// Editar escala
async function editSchedule(scheduleId) {
  try {
    // Buscar dados da escala
    const schedule = schedulesList.find(s => s.id === scheduleId);
    
    if (!schedule) {
      Auth.showToast('Escala não encontrada', 'warning');
      return;
    }
    
    // Carregar tipos de escala
    await loadScheduleTypes();
    
    // Preencher formulário
    document.getElementById('schedule-id').value = schedule.id;
    document.getElementById('schedule-type').value = schedule.type_id;
    document.getElementById('schedule-title').value = schedule.title;
    document.getElementById('schedule-start-date').value = schedule.start_date;
    document.getElementById('schedule-end-date').value = schedule.end_date;
    document.getElementById('schedule-status').value = schedule.status;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    modal.show();
  } catch (error) {
    console.error('Erro ao editar escala:', error);
    Auth.showToast('Erro ao carregar dados da escala', 'danger');
  }
}

// Visualizar escala
async function viewSchedule(scheduleId) {
  try {
    // Buscar detalhes da escala
    const schedule = await API.schedules.getById(scheduleId);
    
    if (!schedule) {
      Auth.showToast('Escala não encontrada', 'warning');
      return;
    }
    
    // Implementação futura - exibir detalhes da escala em uma página específica
    Auth.showToast('Funcionalidade em desenvolvimento', 'info');
  } catch (error) {
    console.error('Erro ao visualizar escala:', error);
    Auth.showToast('Erro ao carregar detalhes da escala', 'danger');
  }
}

// Gerar escala automaticamente
async function generateSchedule(scheduleId) {
  try {
    // Confirmar geração
    if (!confirm('Tem certeza que deseja gerar esta escala automaticamente? Isso pode substituir atribuições existentes.')) {
      return;
    }
    
    // Gerar escala
    const result = await API.schedules.generate(scheduleId);
    
    // Recarregar dados
    await loadSchedulesData();
    
    Auth.showToast(`Escala gerada com sucesso! ${result.events.length} eventos criados.`, 'success');
  } catch (error) {
    console.error('Erro ao gerar escala:', error);
    Auth.showToast(`Erro ao gerar escala: ${error.message}`, 'danger');
  }
}

// Excluir escala
async function deleteSchedule(scheduleId) {
  try {
    // Confirmar exclusão
    if (!confirm('Tem certeza que deseja excluir esta escala? Todos os eventos e atribuições associados serão excluídos.')) {
      return;
    }
    
    // Excluir escala
    await API.schedules.delete(scheduleId);
    
    // Recarregar dados
    await loadSchedulesData();
    
    Auth.showToast('Escala excluída com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao excluir escala:', error);
    Auth.showToast(`Erro ao excluir escala: ${error.message}`, 'danger');
  }
}

// Salvar evento
async function saveEvent() {
  // Implementação futura
  Auth.showToast('Funcionalidade em desenvolvimento', 'info');
}

// Salvar atribuição
async function saveAssignment() {
  // Implementação futura
  Auth.showToast('Funcionalidade em desenvolvimento', 'info');
}

// Exportar funções para uso global
window.editMember = editMember;
window.deleteMember = deleteMember;
window.editSchedule = editSchedule;
window.viewSchedule = viewSchedule;
window.generateSchedule = generateSchedule;
window.deleteSchedule = deleteSchedule;
