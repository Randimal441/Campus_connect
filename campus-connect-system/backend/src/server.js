const connectDB = require('./config/db');
const app = require('./app');

const START_PORT = Number(process.env.PORT) || 5000;

const startServer = (port, retriesRemaining = 10) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retriesRemaining > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use, trying ${nextPort}...`);
      startServer(nextPort, retriesRemaining - 1);
      return;
    }

    console.error('Failed to start server:', err);
    process.exit(1);
  });
};

connectDB()
  .then(() => {
    startServer(START_PORT);
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
