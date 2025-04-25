const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initialize } = require('./database/database');

// Inicializar o banco de dados
const db = initialize();

// Criar aplicação Express
const app = express();

// Configurar middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar EJS como view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Importar rotas
const membersRoutes = require('./routes/members');
const schedulesRoutes = require('./routes/schedules');
const eventsRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

// Usar rotas
app.use('/api/members', membersRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Rota principal para renderizar a aplicação frontend
app.get('/', (req, res) => {
  res.render('index');
});

// Rota para página não encontrada
app.use((req, res) => {
  res.status(404).render('404');
});

// Manipulador de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: err });
});

// Exportar app para uso no servidor
module.exports = app;
