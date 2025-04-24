# Sistema de Gerenciamento de Escalas para Igreja

Este sistema foi desenvolvido para gerenciar escalas de trabalho para membros de uma igreja, incluindo escalas de EBD, Louvor e Cultos.

## Requisitos

- Node.js (v14 ou superior)
- NPM (v6 ou superior)

## Instalação

1. Extraia os arquivos do pacote em um diretório de sua escolha
2. Abra um terminal e navegue até o diretório do projeto
3. Execute o comando para instalar as dependências:

```
npm install
```

4. Inicie o servidor:

```
npm start
```

5. Acesse a aplicação em seu navegador:

```
http://localhost:3000
```

## Estrutura do Projeto

- `src/`: Código-fonte da aplicação
  - `controllers/`: Controladores da aplicação
  - `models/`: Modelos de dados
  - `routes/`: Rotas da API
  - `views/`: Templates EJS para o frontend
  - `public/`: Arquivos estáticos (CSS, JS, imagens)
  - `config/`: Arquivos de configuração
  - `database/`: Scripts de banco de dados
  - `middlewares/`: Middlewares Express
  - `utils/`: Funções utilitárias

## Funcionalidades

- Gerenciamento de membros da igreja
- Criação e edição de escalas para EBD, Louvor e Cultos
- Geração automática de escalas com base em regras predefinidas
- Interface amigável e responsiva
- Sistema de autenticação para controle de acesso

## Usuário Padrão

Ao iniciar a aplicação pela primeira vez, um usuário administrador é criado automaticamente:

- Usuário: admin
- Senha: admin123

Recomendamos alterar esta senha após o primeiro acesso.

## Suporte

Para suporte ou dúvidas, entre em contato com o desenvolvedor.
