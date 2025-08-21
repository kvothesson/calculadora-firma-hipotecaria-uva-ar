// Google Analytics 4 - Configuración separada de la presentación
// Este archivo contiene toda la lógica de analytics sin afectar la UI

class CalculadoraAnalytics {
    constructor() {
        this.isEnabled = true;
        this.events = {
            CALCULATION_PERFORMED: 'calculation_performed',
            SLIDER_CHANGED: 'slider_changed',
            CURRENCY_SCENARIO: 'currency_scenario_viewed',
            TIPS_VIEWED: 'tips_viewed',
            PROVINCE_CHANGED: 'province_changed',
            ERROR_OCCURRED: 'error_occurred',
            SESSION_DURATION: 'session_duration'
        };
        
        this.init();
    }

    init() {
        // Verificar que gtag esté disponible
        if (typeof gtag === 'undefined') {
            console.warn('Google Analytics no está disponible');
            this.isEnabled = false;
            return;
        }

        // Configurar opciones de privacidad
        this.configurePrivacy();
        
        // Configurar eventos personalizados
        this.setupCustomEvents();
        
        // Rastrear duración de sesión
        this.trackSessionDuration();
        
        console.log('Analytics inicializado correctamente');
    }

    configurePrivacy() {
        if (!this.isEnabled) return;

        // Configurar opciones de privacidad de GA4
        gtag('config', 'G-FHHDM0RFWY', {
            // Anonimizar IP automáticamente (GA4 lo hace por defecto)
            'anonymize_ip': true,
            
            // Respetar Do Not Track
            'allow_google_signals': !navigator.doNotTrack,
            
            // Configuración de cookies
            'cookie_flags': 'SameSite=None;Secure',
            'cookie_expires': 63072000, // 2 años
            
            // Configuración de datos
            'allow_ad_personalization_signals': false,
            'restricted_data_processing': navigator.doNotTrack === '1'
        });
    }

    // Rastrear cálculo realizado
    trackCalculation(data) {
        if (!this.isEnabled) return;

        gtag('event', this.events.CALCULATION_PERFORMED, {
            'event_category': 'Calculadora',
            'event_label': 'Calculo_Completo',
            'property_value_usd': data.valorPropiedad || 0,
            'loan_amount_ars': data.montoPrestamo || 0,
            'loan_term_years': data.plazo || 0,
            'interest_rate': data.tasaInteres || 0,
            'province': data.provincia || 'unknown',
            'first_payment_ars': data.primeraCuota || 0,
            'total_expenses_ars': data.gastosExtra || 0,
            'custom_parameter_1': 'hipoteca_uva'
        });
    }

    // Rastrear cambios en sliders
    trackSliderChange(sliderType, value, previousValue = null) {
        if (!this.isEnabled) return;

        gtag('event', this.events.SLIDER_CHANGED, {
            'event_category': 'Interaccion',
            'event_label': `Slider_${sliderType}`,
            'slider_type': sliderType,
            'new_value': value,
            'previous_value': previousValue,
            'value_change': previousValue ? (value - previousValue) : 0
        });
    }

    // Rastrear cambios en inputs de gastos personalizables
    trackGastoInputChange(gastoType, percentage, provincia) {
        if (!this.isEnabled) return;

        gtag('event', 'gasto_input_changed', {
            'event_category': 'Gastos_Personalizables',
            'event_label': `Gasto_${gastoType}`,
            'gasto_type': gastoType,
            'percentage_value': percentage,
            'provincia': provincia,
            'is_custom_percentage': true
        });
    }

    // Rastrear simulación de tipo de cambio
    trackCurrencyScenario(exchangeRate, scenarioType = 'manual') {
        if (!this.isEnabled) return;

        gtag('event', this.events.CURRENCY_SCENARIO, {
            'event_category': 'Simulador',
            'event_label': 'Escenario_Cambio',
            'exchange_rate': exchangeRate,
            'scenario_type': scenarioType,
            'rate_difference_pct': this.calculateRateDifference(exchangeRate)
        });
    }

    // Rastrear múltiples escenarios de tipo de cambio (función requerida por script.js)
    trackCurrencyScenarios(scenarios) {
        if (!this.isEnabled) return;

        gtag('event', 'currency_scenarios_viewed', {
            'event_category': 'Simulador',
            'event_label': 'Escenarios_Multiples',
            'piso_rate': scenarios.piso,
            'oficial_rate': scenarios.oficial,
            'techo_rate': scenarios.techo,
            'diferencia_piso_oficial': scenarios.diferencia_piso_oficial,
            'diferencia_techo_oficial': scenarios.diferencia_techo_oficial
        });
    }

    // Rastrear visualización de consejos
    trackTipsViewed(tipType, tipContent = '') {
        if (!this.isEnabled) return;

        gtag('event', this.events.TIPS_VIEWED, {
            'event_category': 'Contenido',
            'event_label': 'Tips_Visualizados',
            'tip_type': tipType,
            'tip_category': this.categorizeTip(tipContent),
            'content_length': tipContent.length,
            'timestamp': new Date().toISOString()
        });
    }

    // Rastrear cuando el usuario interactúa con consejos dinámicos
    trackDynamicTipsGenerated(tipCount, cuotaAmount, userContext = {}) {
        if (!this.isEnabled) return;

        gtag('event', 'dynamic_tips_generated', {
            'event_category': 'Contenido_Dinamico',
            'event_label': 'Tips_Generados',
            'tips_count': tipCount,
            'cuota_amount_ars': cuotaAmount,
            'user_provincia': userContext.provincia || 'unknown',
            'property_value_usd': userContext.valorPropiedad || 0,
            'loan_amount_ars': userContext.montoPrestamo || 0
        });
    }

    // Rastrear visualización/ocultación de secciones importantes
    trackSectionVisibility(sectionId, isVisible, context = {}) {
        if (!this.isEnabled) return;

        gtag('event', 'section_visibility_changed', {
            'event_category': 'Interfaz',
            'event_label': isVisible ? 'Seccion_Mostrada' : 'Seccion_Oculta',
            'section_id': sectionId,
            'is_visible': isVisible,
            'context_data': JSON.stringify(context)
        });
    }

    // Rastrear cambio de provincia
    trackProvinceChange(province, fromProvince = null) {
        if (!this.isEnabled) return;

        gtag('event', this.events.PROVINCE_CHANGED, {
            'event_category': 'Geografia',
            'event_label': 'Cambio_Provincia',
            'new_province': province,
            'previous_province': fromProvince
        });
    }

    // Rastrear errores
    trackError(errorType, errorMessage, errorContext = '') {
        if (!this.isEnabled) return;

        gtag('event', this.events.ERROR_OCCURRED, {
            'event_category': 'Error',
            'event_label': errorType,
            'error_message': errorMessage,
            'error_context': errorContext,
            'user_agent': navigator.userAgent,
            'timestamp': new Date().toISOString()
        });
    }

    // Rastrear métricas de rendimiento
    trackPerformance(metric, value, context = '') {
        if (!this.isEnabled) return;

        gtag('event', 'performance_metric', {
            'event_category': 'Rendimiento',
            'event_label': metric,
            'metric_value': value,
            'metric_context': context
        });
    }

    // Rastrear duración de sesión
    trackSessionDuration() {
        if (!this.isEnabled) return;

        this.sessionStart = Date.now();
        
        // Enviar duración cada 30 segundos para sesiones activas
        this.sessionInterval = setInterval(() => {
            const duration = Math.floor((Date.now() - this.sessionStart) / 1000);
            
            gtag('event', this.events.SESSION_DURATION, {
                'event_category': 'Engagement',
                'event_label': 'Sesion_Activa',
                'session_duration_seconds': duration,
                'engagement_time_msec': duration * 1000
            });
        }, 30000);

        // Limpiar intervalo al salir
        window.addEventListener('beforeunload', () => {
            if (this.sessionInterval) {
                clearInterval(this.sessionInterval);
                
                const finalDuration = Math.floor((Date.now() - this.sessionStart) / 1000);
                gtag('event', 'session_end', {
                    'event_category': 'Engagement',
                    'final_duration_seconds': finalDuration
                });
            }
        });
    }

    // Configurar eventos automáticos
    setupCustomEvents() {
        if (!this.isEnabled) return;

        // Rastrear scroll profundo
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            
            if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
                maxScroll = scrollPercent;
                gtag('event', 'scroll_depth', {
                    'event_category': 'Engagement',
                    'scroll_depth_percent': scrollPercent
                });
            }
        });

        // Rastrear clics en tooltips
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tooltip')) {
                gtag('event', 'tooltip_click', {
                    'event_category': 'Interaccion',
                    'tooltip_content': e.target.getAttribute('title') || 'unknown'
                });
            }
        });

        // Rastrear tiempo en inputs específicos
        this.trackInputFocus();
    }

    // Rastrear tiempo de enfoque en inputs importantes
    trackInputFocus() {
        const importantInputs = ['valorPropiedad', 'montoPrestamo', 'plazo', 'tasaInteres'];
        
        importantInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (!input) return;

            let focusTime = null;

            input.addEventListener('focus', () => {
                focusTime = Date.now();
            });

            input.addEventListener('blur', () => {
                if (focusTime) {
                    const timeSpent = Date.now() - focusTime;
                    
                    gtag('event', 'input_time_spent', {
                        'event_category': 'Interaccion',
                        'input_field': inputId,
                        'time_spent_ms': timeSpent
                    });
                    
                    focusTime = null;
                }
            });
        });
    }

    // Funciones auxiliares
    calculateRateDifference(currentRate) {
        // Asumir que CONFIG.tiposCambio.oficial está disponible globalmente
        if (typeof CONFIG !== 'undefined' && CONFIG.tiposCambio && CONFIG.tiposCambio.oficial) {
            return ((currentRate - CONFIG.tiposCambio.oficial) / CONFIG.tiposCambio.oficial * 100).toFixed(2);
        }
        return 0;
    }

    categorizeTip(tipContent) {
        if (tipContent.includes('ingreso') || tipContent.includes('25%')) return 'financial_advice';
        if (tipContent.includes('cambio') || tipContent.includes('dólar')) return 'currency_advice';
        if (tipContent.includes('margen') || tipContent.includes('seguridad')) return 'risk_management';
        if (tipContent.includes('ahorro') || tipContent.includes('reserva')) return 'savings_advice';
        return 'general';
    }

    // Método para deshabilitar analytics (respeto a privacidad)
    disable() {
        this.isEnabled = false;
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        console.log('Analytics deshabilitado');
    }

    // Método para habilitar analytics
    enable() {
        this.isEnabled = true;
        this.init();
        console.log('Analytics habilitado');
    }

    // Enviar evento personalizado genérico
    sendCustomEvent(eventName, parameters = {}) {
        if (!this.isEnabled) return;

        gtag('event', eventName, {
            'event_category': 'Custom',
            'timestamp': new Date().toISOString(),
            ...parameters
        });
    }
}

// Inicializar analytics cuando el DOM esté listo
let analytics = null;

document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si gtag está disponible
    if (typeof gtag !== 'undefined') {
        analytics = new CalculadoraAnalytics();
        
        // Hacer disponible globalmente para uso en otros scripts
        window.calculadoraAnalytics = analytics;
        
        console.log('Sistema de analytics cargado');
    } else {
        console.warn('Google Analytics no detectado, analytics deshabilitado');
    }
});

// Exportar para uso en módulos (si se usa)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculadoraAnalytics;
}
