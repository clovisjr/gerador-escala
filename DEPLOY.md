# Instruções para Implantação em Produção

Este documento contém instruções para implantar o Sistema de Gerenciamento de Escalas para Igreja em um ambiente de produção.

## Opção 1: Implantação em Servidor VPS/Dedicado

### Requisitos
- Servidor Linux (Ubuntu 20.04 ou superior recomendado)
- Node.js (v14 ou superior)
- NPM (v6 ou superior)
- Nginx ou Apache (opcional, para proxy reverso)
- PM2 (para gerenciamento de processos)

### Passos para Implantação

1. Transfira os arquivos do projeto para o servidor
2. Instale as dependências:
   ```
   npm install --production
   ```
3. Instale o PM2 globalmente:
   ```
   npm install -g pm2
   ```
4. Inicie a aplicação com PM2:
   ```
   pm2 start src/server.js --name church-schedule-app
   ```
5. Configure o PM2 para iniciar automaticamente após reinicialização:
   ```
   pm2 startup
   pm2 save
   ```

### Configuração de Proxy Reverso (Nginx)

Se você estiver usando Nginx como proxy reverso, aqui está uma configuração básica:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Opção 2: Implantação em Plataformas PaaS

### Heroku

1. Crie uma conta no Heroku (https://heroku.com)
2. Instale o Heroku CLI
3. Inicialize um repositório Git no diretório do projeto:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```
4. Crie um novo aplicativo Heroku:
   ```
   heroku create
   ```
5. Adicione o add-on do PostgreSQL (opcional, se preferir usar PostgreSQL em vez de SQLite):
   ```
   heroku addons:create heroku-postgresql:hobby-dev
   ```
6. Implante o código:
   ```
   git push heroku main
   ```

### Render

1. Crie uma conta no Render (https://render.com)
2. Crie um novo Web Service
3. Conecte ao seu repositório Git
4. Configure as seguintes opções:
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - Environment Variables: Configure as variáveis de ambiente necessárias

## Variáveis de Ambiente

Para ambientes de produção, recomendamos configurar as seguintes variáveis de ambiente:

- `PORT`: Porta em que o servidor irá rodar (padrão: 3000)
- `NODE_ENV`: Ambiente de execução (production)
- `JWT_SECRET`: Chave secreta para geração de tokens JWT (deve ser uma string longa e aleatória)
- `DATABASE_URL`: URL de conexão com o banco de dados (se estiver usando outro banco além do SQLite)

## Segurança

Para ambientes de produção, recomendamos:

1. Alterar o usuário e senha padrão imediatamente
2. Configurar HTTPS usando Let's Encrypt ou similar
3. Implementar limites de taxa (rate limiting) para prevenir ataques de força bruta
4. Realizar backups regulares do banco de dados
