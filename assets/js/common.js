// Função de logout
function logout() {
    console.log('=== LOGOUT INICIADO ===');
    alert('Fazendo logout...');
    
    try {
        // Limpar dados do localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('LocalStorage limpo');
        
        // Redirecionar para login
        console.log('Redirecionando para login...');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Erro no logout:', error);
        alert('Erro no logout: ' + error.message);
    }
}

// Tornar função global
window.logout = logout;

// Função para verificar autenticação
async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/login.html';
        return null;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        
        return JSON.parse(user);
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return null;
    }
}

// Função para cancelar agendamento
async function cancelBooking(bookingId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Agendamento cancelado com sucesso!');
            location.reload();
        } else {
            alert('Erro ao cancelar agendamento: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        alert('Erro ao cancelar agendamento. Tente novamente.');
    }
}

// Função para carregar histórico de agendamentos
async function loadBookingHistory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/bookings/history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            console.error('Erro ao carregar histórico:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        return [];
    }
}

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Função para formatar hora
function formatTime(timeString) {
    return timeString.substring(0, 5);
}

// Função para formatar status
function formatStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'cancelado': 'Cancelado',
        'concluido': 'Concluído'
    };
    return statusMap[status] || status;
}

// Função para obter cor do status
function getStatusColor(status) {
    const colorMap = {
        'pendente': '#ffc107',
        'confirmado': '#28a745',
        'cancelado': '#dc3545',
        'concluido': '#6c757d'
    };
    return colorMap[status] || '#6c757d';
}

