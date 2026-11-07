const taskTagsQueries = require('../db/queries/task-tags');
const { findTaskById } = require('../db/queries/tasks');
const { findTagById } = require('../db/queries/tags');
const { HttpError } = require('../utils/http-error');

function addTagToTask(taskId, { tag_id }) {
  if (!findTaskById(taskId)) throw new HttpError(404, 'Task not found');

  if (!tag_id) throw new HttpError(400, 'tag_id is required');
  const tagId = parseInt(tag_id);
  if (!findTagById(tagId)) throw new HttpError(404, 'Tag not found');

  try {
    taskTagsQueries.insertTaskTag(taskId, tagId);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      throw new HttpError(409, 'tag already applied to this task');
    }
    throw err;
  }
  return { task_id: taskId, tag_id: tagId };
}

function removeTagFromTask(taskId, tagId) {
  if (taskTagsQueries.deleteTaskTag(taskId, tagId) === 0) {
    throw new HttpError(404, 'Tag not applied to this task');
  }
  return { deleted: true };
}

module.exports = { addTagToTask, removeTagFromTask };
