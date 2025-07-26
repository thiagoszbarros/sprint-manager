// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Estado da aplicação
let currentEditingId = null;
let sprints = [];
let lastThreeSprintsChart = null;
let globalChart = null;

// Elementos DOM
const elements = {
    form: document.getElementById('sprintForm'),
    formTitle: document.getElementById('formTitle'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    addSprintBtn: document.getElementById('addSprintBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    sprintsList: document.getElementById('sprintsList'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    noSprintsMessage: document.getElementById('noSprintsMessage'),
    confirmModal: document.getElementById('confirmModal'),
    sprintFormModal: document.getElementById('sprintFormModal'),
    closeFormModal: document.getElementById('closeFormModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    toast: document.getElementById('toast'),
    // Dashboard elements
    dashboardTab: document.getElementById('dashboardTab'),
    manageTab: document.getElementById('manageTab'),
    dashboardSection: document.getElementById('dashboardSection'),
    manageSection: document.getElementById('manageSection'),
    dashboardAssigneeId: document.getElementById('dashboardAssigneeId'),
    loadDashboardBtn: document.getElementById('loadDashboardBtn'),
    chartsContainer: document.getElementById('chartsContainer'),
    emptyDashboard: document.getElementById('emptyDashboard'),
    assigneeNameDisplay: document.getElementById('assigneeNameDisplay'),
    totalSprintsCount: document.getElementById('totalSprintsCount'),
    avgProductivity: document.getElementById('avgProductivity'),
    avgAccuracy: document.getElementById('avgAccuracy')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se todos os elementos críticos existem
    const criticalElements = [
        'dashboardTab', 'manageTab', 
        'dashboardSection', 'manageSection'
    ];
    
    let missingElements = [];
    criticalElements.forEach(elementName => {
        const element = document.getElementById(elementName);
        if (!element) {
            missingElements.push(elementName);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Elementos não encontrados:', missingElements);
    }
    
    initializeEventListeners();
    initializeTabs();
    loadSprints();
    
    // Configurar valor padrão para o dashboard
    initializeDefaultDashboard();
});

// Event Listeners
function initializeEventListeners() {
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.clearSearchBtn.addEventListener('click', handleClearSearch);
    elements.addSprintBtn.addEventListener('click', openFormModal);
    elements.refreshBtn.addEventListener('click', loadSprints);
    elements.cancelBtn.addEventListener('click', cancelFormModal);
    elements.closeFormModal.addEventListener('click', cancelFormModal);
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    elements.cancelDeleteBtn.addEventListener('click', closeModal);
    
    // Dashboard events
    elements.dashboardTab.addEventListener('click', () => switchTab('dashboard'));
    elements.manageTab.addEventListener('click', () => switchTab('manage'));
    elements.loadDashboardBtn.addEventListener('click', loadDashboard);
    
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    elements.dashboardAssigneeId.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadDashboard();
        }
    });

    // Ocultar nome do responsável quando o campo for limpo
    elements.dashboardAssigneeId.addEventListener('input', function(e) {
        if (!e.target.value.trim() && elements.assigneeNameDisplay) {
            elements.assigneeNameDisplay.classList.remove('visible');
        }
    });

    // Fechar modal ao clicar fora
    elements.confirmModal.addEventListener('click', function(e) {
        if (e.target === elements.confirmModal) {
            closeModal();
        }
    });

    // Fechar modal do formulário ao clicar fora
    elements.sprintFormModal.addEventListener('click', function(e) {
        if (e.target === elements.sprintFormModal) {
            cancelFormModal();
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

// Funções do modal do formulário
function openFormModal() {
    resetForm();
    elements.sprintFormModal.classList.add('show');
    elements.cancelBtn.style.display = 'inline-block';
}

function closeFormModal() {
    elements.sprintFormModal.classList.remove('show');
    // Não chamar resetForm aqui para preservar o currentEditingId durante a edição
}

function cancelFormModal() {
    elements.sprintFormModal.classList.remove('show');
    resetForm();
}

function openEditModal(sprint) {
    // Preencher formulário com dados do sprint
    document.getElementById('assigneeId').value = sprint.assignee_id;
    document.getElementById('sprintName').value = sprint.name;
    document.getElementById('sprintNumber').value = sprint.sprint;
    
    // Preencher produtividade
    document.getElementById('productivityFactory').value = sprint.productivity?.factory || '';
    document.getElementById('productivitySustain').value = sprint.productivity?.sustain || '';
    document.getElementById('productivityBi').value = sprint.productivity?.bi || '';
    
    // Preencher acurácia
    document.getElementById('accuracyFactory').value = sprint.accuracy?.factory || '';
    document.getElementById('accuracySustain').value = sprint.accuracy?.sustain || '';
    document.getElementById('accuracyBi').value = sprint.accuracy?.bi || '';
    
    currentEditingId = sprint._id;
    console.log('currentEditingId definido como:', currentEditingId);
    
    elements.formTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Sprint';
    elements.cancelBtn.style.display = 'inline-block';
    elements.sprintFormModal.classList.add('show');
}

// Handlers de eventos
async function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('Iniciando submit do formulário');
    console.log('currentEditingId:', currentEditingId);
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    
    try {
        // Loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        const formData = getFormData();



        if (currentEditingId) {
            result = await updateSprint(currentEditingId, formData);
            showToast('Sprint atualizado com sucesso!', 'success');
        } else {
            result = await createSprint(formData);
            showToast('Sprint criado com sucesso!', 'success');
        }

        // Fechar modal e resetar apenas após sucesso
        elements.sprintFormModal.classList.remove('show');
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
        openEditModal(sprint);
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
    const formatPercentage = (value) => value !== null && value !== undefined ? `${value}%` : 'N/A';
    const getProgressWidth = (value) => value !== null && value !== undefined ? value : 0;
    
    return `
        <div class="sprint-card">
            <div class="sprint-header">
                <div class="sprint-info">
                    <h3><i class="fas fa-rocket"></i> ${sprint.name}</h3>
                    <p><strong>Sprint:</strong> ${sprint.sprint} | <strong>Responsável:</strong> ${sprint.assignee_id} 
                        <button class="btn-copy" onclick="copyToClipboard('${sprint.assignee_id}')" title="Copiar Assignee ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </p>
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
                        <div class="metric-item-progress">
                            <div class="metric-label">
                                <span>Fábrica</span>
                                <span class="metric-percentage">${formatPercentage(sprint.productivity?.factory)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${sprint.productivity?.factory === null ? 'null' : ''}" 
                                     style="width: ${getProgressWidth(sprint.productivity?.factory)}%"></div>
                            </div>
                        </div>
                        <div class="metric-item-progress">
                            <div class="metric-label">
                                <span>Sustentação</span>
                                <span class="metric-percentage">${formatPercentage(sprint.productivity?.sustain)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${sprint.productivity?.sustain === null ? 'null' : ''}" 
                                     style="width: ${getProgressWidth(sprint.productivity?.sustain)}%"></div>
                            </div>
                        </div>
                        <div class="metric-item-progress">
                            <div class="metric-label">
                                <span>BI</span>
                                <span class="metric-percentage">${formatPercentage(sprint.productivity?.bi)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${sprint.productivity?.bi === null ? 'null' : ''}" 
                                     style="width: ${getProgressWidth(sprint.productivity?.bi)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="metric-group">
                    <h4><i class="fas fa-bullseye"></i> Acurácia</h4>
                    <div class="metric-items">
                        <div class="metric-item-progress">
                            <div class="metric-label">
                                <span>Fábrica</span>
                                <span class="metric-percentage">${formatPercentage(sprint.accuracy?.factory)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${sprint.accuracy?.factory === null ? 'null' : ''}" 
                                     style="width: ${getProgressWidth(sprint.accuracy?.factory)}%"></div>
                            </div>
                        </div>
                        <div class="metric-item-progress">
                            <div class="metric-label">
                                <span>Sustentação</span>
                                <span class="metric-percentage">${formatPercentage(sprint.accuracy?.sustain)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${sprint.accuracy?.sustain === null ? 'null' : ''}" 
                                     style="width: ${getProgressWidth(sprint.accuracy?.sustain)}%"></div>
                            </div>
                        </div>
                        <div class="metric-item-progress">
                            <div class="metric-label">
                                <span>BI</span>
                                <span class="metric-percentage">${formatPercentage(sprint.accuracy?.bi)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${sprint.accuracy?.bi === null ? 'null' : ''}" 
                                     style="width: ${getProgressWidth(sprint.accuracy?.bi)}%"></div>
                            </div>
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

// Função para copiar texto para a área de transferência
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Assignee ID copiado: ${text}`, 'success');
    }).catch((err) => {
        console.error('Erro ao copiar para a área de transferência:', err);
        showToast('Erro ao copiar texto', 'error');
    });
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 4000);
}

// === DASHBOARD FUNCTIONS ===

async function fetchDefaultAssigneeId() {
    try {
        const response = await apiRequest('/config');
        return response.data.defaultAssigneeId;
    } catch (error) {
        console.error('Erro ao buscar configuração padrão:', error);
        throw error;
    }
}

function initializeDefaultDashboard() {
    // Garantir que o nome do responsável comece oculto
    if (elements.assigneeNameDisplay) {
        elements.assigneeNameDisplay.classList.remove('visible');
    }
    
    // Buscar o Assignee ID padrão da configuração da API
    fetchDefaultAssigneeId().then(defaultAssigneeId => {
        if (elements.dashboardAssigneeId && defaultAssigneeId) {
            elements.dashboardAssigneeId.value = defaultAssigneeId;
            // Carregar o dashboard automaticamente
            setTimeout(() => {
                loadDashboard();
            }, 500); // Pequeno delay para garantir que a página esteja totalmente carregada
        }
    }).catch(error => {
        console.error('Erro ao buscar Assignee ID padrão:', error);
    });
}

function initializeTabs() {
    // Verificar se todos os elementos existem antes de configurar as abas
    if (elements.dashboardTab && elements.manageTab && 
        elements.dashboardSection && elements.manageSection) {
        // Iniciar com a aba do dashboard
        switchTab('dashboard');
    } else {
        console.error('Elementos de navegação não encontrados');
    }
}

function switchTab(tab) {
    if (tab === 'dashboard') {
        if (elements.dashboardTab) elements.dashboardTab.classList.add('active');
        if (elements.manageTab) elements.manageTab.classList.remove('active');
        if (elements.dashboardSection) elements.dashboardSection.classList.add('active');
        if (elements.manageSection) elements.manageSection.classList.remove('active');
    } else if (tab === 'manage') {
        if (elements.manageTab) elements.manageTab.classList.add('active');
        if (elements.dashboardTab) elements.dashboardTab.classList.remove('active');
        if (elements.manageSection) elements.manageSection.classList.add('active');
        if (elements.dashboardSection) elements.dashboardSection.classList.remove('active');
        
        // Limpar o nome do responsável quando sair do dashboard
        if (elements.assigneeNameDisplay) {
            elements.assigneeNameDisplay.classList.remove('visible');
        }
    }
}

async function loadDashboard() {
    const assigneeId = elements.dashboardAssigneeId.value.trim();
    
    if (!assigneeId) {
        showToast('Por favor, digite um Assignee ID', 'error');
        return;
    }

    try {
        elements.emptyDashboard.style.display = 'none';
        elements.chartsContainer.style.display = 'none';
        
        // Esconder o nome do responsável durante o carregamento
        if (elements.assigneeNameDisplay) {
            elements.assigneeNameDisplay.classList.remove('visible');
        }
        
        // Mostrar loading
        showToast('Carregando dados do dashboard...', 'info');
        
        const response = await apiRequest(`/sprints/dashboard/${assigneeId}`);
        const data = response.data;
        
        // Atualizar o nome do responsável no título
        if (elements.assigneeNameDisplay) {
            elements.assigneeNameDisplay.textContent = `- ${response.data.lastThreeSprints[0].name}`;
            elements.assigneeNameDisplay.classList.add('visible');
        }
        
        // Atualizar estatísticas
        //updateStats(data);
        
        // Criar gráficos
        createCharts(data);
        
        // Mostrar container dos gráficos
        elements.chartsContainer.style.display = 'block';
        
        showToast('Dashboard carregado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showToast(error.message || 'Erro ao carregar dashboard', 'error');
        elements.emptyDashboard.style.display = 'block';
        elements.chartsContainer.style.display = 'none';
        
        // Esconder o nome do responsável em caso de erro
        if (elements.assigneeNameDisplay) {
            elements.assigneeNameDisplay.classList.remove('visible');
        }
    }
}

function updateStats(data) {
    elements.totalSprintsCount.textContent = data.totalSprints;
    
    // Calcular média geral de produtividade
    const avgProd = Math.round(
        (data.globalAverages.productivity.factory + 
         data.globalAverages.productivity.sustain + 
         data.globalAverages.productivity.bi) / 3
    );
    
    // Calcular média geral de acurácia
    const avgAcc = Math.round(
        (data.globalAverages.accuracy.factory + 
         data.globalAverages.accuracy.sustain + 
         data.globalAverages.accuracy.bi) / 3
    );
    
    elements.avgProductivity.textContent = `${avgProd}%`;
    elements.avgAccuracy.textContent = `${avgAcc}%`;
}

function createCharts(data) {
    // Destruir gráficos existentes
    if (lastThreeSprintsChart) {
        lastThreeSprintsChart.destroy();
    }
    if (globalChart) {
        globalChart.destroy();
    }
    
    // Configuração comum dos gráficos
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            }
        }
    };
    
    // Gráfico das últimas 2 sprints
    createlastThreeSprintsChart(data.lastThreeSprints, commonOptions);
    
    // Gráfico global
    createGlobalChart(data.globalAverages, commonOptions);
}

function createlastThreeSprintsChart(lastThreeSprints, commonOptions) {
    const ctx = document.getElementById('lastThreeSprintsChart').getContext('2d');
    
    // Preparar dados - inverter ordem para que a mais recente apareça à direita
    const labels = ['Fábrica', 'Sustentação', 'BI'];
    const datasets = [];
    
    // Inverter a ordem das sprints para que a mais recente apareça à direita
    const reversedSprints = [...lastThreeSprints].reverse();
    
    reversedSprints.forEach((sprint, index) => {
        const sprintLabel = `Sprint ${sprint.sprint}`;
        // Definir 3 cores diferentes para as sprints
        let productivityColor;
        if (index === 0) {
            productivityColor = 'rgba(102, 126, 234, 0.8)';
        } else if (index === 1) {
            productivityColor = 'rgba(167, 34, 197, 0.8)';  
        } else {
            productivityColor = 'rgba(193, 239, 68, 0.8)';
        }
        // const accuracyColor = index === 0 ? 'rgba(102, 126, 234, 0.4)' : 'rgba(118, 75, 162, 0.4)';
        
        // Produtividade
        datasets.push({
            label: `${sprintLabel} - Produtividade`,
            data: [
                sprint.productivity?.factory || 0,
                sprint.productivity?.sustain || 0,
                sprint.productivity?.bi || 0
            ],
            backgroundColor: productivityColor,
            borderColor: productivityColor.replace('0.8', '1'),
            borderWidth: 2
        });
        
        // Acurácia - COMENTADO
        /* datasets.push({
            label: `${sprintLabel} - Acurácia`,
            data: [
                sprint.accuracy?.factory || 0,
                sprint.accuracy?.sustain || 0,
                sprint.accuracy?.bi || 0
            ],
            backgroundColor: accuracyColor,
            borderColor: accuracyColor.replace('0.4', '1'),
            borderWidth: 2
        }); */
    });
    
    lastThreeSprintsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                title: {
                    display: true,
                    text: 'Comparação das Últimas Sprints'
                }
            }
        }
    });
}

function createGlobalChart(globalAverages, commonOptions) {
    const ctx = document.getElementById('globalChart').getContext('2d');
    
    const labels = ['Factory', 'Sustain', 'BI'];
    
    globalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Produtividade Média',
                    data: [
                        globalAverages.productivity.factory,
                        globalAverages.productivity.sustain,
                        globalAverages.productivity.bi
                    ],
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }
                // Acurácia Média - COMENTADO
                /* ,{
                    label: 'Acurácia Média',
                    data: [
                        globalAverages.accuracy.factory,
                        globalAverages.accuracy.sustain,
                        globalAverages.accuracy.bi
                    ],
                    backgroundColor: 'rgba(118, 75, 162, 0.8)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2
                } */
            ]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                title: {
                    display: true,
                    text: 'Médias Globais de Todas as Sprints'
                }
            }
        }
    });
}

async function getDashboardData(assigneeId) {
    return await apiRequest(`/sprints/dashboard/${assigneeId}`);
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
