// Google Analytics 4 - Configuración avanzada para calculadora UVA
// Tracking de eventos y conversiones para medir el uso real de la herramienta

// Configuración de eventos personalizados
const ANALYTICS_EVENTS = {
    // Eventos de uso de la calculadora
    CALCULATOR_LOADED: 'calculator_loaded',
    CALCULATION_STARTED: 'calculation_started',
    CALCULATION_COMPLETED: 'calculation_completed',
    CALCULATION_ERROR: 'calculation_error',
    
    // Eventos de interacción con gastos
    GASTOS_UPDATED: 'gastos_updated',
    PROVINCIA_CHANGED: 'provincia_changed',
    
    // Eventos de escenarios
    ESCENARIO_VIEWED: 'escenario_viewed',
    ESCENARIO_COMPARED: 'escenario_compared',
    
    // Eventos de contenido educativo
    UVA_EDUCATION_VIEWED: 'uva_education_viewed',
    FAQ_OPENED: 'faq_opened',
    
    // Eventos de conversión (cada simulación = 1 conversión)
    SIMULATION_CONVERSION: 'simulation_conversion'
};

// Función para enviar eventos a GA4
function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            event_category: 'Calculadora_UVA',
            event_label: 'Argentina',
            ...parameters
        });
        
        console.log(`Evento GA4 enviado: ${eventName}`, parameters);
    }
}

// Función para trackear conversiones (cada simulación ejecutada)
function trackSimulationConversion(simulationData) {
    const conversionData = {
        event_category: 'Conversión',
        event_label: 'Simulación_Completada',
        value: 1, // Cada simulación = 1 conversión
        custom_parameters: {
            valor_propiedad: simulationData.valorPropiedad || 0,
            monto_prestamo: simulationData.montoPrestamo || 0,
            plazo: simulationData.plazo || 0,
            tasa_interes: simulationData.tasaInteres || 0,
            provincia: simulationData.provincia || 'N/A'
        }
    };
    
    trackEvent(ANALYTICS_EVENTS.SIMULATION_CONVERSION, conversionData);
    
    // También trackear como evento de conversión estándar
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            send_to: 'G-FHHDM0RFWY/calculadora_uva_conversion',
            value: 1,
            currency: 'ARS'
        });
    }
}

// Función para trackear el inicio de una simulación
function trackCalculationStarted(formData) {
    trackEvent(ANALYTICS_EVENTS.CALCULATION_STARTED, {
        event_category: 'Interacción',
        event_label: 'Inicio_Simulación',
        custom_parameters: {
            valor_propiedad_usd: formData.valorPropiedad || 0,
            provincia: formData.provincia || 'N/A'
        }
    });
}

// Función para trackear la finalización de una simulación
function trackCalculationCompleted(results, formData) {
    trackEvent(ANALYTICS_EVENTS.CALCULATION_COMPLETED, {
        event_category: 'Resultado',
        event_label: 'Simulación_Exitosa',
        custom_parameters: {
            primera_cuota: results.primeraCuota || 0,
            total_gastos: results.totalGastos || 0,
            total_operacion: results.totalOperacion || 0,
            valor_propiedad_usd: formData.valorPropiedad || 0,
            monto_prestamo: formData.montoPrestamo || 0
        }
    });
    
    // Trackear como conversión
    trackSimulationConversion({
        valorPropiedad: formData.valorPropiedad,
        montoPrestamo: formData.montoPrestamo,
        plazo: formData.plazo,
        tasaInteres: formData.tasaInteres,
        provincia: formData.provincia
    });
}

// Función para trackear errores de cálculo
function trackCalculationError(error, formData) {
    trackEvent(ANALYTICS_EVENTS.CALCULATION_ERROR, {
        event_category: 'Error',
        event_label: 'Error_Cálculo',
        custom_parameters: {
            error_message: error.message || 'Error desconocido',
            valor_propiedad: formData.valorPropiedad || 0,
            provincia: formData.provincia || 'N/A'
        }
    });
}

// Función para trackear cambios en gastos
function trackGastosUpdated(gastosData) {
    trackEvent(ANALYTICS_EVENTS.GASTOS_UPDATED, {
        event_category: 'Configuración',
        event_label: 'Gastos_Modificados',
        custom_parameters: {
            escritura: gastosData.escritura || 0,
            inmobiliaria: gastosData.inmobiliaria || 0,
            firmas: gastosData.firmas || 0,
            sellos: gastosData.sellos || 0
        }
    });
}

// Función para trackear cambios de provincia
function trackProvinciaChanged(provincia) {
    trackEvent(ANALYTICS_EVENTS.PROVINCIA_CHANGED, {
        event_category: 'Configuración',
        event_label: 'Provincia_Cambiada',
        custom_parameters: {
            provincia: provincia || 'N/A'
        }
    });
}

// Función para trackear visualización de escenarios
function trackEscenarioViewed(escenarioType) {
    trackEvent(ANALYTICS_EVENTS.ESCENARIO_VIEWED, {
        event_category: 'Análisis',
        event_label: `Escenario_${escenarioType}`,
        custom_parameters: {
            tipo_escenario: escenarioType || 'N/A'
        }
    });
}

// Función para trackear apertura de FAQ
function trackFAQOpened(questionIndex) {
    trackEvent(ANALYTICS_EVENTS.FAQ_OPENED, {
        event_category: 'Contenido',
        event_label: 'FAQ_Abierta',
        custom_parameters: {
            pregunta_index: questionIndex || 0
        }
    });
}

// Función para trackear visualización de contenido educativo
function trackUVAEducationViewed() {
    trackEvent(ANALYTICS_EVENTS.UVA_EDUCATION_VIEWED, {
        event_category: 'Contenido',
        event_label: 'Educación_UVA_Vista',
        custom_parameters: {
            seccion: 'explicacion_uva'
        }
    });
}

// Inicialización de analytics cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Trackear que la calculadora se cargó
    trackEvent(ANALYTICS_EVENTS.CALCULATOR_LOADED, {
        event_category: 'Página',
        event_label: 'Calculadora_Cargada',
        custom_parameters: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        }
    });
    
    // Trackear visualización de contenido educativo cuando sea visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('uva-education-section')) {
                trackUVAEducationViewed();
                observer.unobserve(entry.target); // Solo trackear una vez
            }
        });
    });
    
    const uvaSection = document.querySelector('.uva-education-section');
    if (uvaSection) {
        observer.observe(uvaSection);
    }
    
    // Trackear apertura de FAQ
    document.addEventListener('click', function(e) {
        if (e.target.closest('.faq-question')) {
            const faqItem = e.target.closest('.faq-item');
            const faqIndex = Array.from(document.querySelectorAll('.faq-item')).indexOf(faqItem);
            trackFAQOpened(faqIndex);
        }
    });
});

// Exportar funciones para uso en script.js
window.AnalyticsTracker = {
    trackCalculationStarted,
    trackCalculationCompleted,
    trackCalculationError,
    trackGastosUpdated,
    trackProvinciaChanged,
    trackEscenarioViewed,
    trackSimulationConversion
};

console.log('Analytics avanzado cargado para Calculadora UVA');
