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

// Cria o servidor HTTP
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    console.log(`${method} ${pathname}`);

    // --- ROTAS DA API ---

    // GET /api/projects - Retorna todos os projetos com datas reais das pastas
    if (pathname === '/api/projects' && method === 'GET') {
        const projects = getProjects();

        // Para cada projeto com pasta vinculada, lê as datas reais do sistema de arquivos
        const enriched = projects.map(project => {
            if (project.isLocalDir && project.dirName) {
                const realDates = getFolderDates(project.dirName);
                if (realDates) {
                    return {
                        ...project,
                        date: realDates.date,
                        creationDate: realDates.creationDate
                    };
                }
            }
            return project;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(enriched));
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
});
