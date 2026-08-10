const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'projects.json');

// Mime types suportados para servir arquivos estáticos
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Carrega os projetos do arquivo JSON
function getProjects() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Erro ao ler arquivo de projetos:", error);
        return [];
    }
}

// Salva os projetos no arquivo JSON
function saveProjects(projects) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 4), 'utf8');
        return true;
    } catch (error) {
        console.error("Erro ao salvar arquivo de projetos:", error);
        return false;
    }
}

// Cria uma pasta física para o projeto no workspace local se não existir
function createPhysicalFolder(folderName, projectName, projectTechs) {
    if (!folderName) return false;
    
    // Limpa caracteres perigosos no nome da pasta
    const safeFolderName = folderName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
    if (!safeFolderName) return false;

    const folderPath = path.join(__dirname, safeFolderName);

    try {
        if (!fs.existsSync(folderPath)) {
            // Cria a pasta física no disco
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Pasta física criada com sucesso: ${folderPath}`);

            // Cria um arquivo README.md padrão dentro da nova pasta
            const readmePath = path.join(folderPath, 'README.md');
            const readmeContent = `# ${projectName}

Este projeto foi gerado automaticamente através do **Mackenzie Projects Hub**.

## Informações do Projeto
- **Tecnologias Usadas**: ${projectTechs.join(', ')}
- **Data de Criação**: ${new Date().toLocaleDateString('pt-BR')}

---
Desenvolvido e indexado no hub Mackenzie.
`;
            fs.writeFileSync(readmePath, readmeContent, 'utf8');
            console.log(`README.md criado em: ${readmePath}`);
            return true;
        } else {
            console.log(`A pasta física já existe: ${folderPath}`);
            return false;
        }
    } catch (error) {
        console.error(`Erro ao criar pasta física "${safeFolderName}":`, error);
        return false;
    }
}

// Lê as datas reais de uma pasta física vinculada ao projeto
function getFolderDates(dirName) {
    if (!dirName) return null;
    try {
        const folderPath = path.join(__dirname, dirName);
        if (!fs.existsSync(folderPath)) return null;

        const stat = fs.statSync(folderPath);

        // Para Windows, birthtime é a data de criação real.
        // mtime é a última vez que algum arquivo dentro da pasta foi modificado.
        // Varredura recursiva para pegar o mtime mais recente entre todos os arquivos filhos
        let latestMtime = stat.mtime;

        function walkDir(dir) {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    // Ignora pastas ocultas e node_modules
                    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
                    const fullPath = path.join(dir, entry.name);
                    try {
                        const entryStat = fs.statSync(fullPath);
                        if (entryStat.mtime > latestMtime) {
                            latestMtime = entryStat.mtime;
                        }
                        if (entry.isDirectory()) {
                            walkDir(fullPath);
                        }
                    } catch (_) { /* ignora arquivos inacessíveis */ }
                }
            } catch (_) { /* ignora pastas inacessíveis */ }
        }

        walkDir(folderPath);

        return {
            creationDate: stat.birthtime.toISOString().split('T')[0],  // YYYY-MM-DD
            date: latestMtime.toISOString().split('T')[0]               // YYYY-MM-DD
        };
    } catch (error) {
        console.error(`Erro ao ler datas da pasta "${dirName}":`, error);
        return null;
    }
}

// Limpa e formata o nome da pasta física para um nome amigável de projeto
function cleanFolderNameToName(folderName) {
    let name = folderName.replace(/^(SITE_|TP_)/i, '');
    name = name.replace(/[_]/g, ' ');
    name = name.replace(/\bCOPIA\b/gi, '(Cópia)');
    name = name.replace(/\bDESENVOLVIMENTO\b/gi, 'Desenvolvimento');
    return name.split(' ')
        .map(word => {
            if (word.startsWith('(')) {
                return '(' + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

// Detecta se a pasta física contém bancos de dados e retorna os tipos (SQLite, MySQL, PostgreSQL, MongoDB, SQL)
function detectDatabase(folderPath, folderName) {
    const dbTechs = new Set();
    
    // Verifica se o nome da pasta sugere banco de dados
    if (folderName.toLowerCase().endsWith('_db') || folderName.toLowerCase().includes('-db')) {
        dbTechs.add('SQL');
    }

    try {
        if (!fs.existsSync(folderPath)) return Array.from(dbTechs);
        
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        
        // 1. Busca por dialetos explícitos nas variáveis de ambiente (.env) primeiro
        let explicitDialect = null;
        for (const entry of entries) {
            if (entry.isFile() && entry.name.toLowerCase().startsWith('.env')) {
                try {
                    const envContent = fs.readFileSync(path.join(folderPath, entry.name), 'utf8');
                    const dialectMatch = envContent.match(/DB_DIALECT\s*=\s*([a-zA-Z0-9_-]+)/i);
                    if (dialectMatch && dialectMatch[1]) {
                        const dialect = dialectMatch[1].toLowerCase().trim();
                        if (dialect === 'mysql' || dialect === 'mariadb') explicitDialect = 'MySQL';
                        else if (dialect === 'postgres' || dialect === 'postgresql') explicitDialect = 'PostgreSQL';
                        else if (dialect === 'sqlite') explicitDialect = 'SQLite';
                        else if (dialect === 'mssql') explicitDialect = 'SQL Server';
                    }
                } catch (_) {}
            }
        }

        // 2. Faz a varredura normal
        for (const entry of entries) {
            const name = entry.name.toLowerCase();
            const fullPath = path.join(folderPath, entry.name);
            
            if (entry.isFile()) {
                const ext = path.extname(name);
                
                // Arquivos de banco locais
                if (['.db', '.sqlite', '.sqlite3', '.db3', '.s3db', '.sl3'].includes(ext)) {
                    dbTechs.add('SQLite');
                    dbTechs.add('SQL');
                } else if (ext === '.sql') {
                    dbTechs.add('SQL');
                }
                
                // Dependências do package.json (Node.js)
                if (name === 'package.json') {
                    try {
                        const pkgContent = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                        const deps = { ...(pkgContent.dependencies || {}), ...(pkgContent.devDependencies || {}) };
                        
                        if (deps['mongodb'] || deps['mongoose']) {
                            dbTechs.add('MongoDB');
                        }
                        
                        // Se houver dialeto explícito, só adiciona a correspondente
                        if (explicitDialect) {
                            dbTechs.add(explicitDialect);
                            dbTechs.add('SQL');
                        } else {
                            if (deps['pg'] || deps['postgres']) {
                                dbTechs.add('PostgreSQL');
                                dbTechs.add('SQL');
                            }
                            if (deps['mysql'] || deps['mysql2']) {
                                dbTechs.add('MySQL');
                                dbTechs.add('SQL');
                            }
                            if (deps['sqlite'] || deps['sqlite3'] || deps['better-sqlite3']) {
                                dbTechs.add('SQLite');
                                dbTechs.add('SQL');
                            }
                        }
                        
                        if (deps['sequelize'] || deps['knex'] || deps['typeorm'] || deps['prisma']) {
                            dbTechs.add('SQL');
                        }
                    } catch (_) {}
                }
                
                // Python requirements
                if (name === 'requirements.txt') {
                    try {
                        const reqs = fs.readFileSync(fullPath, 'utf8').toLowerCase();
                        if (reqs.includes('psycopg2') || reqs.includes('psycopg')) {
                            dbTechs.add('PostgreSQL');
                            dbTechs.add('SQL');
                        }
                        if (reqs.includes('mysql') || reqs.includes('pymysql')) {
                            dbTechs.add('MySQL');
                            dbTechs.add('SQL');
                        }
                        if (reqs.includes('pymongo') || reqs.includes('mongoengine')) {
                            dbTechs.add('MongoDB');
                        }
                        if (reqs.includes('sqlite') || reqs.includes('sqlalchemy') || reqs.includes('peewee') || reqs.includes('django')) {
                            dbTechs.add('SQL');
                        }
                    } catch (_) {}
                }
                
                // Variáveis de ambiente (.env)
                if (name.startsWith('.env')) {
                    try {
                        const envContent = fs.readFileSync(fullPath, 'utf8');
                        if (envContent.includes('mongodb://') || envContent.includes('mongodb+srv://')) {
                            dbTechs.add('MongoDB');
                        }
                        if (envContent.includes('postgres://') || envContent.includes('postgresql://')) {
                            dbTechs.add('PostgreSQL');
                            dbTechs.add('SQL');
                        }
                        if (envContent.includes('mysql://')) {
                            dbTechs.add('MySQL');
                            dbTechs.add('SQL');
                        }
                        if (envContent.includes('sqlite:')) {
                            dbTechs.add('SQLite');
                            dbTechs.add('SQL');
                        }
                    } catch (_) {}
                }
            } else if (entry.isDirectory()) {
                // Pastas comuns de ORMs ou configs
                if (['prisma', 'config', 'db', 'database'].includes(name)) {
                    try {
                        const subFiles = fs.readdirSync(fullPath);
                        for (const sf of subFiles) {
                            const sfLower = sf.toLowerCase();
                            if (sfLower === 'schema.prisma') {
                                dbTechs.add('SQL');
                                try {
                                    const schemaContent = fs.readFileSync(path.join(fullPath, sf), 'utf8');
                                    if (schemaContent.includes('provider = "postgresql"') || schemaContent.includes('provider = "postgres"')) {
                                        dbTechs.add('PostgreSQL');
                                    }
                                    if (schemaContent.includes('provider = "mysql"')) {
                                        dbTechs.add('MySQL');
                                    }
                                    if (schemaContent.includes('provider = "sqlite"')) {
                                        dbTechs.add('SQLite');
                                    }
                                } catch (_) {}
                            }
                            if (sfLower.includes('db') || sfLower.includes('sql') || sfLower.endsWith('.sql') || sfLower.endsWith('.db') || sfLower.endsWith('.sqlite')) {
                                dbTechs.add('SQL');
                            }
                        }
                    } catch (_) {}
                }
            }
        }
    } catch (e) {
        console.error("Erro ao detectar banco de dados:", e);
    }

    return Array.from(dbTechs);
}

// Auto-detecta tecnologias a partir dos arquivos do diretório
function autoDetectTechs(folderPath) {
    const techs = new Set();
    try {
        if (!fs.existsSync(folderPath)) return [];
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const lowerFile = file.toLowerCase();

            if (lowerFile === 'package.json') {
                techs.add('Node.js');
                try {
                    const pkgContent = JSON.parse(fs.readFileSync(path.join(folderPath, file), 'utf8'));
                    const deps = { ...(pkgContent.dependencies || {}), ...(pkgContent.devDependencies || {}) };
                    if (deps['react']) techs.add('React');
                    if (deps['vue']) techs.add('Vue');
                    if (deps['next']) techs.add('Next.js');
                    if (deps['express']) techs.add('Express');
                    if (deps['tailwindcss']) techs.add('TailwindCSS');
                    if (deps['mongodb'] || deps['mongoose']) techs.add('MongoDB');
                } catch (e) {
                    // Ignora erro ao analisar package.json
                }
            }
            if (lowerFile === 'requirements.txt' || ext === '.py') {
                techs.add('Python');
            }
            if (ext === '.js') {
                techs.add('JavaScript');
            }
            if (ext === '.ts' || ext === '.tsx') {
                techs.add('TypeScript');
            }
            if (ext === '.css') {
                techs.add('CSS');
            }
            if (ext === '.html') {
                techs.add('HTML5');
            }
            if (lowerFile === 'composer.json' || ext === '.php') {
                techs.add('PHP');
            }
            if (ext === '.go') {
                techs.add('Go');
            }
            if (ext === '.java') {
                techs.add('Java');
            }
            if (lowerFile.includes('db') || lowerFile.includes('sql') || ext === '.sql' || ext === '.sqlite' || ext === '.db') {
                techs.add('SQL');
            }
        }

        // Adiciona as tecnologias de banco de dados detectadas
        const dbTechs = detectDatabase(folderPath, path.basename(folderPath));
        for (const db of dbTechs) {
            techs.add(db);
        }
    } catch (e) {
        console.error("Erro ao auto-detectar tecnologias:", e);
    }
    return Array.from(techs);
}

// Obtém a URL do repositório remoto Git a partir do arquivo .git/config local
function getGitRepoUrl(folderPath) {
    try {
        const gitConfigPath = path.join(folderPath, '.git', 'config');
        if (fs.existsSync(gitConfigPath)) {
            const configContent = fs.readFileSync(gitConfigPath, 'utf8');
            const match = configContent.match(/\[remote\s+"origin"\][^]*?url\s*=\s*(https?:\/\/[^\s\r\n]+|git@[^\s\r\n]+)/i);
            if (match && match[1]) {
                let url = match[1].trim();
                if (url.startsWith('git@')) {
                    url = url.replace(':', '/').replace('git@', 'https://').replace(/\.git$/, '');
                }
                if (url.endsWith('.git')) {
                    url = url.slice(0, -4);
                }
                return url;
            }
        }
    } catch (e) {
        console.error(`Erro ao ler repositório git em ${folderPath}:`, e);
    }
    return null;
}

// Extrai links de site publicado (Vercel, sslip.io, etc.) e repositório GitHub do README.md
function extractLinksFromReadme(readmeContent) {
    let siteLink = "";
    let repoLink = "";
    
    // Regex para encontrar links em formato Markdown: [Texto](URL)
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    // Regex para encontrar URLs puras no texto
    const urlRegex = /(https?:\/\/[^\s\)\*]+)/g;
    
    let match;
    const mdLinks = [];
    while ((match = mdLinkRegex.exec(readmeContent)) !== null) {
        mdLinks.push({ text: match[1], url: match[2] });
    }
    
    // 1. Identificar repoLink (link do repositório GitHub principal pertencente ao usuário minoru)
    for (const link of mdLinks) {
        const urlLower = link.url.toLowerCase();
        if (urlLower.includes('github.com/minoru') && !urlLower.includes('.io')) {
            const isMainRepo = link.url.split('/').length <= 5; 
            if (isMainRepo) {
                repoLink = link.url;
                break;
            }
        }
    }
    
    if (!repoLink) {
        const pureUrls = readmeContent.match(urlRegex) || [];
        for (const url of pureUrls) {
            const urlLower = url.toLowerCase();
            if (urlLower.includes('github.com/minoru') && !urlLower.includes('.io')) {
                const isMainRepo = url.split('/').length <= 5;
                if (isMainRepo) {
                    repoLink = url;
                    break;
                }
            }
        }
    }

    // 2. Identificar siteLink (link do site publicado ou de demonstração)
    const siteKeywords = ['site', 'online', 'vercel', 'demo', 'produção', 'live', 'acesso', 'deploy', 'matriz'];
    
    for (const link of mdLinks) {
        const textLower = link.text.toLowerCase();
        const urlLower = link.url.toLowerCase();
        
        if (link.url === repoLink || (urlLower.includes('github.com/') && !urlLower.includes('.github.io'))) {
            continue;
        }
        if (urlLower.includes('img.shields.io') || urlLower.includes('badge')) {
            continue;
        }
        
        const matchesKeyword = siteKeywords.some(keyword => textLower.includes(keyword) || urlLower.includes(keyword));
        if (matchesKeyword) {
            siteLink = link.url;
            break;
        }
    }

    if (!siteLink) {
        for (const link of mdLinks) {
            const urlLower = link.url.toLowerCase();
            if (link.url === repoLink || urlLower.includes('img.shields.io') || urlLower.includes('badge')) {
                continue;
            }
            if (urlLower.includes('vercel.app') || urlLower.includes('sslip.io') || urlLower.includes('github.io')) {
                siteLink = link.url;
                break;
            }
        }
    }

    if (!siteLink) {
        const pureUrls = readmeContent.match(urlRegex) || [];
        for (const url of pureUrls) {
            const urlLower = url.toLowerCase();
            if (url === repoLink || urlLower.includes('github.com') || urlLower.includes('img.shields.io') || urlLower.includes('badge')) {
                continue;
            }
            if (urlLower.includes('vercel.app') || urlLower.includes('sslip.io') || urlLower.includes('github.io')) {
                siteLink = url;
                break;
            }
        }
    }
    
    return { siteLink, repoLink };
}

// Sincroniza e importa novas pastas do workspace para o arquivo JSON
function scanAndSyncLocalFolders() {
    try {
        const projects = getProjects();
        const files = fs.readdirSync(__dirname, { withFileTypes: true });
        
        // Filtra para manter somente subdiretórios válidos (desprezando node_modules, pastas ocultas, .git, etc.)
        const localFolders = files
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'node_modules' && dirent.name !== 'scratch')
            .map(dirent => dirent.name);

        let changed = false;

        for (const folderName of localFolders) {
            const exists = projects.some(p => p.isLocalDir && p.dirName === folderName);
            if (!exists) {
                console.log(`Nova pasta de projeto detectada: ${folderName}. Importando...`);
                const folderPath = path.join(__dirname, folderName);
                
                let projectName = cleanFolderNameToName(folderName);
                let projectDescription = "Projeto importado automaticamente a partir da pasta local.";
                let techs = [];
                let gitRepoLink = getGitRepoUrl(folderPath);
                let extractedLinks = { siteLink: "", repoLink: "" };

                // Tenta extrair informações do README.md
                const readmePath = path.join(folderPath, 'README.md');
                if (fs.existsSync(readmePath)) {
                    try {
                        const readmeContent = fs.readFileSync(readmePath, 'utf8');
                        extractedLinks = extractLinksFromReadme(readmeContent);
                        
                        const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
                        if (titleMatch && titleMatch[1]) {
                            projectName = titleMatch[1].trim();
                        }
                        
                        const lines = readmeContent.split('\n');
                        const titleIdx = lines.findIndex(line => line.trim().startsWith('# '));
                        if (titleIdx !== -1) {
                            let descLines = [];
                            for (let i = titleIdx + 1; i < lines.length; i++) {
                                const trimmed = lines[i].trim();
                                if (trimmed.startsWith('#')) break;
                                if (trimmed.length > 0) {
                                    descLines.push(trimmed);
                                }
                            }
                            if (descLines.length > 0) {
                                projectDescription = descLines.slice(0, 3).join(' ');
                            }
                        }
                    } catch (e) {
                        console.error(`Erro ao analisar README.md de ${folderName}:`, e);
                    }
                }

                // Auto-detecta tecnologias
                techs = autoDetectTechs(folderPath);
                if (techs.length === 0) {
                    techs = ["JavaScript", "HTML5", "CSS3"];
                }

                // Datas do diretório
                const dates = getFolderDates(folderName) || {
                    creationDate: new Date().toISOString().split('T')[0],
                    date: new Date().toISOString().split('T')[0]
                };

                const newProject = {
                    id: 'proj_' + folderName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
                    name: projectName,
                    description: projectDescription,
                    techs: techs,
                    creationDate: dates.creationDate,
                    date: dates.date,
                    isLocalDir: true,
                    dirName: folderName,
                    collaborators: ["Minoru Yamanaka"],
                    repoLink: gitRepoLink || extractedLinks.repoLink,
                    siteLink: extractedLinks.siteLink
                };

                projects.push(newProject);
                changed = true;
            }
        }

        // Garante que todos os projetos existentes também tenham as etiquetas de banco de dados e links atualizados
        for (let i = 0; i < projects.length; i++) {
            const p = projects[i];
            if (p.isLocalDir && p.dirName) {
                const folderPath = path.join(__dirname, p.dirName);
                if (fs.existsSync(folderPath)) {
                    // Atualiza banco de dados
                    const dbTechs = detectDatabase(folderPath, p.dirName);
                    let projectChanged = false;
                    for (const db of dbTechs) {
                        if (!p.techs.includes(db)) {
                            p.techs.push(db);
                            projectChanged = true;
                            changed = true;
                        }
                    }
                    if (projectChanged) {
                        console.log(`[Banco de Dados] Adicionadas etiquetas de banco de dados para "${p.name}": ${dbTechs.join(', ')}`);
                    }

                    // Atualiza repoLink com a URL do Git local se disponível e diferente
                    const gitRepoLink = getGitRepoUrl(folderPath);
                    if (gitRepoLink && p.repoLink !== gitRepoLink) {
                        p.repoLink = gitRepoLink;
                        projectChanged = true;
                        changed = true;
                        console.log(`[Git] Atualizado repoLink do Git local para "${p.name}": ${gitRepoLink}`);
                    }

                    // Atualiza links se estiverem em branco no projects.json mas existirem no README.md
                    const readmePath = path.join(folderPath, 'README.md');
                    if (fs.existsSync(readmePath)) {
                        try {
                            const readmeContent = fs.readFileSync(readmePath, 'utf8');
                            const extracted = extractLinksFromReadme(readmeContent);
                            if (extracted.siteLink && !p.siteLink) {
                                p.siteLink = extracted.siteLink;
                                projectChanged = true;
                                changed = true;
                                console.log(`[Links] Adicionado siteLink para "${p.name}": ${extracted.siteLink}`);
                            }
                            if (extracted.repoLink && !p.repoLink) {
                                p.repoLink = extracted.repoLink;
                                projectChanged = true;
                                changed = true;
                                console.log(`[Links] Adicionado repoLink para "${p.name}": ${extracted.repoLink}`);
                            }
                        } catch (_) {}
                    }
                }
            }
        }

        if (changed) {
            saveProjects(projects);
            console.log("Banco de dados local projects.json atualizado com os novos projetos, tags de banco e links do README.");
        }
        return projects;
    } catch (error) {
        console.error("Erro na sincronização de pastas locais:", error);
        return getProjects();
    }
}

// Inicia o monitor de criação de diretórios em tempo real
let watcherActive = false;
function startWorkspaceWatcher() {
    if (watcherActive) return;
    try {
        fs.watch(__dirname, (eventType, filename) => {
            if (eventType === 'rename' && filename) {
                const fullPath = path.join(__dirname, filename);
                // Pequeno delay para garantir que o SO finalize a criação do diretório
                setTimeout(() => {
                    try {
                        if (fs.existsSync(fullPath)) {
                            const stat = fs.statSync(fullPath);
                            if (stat.isDirectory() && !filename.startsWith('.') && filename !== 'node_modules' && filename !== 'scratch') {
                                console.log(`[Watcher] Nova pasta detectada pelo monitor: ${filename}`);
                                scanAndSyncLocalFolders();
                            }
                        }
                    } catch (e) {
                        // Ignora falhas de lock de arquivos temporários do SO
                    }
                }, 1000);
            }
        });
        watcherActive = true;
        console.log("Monitor (Watcher) do workspace ativado com sucesso.");
    } catch (error) {
        console.error("Erro ao iniciar monitor do workspace:", error);
    }
}

// Cria o servidor HTTP
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    console.log(`${method} ${pathname}`);

    // --- ROTAS DA API ---

    // GET /api/projects - Retorna todos os projetos
    if (pathname === '/api/projects' && method === 'GET') {
        const projects = scanAndSyncLocalFolders();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(projects));
        return;
    }

    // POST /api/projects - Cria um novo projeto
    if (pathname === '/api/projects' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const newProject = JSON.parse(body);
                if (!newProject.name || !newProject.description) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Campos nome e descrição são obrigatórios.' }));
                    return;
                }

                // Gera ID se não existir
                if (!newProject.id) {
                    newProject.id = 'proj_' + Date.now();
                }

                const projects = getProjects();
                
                // Se estiver marcado para criar a pasta física e tiver dirName definido
                if (newProject.isLocalDir && newProject.dirName) {
                    createPhysicalFolder(newProject.dirName, newProject.name, newProject.techs || []);
                }

                projects.push(newProject);
                
                if (saveProjects(projects)) {
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(newProject));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erro ao persistir o projeto no servidor.' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'JSON inválido no corpo da requisição.' }));
            }
        });
        return;
    }

    // PUT /api/projects - Atualiza um projeto existente (espera /api/projects?id=...)
    if (pathname === '/api/projects' && method === 'PUT') {
        const id = url.searchParams.get('id');
        if (!id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ID do projeto não fornecido.' }));
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const updatedData = JSON.parse(body);
                const projects = getProjects();
                const index = projects.findIndex(p => p.id === id);

                if (index === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Projeto não encontrado.' }));
                    return;
                }

                // Se o projeto foi editado para vincular a uma nova pasta e for solicitado
                if (updatedData.isLocalDir && updatedData.dirName && projects[index].dirName !== updatedData.dirName) {
                    createPhysicalFolder(updatedData.dirName, updatedData.name, updatedData.techs || []);
                }

                // Atualiza os dados
                projects[index] = {
                    ...projects[index],
                    ...updatedData,
                    id: projects[index].id // Garante que o ID não mude
                };

                if (saveProjects(projects)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(projects[index]));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erro ao salvar no arquivo.' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Corpo da requisição inválido.' }));
            }
        });
        return;
    }

    // DELETE /api/projects - Remove um projeto (espera /api/projects?id=...)
    if (pathname === '/api/projects' && method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ID do projeto não fornecido.' }));
            return;
        }

        let projects = getProjects();
        const initialLength = projects.length;
        projects = projects.filter(p => p.id !== id);

        if (projects.length === initialLength) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Projeto não encontrado.' }));
            return;
        }

        if (saveProjects(projects)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Projeto excluído com sucesso.' }));
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro ao remover do arquivo.' }));
        }
        return;
    }

    // POST /api/projects/access - Registra o último acesso (espera /api/projects/access?id=...)
    if (pathname === '/api/projects/access' && method === 'POST') {
        const id = url.searchParams.get('id');
        if (!id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ID do projeto não fornecido.' }));
            return;
        }

        const projects = getProjects();
        const index = projects.findIndex(p => p.id === id);

        if (index === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Projeto não encontrado.' }));
            return;
        }

        // Registra o acesso com a data/hora atual no formato ISO
        const now = new Date();
        projects[index].lastAccessed = now.toISOString();

        if (saveProjects(projects)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, lastAccessed: projects[index].lastAccessed }));
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro ao registrar acesso no arquivo.' }));
        }
        return;
    }

    // --- SERVIR ARQUIVOS ESTÁTICOS ---

    // Mapeia "/" para "/index.html"
    let safePath = pathname === '/' ? '/index.html' : pathname;
    
    // Caminho completo do arquivo solicitado
    const filePath = path.join(__dirname, safePath);

    // Evita ataques de directory traversal garantindo que o arquivo está no workspace
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Acesso Proibido');
        return;
    }

    // Verifica se o arquivo existe e o serve
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Arquivo Não Encontrado');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

// Inicialização do Servidor
server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Mackenzie Projects Hub rodando com sucesso!`);
    console.log(` URL de acesso: http://localhost:${PORT}`);
    console.log(` Banco de dados local: ${DATA_FILE}`);
    console.log(`==================================================`);

    // Varredura inicial e inicialização do monitor do workspace
    scanAndSyncLocalFolders();
    startWorkspaceWatcher();
});
