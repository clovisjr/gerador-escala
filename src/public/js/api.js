// API.js - Funções para comunicação com o backend

// URL base da API
const API_BASE_URL = '/api';

// Objeto para armazenar funções de API
const API = {
  // Funções de autenticação
  auth: {
    // Login
    login: async (username, password) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao fazer login');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro no login:', error);
        throw error;
      }
    },
    
    // Obter perfil do usuário
    getProfile: async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar perfil');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        throw error;
      }
    },
    
    // Listar usuários (admin)
    getUsers: async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar usuários');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
    },
    
    // Criar usuário (admin)
    createUser: async (userData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar usuário');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
      }
    },
    
    // Atualizar usuário (admin)
    updateUser: async (userId, userData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar usuário');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
      }
    },
    
    // Excluir usuário (admin)
    deleteUser: async (userId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao excluir usuário');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        throw error;
      }
    },
    
    // Alterar senha
    changePassword: async (currentPassword, newPassword) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao alterar senha');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao alterar senha:', error);
        throw error;
      }
    }
  },
  
  // Funções de membros
  members: {
    // Listar todos os membros
    getAll: async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar membros');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar membros:', error);
        throw error;
      }
    },
    
    // Obter um membro específico
    getById: async (memberId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar membro');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar membro:', error);
        throw error;
      }
    },
    
    // Criar um novo membro
    create: async (memberData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(memberData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar membro');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao criar membro:', error);
        throw error;
      }
    },
    
    // Atualizar um membro existente
    update: async (memberId, memberData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(memberData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar membro');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao atualizar membro:', error);
        throw error;
      }
    },
    
    // Excluir um membro
    delete: async (memberId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao excluir membro');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao excluir membro:', error);
        throw error;
      }
    },
    
    // Obter membros por ministério
    getByMinistry: async (ministry) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/members/ministry/${ministry}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar membros por ministério');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar membros por ministério:', error);
        throw error;
      }
    },
    
    // Obter membros por função
    getByRole: async (role) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/members/role/${role}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar membros por função');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar membros por função:', error);
        throw error;
      }
    }
  },
  
  // Funções de escalas
  schedules: {
    // Obter tipos de escala
    getTypes: async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/schedules/types`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar tipos de escala');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar tipos de escala:', error);
        throw error;
      }
    },
    
    // Listar todas as escalas
    getAll: async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/schedules`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar escalas');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar escalas:', error);
        throw error;
      }
    },
    
    // Obter uma escala específica
    getById: async (scheduleId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar escala');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar escala:', error);
        throw error;
      }
    },
    
    // Criar uma nova escala
    create: async (scheduleData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/schedules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar escala');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao criar escala:', error);
        throw error;
      }
    },
    
    // Atualizar uma escala existente
    update: async (scheduleId, scheduleData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar escala');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao atualizar escala:', error);
        throw error;
      }
    },
    
    // Excluir uma escala
    delete: async (scheduleId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao excluir escala');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao excluir escala:', error);
        throw error;
      }
    },
    
    // Gerar escala automaticamente
    generate: async (scheduleId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao gerar escala');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao gerar escala:', error);
        throw error;
      }
    }
  },
  
  // Funções de eventos
  events: {
    // Listar todos os eventos
    getAll: async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar eventos');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        throw error;
      }
    },
    
    // Obter eventos por escala
    getBySchedule: async (scheduleId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events/schedule/${scheduleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar eventos por escala');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar eventos por escala:', error);
        throw error;
      }
    },
    
    // Obter um evento específico
    getById: async (eventId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar evento');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
        throw error;
      }
    },
    
    // Criar um novo evento
    create: async (eventData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar evento');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao criar evento:', error);
        throw error;
      }
    },
    
    // Atualizar um evento existente
    update: async (eventId, eventData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar evento');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        throw error;
      }
    },
    
    // Excluir um evento
    delete: async (eventId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao excluir evento');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        throw error;
      }
    },
    
    // Adicionar atribuição a um evento
    addAssignment: async (eventId, assignmentData) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(assignmentData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao adicionar atribuição');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao adicionar atribuição:', error);
        throw error;
      }
    },
    
    // Remover atribuição de um evento
    removeAssignment: async (eventId, assignmentId) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/assignments/${assignmentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao remover atribuição');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao remover atribuição:', error);
        throw error;
      }
    }
  },
  
  // Funções de configurações
  settings: {
    // Obter todas as configurações
    getAll: async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar configurações');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }
    },
    
    // Obter uma configuração específica
    getByKey: async (key) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar configuração');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        throw error;
      }
    },
    
    // Atualizar uma configuração
    update: async (key, value, description) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ value, description })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar configuração');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        throw error;
      }
    },
    
    // Obter informações da igreja
    getChurchInfo: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/church/info`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao buscar informações da igreja');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar informações da igreja:', error);
        throw error;
      }
    }
  }
};

// Exportar o objeto API
window.API = API;
