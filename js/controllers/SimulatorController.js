/**
 * Controlador del simulador de tipo de cambio
 * Maneja la lógica específica del simulador y escenarios
 */
class SimulatorController {
    constructor(exchangeRateService, calculationService, utilityService) {
        this.exchangeRateService = exchangeRateService;
        this.calculationService = calculationService;
        this.utilityService = utilityService;
        
        this.inicializar();
    }

    /**
     * Inicializa el controlador del simulador
     */
    inicializar() {
        this.configurarSliderTC();
        this.configurarSliders();
        this.actualizarBandasEnInterfaz();
    }

    /**
     * Configura el slider de tipo de cambio
     */
    configurarSliderTC() {
        const tcInput = document.getElementById('tcInput');
        const tcSuggestions = document.querySelectorAll('.tc-suggestion');
        
        if (tcInput) {
            // Inicializar input con el valor oficial
            tcInput.value = this.exchangeRateService.getTipoCambioOficial();
            
            // Evento para cambios inmediatos
            tcInput.addEventListener('input', this.utilityService.debounce((e) => {
                this.manejarCambioTC(e.target.value);
            }, 300));
            
            // Evento para cambios finales (blur) - validación de rango
            tcInput.addEventListener('blur', (e) => {
                this.validarRangoTC(e.target);
            });
        }
        
        // Configurar botones de sugerencias
        this.configurarBotonesSugerencias(tcSuggestions);
    }

    /**
     * Maneja el cambio en el tipo de cambio del simulador
     */
    manejarCambioTC(valorTexto) {
        const nuevoTC = parseInt(valorTexto);
        
        // Solo procesar si es un número válido
        if (!isNaN(nuevoTC) && nuevoTC > 0) {
            // Actualizar el simulador
            this.exchangeRateService.actualizarTipoCambioSimulador(nuevoTC);
            
            // Recalcular todo el CORE con el nuevo tipo de cambio
            this.recalcularCoreConNuevoTC(nuevoTC);
            
            // Actualizar estado visual de sugerencias
            this.actualizarEstadoSugerencias();
            
            // Validar y mostrar consejos sobre bandas cambiarias
            this.validarTipoCambioConBandas(nuevoTC);
        }
    }

    /**
     * Valida el rango del tipo de cambio
     */
    validarRangoTC(input) {
        let valor = parseInt(input.value) || this.exchangeRateService.getTipoCambioOficial();
        
        // Validar rango solo cuando termine de escribir
        if (valor < 800) {
            valor = 800;
            input.value = valor;
        } else if (valor > 2000) {
            valor = 2000;
            input.value = valor;
        }
        
        // Actualizar si cambió el valor
        if (valor !== this.exchangeRateService.getTipoCambioSimulador()) {
            this.exchangeRateService.actualizarTipoCambioSimulador(valor);
            this.recalcularCoreConNuevoTC(valor);
            this.actualizarEstadoSugerencias();
        }
    }

    /**
     * Configura los botones de sugerencias
     */
    configurarBotonesSugerencias(tcSuggestions) {
        tcSuggestions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tipo = e.target.dataset.tc;
                let nuevoValor;
                
                switch(tipo) {
                    case 'oficial':
                        nuevoValor = this.exchangeRateService.getTipoCambioOficial();
                        break;
                    case 'piso':
                        nuevoValor = this.exchangeRateService.calcularPisoBandaCambiaria().piso;
                        break;
                    case 'techo':
                        nuevoValor = this.exchangeRateService.calcularBandasCambiarias().techo;
                        break;
                    default:
                        nuevoValor = this.exchangeRateService.getTipoCambioOficial();
                }
                
                // Actualizar el input y el simulador
                const tcInput = document.getElementById('tcInput');
                if (tcInput) {
                    tcInput.value = nuevoValor;
                }
                
                this.exchangeRateService.actualizarTipoCambioSimulador(nuevoValor);
                
                // Recalcular todo el CORE con el nuevo tipo de cambio
                this.recalcularCoreConNuevoTC(nuevoValor);
                
                // Actualizar estado visual de sugerencias
                this.actualizarEstadoSugerencias();
                
                // Validar valor con bandas
                this.validarTipoCambioConBandas(nuevoValor);
            });
        });
    }

    /**
     * Recalcula el CORE con un nuevo tipo de cambio
     */
    recalcularCoreConNuevoTC(nuevoTC) {
        // Obtener datos del formulario
        const valores = this.obtenerDatosEntrada();
        if (!this.calculationService.validarDatosParaCalculos(valores)) {
            console.log('recalcularCoreConNuevoTC: datos no válidos', valores);
            return;
        }
        
        console.log('Recalculando CORE con nuevo TC:', nuevoTC);
        
        // Recalcular gastos con el nuevo tipo de cambio
        const gastosExtra = this.calculationService.calcularGastosExtraConTC(
            valores.valorPropiedad, 
            valores.provincia, 
            nuevoTC
        );
        
        // Recalcular valores totales
        const valorCasaPesos = valores.valorPropiedad * nuevoTC;
        const totalOperacion = valorCasaPesos + gastosExtra.total;
        
        // Actualizar gastos detallados en el CORE
        this.actualizarGastosDetallados(gastosExtra, nuevoTC);
        
        // Actualizar escenarios de tipo de cambio
        this.actualizarEscenariosTipoCambio(valores, totalOperacion, gastosExtra);
        
        // Actualizar diferencia a cubrir
        this.actualizarDiferenciaACubrir(totalOperacion, valores.montoPrestamo, nuevoTC);
        
        // Actualizar equivalencia del monto prestado en USD
        this.actualizarEquivalenciaMontoPrestado(valores.montoPrestamo, nuevoTC);
        
        // Actualizar primera cuota en USD
        this.actualizarPrimeraCuotaUSD(valores, nuevoTC);
        
        // Actualizar total a pagar en USD
        this.actualizarTotalPagarUSD(totalOperacion, nuevoTC);
        
        console.log('CORE recalculado con TC:', nuevoTC);
    }

    /**
     * Obtiene los datos de entrada del formulario
     */
    obtenerDatosEntrada() {
        return {
            valorPropiedad: this.utilityService.parsearNumero(document.getElementById('valorPropiedad')?.value, 0),
            provincia: document.getElementById('provincia')?.value || 'CABA',
            montoPrestamo: this.utilityService.parsearNumero(document.getElementById('montoPrestamo')?.value, 0),
            plazo: parseInt(document.getElementById('plazo')?.value) || 20,
            tasaInteres: this.utilityService.parsearNumero(document.getElementById('tasaInteres')?.value, 8.5)
        };
    }

    /**
     * Actualiza gastos detallados en el CORE
     */
    actualizarGastosDetallados(gastosExtra, tipoCambio) {
        // Escritura
        this.utilityService.setLineaMoneda('gastoEscrituraARS', 'ARS', gastosExtra.escritura);
        this.utilityService.setLineaMoneda('gastoEscrituraUSD', 'USD', gastosExtra.escritura / tipoCambio);
        
        // Inmobiliaria
        this.utilityService.setLineaMoneda('gastoInmobiliariaARS', 'ARS', gastosExtra.inmobiliaria);
        this.utilityService.setLineaMoneda('gastoInmobiliariaUSD', 'USD', gastosExtra.inmobiliaria / tipoCambio);
        
        // Firmas
        this.utilityService.setLineaMoneda('gastoFirmasARS', 'ARS', gastosExtra.firmas);
        this.utilityService.setLineaMoneda('gastoFirmasUSD', 'USD', gastosExtra.firmas / tipoCambio);
        
        // Sellos
        this.utilityService.setLineaMoneda('gastoSellosARS', 'ARS', gastosExtra.sellos);
        this.utilityService.setLineaMoneda('gastoSellosUSD', 'USD', gastosExtra.sellos / tipoCambio);
        
        // Total gastos
        this.utilityService.setLineaMoneda('gastosTotalARS', 'ARS', gastosExtra.total, true);
        this.utilityService.setLineaMoneda('gastosTotalUSD', 'USD', gastosExtra.total / tipoCambio, true);
    }

    /**
     * Actualiza escenarios de tipo de cambio
     */
    actualizarEscenariosTipoCambio(valores, totalOperacion, gastosExtra) {
        const bandasInfo = this.exchangeRateService.calcularBandasCambiarias();
        
        // Escenario Piso (mejor caso)
        this.actualizarEscenarioPiso(valores, totalOperacion, gastosExtra, bandasInfo.piso);
        
        // Escenario Oficial (caso base)
        this.actualizarEscenarioOficial(valores, totalOperacion, gastosExtra);
        
        // Escenario Techo (peor caso)
        this.actualizarEscenarioTecho(valores, totalOperacion, gastosExtra, bandasInfo.techo);
    }

    /**
     * Actualiza el escenario piso
     */
    actualizarEscenarioPiso(valores, totalOperacion, gastosExtra, tcPiso) {
        const valorTotalUSD = valores.valorPropiedad + gastosExtra.total;
        const totalPisoPesos = valorTotalUSD * tcPiso;
        
        this.utilityService.setLineaMoneda('totalPisoARS', 'ARS', totalPisoPesos);
        this.utilityService.setLineaMoneda('totalPisoUSD', 'USD', valorTotalUSD);
        
        this.utilityService.setLineaMoneda('prestamoPisoARS', 'ARS', valores.montoPrestamo);
        this.utilityService.setLineaMoneda('prestamoPisoUSD', 'USD', valores.montoPrestamo / tcPiso);
        
        const diferenciaPisoPesos = totalPisoPesos - valores.montoPrestamo;
        this.utilityService.setLineaMoneda('diferenciaPisoARS', 'ARS', diferenciaPisoPesos);
        this.utilityService.setLineaMoneda('diferenciaPisoUSD', 'USD', diferenciaPisoPesos / this.exchangeRateService.getTipoCambioOficial());
    }

    /**
     * Actualiza el escenario oficial
     */
    actualizarEscenarioOficial(valores, totalOperacion, gastosExtra) {
        const tcOficial = this.exchangeRateService.getTipoCambioOficial();
        const valorTotalUSD = valores.valorPropiedad + gastosExtra.total;
        const totalOficialPesos = valorTotalUSD * tcOficial;
        
        this.utilityService.setLineaMoneda('totalOficialARS', 'ARS', totalOficialPesos);
        this.utilityService.setLineaMoneda('totalOficialUSD', 'USD', valorTotalUSD);
        
        this.utilityService.setLineaMoneda('prestamoOficialARS', 'ARS', valores.montoPrestamo);
        this.utilityService.setLineaMoneda('prestamoOficialUSD', 'USD', valores.montoPrestamo / tcOficial);
        
        const diferenciaOficialPesos = totalOficialPesos - valores.montoPrestamo;
        this.utilityService.setLineaMoneda('diferenciaOficialARS', 'ARS', diferenciaOficialPesos);
        this.utilityService.setLineaMoneda('diferenciaOficialUSD', 'USD', diferenciaOficialPesos / tcOficial);
    }

    /**
     * Actualiza el escenario techo
     */
    actualizarEscenarioTecho(valores, totalOperacion, gastosExtra, tcTecho) {
        const valorTotalUSD = valores.valorPropiedad + gastosExtra.total;
        const totalTechoPesos = valorTotalUSD * tcTecho;
        
        this.utilityService.setLineaMoneda('totalTechoARS', 'ARS', totalTechoPesos);
        this.utilityService.setLineaMoneda('totalTechoUSD', 'USD', valorTotalUSD);
        
        this.utilityService.setLineaMoneda('prestamoTechoARS', 'ARS', valores.montoPrestamo);
        this.utilityService.setLineaMoneda('prestamoTechoUSD', 'USD', valores.montoPrestamo / tcTecho);
        
        const diferenciaTechoPesos = totalTechoPesos - valores.montoPrestamo;
        this.utilityService.setLineaMoneda('diferenciaTechoARS', 'ARS', diferenciaTechoPesos);
        this.utilityService.setLineaMoneda('diferenciaTechoUSD', 'USD', diferenciaTechoPesos / this.exchangeRateService.getTipoCambioOficial());
    }

    /**
     * Actualiza la diferencia a cubrir
     */
    actualizarDiferenciaACubrir(totalOperacion, montoPrestamo, tipoCambio) {
        const diferenciaACubrir = totalOperacion - montoPrestamo;
        const diferenciaACubrirUSD = diferenciaACubrir / tipoCambio;
        
        const diferenciaElement = document.getElementById('diferenciaACubrir');
        const diferenciaUSDElement = document.getElementById('diferenciaACubrirUSD');
        
        if (diferenciaElement) {
            diferenciaElement.textContent = this.utilityService.formatearARS(diferenciaACubrir);
        }
        
        if (diferenciaUSDElement) {
            diferenciaUSDElement.textContent = `USD $${this.utilityService.formatearUSD(diferenciaACubrirUSD)}`;
        }
    }

    /**
     * Actualiza la equivalencia del monto prestado en USD
     */
    actualizarEquivalenciaMontoPrestado(montoPrestamo, tipoCambio) {
        const montoPrestamoUSD = montoPrestamo / tipoCambio;
        const elemento = document.getElementById('montoPrestamoBancoUSD');
        
        if (elemento) {
            elemento.textContent = `USD $${this.utilityService.formatearUSD(montoPrestamoUSD)}`;
        }
    }

    /**
     * Actualiza la primera cuota en USD
     */
    actualizarPrimeraCuotaUSD(valores, tipoCambio) {
        const primeraCuota = this.calculationService.calcularCuotaInicial(
            valores.montoPrestamo, 
            valores.tasaInteres, 
            valores.plazo
        );
        const primeraCuotaUSD = primeraCuota / tipoCambio;
        
        const elemento = document.getElementById('primeraCuotaUSD');
        if (elemento) {
            elemento.textContent = `USD $${this.utilityService.formatearUSD(primeraCuotaUSD)}`;
        }
    }

    /**
     * Actualiza el total a pagar en USD
     */
    actualizarTotalPagarUSD(totalOperacion, tipoCambio) {
        const totalPagarUSD = totalOperacion / tipoCambio;
        const elemento = document.getElementById('totalPagarUSD');
        
        if (elemento) {
            elemento.innerHTML = `<strong>USD $${this.utilityService.formatearUSD(totalPagarUSD)}</strong>`;
        }
    }

    /**
     * Actualiza estado visual de sugerencias
     */
    actualizarEstadoSugerencias() {
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
                    valorComparar = this.exchangeRateService.getTipoCambioOficial();
                    break;
                case 'piso':
                    valorComparar = this.exchangeRateService.calcularPisoBandaCambiaria().piso;
                    break;
                case 'techo':
                    valorComparar = this.exchangeRateService.calcularBandasCambiarias().techo;
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

    /**
     * Valida el tipo de cambio contra las bandas cambiarias
     */
    validarTipoCambioConBandas(valorTC) {
        const validacion = this.exchangeRateService.validarTipoCambioConBandas(valorTC);
        
        if (validacion.mensaje) {
            this.mostrarConsejoBanda(validacion.mensaje, validacion.tipo);
        }
    }

    /**
     * Muestra consejo sobre bandas cambiarias
     */
    mostrarConsejoBanda(mensaje, tipo) {
        const tipsContainer = document.getElementById('tipsDinamicos');
        if (!tipsContainer) return;
        
        // Limpiar consejos previos sobre bandas
        const bandaTips = tipsContainer.querySelectorAll('[data-tipo="banda-tc"]');
        bandaTips.forEach(tip => tip.remove());
        
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

    /**
     * Configura sliders de plazo y tasa
     */
    configurarSliders() {
        const plazoSlider = document.getElementById('plazo');
        const plazoValor = document.getElementById('plazoValor');
        const tasaSlider = document.getElementById('tasaInteres');
        const tasaValor = document.getElementById('tasaValor');
        
        if (plazoSlider && plazoValor) {
            let previousPlazo = plazoSlider.value;
            plazoSlider.addEventListener('input', (e) => {
                plazoValor.textContent = e.target.value;
                
                // Recalcular después de un delay para mejor performance
                clearTimeout(this.plazoTimeout);
                this.plazoTimeout = setTimeout(() => {
                    this.recalcularCoreConNuevoTC(this.exchangeRateService.getTipoCambioSimulador());
                }, 300);
                
                previousPlazo = e.target.value;
            });
        }
        
        if (tasaSlider && tasaValor) {
            let previousTasa = tasaSlider.value;
            tasaSlider.addEventListener('input', (e) => {
                tasaValor.textContent = e.target.value;
                
                // Recalcular después de un delay para mejor performance
                clearTimeout(this.tasaTimeout);
                this.tasaTimeout = setTimeout(() => {
                    this.recalcularCoreConNuevoTC(this.exchangeRateService.getTipoCambioSimulador());
                }, 300);
                
                previousTasa = e.target.value;
            });
        }
    }

    /**
     * Actualiza las bandas en la interfaz
     */
    actualizarBandasEnInterfaz() {
        const elementos = {
            oficial: document.getElementById('tcOficial'),
            piso: document.getElementById('tcPiso'),
            techo: document.getElementById('tcTecho')
        };
        
        // Calcular ambas bandas dinámicamente
        const bandasInfo = this.exchangeRateService.calcularBandasCambiarias();
        
        if (elementos.oficial) {
            elementos.oficial.textContent = this.utilityService.formatearPesos(this.exchangeRateService.getTipoCambioOficial());
        }
        
        if (elementos.piso) {
            elementos.piso.textContent = this.utilityService.formatearPesos(bandasInfo.piso);
        }
        
        if (elementos.techo) {
            elementos.techo.textContent = this.utilityService.formatearPesos(bandasInfo.techo);
        }
        
        console.log('Bandas cambiarias configuradas:', {
            piso: bandasInfo.piso,
            techo: bandasInfo.techo,
            ancho: bandasInfo.techo - bandasInfo.piso,
            mesesTranscurridos: bandasInfo.mesesTranscurridos
        });
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimulatorController;
} else {
    window.SimulatorController = SimulatorController;
}
