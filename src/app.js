const express = require('express');
const { requestLogger } = require('./middleware/request-logger');
const { errorHandler } = require('./middleware/error-handler');
const { statusRouter } = require('./routes/status');
const { webhooksRouter } = require('./routes/webhooks');
const { usersRouter } = require('./routes/users');
const { projectsRouter } = require('./routes/projects');
const { tasksRouter } = require('./routes/tasks');
const { commentsRouter } = require('./routes/comments');
const { taskTagsRouter } = require('./routes/task-tags');
const { tagsRouter } = require('./routes/tags');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use('/', statusRouter);
app.use('/webhooks', webhooksRouter);
app.use('/users', usersRouter);
app.use('/projects', projectsRouter);
app.use('/tasks/:id/comments', commentsRouter);
app.use('/tasks/:id/tags', taskTagsRouter);
app.use('/tasks', tasksRouter);
app.use('/tags', tagsRouter);

app.use(errorHandler);

module.exports = app;
