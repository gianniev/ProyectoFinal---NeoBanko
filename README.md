# Neo Banko - Proyecto Final

Aplicacion full stack de banca digital con:
- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: PostgreSQL

Incluye:
- Registro e inicio de sesion (JWT)
- Login con Google OAuth
- Consulta de cuenta y saldo
- Transferencias entre usuarios
- Historial de transacciones
- Mercado cripto y compra de criptomonedas
- Configuracion de usuario (idioma y cambio de password)

---

## 1. Estructura del proyecto

```text
Project/
  neo-banko-app/        # Frontend (React)
  neo-banko-backend/    # Backend (Express + PostgreSQL)
  docker-compose.yml    # PostgreSQL en Docker
  schema.sql            # Script SQL de esquema (entrega)
```

---

## 2. Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- Docker Desktop (opcional, recomendado para PostgreSQL)

---

## 3. Variables de entorno

### Frontend

Archivo: `neo-banko-app/.env`

```env
VITE_API_URL=http://localhost:5000
```

Puedes copiar desde:
- `neo-banko-app/.env.example`

### Backend

Archivo: `neo-banko-backend/.env`

Referencia:
- `neo-banko-backend/.env.example`

Variables principales:
- `PORT=5000`
- `FRONTEND_URL=http://localhost:5173`
- `GOOGLE_AUTH_SUCCESS_REDIRECT=http://localhost:5173/auth/google/callback`
- `DB_HOST=localhost`
- `DB_PORT=5440`
- `DB_NAME=neo-banko`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `JWT_SECRET=<minimo 32 caracteres>`
- `API_COIN_MARKETCAP=<api key>`
- `GOOGLE_CLIENT_ID=<client id>`
- `GOOGLE_CLIENT_SECRET=<client secret>`
- `GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback`

---

## 4. Levantar la base de datos (Docker)

Desde la raiz:

```bash
docker compose up -d
```

Esto levanta PostgreSQL en:
- host: `localhost`
- puerto: `5440`
- db: `neo-banko`
- user: `postgres`
- password: `postgres`

---

## 5. Instalacion y ejecucion

### 5.1 Backend

```bash
cd neo-banko-backend
npm install
npm run dev
```

Servidor backend:
- `http://localhost:5000`

Health check:
- `GET http://localhost:5000/api/health`

### 5.2 Frontend

En otra terminal:

```bash
cd neo-banko-app
npm install
npm run dev
```

App frontend:
- `http://localhost:5173`

---

## 6. Migraciones y SQL

Al iniciar el backend se ejecutan migraciones automaticamente desde:
- `neo-banko-backend/src/database/migrations/init.js`

Tambien se incluye script SQL de esquema para entrega:
- `schema.sql`

---

## 7. Endpoints principales

Base API auth:
- `/api/auth`

Publicos:
- `POST /api/auth/register`
- `POST /api/auth/login`

Protegidos (JWT):
- `GET /api/auth/me`
- `GET /api/auth/account/balance`
- `POST /api/auth/transactions/transfer`
- `GET /api/auth/transactions/history`
- `GET /api/auth/crypto`
- `GET /api/auth/crypto/market`
- `GET /api/auth/crypto/portfolio`
- `POST /api/auth/crypto/buy`
- `PUT /api/auth/password`

OAuth Google:
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/logout`

---

## 8. Scripts npm

### Frontend (`neo-banko-app/package.json`)
- `npm run dev`
- `npm run build`
- `npm run preview`

### Backend (`neo-banko-backend/package.json`)
- `npm run dev`
- `npm start`

---

## 9. Notas de entrega

Para la entrega final del PFC, en la carpeta comprimida suelen incluirse:
- Memoria del proyecto
- Codigo de la aplicacion
- BBDD exportada
- `url.txt` (URL del hosting)
- `credenciales.txt` (usuarios de prueba)
- Video de defensa
- PDF de presentacion (si aplica)

---

## 10. Autor

Proyecto final DAW - Neo Banko.

