/**
 * Archivo principal de la aplicación
 * Inicializa todos los controladores y servicios
 */

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación de calculadora hipotecaria...');
    
    try {
        // Inicializar controlador principal
        const calculatorController = new CalculatorController();
        
        // Inicializar controlador del simulador
        const simulatorController = new SimulatorController(
            calculatorController.exchangeRateService,
            calculatorController.calculationService,
            calculatorController.utilityService
        );
        
        // Configurar sliders de gastos
        configurarSlidersGastos();
        
        // Configurar FAQ
        configurarFAQ();
        
        // Configurar checklist
        configurarChecklist();
        
        console.log('✅ Aplicación inicializada correctamente');
        
        // Exponer controladores globalmente para debugging
        window.app = {
            calculatorController,
            simulatorController
        };
        
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
    }
});

/**
 * Configura los sliders de gastos
 */
function configurarSlidersGastos() {
    const tiposGasto = ['escritura', 'inmobiliaria', 'firmas', 'sellos'];
    
    tiposGasto.forEach(tipo => {
        const input = document.getElementById(tipo + 'Slider');
        
        if (input) {
            // Evento para cambios inmediatos
            input.addEventListener('input', function() {
                const nuevoValor = parseFloat(this.value) || 0;
                
                // Validar rango
                if (nuevoValor < 0) this.value = 0;
                if (nuevoValor > 10) this.value = 10;
                
                // Actualizar valor intermedio para la provincia actual
                const provinciaActual = document.getElementById('provincia')?.value || 'CABA';
                if (window.app?.calculatorController?.calculationService) {
                    window.app.calculatorController.calculationService.actualizarValorIntermedio(tipo, parseFloat(this.value), provinciaActual);
                }
                
                // Agregar feedback visual inmediato
                this.classList.add('updating');
                
                // Recalcular con delay para mejor performance
                clearTimeout(this.gastoTimeout);
                this.gastoTimeout = setTimeout(() => {
                    if (window.app?.calculatorController) {
                        window.app.calculatorController.calcularTodo();
                    }
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
                
                // Feedback visual de confirmación
                this.classList.add('confirmed');
                setTimeout(() => {
                    this.classList.remove('confirmed');
                }, 1000);
            });
            
            // Evento para focus - mejorar la experiencia visual
            input.addEventListener('focus', function() {
                this.closest('.gasto-item')?.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.closest('.gasto-item')?.classList.remove('focused');
            });
        }
    });
}

/**
 * Configura el sistema de FAQ
 */
function configurarFAQ() {
    // Ocultar todas las respuestas por defecto
    const faqAnswers = document.querySelectorAll('.faq-answer');
    faqAnswers.forEach(answer => {
        answer.style.display = 'none';
    });
    
    // Agregar event listeners para toggle
    const faqToggles = document.querySelectorAll('.faq-toggle');
    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const answer = faqItem.querySelector('.faq-answer');
            
            // Toggle de la respuesta
            if (answer.style.display === 'block') {
                answer.style.display = 'none';
                this.textContent = '+';
                faqItem.classList.remove('active');
            } else {
                answer.style.display = 'block';
                this.textContent = '−';
                faqItem.classList.add('active');
            }
        });
    });
}

/**
 * Configura el sistema de checklist
 */
function configurarChecklist() {
    // Esta función se puede implementar para manejar el checklist de preparación
    console.log('Checklist configurado');
}

/**
 * Función para manejar el toggle de las FAQ (mantener compatibilidad)
 */
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

/**
 * Función para mostrar tips dinámicos (mantener compatibilidad)
 */
function mostrarTipsDinamicos(resultados) {
    const tipsContainer = document.getElementById('tipsDinamicos');
    if (!tipsContainer) return;
    
    // Limpiar tips anteriores
    tipsContainer.innerHTML = '';
    
    // Obtener datos del formulario
    const valorPropiedad = parseFloat(document.getElementById('valorPropiedad')?.value) || 0;
    const montoPrestamo = parseFloat(document.getElementById('montoPrestamo')?.value) || 0;
    const provincia = document.getElementById('provincia')?.value || 'CABA';
    
    if (!valorPropiedad || !montoPrestamo) return;
    
    // Generar tips basados en los datos
    generarTipsBasadosEnDatos(valorPropiedad, montoPrestamo, provincia, resultados);
}

/**
 * Genera tips basados en los datos del formulario
 */
function generarTipsBasadosEnDatos(valorPropiedad, montoPrestamo, provincia, resultados) {
    const tipsContainer = document.getElementById('tipsDinamicos');
    if (!tipsContainer) return;
    
    // 1. Tip sobre cuota vs ingresos
    if (resultados?.cuotaInicial) {
        const cuota = resultados.cuotaInicial;
        const ingresoRecomendado = cuota / 0.25;
        
        if (ingresoRecomendado > 400000) {
            const tipCuota = document.createElement('div');
            tipCuota.className = 'tip-card warning';
            tipCuota.innerHTML = `
                <span class="tip-icon">⚠️</span>
                <div class="tip-content">
                    <strong>Cuota alta detectada</strong>
                    <p>Para esta cuota necesitás ingresos de al menos ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ingresoRecomendado)} por mes. Considerá ajustar el monto o plazo del crédito.</p>
                </div>
            `;
            tipsContainer.appendChild(tipCuota);
        }
    }
    
    // 2. Tip sobre riesgo cambiario
    if (window.app?.calculatorController?.exchangeRateService) {
        const bandasInfo = window.app.calculatorController.exchangeRateService.calcularBandasCambiarias();
        const diferenciaTC = bandasInfo.techo - bandasInfo.piso;
        const porcentajeDiferencia = ((diferenciaTC / window.app.calculatorController.exchangeRateService.getTipoCambioOficial()) * 100).toFixed(1);
        
        if (porcentajeDiferencia > 30) {
            const tipRiesgo = document.createElement('div');
            tipRiesgo.className = 'tip-card danger';
            tipRiesgo.innerHTML = `
                <span class="tip-icon">🚨</span>
                <div class="tip-content">
                    <strong>Alto riesgo cambiario</strong>
                    <p>La banda cambiaria tiene ${porcentajeDiferencia}% de variación. Planificá con el escenario más desfavorable.</p>
                </div>
            `;
            tipsContainer.appendChild(tipRiesgo);
        }
    }
    
    // 3. Tip sobre gastos específicos de la provincia
    if (window.app?.calculatorController?.calculationService) {
        const gastosConfig = window.app.calculatorController.calculationService.getGastosConfig(provincia);
        if (gastosConfig) {
            const gastosPorcentaje = (gastosConfig.escritura.intermedio + gastosConfig.inmobiliaria.intermedio).toFixed(1);
            if (parseFloat(gastosPorcentaje) > 5) {
                const tipGastos = document.createElement('div');
                tipGastos.className = 'tip-card info';
                tipGastos.innerHTML = `
                    <span class="tip-icon">💡</span>
                    <div class="tip-content">
                        <strong>Gastos altos en ${provincia}</strong>
                        <p>Los gastos de escritura e inmobiliaria representan ${gastosPorcentaje}% del valor de la casa. Considerá esto en tu presupuesto.</p>
                    </div>
                `;
                tipsContainer.appendChild(tipGastos);
            }
        }
    }
}

/**
 * Función para actualizar el checklist (mantener compatibilidad)
 */
function actualizarChecklist(datos, resultados) {
    if (!datos || !resultados) return;
    
    const checklistItems = [
        { id: 'check1', condition: () => {
            const cuota = resultados.primeraCuota;
            const ingresoRecomendado = cuota / 0.25;
            return ingresoRecomendado <= 1000000;
        }},
        { id: 'check2', condition: () => {
            return datos.valorPropiedad > 0 && datos.montoPrestamo > 0;
        }},
        { id: 'check3', condition: () => {
            return true; // Simplificado por ahora
        }},
        { id: 'check4', condition: () => {
            const cuota = resultados.primeraCuota;
            const reservaEmergencia = cuota * 6;
            return reservaEmergencia > 0;
        }},
        { id: 'check5', condition: () => {
            return true; // Simplificado por ahora
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

// Exportar funciones para uso global
window.toggleFAQ = toggleFAQ;
window.mostrarTipsDinamicos = mostrarTipsDinamicos;
window.actualizarChecklist = actualizarChecklist;
