# Sprint Manager API

CRUD simples em Node.js para gerenciar dados de sprints, conectando com MongoDB.

## Estrutura dos Dados

```json
{
  "_id": {
    "$oid": "6874e5b57a515193aa610b6b"
  },
  "assignee_id": "97dcf473-0a2a-4752-b820-e22c8d092d00",
  "name": "Geral",
  "sprint": 58,
  "productivity": {
    "factory": 60,
    "sustain": 64,
    "bi": 66
  },
  "accuracy": {
    "factory": null,
    "sustain": null,
    "bi": null
  }
}
```

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env`
4. Certifique-se de que o MongoDB está rodando
5. Inicie o servidor:
   ```bash
   npm start
   ```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## Variáveis de Ambiente

- `MONGODB_URI`: URI de conexão com o MongoDB (padrão: mongodb://localhost:27017/sprint_manager)
- `PORT`: Porta do servidor (padrão: 3000)
- `DB_NAME`: Nome do banco de dados (padrão: sprint_manager)
- `COLLECTION_NAME`: Nome da coleção (padrão: sprints)

## Endpoints da API

### Status da API
- `GET /api/status` - Verificar status da API

### Sprints
- `GET /api/sprints` - Buscar todos os sprints
- `GET /api/sprints/:id` - Buscar sprint por ID
- `GET /api/sprints/assignee/:assigneeId` - Buscar sprints por assignee
- `GET /api/sprints/number/:sprintNumber` - Buscar sprints por número da sprint
- `POST /api/sprints` - Criar novo sprint
- `PUT /api/sprints/:id` - Atualizar sprint
- `DELETE /api/sprints/:id` - Deletar sprint

## Exemplos de Uso

### Criar um novo sprint
```bash
POST /api/sprints
Content-Type: application/json

{
  "assignee_id": "97dcf473-0a2a-4752-b820-e22c8d092d00",
  "name": "Geral",
  "sprint": 58,
  "productivity": {
    "factory": 60,
    "sustain": 64,
    "bi": 66
  },
  "accuracy": {
    "factory": null,
    "sustain": null,
    "bi": null
  }
}
```

### Atualizar um sprint
```bash
PUT /api/sprints/6874e5b57a515193aa610b6b
Content-Type: application/json

{
  "productivity": {
    "factory": 65,
    "sustain": 70,
    "bi": 68
  }
}
```

### Buscar sprints por assignee
```bash
GET /api/sprints/assignee/97dcf473-0a2a-4752-b820-e22c8d092d00
```

## Estrutura do Projeto

```
sprint-manager/
├── src/
│   ├── app.js          # Aplicação principal
│   ├── database.js     # Configuração do banco de dados
│   ├── sprintService.js # Lógica de negócio dos sprints
│   └── routes.js       # Definição das rotas da API
├── .env                # Variáveis de ambiente
├── package.json        # Dependências e scripts
└── README.md          # Documentação
```

## Dependências

- **express**: Framework web para Node.js
- **mongodb**: Driver oficial do MongoDB para Node.js
- **dotenv**: Carregamento de variáveis de ambiente
- **cors**: Middleware para CORS
- **nodemon**: Auto-reload para desenvolvimento

## Recursos

- ✅ CRUD completo para sprints
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ Conexão com MongoDB via mongosh
- ✅ Busca por diferentes critérios
- ✅ Logs de requisições
- ✅ Encerramento gracioso do servidor
- ✅ Middleware de CORS configurado
