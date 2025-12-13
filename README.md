# CosteoApp - Sistema de Costeo de Recetas

Aplicación web moderna para la gestión de recetas, ingredientes, sub-recetas y cálculo de costos para restaurantes y negocios gastronómicos.

## 🚀 Características

- **Dashboard Interactivo**: Vista general de recetas y costos.
- **Gestión de Ingredientes**: CRUD completo con precios y mermas.
- **Recetas y Sub-recetas**: Sistema anidado para cálculos precisos (Ingrediente -> Sub-receta -> Receta).
- **Cálculo de Costos**: Costo real vs costo ideal, margenes de ganancia y sugerencia de precios.
- **Autenticación Segura**: Sistema de login con JWT y contraseñas encriptadas.
- **Roles de Usuario**: Admin, Chef y Visualizador.
- **Diseño Responsivo**: Interfaz moderna adaptable a móviles y escritorio (Glassmorphism).

## 🛠️ Tecnologías

### Frontend (Client)
- React + Vite
- React Router DOM
- CSS Modules (Diseño personalizado)
- Lucide React (Iconos)
- Axios

### Backend (Server)
- Node.js + Express
- MongoDB (Mongoose)
- JWT (JSON Web Tokens)
- Bcryptjs

### 🔒 Seguridad
- **Helmet** - Headers HTTP seguros
- **Rate Limiting** - Protección contra ataques de fuerza bruta
- **CORS Estricto** - Solo orígenes autorizados
- **XSS Clean** - Sanitización de entradas
- **Mongo Sanitize** - Prevención de inyección NoSQL
- **Express Validator** - Validación robusta de datos

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repo-url>
   cd Costeo-app
   ```

2. **Instalar dependencias del Servidor**
   ```bash
   cd server
   npm install
   ```

3. **Instalar dependencias del Cliente**
   ```bash
   cd ../client
   npm install
   ```

## ⚙️ Configuración

1. **Variables de Entorno (Backend)**
   Crea un archivo `.env` en la carpeta `server/` basándote en `.env.example`:
   ```bash
   MONGO_URI=tu_connection_string_de_mongodb
   PORT=5000
   JWT_SECRET=tu_secreto_super_seguro
   ```

## 💾 Base de Datos (Seed)

Para poblar la base de datos con usuarios iniciales (necesario para el primer login):

```bash
cd server
node seedUsers.js
```

## ▶️ Ejecución

Necesitas dos terminales abiertas:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

## 🔐 Credenciales de Prueba

El sistema viene pre-cargado con los siguientes usuarios (después de ejecutar `seedUsers.js`):

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | admin@costeo.com | admin |
| **Auxiliar** | aux@costeo.com | aux |
| **Chef** | chef@costeo.com | chef |

---
Desarrollado con ❤️ para optimizar costos gastronómicos.
