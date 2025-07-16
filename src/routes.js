const express = require('express');
const sprintService = require('./sprintService');

const router = express.Router();

// GET /api/sprints - Buscar todos os sprints
router.get('/', async (req, res) => {
  try {
    const sprints = await sprintService.getAllSprints();

    res.json({
      success: true,
      data: sprints,
      count: sprints.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sprints',
      error: error.message
    });
  }
});

// GET /api/sprints/:id - Buscar sprint por ID
router.get('/:id', async (req, res) => {
  try {
    const sprint = await sprintService.getSprintById(req.params.id);
    res.json({
      success: true,
      data: sprint
    });
  } catch (error) {
    const statusCode = error.message.includes('ID inválido') || error.message.includes('não encontrado') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Erro ao buscar sprint',
      error: error.message
    });
  }
});

// GET /api/sprints/assignee/:assigneeId - Buscar sprints por assignee
router.get('/assignee/:assigneeId', async (req, res) => {
  try {
    const sprints = await sprintService.getSprintsByAssignee(req.params.assigneeId);
    res.json({
      success: true,
      data: sprints,
      count: sprints.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sprints por assignee',
      error: error.message
    });
  }
});

// GET /api/sprints/number/:sprintNumber - Buscar sprints por número
router.get('/number/:sprintNumber', async (req, res) => {
  try {
    const sprints = await sprintService.getSprintsByNumber(req.params.sprintNumber);
    res.json({
      success: true,
      data: sprints,
      count: sprints.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sprints por número',
      error: error.message
    });
  }
});

// POST /api/sprints - Criar novo sprint
router.post('/', async (req, res) => {
  try {
    const newSprint = await sprintService.createSprint(req.body);
    res.status(201).json({
      success: true,
      message: 'Sprint criado com sucesso',
      data: newSprint
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erro ao criar sprint',
      error: error.message
    });
  }
});

// PUT /api/sprints/:id - Atualizar sprint
router.put('/:id', async (req, res) => {
  try {
    const updatedSprint = await sprintService.updateSprint(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Sprint atualizado com sucesso',
      data: updatedSprint
    });
  } catch (error) {
    const statusCode = error.message.includes('ID inválido') || error.message.includes('não encontrado') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'Erro ao atualizar sprint',
      error: error.message
    });
  }
});

// DELETE /api/sprints/:id - Deletar sprint
router.delete('/:id', async (req, res) => {
  try {
    const result = await sprintService.deleteSprint(req.params.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    const statusCode = error.message.includes('ID inválido') || error.message.includes('não encontrado') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Erro ao deletar sprint',
      error: error.message
    });
  }
});

module.exports = router;
