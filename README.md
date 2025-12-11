# CosteoApp - Manual de Inicio

Bienvenido al proyecto **CosteoApp**. Esta es una aplicación web para el costeo de platillos, gestión de recetas e inventario.

El proyecto está dividido en dos partes principales:
- **Client (Frontend)**: Realizado con React + Vite.
- **Server (Backend)**: Realizado con Node.js + Express + MongoDB.

---

## 🚀 Requisitos Previos

1.  **Node.js**: Asegúrate de tener instalado Node.js (versión 14 o superior).
2.  **MongoDB Atlas**: Necesitas una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) y un clúster creado para obtener tu cadena de conexión (`MONGO_URI`).

---

## 🛠️ Configuración Inicial

Sigue estos pasos la primera vez que descargues o clones el proyecto.

### 1. Configuración del Servidor (Backend)

1.  Ve a la carpeta `server`:
    ```bash
    cd server
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Configura las variables de entorno:
    - Abre el archivo `.env` ubicado en `server/.env`.
    - Busca la línea que dice `MONGO_URI`.
    - **IMPORTANTE**: Reemplaza el texto de ejemplo con tu cadena de conexión real de MongoDB Atlas.
    
    Ejemplo:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://tu_usuario:tu_contraseña@cluster0.abcde.mongodb.net/costeo-app?retryWrites=true&w=majority
    ```

### 2. Configuración del Cliente (Frontend)

1.  Ve a la carpeta `client`:
    ```bash
    cd client
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```

---

## ▶️ Cómo Iniciar la Aplicación

Para trabajar, necesitas tener **dos terminales** abiertas: una para el servidor y otra para el cliente.

### Terminal 1: Iniciar Servidor (Backend)
```bash
cd server
npm run dev
```
*Deberías ver un mensaje como: `Server running on port 5000` y luego `MongoDB Connected`.*

### Terminal 2: Iniciar Cliente (Frontend)
```bash
cd client
npm run dev
```
*Verás un mensaje indicando que la app está corriendo en `http://localhost:5173/`.*

---

## 📋 Resumen de Comandos

| Acción | Directorio | Comando |
| :--- | :--- | :--- |
| Instalar dependencias backend | `server/` | `npm install` |
| Instalar dependencias frontend | `client/` | `npm install` |
| **Iniciar Backend (Modo Desarrollo)** | `server/` | `npm run dev` |
| **Iniciar Frontend** | `client/` | `npm run dev` |

---

## ⚠️ Solución de Problemas Comunes

-   **Error de conexión a MongoDB**: Verifica que tu IP esté permitida en el panel de "Network Access" de MongoDB Atlas.
-   **Puerto ocupado**: Si el puerto 5000 está ocupado, cambia el puerto en el archivo `.env` del servidor.
