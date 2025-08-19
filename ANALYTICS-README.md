# 📊 Sistema de Google Analytics - Calculadora Hipotecaria UVA

## 🎯 Implementación Completamente Separada de la Presentación

Este sistema de analytics está diseñado para ser **completamente independiente** de la lógica de presentación y cálculos de la calculadora.

## 📁 Estructura de Archivos

```
├── analytics.js          # Lógica principal de tracking
├── privacy-config.js     # Gestión de consentimiento y privacidad
├── index.html            # HTML con GA4 configurado con privacidad
└── script.js             # Calculadora con llamadas mínimas a analytics
```

## 🔧 Configuración

### ID de Google Analytics 4
- **ID actual**: `G-FHHDM0RFWY` ✅ **CONFIGURADO**
- **Ubicación**: `index.html` líneas 46 y 57, `analytics.js` línea 44
- **Cómo obtener tu ID**: analytics.google.com > Administrar > Flujos de datos > Web

### Configuración de Privacidad
- ✅ **Anonimización de IP** habilitada
- ✅ **Señales de Google** deshabilitadas  
- ✅ **Personalización de anuncios** deshabilitada
- ✅ **Procesamiento restringido de datos** habilitado
- ✅ **Sistema de consentimiento GDPR/CCPA** implementado

## 📈 Eventos Rastreados

### 1. Cálculo Completado (`calculation_performed`)
**Cuándo**: Cada vez que se completa un cálculo
```javascript
{
    property_value_usd: 45000,
    loan_amount_ars: 39200000,
    loan_term_years: 20,
    interest_rate: 8.5,
    province: 'CABA',
    first_payment_ars: 485000,
    total_expenses_ars: 2800000
}
```

### 2. Cambios en Sliders (`slider_changed`)
**Cuándo**: Al mover sliders de plazo, tasa o tipo de cambio
```javascript
{
    slider_type: 'plazo|tasa_interes|tipo_cambio',
    new_value: 25,
    previous_value: 20,
    value_change: 5
}
```

### 3. Simulación de Tipo de Cambio (`currency_scenario_viewed`)
**Cuándo**: Al usar el simulador de escenarios cambiarios
```javascript
{
    exchange_rate: 1350,
    scenario_type: 'manual',
    rate_difference_pct: 10.2
}
```

### 4. Visualización de Consejos (`tips_viewed`)
**Cuándo**: Se generan tips dinámicos personalizados
```javascript
{
    tip_type: 'ingreso_recomendado|tips_completos',
    tip_category: 'financial_advice|currency_advice|savings_advice'
}
```

### 5. Cambio de Provincia (`province_changed`)
**Cuándo**: Usuario selecciona diferente provincia
```javascript
{
    new_province: 'BSAS',
    previous_province: 'CABA'
}
```

### 6. Errores (`error_occurred`)
**Cuándo**: Fallan APIs o hay errores técnicos
```javascript
{
    error_type: 'api_cotizacion',
    error_message: 'Fetch failed',
    error_context: 'obtenerCotizacionOficial'
}
```

### 7. Métricas de Engagement
- **Profundidad de scroll** (cada 25%)
- **Tiempo en inputs** específicos
- **Clics en tooltips**
- **Duración de sesión** (cada 30 segundos)

## 🔒 Sistema de Privacidad

### Detección Automática de Jurisdicción
El sistema detecta automáticamente si requiere mostrar banner de consentimiento basado en:
- **Zona horaria** (Europa, California)
- **Idioma** del navegador
- **Configuración regional**

### Banner de Consentimiento
- 🍪 **Aparición**: Solo en jurisdicciones que lo requieren
- ⚙️ **Opciones**: "Solo necesarias" o "Aceptar todo"
- 📱 **Responsive**: Se adapta a móviles y tablets
- 🔄 **Persistente**: Recuerda la elección por 365 días

### Modal de Detalles de Privacidad
- 📋 **Información completa** sobre qué datos se recopilan
- ❌ **Claridad** sobre qué NO se recopila
- ✅ **Transparencia** sobre el uso de los datos
- 🎛️ **Control** para cambiar configuración

## 🚀 Integración Mínima

### En script.js (calculadora principal)
Solo se agregaron **4 llamadas opcionales**:
```javascript
// Al completar cálculo
if (window.calculadoraAnalytics) {
    window.calculadoraAnalytics.trackCalculation(datos);
}
```

### Principio de Degradación Elegante
- ✅ Si analytics falla, la calculadora **funciona perfectamente**
- ✅ Si el usuario rechaza cookies, **no hay tracking**
- ✅ Si GA4 no carga, **no hay errores en consola**

## 🛠️ Personalización

### Cambiar ID de Analytics
1. Reemplazar `G-NHKJ8PQMRT` en `index.html` (líneas 46 y 57)
2. Reemplazar `G-NHKJ8PQMRT` en `analytics.js` (línea 44)

### Deshabilitar Analytics Completamente
```javascript
// En cualquier momento
window.calculadoraAnalytics.disable();
```

### Agregar Eventos Personalizados
```javascript
window.calculadoraAnalytics.sendCustomEvent('mi_evento', {
    parametro1: 'valor1',
    parametro2: 123
});
```

### Configurar Países que Requieren Consentimiento
Editar `privacy-config.js`, función `shouldRequestConsent()`:
```javascript
const gdprZones = [
    'Europe/Madrid',  // Agregar más zonas
    'America/New_York' // Ejemplo
];
```

## 📊 Dashboards Recomendados en GA4

### 1. Uso de la Calculadora
- Eventos `calculation_performed` por día
- Valores promedio de propiedades consultadas
- Distribución de plazos y tasas más usadas

### 2. Engagement de Usuarios
- Tiempo promedio en página
- Profundidad de scroll
- Uso de sliders y simuladores

### 3. Métricas de Provincia
- Distribución geográfica CABA vs BSAS
- Diferencias en montos consultados por provincia

### 4. Rendimiento Técnico
- Errores de API de cotización
- Tiempo de carga de la página
- Errores Javascript

## 🔍 Debug y Monitoreo

### Verificar Funcionamiento
1. Abrir DevTools > Console
2. Buscar: `"Analytics inicializado correctamente"`
3. Verificar: `window.calculadoraAnalytics` está disponible

### Verificar Consentimiento
```javascript
// En consola
window.privacyManager.getConsentStatus();
// Resultado: 'accepted', 'rejected', o null
```

### Ver Eventos en Tiempo Real
1. Ir a GA4 > Reports > Realtime
2. Usar la calculadora
3. Verificar eventos en "Events in the last 30 minutes"

## 🌟 Beneficios de Esta Implementación

### Para Desarrolladores
- ✅ **Modular**: Fácil de quitar o modificar
- ✅ **No invasivo**: No afecta la lógica principal
- ✅ **Tipado**: Eventos bien estructurados
- ✅ **Debuggeable**: Logs claros en consola

### Para Usuarios
- ✅ **Transparente**: Saben exactamente qué se rastrea
- ✅ **Control**: Pueden opt-out en cualquier momento
- ✅ **Performance**: Zero impacto en velocidad de cálculos
- ✅ **Privacidad**: Cumple GDPR y CCPA

### Para Propietarios del Sitio
- ✅ **Insights valiosos**: Entender cómo usan la calculadora
- ✅ **Optimización**: Identificar qué mejorar
- ✅ **Compliance**: Cumple regulaciones de privacidad
- ✅ **Escalable**: Fácil agregar más eventos

## 📞 Soporte

### Problemas Comunes
1. **"Analytics no funciona"** → Verificar ID en ambos archivos
2. **"Banner no aparece"** → Verificar zona horaria/idioma
3. **"Eventos no llegan"** → Verificar consentimiento aceptado

### Logs Útiles
```javascript
// Estado del sistema
console.log('Analytics enabled:', window.calculadoraAnalytics?.isEnabled);
console.log('Consent status:', window.privacyManager?.getConsentStatus());
```

---

**Creado**: Implementación completa de Google Analytics separada de la presentación
**Versión**: 1.0  
**Última actualización**: Diciembre 2024
