// Configuración de la calculadora
const CONFIG = {
    // Gastos extra por provincia (en % del valor de la propiedad)
    gastosExtra: {
        'CABA': {
            escritura: 2.5,        // 2.5% del valor
            inmobiliaria: 3.0,     // 3% del valor
            firmas: 0.5,           // 0.5% del valor
            sellos: 1.5            // 1.5% del valor
        },
        'BSAS': {
            escritura: 2.0,        // 2% del valor
            inmobiliaria: 3.0,     // 3% del valor
            firmas: 0.5,           // 0.5% del valor
            sellos: 1.0            // 1% del valor
        }
    },
    
    // Tipos de cambio para escenarios (se actualizarán con la cotización oficial)
    tiposCambio: {
        actual: 1225,      // Dólar actual (se actualiza automáticamente)
        peorCaso: 1400,   // Dólar alto (techo de banda)
        mejorCaso: 1200    // Dólar bajo (piso de banda)
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
    monedaPrestamo: document.getElementById('monedaPrestamo'),
    plazo: document.getElementById('plazo'),
    tasaInteres: document.getElementById('tasaInteres'),
    
    // Resultados
    primeraCuota: document.getElementById('primeraCuota'),
    totalPagar: document.getElementById('totalPagar'),
    gastosExtra: document.getElementById('gastosExtra'),
    cuotaPromedio: document.getElementById('cuotaPromedio'),
    
    // Escenarios
    diferenciaAlta: document.getElementById('diferenciaAlta'),
    cuotaAlta: document.getElementById('cuotaAlta'),
    diferenciaBaja: document.getElementById('diferenciaBaja'),
    cuotaBaja: document.getElementById('cuotaBaja')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Obtener cotización oficial del día
    obtenerCotizacionOficial().then(() => {
        // Establecer valores por defecto
        establecerValoresPorDefecto();
        
        // Agregar event listeners
        agregarEventListeners();
        
        // Configurar toggle de moneda
        configurarToggleMoneda();
        
        // Calcular inicialmente
        calcularTodo();
    });
});

async function obtenerCotizacionOficial() {
    try {
        // Intentar obtener la cotización del BCRA o API pública
        const response = await fetch('https://api-dolar-argentina.herokuapp.com/api/dolares/oficial');
        const data = await response.json();
        
        if (data && data.venta) {
            CONFIG.tiposCambio.actual = parseFloat(data.venta);
            CONFIG.tiposCambio.peorCaso = Math.round(CONFIG.tiposCambio.actual * 1.15); // 15% más
            CONFIG.tiposCambio.mejorCaso = Math.round(CONFIG.tiposCambio.actual * 0.95); // 5% menos
            
            // Actualizar la interfaz con la cotización actual
            actualizarCotizacionEnInterfaz();
        }
    } catch (error) {
        console.log('No se pudo obtener la cotización oficial, usando valor por defecto');
        // Si falla, usar valores por defecto
        CONFIG.tiposCambio.actual = 1225;
        CONFIG.tiposCambio.peorCaso = 1400;
        CONFIG.tiposCambio.mejorCaso = 1200;
        
        // Actualizar la interfaz con la cotización por defecto
        actualizarCotizacionEnInterfaz();
    }
}

function establecerValoresPorDefecto() {
    elementos.valorPropiedad.value = 90000;
    elementos.montoPrestamo.value = 70000; // 70,000 USD por defecto
    elementos.tasaInteres.value = 8.5;
    elementos.plazo.value = 20;
}

function agregarEventListeners() {
    // Recalcular cuando cambien los inputs
    Object.values(elementos).forEach(elemento => {
        if (elemento && elemento.tagName === 'INPUT') {
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
    const escenarios = calcularEscenarios(datos, resultados);
    
    mostrarResultados(resultados);
    mostrarEscenarios(escenarios);
    mostrarTipsDinamicos(resultados);
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
    
    elementos.diferenciaAlta.textContent = '$0';
    elementos.cuotaAlta.textContent = '$0';
    elementos.diferenciaBaja.textContent = '$0';
    elementos.cuotaBaja.textContent = '$0';
}

function obtenerDatosEntrada() {
    return {
        valorPropiedad: parseFloat(elementos.valorPropiedad.value) || 0,
        provincia: elementos.provincia.value,
        montoPrestamo: parseFloat(elementos.montoPrestamo.value) || 0,
        monedaPrestamo: elementos.monedaPrestamo.value,
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
    // Convertir monto a pesos según la moneda seleccionada
    let montoPrestamoPesos;
    if (datos.monedaPrestamo === 'USD') {
        montoPrestamoPesos = datos.montoPrestamo * CONFIG.tiposCambio.actual;
    } else {
        montoPrestamoPesos = datos.montoPrestamo;
    }
    
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
    actualizarEquivalenciaMontoPrestado(datos.montoPrestamo, datos.monedaPrestamo);
    
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
    const valorPesos = valorPropiedad * CONFIG.tiposCambio.actual;
    
    return {
        escritura: valorPesos * gastos.escritura / 100,
        inmobiliaria: valorPesos * gastos.inmobiliaria / 100,
        firmas: valorPesos * gastos.firmas / 100,
        sellos: valorPesos * gastos.sellos / 100,
        total: valorPesos * (gastos.escritura + gastos.inmobiliaria + gastos.firmas + gastos.sellos) / 100
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

function calcularEscenarios(datos, resultados) {
    const montoPrestamoPesos = resultados.montoPrestamoPesos;
    
    // Escenario peor caso (dólar alto)
    const diferenciaAlta = (datos.valorPropiedad * CONFIG.tiposCambio.peorCaso) - montoPrestamoPesos;
    const cuotaAlta = calcularCuotaConTipoCambio(resultados.cuotaMensual, CONFIG.tiposCambio.peorCaso);
    
    // Escenario mejor caso (dólar bajo)
    const diferenciaBaja = (datos.valorPropiedad * CONFIG.tiposCambio.mejorCaso) - montoPrestamoPesos;
    const cuotaBaja = calcularCuotaConTipoCambio(resultados.cuotaMensual, CONFIG.tiposCambio.mejorCaso);
    
    return {
        diferenciaAlta,
        cuotaAlta,
        diferenciaBaja,
        cuotaBaja
    };
}

function calcularCuotaConTipoCambio(cuotaBase, tipoCambio) {
    // Ajustar cuota según el tipo de cambio
    const factorAjuste = tipoCambio / CONFIG.tiposCambio.actual;
    return cuotaBase * factorAjuste;
}

function mostrarResultados(resultados) {
    // Primera cuota en ambas monedas
    elementos.primeraCuota.textContent = formatearPesos(resultados.primeraCuota);
    const primeraCuotaUSD = resultados.primeraCuota / CONFIG.tiposCambio.actual;
    document.getElementById('primeraCuotaUSD').textContent = `$${formatearNumero(primeraCuotaUSD)} USD`;
    
    // Total a pagar en ambas monedas
    elementos.totalPagar.textContent = formatearPesos(resultados.totalPagar);
    const totalPagarUSD = resultados.totalPagar / CONFIG.tiposCambio.actual;
    document.getElementById('totalPagarUSD').textContent = `$${formatearNumero(totalPagarUSD)} USD`;
    
    // Mostrar desglose de gastos
    if (resultados.gastosExtra && typeof resultados.gastosExtra === 'object') {
        document.getElementById('gastoEscritura').textContent = formatearPesos(resultados.gastosExtra.escritura);
        document.getElementById('gastoInmobiliaria').textContent = formatearPesos(resultados.gastosExtra.inmobiliaria);
        document.getElementById('gastoFirmas').textContent = formatearPesos(resultados.gastosExtra.firmas);
        document.getElementById('gastoSellos').textContent = formatearPesos(resultados.gastosExtra.sellos);
        
        // Total gastos en ambas monedas
        elementos.gastosExtra.innerHTML = `<strong>${formatearPesos(resultados.gastosExtra.total)}</strong>`;
        const gastosExtraUSD = resultados.gastosExtra.total / CONFIG.tiposCambio.actual;
        document.getElementById('gastosExtraUSD').textContent = `$${formatearNumero(gastosExtraUSD)} USD`;
    }
}

function mostrarEscenarios(escenarios) {
    elementos.diferenciaAlta.textContent = formatearPesos(escenarios.diferenciaAlta);
    elementos.cuotaAlta.textContent = formatearPesos(escenarios.cuotaAlta);
    elementos.diferenciaBaja.textContent = formatearPesos(escenarios.diferenciaBaja);
    elementos.cuotaBaja.textContent = formatearPesos(escenarios.cuotaBaja);
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
    return new Intl.NumberFormat('es-AR').format(valor);
}

function actualizarValorEnPesos(valorUSD) {
    const valorPesos = valorUSD * CONFIG.tiposCambio.actual;
    const elementoValorPesos = document.getElementById('valorPropiedadPesos');
    if (elementoValorPesos) {
        elementoValorPesos.textContent = formatearPesos(valorPesos);
    }
}

function actualizarEquivalenciaMontoPrestado(monto, moneda) {
    const elementoEquivalencia = document.getElementById('montoPrestamoEquivalente');
    if (!elementoEquivalencia) return;
    
    let equivalencia;
    if (moneda === 'USD') {
        // Si es USD, mostrar en pesos
        equivalencia = monto * CONFIG.tiposCambio.actual;
        elementoEquivalencia.textContent = formatearPesos(equivalencia);
    } else {
        // Si es pesos, mostrar en USD
        equivalencia = monto / CONFIG.tiposCambio.actual;
        elementoEquivalencia.textContent = `$${formatearNumero(equivalencia)} USD`;
    }
}

function actualizarCotizacionEnInterfaz() {
    const elementoCotizacion = document.getElementById('cotizacionActual');
    const fechaCotizacion = document.getElementById('fechaCotizacion');
    
    if (elementoCotizacion) {
        elementoCotizacion.textContent = formatearPesos(CONFIG.tiposCambio.actual);
    }
    
    if (fechaCotizacion) {
        const ahora = new Date();
        fechaCotizacion.textContent = `Actualizado: ${ahora.toLocaleTimeString('es-AR')}`;
    }
}

// Configurar toggle de moneda global
function configurarToggleMoneda() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            toggleBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Cambiar moneda global
            const moneda = this.dataset.moneda;
            cambiarMonedaGlobal(moneda);
        });
    });
}

// Cambiar moneda global
function cambiarMonedaGlobal(moneda) {
    // Aquí podrías implementar la lógica para cambiar toda la interfaz
    // Por ahora solo actualizamos el selector del monto prestado
    if (elementos.monedaPrestamo) {
        elementos.monedaPrestamo.value = moneda;
        calcularTodo();
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
        tcSlider.addEventListener('input', function() {
            const nuevoTC = parseInt(this.value);
            tcValor.textContent = nuevoTC;
            
            // Actualizar tipo de cambio y recalcular
            CONFIG.tiposCambio.actual = nuevoTC;
            calcularTodo();
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
    const valorPropiedadPesos = datos.valorPropiedad * CONFIG.tiposCambio.actual;
    
    // Convertir monto prestado a pesos para comparar
    let montoPrestamoPesos;
    if (datos.monedaPrestamo === 'USD') {
        montoPrestamoPesos = datos.montoPrestamo * CONFIG.tiposCambio.actual;
    } else {
        montoPrestamoPesos = datos.montoPrestamo;
    }
    
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


