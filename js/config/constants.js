/**
 * Configuración de constantes de la aplicación
 */

// Configuración de la calculadora
export const CALCULATOR_CONFIG = {
    // Gastos extra por provincia (en % del valor de la propiedad)
    GASTOS_EXTRA: {
        'CABA': {
            escritura: { min: 2.0, max: 2.5, intermedio: 2.25 },
            inmobiliaria: { min: 2.5, max: 3.5, intermedio: 3.0 },
            firmas: { min: 0.5, max: 1.0, intermedio: 0.75 },
            sellos: { min: 1.0, max: 1.5, intermedio: 1.25 }
        },
        'BSAS': {
            escritura: { min: 2.0, max: 2.5, intermedio: 2.25 },
            inmobiliaria: { min: 2.5, max: 3.5, intermedio: 3.0 },
            firmas: { min: 0.5, max: 1.0, intermedio: 0.75 },
            sellos: { min: 1.0, max: 1.5, intermedio: 1.25 }
        }
    },
    
    // Factor UVA mensual (aproximado)
    FACTOR_UVA: 1.02,      // 2% mensual
    
    // Gastos bancarios
    GASTOS_BANCARIOS: {
        tasacion: 15000,   // $15,000
        seguro: 0.5,       // 0.5% del monto prestado
        otros: 5000        // $5,000
    }
};

// Configuración de tipos de cambio
export const EXCHANGE_RATE_CONFIG = {
    // Valores por defecto
    DEFAULT_VALUES: {
        oficial: 1301,
        simulador: 1301,
        techo: 1400,       // Dólar alto (techo de banda) - BASE (abril 2025)
        piso: 1000         // Dólar bajo (piso de banda) - BASE (abril 2025)
    },
    
    // Fecha base para cálculos de bandas
    FECHA_BASE: new Date('2025-04-01'),
    
    // Límites del simulador
    LIMITES_SIMULADOR: {
        min: 800,
        max: 2000
    },
    
    // Cache
    CACHE_DURATION_HOURS: 1
};

// Configuración de validación
export const VALIDATION_CONFIG = {
    // Rangos válidos
    RANGOS: {
        valorPropiedad: { min: 10000, max: 300000 },
        montoPrestamo: { min: 1000000, max: 1000000000 },
        plazo: { min: 5, max: 35 },
        tasaInteres: { min: 4.5, max: 11 }
    },
    
    // Regla del 25% para cuota vs ingresos
    REGLA_CUOTA_INGRESOS: 0.25,
    
    // Ingresos mínimos para mostrar advertencias
    INGRESOS_MINIMOS: {
        advertencia: 400000,
        error: 1000000
    }
};

// Configuración de la interfaz
export const UI_CONFIG = {
    // Delays para mejor performance
    DELAYS: {
        recalculo: 300,
        feedbackVisual: 500,
        confirmacion: 1000
    },
    
    // Tiempos de auto-remoción
    AUTO_REMOVE: {
        consejosBandas: 8000,
        tipsDinamicos: 10000
    },
    
    // Estados visuales
    ESTADOS: {
        updating: 'updating',
        confirmed: 'confirmed',
        focused: 'focused'
    }
};

// Configuración de APIs
export const API_CONFIG = {
    // BCRA API
    BCRA: {
        baseUrl: 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD',
        diasBusqueda: 7
    },
    
    // API alternativa
    ALTERNATIVA: {
        baseUrl: 'https://dolarapi.com/v1/dolares/oficial'
    },
    
    // Timeouts
    TIMEOUTS: {
        request: 10000,
        retry: 3000
    }
};

// Configuración de analytics
export const ANALYTICS_CONFIG = {
    // Eventos a trackear (usando los mismos nombres que analytics.js)
    EVENTOS: {
        CALCULO_COMPLETADO: 'calculation_completed',
        CALCULO_INICIADO: 'calculation_started',
        CALCULO_ERROR: 'calculation_error',
        CAMBIO_PLAZO: 'plazo_change',
        CAMBIO_TASA: 'tasa_change',
        CAMBIO_TC: 'tc_change',
        ERROR_API: 'api_error'
    },
    
    // Categorías
    CATEGORIAS: {
        CALCULO: 'Calculo',
        INTERACCION: 'Interaccion',
        ERROR: 'Error'
    }
};

// Configuración de mensajes
export const MESSAGES = {
    // Mensajes de validación
    VALIDATION: {
        VALOR_PROPIEDAD_REQUERIDO: 'Valor de propiedad requerido',
        MONTO_PRESTAMO_REQUERIDO: 'Monto del préstamo requerido',
        PLAZO_INVALIDO: 'Plazo inválido (5-35 años)',
        TASA_INTERES_INVALIDA: 'Tasa de interés inválida (4.5%-11%)',
        PRESTAMO_SUPERA_VALOR: 'Préstamo supera valor máximo'
    },
    
    // Mensajes de consejos
    TIPS: {
        CUOTA_ALTA: 'Cuota alta detectada',
        RIESGO_CAMBIARIO: 'Alto riesgo cambiario',
        GASTOS_ALTOS: 'Gastos altos en {provincia}',
        PLAN_AHORRO: 'Plan de ahorro personalizado'
    },
    
    // Mensajes de estado
    STATUS: {
        CALCULANDO: 'Calculando...',
        LISTO: 'Todos los datos están completos',
        REVISAR: 'Revisá los valores ingresados',
        RECOMENDACIONES: 'Datos listos, revisá las recomendaciones'
    }
};

// Configuración de formateo
export const FORMAT_CONFIG = {
    // Monedas
    MONEDAS: {
        ARS: {
            locale: 'es-AR',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        },
        USD: {
            locale: 'en-US',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    },
    
    // Números
    NUMEROS: {
        locale: 'es-AR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    },
    
    // Fechas
    FECHAS: {
        locale: 'es-AR',
        options: {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    }
};

// Configuración de errores
export const ERROR_CONFIG = {
    // Códigos de error
    CODIGOS: {
        API_BCRA_FALLIDA: 'BCRA_API_FAILED',
        API_ALTERNATIVA_FALLIDA: 'ALTERNATIVE_API_FAILED',
        VALIDACION_FALLIDA: 'VALIDATION_FAILED',
        CALCULO_FALLIDO: 'CALCULATION_FAILED'
    },
    
    // Mensajes de error
    MENSAJES: {
        API_BCRA_FALLIDA: 'API del BCRA no disponible',
        API_ALTERNATIVA_FALLIDA: 'API alternativa también falló',
        TODAS_APIS_FALLARON: 'Todas las APIs fallaron',
        VALIDACION_FALLIDA: 'Validación de datos falló',
        CALCULO_FALLIDO: 'Error en el cálculo'
    }
};

// Exportar configuración completa
export const APP_CONFIG = {
    CALCULATOR: CALCULATOR_CONFIG,
    EXCHANGE_RATE: EXCHANGE_RATE_CONFIG,
    VALIDATION: VALIDATION_CONFIG,
    UI: UI_CONFIG,
    API: API_CONFIG,
    ANALYTICS: ANALYTICS_CONFIG,
    MESSAGES: MESSAGES,
    FORMAT: FORMAT_CONFIG,
    ERROR: ERROR_CONFIG
};

// Para compatibilidad con módulos CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CALCULATOR_CONFIG,
        EXCHANGE_RATE_CONFIG,
        VALIDATION_CONFIG,
        UI_CONFIG,
        API_CONFIG,
        ANALYTICS_CONFIG,
        MESSAGES,
        FORMAT_CONFIG,
        ERROR_CONFIG,
        APP_CONFIG
    };
}
