⚽ Bolanope API

API desenvolvida em Laravel 10 utilizando PostgreSQL e Docker.

---

# 📦 Stack

- PHP 8.2 (FPM)
- Laravel
- PostgreSQL 15
- Nginx (Alpine)
- Docker Compose

---

# 🚀 Como rodar o projeto

## ✅ 1. Pré-requisitos

Você precisa ter instalado:

- Docker
- Docker Compose

Verifique:

docker -v
docker compose version

---

## ✅ 2. Clone o projeto

git clone <URL_DO_REPOSITORIO>
cd bolanope

---

## ✅ 3. Suba os containers

docker compose up -d --build

Isso irá subir:

- bolanope_app (PHP-FPM)
- bolanope_nginx
- bolanope_postgres

Verifique:

docker ps

---

## ✅ 4. Instalar dependências do Laravel

Entre no container da aplicação:

docker exec -it bolanope_app bash

Dentro do container:

composer install

---

## ✅ 5. Configurar o .env

Configuração padrão do banco:

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=bolanope
DB_USERNAME=menines
DB_PASSWORD=Menines@123

Gerar chave se necessário:

php artisan key:generate

---

## ✅ 6. Rodar migrations

php artisan migrate

Para resetar banco:

php artisan migrate:fresh --seed

---

# 🌐 Acessar a API

http://localhost:8000

Exemplo:

http://localhost:8000/api/organizations

---

# 🐘 PostgreSQL

Host: localhost  
Port: 5432  
Database: bolanope  
User: menines  
Password: Menines@123

---

# 🧪 Comandos úteis

Parar containers:

docker compose down

Remover volumes:

docker compose down -v

Rebuild completo:

docker compose down -v
docker compose up -d --build

Ver logs:

docker compose logs -f

Entrar no container:

docker exec -it bolanope_app bash

---

# 🔐 Autenticação

A API utiliza Laravel Sanctum.

Para acessar rotas protegidas:

Authorization: Bearer SEU_TOKEN
Accept: application/json

---

# 📌 Estrutura de containers

| Serviço    | Container         |
| ---------- | ----------------- |
| PHP-FPM    | bolanope_app      |
| Nginx      | bolanope_nginx    |
| PostgreSQL | bolanope_postgres |

---

# 🛠 Problemas comuns

Erro de conexão com banco:

- Verifique DB_HOST=postgres
- Verifique se container postgres está rodando

Migration não aplicou:

php artisan migrate:fresh

Permissão de pasta:

chmod -R 777 storage bootstrap/cache

---

# 🧠 Arquitetura da API

- Service Layer
- Form Requests
- Middleware org.member
- Middleware org.admin
- Enum para posição do jogador
- Stats armazenados no pivot organization_players
- Senhas armazenadas com hash
- Estrutura RESTful com /me

---

# 📌 Endpoints principais

## Autenticação

POST /api/auth/register
POST /api/auth/login
GET /api/me
POST /api/auth/logout

## Organizações

GET /api/organizations
POST /api/organizations
GET /api/me/organizations
POST /api/me/organizations/{organization}/join

## Administração da organização

PUT /api/organizations/{organization}/password
POST /api/organizations/{organization}/players
DELETE /api/organizations/{organization}/players/{player}
PUT /api/organizations/{organization}/players/{player}/stats

---

Projeto pronto para desenvolvimento 🚀
