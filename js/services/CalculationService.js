/**
 * Servicio principal de cálculos hipotecarios
 * Contiene toda la lógica de negocio de la calculadora
 */
class CalculationService {
    constructor() {
        this.config = {
            // Gastos extra por provincia (en % del valor de la propiedad)
            gastosExtra: {
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
            factorUVA: 1.02,      // 2% mensual
            
            // Gastos bancarios
            gastosBancarios: {
                tasacion: 15000,   // $15,000
                seguro: 0.5,       // 0.5% del monto prestado
                otros: 5000        // $5,000
            }
        };
    }

    /**
     * Calcula la cuota inicial usando la fórmula de amortización francesa
     */
    calcularCuotaInicial(monto, tasaAnual, plazoAnos) {
        if (monto <= 0 || tasaAnual <= 0 || plazoAnos <= 0) {
            return 0;
        }

        // Convertir tasa anual a mensual
        const tasaMensual = tasaAnual / 100 / 12;
        
        // Convertir plazo a meses
        const plazoMeses = plazoAnos * 12;

        // Fórmula de amortización francesa
        if (tasaMensual === 0) {
            return monto / plazoMeses;
        }

        const numerador = tasaMensual * Math.pow(1 + tasaMensual, plazoMeses);
        const denominador = Math.pow(1 + tasaMensual, plazoMeses) - 1;

        if (denominador === 0) {
            return 0;
        }

        return monto * (numerador / denominador);
    }

    /**
     * Calcula los gastos extra según la provincia
     */
    calcularGastosExtra(valorPropiedadUSD, provincia, porcentajesPersonalizados = null) {
        const gastosConfig = this.config.gastosExtra[provincia];
        if (!gastosConfig) {
            return { total: 0, desglose: {} };
        }

        // Usar porcentajes personalizados si se proporcionan, sino usar valores intermedios
        const escritura = porcentajesPersonalizados?.escritura || gastosConfig.escritura.intermedio;
        const inmobiliaria = porcentajesPersonalizados?.inmobiliaria || gastosConfig.inmobiliaria.intermedio;
        const firmas = porcentajesPersonalizados?.firmas || gastosConfig.firmas.intermedio;
        const sellos = porcentajesPersonalizados?.sellos || gastosConfig.sellos.intermedio;

        // Calcular gastos en USD
        const gastosEscritura = valorPropiedadUSD * (escritura / 100);
        const gastosInmobiliaria = valorPropiedadUSD * (inmobiliaria / 100);
        const gastosFirmas = valorPropiedadUSD * (firmas / 100);
        const gastosSellos = valorPropiedadUSD * (sellos / 100);

        const total = gastosEscritura + gastosInmobiliaria + gastosFirmas + gastosSellos;

        return {
            total,
            desglose: {
                escritura: gastosEscritura,
                inmobiliaria: gastosInmobiliaria,
                firmas: gastosFirmas,
                sellos: gastosSellos
            }
        };
    }

    /**
     * Calcula los gastos extra con un tipo de cambio específico
     */
    calcularGastosExtraConTC(valorPropiedad, provincia, tipoCambio, porcentajesPersonalizados = null) {
        const gastos = this.config.gastosExtra[provincia];
        const valorPesos = valorPropiedad * tipoCambio;

        // Usar porcentajes personalizados si se proporcionan, sino usar valores intermedios
        const escritura = valorPesos * (porcentajesPersonalizados?.escritura || gastos.escritura.intermedio) / 100;
        const inmobiliaria = valorPesos * (porcentajesPersonalizados?.inmobiliaria || gastos.inmobiliaria.intermedio) / 100;
        const firmas = valorPesos * (porcentajesPersonalizados?.firmas || gastos.firmas.intermedio) / 100;
        const sellos = valorPesos * (porcentajesPersonalizados?.sellos || gastos.sellos.intermedio) / 100;

        const total = escritura + inmobiliaria + firmas + sellos;

        return {
            escritura,
            inmobiliaria,
            firmas,
            sellos,
            total
        };
    }

    /**
     * Calcula la cuota promedio considerando UVA
     */
    calcularCuotaPromedioConUVA(cuotaInicial, totalMeses) {
        let cuotaAcumulada = 0;
        let cuotaActual = cuotaInicial;

        for (let mes = 1; mes <= totalMeses; mes++) {
            cuotaAcumulada += cuotaActual;
            cuotaActual *= this.config.factorUVA;
        }

        return cuotaAcumulada / totalMeses;
    }

    /**
     * Calcula el máximo de cuota sugerido basado en el sueldo
     */
    calcularMaxCuotaSugerida(sueldoMensual) {
        if (!sueldoMensual || sueldoMensual < 100000) {
            return 0;
        }

        // Regla del 25%: la cuota no debe superar el 25% del sueldo
        return sueldoMensual * 0.25;
    }

    /**
     * Valida que los valores del formulario sean válidos
     */
    validarValores(valores, tipoCambioOficial) {
        // Validar valor de la propiedad
        if (valores.valorPropiedad <= 0) {
            return { isValid: false, error: 'Valor de propiedad inválido' };
        }

        // Validar monto del préstamo
        if (valores.montoPrestamo <= 0) {
            return { isValid: false, error: 'Monto del préstamo inválido' };
        }

        // Validar que el préstamo no supere el valor de la propiedad
        const valorMaximoPrestamo = valores.valorPropiedad * tipoCambioOficial;
        if (valores.montoPrestamo > valorMaximoPrestamo) {
            return { isValid: false, error: 'Préstamo supera valor máximo' };
        }

        // Validar plazo
        if (valores.plazo < 5 || valores.plazo > 35) {
            return { isValid: false, error: 'Plazo inválido' };
        }

        // Validar tasa de interés
        if (valores.tasaInteres < 4.5 || valores.tasaInteres > 11) {
            return { isValid: false, error: 'Tasa de interés inválida' };
        }

        return { isValid: true };
    }

    /**
     * Calcula el total de la operación
     */
    calcularTotalOperacion(valorPropiedadUSD, gastosExtra, tipoCambio) {
        const valorCasaPesos = valorPropiedadUSD * tipoCambio;
        // Convertir gastos extra de USD a pesos para sumar correctamente
        const gastosExtraPesos = gastosExtra.total * tipoCambio;
        return valorCasaPesos + gastosExtraPesos;
    }

    /**
     * Calcula la diferencia a cubrir
     */
    calcularDiferenciaACubrir(totalOperacion, montoPrestamo) {
        return totalOperacion - montoPrestamo;
    }

    /**
     * Obtiene la configuración de gastos para una provincia
     */
    getGastosConfig(provincia) {
        return this.config.gastosExtra[provincia] || null;
    }

    /**
     * Actualiza el valor intermedio de un tipo de gasto para una provincia
     */
    actualizarValorIntermedio(tipo, valor, provincia) {
        if (this.config.gastosExtra[provincia] && this.config.gastosExtra[provincia][tipo]) {
            this.config.gastosExtra[provincia][tipo].intermedio = parseFloat(valor);
        }
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculationService;
} else {
    window.CalculationService = CalculationService;
}
