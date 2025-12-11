# Plan de Trabajo: App de Costeo de Platillos

Esta aplicación está diseñada para gestionar el costeo de recetas, sub-recetas e ingredientes, permitiendo un control detallado de márgenes y precios sugeridos.

## Tecnologías
- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Base de Datos**: MongoDB Atlas
- **Estilos**: CSS Modules (Vanilla CSS) con diseño moderno y responsivo.

## Fases del Proyecto

### Fase 1: Configuración e Inicialización
- [ ] **Inicializar Repositorio y Estructura**: Crear estructura monorepo o separar `client` y `server`. Definiremos `client` (Frontend) y `server` (Backend).
- [ ] **Configuración de Dependencias**: Instalar React, Express, Mongoose, etc.
- [ ] **Conexión a Base de Datos**: Configurar conexión a MongoDB Atlas vía `.env`.

### Fase 2: Backend (API & Modelos)
- [ ] **Modelo de Ingredientes**: Esquema con nombre, unidad, costo, rendimiento, tipo.
- [ ] **Modelo de Recetas y Sub-recetas**: Esquema que permite anidación de ingredientes.
- [ ] **Lógica de Negocio**:
    - Cálculos de mermas y rendimientos.
    - Cálculo de costo real vs costo ideal.
    - Cálculo de factor de utilidad y precio sugerido.
- [ ] **Endpoints (API)**: CRUD para Ingredientes, Sub-recetas y Recetas.

### Fase 3: Frontend (Interfaz de Usuario)
- [ ] **Diseño Base**:
    - Configurar paleta de colores moderna y tipografía.
    - Crear Layout con **Barra Lateral (Sidebar)** y área de contenido responsiva.
- [ ] **Módulo de Ingredientes**:
    - Pantalla de listado y formulario de creación.
    - Distinción visual entre Ingrediente y Sub-receta.
- [ ] **Módulo de Sub-recetas**:
    - Interfaz para componer sub-recetas a partir de ingredientes base.
- [ ] **Módulo de Recetas**:
    - Formulario avanzado para agregar productos, cantidades y ver cálculos en tiempo real.
    - Visualización final: Costo Platillo, Factor Utilidad, Costo Sugerido.
- [ ] **Dashboard**:
    - Visualización de movimientos recientes.
    - Alertas visuales para recetas fuera del margen establecido.

### Fase 4: Refinamiento y Pruebas
- [ ] **Optimización UX/UI**: Animaciones, transiciones, feedback visual.
- [ ] **Responsividad**: Ajustes para móviles y tablets.
- [ ] **Pruebas de Cálculo**: Verificar exactitud de los costeos.

---
**Nota**: Para la base de datos MongoDB Atlas, se requerirá una `MONGO_URI` en un archivo `.env`.
