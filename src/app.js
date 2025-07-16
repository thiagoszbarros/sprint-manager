const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const database = require('./database');
const sprintService = require('./sprintService');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas
app.use('/api/sprints', routes);

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API Sprint Manager funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Sprint Manager API',
    version: '1.0.0',
    endpoints: {
      status: 'GET /api/status',
      sprints: {
        getAll: 'GET /api/sprints',
        getById: 'GET /api/sprints/:id',
        getByAssignee: 'GET /api/sprints/assignee/:assigneeId',
        getBySprintNumber: 'GET /api/sprints/number/:sprintNumber',
        create: 'POST /api/sprints',
        update: 'PUT /api/sprints/:id',
        delete: 'DELETE /api/sprints/:id'
      }
    }
  });
});

// Middleware de erro 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro na aplicação:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

// Função para inicializar o servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await database.connect();
    
    // Inicializar o serviço de sprints
    sprintService.init();
    
    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`API disponível em: http://localhost:${PORT}`);
      console.log(`Status da API: http://localhost:${PORT}/api/status`);
    });
  } catch (error) {
    console.error('Erro ao inicializar o servidor:', error);
    process.exit(1);
  }
}

// Gerenciar encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nEncerrando servidor...');
  await database.disconnect();
  process.exit(0);
});

// Inicializar o servidor
startServer();

module.exports = app;
