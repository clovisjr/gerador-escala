// auth.js - Funções para autenticação e gerenciamento de usuários

// Verificar se o usuário está autenticado
function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// Obter o token de autenticação
function getToken() {
  return localStorage.getItem('token');
}

// Salvar token e informações do usuário
function setAuthData(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

// Obter informações do usuário
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Verificar se o usuário é administrador
function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// Fazer logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// Atualizar informações do usuário no localStorage
function updateUserInfo(userData) {
  localStorage.setItem('user', JSON.stringify(userData));
}

// Inicializar autenticação
async function initAuth() {
  // Verificar se o usuário está autenticado
  if (isAuthenticated()) {
    try {
      // Tentar obter perfil do usuário para validar o token
      const userProfile = await API.auth.getProfile();
      updateUserInfo(userProfile);
      
      // Mostrar interface principal
      showMainInterface();
      
      // Carregar informações da igreja
      loadChurchInfo();
      
      // Mostrar/ocultar elementos baseados no papel do usuário
      updateUIByUserRole();
      
      return true;
    } catch (error) {
      console.error('Erro ao validar autenticação:', error);
      
      // Token inválido ou expirado, fazer logout
      logout();
      return false;
    }
  } else {
    // Mostrar tela de login
    showLoginScreen();
    return false;
  }
}

// Mostrar tela de login
function showLoginScreen() {
  // Ocultar sidebar e conteúdo principal
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('schedules-container').style.display = 'none';
  document.getElementById('members-container').style.display = 'none';
  
  // Mostrar formulário de login
  document.getElementById('login-container').style.display = 'block';
  
  // Configurar manipulador de evento para o formulário de login
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Mostrar interface principal
function showMainInterface() {
  // Ocultar formulário de login
  document.getElementById('login-container').style.display = 'none';
  
  // Mostrar sidebar
  document.getElementById('sidebar').style.display = 'block';
  
  // Mostrar dashboard por padrão
  document.getElementById('dashboard-container').style.display = 'block';
  
  // Carregar dados do dashboard
  loadDashboardData();
}

// Manipular envio do formulário de login
async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    // Desabilitar botão de login durante a requisição
    const loginButton = event.target.querySelector('button[type="submit"]');
    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';
    
    // Fazer login
    const authData = await API.auth.login(username, password);
    
    // Salvar dados de autenticação
    setAuthData(authData);
    
    // Mostrar interface principal
    showMainInterface();
    
    // Mostrar/ocultar elementos baseados no papel do usuário
    updateUIByUserRole();
    
    // Carregar informações da igreja
    loadChurchInfo();
    
    // Exibir mensagem de sucesso
    showToast('Login realizado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro no login:', error);
    
    // Exibir mensagem de erro
    showToast('Erro no login: ' + (error.message || 'Credenciais inválidas'), 'danger');
  } finally {
    // Reabilitar botão de login
    const loginButton = event.target.querySelector('button[type="submit"]');
    loginButton.disabled = false;
    loginButton.textContent = 'Entrar';
  }
}

// Atualizar elementos da interface baseado no papel do usuário
function updateUIByUserRole() {
  const isUserAdmin = isAdmin();
  
  // Elementos visíveis apenas para administradores
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(element => {
    element.style.display = isUserAdmin ? 'block' : 'none';
  });
}

// Carregar informações da igreja
async function loadChurchInfo() {
  try {
    const churchInfo = await API.settings.getChurchInfo();
    
    // Atualizar nome da igreja na sidebar
    document.getElementById('church-name').textContent = churchInfo.name;
    
    // Atualizar título da página
    document.title = `Sistema de Escalas - ${churchInfo.name}`;
  } catch (error) {
    console.error('Erro ao carregar informações da igreja:', error);
  }
}

// Exibir mensagem toast
function showToast(message, type = 'info') {
  // Verificar se o container de toasts existe
  let toastContainer = document.querySelector('.toast-container');
  
  // Se não existir, criar
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Criar elemento toast
  const toastElement = document.createElement('div');
  toastElement.className = `toast bg-${type} text-white`;
  toastElement.innerHTML = `
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // Adicionar ao container
  toastContainer.appendChild(toastElement);
  
  // Exibir toast
  const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
  toast.show();
  
  // Remover após fechar
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// Exportar funções
window.Auth = {
  isAuthenticated,
  getToken,
  getUser,
  isAdmin,
  logout,
  initAuth,
  showToast
};
