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
        peorCaso: 1400,    // Dólar alto (techo de banda) - FIJO
        mejorCaso: 1200    // Dólar bajo (piso de banda) - FIJO
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
    gastosExtra: document.getElementById('gastosExtra'),
    cuotaPromedio: document.getElementById('cuotaPromedio'),
    
    // Simulador
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
        
        // Calcular inicialmente
        calcularTodo();
        
        // Mostrar impacto inicial del simulador
        mostrarImpactoSimulador();
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
    CONFIG.tiposCambio.peorCaso = Math.round(valor * 1.15); // 15% más
    CONFIG.tiposCambio.mejorCaso = Math.round(valor * 0.95); // 5% menos
    
    console.log(`Cotización obtenida de ${fuente}: $${valor}`);
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
    elementos.valorPropiedad.value = 45000; // USD 45,000
    // USD 32,000 convertido a pesos según cotización oficial (se actualiza automáticamente)
    const montoPrestamoPesos = 32000 * CONFIG.tiposCambio.oficial;
    elementos.montoPrestamo.value = montoPrestamoPesos;
    elementos.tasaInteres.value = 8.5;
    elementos.plazo.value = 20;
}

function agregarEventListeners() {
    // Recalcular cuando cambien los inputs (excepto el slider de tipo de cambio)
    Object.values(elementos).forEach(elemento => {
        if (elemento && elemento.tagName === 'INPUT' && elemento.id !== 'tcSlider') {
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
                    if (window.calculadoraAnalytics) {
                        window.calculadoraAnalytics.trackProvinceChange(this.value, previousProvincia);
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
    
    // Siempre intentar calcular, incluso con datos incompletos
    if (validarDatos(datos)) {
        const resultados = calcularCredito(datos);
        mostrarResultados(resultados);
        mostrarTipsDinamicos(resultados);
        
        // Validación progresiva y consejos contextuales
        mostrarValidacionProgresiva(datos, resultados);
        
        // Analytics: Rastrear cálculo completado
        if (window.calculadoraAnalytics) {
            window.calculadoraAnalytics.trackCalculation({
                ...datos,
                primeraCuota: resultados.primeraCuota,
                gastosExtra: resultados.gastosExtra.total
            });
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
        
        // Mostrar en lugar de los resultados principales
        const elemento = document.getElementById('primeraCuota');
        if (elemento) {
            elemento.textContent = '—';
            elemento.title = mensaje;
        }
    }
}

function limpiarResultados() {
    elementos.primeraCuota.textContent = '$0';
    document.getElementById('primeraCuotaUSD').textContent = '$0 USD';
    
    elementos.totalPagar.textContent = '$0';
    document.getElementById('totalPagarUSD').textContent = '$0 USD';
    
    // Limpiar desglose de gastos
    document.getElementById('gastoEscritura').textContent = '$0';
    document.getElementById('gastoInmobiliaria').textContent = '$0';
    document.getElementById('gastoFirmas').textContent = '$0';
    document.getElementById('gastoSellos').textContent = '$0';
    elementos.gastosExtra.innerHTML = '<strong>$0</strong>';
    document.getElementById('gastosExtraUSD').textContent = '$0 USD';
    
    if (elementos.diferenciaSimulador) {
        elementos.diferenciaSimulador.textContent = '$0';
    }
    if (elementos.diferenciaSimuladorUSD) {
        elementos.diferenciaSimuladorUSD.textContent = '$0 USD';
    }
    if (elementos.tcSimuladorTexto) {
        elementos.tcSimuladorTexto.textContent = '1225';
    }
    
    // Limpiar elementos del banco
    const elementoPrestamoSimuladorPesos = document.getElementById('prestamoSimuladorPesos');
    const elementoPrestamoSimuladorUSD = document.getElementById('prestamoSimuladorUSD');
    if (elementoPrestamoSimuladorPesos) {
        elementoPrestamoSimuladorPesos.textContent = '$0';
    }
    if (elementoPrestamoSimuladorUSD) {
        elementoPrestamoSimuladorUSD.textContent = '$0 USD';
    }
}

function obtenerDatosEntrada() {
    return {
        valorPropiedad: parseFloat(elementos.valorPropiedad.value) || 0,
        provincia: elementos.provincia.value,
        montoPrestamo: parseFloat(elementos.montoPrestamo.value) || 0,
        plazo: parseInt(elementos.plazo.value) || 20,
        tasaInteres: parseFloat(elementos.tasaInteres.value) || 0
    };
}

function validarDatos(datos) {
    // Validación básica solo para cálculos, sin interrupciones al usuario
    const isValidValue = datos.valorPropiedad > 0;
    const isValidLoan = datos.montoPrestamo > 0;
    const isValidRate = datos.tasaInteres > 0;
    const isValidTerm = datos.plazo > 0;
    
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
    elementos.primeraCuota.textContent = formatearPesos(resultados.primeraCuota);
    const primeraCuotaUSD = resultados.primeraCuota / CONFIG.tiposCambio.oficial;
    document.getElementById('primeraCuotaUSD').textContent = `$${formatearNumero(primeraCuotaUSD)} USD`;
    
    // Total a pagar en ambas monedas
    elementos.totalPagar.textContent = formatearPesos(resultados.totalPagar);
    const totalPagarUSD = resultados.totalPagar / CONFIG.tiposCambio.oficial;
    document.getElementById('totalPagarUSD').textContent = `$${formatearNumero(totalPagarUSD)} USD`;
    
    // Mostrar desglose de gastos con valores intermedios
    if (resultados.gastosExtra && typeof resultados.gastosExtra === 'object') {
        const gastos = resultados.gastosExtra;
        
        // Mostrar gastos intermedios
        document.getElementById('gastoEscritura').textContent = formatearPesos(gastos.escritura);
        document.getElementById('gastoInmobiliaria').textContent = formatearPesos(gastos.inmobiliaria);
        document.getElementById('gastoFirmas').textContent = formatearPesos(gastos.firmas);
        document.getElementById('gastoSellos').textContent = formatearPesos(gastos.sellos);
        
        // Total gastos en ambas monedas
        const totalUSD = gastos.total / CONFIG.tiposCambio.oficial;
        
        elementos.gastosExtra.innerHTML = `<strong>${formatearPesos(gastos.total)}</strong>`;
        document.getElementById('gastosExtraUSD').textContent = `$${formatearNumero(totalUSD)} USD`;
    }
}



// Nueva función para mostrar el impacto del simulador
function mostrarImpactoSimulador() {
    const datos = obtenerDatosEntrada();
    if (!validarDatos(datos)) {
        console.log('mostrarImpactoSimulador: datos no válidos', datos);
        return;
    }
    
    console.log('mostrarImpactoSimulador ejecutándose con TC:', CONFIG.tiposCambio.simulador);
    
    // Calcular valor de la propiedad con el tipo de cambio del simulador
    const valorPropiedadConSimulador = datos.valorPropiedad * CONFIG.tiposCambio.simulador;
    
    // El monto en pesos que da el banco es siempre fijo (el monto que pediste prestado)
    // Solo varía el equivalente en USD según el tipo de cambio del simulador
    const montoPrestamoPesos = datos.montoPrestamo; // Pesos fijo (monto que pediste)
    const montoPrestamoUSD = datos.montoPrestamo / CONFIG.tiposCambio.simulador; // USD varía con el TC
    
    // Diferencia a cubrir = valor total de la propiedad - monto prestado
    const diferenciaACubrir = valorPropiedadConSimulador - montoPrestamoPesos;
    
    // Mostrar lo que da el banco
    const elementoPrestamoSimuladorPesos = document.getElementById('prestamoSimuladorPesos');
    const elementoPrestamoSimuladorUSD = document.getElementById('prestamoSimuladorUSD');
    
    if (elementoPrestamoSimuladorPesos) {
        elementoPrestamoSimuladorPesos.textContent = formatearPesos(montoPrestamoPesos);
    }
    
    if (elementoPrestamoSimuladorUSD) {
        elementoPrestamoSimuladorUSD.textContent = `$${formatearNumero(montoPrestamoUSD)} USD`;
    }
    
    // Mostrar lo que tienes que poner
    if (elementos.diferenciaSimulador) {
        elementos.diferenciaSimulador.textContent = formatearPesos(diferenciaACubrir);
        console.log('Actualizado diferenciaSimulador:', formatearPesos(diferenciaACubrir));
    } else {
        console.log('ERROR: elemento diferenciaSimulador no encontrado');
    }
    
    if (elementos.diferenciaSimuladorUSD) {
        const diferenciaUSD = diferenciaACubrir / CONFIG.tiposCambio.simulador;
        elementos.diferenciaSimuladorUSD.textContent = `$${formatearNumero(diferenciaUSD)} USD`;
        console.log('Actualizado diferenciaSimuladorUSD:', `$${formatearNumero(diferenciaUSD)} USD`);
    } else {
        console.log('ERROR: elemento diferenciaSimuladorUSD no encontrado');
    }
    
    if (elementos.tcSimuladorTexto) {
        elementos.tcSimuladorTexto.textContent = CONFIG.tiposCambio.simulador;
    }
    
    // Calcular diferencia de tipo de cambio respecto al oficial
    const diferenciaTc = CONFIG.tiposCambio.simulador - CONFIG.tiposCambio.oficial;
    const porcentajeDiferencia = (diferenciaTc / CONFIG.tiposCambio.oficial * 100).toFixed(1);
    
    // Actualizar título del slider para mostrar la diferencia
    const tcLabel = document.querySelector('.tc-slider-container label');
    if (tcLabel) {
        let textoTc = `Tipo de cambio: $${CONFIG.tiposCambio.simulador}`;
        if (diferenciaTc !== 0) {
            const signo = diferenciaTc > 0 ? '+' : '';
            textoTc += ` (${signo}${porcentajeDiferencia}% vs oficial)`;
        }
        tcLabel.innerHTML = textoTc;
    }
}

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
    elementoEquivalencia.textContent = `$${formatearNumero(equivalenciaUSD)} USD`;
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
                
                // Mostrar el impacto de este tipo de cambio
                mostrarImpactoSimulador();
                
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
                mostrarImpactoSimulador();
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
                    nuevoValor = CONFIG.tiposCambio.mejorCaso;
                    break;
                case 'techo':
                    nuevoValor = CONFIG.tiposCambio.peorCaso;
                    break;
                default:
                    nuevoValor = CONFIG.tiposCambio.oficial;
            }
            
            tcInput.value = nuevoValor;
            CONFIG.tiposCambio.simulador = nuevoValor;
            
            // Analytics: Rastrear uso de sugerencia
            if (window.calculadoraAnalytics) {
                window.calculadoraAnalytics.trackCurrencyScenario(nuevoValor, `suggestion_${tipo}`);
            }
            
            mostrarImpactoSimulador();
            actualizarEstadoSugerencias();
            
            // Validar valor con bandas
            validarTipoCambioConBandas(nuevoValor);
        });
    });
    
    // Actualizar valores de las bandas en la interfaz
    actualizarBandasEnInterfaz();
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
                
                // Recalcular con delay para mejor performance
                clearTimeout(this.gastoTimeout);
                this.gastoTimeout = setTimeout(() => {
                    calcularTodo();
                }, 300);
            });
            
            // Evento para cambios finales (blur)
            input.addEventListener('blur', function() {
                const nuevoValor = parseFloat(this.value) || 0;
                
                // Analytics: Rastrear cambio de gasto
                if (window.calculadoraAnalytics) {
                    window.calculadoraAnalytics.trackSliderChange(`gasto_${tipo}`, nuevoValor, 0);
                }
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

// Mostrar tips dinámicos
function mostrarTipsDinamicos(resultados) {
    const tipsContainer = document.getElementById('tipsDinamicos');
    if (!tipsContainer) return;
    
    // Limpiar tips anteriores
    tipsContainer.innerHTML = '';
    
    // 1. Tip sobre cuota recomendada (25% de ingresos)
    const cuota = resultados.primeraCuota;
    const ingresoRecomendado = cuota / 0.25; // 25% del ingreso
    
    const tipCuota = document.createElement('div');
    tipCuota.className = 'tip-card info';
    tipCuota.innerHTML = `
        <span class="tip-icon">💡</span>
        <div class="tip-content">
            <strong>Ingreso recomendado:</strong> Para esta cuota de ${formatearPesos(cuota)}, 
            tu ingreso mensual debería ser al menos ${formatearPesos(ingresoRecomendado)} (25% de tus ingresos)
        </div>
    `;
    tipsContainer.appendChild(tipCuota);
    
    // Analytics: Rastrear visualización de tip de ingreso recomendado
    if (window.calculadoraAnalytics) {
        window.calculadoraAnalytics.trackTipsViewed('ingreso_recomendado', tipCuota.innerHTML);
    }
    
    // 2. Ancho de banda cambiaria
    const anchoBanda = CONFIG.tiposCambio.peorCaso - CONFIG.tiposCambio.mejorCaso;
    const porcentajeAncho = ((anchoBanda / CONFIG.tiposCambio.oficial) * 100).toFixed(1);
    
    const tipBanda = document.createElement('div');
    tipBanda.className = 'tip-card warning';
    tipBanda.innerHTML = `
        <span class="tip-icon">📊</span>
        <div class="tip-content">
            <strong>Ancho de banda cambiaria:</strong> Entre ${formatearPesos(CONFIG.tiposCambio.mejorCaso)} y ${formatearPesos(CONFIG.tiposCambio.peorCaso)} 
            (diferencia: ${formatearPesos(anchoBanda)} - ${porcentajeAncho}% de variación)
        </div>
    `;
    tipsContainer.appendChild(tipBanda);
    
    // 3. Colchón de seguridad en el peor escenario
    const datos = obtenerDatosEntrada();
    if (validarDatos(datos)) {
        const valorPropiedadPeorCaso = datos.valorPropiedad * CONFIG.tiposCambio.peorCaso;
        const diferenciaACubrirPeorCaso = valorPropiedadPeorCaso - datos.montoPrestamo;
        const gastosPeorCaso = calcularGastosExtraEnPeorEscenario(datos.valorPropiedad);
        const totalNecesarioPeorCaso = diferenciaACubrirPeorCaso + gastosPeorCaso;
        
        const tipColchonPeorCaso = document.createElement('div');
        tipColchonPeorCaso.className = 'tip-card danger';
        tipColchonPeorCaso.innerHTML = `
            <span class="tip-icon">🚨</span>
            <div class="tip-content">
                <strong>Colchón en el peor escenario:</strong> Con el dólar a ${formatearPesos(CONFIG.tiposCambio.peorCaso)}, 
                necesitarías ${formatearPesos(totalNecesarioPeorCaso)} (incluye gastos máximos)
            </div>
        `;
        tipsContainer.appendChild(tipColchonPeorCaso);
        
        // 4. Margen de seguridad recomendado (20% extra sobre lo necesario)
        const margenSeguridad = totalNecesarioPeorCaso * 0.20;
        const totalConMargen = totalNecesarioPeorCaso + margenSeguridad;
        const margenSeguridadUSD = margenSeguridad / CONFIG.tiposCambio.oficial;
        const totalConMargenUSD = totalConMargen / CONFIG.tiposCambio.oficial;
        
        const tipMargenSeguridad = document.createElement('div');
        tipMargenSeguridad.className = 'tip-card info';
        tipMargenSeguridad.innerHTML = `
            <span class="tip-icon">🛡️</span>
            <div class="tip-content">
                <strong>Margen de seguridad recomendado:</strong> Agregá 20% extra = ${formatearPesos(margenSeguridad)} 
                ($${formatearNumero(margenSeguridadUSD)} USD). 
                Total con margen: ${formatearPesos(totalConMargen)} ($${formatearNumero(totalConMargenUSD)} USD)
            </div>
        `;
        tipsContainer.appendChild(tipMargenSeguridad);
        
        // 5. Colchón de ahorro extra para imprevistos
        const colchonAhorroExtra = cuota * 6; // 6 meses de cuotas
        const colchonAhorroExtraUSD = colchonAhorroExtra / CONFIG.tiposCambio.oficial;
        
        // 6. Consejo unificado de ahorro total sugerido
        const ahorroTotalSugerido = totalConMargen + colchonAhorroExtra;
        const ahorroTotalSugeridoUSD = ahorroTotalSugerido / CONFIG.tiposCambio.oficial;
        
        const tipAhorroTotal = document.createElement('div');
        tipAhorroTotal.className = 'tip-card success highlight';
        tipAhorroTotal.innerHTML = `
            <span class="tip-icon">💎</span>
            <div class="tip-content">
                <strong>💰 Ahorro total sugerido:</strong> Deberías tener ${formatearPesos(ahorroTotalSugerido)} 
                ($${formatearNumero(ahorroTotalSugeridoUSD)} USD) que incluye:
                <br>• Dinero para la compra con margen: ${formatearPesos(totalConMargen)} ($${formatearNumero(totalConMargenUSD)} USD)
                <br>• Reserva de emergencia (6 meses): ${formatearPesos(colchonAhorroExtra)} ($${formatearNumero(colchonAhorroExtraUSD)} USD)
            </div>
        `;
        tipsContainer.appendChild(tipAhorroTotal);
        
        // Analytics: Rastrear visualización completa de todos los tips
        if (window.calculadoraAnalytics) {
            window.calculadoraAnalytics.trackTipsViewed('tips_completos', `Tips generados para cuota: ${formatearPesos(cuota)}`);
        }
    }
}

// Nueva función para calcular gastos extra en el peor escenario
function calcularGastosExtraEnPeorEscenario(valorPropiedadUSD) {
    const valorPesosPeorCaso = valorPropiedadUSD * CONFIG.tiposCambio.peorCaso;
    const provincia = elementos.provincia.value;
    const gastos = CONFIG.gastosExtra[provincia];
    
    // Usar valores máximos para el peor escenario
    const escrituraMax = valorPesosPeorCaso * gastos.escritura.max / 100;
    const inmobiliariaMax = valorPesosPeorCaso * gastos.inmobiliaria.max / 100;
    const firmasMax = valorPesosPeorCaso * gastos.firmas.max / 100;
    const sellosMax = valorPesosPeorCaso * gastos.sellos.max / 100;
    
    return escrituraMax + inmobiliariaMax + firmasMax + sellosMax;
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
                valorComparar = CONFIG.tiposCambio.mejorCaso;
                break;
            case 'techo':
                valorComparar = CONFIG.tiposCambio.peorCaso;
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
        techo: document.getElementById('tcTecho'),
        bandasCalculadas: document.getElementById('bandasCalculadas')
    };
    
    if (elementos.oficial) {
        elementos.oficial.textContent = formatearPesos(CONFIG.tiposCambio.oficial);
    }
    
    if (elementos.piso) {
        elementos.piso.textContent = formatearPesos(CONFIG.tiposCambio.mejorCaso);
    }
    
    if (elementos.techo) {
        elementos.techo.textContent = formatearPesos(CONFIG.tiposCambio.peorCaso);
    }
    
    // Calcular información dinámica para mostrar al usuario
    if (elementos.bandasCalculadas) {
        const bandasInfo = calcularBandasDinamicas();
        const fechaActual = new Date().toLocaleDateString('es-AR');
        
        if (bandasInfo.mesesTranscurridos > 0) {
            elementos.bandasCalculadas.textContent = `Calculadas para ${fechaActual} (${bandasInfo.mesesTranscurridos.toFixed(1)} meses desde abr/25)`;
        } else {
            elementos.bandasCalculadas.textContent = `Calculadas automáticamente para ${fechaActual}`;
        }
    }
}

// Función para validar el tipo de cambio contra las bandas cambiarias
function validarTipoCambioConBandas(valorTC) {
    const piso = CONFIG.tiposCambio.mejorCaso;
    const techo = CONFIG.tiposCambio.peorCaso;
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


