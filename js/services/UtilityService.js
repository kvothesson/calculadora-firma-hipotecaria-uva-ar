/**
 * Servicio de utilidades
 * Contiene funciones auxiliares y helpers
 */
class UtilityService {
    constructor() {}

    /**
     * Formatea valores en pesos argentinos
     */
    formatearPesos(valor) {
        if (isNaN(valor) || valor === 0) return '$0';
        
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor);
    }

    /**
     * Formatea números sin símbolo de moneda
     */
    formatearNumero(valor) {
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor);
    }

    /**
     * Formatea valores en USD
     */
    formatearUSD(valor) {
        return this.formatearNumero(valor);
    }

    /**
     * Formatea valores en ARS
     */
    formatearARS(valor) {
        return this.formatearPesos(valor);
    }

    /**
     * Formatea número plano sin símbolo de moneda
     */
    formatearNumeroPlano(valor) {
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor || 0);
    }

    /**
     * Crea línea de texto para ARS
     */
    lineaARS(valor, bold = false) {
        const texto = `ARS ${this.formatearNumeroPlano(valor)}`;
        return bold ? `<strong>${texto}</strong>` : texto;
    }

    /**
     * Crea línea de texto para USD
     */
    lineaUSD(valor, bold = false) {
        const texto = `USD $${this.formatearNumeroPlano(valor)}`;
        return bold ? `<strong>${texto}</strong>` : texto;
    }

    /**
     * Establece línea de moneda en un elemento del DOM
     */
    setLineaMoneda(id, currency, valor, bold = false) {
        const el = document.getElementById(id);
        if (!el) return;
        
        if (currency === 'ARS') {
            el.innerHTML = this.lineaARS(valor, bold);
        } else {
            el.innerHTML = this.lineaUSD(valor, bold);
        }
    }

    /**
     * Convierte valor USD a pesos usando tipo de cambio
     */
    convertirUSDaPesos(valorUSD, tipoCambio) {
        return valorUSD * tipoCambio;
    }

    /**
     * Convierte valor pesos a USD usando tipo de cambio
     */
    convertirPesosaUSD(valorPesos, tipoCambio) {
        return valorPesos / tipoCambio;
    }

    /**
     * Calcula el porcentaje de diferencia entre dos valores
     */
    calcularPorcentajeDiferencia(valor1, valor2) {
        if (valor2 === 0) return 0;
        return ((valor1 - valor2) / valor2 * 100).toFixed(1);
    }

    /**
     * Valida si un valor está dentro de un rango
     */
    estaEnRango(valor, min, max) {
        return valor >= min && valor <= max;
    }

    /**
     * Limita un valor a un rango específico
     */
    limitarEnRango(valor, min, max) {
        return Math.min(Math.max(valor, min), max);
    }

    /**
     * Redondea un número a un número específico de decimales
     */
    redondear(valor, decimales = 2) {
        return Math.round(valor * Math.pow(10, decimales)) / Math.pow(10, decimales);
    }

    /**
     * Formatea fecha en formato argentino
     */
    formatearFecha(fecha) {
        if (typeof fecha === 'string') {
            fecha = new Date(fecha);
        }
        
        return fecha.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Formatea hora en formato argentino
     */
    formatearHora(fecha) {
        if (typeof fecha === 'string') {
            fecha = new Date(fecha);
        }
        
        return fecha.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Genera un ID único
     */
    generarIdUnico() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Debounce function para optimizar performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function para optimizar performance
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Verifica si un elemento existe en el DOM
     */
    elementoExiste(id) {
        return document.getElementById(id) !== null;
    }

    /**
     * Obtiene un elemento del DOM de forma segura
     */
    getElemento(id) {
        return document.getElementById(id) || null;
    }

    /**
     * Verifica si un valor es numérico
     */
    esNumerico(valor) {
        return !isNaN(parseFloat(valor)) && isFinite(valor);
    }

    /**
     * Convierte un valor a número de forma segura
     */
    parsearNumero(valor, valorPorDefecto = 0) {
        const numero = parseFloat(valor);
        return this.esNumerico(numero) ? numero : valorPorDefecto;
    }

    /**
     * Verifica si un valor está vacío o es nulo
     */
    estaVacio(valor) {
        return valor === null || valor === undefined || valor === '' || valor === 0;
    }

    /**
     * Obtiene el valor de un elemento del DOM de forma segura
     */
    obtenerValorElemento(id, valorPorDefecto = '') {
        const elemento = this.getElemento(id);
        return elemento ? elemento.value : valorPorDefecto;
    }

    /**
     * Establece el valor de un elemento del DOM de forma segura
     */
    establecerValorElemento(id, valor) {
        const elemento = this.getElemento(id);
        if (elemento) {
            elemento.value = valor;
        }
    }

    /**
     * Establece el texto de un elemento del DOM de forma segura
     */
    establecerTextoElemento(id, texto) {
        const elemento = this.getElemento(id);
        if (elemento) {
            elemento.textContent = texto;
        }
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UtilityService;
} else {
    window.UtilityService = UtilityService;
}
