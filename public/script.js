// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Estado da aplicação
let currentEditingId = null;
let sprints = [];

// Elementos DOM
const elements = {
    form: document.getElementById('sprintForm'),
    formTitle: document.getElementById('formTitle'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    sprintsList: document.getElementById('sprintsList'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    noSprintsMessage: document.getElementById('noSprintsMessage'),
    confirmModal: document.getElementById('confirmModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    toast: document.getElementById('toast')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadSprints();
});

// Event Listeners
function initializeEventListeners() {
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.clearSearchBtn.addEventListener('click', handleClearSearch);
    elements.refreshBtn.addEventListener('click', loadSprints);
    elements.cancelBtn.addEventListener('click', resetForm);
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    elements.cancelDeleteBtn.addEventListener('click', closeModal);
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Fechar modal ao clicar fora
    elements.confirmModal.addEventListener('click', function(e) {
        if (e.target === elements.confirmModal) {
            closeModal();
        }
    });
}

// Funções da API
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

async function createSprint(sprintData) {
    return await apiRequest('/sprints', {
        method: 'POST',
        body: JSON.stringify(sprintData)
    });
}

async function updateSprint(id, sprintData) {
    return await apiRequest(`/sprints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sprintData)
    });
}

async function deleteSprint(id) {
    return await apiRequest(`/sprints/${id}`, {
        method: 'DELETE'
    });
}

async function getSprints() {
    return await apiRequest('/sprints');
}

async function searchSprints(query) {
    // Implementar busca local nos dados já carregados
    const searchTerm = query.toLowerCase();
    return sprints.filter(sprint => 
        sprint.name.toLowerCase().includes(searchTerm) ||
        sprint.assignee_id.toLowerCase().includes(searchTerm) ||
        sprint.sprint.toString().includes(searchTerm)
    );
}

// Funções de manipulação do formulário
function getFormData() {
    const formData = {
        assignee_id: document.getElementById('assigneeId').value.trim(),
        name: document.getElementById('sprintName').value.trim(),
        sprint: parseInt(document.getElementById('sprintNumber').value),
        productivity: {},
        accuracy: {}
    };

    // Produtividade
    const prodFactory = document.getElementById('productivityFactory').value;
    const prodSustain = document.getElementById('productivitySustain').value;
    const prodBi = document.getElementById('productivityBi').value;

    formData.productivity.factory = prodFactory ? parseInt(prodFactory) : null;
    formData.productivity.sustain = prodSustain ? parseInt(prodSustain) : null;
    formData.productivity.bi = prodBi ? parseInt(prodBi) : null;

    // Acurácia
    const accFactory = document.getElementById('accuracyFactory').value;
    const accSustain = document.getElementById('accuracySustain').value;
    const accBi = document.getElementById('accuracyBi').value;

    formData.accuracy.factory = accFactory ? parseInt(accFactory) : null;
    formData.accuracy.sustain = accSustain ? parseInt(accSustain) : null;
    formData.accuracy.bi = accBi ? parseInt(accBi) : null;

    return formData;
}

function fillForm(sprint) {
    document.getElementById('assigneeId').value = sprint.assignee_id;
    document.getElementById('sprintName').value = sprint.name;
    document.getElementById('sprintNumber').value = sprint.sprint;

    // Produtividade
    document.getElementById('productivityFactory').value = sprint.productivity?.factory || '';
    document.getElementById('productivitySustain').value = sprint.productivity?.sustain || '';
    document.getElementById('productivityBi').value = sprint.productivity?.bi || '';

    // Acurácia
    document.getElementById('accuracyFactory').value = sprint.accuracy?.factory || '';
    document.getElementById('accuracySustain').value = sprint.accuracy?.sustain || '';
    document.getElementById('accuracyBi').value = sprint.accuracy?.bi || '';
}

function resetForm() {
    elements.form.reset();
    currentEditingId = null;
    elements.formTitle.innerHTML = '<i class="fas fa-plus"></i> Novo Sprint';
    elements.cancelBtn.style.display = 'none';
}

// Handlers de eventos
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    
    try {
        // Loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        const formData = getFormData();

        let result;
        if (currentEditingId) {
            result = await updateSprint(currentEditingId, formData);
            showToast('Sprint atualizado com sucesso!', 'success');
        } else {
            result = await createSprint(formData);
            showToast('Sprint criado com sucesso!', 'success');
        }

        resetForm();
        await loadSprints();

    } catch (error) {
        console.error('Erro ao salvar sprint:', error);
        showToast(error.message || 'Erro ao salvar sprint', 'error');
    } finally {
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
    }
}

async function handleSearch() {
    const query = elements.searchInput.value.trim();
    
    if (!query) {
        await loadSprints();
        return;
    }

    try {
        showLoading();
        const filteredSprints = await searchSprints(query);
        displaySprints(filteredSprints);
        
        if (filteredSprints.length === 0) {
            showToast('Nenhum sprint encontrado para a busca', 'info');
        }
    } catch (error) {
        console.error('Erro na busca:', error);
        showToast('Erro ao buscar sprints', 'error');
        hideLoading();
    }
}

function handleClearSearch() {
    elements.searchInput.value = '';
    loadSprints();
}

function handleEdit(id) {
    const sprint = sprints.find(s => s._id === id);
    if (sprint) {
        fillForm(sprint);
        currentEditingId = id;
        elements.formTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Sprint';
        elements.cancelBtn.style.display = 'inline-flex';
        
        // Scroll para o formulário
        document.querySelector('.form-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

function handleDelete(id) {
    currentEditingId = id;
    elements.confirmModal.classList.add('show');
}

async function confirmDelete() {
    if (!currentEditingId) return;

    try {
        const deleteBtn = elements.confirmDeleteBtn;
        const originalContent = deleteBtn.innerHTML;
        
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
        deleteBtn.disabled = true;

        await deleteSprint(currentEditingId);
        showToast('Sprint excluído com sucesso!', 'success');
        
        await loadSprints();
        closeModal();

    } catch (error) {
        console.error('Erro ao excluir sprint:', error);
        showToast(error.message || 'Erro ao excluir sprint', 'error');
    } finally {
        elements.confirmDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Excluir';
        elements.confirmDeleteBtn.disabled = false;
    }
}

function closeModal() {
    elements.confirmModal.classList.remove('show');
    currentEditingId = null;
}

// Funções de display
async function loadSprints() {
    try {
        showLoading();
        const response = await getSprints();
        sprints = response.data || [];
        displaySprints(sprints);
    } catch (error) {
        console.error('Erro ao carregar sprints:', error);
        showToast('Erro ao carregar sprints', 'error');
        displaySprints([]);
    }
}

function displaySprints(sprintsToShow) {
    hideLoading();
    
    if (!sprintsToShow || sprintsToShow.length === 0) {
        elements.sprintsList.innerHTML = '';
        elements.noSprintsMessage.style.display = 'block';
        return;
    }

    elements.noSprintsMessage.style.display = 'none';
    
    const sprintsHTML = sprintsToShow.map(sprint => createSprintCard(sprint)).join('');
    elements.sprintsList.innerHTML = sprintsHTML;
}

function createSprintCard(sprint) {
    const formatValue = (value) => value !== null && value !== undefined ? value : 'N/A';
    
    return `
        <div class="sprint-card">
            <div class="sprint-header">
                <div class="sprint-info">
                    <h3><i class="fas fa-rocket"></i> ${sprint.name}</h3>
                    <p><strong>Sprint:</strong> ${sprint.sprint} | <strong>Assignee:</strong> ${sprint.assignee_id}</p>
                </div>
                <div class="sprint-actions">
                    <button class="btn btn-edit" onclick="handleEdit('${sprint._id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger" onclick="handleDelete('${sprint._id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-group">
                    <h4><i class="fas fa-chart-line"></i> Produtividade</h4>
                    <div class="metric-items">
                        <div class="metric-item">
                            <span>Factory:</span>
                            <span class="metric-value ${sprint.productivity?.factory === null ? 'null' : ''}">
                                ${formatValue(sprint.productivity?.factory)}
                            </span>
                        </div>
                        <div class="metric-item">
                            <span>Sustain:</span>
                            <span class="metric-value ${sprint.productivity?.sustain === null ? 'null' : ''}">
                                ${formatValue(sprint.productivity?.sustain)}
                            </span>
                        </div>
                        <div class="metric-item">
                            <span>BI:</span>
                            <span class="metric-value ${sprint.productivity?.bi === null ? 'null' : ''}">
                                ${formatValue(sprint.productivity?.bi)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="metric-group">
                    <h4><i class="fas fa-bullseye"></i> Acurácia</h4>
                    <div class="metric-items">
                        <div class="metric-item">
                            <span>Factory:</span>
                            <span class="metric-value ${sprint.accuracy?.factory === null ? 'null' : ''}">
                                ${formatValue(sprint.accuracy?.factory)}
                            </span>
                        </div>
                        <div class="metric-item">
                            <span>Sustain:</span>
                            <span class="metric-value ${sprint.accuracy?.sustain === null ? 'null' : ''}">
                                ${formatValue(sprint.accuracy?.sustain)}
                            </span>
                        </div>
                        <div class="metric-item">
                            <span>BI:</span>
                            <span class="metric-value ${sprint.accuracy?.bi === null ? 'null' : ''}">
                                ${formatValue(sprint.accuracy?.bi)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showLoading() {
    elements.loadingSpinner.style.display = 'block';
    elements.sprintsList.style.display = 'none';
    elements.noSprintsMessage.style.display = 'none';
}

function hideLoading() {
    elements.loadingSpinner.style.display = 'none';
    elements.sprintsList.style.display = 'block';
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 4000);
}

// Função para verificar se a API está disponível
async function checkAPIStatus() {
    try {
        await fetch(`${API_BASE_URL.replace('/api', '')}/api/status`);
        return true;
    } catch (error) {
        showToast('Erro: API não está disponível. Verifique se o servidor está rodando.', 'error');
        return false;
    }
}

// Verificar status da API ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
    const apiAvailable = await checkAPIStatus();
    if (!apiAvailable) {
        elements.sprintsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Servidor não está disponível</p>
                <p>Execute: <code>npm start</code> no diretório do projeto</p>
            </div>
        `;
    }
});
