const projectsQueries = require('../db/queries/projects');
const { countTasksByStatusForProject } = require('../db/queries/tasks');
const { HttpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

function listProjects() {
  return projectsQueries.findAllProjects();
}

function createProject({ name, description, owner_id }) {
  if (!name || !isNonEmptyString(name)) {
    throw new HttpError(400, 'name is required');
  }
  const id = projectsQueries.insertProject({
    name,
    description: description || null,
    ownerId: owner_id || null
  });
  return projectsQueries.findProjectById(id);
}

// Task counts per status, with every status present and a total
function getProjectStats(projectId) {
  const stats = { total: 0, active: 0, completed: 0, archived: 0 };
  for (const row of countTasksByStatusForProject(projectId)) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}

// Returns the project with its task stats, or null if it doesn't exist
function getProjectById(id) {
  const project = projectsQueries.findProjectById(id);
  if (!project) return null;
  return { ...project, stats: getProjectStats(id) };
}

function updateProject(id, body) {
  const existing = projectsQueries.findProjectById(id);
  if (!existing) throw new HttpError(404, 'Project not found');

  projectsQueries.updateProject(id, {
    name: body.name !== undefined ? body.name : existing.name,
    description: body.description !== undefined ? body.description : existing.description,
    ownerId: body.owner_id !== undefined ? body.owner_id : existing.owner_id
  });
  return projectsQueries.findProjectById(id);
}

function deleteProject(id) {
  if (projectsQueries.deleteProject(id) === 0) {
    throw new HttpError(404, 'Project not found');
  }
  return { deleted: true };
}

module.exports = { listProjects, createProject, getProjectById, updateProject, deleteProject };
