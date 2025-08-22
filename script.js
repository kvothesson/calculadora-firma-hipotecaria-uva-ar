// Configuración de la calculadora
const CONFIG = {
    // Gastos extra por provincia (en % del valor de la propiedad)
    gastosExtra: {
        'CABA': {
            escritura: { min: 2.0, max: 2.5, intermedio: 2.25 },        // 2.0-2.5% del valor
            inmobiliaria: { min: 2.5, max: 3.5, intermedio: 3.0 },     // 2.5-3.5% del valor
            firmas: { min: 0.5, max: 1.0, intermedio: 0.75 },           // 0.5-1.0% del valor
            sellos: { min: 1.0, max: 1.5, intermedio: 1.25 }            // 1.0-1.5% del valor
        },
        'BSAS': {
            escritura: { min: 2.0, max: 2.5, intermedio: 2.25 },        // 2.0-2.5% del valor
            inmobiliaria: { min: 2.5, max: 3.5, intermedio: 3.0 },     // 2.5-3.5% del valor
            firmas: { min: 0.5, max: 1.0, intermedio: 0.75 },           // 0.5-1.0% del valor
            sellos: { min: 1.0, max: 1.5, intermedio: 1.25 }            // 1.0-1.5% del valor
        }
    },
    
    // Tipos de cambio para escenarios (se actualizarán con la cotización oficial)
    tiposCambio: {
        oficial: 1301,     // Dólar oficial (se actualiza automáticamente)
        simulador: 1301,   // Dólar del simulador (controlado por el slider)
        techo: 1400,       // Dólar alto (techo de banda) - BASE (abril 2025)
        piso: 1000         // Dólar bajo (piso de banda) - BASE (abril 2025)
    },
    
    // Factor UVA mensual (aproximado)
    factorUVA: 1.02,      // 2% mensual
    
    // Gastos bancarios
    gastosBancarios: {
        tasacion: 15000,   // $15,000
        seguro: 0.5,       // 0.5% del monto prestado
        otros: 5000        // $5,000
    }
};

// Sistema de alertas simplificado (solo para casos excepcionales)
const ALERT_SYSTEM = {
    // Función legacy mantenida para compatibilidad pero desactivada
    showDelayed(message, type = 'info', delay = 2000, elementId = null) {
        // Sistema desactivado para evitar intrusiones
        return null;
    },
    
    show(alertId) {
        // Desactivado
    },
    
    hide(alertId) {
        // Desactivado
    },
    
    clearAll() {
        // Desactivado
    }
};

// Elementos del DOM
const elementos = {
    valorPropiedad: document.getElementById('valorPropiedad'),
    provincia: document.getElementById('provincia'),
    montoPrestamo: document.getElementById('montoPrestamo'),
    plazo: document.getElementById('plazo'),
    tasaInteres: document.getElementById('tasaInteres'),
    
    // Resultados
    primeraCuota: document.getElementById('primeraCuota'),
    totalPagar: document.getElementById('totalPagar'),
    
    // Simulador (solo si existen)
    diferenciaSimulador: document.getElementById('diferenciaSimulador'),
    diferenciaSimuladorUSD: document.getElementById('diferenciaSimuladorUSD'),
    tcSimuladorTexto: document.getElementById('tcSimuladorTexto')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Obtener cotización oficial del día
    obtenerCotizacionOficial().then(() => {
        // Establecer valores por defecto
        establecerValoresPorDefecto();
        
        // Agregar event listeners
        agregarEventListeners();
        
        // Inicializar sliders de gastos
        actualizarSlidersGastos(elementos.provincia.value);
        
        // Calcular inicialmente después de un pequeño delay para asegurar que los valores estén establecidos
        setTimeout(() => {
            calcularTodo();
        }, 100);
        
                 // Mostrar impacto inicial del simulador (eliminado - función no existe)
    });
});

async function obtenerCotizacionOficial() {
    try {
        // Intentar obtener de cache primero
        const cotizacionCacheada = obtenerCotizacionDeCache();
        if (cotizacionCacheada) {
            aplicarCotizacion(cotizacionCacheada.valor, cotizacionCacheada.fuente);
            actualizarCotizacionEnInterfaz(cotizacionCacheada.fuente, cotizacionCacheada.fecha);
            return;
        }

        // Intentar API del BCRA (oficial) - buscar en los últimos 7 días
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fechaHasta = today.toISOString().split('T')[0];
        const fechaDesde = weekAgo.toISOString().split('T')[0];
        const bcraUrl = `https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
        
        try {
            const bcraResponse = await fetch(bcraUrl);
            const bcraData = await bcraResponse.json();
            
            if (bcraData && bcraData.results && bcraData.results.length > 0) {
                // Tomar el último valor disponible (más reciente)
                const ultimoResultado = bcraData.results[0];
                if (ultimoResultado.detalle && ultimoResultado.detalle[0]) {
                    const cotizacionBCRA = ultimoResultado.detalle[0].tipoCotizacion;
                    const fechaCotizacion = ultimoResultado.fecha;
                    
                    if (cotizacionBCRA && cotizacionBCRA > 0) {
                        aplicarCotizacion(cotizacionBCRA, 'BCRA');
                        guardarCotizacionEnCache(cotizacionBCRA, 'BCRA');
                        actualizarCotizacionEnInterfaz('BCRA', fechaCotizacion);
                        console.log(`Cotización BCRA obtenida: $${cotizacionBCRA} (fecha: ${fechaCotizacion})`);
                        return;
                    }
                }
            }
        } catch (bcraError) {
            console.log('API del BCRA no disponible, intentando con API alternativa:', bcraError.message);
        }

        // Fallback: API alternativa (DolarApi.com)
        try {
            const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
            const data = await response.json();
            
            if (data && data.venta) {
                aplicarCotizacion(parseFloat(data.venta), 'API alternativa');
                guardarCotizacionEnCache(parseFloat(data.venta), 'API alternativa');
                actualizarCotizacionEnInterfaz('API alternativa', fechaHasta);
                console.log(`Cotización alternativa obtenida: $${data.venta}`);
                return;
            }
        } catch (altError) {
            console.log('API alternativa también falló:', altError.message);
        }

        // Si todo falla, usar valores por defecto
        throw new Error('Todas las APIs fallaron');
        
    } catch (error) {
        console.log('No se pudo obtener la cotización oficial, usando valor por defecto');
        
        // Analytics: Rastrear error al obtener cotización
        if (window.calculadoraAnalytics) {
            window.calculadoraAnalytics.trackError('api_cotizacion', error.message, 'obtenerCotizacionOficial');
        }
        
        // Si falla, usar valores por defecto actualizados
        aplicarCotizacion(1301, 'Valor por defecto');
        actualizarCotizacionEnInterfaz('Valor por defecto', new Date().toISOString().split('T')[0]);
    }
}

// Función auxiliar para aplicar cotización
function aplicarCotizacion(valor, fuente) {
    CONFIG.tiposCambio.oficial = valor;
    CONFIG.tiposCambio.simulador = valor;
            // Mantener los valores fijos de las bandas cambiarias
        // CONFIG.tiposCambio.techo = 1400 (techo fijo)
        // CONFIG.tiposCambio.piso = 1000 (piso fijo)
        
        console.log(`Cotización obtenida de ${fuente}: $${valor}`);
        console.log(`Bandas fijas: Piso $${CONFIG.tiposCambio.piso}, Techo $${CONFIG.tiposCambio.techo}`);
}

// Sistema de cache en localStorage
function obtenerCotizacionDeCache() {
    try {
        const cache = localStorage.getItem('cotizacion_cache');
        if (!cache) return null;
        
        const datos = JSON.parse(cache);
        const ahora = new Date();
        const fechaCache = new Date(datos.timestamp);
        
        // Cache válido por 1 hora
        const horasTranscurridas = (ahora - fechaCache) / (1000 * 60 * 60);
        
        if (horasTranscurridas < 1) {
            console.log(`Usando cotización desde cache (${datos.fuente}): $${datos.valor}`);
            return datos;
        }
        
        // Cache expirado
        localStorage.removeItem('cotizacion_cache');
        return null;
        
    } catch (error) {
        console.log('Error al leer cache:', error);
        localStorage.removeItem('cotizacion_cache');
        return null;
    }
}

function guardarCotizacionEnCache(valor, fuente) {
    try {
        const datos = {
            valor: valor,
            fuente: fuente,
            fecha: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('cotizacion_cache', JSON.stringify(datos));
        console.log(`Cotización guardada en cache: $${valor} (${fuente})`);
        
    } catch (error) {
        console.log('Error al guardar en cache:', error);
    }
}

function establecerValoresPorDefecto() {
    // Establecer valores por defecto
    elementos.valorPropiedad.value = 155000; // USD 155,000
    elementos.montoPrestamo.value = 70000000; // $70,000,000 ARS
    elementos.tasaInteres.value = 8.5;
    elementos.plazo.value = 20;
    
    // Actualizar también los elementos de visualización de los sliders
    const plazoValor = document.getElementById('plazoValor');
    const tasaValor = document.getElementById('tasaValor');
    
    if (plazoValor) plazoValor.textContent = '20';
    if (tasaValor) tasaValor.textContent = '8.5';
    
    // Asegurar que los valores estén establecidos en el DOM
    console.log('Valores por defecto establecidos:', {
        valorPropiedad: elementos.valorPropiedad.value,
        montoPrestamo: elementos.montoPrestamo.value,
        tasaInteres: elementos.tasaInteres.value,
        plazo: elementos.plazo.value
    });
}

function agregarEventListeners() {
    // Recalcular cuando cambien los inputs (excepto el slider de tipo de cambio)
    Object.values(elementos).forEach(elemento => {
        if (elemento && elemento.tagName === 'INPUT' && elemento.id !== 'tcInput') {
            // Validación progresiva no intrusiva
            elemento.addEventListener('input', function() {
                // Calcular inmediatamente sin validación visual para mejor UX
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    calcularTodo();
                }, 300); // Reducido el delay
            });
            
            // Validación sutil solo cuando el usuario termina de escribir
            elemento.addEventListener('blur', function() {
                VALIDATION_SYSTEM.validateField(this);
            });
            
            // Validación inmediata solo para valores claramente inválidos
            elemento.addEventListener('input', function() {
                const valor = parseFloat(this.value) || 0;
                
                // Solo mostrar errores críticos inmediatamente
                if (this.value && valor <= 0 && ['valorPropiedad', 'montoPrestamo', 'tasaInteres', 'plazo'].includes(this.id)) {
                    VALIDATION_SYSTEM.validateField(this);
                } else if (this.value === '') {
                    // Limpiar validación cuando el campo está vacío
                    VALIDATION_SYSTEM.clearFieldState(this);
                }
            });
        }
        if (elemento && elemento.tagName === 'SELECT') {
            // Tracking especial para cambio de provincia
            if (elemento.id === 'provincia') {
                let previousProvincia = elemento.value;
                elemento.addEventListener('change', function() {
                    // Analytics: Rastrear cambio de provincia
                    if (window.AnalyticsTracker) {
                        window.AnalyticsTracker.trackProvinciaChanged(this.value);
                    }
                    previousProvincia = this.value;
                    
                    // Actualizar sliders de gastos para la nueva provincia
                    actualizarSlidersGastos(this.value);
                    
                    calcularTodo();
                });
            } else {
                elemento.addEventListener('change', calcularTodo);
            }
        }
    });
    
    // Configurar sliders
    configurarSliders();
    
    // Configurar slider de tipo de cambio
    configurarSliderTC();
    
    // Configurar sliders de gastos
    configurarSlidersGastos();
}

// Sistema de validación no intrusivo con indicadores visuales sutiles
const VALIDATION_SYSTEM = {
    // Estados de validación
    states: new Map(),
    
    // Validar campo con indicadores sutiles
    validateField(element) {
        const valor = parseFloat(element.value) || 0;
        const id = element.id;
        
        // Limpiar estado anterior
        this.clearFieldState(element);
        
        let validation = { isValid: true, level: 'valid', message: '' };
        
        // Validaciones específicas por campo
        switch (id) {
            case 'valorPropiedad':
                if (valor <= 0) {
                    validation = { isValid: false, level: 'error', message: 'Valor requerido' };
                } else if (valor > 300000) {
                    validation = { isValid: true, level: 'warning', message: 'Valor muy alto' };
                } else if (valor < 10000) {
                    validation = { isValid: true, level: 'info', message: 'Valor bajo para una propiedad' };
                }
                break;
                
            case 'montoPrestamo':
                if (valor <= 0) {
                    validation = { isValid: false, level: 'error', message: 'Monto requerido' };
                } else if (valor > 1000000000) {
                    validation = { isValid: true, level: 'warning', message: 'Monto muy alto' };
                }
                break;
                
            case 'tasaInteres':
                if (valor <= 0) {
                    validation = { isValid: false, level: 'error', message: 'Tasa requerida' };
                } else if (valor < 4.5 || valor > 11) {
                    validation = { isValid: true, level: 'warning', message: 'Fuera del rango típico (4.5% - 11%)' };
                }
                break;
                
            case 'plazo':
                if (valor <= 0) {
                    validation = { isValid: false, level: 'error', message: 'Plazo requerido' };
                } else if (valor < 5 || valor > 35) {
                    validation = { isValid: true, level: 'warning', message: 'Fuera del rango típico (5-35 años)' };
                }
                break;
        }
        
        // Aplicar estado visual
        this.applyFieldState(element, validation);
        this.states.set(id, validation);
        
        // Actualizar indicador global después de un breve delay
        setTimeout(() => this.updateGlobalStatus(), 100);
        
        return validation;
    },
    
    // Aplicar estado visual al campo
    applyFieldState(element, validation) {
        const formGroup = element.closest('.form-group');
        if (!formGroup) return;
        
        // Remover clases previas
        formGroup.classList.remove('field-valid', 'field-warning', 'field-error', 'field-info');
        
        // Aplicar nueva clase
        if (validation.level !== 'valid') {
            formGroup.classList.add(`field-${validation.level}`);
        }
        
        // Mostrar/ocultar mensaje sutil
        this.updateFieldMessage(formGroup, validation);
    },
    
    // Actualizar mensaje sutil del campo
    updateFieldMessage(formGroup, validation) {
        let messageEl = formGroup.querySelector('.field-message');
        
        if (validation.level === 'valid' || !validation.message) {
            // Ocultar mensaje
            if (messageEl) {
                messageEl.remove();
            }
            return;
        }
        
        // Crear o actualizar mensaje
        if (!messageEl) {
            messageEl = document.createElement('small');
            messageEl.className = 'field-message';
            formGroup.appendChild(messageEl);
        }
        
        messageEl.textContent = validation.message;
        messageEl.className = `field-message field-message-${validation.level}`;
    },
    
    // Limpiar estado de campo
    clearFieldState(element) {
        const formGroup = element.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('field-valid', 'field-warning', 'field-error', 'field-info');
            const messageEl = formGroup.querySelector('.field-message');
            if (messageEl) {
                messageEl.remove();
            }
        }
    },
    
    // Obtener estado de validación general
    getOverallValidation() {
        let hasErrors = false;
        let hasWarnings = false;
        
        for (const [id, validation] of this.states) {
            if (validation.level === 'error') {
                hasErrors = true;
            } else if (validation.level === 'warning') {
                hasWarnings = true;
            }
        }
        
        if (hasErrors) return 'error';
        if (hasWarnings) return 'warning';
        return 'valid';
    },
    
    // Actualizar indicador global de estado
    updateGlobalStatus() {
        const statusElement = document.getElementById('validation-status');
        const statusText = statusElement?.querySelector('.status-text');
        
        if (!statusElement || !statusText) return;
        
        const datos = obtenerDatosEntrada();
        const overall = this.getOverallValidation();
        
        // Determinar estado y mensaje
        let state = 'hidden';
        let message = '';
        
        if (datos.valorPropiedad > 0 && datos.montoPrestamo > 0 && datos.tasaInteres > 0 && datos.plazo > 0) {
            if (overall === 'error') {
                state = 'warning';
                message = 'Revisá los valores ingresados';
            } else if (overall === 'warning') {
                state = 'warning';
                message = 'Datos listos, revisá las recomendaciones';
            } else {
                state = 'ready';
                message = 'Todos los datos están completos';
            }
        } else {
            state = 'hidden'; // Ocultar cuando faltan muchos datos
        }
        
        // Aplicar estado
        statusElement.className = `validation-status ${state}`;
        statusText.textContent = message;
    }
};

// Función legacy mantenida para compatibilidad
function validarCampoIndividual(elemento) {
    return VALIDATION_SYSTEM.validateField(elemento);
}

function calcularTodo() {
    const datos = obtenerDatosEntrada();
    
    // Actualizar indicador global de estado
    VALIDATION_SYSTEM.updateGlobalStatus();
    
    // Analytics: Trackear inicio de cálculo
    if (window.AnalyticsTracker) {
        window.AnalyticsTracker.trackCalculationStarted(datos);
    }
    
    // Siempre intentar calcular, incluso con datos incompletos
    if (validarDatos(datos)) {
        const resultados = calcularCredito(datos);
        mostrarResultados(resultados);
        mostrarTipsDinamicos(resultados);
        
        // Validación progresiva y consejos contextuales
        mostrarValidacionProgresiva(datos, resultados);
        
        // Analytics: Trackear cálculo completado exitosamente
        if (window.AnalyticsTracker) {
            window.AnalyticsTracker.trackCalculationCompleted(resultados, datos);
        }
    } else {
        // Limpiar resultados si los datos no son válidos
        limpiarResultados();
        // Mostrar guía sutil de qué falta completar
        mostrarGuiaCompletar(datos);
    }
}

// Validación progresiva integrada en los resultados
function mostrarValidacionProgresiva(datos, resultados) {
    // Revisar ratios y relaciones importantes
    const valorPropiedadPesos = datos.valorPropiedad * CONFIG.tiposCambio.oficial;
    const ratioLTV = (datos.montoPrestamo / valorPropiedadPesos) * 100;
    
    // Mostrar insights útiles en lugar de errores
    if (ratioLTV > 90) {
        // Agregar un tip contextual sobre el alto ratio préstamo/valor
        FEEDBACK_SYSTEM.showContextualTip(
            'Considerá que necesitarás al menos 10% extra para gastos de escritura e inmobiliaria',
            'info'
        );
    }
    
    // Validar cuota vs ingresos recomendados
    const cuota = resultados.primeraCuota;
    const ingresoRecomendado = cuota / 0.25;
    
    if (ingresoRecomendado > 500000) { // Si requiere más de $500k de ingreso
        FEEDBACK_SYSTEM.showContextualTip(
            'Esta cuota requiere ingresos familiares altos. Considerá ajustar el monto o plazo',
            'info'
        );
    }
}

// Guía sutil de campos faltantes
function mostrarGuiaCompletar(datos) {
    const camposFaltantes = [];
    
    if (datos.valorPropiedad <= 0) camposFaltantes.push('valor de la propiedad');
    if (datos.montoPrestamo <= 0) camposFaltantes.push('monto del préstamo');
    if (datos.tasaInteres <= 0) camposFaltantes.push('tasa de interés');
    if (datos.plazo <= 0) camposFaltantes.push('plazo del crédito');
    
    // Solo mostrar si hay muchos campos vacíos (evitar spam)
    if (camposFaltantes.length >= 2) {
        const mensaje = `Completá ${camposFaltantes.join(', ')} para ver los resultados`;
        
        // Mostrar en lugar de los resultados principales del CORE
        const elementosCore = [
            'primeraCuota', 'primeraCuotaUSD',
            'totalPagar', 'totalPagarUSD',
            'diferenciaACubrir', 'diferenciaACubrirUSD',
            'montoPrestamoBanco', 'montoPrestamoBancoUSD'
        ];
        
        elementosCore.forEach(id => {
            const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = '—';
            elemento.title = mensaje;
        }
        });
        
        // Limpiar gastos y escenarios
        const elementosGastos = [
            'gastoEscrituraARS', 'gastoEscrituraUSD',
            'gastoInmobiliariaARS', 'gastoInmobiliariaUSD',
            'gastoFirmasARS', 'gastoFirmasUSD',
            'gastoSellosARS', 'gastoSellosUSD',
            'gastosTotalARS', 'gastosTotalUSD'
        ];
        
        elementosGastos.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = '—';
                elemento.title = mensaje;
            }
        });
        
        const elementosEscenarios = [
            'tcPisoEscenario', 'totalPisoARS', 'totalPisoUSD',
            'tcOficialEscenario', 'totalOficialARS', 'totalOficialUSD',
            'tcTechoEscenario', 'totalTechoARS', 'totalTechoUSD'
        ];
        
        elementosEscenarios.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = '—';
                elemento.title = mensaje;
            }
        });
    }
}

function limpiarResultados() {
    // Primera cuota
    setLineaMoneda('primeraCuota', 'ARS', 0);
    setLineaMoneda('primeraCuotaUSD', 'USD', 0);
    
    // Totales
    setLineaMoneda('totalPagar', 'ARS', 0, true);
    setLineaMoneda('totalPagarUSD', 'USD', 0, true);
    
    // Valor de la casa
    setLineaMoneda('valorCasaARS', 'ARS', 0);
    setLineaMoneda('valorCasaUSD', 'USD', 0);
    
    // Gastos detallados
    ['gastoEscritura','gastoInmobiliaria','gastoFirmas','gastoSellos'].forEach(base => {
        setLineaMoneda(base + 'ARS', 'ARS', 0);
        setLineaMoneda(base + 'USD', 'USD', 0);
    });
    setLineaMoneda('gastosTotalARS', 'ARS', 0, true);
    setLineaMoneda('gastosTotalUSD', 'USD', 0, true);
    
    // Escenarios de tipo de cambio (dejar como "$0" por estructura de etiquetas "ARS: <span>")
    const idsEsc = [
        'tcPisoEscenario','totalPisoARS','totalPisoUSD','prestamoPisoARS','prestamoPisoUSD','diferenciaPisoARS','diferenciaPisoUSD',
        'tcOficialEscenario','totalOficialARS','totalOficialUSD','prestamoOficialARS','prestamoOficialUSD','diferenciaOficialARS','diferenciaOficialUSD',
        'tcTechoEscenario','totalTechoARS','totalTechoUSD','prestamoTechoARS','prestamoTechoUSD','diferenciaTechoARS','diferenciaTechoUSD'
    ];
    idsEsc.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '$0'; });
    

}

function obtenerDatosEntrada() {
    const datos = {
        valorPropiedad: parseFloat(elementos.valorPropiedad.value) || 0,
        provincia: elementos.provincia.value,
        montoPrestamo: parseFloat(elementos.montoPrestamo.value) || 0,
        plazo: parseInt(elementos.plazo.value) || 20,
        tasaInteres: parseFloat(elementos.tasaInteres.value) || 0
    };
    
    // Debug: mostrar qué datos se están obteniendo
    console.log('Datos obtenidos del DOM:', datos);
    
    // Si algún valor crítico es 0, intentar usar valores por defecto
    if (datos.valorPropiedad === 0) {
        datos.valorPropiedad = 155000;
        console.log('Usando valor por defecto para valorPropiedad:', datos.valorPropiedad);
    }
    if (datos.montoPrestamo === 0) {
        datos.montoPrestamo = 70000000;
        console.log('Usando valor por defecto para montoPrestamo:', datos.montoPrestamo);
    }
    if (datos.tasaInteres === 0) {
        datos.tasaInteres = 8.5;
        console.log('Usando valor por defecto para tasaInteres:', datos.tasaInteres);
    }
    if (datos.plazo === 0) {
        datos.plazo = 20;
        console.log('Usando valor por defecto para plazo:', datos.plazo);
    }
    
    return datos;
}

function validarDatos(datos) {
    // Validación básica solo para cálculos, sin interrupciones al usuario
    const isValidValue = datos.valorPropiedad > 0;
    const isValidLoan = datos.montoPrestamo > 0;
    const isValidRate = datos.tasaInteres > 0;
    const isValidTerm = datos.plazo > 0;
    
    // Debug: mostrar qué valores se están validando
    if (!isValidValue || !isValidLoan || !isValidRate || !isValidTerm) {
        console.log('Validación falló:', {
            valorPropiedad: datos.valorPropiedad,
            montoPrestamo: datos.montoPrestamo,
            tasaInteres: datos.tasaInteres,
            plazo: datos.plazo,
            isValidValue,
            isValidLoan,
            isValidRate,
            isValidTerm
        });
    }
    
    // Permitir cálculo si todos los valores básicos están presentes
    const canCalculate = isValidValue && isValidLoan && isValidRate && isValidTerm;
    
    // No mostrar alertas intrusivas, solo validar para el cálculo
    return canCalculate;
}

function calcularCredito(datos) {
    // El monto del préstamo siempre está en pesos
    const montoPrestamoPesos = datos.montoPrestamo;
    
    const tasaMensual = datos.tasaInteres / 12 / 100;
    const totalMeses = datos.plazo * 12;
    
    // Cálculo de cuota mensual (fórmula de amortización)
    const cuotaMensual = montoPrestamoPesos * 
        (tasaMensual * Math.pow(1 + tasaMensual, totalMeses)) / 
        (Math.pow(1 + tasaMensual, totalMeses) - 1);
    
    // Primera cuota (sin ajuste UVA)
    const primeraCuota = cuotaMensual;
    
    // Gastos extra
    const gastosExtra = calcularGastosExtra(datos.valorPropiedad, datos.provincia);
    
    // Total de la operación = valor de la casa + gastos
    const valorCasaPesos = datos.valorPropiedad * CONFIG.tiposCambio.oficial;
    const totalOperacion = valorCasaPesos + gastosExtra.total;
    
    // Cuota promedio considerando UVA
    const cuotaPromedio = calcularCuotaPromedioConUVA(cuotaMensual, totalMeses);
    
    // Actualizar valor en pesos mostrado
    actualizarValorEnPesos(datos.valorPropiedad);
    
    // Actualizar equivalencia del monto prestado
    actualizarEquivalenciaMontoPrestado(datos.montoPrestamo);
    
    return {
        primeraCuota,
        totalPagar: totalOperacion, // Ahora es casa + gastos
        gastosExtra,
        cuotaPromedio,
        montoPrestamoPesos,
        cuotaMensual
    };
}

function calcularGastosExtra(valorPropiedad, provincia) {
    const gastos = CONFIG.gastosExtra[provincia];
    const valorPesos = valorPropiedad * CONFIG.tiposCambio.oficial;
    
    // Calcular con valores intermedios
    const escritura = valorPesos * gastos.escritura.intermedio / 100;
    const inmobiliaria = valorPesos * gastos.inmobiliaria.intermedio / 100;
    const firmas = valorPesos * gastos.firmas.intermedio / 100;
    const sellos = valorPesos * gastos.sellos.intermedio / 100;
    
    const totalIntermedio = escritura + inmobiliaria + firmas + sellos;
    
    return {
        escritura,
        inmobiliaria,
        firmas,
        sellos,
        total: totalIntermedio,
        // Mantener referencias de rangos para información
        referencias: {
            escritura: { min: gastos.escritura.min, max: gastos.escritura.max },
            inmobiliaria: { min: gastos.inmobiliaria.min, max: gastos.inmobiliaria.max },
            firmas: { min: gastos.firmas.min, max: gastos.firmas.max },
            sellos: { min: gastos.sellos.min, max: gastos.sellos.max }
        }
    };
}

// Función para calcular gastos extra con un tipo de cambio específico
function calcularGastosExtraConTC(valorPropiedad, provincia, tipoCambio) {
    const gastos = CONFIG.gastosExtra[provincia];
    const valorPesos = valorPropiedad * tipoCambio;
    
    // Calcular con valores intermedios
    const escritura = valorPesos * gastos.escritura.intermedio / 100;
    const inmobiliaria = valorPesos * gastos.inmobiliaria.intermedio / 100;
    const firmas = valorPesos * gastos.firmas.intermedio / 100;
    const sellos = valorPesos * gastos.sellos.intermedio / 100;
    
    const totalIntermedio = escritura + inmobiliaria + firmas + sellos;
    
    return {
        escritura,
        inmobiliaria,
        firmas,
        sellos,
        total: totalIntermedio
    };
}

// Función para actualizar valores intermedios
function actualizarValorIntermedio(tipo, valor, provincia) {
    CONFIG.gastosExtra[provincia][tipo].intermedio = parseFloat(valor);
}

function calcularCuotaPromedioConUVA(cuotaInicial, totalMeses) {
    // Simulación de ajuste UVA a lo largo del tiempo
    let cuotaAcumulada = 0;
    let cuotaActual = cuotaInicial;
    
    for (let mes = 1; mes <= totalMeses; mes++) {
        cuotaAcumulada += cuotaActual;
        cuotaActual *= CONFIG.factorUVA;
    }
    
    return cuotaAcumulada / totalMeses;
}



function mostrarResultados(resultados) {
    // Primera cuota en ambas monedas
    setLineaMoneda('primeraCuota', 'ARS', resultados.primeraCuota);
    const primeraCuotaUSD = resultados.primeraCuota / CONFIG.tiposCambio.oficial;
    setLineaMoneda('primeraCuotaUSD', 'USD', primeraCuotaUSD);
    
    // Valor de la casa en ambas monedas
    const datos = obtenerDatosEntrada();
    const valorCasaARS = datos.valorPropiedad * CONFIG.tiposCambio.oficial;
    const valorCasaUSD = datos.valorPropiedad; // ya está en USD
    setLineaMoneda('valorCasaARS', 'ARS', valorCasaARS);
    setLineaMoneda('valorCasaUSD', 'USD', valorCasaUSD);
    
    // Total a pagar en ambas monedas (casa + gastos)
    setLineaMoneda('totalPagar', 'ARS', resultados.totalPagar, true);
    const totalPagarUSD = resultados.totalPagar / CONFIG.tiposCambio.oficial;
    setLineaMoneda('totalPagarUSD', 'USD', totalPagarUSD, true);
    
    // Desglose detallado de gastos en ambas monedas
    mostrarGastosDetallados(resultados.gastosExtra);
    
    // Calcular y mostrar escenarios de tipo de cambio
    mostrarEscenariosTipoCambio(datos, resultados);
    
    // Actualizar checklist de preparación
    actualizarChecklist(datos, resultados);
}

// Nueva función para mostrar gastos detallados en el CORE
function mostrarGastosDetallados(gastosExtra) {
    // Escritura
    setLineaMoneda('gastoEscrituraARS', 'ARS', gastosExtra.escritura);
    setLineaMoneda('gastoEscrituraUSD', 'USD', gastosExtra.escritura / CONFIG.tiposCambio.oficial);
    
    // Inmobiliaria
    setLineaMoneda('gastoInmobiliariaARS', 'ARS', gastosExtra.inmobiliaria);
    setLineaMoneda('gastoInmobiliariaUSD', 'USD', gastosExtra.inmobiliaria / CONFIG.tiposCambio.oficial);
    
    // Firmas
    setLineaMoneda('gastoFirmasARS', 'ARS', gastosExtra.firmas);
    setLineaMoneda('gastoFirmasUSD', 'USD', gastosExtra.firmas / CONFIG.tiposCambio.oficial);
    
    // Sellos
    setLineaMoneda('gastoSellosARS', 'ARS', gastosExtra.sellos);
    setLineaMoneda('gastoSellosUSD', 'USD', gastosExtra.sellos / CONFIG.tiposCambio.oficial);
    
    // Total gastos
    setLineaMoneda('gastosTotalARS', 'ARS', gastosExtra.total, true);
    setLineaMoneda('gastosTotalUSD', 'USD', gastosExtra.total / CONFIG.tiposCambio.oficial, true);
}

// Nueva función para mostrar escenarios de tipo de cambio
function mostrarEscenariosTipoCambio(datos, resultados) {
    const bandasInfo = calcularBandasCambiarias();
    
    // Helper para setear valores por escenario
    function setEscenario(prefix, tc, totalOperacion, baseline) {
        const prestamoARS = datos.montoPrestamo;
        const prestamoUSD = prestamoARS / tc;
        const diferenciaARS = totalOperacion - prestamoARS;
        const diferenciaUSD = diferenciaARS / tc;
        
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = typeof value === 'number' ? (id.includes('USD') ? formatearUSD(value) : formatearARS(value)) : value;
        };
        
        // Totales
        setText(`total${prefix}ARS`, totalOperacion);
        setText(`total${prefix}USD`, totalOperacion / tc);
        
        // Préstamo del banco
        setText(`prestamo${prefix}ARS`, prestamoARS);
        setText(`prestamo${prefix}USD`, prestamoUSD);
        
        // Diferencia a cubrir
        setText(`diferencia${prefix}ARS`, diferenciaARS);
        setText(`diferencia${prefix}USD`, diferenciaUSD);

        // Si tenemos baseline (oficial), mostrar delta vs oficial
        if (baseline) {
            const deltaARS = diferenciaARS - baseline.diferenciaARS;
            const deltaUSD = diferenciaUSD - baseline.diferenciaUSD;
            setText(`delta${prefix}ARS`, deltaARS);
            setText(`delta${prefix}USD`, deltaUSD);

            // Colorear según impacto económico intuitivo
            let cls;
            if (deltaARS === 0) {
                cls = 'igual'; // Dorado: sin cambio
            } else if (deltaARS < 0) {
                cls = 'mejor'; // Verde: necesitás menos dinero (mejor para vos)
            } else {
                cls = 'peor'; // Rojo: necesitás más dinero (peor para vos)
            }

            const colValores = document.getElementById(`delta${prefix}ARS`)?.closest('.col-valores');
            if (colValores) {
                colValores.classList.remove('mejor','peor','igual');
                colValores.classList.add(cls);
            }


        }
    }
    
    // Escenario Piso (mejor caso)
    const tcPiso = bandasInfo.piso;
    const elPiso = document.getElementById('tcPisoEscenario');
    if (elPiso) elPiso.textContent = formatearARS(tcPiso);
    const valorCasaPiso = datos.valorPropiedad * tcPiso;
    const gastosPiso = calcularGastosExtraConTC(datos.valorPropiedad, datos.provincia, tcPiso);
    const totalPiso = valorCasaPiso + gastosPiso.total;
    
    // Escenario Oficial (caso base)
    const tcOficial = CONFIG.tiposCambio.oficial;
    const elOf = document.getElementById('tcOficialEscenario');
    if (elOf) elOf.textContent = formatearARS(tcOficial);
    const valorCasaOficial = datos.valorPropiedad * tcOficial;
    const gastosOficial = calcularGastosExtraConTC(datos.valorPropiedad, datos.provincia, tcOficial);
    const totalOficial = valorCasaOficial + gastosOficial.total;
    setEscenario('Oficial', tcOficial, totalOficial);

    // Calcular baseline para deltas
    const baseline = {
        diferenciaARS: totalOficial - datos.montoPrestamo,
        diferenciaUSD: (totalOficial - datos.montoPrestamo) / tcOficial
    };

    // Ahora setear Piso con deltas vs oficial
    setEscenario('Piso', tcPiso, totalPiso, baseline);
    
    // Escenario Techo (peor caso)
    const tcTecho = bandasInfo.techo;
    const elTecho = document.getElementById('tcTechoEscenario');
    if (elTecho) elTecho.textContent = formatearARS(tcTecho);
    const valorCasaTecho = datos.valorPropiedad * tcTecho;
    const gastosTecho = calcularGastosExtraConTC(datos.valorPropiedad, datos.provincia, tcTecho);
    const totalTecho = valorCasaTecho + gastosTecho.total;
    setEscenario('Techo', tcTecho, totalTecho, baseline);
    
    // Analytics: Rastrear visualización de escenarios
    if (window.calculadoraAnalytics) {
        window.calculadoraAnalytics.trackCurrencyScenarios({
            piso: tcPiso,
            oficial: tcOficial,
            techo: tcTecho,
            diferencia_piso_oficial: ((tcOficial - tcPiso) / tcPiso * 100).toFixed(1),
            diferencia_techo_oficial: ((tcTecho - tcOficial) / tcOficial * 100).toFixed(1)
        });
    }
}

// Extender limpieza para escenarios
(function extendLimpiarResultados(){
    const original = limpiarResultados;
    limpiarResultados = function() {
        original();
        const ids = [
            'prestamoPisoARS','prestamoPisoUSD','diferenciaPisoARS','diferenciaPisoUSD','deltaPisoARS','deltaPisoUSD',
            'prestamoOficialARS','prestamoOficialUSD','diferenciaOficialARS','diferenciaOficialUSD','deltaOficialARS','deltaOficialUSD',
            'prestamoTechoARS','prestamoTechoUSD','diferenciaTechoARS','diferenciaTechoUSD','deltaTechoARS','deltaTechoUSD'
        ];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '$0'; });
    }
})();

function formatearPesos(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearNumero(valor) {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearUSD(valor) {
    return formatearNumero(valor);
}

function formatearARS(valor) {
    return formatearPesos(valor);
}

function actualizarValorEnPesos(valorUSD) {
    const valorPesos = valorUSD * CONFIG.tiposCambio.oficial;
    const elementoValorPesos = document.getElementById('valorPropiedadPesos');
    if (elementoValorPesos) {
        elementoValorPesos.textContent = formatearPesos(valorPesos);
    }
}

function actualizarEquivalenciaMontoPrestado(montoPesos) {
    const elementoEquivalencia = document.getElementById('montoPrestamoEquivalente');
    if (!elementoEquivalencia) return;
    
    // Siempre mostrar el equivalente en USD del monto en pesos
    const equivalenciaUSD = montoPesos / CONFIG.tiposCambio.oficial;
    elementoEquivalencia.textContent = formatearUSD(equivalenciaUSD);
}

function actualizarCotizacionEnInterfaz(fuente = 'Automático', fecha = null) {
    const elementoCotizacion = document.getElementById('cotizacionActual');
    const fechaCotizacion = document.getElementById('fechaCotizacion');
    
    if (elementoCotizacion) {
        elementoCotizacion.textContent = formatearPesos(CONFIG.tiposCambio.oficial);
    }
    
    if (fechaCotizacion) {
        const ahora = new Date();
        let textoActualizacion = '';
        
        if (fuente === 'BCRA') {
            textoActualizacion = `✅ BCRA Oficial - ${fecha || ahora.toLocaleDateString('es-AR')}`;
        } else if (fuente === 'API alternativa') {
            textoActualizacion = `⚠️ API alternativa - ${ahora.toLocaleTimeString('es-AR')}`;
        } else if (fuente === 'Valor por defecto') {
            textoActualizacion = `❌ Sin conexión - Valor estimado`;
        } else {
            textoActualizacion = `Desde cache - ${ahora.toLocaleTimeString('es-AR')}`;
        }
        
        fechaCotizacion.textContent = textoActualizacion;
    }
}



// Configurar sliders
function configurarSliders() {
    const plazoSlider = document.getElementById('plazo');
    const plazoValor = document.getElementById('plazoValor');
    const tasaSlider = document.getElementById('tasaInteres');
    const tasaValor = document.getElementById('tasaValor');
    
    if (plazoSlider && plazoValor) {
        let previousPlazo = plazoSlider.value;
        plazoSlider.addEventListener('input', function() {
            plazoValor.textContent = this.value;
            
            // Analytics: Rastrear cambio de plazo
            if (window.calculadoraAnalytics) {
                window.calculadoraAnalytics.trackSliderChange('plazo', parseInt(this.value), parseInt(previousPlazo));
            }
            previousPlazo = this.value;
            
            calcularTodo();
        });
    }
    
    if (tasaSlider && tasaValor) {
        let previousTasa = tasaSlider.value;
        tasaSlider.addEventListener('input', function() {
            tasaValor.textContent = this.value;
            
            // Analytics: Rastrear cambio de tasa
            if (window.calculadoraAnalytics) {
                window.calculadoraAnalytics.trackSliderChange('tasa_interes', parseFloat(this.value), parseFloat(previousTasa));
            }
            previousTasa = this.value;
            
            calcularTodo();
        });
    }
}

// Configurar input de tipo de cambio
function configurarSliderTC() {
    const tcInput = document.getElementById('tcInput');
    const tcSuggestions = document.querySelectorAll('.tc-suggestion');
    
    if (tcInput) {
        // Inicializar input con el valor oficial
        tcInput.value = CONFIG.tiposCambio.oficial;
        
        // Evento para cambios manuales
        tcInput.addEventListener('input', function() {
            // Permitir que el usuario escriba cualquier valor mientras tipea
            const valorTexto = this.value;
            const nuevoTC = parseInt(valorTexto);
            
            // Solo procesar si es un número válido
            if (!isNaN(nuevoTC) && nuevoTC > 0) {
                // Analytics: Rastrear cambio en simulador de tipo de cambio
                if (window.calculadoraAnalytics) {
                    window.calculadoraAnalytics.trackCurrencyScenario(nuevoTC, 'manual');
                }
                
                // Solo actualizar el simulador, no el oficial
                CONFIG.tiposCambio.simulador = nuevoTC;
                
                // Recalcular todo el CORE con el nuevo tipo de cambio
                recalcularCoreConNuevoTC(nuevoTC);
                
                // Actualizar estado visual de sugerencias
                actualizarEstadoSugerencias();
                
                // Validar y mostrar consejos sobre bandas cambiarias
                validarTipoCambioConBandas(nuevoTC);
            }
        });
        
        // Evento para cambios finales (blur) - validación de rango
        tcInput.addEventListener('blur', function() {
            let valor = parseInt(this.value) || CONFIG.tiposCambio.oficial;
            
            // Validar rango solo cuando termine de escribir
            if (valor < 800) {
                valor = 800;
                this.value = valor;
            } else if (valor > 2000) {
                valor = 2000;
                this.value = valor;
            }
            
            // Actualizar si cambió el valor
            if (valor !== CONFIG.tiposCambio.simulador) {
                CONFIG.tiposCambio.simulador = valor;
                recalcularCoreConNuevoTC(valor);
                actualizarEstadoSugerencias();
            }
        });
    }
    
    // Configurar botones de sugerencias
    tcSuggestions.forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.dataset.tc;
            let nuevoValor;
            
            switch(tipo) {
                case 'oficial':
                    nuevoValor = CONFIG.tiposCambio.oficial;
                    break;
                case 'piso':
                    nuevoValor = calcularPisoBandaCambiaria().piso;
                    break;
                case 'techo':
                    nuevoValor = calcularBandasCambiarias().techo;
                    break;
                default:
                    nuevoValor = CONFIG.tiposCambio.oficial;
            }
            
            // Actualizar el input y el simulador
            tcInput.value = nuevoValor;
            CONFIG.tiposCambio.simulador = nuevoValor;
            
            // Analytics: Rastrear uso de sugerencia
            if (window.calculadoraAnalytics) {
                window.calculadoraAnalytics.trackCurrencyScenario(nuevoValor, `suggestion_${tipo}`);
            }
            
            // Recalcular todo el CORE con el nuevo tipo de cambio
            recalcularCoreConNuevoTC(nuevoValor);
            
            // Actualizar estado visual de sugerencias
            actualizarEstadoSugerencias();
            
            // Validar valor con bandas
            validarTipoCambioConBandas(nuevoValor);
        });
    });
    
    // Actualizar valores de las bandas en la interfaz
    actualizarBandasEnInterfaz();
    
    // Log para verificar que las bandas se mantengan fijas
    console.log('Bandas cambiarias configuradas:');
    console.log(`- Piso (mejor caso): $${calcularPisoBandaCambiaria().piso}`);
    console.log(`- Techo (peor caso): $${calcularBandasCambiarias().techo}`);
    console.log(`- Ancho de banda: $${calcularBandasCambiarias().techo - calcularPisoBandaCambiaria().piso}`);
}

// Nueva función para recalcular el CORE con un nuevo tipo de cambio
function recalcularCoreConNuevoTC(nuevoTC) {
    const datos = obtenerDatosEntrada();
    if (!validarDatos(datos)) {
        console.log('recalcularCoreConNuevoTC: datos no válidos', datos);
        return;
    }
    
    console.log('Recalculando CORE con nuevo TC:', nuevoTC);
    
    // Recalcular gastos con el nuevo tipo de cambio
    const gastosExtra = calcularGastosExtraConTC(datos.valorPropiedad, datos.provincia, nuevoTC);
    
    // Recalcular valores totales
    const valorCasaPesos = datos.valorPropiedad * nuevoTC;
    const totalOperacion = valorCasaPesos + gastosExtra.total;
    
    // Actualizar gastos detallados en el CORE
    mostrarGastosDetallados(gastosExtra);
    
    // Actualizar escenarios de tipo de cambio
    mostrarEscenariosTipoCambio(datos, {
        totalPagar: totalOperacion,
        gastosExtra: gastosExtra
    });
    
    // Actualizar diferencia a cubrir
    const diferenciaACubrir = totalOperacion - datos.montoPrestamo;
    document.getElementById('diferenciaACubrir').textContent = formatearARS(diferenciaACubrir);
    const diferenciaACubrirUSD = diferenciaACubrir / nuevoTC;
    document.getElementById('diferenciaACubrirUSD').textContent = formatearUSD(diferenciaACubrirUSD);
    
    // Actualizar equivalencia del monto prestado en USD
    const montoPrestamoBancoUSD = datos.montoPrestamo / nuevoTC;
    document.getElementById('montoPrestamoBancoUSD').textContent = formatearUSD(montoPrestamoBancoUSD);
    
    // Actualizar primera cuota en USD
    const primeraCuota = calcularCredito(datos).primeraCuota;
    const primeraCuotaUSD = primeraCuota / nuevoTC;
    const primeraCuotaUSDEl = document.getElementById('primeraCuotaUSD');
    if (primeraCuotaUSDEl) primeraCuotaUSDEl.textContent = formatearUSD(primeraCuotaUSD);
    
    // Actualizar total a pagar en USD
    const totalPagarUSD = totalOperacion / nuevoTC;
    const totalPagarUSDEl = document.getElementById('totalPagarUSD');
    if (totalPagarUSDEl) totalPagarUSDEl.textContent = formatearUSD(totalPagarUSD);
    
    console.log('CORE recalculado con TC:', nuevoTC);
}

// Configurar campos de gastos (ahora inputs numéricos)
function configurarSlidersGastos() {
    const tiposGasto = ['escritura', 'inmobiliaria', 'firmas', 'sellos'];
    
    tiposGasto.forEach(tipo => {
        const input = document.getElementById(tipo + 'Slider'); // Mantenemos el ID por compatibilidad
        
        if (input) {
            // Evento para cambios inmediatos
            input.addEventListener('input', function() {
                const nuevoValor = parseFloat(this.value) || 0;
                
                // Validar rango
                if (nuevoValor < 0) this.value = 0;
                if (nuevoValor > 10) this.value = 10;
                
                // Actualizar valor intermedio para la provincia actual
                const provinciaActual = elementos.provincia.value;
                actualizarValorIntermedio(tipo, parseFloat(this.value), provinciaActual);
                
                // Agregar feedback visual inmediato
                this.classList.add('updating');
                
                // Recalcular con delay para mejor performance
                clearTimeout(this.gastoTimeout);
                this.gastoTimeout = setTimeout(() => {
                    calcularTodo();
                    // Remover clase de actualización después de un breve delay
                    setTimeout(() => {
                        this.classList.remove('updating');
                    }, 500);
                }, 300);
            });
            
            // Evento para cambios finales (blur)
            input.addEventListener('blur', function() {
                const nuevoValor = parseFloat(this.value) || 0;
                
                // Validar y formatear el valor
                if (nuevoValor < 0) {
                    this.value = 0;
                } else if (nuevoValor > 10) {
                    this.value = 10;
                } else {
                    // Formatear a 2 decimales
                    this.value = nuevoValor.toFixed(2);
                }
                
                // Analytics: Rastrear cambio de gasto personalizable
                if (window.calculadoraAnalytics) {
                    const provinciaActual = elementos.provincia.value;
                    window.calculadoraAnalytics.trackGastoInputChange(tipo, nuevoValor, provinciaActual);
                }
                
                // Feedback visual de confirmación
                this.classList.add('confirmed');
                setTimeout(() => {
                    this.classList.remove('confirmed');
                }, 1000);
            });
            
            // Evento para focus - mejorar la experiencia visual
            input.addEventListener('focus', function() {
                this.closest('.gasto-item').classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.closest('.gasto-item').classList.remove('focused');
            });
        }
    });
}

// Función para actualizar campos de gastos cuando cambie la provincia
function actualizarSlidersGastos(provincia) {
    const tiposGasto = ['escritura', 'inmobiliaria', 'firmas', 'sellos'];
    
    tiposGasto.forEach(tipo => {
        const input = document.getElementById(tipo + 'Slider'); // Ahora son inputs numéricos
        
        if (input) {
            const valorIntermedio = CONFIG.gastosExtra[provincia][tipo].intermedio;
            input.value = valorIntermedio.toFixed(2);
        }
    });
}

// Mostrar tips dinámicos simplificados
function mostrarTipsDinamicos(resultados) {
    const tipsContainer = document.getElementById('tipsDinamicos');
    if (!tipsContainer) return;
    
    // Limpiar tips anteriores
    tipsContainer.innerHTML = '';
    
    const datos = obtenerDatosEntrada();
    if (!validarDatos(datos)) return;
    
    // 1. Tip personalizado sobre cuota vs ingresos (solo si es relevante)
    const cuota = resultados.primeraCuota;
    const ingresoRecomendado = cuota / 0.25;
    
    // Solo mostrar si la cuota es alta (requiere más de $400k de ingreso)
    if (ingresoRecomendado > 400000) {
        const tipCuota = document.createElement('div');
        tipCuota.className = 'tip-card warning';
        tipCuota.innerHTML = `
            <span class="tip-icon">⚠️</span>
            <div class="tip-content">
                <strong>Cuota alta detectada</strong>
                <p>Para esta cuota de ${formatearPesos(cuota)} necesitás ingresos de al menos ${formatearPesos(ingresoRecomendado)} por mes. Considerá ajustar el monto o plazo del crédito.</p>
            </div>
        `;
        tipsContainer.appendChild(tipCuota);
    }
    
    // 2. Tip sobre riesgo cambiario (solo si hay diferencia significativa)
    const bandasInfo = calcularBandasCambiarias();
    const diferenciaTC = bandasInfo.techo - bandasInfo.piso;
    const porcentajeDiferencia = ((diferenciaTC / CONFIG.tiposCambio.oficial) * 100).toFixed(1);
    
    if (porcentajeDiferencia > 30) {
        const tipRiesgo = document.createElement('div');
        tipRiesgo.className = 'tip-card danger';
        tipRiesgo.innerHTML = `
            <span class="tip-icon">🚨</span>
            <div class="tip-content">
                <strong>Alto riesgo cambiario</strong>
                <p>La banda cambiaria tiene ${porcentajeDiferencia}% de variación (${formatearPesos(diferenciaTC)}). Planificá con el escenario más desfavorable.</p>
            </div>
        `;
        tipsContainer.appendChild(tipRiesgo);
    }
    
    // 3. Tip sobre margen de seguridad personalizado
    const valorCasaPesos = datos.valorPropiedad * bandasInfo.techo; // Usar techo para peor caso
    const diferenciaACubrir = valorCasaPesos - datos.montoPrestamo;
    const gastosTecho = calcularGastosExtraEnPeorEscenario(datos.valorPropiedad);
    const totalNecesario = diferenciaACubrir + gastosTecho.total;
    const margenSeguridad = totalNecesario * 0.20;
    const reservaEmergencia = cuota * 6;
    const totalRecomendado = totalNecesario + margenSeguridad + reservaEmergencia;
    
    const tipAhorro = document.createElement('div');
    tipAhorro.className = 'tip-card success highlight';
    tipAhorro.innerHTML = `
        <span class="tip-icon">💎</span>
        <div class="tip-content">
            <strong>Plan de ahorro personalizado</strong>
            <p>Para estar cubierto en cualquier escenario, necesitás ahorrar ${formatearPesos(totalRecomendado)}. Esto incluye margen del 20% y reserva para 6 cuotas.</p>
        </div>
    `;
    tipsContainer.appendChild(tipAhorro);
    
    // 4. Tip sobre gastos específicos de la provincia (solo si son altos)
    const gastosPorcentaje = (gastosTecho.total / valorCasaPesos * 100).toFixed(1);
    if (gastosPorcentaje > 8) {
        const tipGastos = document.createElement('div');
        tipGastos.className = 'tip-card info';
        tipGastos.innerHTML = `
            <span class="tip-icon">💡</span>
            <div class="tip-content">
                <strong>Gastos altos en ${datos.provincia}</strong>
                <p>Los gastos de escritura e inmobiliaria representan ${gastosPorcentaje}% del valor de la casa. Considerá esto en tu presupuesto.</p>
            </div>
        `;
        tipsContainer.appendChild(tipGastos);
    }
    
    // Analytics: Rastrear generación de tips dinámicos
    if (window.calculadoraAnalytics) {
        const tipsCount = tipsContainer.children.length;
        window.calculadoraAnalytics.trackDynamicTipsGenerated(tipsCount, cuota, {
            provincia: datos.provincia,
            valorPropiedad: datos.valorPropiedad,
            montoPrestamo: datos.montoPrestamo
        });
    }
}

// Nueva función para calcular gastos extra en el peor escenario
function calcularGastosExtraEnPeorEscenario(valorPropiedadUSD) {
    const valorPesosPeorCaso = valorPropiedadUSD * calcularBandasCambiarias().techo;
    const provincia = elementos.provincia.value;
    const gastos = CONFIG.gastosExtra[provincia];
    
    // Usar valores máximos para el peor escenario
    const escrituraMax = valorPesosPeorCaso * gastos.escritura.max / 100;
    const inmobiliariaMax = valorPesosPeorCaso * gastos.inmobiliaria.max / 100;
    const firmasMax = valorPesosPeorCaso * gastos.firmas.max / 100;
    const sellosMax = valorPesosPeorCaso * gastos.sellos.max / 100;
    
    return {
        escritura: escrituraMax,
        inmobiliaria: inmobiliariaMax,
        firmas: firmasMax,
        sellos: sellosMax,
        total: escrituraMax + inmobiliariaMax + firmasMax + sellosMax
    };
}



// Sistema de feedback contextual no intrusivo
const FEEDBACK_SYSTEM = {
    // Mostrar feedback sutil en la UI
    showContextualTip(message, type = 'info', targetElement = null) {
        // Solo mostrar tips realmente útiles, no cada error de validación
        if (type === 'info' && message.includes('Considerá')) {
            // Agregar a los tips dinámicos existentes
            this.addToTips(message, type);
        }
    },
    
    // Agregar tip a la sección de consejos
    addToTips(message, type) {
        const tipsContainer = document.getElementById('tipsDinamicos');
        if (!tipsContainer) return;
        
        // Evitar duplicados
        const existing = tipsContainer.querySelector(`[data-message="${message}"]`);
        if (existing) return;
        
        const tip = document.createElement('div');
        tip.className = `tip-card ${type}`;
        tip.setAttribute('data-message', message);
        tip.innerHTML = `
            <span class="tip-icon">💡</span>
            <div class="tip-content">${message}</div>
        `;
        
        tipsContainer.appendChild(tip);
        
        // Auto-remover después de un tiempo
        setTimeout(() => {
            if (tip.parentNode) {
                tip.remove();
            }
        }, 10000);
    }
};

// Función legacy simplificada
function mostrarAlerta(mensaje, tipo = 'info') {
    // Redirigir al sistema no intrusivo
    FEEDBACK_SYSTEM.showContextualTip(mensaje, tipo);
}

// Validación contextual para consejos (no intrusiva)
function validarDatosParaConsejos() {
    const datos = obtenerDatosEntrada();
    const consejos = [];
    
    // Convertir valor de propiedad a pesos para comparar
    const valorPropiedadPesos = datos.valorPropiedad * CONFIG.tiposCambio.oficial;
    const montoPrestamoPesos = datos.montoPrestamo;
    
    // Generar consejos sutiles basados en la data
    if (montoPrestamoPesos > valorPropiedadPesos) {
        consejos.push({
            tipo: 'warning',
            mensaje: 'El préstamo es mayor al valor de la propiedad'
        });
    }
    
    if (montoPrestamoPesos > valorPropiedadPesos * 0.9) {
        consejos.push({
            tipo: 'info',
            mensaje: 'Considerá reservar al menos 10% extra para gastos'
        });
    }
    
    return consejos;
}

// Función para actualizar estado visual de sugerencias
function actualizarEstadoSugerencias() {
    const tcInput = document.getElementById('tcInput');
    const tcSuggestions = document.querySelectorAll('.tc-suggestion');
    
    if (!tcInput) return;
    
    const valorActual = parseInt(tcInput.value);
    
    // Solo actualizar si tenemos un valor válido
    if (isNaN(valorActual)) return;
    
    tcSuggestions.forEach(btn => {
        const tipo = btn.dataset.tc;
        let valorComparar;
        
        switch(tipo) {
            case 'oficial':
                valorComparar = CONFIG.tiposCambio.oficial;
                break;
            case 'piso':
                valorComparar = calcularPisoBandaCambiaria().piso;
                break;
            case 'techo':
                valorComparar = calcularBandasCambiarias().techo;
                break;
        }
        
        // Marcar activo si coincide con el valor actual (tolerancia de ±5)
        if (Math.abs(valorActual - valorComparar) <= 5) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Función para actualizar las bandas en la interfaz
function actualizarBandasEnInterfaz() {
    const elementos = {
        oficial: document.getElementById('tcOficial'),
        piso: document.getElementById('tcPiso'),
        techo: document.getElementById('tcTecho')
    };
    
    // Calcular ambas bandas dinámicamente
    const bandasInfo = calcularBandasCambiarias();
    
    if (elementos.oficial) {
        elementos.oficial.textContent = formatearPesos(CONFIG.tiposCambio.oficial);
    }
    
    if (elementos.piso) {
        elementos.piso.textContent = formatearPesos(bandasInfo.piso);
    }
    
    if (elementos.techo) {
        elementos.techo.textContent = formatearPesos(bandasInfo.techo);
    }
    
    // Log para verificar que las bandas se mantengan fijas
    console.log('Bandas cambiarias configuradas:');
    console.log(`- Piso: $${bandasInfo.piso} (base: $${CONFIG.tiposCambio.piso})`);
    console.log(`- Techo: $${bandasInfo.techo} (base: $${CONFIG.tiposCambio.techo})`);
    console.log(`- Ancho de banda: $${bandasInfo.techo - bandasInfo.piso}`);
    console.log(`- Meses transcurridos: ${bandasInfo.mesesTranscurridos}`);
}

// Función para calcular las bandas cambiarias (piso baja 1%, techo sube 1% por mes desde abril 2025)
function calcularBandasCambiarias() {
    const fechaBase = new Date('2025-04-01'); // Abril 2025
    const fechaActual = new Date();
    
    // Calcular meses transcurridos desde abril 2025
    const mesesTranscurridos = (fechaActual.getFullYear() - fechaBase.getFullYear()) * 12 + 
                               (fechaActual.getMonth() - fechaBase.getMonth());
    
    // El piso baja 1% por mes
    const factorReduccionPiso = Math.pow(0.99, Math.max(0, mesesTranscurridos));
    const pisoCalculado = Math.round(CONFIG.tiposCambio.piso * factorReduccionPiso);
    
    // El techo sube 1% por mes
    const factorIncrementoTecho = Math.pow(1.01, Math.max(0, mesesTranscurridos));
    const techoCalculado = Math.round(CONFIG.tiposCambio.techo * factorIncrementoTecho);
    
    return {
        piso: pisoCalculado,
        techo: techoCalculado,
        mesesTranscurridos: Math.max(0, mesesTranscurridos),
        fechaBase: fechaBase.toLocaleDateString('es-AR'),
        fechaActual: fechaActual.toLocaleDateString('es-AR')
    };
}

// Función legacy para mantener compatibilidad
function calcularPisoBandaCambiaria() {
    const bandas = calcularBandasCambiarias();
    return {
        piso: bandas.piso,
        mesesTranscurridos: bandas.mesesTranscurridos,
        fechaBase: bandas.fechaBase,
        fechaActual: bandas.fechaActual
    };
}



// Función para validar el tipo de cambio contra las bandas cambiarias
function validarTipoCambioConBandas(valorTC) {
    const bandasInfo = calcularBandasCambiarias();
    const piso = bandasInfo.piso;
    const techo = bandasInfo.techo;
    const oficial = CONFIG.tiposCambio.oficial;
    
    // Limpiar consejos previos sobre bandas
    const tipsContainer = document.getElementById('tipsDinamicos');
    if (tipsContainer) {
        const bandaTips = tipsContainer.querySelectorAll('[data-tipo="banda-tc"]');
        bandaTips.forEach(tip => tip.remove());
    }
    
    let mensaje = '';
    let tipo = 'info';
    
    if (valorTC > techo) {
        mensaje = `⚠️ Tipo de cambio por encima del techo de banda (${formatearPesos(techo)}). Esto podría indicar una devaluación fuerte.`;
        tipo = 'warning';
    } else if (valorTC < piso) {
        mensaje = `📉 Tipo de cambio por debajo del piso de banda (${formatearPesos(piso)}). Escenario poco probable según las bandas actuales.`;
        tipo = 'info';
    } else if (Math.abs(valorTC - oficial) / oficial > 0.05) {
        // Si está dentro de la banda pero lejos del oficial (más de 5%)
        const diferencia = ((valorTC - oficial) / oficial * 100).toFixed(1);
        const signo = valorTC > oficial ? '+' : '';
        mensaje = `💱 Simulando ${signo}${diferencia}% respecto al oficial. Dentro de la banda pero considerar el riesgo cambiario.`;
        tipo = 'info';
    }
    
    if (mensaje && tipsContainer) {
        const tipBanda = document.createElement('div');
        tipBanda.className = `tip-card ${tipo}`;
        tipBanda.setAttribute('data-tipo', 'banda-tc');
        tipBanda.innerHTML = `
            <span class="tip-icon">${tipo === 'warning' ? '⚠️' : '💡'}</span>
            <div class="tip-content">${mensaje}</div>
        `;
        
        // Insertar al principio para que sea visible
        tipsContainer.insertBefore(tipBanda, tipsContainer.firstChild);
        
        // Auto-remover después de 8 segundos
        setTimeout(() => {
            if (tipBanda.parentNode) {
                tipBanda.remove();
            }
        }, 8000);
    }
}

// Helpers de formato con prefijo de moneda sin símbolo $
function formatearNumeroPlano(valor) {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor || 0);
}

function lineaARS(valor, bold = false) {
    const texto = `ARS ${formatearNumeroPlano(valor)}`;
    return bold ? `<strong>${texto}</strong>` : texto;
}

function lineaUSD(valor, bold = false) {
    const texto = `USD ${formatearNumeroPlano(valor)}`;
    return bold ? `<strong>${texto}</strong>` : texto;
}

function setLineaMoneda(id, currency, valor, bold = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (currency === 'ARS') {
        el.innerHTML = lineaARS(valor, bold);
    } else {
        el.innerHTML = lineaUSD(valor, bold);
    }
}

// Función para actualizar el checklist de preparación
function actualizarChecklist(datos, resultados) {
    if (!validarDatos(datos)) return;
    
    const checklistItems = [
        { id: 'check1', condition: () => {
            const cuota = resultados.primeraCuota;
            const ingresoRecomendado = cuota / 0.25;
            return ingresoRecomendado <= 1000000; // Si requiere menos de $1M de ingreso
        }},
        { id: 'check2', condition: () => {
            return datos.valorPropiedad > 0 && datos.montoPrestamo > 0;
        }},
        { id: 'check3', condition: () => {
            const bandasInfo = calcularBandasCambiarias();
            const valorCasaPesos = datos.valorPropiedad * bandasInfo.techo;
            const diferenciaACubrir = valorCasaPesos - datos.montoPrestamo;
            const gastosTecho = calcularGastosExtraEnPeorEscenario(datos.valorPropiedad);
            const totalNecesario = diferenciaACubrir + gastosTecho.total;
            const margenSeguridad = totalNecesario * 0.20;
            return margenSeguridad > 0;
        }},
        { id: 'check4', condition: () => {
            const cuota = resultados.primeraCuota;
            const reservaEmergencia = cuota * 6;
            return reservaEmergencia > 0;
        }},
        { id: 'check5', condition: () => {
            const bandasInfo = calcularBandasCambiarias();
            const diferenciaTC = bandasInfo.techo - bandasInfo.piso;
            const porcentajeDiferencia = (diferenciaTC / CONFIG.tiposCambio.oficial * 100);
            return porcentajeDiferencia > 20; // Si hay más de 20% de variación
        }}
    ];
    
    checklistItems.forEach(item => {
        const checkbox = document.getElementById(item.id);
        if (checkbox) {
            const isChecked = item.condition();
            checkbox.checked = isChecked;
            
            // Agregar clase visual según el estado
            const checklistItem = checkbox.closest('.checklist-item');
            if (checklistItem) {
                checklistItem.classList.toggle('completed', isChecked);
                if (isChecked) {
                    checklistItem.style.borderLeftColor = '#22c55e';
                    checklistItem.style.background = 'rgba(34, 197, 94, 0.1)';
                } else {
                    checklistItem.style.borderLeftColor = '#22c55e';
                    checklistItem.style.background = 'rgba(15, 23, 42, 0.6)';
                }
            }
        }
    });
}

// Función para manejar el toggle de las FAQ
function toggleFAQ(element) {
    const faqItem = element.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const toggle = element.querySelector('.faq-toggle');
    
    // Toggle de la respuesta
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        toggle.textContent = '+';
        faqItem.classList.remove('active');
    } else {
        answer.style.display = 'block';
        toggle.textContent = '−';
        faqItem.classList.add('active');
    }
}

// Inicializar FAQ al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar todas las respuestas por defecto
    const faqAnswers = document.querySelectorAll('.faq-answer');
    faqAnswers.forEach(answer => {
        answer.style.display = 'none';
    });
});