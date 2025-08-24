/**
 * Servicio de tipos de cambio
 * Maneja cotizaciones, bandas cambiarias y escenarios
 */
class ExchangeRateService {
    constructor() {
        this.tiposCambio = {
            oficial: 1301,     // Dólar oficial (se actualiza automáticamente)
            simulador: 1301,   // Dólar del simulador (controlado por el slider)
            techo: 1400,       // Dólar alto (techo de banda) - BASE (abril 2025)
            piso: 1000         // Dólar bajo (piso de banda) - BASE (abril 2025)
        };
        
        this.fechaBase = new Date('2025-04-01'); // Abril 2025
    }

    /**
     * Obtiene la cotización oficial del día
     */
    async obtenerCotizacionOficial() {
        try {
            // Intentar obtener de cache primero
            const cotizacionCacheada = this.obtenerCotizacionDeCache();
            if (cotizacionCacheada) {
                this.aplicarCotizacion(cotizacionCacheada.valor, cotizacionCacheada.fuente);
                return {
                    valor: cotizacionCacheada.valor,
                    fuente: cotizacionCacheada.fuente,
                    fecha: cotizacionCacheada.fecha
                };
            }

            // Intentar API del BCRA (oficial) - buscar en los últimos 7 días
            const cotizacionBCRA = await this.obtenerCotizacionBCRA();
            if (cotizacionBCRA) {
                this.aplicarCotizacion(cotizacionBCRA.valor, cotizacionBCRA.fuente);
                this.guardarCotizacionEnCache(cotizacionBCRA.valor, cotizacionBCRA.fuente);
                return cotizacionBCRA;
            }

            // Fallback: API alternativa (DolarApi.com)
            const cotizacionAlternativa = await this.obtenerCotizacionAlternativa();
            if (cotizacionAlternativa) {
                this.aplicarCotizacion(cotizacionAlternativa.valor, cotizacionAlternativa.fuente);
                this.guardarCotizacionEnCache(cotizacionAlternativa.valor, cotizacionAlternativa.fuente);
                return cotizacionAlternativa;
            }

            // Si todo falla, usar valores por defecto
            throw new Error('Todas las APIs fallaron');
            
        } catch (error) {
            console.log('No se pudo obtener la cotización oficial, usando valor por defecto');
            
            // Si falla, usar valores por defecto actualizados
            this.aplicarCotizacion(1301, 'Valor por defecto');
            return {
                valor: 1301,
                fuente: 'Valor por defecto',
                fecha: new Date().toISOString().split('T')[0]
            };
        }
    }

    /**
     * Intenta obtener cotización del BCRA
     */
    async obtenerCotizacionBCRA() {
        try {
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fechaHasta = today.toISOString().split('T')[0];
            const fechaDesde = weekAgo.toISOString().split('T')[0];
            
            const bcraUrl = `https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
            
            const response = await fetch(bcraUrl);
            const data = await response.json();
            
            if (data && data.results && data.results.length > 0) {
                const ultimoResultado = data.results[0];
                if (ultimoResultado.detalle && ultimoResultado.detalle[0]) {
                    const cotizacionBCRA = ultimoResultado.detalle[0].tipoCotizacion;
                    const fechaCotizacion = ultimoResultado.fecha;
                    
                    if (cotizacionBCRA && cotizacionBCRA > 0) {
                        console.log(`Cotización BCRA obtenida: $${cotizacionBCRA} (fecha: ${fechaCotizacion})`);
                        return {
                            valor: cotizacionBCRA,
                            fuente: 'BCRA',
                            fecha: fechaCotizacion
                        };
                    }
                }
            }
        } catch (error) {
            console.log('API del BCRA no disponible:', error.message);
        }
        
        return null;
    }

    /**
     * Intenta obtener cotización de API alternativa
     */
    async obtenerCotizacionAlternativa() {
        try {
            const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
            const data = await response.json();
            
            if (data && data.venta) {
                const valor = parseFloat(data.venta);
                console.log(`Cotización alternativa obtenida: $${valor}`);
                return {
                    valor: valor,
                    fuente: 'API alternativa',
                    fecha: new Date().toISOString().split('T')[0]
                };
            }
        } catch (error) {
            console.log('API alternativa también falló:', error.message);
        }
        
        return null;
    }

    /**
     * Aplica una cotización obtenida
     */
    aplicarCotizacion(valor, fuente) {
        this.tiposCambio.oficial = valor;
        this.tiposCambio.simulador = valor;
        console.log(`Cotización obtenida de ${fuente}: $${valor}`);
        console.log(`Bandas fijas: Piso $${this.tiposCambio.piso}, Techo $${this.tiposCambio.techo}`);
    }

    /**
     * Obtiene cotización desde cache
     */
    obtenerCotizacionDeCache() {
        try {
            const cache = localStorage.getItem('cotizacion_cache');
            if (!cache) return null;
            
            const datos = JSON.parse(cache);
            const ahora = new Date();
            const fechaCache = new Date(datos.timestamp);
            
            // Cache válido por 1 hora
            const horasTranscurridas = (ahora - fechaCache) / (1000 * 60 * 60);
            
            if (horasTranscurridas < 1) {
                console.log(`Usando cotización desde cache (${datos.fuente}): $${datos.valor}`);
                return datos;
            }
            
            // Cache expirado
            localStorage.removeItem('cotizacion_cache');
            return null;
            
        } catch (error) {
            console.log('Error al leer cache:', error);
            localStorage.removeItem('cotizacion_cache');
            return null;
        }
    }

    /**
     * Guarda cotización en cache
     */
    guardarCotizacionEnCache(valor, fuente) {
        try {
            const datos = {
                valor: valor,
                fuente: fuente,
                fecha: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('cotizacion_cache', JSON.stringify(datos));
            console.log(`Cotización guardada en cache: $${valor} (${fuente})`);
            
        } catch (error) {
            console.log('Error al guardar en cache:', error);
        }
    }

    /**
     * Calcula las bandas cambiarias (piso baja 1%, techo sube 1% por mes desde abril 2025)
     */
    calcularBandasCambiarias() {
        const fechaActual = new Date();
        
        // Calcular meses transcurridos desde abril 2025
        const mesesTranscurridos = (fechaActual.getFullYear() - this.fechaBase.getFullYear()) * 12 + 
                                   (fechaActual.getMonth() - this.fechaBase.getMonth());
        
        // El piso baja 1% por mes
        const factorReduccionPiso = Math.pow(0.99, Math.max(0, mesesTranscurridos));
        const pisoCalculado = Math.round(this.tiposCambio.piso * factorReduccionPiso);
        
        // El techo sube 1% por mes
        const factorIncrementoTecho = Math.pow(1.01, Math.max(0, mesesTranscurridos));
        const techoCalculado = Math.round(this.tiposCambio.techo * factorIncrementoTecho);
        
        return {
            piso: pisoCalculado,
            techo: techoCalculado,
            mesesTranscurridos: Math.max(0, mesesTranscurridos),
            fechaBase: this.fechaBase.toLocaleDateString('es-AR'),
            fechaActual: fechaActual.toLocaleDateString('es-AR')
        };
    }

    /**
     * Calcula el piso de la banda cambiaria
     */
    calcularPisoBandaCambiaria() {
        const bandas = this.calcularBandasCambiarias();
        return {
            piso: bandas.piso,
            mesesTranscurridos: bandas.mesesTranscurridos,
            fechaBase: bandas.fechaBase,
            fechaActual: bandas.fechaActual
        };
    }

    /**
     * Valida el tipo de cambio contra las bandas cambiarias
     */
    validarTipoCambioConBandas(valorTC) {
        const bandasInfo = this.calcularBandasCambiarias();
        const piso = bandasInfo.piso;
        const techo = bandasInfo.techo;
        const oficial = this.tiposCambio.oficial;
        
        let mensaje = '';
        let tipo = 'info';
        
        if (valorTC > techo) {
            mensaje = `⚠️ Tipo de cambio por encima del techo de banda ($${techo}). Esto podría indicar una devaluación fuerte.`;
            tipo = 'warning';
        } else if (valorTC < piso) {
            mensaje = `📉 Tipo de cambio por debajo del piso de banda ($${piso}). Escenario poco probable según las bandas actuales.`;
            tipo = 'info';
        } else if (Math.abs(valorTC - oficial) / oficial > 0.05) {
            // Si está dentro de la banda pero lejos del oficial (más de 5%)
            const diferencia = ((valorTC - oficial) / oficial * 100).toFixed(1);
            const signo = valorTC > oficial ? '+' : '';
            mensaje = `💱 Simulando ${signo}${diferencia}% respecto al oficial. Dentro de la banda pero considerar el riesgo cambiario.`;
            tipo = 'info';
        }
        
        return { mensaje, tipo, bandas: bandasInfo };
    }

    /**
     * Actualiza el tipo de cambio del simulador
     */
    actualizarTipoCambioSimulador(nuevoTC) {
        this.tiposCambio.simulador = nuevoTC;
    }

    /**
     * Obtiene el tipo de cambio oficial actual
     */
    getTipoCambioOficial() {
        return this.tiposCambio.oficial;
    }

    /**
     * Obtiene el tipo de cambio del simulador
     */
    getTipoCambioSimulador() {
        return this.tiposCambio.simulador;
    }

    /**
     * Obtiene todos los tipos de cambio
     */
    getTiposCambio() {
        return { ...this.tiposCambio };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExchangeRateService;
} else {
    window.ExchangeRateService = ExchangeRateService;
}
