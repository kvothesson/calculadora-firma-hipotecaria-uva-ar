/**
 * Controlador principal de la calculadora
 * Coordina todos los servicios y maneja la lógica de presentación
 */
class CalculatorController {
    constructor() {
        // Inicializar servicios
        this.exchangeRateService = new ExchangeRateService();
        this.calculationService = new CalculationService(this.exchangeRateService);
        this.validationService = new ValidationService();
        this.utilityService = new UtilityService();
        this.urlStateService = new URLStateService();

        // Elementos del DOM
        this.elementos = {
            valorPropiedad: document.getElementById('valorPropiedad'),
            provincia: document.getElementById('provincia'),
            montoPrestamo: document.getElementById('montoPrestamo'),
            plazo: document.getElementById('plazo'),
            tasaInteres: document.getElementById('tasaInteres'),
            sueldoMensual: document.getElementById('sueldoMensual'),
            
            // Resultados
            primeraCuota: document.getElementById('primeraCuota'),
            totalPagar: document.getElementById('totalPagar'),
            
            // Simulador
            diferenciaSimulador: document.getElementById('diferenciaSimulador'),
            diferenciaSimuladorUSD: document.getElementById('diferenciaSimuladorUSD'),
            tcSimuladorTexto: document.getElementById('tcSimuladorTexto'),
            
            // Máxima cuota sugerida
            maxCuotaSugerida: document.getElementById('maxCuotaSugerida'),
            cuotaStatusIndicator: document.getElementById('cuotaStatusIndicator'),
            cuotaSugeridaValor: document.getElementById('cuotaSugeridaValor'),
            cuotaCalculadaValor: document.getElementById('cuotaCalculadaValor'),
            statusMessage: document.getElementById('statusMessage')
        };

        // Estado de la aplicación
        this.estado = {
            cotizacionObtenida: false,
            uvaObtenida: false,
            calculosRealizados: false,
            ultimaValidacion: null
        };

        this.inicializar();
    }

    /**
     * Inicializa el controlador
     */
    async inicializar() {
        try {
            console.log('🚀 Inicializando calculadora...');
            
            // Obtener cotización oficial del día y valor de UVA en paralelo
            await Promise.all([
                this.obtenerCotizacionOficial(),
                this.obtenerValorUVA()
            ]);
            
            // Establecer valores por defecto
            this.establecerValoresPorDefecto();
            
            // Restaurar estado desde URL si existe
            this.restaurarEstadoDesdeURL();
            
            // Actualizar valores equivalentes
            this.actualizarValorPropiedadPesos();
            this.actualizarMontoPrestamoEquivalente();
            
            // Agregar event listeners
            this.agregarEventListeners();
            
            // Inicializar sliders de gastos
            this.actualizarSlidersGastos(this.elementos.provincia.value);
            
            // Calcular inicialmente después de un pequeño delay
            setTimeout(() => {
                this.calcularTodo();
            }, 100);
            
            console.log('✅ Calculadora inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar calculadora:', error);
        }
    }

    /**
     * Obtiene la cotización oficial del día
     */
    async obtenerCotizacionOficial() {
        try {
            const cotizacion = await this.exchangeRateService.obtenerCotizacionOficial();
            this.actualizarCotizacionEnInterfaz(cotizacion.fuente, cotizacion.fecha);
            this.estado.cotizacionObtenida = true;
            return cotizacion;
        } catch (error) {
            console.error('Error al obtener cotización:', error);
            throw error;
        }
    }

    /**
     * Obtiene el valor actual de UVA
     */
    async obtenerValorUVA() {
        try {
            const uvaData = await this.exchangeRateService.obtenerValorUVA();
            this.actualizarUVAEnInterfaz(uvaData.valor, uvaData.fecha, uvaData.fuente);
            this.estado.uvaObtenida = true;
            return uvaData;
        } catch (error) {
            console.error('Error al obtener valor UVA:', error);
            throw error;
        }
    }

    /**
     * Establece valores por defecto en el formulario
     */
    establecerValoresPorDefecto() {
        console.log('⚙️ Estableciendo valores por defecto...');
        
        const valoresPorDefecto = {
            valorPropiedad: '155000',
            montoPrestamo: '70000000',
            plazo: '20',
            tasaInteres: '8.5'
        };

        Object.entries(valoresPorDefecto).forEach(([campo, valor]) => {
            if (this.elementos[campo] && !this.elementos[campo].value) {
                this.elementos[campo].value = valor;
                console.log(`✅ ${campo} establecido por defecto: ${valor}`);
            }
        });
        
        console.log('✅ Valores por defecto establecidos');
    }

    /**
     * Restaura el estado desde los parámetros de la URL
     */
    restaurarEstadoDesdeURL() {
        try {
            if (this.urlStateService.hasURLParams()) {
                console.log('🔗 Restaurando estado desde URL...');
                const state = this.urlStateService.deserializeStateFromURL();
                
                if (Object.keys(state).length > 0) {
                    this.urlStateService.applyStateToForm(state);
                    console.log('✅ Estado restaurado desde URL:', state);
                }
            }
        } catch (error) {
            console.error('❌ Error al restaurar estado desde URL:', error);
        }
    }

    /**
     * Actualiza la URL con el estado actual del formulario
     */
    actualizarURL() {
        try {
            const currentState = this.urlStateService.getCurrentFormState();
            this.urlStateService.serializeStateToURL(currentState);
        } catch (error) {
            console.error('❌ Error al actualizar URL:', error);
        }
    }

    /**
     * Actualiza el valor de la propiedad en pesos
     */
    actualizarValorPropiedadPesos() {
        console.log('💱 Actualizando valor de propiedad en pesos...');
        
        const valorPropiedadPesos = document.getElementById('valorPropiedadPesos');
        if (valorPropiedadPesos && this.elementos.valorPropiedad.value) {
            const valorUSD = parseFloat(this.elementos.valorPropiedad.value);
            const tipoCambio = this.exchangeRateService.getTipoCambioOficial();
            const valorPesos = this.utilityService.convertirUSDaPesos(valorUSD, tipoCambio);
            
            valorPropiedadPesos.textContent = this.utilityService.formatearPesos(valorPesos);
            
            console.log('✅ Valor propiedad actualizado:', {
                USD: valorUSD,
                tipoCambio: tipoCambio,
                pesos: valorPesos,
                formateado: this.utilityService.formatearPesos(valorPesos)
            });
        }
    }

    /**
     * Actualiza el monto del préstamo equivalente en USD
     */
    actualizarMontoPrestamoEquivalente() {
        console.log('💱 Actualizando monto préstamo equivalente en USD...');
        
        const montoPrestamoEquivalente = document.getElementById('montoPrestamoEquivalente');
        if (montoPrestamoEquivalente && this.elementos.montoPrestamo.value) {
            const montoPesos = parseFloat(this.elementos.montoPrestamo.value);
            const tipoCambio = this.exchangeRateService.getTipoCambioOficial();
            const montoUSD = this.utilityService.convertirPesosaUSD(montoPesos, tipoCambio);
            
            montoPrestamoEquivalente.textContent = `USD $${montoUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            
            console.log('✅ Monto préstamo equivalente actualizado:', {
                pesos: montoPesos,
                tipoCambio: tipoCambio,
                USD: montoUSD
            });
        }
    }

    /**
     * Agrega event listeners a todos los campos
     */
    agregarEventListeners() {
        // Event listeners para campos principales
        this.elementos.valorPropiedad.addEventListener('input', () => {
            this.actualizarValorPropiedadPesos();
            this.calcularTodo();
            this.actualizarURL();
        });

        this.elementos.provincia.addEventListener('change', () => {
            // Trackear cambio de provincia
            if (window.AnalyticsTracker && window.AnalyticsTracker.trackProvinciaChanged) {
                window.AnalyticsTracker.trackProvinciaChanged(this.elementos.provincia.value);
            }
            
            this.actualizarSlidersGastos(this.elementos.provincia.value);
            this.calcularTodo();
            this.actualizarURL();
        });

        this.elementos.montoPrestamo.addEventListener('input', () => {
            this.actualizarMontoPrestamoEquivalente();
            this.calcularTodo();
            this.actualizarURL();
        });

        this.elementos.plazo.addEventListener('input', () => {
            this.actualizarPlazo();
            this.actualizarURL();
        });
        
        this.elementos.tasaInteres.addEventListener('input', () => {
            this.actualizarTasa();
            this.actualizarURL();
        });
        
        // Event listener para el campo de sueldo
        this.elementos.sueldoMensual.addEventListener('input', () => {
            this.calcularMaxCuotaSugerida();
            this.actualizarURL();
        });
        
        // Event listeners para sliders de gastos
        ['escritura', 'inmobiliaria', 'firmas', 'sellos'].forEach(tipo => {
            const slider = document.getElementById(tipo + 'Slider');
            if (slider) {
                slider.addEventListener('input', () => {
                    // Trackear actualización de gastos
                    if (window.AnalyticsTracker && window.AnalyticsTracker.trackGastosUpdated) {
                        const gastosData = {
                            escritura: parseFloat(document.getElementById('escrituraSlider')?.value || 0),
                            inmobiliaria: parseFloat(document.getElementById('inmobiliariaSlider')?.value || 0),
                            firmas: parseFloat(document.getElementById('firmasSlider')?.value || 0),
                            sellos: parseFloat(document.getElementById('sellosSlider')?.value || 0)
                        };
                        window.AnalyticsTracker.trackGastosUpdated(gastosData);
                    }
                    
                    this.calcularTodo();
                    this.actualizarURL();
                });
            }
        });
    }

    /**
     * Función principal que calcula todo
     */
    calcularTodo() {
        try {
            // Obtener valores del formulario
            const valores = this.obtenerValoresFormulario();
            
            console.log('🔍 Valores obtenidos del formulario:', valores);
            
            // Validar que los valores sean válidos
            const validacion = this.calculationService.validarValores(valores, this.exchangeRateService.getTipoCambioOficial());
            if (!validacion.isValid) {
                console.log('❌ Validación falló:', validacion.error);
                
                // Trackear error de validación
                if (window.AnalyticsTracker && window.AnalyticsTracker.trackCalculationError) {
                    window.AnalyticsTracker.trackCalculationError(new Error(validacion.error), valores);
                }
                return;
            }
            
            // Trackear inicio de cálculo
            if (window.AnalyticsTracker && window.AnalyticsTracker.trackCalculationStarted) {
                window.AnalyticsTracker.trackCalculationStarted(valores);
            }
            
            // Calcular cuota inicial
            const cuotaInicial = this.calculationService.calcularCuotaInicial(
                valores.montoPrestamo, 
                valores.tasaInteres, 
                valores.plazo
            );
            console.log('💰 Cuota inicial calculada:', cuotaInicial);
            
            // Calcular gastos extra
            const gastosExtra = this.calcularGastosExtraConPorcentajesPersonalizados(valores.valorPropiedad, valores.provincia);
            console.log('🏠 Gastos extra calculados:', gastosExtra);
            
            // Calcular total de la operación
            const totalOperacion = this.calculationService.calcularTotalOperacion(
                valores.valorPropiedad, 
                gastosExtra, 
                this.exchangeRateService.getTipoCambioOficial()
            );
            console.log('📊 Total operación:', totalOperacion);
            
            // Calcular diferencia (cuánto ponés vos)
            const diferencia = this.calculationService.calcularDiferenciaACubrir(totalOperacion, valores.montoPrestamo);
            console.log('💸 Diferencia a pagar:', diferencia);
            
            // Crear objeto de resultados
            const resultados = {
                cuotaInicial,
                gastosExtra,
                totalOperacion,
                diferencia,
                valores
            };
            
            console.log('📋 Objeto de resultados completo:', resultados);
            
            // Actualizar resultados en el DOM
            this.actualizarResultados(resultados);
            
            // Calcular escenarios de tipo de cambio
            this.calcularEscenariosTipoCambio(valores, totalOperacion, diferencia);
            
            // Calcular máximo de cuota sugerido si hay sueldo
            this.calcularMaxCuotaSugerida();
            
            // Generar consejos dinámicos
            this.generarConsejosDinamicos(valores, cuotaInicial, gastosExtra.total);
            
            this.estado.calculosRealizados = true;
            
            // Trackear cálculo completado exitosamente
            if (window.AnalyticsTracker && window.AnalyticsTracker.trackCalculationCompleted) {
                window.AnalyticsTracker.trackCalculationCompleted(resultados, valores);
            }
            
        } catch (error) {
            console.error('❌ Error en cálculo:', error);
            
            // Trackear error de cálculo
            if (window.AnalyticsTracker && window.AnalyticsTracker.trackCalculationError) {
                window.AnalyticsTracker.trackCalculationError(error, this.obtenerValoresFormulario());
            }
        }
    }

    /**
     * Obtiene todos los valores del formulario
     */
    obtenerValoresFormulario() {
        const valores = {
            valorPropiedad: this.utilityService.parsearNumero(this.elementos.valorPropiedad.value, 0),
            provincia: this.elementos.provincia.value,
            montoPrestamo: this.utilityService.parsearNumero(this.elementos.montoPrestamo.value, 0),
            plazo: parseInt(this.elementos.plazo.value) || 20,
            tasaInteres: this.utilityService.parsearNumero(this.elementos.tasaInteres.value, 8.5),
            sueldoMensual: this.utilityService.parsearNumero(this.elementos.sueldoMensual.value, 0)
        };
        
        console.log('📝 Valores obtenidos del formulario:', valores);
        return valores;
    }

    /**
     * Calcula gastos extra con porcentajes personalizados de los sliders
     */
    calcularGastosExtraConPorcentajesPersonalizados(valorPropiedadUSD, provincia) {
        const porcentajesPersonalizados = {};
        
        ['escritura', 'inmobiliaria', 'firmas', 'sellos'].forEach(tipo => {
            const slider = document.getElementById(tipo + 'Slider');
            if (slider) {
                porcentajesPersonalizados[tipo] = parseFloat(slider.value);
            }
        });

        return this.calculationService.calcularGastosExtra(valorPropiedadUSD, provincia, porcentajesPersonalizados);
    }

    /**
     * Actualiza los resultados en el DOM
     */
    actualizarResultados(resultados) {
        console.log('🔄 Iniciando actualización de resultados en el DOM');
        
        // Actualizar primera cuota
        if (this.elementos.primeraCuota) {
            this.elementos.primeraCuota.textContent = this.utilityService.formatearPesos(resultados.cuotaInicial);
        }
        
        // Actualizar cuota mensual en el campo principal
        const cuotaMensualARS = document.getElementById('cuotaMensualARS');
        if (cuotaMensualARS) {
            cuotaMensualARS.textContent = this.utilityService.formatearPesos(resultados.cuotaInicial);
        }
        
        // Actualizar total a pagar en ambas monedas
        if (this.elementos.totalPagar) {
            this.elementos.totalPagar.textContent = this.utilityService.formatearPesos(resultados.totalOperacion);
        }
        
        // Actualizar total a pagar en USD
        const totalPagarUSDElement = document.getElementById('totalPagarUSD');
        if (totalPagarUSDElement) {
            const tipoCambio = this.exchangeRateService.getTipoCambioOficial();
            const totalPagarUSD = resultados.totalOperacion / tipoCambio;
            totalPagarUSDElement.innerHTML = `<strong>USD $${totalPagarUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>`;
        }
        
        // Actualizar valor de la casa en ambas monedas
        this.actualizarValorCasa(resultados.valores.valorPropiedad);
        
        // Actualizar gastos detallados
        this.actualizarGastosDetallados(resultados.gastosExtra);
        
        // Actualizar escenarios de tipo de cambio
        this.actualizarEscenariosTipoCambio(resultados);
        
        console.log('🔄 Finalizando actualización de resultados en el DOM');
    }

    /**
     * Actualiza el valor de la casa en ambas monedas
     */
    actualizarValorCasa(valorPropiedadUSD) {
        const tipoCambio = this.exchangeRateService.getTipoCambioOficial();
        const valorCasaARS = valorPropiedadUSD * tipoCambio;
        
        // Actualizar valor en pesos
        const valorCasaARSElement = document.getElementById('valorCasaARS');
        if (valorCasaARSElement) {
            valorCasaARSElement.textContent = this.utilityService.formatearPesos(valorCasaARS);
        }
        
        // Actualizar valor en USD
        const valorCasaUSDElement = document.getElementById('valorCasaUSD');
        if (valorCasaUSDElement) {
            valorCasaUSDElement.textContent = `USD $${valorPropiedadUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        
        console.log('✅ Valor casa actualizado:', { 
            USD: valorPropiedadUSD, 
            ARS: valorCasaARS,
            tipoCambio: tipoCambio 
        });
    }

    /**
     * Actualiza gastos detallados en el DOM
     */
    actualizarGastosDetallados(gastosExtra) {
        const tipoCambio = this.exchangeRateService.getTipoCambioOficial();
        
        // Escritura
        this.utilityService.setLineaMoneda('gastoEscrituraARS', 'ARS', gastosExtra.desglose.escritura * tipoCambio);
        this.utilityService.setLineaMoneda('gastoEscrituraUSD', 'USD', gastosExtra.desglose.escritura);
        
        // Inmobiliaria
        this.utilityService.setLineaMoneda('gastoInmobiliariaARS', 'ARS', gastosExtra.desglose.inmobiliaria * tipoCambio);
        this.utilityService.setLineaMoneda('gastoInmobiliariaUSD', 'USD', gastosExtra.desglose.inmobiliaria);
        
        // Firmas
        this.utilityService.setLineaMoneda('gastoFirmasARS', 'ARS', gastosExtra.desglose.firmas * tipoCambio);
        this.utilityService.setLineaMoneda('gastoFirmasUSD', 'USD', gastosExtra.desglose.firmas);
        
        // Sellos
        this.utilityService.setLineaMoneda('gastoSellosARS', 'ARS', gastosExtra.desglose.sellos * tipoCambio);
        this.utilityService.setLineaMoneda('gastoSellosUSD', 'USD', gastosExtra.desglose.sellos);
        
        // Total gastos
        this.utilityService.setLineaMoneda('gastosTotalARS', 'ARS', gastosExtra.total * tipoCambio, true);
        this.utilityService.setLineaMoneda('gastosTotalUSD', 'USD', gastosExtra.total, true);
    }

    /**
     * Calcula escenarios de tipo de cambio
     */
    calcularEscenariosTipoCambio(valores, totalOperacion, diferencia) {
        // Los escenarios se actualizan automáticamente en actualizarResultados
        console.log('Escenarios de tipo de cambio calculados automáticamente');
    }

    /**
     * Actualiza escenarios de tipo de cambio
     */
    actualizarEscenariosTipoCambio(resultados) {
        // Actualizar tipos de cambio en los escenarios
        const bandasInfo = this.exchangeRateService.calcularBandasCambiarias();
        
        const tcPisoEscenario = document.getElementById('tcPisoEscenario');
        const tcOficialEscenario = document.getElementById('tcOficialEscenario');
        const tcTechoEscenario = document.getElementById('tcTechoEscenario');
        
        if (tcPisoEscenario) tcPisoEscenario.textContent = this.utilityService.formatearPesos(bandasInfo.piso);
        if (tcOficialEscenario) tcOficialEscenario.textContent = this.utilityService.formatearPesos(this.exchangeRateService.getTipoCambioOficial());
        if (tcTechoEscenario) tcTechoEscenario.textContent = this.utilityService.formatearPesos(bandasInfo.techo);
        
        // Calcular valores para cada escenario
        const valorTotalUSD = resultados.valores.valorPropiedad + resultados.gastosExtra.total;
        
        // Escenario Piso (mejor caso)
        this.actualizarEscenarioPiso(valorTotalUSD, resultados);
        
        // Escenario Oficial (caso base)
        this.actualizarEscenarioOficial(valorTotalUSD, resultados);
        
        // Escenario Techo (peor caso)
        this.actualizarEscenarioTecho(valorTotalUSD, resultados);
    }

    /**
     * Actualiza el escenario piso (mejor caso)
     */
    actualizarEscenarioPiso(valorTotalUSD, resultados) {
        const bandasInfo = this.exchangeRateService.calcularBandasCambiarias();
        const totalPisoPesos = valorTotalUSD * bandasInfo.piso;
        
        this.utilityService.setLineaMoneda('totalPisoARS', 'ARS', totalPisoPesos);
        this.utilityService.setLineaMoneda('totalPisoUSD', 'USD', valorTotalUSD);
        
        this.utilityService.setLineaMoneda('prestamoPisoARS', 'ARS', resultados.valores.montoPrestamo);
        this.utilityService.setLineaMoneda('prestamoPisoUSD', 'USD', resultados.valores.montoPrestamo / bandasInfo.piso);
        
        const diferenciaPisoPesos = totalPisoPesos - resultados.valores.montoPrestamo;
        this.utilityService.setLineaMoneda('diferenciaPisoARS', 'ARS', diferenciaPisoPesos);
        this.utilityService.setLineaMoneda('diferenciaPisoUSD', 'USD', diferenciaPisoPesos / this.exchangeRateService.getTipoCambioOficial());
    }

    /**
     * Actualiza el escenario oficial (caso base)
     */
    actualizarEscenarioOficial(valorTotalUSD, resultados) {
        const tipoCambioOficial = this.exchangeRateService.getTipoCambioOficial();
        const totalOficialPesos = valorTotalUSD * tipoCambioOficial;
        
        this.utilityService.setLineaMoneda('totalOficialARS', 'ARS', totalOficialPesos);
        this.utilityService.setLineaMoneda('totalOficialUSD', 'USD', valorTotalUSD);
        
        this.utilityService.setLineaMoneda('prestamoOficialARS', 'ARS', resultados.valores.montoPrestamo);
        this.utilityService.setLineaMoneda('prestamoOficialUSD', 'USD', resultados.valores.montoPrestamo / tipoCambioOficial);
        
        const diferenciaOficialPesos = totalOficialPesos - resultados.valores.montoPrestamo;
        this.utilityService.setLineaMoneda('diferenciaOficialARS', 'ARS', diferenciaOficialPesos);
        this.utilityService.setLineaMoneda('diferenciaOficialUSD', 'USD', diferenciaOficialPesos / tipoCambioOficial);
    }

    /**
     * Actualiza el escenario techo (peor caso)
     */
    actualizarEscenarioTecho(valorTotalUSD, resultados) {
        const bandasInfo = this.exchangeRateService.calcularBandasCambiarias();
        const totalTechoPesos = valorTotalUSD * bandasInfo.techo;
        
        this.utilityService.setLineaMoneda('totalTechoARS', 'ARS', totalTechoPesos);
        this.utilityService.setLineaMoneda('totalTechoUSD', 'USD', valorTotalUSD);
        
        this.utilityService.setLineaMoneda('prestamoTechoARS', 'ARS', resultados.valores.montoPrestamo);
        this.utilityService.setLineaMoneda('prestamoTechoUSD', 'USD', resultados.valores.montoPrestamo / bandasInfo.techo);
        
        const diferenciaTechoPesos = totalTechoPesos - resultados.valores.montoPrestamo;
        this.utilityService.setLineaMoneda('diferenciaTechoARS', 'ARS', diferenciaTechoPesos);
        this.utilityService.setLineaMoneda('diferenciaTechoUSD', 'USD', diferenciaTechoPesos / this.exchangeRateService.getTipoCambioOficial());
    }

    /**
     * Calcula el máximo de cuota sugerido basado en el sueldo
     */
    calcularMaxCuotaSugerida() {
        const sueldo = parseFloat(this.elementos.sueldoMensual.value);
        const maxCuota = this.calculationService.calcularMaxCuotaSugerida(sueldo);
        
        if (this.elementos.maxCuotaSugerida) {
            this.elementos.maxCuotaSugerida.textContent = this.utilityService.formatearPesos(maxCuota);
        }
        
        // Actualizar indicador de estado
        this.actualizarIndicadorCuota(maxCuota);
    }

    /**
     * Actualiza el indicador de estado de la cuota
     */
    actualizarIndicadorCuota(maxCuota) {
        const cuotaStatusIndicator = document.getElementById('cuotaStatusIndicator');
        const cuotaStatusText = document.getElementById('cuotaStatusText');
        
        if (!cuotaStatusIndicator || !cuotaStatusText) return;
        
        // Obtener la cuota actual
        const cuotaActualElement = document.getElementById('cuotaMensualARS');
        let cuotaActual = 0;
        
        if (cuotaActualElement && cuotaActualElement.textContent) {
            const cuotaTexto = cuotaActualElement.textContent;
            cuotaActual = parseFloat(cuotaTexto.replace(/[^\d]/g, ''));
        }
        
        // Mostrar el indicador de estado
        cuotaStatusIndicator.style.display = 'block';
        
        if (cuotaActual > 0) {
            if (cuotaActual > maxCuota) {
                // Cuota supera el máximo recomendado
                cuotaStatusIndicator.className = 'cuota-status-indicator warning';
                cuotaStatusText.innerHTML = `
                    ⚠️ <strong>¡Atención!</strong> Tu cuota supera el máximo recomendado. 
                    Considerá ajustar el monto del préstamo o el plazo.
                `;
                
                // Mostrar alerta visual en el campo de sueldo
                this.elementos.sueldoMensual.style.borderColor = '#dc2626';
                this.elementos.sueldoMensual.style.boxShadow = '0 0 0 4px rgba(220, 38, 38, 0.15)';
            } else {
                // Cuota está dentro del rango recomendado
                cuotaStatusIndicator.className = 'cuota-status-indicator success';
                cuotaStatusText.innerHTML = `
                    ✅ <strong>¡Perfecto!</strong> Tu cuota está dentro del rango recomendado.
                `;
                
                // Restaurar estilo normal del campo
                this.elementos.sueldoMensual.style.borderColor = '';
                this.elementos.sueldoMensual.style.boxShadow = '';
            }
        } else {
            // No hay cuota calculada aún
            cuotaStatusIndicator.className = 'cuota-status-indicator info';
            cuotaStatusText.innerHTML = `
                💡 <strong>¡Excelente!</strong> Tu sueldo permite una cuota de hasta el máximo sugerido.
            `;
            
            // Restaurar estilo normal del campo
            this.elementos.sueldoMensual.style.borderColor = '';
            this.elementos.sueldoMensual.style.boxShadow = '';
        }
    }

    /**
     * Actualiza sliders de gastos cuando cambie la provincia
     */
    actualizarSlidersGastos(provincia) {
        console.log('🏠 Actualizando sliders de gastos para provincia:', provincia);
        
        const gastosConfig = this.calculationService.getGastosConfig(provincia);
        if (!gastosConfig) {
            console.log('❌ No se encontró configuración de gastos para provincia:', provincia);
            return;
        }
        
        // Actualizar sliders con valores de la provincia
        ['escritura', 'inmobiliaria', 'firmas', 'sellos'].forEach(tipo => {
            const slider = document.getElementById(tipo + 'Slider');
            if (slider) {
                slider.value = gastosConfig[tipo].intermedio;
                console.log(`✅ Slider ${tipo} actualizado:`, gastosConfig[tipo].intermedio);
            }
        });
        
        console.log('✅ Todos los sliders de gastos actualizados');
    }

    /**
     * Actualiza el valor mostrado del plazo
     */
    actualizarPlazo() {
        const plazoValor = document.getElementById('plazoValor');
        if (plazoValor) {
            plazoValor.textContent = this.elementos.plazo.value;
        }
        this.calcularTodo();
    }

    /**
     * Actualiza el valor mostrado de la tasa
     */
    actualizarTasa() {
        const tasaValor = document.getElementById('tasaValor');
        if (tasaValor) {
            tasaValor.textContent = this.elementos.tasaInteres.value;
        }
        this.calcularTodo();
    }

    /**
     * Actualiza la cotización en la interfaz
     */
    actualizarCotizacionEnInterfaz(fuente = 'Automático', fecha = null) {
        const elementoCotizacion = document.getElementById('cotizacionActual');
        const fechaCotizacion = document.getElementById('fechaCotizacion');
        
        if (elementoCotizacion) {
            elementoCotizacion.textContent = this.utilityService.formatearPesos(this.exchangeRateService.getTipoCambioOficial());
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

    /**
     * Actualiza el valor de UVA en la interfaz
     */
    actualizarUVAEnInterfaz(valor, fecha, fuente = 'Automático') {
        const elementoUVA = document.getElementById('valorUVA');
        const fechaUVA = document.getElementById('fechaUVA');
        
        if (elementoUVA) {
            // UVA se muestra como número sin símbolo de moneda
            elementoUVA.textContent = this.utilityService.formatearNumero(valor);
        }
        
        if (fechaUVA) {
            const ahora = new Date();
            let textoActualizacion = '';
            
            if (fuente === 'ArgentinaDatos API') {
                textoActualizacion = `✅ ArgentinaDatos - ${fecha || ahora.toLocaleDateString('es-AR')}`;
            } else if (fuente === 'Valor por defecto') {
                textoActualizacion = `❌ Sin conexión - Valor estimado`;
            } else {
                textoActualizacion = `Desde cache - ${ahora.toLocaleTimeString('es-AR')}`;
            }
            
            fechaUVA.textContent = textoActualizacion;
        }
    }

    /**
     * Genera consejos dinámicos basados en los datos
     */
    generarConsejosDinamicos(valores, cuotaInicial, totalGastos) {
        // Esta función se puede implementar para mostrar consejos personalizados
        console.log('Generando consejos dinámicos...', { valores, cuotaInicial, totalGastos });
    }

    /**
     * Obtiene el estado actual de la aplicación
     */
    getEstado() {
        return { ...this.estado };
    }

    /**
     * Obtiene los elementos del DOM
     */
    getElementos() {
        return { ...this.elementos };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculatorController;
} else {
    window.CalculatorController = CalculatorController;
}
