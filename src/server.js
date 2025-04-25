const http = require('http');
const app = require('./app');

// Definir porta
const port = process.env.PORT || 3000;

// Criar servidor HTTP
const server = http.createServer(app);

// Iniciar servidor
server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
