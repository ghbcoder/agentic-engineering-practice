const tagsQueries = require('../db/queries/tags');
const { HttpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

function listTags() {
  return tagsQueries.findAllTags();
}

// Tag names are stored lowercase and trimmed, so names are unique ignoring case
function createTag({ name }) {
  if (!name || !isNonEmptyString(name)) {
    throw new HttpError(400, 'name is required');
  }
  let id;
  try {
    id = tagsQueries.insertTag(name.toLowerCase().trim());
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      throw new HttpError(409, 'tag already exists');
    }
    throw err;
  }
  return tagsQueries.findTagById(id);
}

module.exports = { listTags, createTag };
