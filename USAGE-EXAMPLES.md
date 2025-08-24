# Ejemplos de Uso de la Nueva Arquitectura

## Inicialización Básica

La aplicación se inicializa automáticamente cuando se carga la página:

```javascript
// La aplicación se inicializa automáticamente en app.js
document.addEventListener('DOMContentLoaded', function() {
    // Se crean los controladores automáticamente
    const calculatorController = new CalculatorController();
    const simulatorController = new SimulatorController(
        calculatorController.exchangeRateService,
        calculatorController.calculationService,
        calculatorController.utilityService
    );
});
```

## Uso de Servicios

### 1. CalculationService

```javascript
// Crear instancia del servicio
const calculationService = new CalculationService();

// Calcular cuota inicial
const cuota = calculationService.calcularCuotaInicial(70000000, 8.5, 20);
console.log('Cuota mensual:', cuota);

// Calcular gastos extra
const gastos = calculationService.calcularGastosExtra(155000, 'CABA');
console.log('Gastos totales:', gastos.total);

// Validar valores
const validacion = calculationService.validarValores({
    valorPropiedad: 155000,
    montoPrestamo: 70000000,
    plazo: 20,
    tasaInteres: 8.5
}, 1301);

if (validacion.isValid) {
    console.log('Datos válidos');
} else {
    console.log('Error:', validacion.error);
}
```

### 2. ExchangeRateService

```javascript
// Crear instancia del servicio
const exchangeRateService = new ExchangeRateService();

// Obtener cotización oficial
exchangeRateService.obtenerCotizacionOficial()
    .then(cotizacion => {
        console.log('Cotización obtenida:', cotizacion);
    })
    .catch(error => {
        console.error('Error:', error);
    });

// Calcular bandas cambiarias
const bandas = exchangeRateService.calcularBandasCambiarias();
console.log('Piso:', bandas.piso, 'Techo:', bandas.techo);

// Validar tipo de cambio
const validacion = exchangeRateService.validarTipoCambioConBandas(1500);
if (validacion.mensaje) {
    console.log('Consejo:', validacion.mensaje);
}
```

### 3. ValidationService

```javascript
// Crear instancia del servicio
const validationService = new ValidationService();

// Validar campo específico
const campo = document.getElementById('valorPropiedad');
const resultado = validationService.validateField(campo);

if (resultado.isValid) {
    console.log('Campo válido');
} else {
    console.log('Error:', resultado.message);
}

// Obtener estado general de validación
const estadoGeneral = validationService.getOverallValidation();
console.log('Estado general:', estadoGeneral);

// Limpiar todos los estados
validationService.clearAllStates();
```

### 4. UtilityService

```javascript
// Crear instancia del servicio
const utilityService = new UtilityService();

// Formatear monedas
const pesosFormateados = utilityService.formatearPesos(150000);
console.log('Pesos:', pesosFormateados);

// Convertir divisas
const usdAPesos = utilityService.convertirUSDaPesos(100, 1301);
console.log('USD 100 = ARS', usdAPesos);

// Debounce function
const funcionConDebounce = utilityService.debounce(() => {
    console.log('Función ejecutada después de 300ms');
}, 300);

// Manipulación segura del DOM
const elemento = utilityService.getElemento('miElemento');
if (elemento) {
    utilityService.establecerTextoElemento('miElemento', 'Nuevo texto');
}
```

## Uso de Controladores

### 1. CalculatorController

```javascript
// El controlador se inicializa automáticamente
// Pero puedes acceder a él desde window.app

const controller = window.app.calculatorController;

// Obtener estado de la aplicación
const estado = controller.getEstado();
console.log('Estado:', estado);

// Obtener elementos del DOM
const elementos = controller.getElementos();
console.log('Elementos:', elementos);

// Calcular todo manualmente
controller.calcularTodo();

// Obtener valores del formulario
const valores = controller.obtenerValoresFormulario();
console.log('Valores:', valores);
```

### 2. SimulatorController

```javascript
// El controlador del simulador también se inicializa automáticamente
const simulatorController = window.app.simulatorController;

// Cambiar tipo de cambio del simulador
simulatorController.exchangeRateService.actualizarTipoCambioSimulador(1400);

// Recalcular con nuevo tipo de cambio
simulatorController.recalcularCoreConNuevoTC(1400);

// Actualizar bandas en la interfaz
simulatorController.actualizarBandasEnInterfaz();
```

## Ejemplos de Casos de Uso

### 1. Crear una Nueva Funcionalidad

```javascript
// Ejemplo: Agregar un nuevo tipo de gasto
class NuevoGastoService {
    constructor() {
        this.calculationService = new CalculationService();
    }
    
    calcularGastoAdicional(valorPropiedad, provincia, tipoGasto) {
        // Lógica específica del nuevo gasto
        const porcentaje = this.obtenerPorcentajeGasto(provincia, tipoGasto);
        return valorPropiedad * (porcentaje / 100);
    }
    
    obtenerPorcentajeGasto(provincia, tipoGasto) {
        // Lógica para obtener porcentaje
        return 1.5; // Ejemplo
    }
}

// Usar el nuevo servicio
const nuevoGastoService = new NuevoGastoService();
const gastoAdicional = nuevoGastoService.calcularGastoAdicional(155000, 'CABA', 'seguro');
```

### 2. Extender Validaciones

```javascript
// Ejemplo: Agregar nueva validación
class ValidacionAvanzadaService extends ValidationService {
    constructor() {
        super();
    }
    
    validarCapacidadPago(valores, sueldo) {
        const cuota = this.calcularCuotaEstimada(valores);
        const capacidad = sueldo * 0.4; // 40% del sueldo
        
        if (cuota > capacidad) {
            return {
                isValid: false,
                level: 'error',
                message: 'La cuota supera tu capacidad de pago'
            };
        }
        
        return { isValid: true, level: 'valid' };
    }
    
    calcularCuotaEstimada(valores) {
        // Lógica simplificada para estimar cuota
        return valores.montoPrestamo * 0.01; // 1% mensual aproximado
    }
}
```

### 3. Crear Nuevo Controlador

```javascript
// Ejemplo: Controlador para reportes
class ReportesController {
    constructor(calculationService, utilityService) {
        this.calculationService = calculationService;
        this.utilityService = utilityService;
    }
    
    generarReporte(valores, resultados) {
        const reporte = {
            fecha: new Date().toISOString(),
            datos: valores,
            resultados: resultados,
            resumen: this.generarResumen(valores, resultados)
        };
        
        return reporte;
    }
    
    generarResumen(valores, resultados) {
        return {
            cuotaMensual: this.utilityService.formatearPesos(resultados.cuotaInicial),
            totalGastos: this.utilityService.formatearPesos(resultados.gastosExtra.total),
            capacidadPago: this.calcularCapacidadPago(resultados.cuotaInicial)
        };
    }
    
    calcularCapacidadPago(cuota) {
        const ingresoRecomendado = cuota / 0.25;
        return this.utilityService.formatearPesos(ingresoRecomendado);
    }
}

// Usar el nuevo controlador
const reportesController = new ReportesController(
    window.app.calculatorController.calculationService,
    window.app.calculatorController.utilityService
);

const reporte = reportesController.generarReporte(valores, resultados);
console.log('Reporte generado:', reporte);
```

## Testing

### 1. Test Unitario de Servicio

```javascript
// Ejemplo con Jest o similar
describe('CalculationService', () => {
    let calculationService;
    
    beforeEach(() => {
        calculationService = new CalculationService();
    });
    
    test('debe calcular cuota inicial correctamente', () => {
        const cuota = calculationService.calcularCuotaInicial(100000, 10, 20);
        expect(cuota).toBeGreaterThan(0);
        expect(typeof cuota).toBe('number');
    });
    
    test('debe validar valores correctamente', () => {
        const validacion = calculationService.validarValores({
            valorPropiedad: 100000,
            montoPrestamo: 50000,
            plazo: 15,
            tasaInteres: 8
        }, 1000);
        
        expect(validacion.isValid).toBe(true);
    });
});
```

### 2. Test de Integración

```javascript
describe('CalculatorController Integration', () => {
    let controller;
    
    beforeEach(() => {
        // Mock del DOM
        document.body.innerHTML = `
            <input id="valorPropiedad" value="100000" />
            <input id="montoPrestamo" value="50000" />
            <select id="provincia"><option value="CABA">CABA</option></select>
            <input id="plazo" value="15" />
            <input id="tasaInteres" value="8" />
        `;
        
        controller = new CalculatorController();
    });
    
    test('debe calcular todo correctamente', () => {
        controller.calcularTodo();
        expect(controller.estado.calculosRealizados).toBe(true);
    });
});
```

## Debugging

### 1. Acceso a Servicios

```javascript
// En la consola del navegador
console.log('Servicios disponibles:', {
    calculation: window.app.calculatorController.calculationService,
    exchangeRate: window.app.calculatorController.exchangeRateService,
    validation: window.app.calculatorController.validationService,
    utility: window.app.calculatorController.utilityService
});
```

### 2. Estado de la Aplicación

```javascript
// Ver estado actual
console.log('Estado de la aplicación:', window.app.calculatorController.getEstado());

// Ver elementos del DOM
console.log('Elementos del DOM:', window.app.calculatorController.getElementos());
```

### 3. Logs Estructurados

```javascript
// Los servicios tienen logging estructurado
// Ejemplo: ver logs de cotización
// En la consola verás logs como:
// "🚀 Inicializando calculadora..."
// "✅ Cotización obtenida de BCRA: $1301"
// "💰 Cuota inicial calculada: 1234567"
```

## Conclusión

Esta nueva arquitectura proporciona una base sólida y flexible para el desarrollo. Los servicios son reutilizables, los controladores coordinan la lógica de presentación, y la configuración está centralizada. Esto facilita tanto el desarrollo de nuevas funcionalidades como el mantenimiento del código existente.
