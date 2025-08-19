// Configuración de la calculadora
const CONFIG = {
    // Gastos extra por provincia (en % del valor de la propiedad)
    gastosExtra: {
        'CABA': {
            escritura: { min: 2.0, max: 2.5, actual: 2.5 },        // 2.0-2.5% del valor
            inmobiliaria: { min: 2.5, max: 3.5, actual: 3.0 },     // 2.5-3.5% del valor
            firmas: { min: 0.5, max: 1.0, actual: 0.5 },           // 0.5-1.0% del valor
            sellos: { min: 1.0, max: 1.5, actual: 1.5 }            // 1.0-1.5% del valor
        },
        'BSAS': {
            escritura: { min: 2.0, max: 2.5, actual: 2.0 },        // 2.0-2.5% del valor
            inmobiliaria: { min: 2.5, max: 3.5, actual: 3.0 },     // 2.5-3.5% del valor
            firmas: { min: 0.5, max: 1.0, actual: 0.5 },           // 0.5-1.0% del valor
            sellos: { min: 1.0, max: 1.5, actual: 1.0 }            // 1.0-1.5% del valor
        }
    },
    
    // Tipos de cambio para escenarios (se actualizarán con la cotización oficial)
    tiposCambio: {
        oficial: 1225,     // Dólar oficial (se actualiza automáticamente)
        simulador: 1225,   // Dólar del simulador (controlado por el slider)
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
        

        
        // Calcular inicialmente
        calcularTodo();
        
        // Mostrar impacto inicial del simulador
        mostrarImpactoSimulador();
    });
});

async function obtenerCotizacionOficial() {
    try {
        // Intentar obtener la cotización del BCRA o API pública
        const response = await fetch('https://api-dolar-argentina.herokuapp.com/api/dolares/oficial');
        const data = await response.json();
        
        if (data && data.venta) {
            CONFIG.tiposCambio.oficial = parseFloat(data.venta);
            CONFIG.tiposCambio.simulador = CONFIG.tiposCambio.oficial;
            CONFIG.tiposCambio.peorCaso = Math.round(CONFIG.tiposCambio.oficial * 1.15); // 15% más
            CONFIG.tiposCambio.mejorCaso = Math.round(CONFIG.tiposCambio.oficial * 0.95); // 5% menos
            
            // Actualizar la interfaz con la cotización actual
            actualizarCotizacionEnInterfaz();
        }
    } catch (error) {
        console.log('No se pudo obtener la cotización oficial, usando valor por defecto');
        // Si falla, usar valores por defecto
        CONFIG.tiposCambio.oficial = 1225;
        CONFIG.tiposCambio.simulador = 1225;
        CONFIG.tiposCambio.peorCaso = 1400;
        CONFIG.tiposCambio.mejorCaso = 1200;
        
        // Actualizar la interfaz con la cotización por defecto
        actualizarCotizacionEnInterfaz();
    }
}

function establecerValoresPorDefecto() {
    elementos.valorPropiedad.value = 90000;
    elementos.montoPrestamo.value = 89250000; // 89.250.000 pesos por defecto (aprox 70k USD)
    elementos.tasaInteres.value = 8.5;
    elementos.plazo.value = 20;
}

function agregarEventListeners() {
    // Recalcular cuando cambien los inputs (excepto el slider de tipo de cambio)
    Object.values(elementos).forEach(elemento => {
        if (elemento && elemento.tagName === 'INPUT' && elemento.id !== 'tcSlider') {
            elemento.addEventListener('input', calcularTodo);
        }
        if (elemento && elemento.tagName === 'SELECT') {
            elemento.addEventListener('change', calcularTodo);
        }
    });
    
    // Configurar sliders
    configurarSliders();
    
    // Configurar slider de tipo de cambio
    configurarSliderTC();
}

function calcularTodo() {
    const datos = obtenerDatosEntrada();
    if (!validarDatos(datos)) {
        // Limpiar resultados si los datos no son válidos
        limpiarResultados();
        return;
    }
    
    const resultados = calcularCredito(datos);
    
    mostrarResultados(resultados);
    mostrarTipsDinamicos(resultados);
}

function limpiarResultados() {
    elementos.primeraCuota.textContent = '$0';
    document.getElementById('primeraCuotaUSD').textContent = '$0 USD';
    
    elementos.totalPagar.textContent = '$0';
    document.getElementById('totalPagarUSD').textContent = '$0 USD';
    
    // Limpiar desglose de gastos
    document.getElementById('gastoEscritura').textContent = '$0 - $0';
    document.getElementById('gastoInmobiliaria').textContent = '$0 - $0';
    document.getElementById('gastoFirmas').textContent = '$0 - $0';
    document.getElementById('gastoSellos').textContent = '$0 - $0';
    elementos.gastosExtra.innerHTML = '<strong>$0 - $0</strong>';
    document.getElementById('gastosExtraUSD').textContent = '$0 - $0 USD';
    
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
    if (datos.valorPropiedad <= 0) return false;
    if (datos.montoPrestamo <= 0) return false;
    if (datos.tasaInteres < 4.5 || datos.tasaInteres > 11) return false;
    if (datos.plazo <= 0) return false;
    return true;
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
    
    // Total a pagar (aproximado)
    const totalPagar = cuotaMensual * totalMeses;
    
    // Gastos extra
    const gastosExtra = calcularGastosExtra(datos.valorPropiedad, datos.provincia);
    
    // Cuota promedio considerando UVA
    const cuotaPromedio = calcularCuotaPromedioConUVA(cuotaMensual, totalMeses);
    
    // Actualizar valor en pesos mostrado
    actualizarValorEnPesos(datos.valorPropiedad);
    
    // Actualizar equivalencia del monto prestado
    actualizarEquivalenciaMontoPrestado(datos.montoPrestamo);
    
    return {
        primeraCuota,
        totalPagar,
        gastosExtra,
        cuotaPromedio,
        montoPrestamoPesos,
        cuotaMensual
    };
}

function calcularGastosExtra(valorPropiedad, provincia) {
    const gastos = CONFIG.gastosExtra[provincia];
    const valorPesos = valorPropiedad * CONFIG.tiposCambio.oficial;
    
    // Calcular con valores actuales
    const escritura = valorPesos * gastos.escritura.actual / 100;
    const inmobiliaria = valorPesos * gastos.inmobiliaria.actual / 100;
    const firmas = valorPesos * gastos.firmas.actual / 100;
    const sellos = valorPesos * gastos.sellos.actual / 100;
    
    // Calcular rangos min-max
    const escrituraMin = valorPesos * gastos.escritura.min / 100;
    const escrituraMax = valorPesos * gastos.escritura.max / 100;
    const inmobiliariaMin = valorPesos * gastos.inmobiliaria.min / 100;
    const inmobiliariaMax = valorPesos * gastos.inmobiliaria.max / 100;
    const firmasMin = valorPesos * gastos.firmas.min / 100;
    const firmasMax = valorPesos * gastos.firmas.max / 100;
    const sellosMin = valorPesos * gastos.sellos.min / 100;
    const sellosMax = valorPesos * gastos.sellos.max / 100;
    
    const totalActual = escritura + inmobiliaria + firmas + sellos;
    const totalMin = escrituraMin + inmobiliariaMin + firmasMin + sellosMin;
    const totalMax = escrituraMax + inmobiliariaMax + firmasMax + sellosMax;
    
    return {
        escritura,
        inmobiliaria,
        firmas,
        sellos,
        total: totalActual,
        rangos: {
            escritura: { min: escrituraMin, max: escrituraMax },
            inmobiliaria: { min: inmobiliariaMin, max: inmobiliariaMax },
            firmas: { min: firmasMin, max: firmasMax },
            sellos: { min: sellosMin, max: sellosMax },
            total: { min: totalMin, max: totalMax }
        }
    };
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
    
    // Mostrar desglose de gastos con rangos
    if (resultados.gastosExtra && typeof resultados.gastosExtra === 'object') {
        const gastos = resultados.gastosExtra;
        const rangos = gastos.rangos;
        
        // Mostrar gastos con rangos min-max
        document.getElementById('gastoEscritura').textContent = 
            `${formatearPesos(rangos.escritura.min)} - ${formatearPesos(rangos.escritura.max)}`;
        document.getElementById('gastoInmobiliaria').textContent = 
            `${formatearPesos(rangos.inmobiliaria.min)} - ${formatearPesos(rangos.inmobiliaria.max)}`;
        document.getElementById('gastoFirmas').textContent = 
            `${formatearPesos(rangos.firmas.min)} - ${formatearPesos(rangos.firmas.max)}`;
        document.getElementById('gastoSellos').textContent = 
            `${formatearPesos(rangos.sellos.min)} - ${formatearPesos(rangos.sellos.max)}`;
        
        // Total gastos con rango en ambas monedas
        const totalMinUSD = rangos.total.min / CONFIG.tiposCambio.oficial;
        const totalMaxUSD = rangos.total.max / CONFIG.tiposCambio.oficial;
        
        elementos.gastosExtra.innerHTML = 
            `<strong>${formatearPesos(rangos.total.min)} - ${formatearPesos(rangos.total.max)}</strong>`;
        document.getElementById('gastosExtraUSD').textContent = 
            `$${formatearNumero(totalMinUSD)} - $${formatearNumero(totalMaxUSD)} USD`;
    }
}



// Nueva función para mostrar el impacto del simulador
function mostrarImpactoSimulador() {
    const datos = obtenerDatosEntrada();
    if (!validarDatos(datos)) return;
    
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
    }
    
    if (elementos.diferenciaSimuladorUSD) {
        const diferenciaUSD = diferenciaACubrir / CONFIG.tiposCambio.simulador;
        elementos.diferenciaSimuladorUSD.textContent = `$${formatearNumero(diferenciaUSD)} USD`;
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

function actualizarCotizacionEnInterfaz() {
    const elementoCotizacion = document.getElementById('cotizacionActual');
    const fechaCotizacion = document.getElementById('fechaCotizacion');
    
    if (elementoCotizacion) {
        elementoCotizacion.textContent = formatearPesos(CONFIG.tiposCambio.oficial);
    }
    
    if (fechaCotizacion) {
        const ahora = new Date();
        fechaCotizacion.textContent = `Actualizado: ${ahora.toLocaleTimeString('es-AR')}`;
    }
}



// Configurar sliders
function configurarSliders() {
    const plazoSlider = document.getElementById('plazo');
    const plazoValor = document.getElementById('plazoValor');
    const tasaSlider = document.getElementById('tasaInteres');
    const tasaValor = document.getElementById('tasaValor');
    
    if (plazoSlider && plazoValor) {
        plazoSlider.addEventListener('input', function() {
            plazoValor.textContent = this.value;
            calcularTodo();
        });
    }
    
    if (tasaSlider && tasaValor) {
        tasaSlider.addEventListener('input', function() {
            tasaValor.textContent = this.value;
            calcularTodo();
        });
    }
}

// Configurar slider de tipo de cambio
function configurarSliderTC() {
    const tcSlider = document.getElementById('tcSlider');
    const tcValor = document.getElementById('tcValor');
    
    if (tcSlider && tcValor) {
        // Inicializar slider con el valor oficial
        tcSlider.value = CONFIG.tiposCambio.oficial;
        tcValor.textContent = CONFIG.tiposCambio.oficial;
        
        tcSlider.addEventListener('input', function() {
            const nuevoTC = parseInt(this.value);
            tcValor.textContent = nuevoTC;
            
            // Solo actualizar el simulador, no el oficial
            CONFIG.tiposCambio.simulador = nuevoTC;
            
            // Mostrar el impacto de este tipo de cambio
            mostrarImpactoSimulador();
        });
    }
}

// Mostrar tips dinámicos
function mostrarTipsDinamicos(resultados) {
    const tipsContainer = document.getElementById('tipsDinamicos');
    if (!tipsContainer) return;
    
    // Limpiar tips anteriores
    tipsContainer.innerHTML = '';
    
    // Tip sobre cuota recomendada
    const cuota = resultados.primeraCuota;
    const ingresoRecomendado = cuota / 0.4; // 40% del ingreso
    
    const tipCuota = document.createElement('div');
    tipCuota.className = 'tip-card info';
    tipCuota.innerHTML = `
        <span class="tip-icon">💡</span>
        <div class="tip-content">
            <strong>Ingreso recomendado:</strong> Para esta cuota de ${formatearPesos(cuota)}, 
            tu ingreso mensual debería ser al menos ${formatearPesos(ingresoRecomendado)}
        </div>
    `;
    
    tipsContainer.appendChild(tipCuota);
}



// Función para mostrar alertas de validación
function mostrarAlerta(mensaje, tipo = 'info') {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta alerta-${tipo}`;
    alerta.textContent = mensaje;
    
    // Insertar después del header
    const header = document.querySelector('header');
    header.parentNode.insertBefore(alerta, header.nextSibling);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        alerta.remove();
    }, 5000);
}

// Validación en tiempo real
function validarEnTiempoReal() {
    const datos = obtenerDatosEntrada();
    
    // Convertir valor de propiedad a pesos para comparar
    const valorPropiedadPesos = datos.valorPropiedad * CONFIG.tiposCambio.oficial;
    
    // El monto prestado ya está en pesos
    const montoPrestamoPesos = datos.montoPrestamo;
    
    if (montoPrestamoPesos > valorPropiedadPesos) {
        mostrarAlerta('⚠️ El monto del préstamo no puede ser mayor al valor de la propiedad', 'warning');
    }
    
    if (montoPrestamoPesos > valorPropiedadPesos * 0.9) {
        mostrarAlerta('⚠️ Considerá que necesitarás al menos 10% para gastos extra', 'warning');
    }
    
    // Validar plazo
    if (datos.plazo < 5 || datos.plazo > 35) {
        mostrarAlerta('⚠️ El plazo debe estar entre 5 y 35 años', 'warning');
    }
    
    // Validar tasa
    if (datos.tasaInteres < 4.5 || datos.tasaInteres > 11) {
        mostrarAlerta('⚠️ La tasa debe estar entre 4.5% y 11%', 'warning');
    }
}

// Agregar validación en tiempo real
Object.values(elementos).forEach(elemento => {
    if (elemento && elemento.tagName === 'INPUT') {
        elemento.addEventListener('input', validarEnTiempoReal);
    }
});


