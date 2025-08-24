# Arquitectura de la Calculadora Hipotecaria UVA

## Resumen

Esta aplicación ha sido refactorizada siguiendo principios de **Clean Architecture** y **Separation of Concerns** para mejorar la mantenibilidad, testabilidad y escalabilidad del código.

## Estructura de Directorios

```
js/
├── config/
│   └── constants.js          # Configuración centralizada
├── services/
│   ├── CalculationService.js # Lógica de negocio de cálculos
│   ├── ExchangeRateService.js # Manejo de tipos de cambio
│   ├── ValidationService.js  # Validaciones y reglas de negocio
│   └── UtilityService.js     # Funciones auxiliares
├── controllers/
│   ├── CalculatorController.js # Controlador principal
│   └── SimulatorController.js # Controlador del simulador
└── app.js                    # Punto de entrada de la aplicación
```

## Arquitectura por Capas

### 1. Capa de Configuración (`config/`)

**Archivo:** `constants.js`

- **Propósito:** Centralizar todas las constantes y configuraciones de la aplicación
- **Contenido:**
  - Configuración de gastos por provincia
  - Configuración de tipos de cambio
  - Rangos de validación
  - Configuración de APIs
  - Mensajes y textos
  - Configuración de formateo

**Ventajas:**
- Fácil mantenimiento y modificación
- Evita "magic numbers" en el código
- Centralización de configuración
- Facilita testing y debugging

### 2. Capa de Servicios (`services/`)

#### CalculationService.js
**Responsabilidades:**
- Cálculos hipotecarios (cuota inicial, gastos extra, etc.)
- Lógica de negocio relacionada con préstamos
- Validaciones de datos de entrada
- Cálculos de UVA y escenarios

**Métodos principales:**
```javascript
calcularCuotaInicial(monto, tasaAnual, plazoAnos)
calcularGastosExtra(valorPropiedadUSD, provincia, porcentajesPersonalizados)
validarValores(valores, tipoCambioOficial)
calcularTotalOperacion(valorPropiedadUSD, gastosExtra, tipoCambio)
```

#### ExchangeRateService.js
**Responsabilidades:**
- Obtención de cotizaciones oficiales (BCRA, API alternativa)
- Manejo de cache de cotizaciones
- Cálculo de bandas cambiarias
- Validación de tipos de cambio

**Métodos principales:**
```javascript
obtenerCotizacionOficial()
calcularBandasCambiarias()
validarTipoCambioConBandas(valorTC)
guardarCotizacionEnCache(valor, fuente)
```

#### ValidationService.js
**Responsabilidades:**
- Validación de campos del formulario
- Estados de validación visual
- Reglas de negocio para validaciones
- Feedback de usuario no intrusivo

**Métodos principales:**
```javascript
validateField(element)
getOverallValidation()
validarDatosParaCalculos(datos)
clearAllStates()
```

#### UtilityService.js
**Responsabilidades:**
- Formateo de monedas y números
- Conversiones de divisas
- Funciones auxiliares (debounce, throttle)
- Manipulación segura del DOM

**Métodos principales:**
```javascript
formatearPesos(valor)
convertirUSDaPesos(valorUSD, tipoCambio)
debounce(func, wait)
getElemento(id)
```

### 3. Capa de Controladores (`controllers/`)

#### CalculatorController.js
**Responsabilidades:**
- Coordinación de todos los servicios
- Manejo de la lógica de presentación
- Event listeners del formulario principal
- Actualización del DOM con resultados

**Características:**
- Inicializa todos los servicios
- Coordina el flujo de datos entre servicios
- Maneja la UI y actualizaciones
- Mantiene el estado de la aplicación

#### SimulatorController.js
**Responsabilidades:**
- Lógica específica del simulador de tipo de cambio
- Manejo de escenarios y bandas cambiarias
- Recalculación en tiempo real
- Validación de rangos de tipo de cambio

**Características:**
- Recibe dependencias inyectadas
- Maneja solo la lógica del simulador
- Se comunica con otros servicios a través de interfaces

### 4. Capa de Aplicación (`app.js`)

**Responsabilidades:**
- Punto de entrada de la aplicación
- Inicialización de controladores
- Configuración de componentes adicionales
- Mantenimiento de compatibilidad con código legacy

## Principios de Diseño Aplicados

### 1. Single Responsibility Principle (SRP)
- Cada servicio tiene una responsabilidad específica
- Los controladores coordinan, no implementan lógica de negocio
- Separación clara entre cálculo, validación y presentación

### 2. Dependency Injection
- Los controladores reciben sus dependencias como parámetros
- Facilita testing y modificación de comportamientos
- Reduce acoplamiento entre componentes

### 3. Separation of Concerns
- **Lógica de negocio:** En servicios
- **Presentación:** En controladores
- **Configuración:** Centralizada en constants.js
- **Utilidades:** Reutilizables y genéricas

### 4. Interface Segregation
- Cada servicio expone solo los métodos necesarios
- Los controladores usan solo lo que necesitan
- APIs limpias y específicas

## Flujo de Datos

```
Usuario → Controller → Service → Business Logic → Service → Controller → DOM
```

1. **Usuario interactúa** con el formulario
2. **Controller** captura el evento y obtiene datos
3. **Service** procesa la lógica de negocio
4. **Resultado** regresa al controller
5. **Controller** actualiza la UI

## Ventajas de la Nueva Arquitectura

### 1. Mantenibilidad
- Código organizado y fácil de entender
- Cambios localizados en servicios específicos
- Fácil agregar nuevas funcionalidades

### 2. Testabilidad
- Servicios pueden ser testeados independientemente
- Mocking de dependencias simplificado
- Tests unitarios más específicos

### 3. Escalabilidad
- Fácil agregar nuevos servicios
- Estructura preparada para crecimiento
- Patrones consistentes en toda la aplicación

### 4. Reutilización
- Servicios pueden ser usados por diferentes controladores
- Utilidades genéricas y reutilizables
- Configuración centralizada

### 5. Debugging
- Flujo de datos claro y predecible
- Errores localizados en servicios específicos
- Logging estructurado por capa

## Migración y Compatibilidad

### Código Legacy
- Se mantienen funciones globales para compatibilidad
- Gradual migración de funcionalidades
- No hay breaking changes en la interfaz de usuario

### Nuevas Funcionalidades
- Implementar en la nueva arquitectura
- Usar servicios y controladores
- Seguir patrones establecidos

## Próximos Pasos

### 1. Testing
- Implementar tests unitarios para servicios
- Tests de integración para controladores
- Coverage de código

### 2. Documentación
- JSDoc para todos los métodos
- Ejemplos de uso
- Guías de contribución

### 3. Optimización
- Lazy loading de servicios
- Caching inteligente
- Performance monitoring

### 4. Nuevas Funcionalidades
- Sistema de notificaciones
- Persistencia de datos
- Exportación de resultados

## Conclusión

La nueva arquitectura proporciona una base sólida para el crecimiento y mantenimiento de la aplicación. La separación clara de responsabilidades, la inyección de dependencias y la organización modular hacen que el código sea más mantenible, testeable y escalable.

Esta refactorización mantiene toda la funcionalidad existente mientras prepara la aplicación para futuras mejoras y funcionalidades.
