# 📊 Costeo App - Resumen de Funcionalidades

## Descripción General
Aplicación web para el costeo de platillos en restaurantes. Permite gestionar ingredientes, sub-recetas y recetas con cálculo automático de costos, márgenes y precios de venta sugeridos.

---

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de Datos**: MongoDB Atlas
- **Estilos**: CSS Modules con diseño moderno (glassmorphism, gradientes, modo oscuro)

### Estructura de Carpetas
```
Costeo-app/
├── client/                 # Frontend React
│   └── src/
│       ├── pages/          # Páginas principales
│       ├── contexts/       # AuthContext para autenticación
│       └── components/     # Componentes reutilizables
├── server/                 # Backend Node.js
│   ├── models/            # Modelos Mongoose
│   ├── routes/            # Rutas API
│   └── middleware/        # Auth middleware
└── README.md
```

---

## 📋 Módulos Principales

### 1. Dashboard (`Dashboard.jsx`)
- **Estadísticas generales**:
  - Total de ingredientes
  - Total de sub-recetas
  - Total de recetas
  - Margen promedio de todas las recetas
- **Tabla de Sub-recetas**: Muestra nombre, costo total, rendimiento y costo unitario
- **Tabla de Recetas**: Muestra nombre, costo, precio de venta y margen
- **Actualización automática**: Obtiene datos de la API y calcula costos dinámicamente

### 2. Ingredientes (`Ingredients.jsx`)
- **CRUD completo** de ingredientes
- **Campos**: Nombre, Costo, Unidad (kg, lt, pz, gr), Rendimiento (%)
- **Importación masiva** desde Excel
- **Descarga de plantilla** Excel
- **Sección de Sub-recetas**: Muestra el costo calculado de cada sub-receta

### 3. Categorías (`Categories.jsx`)
- Gestión de categorías para organizar recetas
- CRUD completo con colores personalizables

### 4. Sub-recetas (`SubRecipes.jsx`)
- **Crear preparaciones base** (salsas, bases, aguas, etc.)
- **Componentes**:
  - Ingredientes con cantidad y unidad de uso
  - Otras sub-recetas (recursivo)
- **Cálculo automático de costos**:
  - **Costo Total**: Suma del costo de todos los ingredientes
  - **Precio por Litro/Kg**: `Costo Total / Rendimiento`
  - **Precio por ml/gr**: `Precio por Litro / 1000`
- **Resumen visual** con tarjetas de precios por unidad

### 5. Recetas/Platillos (`Recipes.jsx`)
- **Crear platillos finales** combinando ingredientes y sub-recetas
- **Campos**:
  - Nombre del platillo
  - Categoría
  - Número de porciones (rendimiento)
  - Factor de utilidad
- **Cálculos automáticos**:
  - **Costo Total**: Suma de todos los componentes
  - **Costo por Porción**: `Costo Total / Porciones`
  - **Precio Sugerido**: `Costo por Porción × Factor de Utilidad`
  - **Margen**: `((Precio - Costo) / Precio) × 100`
- **Reglas especiales**:
  - Sub-recetas siempre tienen **rendimiento 100%** (ya calculado en su costo unitario)
  - Ingredientes conservan su rendimiento original (para considerar mermas)
- **Funcionalidades adicionales**:
  - **Modo Chef**: Vista simplificada para cocina
  - **Calculadora de Producción**: Escalar cantidades para X porciones
  - **Agrupación por Categorías**: Expansión/colapso de categorías

---

## 🔢 Fórmulas de Costeo

### Costo Real de Ingrediente
```
Precio Real = Precio / (Rendimiento / 100)
```
Ejemplo: Limón a $15.98/kg con 95% rendimiento = $16.82/kg real

### Conversión de Unidades
- Si precio en kg/lt y uso en gr/ml: `Precio Real / 1000`
- Si precio en gr/ml y uso en kg/lt: `Precio Real × 1000`

### Costo de Sub-receta
```
Costo Total = Σ (Costo Unitario × Cantidad de cada ingrediente)
Costo por Litro = Costo Total / Rendimiento en Litros
Costo por ml = Costo por Litro / 1000
```

### Costo de Receta
```
Costo Total = Σ (Costo de cada componente)
Costo por Porción = Costo Total / Número de Porciones
Precio Sugerido = Costo por Porción × Factor de Utilidad
Margen (%) = ((Precio Venta - Costo) / Precio Venta) × 100
```

---

## 🔐 Sistema de Autenticación y Roles

### Roles Disponibles
- **admin**: Acceso total
- **chef**: Puede crear/editar ingredientes, sub-recetas y recetas
- **viewer**: Solo lectura

### Middleware de Autorización
- `auth`: Verifica token JWT
- `authorizeRole`: Verifica permisos por rol

---

## 🎨 Características de UI/UX

### Diseño Visual
- **Modo Oscuro** por defecto
- **Glassmorphism**: Efectos de cristal con transparencias
- **Gradientes** sutiles en tarjetas y botones
- **Animaciones** suaves (fade-in, hover effects)
- **Colores semánticos**:
  - Verde (success): Valores positivos, guardar
  - Azul (accent): Acciones principales
  - Amarillo (warning): Advertencias, precios reales
  - Rojo (danger): Eliminar, valores negativos

### Responsividad
- CSS Modules con media queries
- Grid y Flexbox adaptativos
- Tablas con scroll horizontal en móvil

---

## 📡 API Endpoints

### Ingredientes
- `GET /api/ingredients` - Listar todos
- `POST /api/ingredients` - Crear nuevo
- `PUT /api/ingredients/:id` - Actualizar
- `DELETE /api/ingredients/:id` - Eliminar

### Sub-recetas
- `GET /api/subrecipes` - Listar todos (con populate de items)
- `POST /api/subrecipes` - Crear nueva
- `PUT /api/subrecipes/:id` - Actualizar
- `DELETE /api/subrecipes/:id` - Eliminar

### Recetas
- `GET /api/recipes` - Listar todas (con populate de items)
- `POST /api/recipes` - Crear nueva
- `PUT /api/recipes/:id` - Actualizar
- `DELETE /api/recipes/:id` - Eliminar

### Categorías
- `GET /api/categories` - Listar todas
- `POST /api/categories` - Crear nueva
- `PUT /api/categories/:id` - Actualizar
- `DELETE /api/categories/:id` - Eliminar

### Usuarios
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/users` - Listar usuarios (admin)
- `PUT /api/users/:id` - Actualizar rol (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)

---

## 📊 Modelos de Datos

### Ingredient
```javascript
{
  name: String,
  unit: String,        // kg, lt, pz, gr
  cost: Number,
  yield: Number,       // Porcentaje (ej: 95)
  category: String,
  isActive: Boolean
}
```

### SubRecipe
```javascript
{
  name: String,
  unit: String,        // lt, kg, pz
  yield: Number,       // Cantidad resultante (ej: 15 litros)
  items: [{
    item: ObjectId,    // Ref a Ingredient o SubRecipe
    itemModel: String, // 'Ingredient' o 'SubRecipe'
    quantity: Number
  }]
}
```

### Recipe
```javascript
{
  name: String,
  quantity: Number,     // Porciones
  unit: String,
  yield: Number,
  category: String,
  utilityFactor: Number,
  items: [{
    item: ObjectId,
    itemModel: String,
    quantity: Number
  }],
  totalCost: Number,
  realCost: Number,     // Costo por porción
  suggestedPrice: Number
}
```

---

## 🚀 Comandos de Ejecución

### Desarrollo
```bash
# Cliente (Frontend)
cd client
npm run dev

# Servidor (Backend)
cd server
npm run dev
```

### Producción
```bash
# Build del cliente
cd client
npm run build

# Servidor
cd server
npm start
```

---

## 📝 Últimas Actualizaciones (Diciembre 2024)

1. **Cálculo de costos por litro/mililitro** en sub-recetas
2. **Dashboard con actualización automática** desde la API
3. **Sub-recetas con rendimiento 100%** cuando se usan en recetas
4. **Resumen visual de costos por unidad** con tarjetas informativas
5. **Eliminación de sección de fórmula** en resumen de sub-recetas
6. **Migración de localStorage a API** para todos los datos

---

## 📞 Soporte

Para dudas o mejoras, contactar al equipo de desarrollo.

---

*Documentación generada el 12 de Diciembre de 2024*
