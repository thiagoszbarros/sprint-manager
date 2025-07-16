const database = require('./database');

class SprintService {
  constructor() {
    this.collection = null;
  }

  init() {
    this.collection = database.getCollection();
  }

  // Criar um novo sprint
  async createSprint(sprintData) {
    try {
      // Validar estrutura dos dados
      const validatedData = this.validateSprintData(sprintData);
      
      const result = await this.collection.insertOne(validatedData);
      
      if (result.acknowledged) {
        return await this.collection.findOne({ _id: result.insertedId });
      }
      
      throw new Error('Falha ao criar sprint');
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      throw error;
    }
  }

  // Buscar todos os sprints
  async getAllSprints() {
    try {
      const sprints = await this.collection.find({}).toArray();
      return sprints;
    } catch (error) {
      console.error('Erro ao buscar sprints:', error);
      throw error;
    }
  }

  // Buscar sprint por ID
  async getSprintById(id) {
    try {
      if (!database.isValidObjectId(id)) {
        throw new Error('ID inválido');
      }

      const sprint = await this.collection.findOne({ 
        _id: database.createObjectId(id) 
      });
      
      if (!sprint) {
        throw new Error('Sprint não encontrado');
      }
      
      return sprint;
    } catch (error) {
      console.error('Erro ao buscar sprint por ID:', error);
      throw error;
    }
  }

  // Buscar sprints por assignee_id
  async getSprintsByAssignee(assigneeId) {
    try {
      const sprints = await this.collection.find({ 
        assignee_id: assigneeId 
      }).toArray();
      
      return sprints;
    } catch (error) {
      console.error('Erro ao buscar sprints por assignee:', error);
      throw error;
    }
  }

  // Buscar sprints por número da sprint
  async getSprintsByNumber(sprintNumber) {
    try {
      const sprints = await this.collection.find({ 
        sprint: parseInt(sprintNumber) 
      }).toArray();
      
      return sprints;
    } catch (error) {
      console.error('Erro ao buscar sprints por número:', error);
      throw error;
    }
  }

  // Atualizar sprint
  async updateSprint(id, updateData) {
    try {
      if (!database.isValidObjectId(id)) {
        throw new Error('ID inválido');
      }

      // Validar dados de atualização
      const validatedData = this.validateSprintData(updateData, true);
      
      const result = await this.collection.updateOne(
        { _id: database.createObjectId(id) },
        { $set: validatedData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Sprint não encontrado');
      }

      if (result.modifiedCount === 0) {
        throw new Error('Nenhuma modificação foi feita');
      }

      return await this.collection.findOne({ 
        _id: database.createObjectId(id) 
      });
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
      throw error;
    }
  }

  // Deletar sprint
  async deleteSprint(id) {
    try {
      if (!database.isValidObjectId(id)) {
        throw new Error('ID inválido');
      }

      const result = await this.collection.deleteOne({ 
        _id: database.createObjectId(id) 
      });

      if (result.deletedCount === 0) {
        throw new Error('Sprint não encontrado');
      }

      return { message: 'Sprint deletado com sucesso' };
    } catch (error) {
      console.error('Erro ao deletar sprint:', error);
      throw error;
    }
  }

  // Validar estrutura dos dados do sprint
  validateSprintData(data, isUpdate = false) {
    const validatedData = {};

    // Campos obrigatórios para criação
    if (!isUpdate) {
      if (!data.assignee_id || typeof data.assignee_id !== 'string') {
        throw new Error('assignee_id é obrigatório e deve ser uma string');
      }
      if (!data.name || typeof data.name !== 'string') {
        throw new Error('name é obrigatório e deve ser uma string');
      }
      if (!data.sprint || typeof data.sprint !== 'number') {
        throw new Error('sprint é obrigatório e deve ser um número');
      }
    }

    // Validar campos se fornecidos
    if (data.assignee_id !== undefined) {
      if (typeof data.assignee_id !== 'string') {
        throw new Error('assignee_id deve ser uma string');
      }
      validatedData.assignee_id = data.assignee_id;
    }

    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        throw new Error('name deve ser uma string');
      }
      validatedData.name = data.name;
    }

    if (data.sprint !== undefined) {
      if (typeof data.sprint !== 'number') {
        throw new Error('sprint deve ser um número');
      }
      validatedData.sprint = data.sprint;
    }

    // Validar productivity
    if (data.productivity !== undefined) {
      if (typeof data.productivity !== 'object' || data.productivity === null) {
        throw new Error('productivity deve ser um objeto');
      }
      
      const productivity = {};
      ['factory', 'sustain', 'bi'].forEach(key => {
        if (data.productivity[key] !== undefined) {
          if (data.productivity[key] !== null && typeof data.productivity[key] !== 'number') {
            throw new Error(`productivity.${key} deve ser um número ou null`);
          }
          productivity[key] = data.productivity[key];
        }
      });
      
      if (Object.keys(productivity).length > 0) {
        validatedData.productivity = productivity;
      }
    }

    // Validar accuracy
    if (data.accuracy !== undefined) {
      if (typeof data.accuracy !== 'object' || data.accuracy === null) {
        throw new Error('accuracy deve ser um objeto');
      }
      
      const accuracy = {};
      ['factory', 'sustain', 'bi'].forEach(key => {
        if (data.accuracy[key] !== undefined) {
          if (data.accuracy[key] !== null && typeof data.accuracy[key] !== 'number') {
            throw new Error(`accuracy.${key} deve ser um número ou null`);
          }
          accuracy[key] = data.accuracy[key];
        }
      });
      
      if (Object.keys(accuracy).length > 0) {
        validatedData.accuracy = accuracy;
      }
    }

    return validatedData;
  }

  // Buscar dados para dashboard
  async getDashboardData(assigneeId) {
    try {
      // Buscar todos os sprints do assignee
      const allSprints = await this.getSprintsByAssignee(assigneeId);
      
      if (allSprints.length === 0) {
        throw new Error('Nenhum sprint encontrado para este assignee');
      }

      // Ordenar por número da sprint (assumindo que números maiores são mais recentes)
      const sortedSprints = allSprints.sort((a, b) => b.sprintNumber - a.sprintNumber);
      
      // Pegar as últimas 2 sprints
      const lastTwoSprints = sortedSprints.slice(0, 2);
      
      // Calcular médias globais
      const globalAverages = this.calculateGlobalAverages(allSprints);
      
      return {
        lastTwoSprints,
        globalAverages,
        totalSprints: allSprints.length,
        assigneeId
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  // Calcular médias globais
  calculateGlobalAverages(sprints) {
    if (sprints.length === 0) {
      return {
        productivity: { factory: 0, sustain: 0, bi: 0 },
        accuracy: { factory: 0, sustain: 0, bi: 0 }
      };
    }

    const totals = {
      productivity: { factory: 0, sustain: 0, bi: 0, count: { factory: 0, sustain: 0, bi: 0 } },
      accuracy: { factory: 0, sustain: 0, bi: 0, count: { factory: 0, sustain: 0, bi: 0 } }
    };

    sprints.forEach(sprint => {
      // Produtividade
      if (sprint.productivity) {
        if (sprint.productivity.factory !== undefined && sprint.productivity.factory !== null) {
          totals.productivity.factory += sprint.productivity.factory;
          totals.productivity.count.factory++;
        }
        if (sprint.productivity.sustain !== undefined && sprint.productivity.sustain !== null) {
          totals.productivity.sustain += sprint.productivity.sustain;
          totals.productivity.count.sustain++;
        }
        if (sprint.productivity.bi !== undefined && sprint.productivity.bi !== null) {
          totals.productivity.bi += sprint.productivity.bi;
          totals.productivity.count.bi++;
        }
      }

      // Acurácia
      if (sprint.accuracy) {
        if (sprint.accuracy.factory !== undefined && sprint.accuracy.factory !== null) {
          totals.accuracy.factory += sprint.accuracy.factory;
          totals.accuracy.count.factory++;
        }
        if (sprint.accuracy.sustain !== undefined && sprint.accuracy.sustain !== null) {
          totals.accuracy.sustain += sprint.accuracy.sustain;
          totals.accuracy.count.sustain++;
        }
        if (sprint.accuracy.bi !== undefined && sprint.accuracy.bi !== null) {
          totals.accuracy.bi += sprint.accuracy.bi;
          totals.accuracy.count.bi++;
        }
      }
    });

    // Calcular médias
    const averages = {
      productivity: {
        factory: totals.productivity.count.factory > 0 ? Math.round(totals.productivity.factory / totals.productivity.count.factory) : 0,
        sustain: totals.productivity.count.sustain > 0 ? Math.round(totals.productivity.sustain / totals.productivity.count.sustain) : 0,
        bi: totals.productivity.count.bi > 0 ? Math.round(totals.productivity.bi / totals.productivity.count.bi) : 0
      },
      accuracy: {
        factory: totals.accuracy.count.factory > 0 ? Math.round(totals.accuracy.factory / totals.accuracy.count.factory) : 0,
        sustain: totals.accuracy.count.sustain > 0 ? Math.round(totals.accuracy.sustain / totals.accuracy.count.sustain) : 0,
        bi: totals.accuracy.count.bi > 0 ? Math.round(totals.accuracy.bi / totals.accuracy.count.bi) : 0
      }
    };

    return averages;
  }
}

module.exports = new SprintService();
