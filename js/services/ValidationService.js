/**
 * Servicio de validación
 * Maneja validaciones de campos y formularios
 */
class ValidationService {
    constructor() {
        this.states = new Map();
    }

    /**
     * Valida un campo específico con indicadores sutiles
     */
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
    }

    /**
     * Aplica estado visual al campo
     */
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
    }

    /**
     * Actualiza mensaje sutil del campo
     */
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
    }

    /**
     * Limpia estado de campo
     */
    clearFieldState(element) {
        const formGroup = element.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('field-valid', 'field-warning', 'field-error', 'field-info');
            const messageEl = formGroup.querySelector('.field-message');
            if (messageEl) {
                messageEl.remove();
            }
        }
    }

    /**
     * Obtiene estado de validación general
     */
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
    }

    /**
     * Actualiza indicador global de estado
     */
    updateGlobalStatus() {
        const statusElement = document.getElementById('validation-status');
        const statusText = statusElement?.querySelector('.status-text');
        
        if (!statusElement || !statusText) return;
        
        // Obtener datos del formulario (esto debería venir del controller)
        const overall = this.getOverallValidation();
        
        // Determinar estado y mensaje
        let state = 'hidden';
        let message = '';
        
        // Aquí podríamos recibir los datos del formulario como parámetro
        // Por ahora usamos el estado general de validación
        if (overall === 'error') {
            state = 'warning';
            message = 'Revisá los valores ingresados';
        } else if (overall === 'warning') {
            state = 'warning';
            message = 'Datos listos, revisá las recomendaciones';
        } else if (overall === 'valid') {
            state = 'ready';
            message = 'Todos los datos están completos';
        } else {
            state = 'hidden';
        }
        
        // Aplicar estado
        statusElement.className = `validation-status ${state}`;
        statusText.textContent = message;
    }

    /**
     * Valida datos para consejos (no intrusiva)
     */
    validarDatosParaConsejos(datos) {
        const consejos = [];
        
        // Convertir valor de propiedad a pesos para comparar
        // Esto debería recibir el tipo de cambio como parámetro
        const valorPropiedadPesos = datos.valorPropiedad * 1301; // Valor por defecto
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

    /**
     * Valida que los valores del formulario sean válidos para cálculos
     */
    validarDatosParaCalculos(datos) {
        // Validación básica solo para cálculos, sin interrupciones al usuario
        const isValidValue = datos.valorPropiedad > 0;
        const isValidLoan = datos.montoPrestamo > 0;
        const isValidRate = datos.tasaInteres > 0;
        const isValidTerm = datos.plazo > 0;
        
        // Permitir cálculo si todos los valores básicos están presentes
        return isValidValue && isValidLoan && isValidRate && isValidTerm;
    }

    /**
     * Limpia todos los estados de validación
     */
    clearAllStates() {
        this.states.clear();
        
        // Limpiar estados visuales
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('field-valid', 'field-warning', 'field-error', 'field-info');
            const messageEl = group.querySelector('.field-message');
            if (messageEl) {
                messageEl.remove();
            }
        });
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationService;
} else {
    window.ValidationService = ValidationService;
}
