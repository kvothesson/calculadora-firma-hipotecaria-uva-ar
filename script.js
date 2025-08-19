// Configuración de la calculadora
const CONFIG = {
    // Gastos extra por provincia (en % del valor de la propiedad)
    gastosExtra: {
        'CABA': {
            escritura: 2.5,        // 2.5% del valor
            inmobiliaria: 3.0,     // 3% del valor
            firmas: 0.5,           // 0.5% del valor
            otros: 1.0             // 1% del valor
        },
        'BSAS': {
            escritura: 2.0,        // 2% del valor
            inmobiliaria: 3.0,     // 3% del valor
            firmas: 0.5,           // 0.5% del valor
            otros: 1.0             // 1% del valor
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
}

function limpiarResultados() {
    elementos.primeraCuota.textContent = '$0';
    elementos.totalPagar.textContent = '$0';
    elementos.gastosExtra.textContent = '$0';
    elementos.cuotaPromedio.textContent = '$0';
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
    const totalGastos = (gastos.escritura + gastos.inmobiliaria + gastos.firmas + gastos.otros) / 100;
    
    // Convertir a pesos
    return valorPropiedad * totalGastos * CONFIG.tiposCambio.actual;
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
    elementos.primeraCuota.textContent = formatearPesos(resultados.primeraCuota);
    elementos.totalPagar.textContent = formatearPesos(resultados.totalPagar);
    elementos.gastosExtra.textContent = formatearPesos(resultados.gastosExtra);
    elementos.cuotaPromedio.textContent = formatearPesos(resultados.cuotaPromedio);
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
    if (elementoCotizacion) {
        elementoCotizacion.textContent = formatearPesos(CONFIG.tiposCambio.actual);
    }
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


