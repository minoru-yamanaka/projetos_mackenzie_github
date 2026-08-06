// Mapeamento inicial das pastas locais do workspace para fallback do LocalStorage
const INITIAL_PROJECTS = [
    {
        id: "proj_carometro",
        name: "Carômetro Mackenzie",
        description: "Sistema interno para visualização de fotos e perfis de alunos e professores, facilitando a identificação rápida e organizada no ambiente acadêmico.",
        techs: ["Node.js", "Express", "JavaScript", "SQL", "CSS"],
        creationDate: "2026-06-01",
        date: "2026-06-30",
        isLocalDir: true,
        dirName: "SITE_CAROMETRO"
    },
    {
        id: "proj_chatbot",
        name: "Chatbot Mackenzie - Desenvolvimento",
        description: "Assistente virtual inteligente integrado para responder a dúvidas recorrentes de alunos sobre matrículas, salas, contatos e calendário acadêmico.",
        techs: ["JavaScript", "Node.js", "Chatbot", "AI", "HTML5"],
        creationDate: "2026-05-15",
        date: "2026-06-28",
        isLocalDir: true,
        dirName: "SITE_CHATBOT_MACKENZIE_DESENVOLVIMENTO"
    },
    {
        id: "proj_correcao",
        name: "Sistema de Correção de Provas",
        description: "Plataforma automatizada projetada para processar e corrigir cartões de respostas de provas objetivas de maneira ágil, gerando estatísticas de erros e acertos.",
        techs: ["Python", "JavaScript", "CSS", "SQLite"],
        creationDate: "2026-04-10",
        date: "2026-06-25",
        isLocalDir: true,
        dirName: "SITE_CORRECAO_DE_PROVAS"
    },
    {
        id: "proj_grade",
        name: "Grade Horária Semanal",
        description: "Interface interativa para visualização e planejamento de grades horárias semanais acadêmicas de turmas, evitando conflitos de horários de docentes.",
        techs: ["React", "TailwindCSS", "JavaScript", "LocalStorage"],
        creationDate: "2026-05-20",
        date: "2026-06-20",
        isLocalDir: true,
        dirName: "SITE_DE_GRADE_HORARIA_SEMANAL_DESENVOLVIMENTO"
    },
    {
        id: "proj_diario",
        name: "Diário Acadêmico Mackenzie",
        description: "Plataforma de diário de classe digital que permite a professores registrar frequências, notas de avaliações e planos de aula de maneira centralizada.",
        techs: ["PHP", "MySQL", "Bootstrap", "JavaScript"],
        creationDate: "2026-03-01",
        date: "2026-06-18",
        isLocalDir: true,
        dirName: "SITE_DIARIO_ACADEMICO_MACKENZIE_DESENVOLVIMENTO - Copia"
    },
    {
        id: "proj_documentos",
        name: "Central de Documentos Mackenzie",
        description: "Repositório digital e fluxo de trabalho para envio, validação e assinatura digital de documentos de estágio curricular e atividades complementares.",
        techs: ["Node.js", "MongoDB", "React", "Express"],
        creationDate: "2026-04-15",
        date: "2026-06-15",
        isLocalDir: true,
        dirName: "SITE_DOCUMENTOS"
    },
    {
        id: "proj_documentos_testes",
        name: "Ambiente de Testes - Documentos",
        description: "Ambiente isolado (Sandbox) para testes de integração, testes unitários e de carga da API de envio de documentos acadêmicos.",
        techs: ["Jest", "Node.js", "Supertest"],
        creationDate: "2026-05-01",
        date: "2026-06-10",
        isLocalDir: true,
        dirName: "SITE_DOCUMENTOS_TESTES"
    },
    {
        id: "proj_atividades",
        name: "Envio de Atividades Acadêmicas",
        description: "Portal de submissão de entregáveis e trabalhos acadêmicos para estudantes, integrado a um painel de avaliação para os professores.",
        techs: ["Node.js", "Express", "React", "Multer", "CSS"],
        creationDate: "2026-02-10",
        date: "2026-06-05",
        isLocalDir: true,
        dirName: "SITE_ENVIO_DE_ATIVIDADES"
    },
    {
        id: "proj_impressoes",
        name: "Gerenciador de Impressões Mackenzie",
        description: "Sistema para controle de cotas, envio de arquivos e gerenciamento da fila de impressão compartilhada nos laboratórios do Mackenzie.",
        techs: ["HTML5", "CSS3", "JavaScript", "WebSockets"],
        creationDate: "2026-01-15",
        date: "2026-06-01",
        isLocalDir: true,
        dirName: "SITE_ENVIO_DE_IMPRESSOES"
    },
    {
        id: "proj_academic_intelligence",
        name: "Mackenzie Academic Intelligence",
        description: "Painel inteligente que utiliza análise de dados para gerar insights sobre retenção de alunos, prever taxa de aprovação e recomendar ações preventivas.",
        techs: ["Python", "Flask", "Pandas", "Scikit-learn", "React"],
        creationDate: "2026-04-01",
        date: "2026-05-28",
        isLocalDir: true,
        dirName: "SITE_MACKENZIE_ACADEMIC_INTELLIGENCE"
    }
];

const LOCAL_FOLDERS_LIST = [
    "SITE_CAROMETRO",
    "SITE_CHATBOT_MACKENZIE_DESENVOLVIMENTO",
    "SITE_CORRECAO_DE_PROVAS",
    "SITE_DE_GRADE_HORARIA_SEMANAL_DESENVOLVIMENTO",
    "SITE_DIARIO_ACADEMICO_MACKENZIE_DESENVOLVIMENTO - Copia",
    "SITE_DOCUMENTOS",
    "SITE_DOCUMENTOS_TESTES",
    "SITE_ENVIO_DE_ATIVIDADES",
    "SITE_ENVIO_DE_IMPRESSOES",
    "SITE_MACKENZIE_ACADEMIC_INTELLIGENCE"
];

// Gerenciamento de Estado
let projects = [];
let isServerConnected = false;
let activeRecencyFilter = null; // null = sem filtro | 'recente' | 'medio' | 'antigo'
const API_URL = '/api/projects';

// Elementos DOM
const projectsGrid = document.getElementById("projects-grid");
const emptyState = document.getElementById("empty-state");
const totalProjectsEl = document.getElementById("total-projects");
const totalTechsEl = document.getElementById("total-techs");
const totalCollaboratorsEl = document.getElementById("total-collaborators");
const visibleProjectsCountEl = document.getElementById("visible-projects-count");
const serverStatusEl = document.getElementById("server-status");

const searchInput = document.getElementById("search-input");
const techFilter = document.getElementById("tech-filter");
const collaboratorFilter = document.getElementById("collaborator-filter");
const creationTimeFilter = document.getElementById("creation-time-filter");
const sortSelect = document.getElementById("sort-select");
const btnResetFilters = document.getElementById("btn-reset-filters");

// Elementos do Modal
const projectModal = document.getElementById("project-modal");
const btnOpenModal = document.getElementById("btn-open-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnCancelForm = document.getElementById("btn-cancel-form");
const projectForm = document.getElementById("project-form");
const modalTitle = document.getElementById("modal-title");

const inputId = document.getElementById("project-id");
const inputName = document.getElementById("project-name");
const inputDescription = document.getElementById("project-description");
const inputTechs = document.getElementById("project-techs");
const inputCollaborators = document.getElementById("project-collaborators");
const inputCreationDate = document.getElementById("project-creation-date");
const inputUpdateDate = document.getElementById("project-update-date");
const inputRepoLink = document.getElementById("project-repo-link");
const inputSiteLink = document.getElementById("project-site-link");

// Elementos do Modal de Aviso Demo (Vercel)
const demoNoticeModal = document.getElementById("demo-notice-modal");
const btnCloseDemoNotice = document.getElementById("btn-close-demo-notice");
const btnConfirmDemoNotice = document.getElementById("btn-confirm-demo-notice");

// Elementos do Modal de Aviso do Servidor Local
const localServerNoticeModal = document.getElementById("local-server-notice-modal");
const btnCloseLocalServerNotice = document.getElementById("btn-close-local-server-notice");
const btnConfirmLocalServerNotice = document.getElementById("btn-confirm-local-server-notice");

// Elementos do Modal de Visualização da Descrição Completa
const btnViewFullDesc = document.getElementById("btn-view-full-desc");
const fullDescViewerModal = document.getElementById("full-desc-viewer-modal");
const fullDescContent = document.getElementById("full-desc-content");
const btnCloseFullDesc = document.getElementById("btn-close-full-desc");
const btnCloseFullDescOk = document.getElementById("btn-close-full-desc-ok");

// Opções de Pasta do Modal
const radioOptNone = document.getElementById("folder-opt-none");
const radioOptExisting = document.getElementById("folder-opt-existing");
const radioOptCreate = document.getElementById("folder-opt-create");
const localDirGroup = document.getElementById("local-dir-group");
const newDirGroup = document.getElementById("new-dir-group");
const selectDirName = document.getElementById("project-dir-name");
const inputNewDirName = document.getElementById("project-new-dir-name");

// Elementos das Métricas
const metricsAccordion = document.getElementById("metrics-accordion");
const btnToggleMetrics = document.getElementById("btn-toggle-metrics");
const metricsPanel = document.getElementById("metrics-panel");
const metricWeeklyCount = document.getElementById("metric-weekly-count");
const metricMonthlyCount = document.getElementById("metric-monthly-count");
const metricSemiannualCount = document.getElementById("metric-semiannual-count");
const metricAnnualCount = document.getElementById("metric-annual-count");
const metricWeeklyProgress = document.getElementById("metric-weekly-progress");
const metricMonthlyProgress = document.getElementById("metric-monthly-progress");
const metricSemiannualProgress = document.getElementById("metric-semiannual-progress");
const metricAnnualProgress = document.getElementById("metric-annual-progress");

// Inicialização da Página
document.addEventListener("DOMContentLoaded", async () => {
    setupEventListeners();
    await checkServerConnection();
    await loadProjects();

    // Mostra aviso de demonstração se for modo estático/Vercel (servidor offline)
    if (!isServerConnected && !sessionStorage.getItem("demo_notice_closed")) {
        openDemoNoticeModal();
    }

    // Mostra aviso de servidor local se estiver conectado
    if (isServerConnected && !sessionStorage.getItem("local_server_notice_closed")) {
        openLocalServerNoticeModal();
    }

    updateDashboardStats();
    updateMetrics();
    populateTechFilterOptions();
    populateCollaboratorFilterOptions();
    populateLocalDirOptions();
    renderProjects();
    lucide.createIcons();
});

// Verifica a conexão com o servidor local rodando em Node.js
async function checkServerConnection() {
    try {
        // Tenta fazer um fetch leve na API com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            isServerConnected = true;
            serverStatusEl.className = "server-status-badge online";
            serverStatusEl.querySelector(".status-text").textContent = "Servidor Conectado";
            console.log("Conectado ao servidor Node.js local. Criação física de pastas habilitada.");
        } else {
            throw new Error();
        }
    } catch (e) {
        isServerConnected = false;
        serverStatusEl.className = "server-status-badge offline";
        serverStatusEl.querySelector(".status-text").textContent = "Modo LocalStorage";
        console.warn("Servidor local não respondendo. Operando em modo de compatibilidade LocalStorage (criação física desativada).");
    }
}

// Carrega os projetos da API ou do LocalStorage (Fallback)
async function loadProjects() {
    if (isServerConnected) {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                projects = await response.json();
                return;
            }
        } catch (error) {
            console.error("Erro ao carregar projetos da API:", error);
        }
    }
    
    // Fallback: LocalStorage
    const savedProjects = localStorage.getItem("mackenzie_projects");
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    } else {
        projects = [...INITIAL_PROJECTS];
        saveProjectsFallback();
    }
}

// Salva projetos no LocalStorage (Modo Offline)
function saveProjectsFallback() {
    localStorage.setItem("mackenzie_projects", JSON.stringify(projects));
}

// Configura os ouvintes de eventos do sistema
function setupEventListeners() {
    // Pesquisa e Filtros
    searchInput.addEventListener("input", renderProjects);
    techFilter.addEventListener("change", renderProjects);
    collaboratorFilter.addEventListener("change", renderProjects);
    creationTimeFilter.addEventListener("change", renderProjects);
    sortSelect.addEventListener("change", renderProjects);
    btnResetFilters.addEventListener("click", resetFilters);

    // Controle do Modal
    btnOpenModal.addEventListener("click", () => openModal());
    btnCloseModal.addEventListener("click", closeModal);
    btnCancelForm.addEventListener("click", closeModal);

    // Filtros de recência pelo painel de métricas
    document.querySelectorAll(".metric-row").forEach(btn => {
        btn.addEventListener("click", () => {
            const filter = btn.dataset.filter;
            if (activeRecencyFilter === filter) {
                // Clicar novamente no mesmo item limpa o filtro
                activeRecencyFilter = null;
            } else {
                activeRecencyFilter = filter;
            }
            updateMetricRowHighlight();
            renderProjects();
        });
    });

    const btnClearRecency = document.getElementById("btn-clear-recency-filter");
    if (btnClearRecency) {
        btnClearRecency.addEventListener("click", () => {
            activeRecencyFilter = null;
            updateMetricRowHighlight();
            renderProjects();
        });
    }
    
    // Gerenciador de cliques nas opções de pastas físicas do modal
    const folderRadioInputs = document.querySelectorAll('input[name="folder-option"]');
    folderRadioInputs.forEach(radio => {
        radio.addEventListener("change", handleFolderOptionChange);
    });

    // Sugerir automaticamente o nome da pasta com base no nome do projeto digitado
    inputName.addEventListener("input", (e) => {
        if (radioOptCreate.checked) {
            inputNewDirName.value = generateSafeFolderName(e.target.value);
        }
    });

    // Submissão do Formulário
    projectForm.addEventListener("submit", handleFormSubmit);

    // Fechar modal clicando fora do card
    projectModal.addEventListener("click", (e) => {
        if (e.target === projectModal) {
            closeModal();
        }
    });

    // Controle do Modal de Aviso Demo
    if (btnCloseDemoNotice) btnCloseDemoNotice.addEventListener("click", closeDemoNoticeModal);
    if (btnConfirmDemoNotice) btnConfirmDemoNotice.addEventListener("click", closeDemoNoticeModal);
    if (demoNoticeModal) {
        demoNoticeModal.addEventListener("click", (e) => {
            if (e.target === demoNoticeModal) {
                closeDemoNoticeModal();
            }
        });
    }

    // Controle do Modal de Aviso do Servidor Local
    if (btnCloseLocalServerNotice) btnCloseLocalServerNotice.addEventListener("click", closeLocalServerNoticeModal);
    if (btnConfirmLocalServerNotice) btnConfirmLocalServerNotice.addEventListener("click", closeLocalServerNoticeModal);
    if (localServerNoticeModal) {
        localServerNoticeModal.addEventListener("click", (e) => {
            if (e.target === localServerNoticeModal) {
                closeLocalServerNoticeModal();
            }
        });
    }

    // Controle do Modal de Visualização da Descrição Completa
    if (btnViewFullDesc) {
        btnViewFullDesc.addEventListener("click", () => {
            const descText = inputDescription.value.trim();
            if (descText) {
                fullDescContent.textContent = descText;
                fullDescViewerModal.classList.remove("hidden");
                document.body.style.overflow = "hidden";
            } else {
                alert("A descrição está vazia.");
            }
        });
    }

    const closeFullDesc = () => {
        if (fullDescViewerModal) {
            fullDescViewerModal.classList.add("hidden");
            if (projectModal.classList.contains("hidden")) {
                document.body.style.overflow = "";
            }
        }
    };

    if (btnCloseFullDesc) btnCloseFullDesc.addEventListener("click", closeFullDesc);
    if (btnCloseFullDescOk) btnCloseFullDescOk.addEventListener("click", closeFullDesc);
    if (fullDescViewerModal) {
        fullDescViewerModal.addEventListener("click", (e) => {
            if (e.target === fullDescViewerModal) {
                closeFullDesc();
            }
        });
    }

    // Inicializa sugestão de colaboradores
    setupCollaboratorsAutocomplete();
}

// Trata a alteração visual dos inputs de opção de pasta física
function handleFolderOptionChange() {
    if (radioOptNone.checked) {
        localDirGroup.classList.add("hidden");
        newDirGroup.classList.add("hidden");
        selectDirName.required = false;
        inputNewDirName.required = false;
    } else if (radioOptExisting.checked) {
        localDirGroup.classList.remove("hidden");
        newDirGroup.classList.add("hidden");
        selectDirName.required = true;
        inputNewDirName.required = false;
    } else if (radioOptCreate.checked) {
        localDirGroup.classList.add("hidden");
        newDirGroup.classList.remove("hidden");
        selectDirName.required = false;
        inputNewDirName.required = true;
        
        // Inicializa sugestão de nome de pasta
        if (inputName.value) {
            inputNewDirName.value = generateSafeFolderName(inputName.value);
        }
    }
}

// Reseta todos os filtros para o padrão
function resetFilters() {
    searchInput.value = "";
    techFilter.value = "";
    if (collaboratorFilter) collaboratorFilter.value = "";
    if (creationTimeFilter) creationTimeFilter.value = "";
    sortSelect.value = "recent";
    activeRecencyFilter = null;
    updateMetricRowHighlight();
    renderProjects();
}

// Atualiza os dados estatísticos no painel lateral
function updateDashboardStats() {
    totalProjectsEl.textContent = projects.length;

    const allTechs = new Set();
    const allCollabs = new Set();

    projects.forEach(p => {
        p.techs.forEach(t => allTechs.add(t.trim().toLowerCase()));
        if (p.collaborators) {
            p.collaborators.forEach(c => {
                const name = c.trim().toLowerCase();
                if (name) allCollabs.add(name);
            });
        }
    });

    totalTechsEl.textContent = allTechs.size;
    if (totalCollaboratorsEl) {
        totalCollaboratorsEl.textContent = allCollabs.size;
    }
}

// Popula o dropdown de filtro de tecnologia com as tags cadastradas
function populateTechFilterOptions() {
    const allTechs = new Set();
    projects.forEach(p => {
        p.techs.forEach(t => allTechs.add(t.trim()));
    });

    techFilter.innerHTML = '<option value="">Todas as Tecnologias</option>';
    Array.from(allTechs).sort().forEach(tech => {
        const option = document.createElement("option");
        option.value = tech;
        option.textContent = tech;
        techFilter.appendChild(option);
    });
}

// Popula o dropdown de filtro de colaboradores dinamicamente sem duplicar por case sensitiveness
function populateCollaboratorFilterOptions() {
    const collabMap = new Map(); // chave: minúsculo, valor: formato original (primeira ocorrência)
    projects.forEach(p => {
        if (p.collaborators) {
            p.collaborators.forEach(c => {
                const trimmed = c.trim();
                const lower = trimmed.toLowerCase();
                if (!collabMap.has(lower) && trimmed.length > 0) {
                    collabMap.set(lower, trimmed);
                }
            });
        }
    });

    const currentVal = collaboratorFilter ? collaboratorFilter.value : "";
    if (collaboratorFilter) {
        collaboratorFilter.innerHTML = '<option value="">Todos</option>';
        const sortedCollabs = Array.from(collabMap.values()).sort((a, b) => a.localeCompare(b));
        sortedCollabs.forEach(collab => {
            const option = document.createElement("option");
            option.value = collab;
            option.textContent = collab;
            collaboratorFilter.appendChild(option);
        });
        if (sortedCollabs.includes(currentVal)) {
            collaboratorFilter.value = currentVal;
        }
    }
}

// Configura o Autocomplete / Sugestões para o campo de colaboradores (case insensitive)
function setupCollaboratorsAutocomplete() {
    const suggestionsContainer = document.getElementById("collab-suggestions");
    if (!inputCollaborators || !suggestionsContainer) return;

    inputCollaborators.addEventListener("input", () => {
        const value = inputCollaborators.value;
        const terms = value.split(",").map(t => t.trim());
        const currentTerm = terms[terms.length - 1].toLowerCase();

        // Oculta a caixa se o termo atual estiver vazio
        if (!currentTerm) {
            suggestionsContainer.classList.add("hidden");
            return;
        }

        // Coleta todos os colaboradores únicos da base, sem distinção de case
        const collabMap = new Map();
        projects.forEach(p => {
            if (p.collaborators) {
                p.collaborators.forEach(c => {
                    const trimmed = c.trim();
                    if (trimmed.length > 0) {
                        collabMap.set(trimmed.toLowerCase(), trimmed);
                    }
                });
            }
        });

        // Filtra os colaboradores que dão match com o termo atual digitado
        const matches = Array.from(collabMap.values()).filter(collab => {
            // Verifica se o colaborador atual já foi totalmente digitado no campo de termos anteriores
            const alreadyTyped = terms.slice(0, -1).some(t => t.toLowerCase() === collab.toLowerCase());
            return collab.toLowerCase().includes(currentTerm) && !alreadyTyped;
        });

        if (matches.length === 0) {
            suggestionsContainer.classList.add("hidden");
            return;
        }

        // Limpa e renderiza os itens sugeridos na caixinha
        suggestionsContainer.innerHTML = "";
        matches.forEach(match => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = match;
            div.addEventListener("click", () => {
                // Substitui a última porção digitada pelo nome completo sugerido
                terms[terms.length - 1] = match;
                inputCollaborators.value = terms.join(", ") + ", ";
                suggestionsContainer.classList.add("hidden");
                inputCollaborators.focus();
            });
            suggestionsContainer.appendChild(div);
        });

        suggestionsContainer.classList.remove("hidden");
    });

    // Oculta a caixinha de sugestões ao clicar fora do input ou do container de sugestões
    document.addEventListener("click", (e) => {
        if (e.target !== inputCollaborators && e.target !== suggestionsContainer) {
            suggestionsContainer.classList.add("hidden");
        }
    });
}




// Popula o dropdown com as pastas locais do workspace
function populateLocalDirOptions() {
    selectDirName.innerHTML = '<option value="">Selecione a pasta correspondente...</option>';
    LOCAL_FOLDERS_LIST.sort().forEach(folder => {
        const option = document.createElement("option");
        option.value = folder;
        option.textContent = folder;
        selectDirName.appendChild(option);
    });
}

function renderProjects() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedTech = techFilter.value;
    const selectedCollaborator = collaboratorFilter ? collaboratorFilter.value : "";
    const selectedCreationTime = creationTimeFilter ? creationTimeFilter.value : "";
    const sortOrder = sortSelect.value;

    let filtered = projects.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(query) || 
                             p.description.toLowerCase().includes(query);
        const matchesTech = !selectedTech || p.techs.some(t => t.trim().toLowerCase() === selectedTech.toLowerCase());
        
        const matchesCollaborator = !selectedCollaborator || (p.collaborators && p.collaborators.some(c => c.trim().toLowerCase() === selectedCollaborator.toLowerCase()));
        
        const matchesRecency = !activeRecencyFilter || getRecencyStatus(p.date).class === activeRecencyFilter;
        
        // Filtro de tempo baseado no farol da data de criação
        const matchesCreationTime = !selectedCreationTime || getRecencyStatus(p.creationDate || p.date).class === selectedCreationTime;
        
        return matchesQuery && matchesTech && matchesCollaborator && matchesRecency && matchesCreationTime;
    });

    if (sortOrder === "recent") {
        filtered.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sortOrder === "old") {
        filtered.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sortOrder === "alpha") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    visibleProjectsCountEl.textContent = `${filtered.length} de ${projects.length} exibidos`;
    projectsGrid.innerHTML = "";

    if (filtered.length === 0) {
        projectsGrid.classList.add("hidden");
        emptyState.classList.remove("hidden");
    } else {
        projectsGrid.classList.remove("hidden");
        emptyState.classList.add("hidden");

        filtered.forEach(project => {
            const card = createProjectCard(project);
            projectsGrid.appendChild(card);
        });

        lucide.createIcons();
    }
}

// Cria a estrutura DOM de um card de projeto
function createProjectCard(project) {
    const card = document.createElement("article");
    card.className = "project-card";
    const formattedDate = formatDate(project.date);
    const formattedCreationDate = formatDate(project.creationDate || project.date);
    const techTagsHTML = project.techs.map(tech => 
        `<span class="tech-tag">${escapeHTML(tech.trim())}</span>`
    ).join("");

    const folderBadgeHTML = project.isLocalDir && project.dirName ? 
        `<div class="folder-badge" title="Pasta física vinculada: ${escapeHTML(project.dirName)}">
            <i data-lucide="folder"></i>
            <span>${escapeHTML(project.dirName)}</span>
         </div>` : "";

    const recency = getRecencyStatus(project.date);
    const farolHTML = `
        <div class="farol-badge ${recency.class}" title="Frequência de atualização: ${recency.label}">
            <span class="farol-dot"></span>
            <span>${recency.label}</span>
        </div>
    `;

    card.innerHTML = `
        <div class="card-inner">
            <div class="card-header">
                <h3 class="project-title">${escapeHTML(project.name)}</h3>
                ${folderBadgeHTML}
            </div>
            
            <p class="project-desc">${escapeHTML(project.description)}</p>
            
            <!-- Colaboradores -->
            ${project.collaborators && project.collaborators.length > 0 ? 
                `<div class="card-collaborators" title="Colaboradores: ${escapeHTML(project.collaborators.join(', '))}">
                    <i data-lucide="users"></i>
                    <span>${escapeHTML(project.collaborators.join(', '))}</span>
                 </div>` : ""}

            <!-- Acesso Rápido -->
            <div class="quick-links">
                ${project.repoLink ? `
                <a href="${escapeHTML(project.repoLink)}" target="_blank" class="quick-link-btn repo" onclick="registerAccess('${project.id}')" title="Acessar Repositório">
                    <i data-lucide="github"></i>
                    <span>Repositório</span>
                </a>
                ` : `
                <span class="quick-link-btn repo disabled" title="Repositório não configurado">
                    <i data-lucide="github"></i>
                    <span>Repositório</span>
                </span>
                `}
                
                ${project.siteLink ? `
                <a href="${escapeHTML(project.siteLink)}" target="_blank" class="quick-link-btn site" onclick="registerAccess('${project.id}')" title="Acessar Site">
                    <i data-lucide="external-link"></i>
                    <span>Visualizar Site</span>
                </a>
                ` : `
                <span class="quick-link-btn site disabled" title="Site não configurado">
                    <i data-lucide="external-link"></i>
                    <span>Visualizar Site</span>
                </span>
                `}
            </div>
            
            <div class="card-footer">
                <div class="tech-tags">
                    ${techTagsHTML}
                </div>
                
                <div class="meta-info">
                    <div class="meta-left">
                        ${farolHTML}
                        <div class="date-info">
                            <span class="creation-date" title="Data de criação">
                                <i data-lucide="calendar-plus"></i>
                                <span>Criado em: ${formattedCreationDate}</span>
                            </span>
                            <span class="update-date" title="Última atualização">
                                <i data-lucide="calendar-range"></i>
                                <span>Atualizado em: ${formattedDate}</span>
                            </span>
                            <span class="access-date" title="Último acesso ao projeto">
                                <i data-lucide="clock"></i>
                                <span>Último acesso: ${formatDateTime(project.lastAccessed)}</span>
                            </span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="action-btn edit" onclick="editProject('${project.id}')" title="Visualizar / Editar Projeto">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteProject('${project.id}')" title="Excluir Projeto">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Controladores do Modal de Aviso Demo (Vercel)
function openDemoNoticeModal() {
    if (demoNoticeModal) {
        demoNoticeModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeDemoNoticeModal() {
    if (demoNoticeModal) {
        demoNoticeModal.classList.add("hidden");
        document.body.style.overflow = "";
        sessionStorage.setItem("demo_notice_closed", "true");
    }
}

// Controladores do Modal de Aviso do Servidor Local
function openLocalServerNoticeModal() {
    if (localServerNoticeModal) {
        localServerNoticeModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeLocalServerNoticeModal() {
    if (localServerNoticeModal) {
        localServerNoticeModal.classList.add("hidden");
        document.body.style.overflow = "";
        sessionStorage.setItem("local_server_notice_closed", "true");
    }
}

// Controladores do Modal
function openModal(project = null) {
    projectModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    if (project) {
        // Modo Edição
        modalTitle.textContent = "Editar Projeto";
        inputId.value = project.id;
        inputName.value = project.name;
        inputDescription.value = project.description;
        inputTechs.value = project.techs.join(", ");
        if (inputCollaborators) {
            inputCollaborators.value = project.collaborators ? project.collaborators.join(", ") : "";
        }
        inputCreationDate.value = project.creationDate || project.date;
        inputUpdateDate.value = project.date;
        if (inputRepoLink) {
            inputRepoLink.value = project.repoLink || "";
        }
        if (inputSiteLink) {
            inputSiteLink.value = project.siteLink || "";
        }

        if (project.isLocalDir && project.dirName) {
            // Verifica se a pasta existe na lista local para decidir se exibe dropdown ou input de criação
            if (LOCAL_FOLDERS_LIST.includes(project.dirName)) {
                radioOptExisting.checked = true;
                selectDirName.value = project.dirName;
            } else {
                radioOptCreate.checked = true;
                inputNewDirName.value = project.dirName;
            }
        } else {
            radioOptNone.checked = true;
        }
    } else {
        // Modo Criação
        modalTitle.textContent = "Adicionar Novo Projeto";
        projectForm.reset();
        inputId.value = "";
        if (inputCollaborators) {
            inputCollaborators.value = "";
        }
        if (inputRepoLink) {
            inputRepoLink.value = "";
        }
        if (inputSiteLink) {
            inputSiteLink.value = "";
        }
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        inputCreationDate.value = todayStr;
        inputUpdateDate.value = todayStr;

        radioOptNone.checked = true;
    }

    handleFolderOptionChange();
}

function closeModal() {
    projectModal.classList.add("hidden");
    document.body.style.overflow = "";
}

// Gerenciamento de Submissão do Formulário (API + Fallback LocalStorage)
async function handleFormSubmit(e) {
    e.preventDefault();
    const id = inputId.value;

    // Exige a senha para salvar qualquer alteração (criar ou editar)
    const password = prompt("Digite a senha de administrador para confirmar e salvar as alterações:");
    if (password !== "40028922") {
        alert("Senha incorreta! Ação cancelada.");
        return;
    }

    const name = inputName.value.trim();
    const description = inputDescription.value.trim();
    const techs = inputTechs.value.split(",").map(t => t.trim()).filter(t => t.length > 0);
    const collaborators = inputCollaborators ? inputCollaborators.value.split(",").map(c => c.trim()).filter(c => c.length > 0) : [];
    const creationDate = inputCreationDate.value;
    const date = inputUpdateDate.value;
    const repoLink = inputRepoLink ? inputRepoLink.value.trim() : "";
    const siteLink = inputSiteLink ? inputSiteLink.value.trim() : "";

    let isLocalDir = false;
    let dirName = "";

    if (radioOptExisting.checked) {
        isLocalDir = true;
        dirName = selectDirName.value;
    } else if (radioOptCreate.checked) {
        isLocalDir = true;
        dirName = inputNewDirName.value.trim();

        if (!dirName) {
            alert("Por favor, digite o nome da pasta física a ser criada.");
            return;
        }

        if (isLocalDir && !isServerConnected) {
            alert("AVISO: O dashboard não está conectado ao servidor Node.js local. O projeto será salvo no LocalStorage, mas a pasta física NÃO será criada no computador até que o servidor seja iniciado.");
        }
    }

    if (!name || !description || techs.length === 0 || !creationDate || !date) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    const projectData = {
        name,
        description,
        techs,
        collaborators,
        creationDate,
        date,
        isLocalDir,
        dirName,
        repoLink,
        siteLink
    };

    if (id) {
        const existingProj = projects.find(p => p.id === id);
        if (existingProj && existingProj.lastAccessed) {
            projectData.lastAccessed = existingProj.lastAccessed;
        }
    }

    if (isServerConnected) {
        // Chamada de API para o Servidor Local Node.js
        try {
            let response;
            if (id) {
                // Editar Projeto Existente (PUT)
                response = await fetch(`${API_URL}?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });
            } else {
                // Criar Novo Projeto (POST)
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });
            }

            if (response.ok) {
                const savedProject = await response.json();
                
                if (id) {
                    const idx = projects.findIndex(p => p.id === id);
                    if (idx !== -1) projects[idx] = savedProject;
                } else {
                    projects.push(savedProject);
                }

                // Se uma pasta foi criada no servidor, adicionamos ela à nossa lista local de opções
                if (savedProject.isLocalDir && savedProject.dirName && !LOCAL_FOLDERS_LIST.includes(savedProject.dirName)) {
                    LOCAL_FOLDERS_LIST.push(savedProject.dirName);
                    populateLocalDirOptions();
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro desconhecido ao salvar no servidor.");
            }
        } catch (error) {
            alert(`Erro ao salvar no servidor local: ${error.message}`);
            return;
        }
    } else {
        // Fallback: Salvar apenas no LocalStorage
        if (id) {
            const index = projects.findIndex(p => p.id === id);
            if (index !== -1) {
                projects[index] = {
                    ...projects[index],
                    ...projectData
                };
            }
        } else {
            const newProject = {
                id: "proj_" + Date.now(),
                ...projectData
            };
            projects.push(newProject);
        }
        saveProjectsFallback();
    }

    updateDashboardStats();
    updateMetrics();
    populateTechFilterOptions();
    populateCollaboratorFilterOptions();
    renderProjects();
    closeModal();
}

// Abre o modal para edição de um projeto específico
window.editProject = function(id) {
    const project = projects.find(p => p.id === id);
    if (project) {
        openModal(project);
    }
};

// Remove um projeto após confirmação
window.deleteProject = async function(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const password = prompt("Digite a senha de administrador para excluir este projeto:");
    if (password !== "40028922") {
        alert("Senha incorreta! Ação cancelada.");
        return;
    }

    const confirmDelete = confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?\n(Nota: Esta ação removerá o registro do dashboard, mas não apagará pastas físicas por questões de segurança).`);
    if (!confirmDelete) return;

    if (isServerConnected) {
        try {
            const response = await fetch(`${API_URL}?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                projects = projects.filter(p => p.id !== id);
            } else {
                const err = await response.json();
                throw new Error(err.error || "Erro ao deletar.");
            }
        } catch (error) {
            alert(`Erro ao remover projeto do servidor: ${error.message}`);
            return;
        }
    } else {
        projects = projects.filter(p => p.id !== id);
        saveProjectsFallback();
    }

    updateDashboardStats();
    updateMetrics();
    populateTechFilterOptions();
    populateCollaboratorFilterOptions();
    renderProjects();
};

// Registra o acesso ao projeto pelo repositório ou pelo site
window.registerAccess = async function(id) {
    const now = new Date().toISOString();
    
    // Atualiza localmente a lista de projetos em memória
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) {
        projects[idx].lastAccessed = now;
    }
    
    if (isServerConnected) {
        try {
            await fetch(`/api/projects/access?id=${id}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error("Erro ao registrar acesso no servidor local:", error);
        }
    } else {
        // Fallback: LocalStorage
        saveProjectsFallback();
    }
    
    // Re-renderiza para atualizar o texto do card imediatamente
    renderProjects();
};

function formatDateTime(isoString) {
    if (!isoString) return "Nunca";
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Nunca";
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch (e) {
        return "Nunca";
    }
}

// Funções de Utilitários
function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Converte um texto legível em um nome de diretório seguro
function generateSafeFolderName(projectName) {
    if (!projectName) return "";
    
    // Remove acentos e converte para maiúsculo
    let normalized = projectName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
        
    // Substitui caracteres especiais e espaços por underscores
    let safeName = normalized
        .replace(/[^A-Z0-9_]/g, "_")
        .replace(/__+/g, "_") // remove underscores duplicados
        .trim();
        
    // Remove underscores nas extremidades
    safeName = safeName.replace(/^_+|_+$/g, "");
    
    // Adiciona o prefixo SITE_ caso não tenha
    if (!safeName.startsWith("SITE_")) {
        safeName = "SITE_" + safeName;
    }
    
    return safeName;
}

// (Painel de métricas agora é sempre visível, sem necessidade de toggle)

// Retorna o status de recência com base na diferença de dias (Vermelho, Amarelo, Verde)
function getRecencyStatus(dateString) {
    if (!dateString) return { class: "antigo", label: "Antigo" };
    
    const parts = dateString.split("-");
    if (parts.length !== 3) return { class: "antigo", label: "Antigo" };

    const projectDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    
    // Zera horas para focar nos dias
    today.setHours(0, 0, 0, 0);
    projectDate.setHours(0, 0, 0, 0);

    const diffTime = today - projectDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Se o projeto for atualizado na semana (Vermelho)
    if (diffDays <= 7) {
        return { class: "semana", label: "Semana" };
    }
    // Se o projeto for atualizado nos últimos 30 dias (Laranja)
    else if (diffDays <= 30) {
        return { class: "recente", label: "Mês" };
    } 
    // Se o projeto for atualizado no intervalo médio de 31 a 180 dias (Amarelo)
    else if (diffDays <= 180) {
        return { class: "medio", label: "Semestre" };
    } 
    // Se for antigo, ou seja, mais de 180 dias sem atualizações (Verde)
    else {
        return { class: "antigo", label: "Antigo" };
    }
}

// Calcula e atualiza as métricas de frequências de atualizações no Painel
function updateMetrics() {
    const total = projects.length;
    
    if (total === 0) {
        metricWeeklyCount.textContent = "0";
        metricMonthlyCount.textContent = "0";
        metricSemiannualCount.textContent = "0";
        metricAnnualCount.textContent = "0";
        metricWeeklyProgress.style.width = "0%";
        metricMonthlyProgress.style.width = "0%";
        metricSemiannualProgress.style.width = "0%";
        metricAnnualProgress.style.width = "0%";
        return;
    }

    let weekly = 0;
    let monthly = 0;
    let semiannual = 0;
    let annual = 0;

    projects.forEach(p => {
        const status = getRecencyStatus(p.date).class;
        if (status === "semana") {
            weekly++;
            monthly++;
            semiannual++;
        } else if (status === "recente") {
            monthly++;
            semiannual++;
        } else if (status === "medio") {
            semiannual++;
        } else if (status === "antigo") {
            annual++;
        }
    });

    // Atualiza contadores visuais
    metricWeeklyCount.textContent = weekly;
    metricMonthlyCount.textContent = monthly;
    metricSemiannualCount.textContent = semiannual;
    metricAnnualCount.textContent = annual;

    // Calcula porcentagens de progresso
    const weeklyPercent = (weekly / total) * 100;
    const monthlyPercent = (monthly / total) * 100;
    const semiannualPercent = (semiannual / total) * 100;
    const annualPercent = (annual / total) * 100;

    // Atualiza a largura das barras de progresso no DOM
    metricWeeklyProgress.style.width = `${weeklyPercent}%`;
    metricMonthlyProgress.style.width = `${monthlyPercent}%`;
    metricSemiannualProgress.style.width = `${semiannualPercent}%`;
    metricAnnualProgress.style.width = `${annualPercent}%`;
}

// Atualiza o destaque visual das linhas do painel de métricas com base no filtro ativo
function updateMetricRowHighlight() {
    document.querySelectorAll(".metric-row").forEach(btn => {
        const filter = btn.dataset.filter;
        if (activeRecencyFilter && activeRecencyFilter === filter) {
            btn.classList.add("active-filter");
        } else {
            btn.classList.remove("active-filter");
        }
    });

    // Controla o botão de limpar filtro da freq-bar
    const clearBtn = document.getElementById("btn-clear-recency-filter");
    if (clearBtn) {
        clearBtn.style.display = activeRecencyFilter ? "flex" : "none";
    }
}
