const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`Taskr API running on port ${PORT}`);
});
