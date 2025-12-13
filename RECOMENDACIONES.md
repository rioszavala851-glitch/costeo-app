# 📋 RECOMENDACIONES PRIORITARIAS - CosteoApp

> **Fecha de análisis:** 12 de Diciembre 2024  
> **Estado actual:** Aplicación funcional con modelo freemium implementado

---

## 🔴 PRIORIDAD CRÍTICA (Hacer ahora)

### 1. Migración de Recetas Existentes
**Problema:** Las recetas creadas antes de agregar `createdBy` no tienen dueño asignado.

**Impacto:** 
- El conteo de recetas por usuario será incorrecto
- Las recetas antiguas no contarán contra el límite de nadie
- Problemas de permisos al editar/eliminar

**Solución:**
```javascript
// Crear script: server/scripts/migrateRecipes.js
const Recipe = require('../models/Recipe');
const User = require('../models/User');

async function migrateRecipes() {
    // Asignar todas las recetas sin dueño al primer admin
    const admin = await User.findOne({ role: 'admin' });
    await Recipe.updateMany(
        { createdBy: { $exists: false } },
        { $set: { createdBy: admin._id } }
    );
}
```

---

### 2. JWT_SECRET en Producción
**Problema:** El JWT_SECRET en `.env.example` sugiere un valor débil.

**Impacto:** 
- Vulnerabilidad de seguridad crítica
- Los tokens pueden ser forjados

**Solución:**
```bash
# Generar un secret fuerte (mínimo 256 bits)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Agregar a `.env.example`:
```
JWT_SECRET=genera-un-secret-de-64-bytes-minimo-no-uses-este-valor
JWT_EXPIRES_IN=7d
```

---

### 3. Validación de Datos en Backend
**Problema:** Faltan validaciones con `express-validator` en varias rutas.

**Rutas sin validación completa:**
- `POST /api/recipes` - No valida estructura de items
- `POST /api/ingredients` - No valida tipos de datos
- `PUT /api/*` - No valida campos actualizados

**Solución:** Crear middleware de validación:
```javascript
// server/middleware/validators/recipeValidator.js
const { body, validationResult } = require('express-validator');

exports.validateRecipe = [
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('quantity').isNumeric().withMessage('Cantidad debe ser número'),
    body('utilityFactor').isFloat({ min: 0 }).withMessage('Factor inválido'),
    // ... más validaciones
];
```

---

## 🟠 PRIORIDAD ALTA (Hacer pronto)

### 4. Sincronizar `currentRecipeCount` en Carga Inicial
**Problema:** Si el cache está desincronizado, el conteo mostrado será incorrecto hasta que se llame a `getPlanStatus`.

**Solución:** Agregar sincronización al login:
```javascript
// En routes/auth.js después del login exitoso
const actualCount = await Recipe.countDocuments({ createdBy: user._id });
if (user.currentRecipeCount !== actualCount) {
    await User.findByIdAndUpdate(user._id, { currentRecipeCount: actualCount });
}
```

---

### 5. Manejo de Sesión Expirada en Frontend
**Problema:** El interceptor de API solo hace `console.warn` en 401.

**Impacto:** Usuario queda en estado inconsistente.

**Solución mejorada para `api.js`:**
```javascript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
    }
);
```

---

### 6. Bloqueo de UI para Funciones Premium
**Problema:** El frontend muestra funciones premium aunque estén bloqueadas en backend.

**Afectados:**
- Exportar PDF
- Lista de compras
- Análisis de costos avanzado
- Cloud sync

**Solución:** Usar `usePlan().hasFeature()`:
```jsx
const { hasFeature } = usePlan();

{hasFeature('exportPDF') ? (
    <button onClick={exportPDF}>Exportar PDF</button>
) : (
    <button disabled className="premium-locked">
        🔒 Exportar PDF (Premium)
    </button>
)}
```

---

## 🟡 PRIORIDAD MEDIA (Hacer después)

### 7. Tests Automatizados
**Problema:** No hay tests unitarios ni de integración.

**Archivos sugeridos:**
```
server/
  tests/
    auth.test.js
    recipes.test.js
    limits.test.js
client/
  src/
    __tests__/
      PlanContext.test.jsx
```

**Paquetes necesarios:**
```bash
npm install --save-dev jest supertest @testing-library/react
```

---

### 8. Logs Estructurados
**Problema:** Los logs son strings simples, difíciles de analizar.

**Solución:** Implementar Winston o Pino:
```javascript
// server/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
```

---

### 9. Paginación en Listas Grandes
**Problema:** `GET /api/recipes` retorna TODAS las recetas.

**Impacto:** Performance degradada con muchas recetas.

**Solución:**
```javascript
router.get('/', auth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
        Recipe.find().skip(skip).limit(limit).populate('items.item'),
        Recipe.countDocuments()
    ]);

    res.json({
        recipes,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
```

---

### 10. Refresh Token
**Problema:** Token expira y usuario debe hacer login completo.

**Solución:** Implementar refresh token:
- Access Token: 15 minutos
- Refresh Token: 7 días
- Endpoint: `POST /api/auth/refresh`

---

## 🟢 PRIORIDAD BAJA (Mejoras futuras)

### 11. PWA (Progressive Web App)
- Agregar `manifest.json`
- Implementar Service Worker
- Funcionalidad offline básica

### 12. Internacionalización (i18n)
- Preparar para múltiples idiomas
- Usar react-i18next

### 13. Dashboard Analytics Mejorado
- Gráficos de costos por período
- Tendencias de precios de ingredientes
- Comparativa de márgenes

### 14. Exportación de Datos
- Exportar a Excel
- Backup de recetas
- Importar desde Excel

### 15. Notificaciones Push
- Alertas de límite próximo
- Recordatorios de actualización de precios

---

## 📊 Resumen de Estado

| Área | Estado | Notas |
|------|--------|-------|
| Autenticación | ✅ Bueno | JWT implementado |
| Autorización | ✅ Bueno | Roles funcionando |
| Freemium | ✅ Bueno | Límites en backend |
| Seguridad API | ✅ Bueno | Helmet, rate limit, sanitize |
| Validación | ✅ Bueno | express-validator implementado |
| Tests | ❌ Faltante | Sin tests |
| Logs | ✅ Completado | Winston implementado |
| Frontend Premium | ✅ Bueno | UI bloqueada para freemium |

---

## ⏱️ Estimación de Tiempo

| Prioridad | Items | Tiempo Estimado |
|-----------|-------|-----------------|
| 🔴 Crítica | 3 | 2-3 horas |
| 🟠 Alta | 3 | 3-4 horas |
| 🟡 Media | 4 | 6-8 horas |
| 🟢 Baja | 5 | 15-20 horas |

---

## 📝 Orden Recomendado de Ejecución

1. ✅ Migrar recetas existentes (asignar `createdBy`)
2. ✅ Generar JWT_SECRET fuerte
3. ✅ Sincronizar `currentRecipeCount` al login
4. ✅ Mejorar manejo de 401 en frontend
5. ✅ Agregar validaciones con express-validator
6. ✅ Bloquear UI para funciones premium
7. ✅ Implementar paginación (Backend listo)
8. ✅ Agregar tests básicos (Estructura lista)

---

**¿Listo para comenzar? Indícame qué recomendación quieres implementar primero.**
