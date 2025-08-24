/**
 * Servicio para manejar el estado de la calculadora en la URL
 * Permite compartir simulaciones y restaurar el estado al cargar la página
 */
class URLStateService {
    constructor() {
        this.paramsToTrack = [
            'monto',
            'plazo', 
            'tasa',
            'provincia',
            'sueldo',
            'valorPropiedad',
            'escritura',
            'inmobiliaria',
            'firmas',
            'sellos'
        ];
    }

    /**
     * Serializa el estado actual de la calculadora a parámetros de URL
     */
    serializeStateToURL(state) {
        try {
            const url = new URL(window.location);
            const params = new URLSearchParams();

            // Agregar parámetros principales
            if (state.monto) params.set('monto', state.monto);
            if (state.plazo) params.set('plazo', state.plazo);
            if (state.tasa) params.set('tasa', state.tasa);
            if (state.provincia) params.set('provincia', state.provincia);
            if (state.sueldo) params.set('sueldo', state.sueldo);
            if (state.valorPropiedad) params.set('valorPropiedad', state.valorPropiedad);

            // Agregar parámetros de gastos
            if (state.escritura) params.set('escritura', state.escritura);
            if (state.inmobiliaria) params.set('inmobiliaria', state.inmobiliaria);
            if (state.firmas) params.set('firmas', state.firmas);
            if (state.sellos) params.set('sellos', state.sellos);

            // Actualizar URL sin recargar la página
            if (params.toString()) {
                url.search = params.toString();
                window.history.replaceState({}, '', url);
                console.log('🔗 Estado serializado a URL:', url.toString());
            }

            return url.toString();
        } catch (error) {
            console.error('❌ Error al serializar estado a URL:', error);
            return window.location.href;
        }
    }

    /**
     * Deserializa el estado desde los parámetros de la URL
     */
    deserializeStateFromURL() {
        try {
            const url = new URL(window.location);
            const params = new URLSearchParams(url.search);
            const state = {};

            // Leer parámetros principales
            if (params.has('monto')) state.monto = parseFloat(params.get('monto'));
            if (params.has('plazo')) state.plazo = parseInt(params.get('plazo'));
            if (params.has('tasa')) state.tasa = parseFloat(params.get('tasa'));
            if (params.has('provincia')) state.provincia = params.get('provincia');
            if (params.has('sueldo')) state.sueldo = parseFloat(params.get('sueldo'));
            if (params.has('valorPropiedad')) state.valorPropiedad = parseFloat(params.get('valorPropiedad'));

            // Leer parámetros de gastos
            if (params.has('escritura')) state.escritura = parseFloat(params.get('escritura'));
            if (params.has('inmobiliaria')) state.inmobiliaria = parseFloat(params.get('inmobiliaria'));
            if (params.has('firmas')) state.firmas = parseFloat(params.get('firmas'));
            if (params.has('sellos')) state.sellos = parseFloat(params.get('sellos'));

            console.log('🔗 Estado deserializado desde URL:', state);
            return state;
        } catch (error) {
            console.error('❌ Error al deserializar estado desde URL:', error);
            return {};
        }
    }

    /**
     * Aplica el estado deserializado a los campos del formulario
     */
    applyStateToForm(state) {
        try {
            // Aplicar valores principales
            if (state.monto && document.getElementById('montoPrestamo')) {
                document.getElementById('montoPrestamo').value = state.monto;
            }
            if (state.plazo && document.getElementById('plazo')) {
                document.getElementById('plazo').value = state.plazo;
                // Actualizar el label del plazo
                const plazoValor = document.getElementById('plazoValor');
                if (plazoValor) plazoValor.textContent = state.plazo;
            }
            if (state.tasa && document.getElementById('tasaInteres')) {
                document.getElementById('tasaInteres').value = state.tasa;
                // Actualizar el label de la tasa
                const tasaValor = document.getElementById('tasaValor');
                if (tasaValor) tasaValor.textContent = state.tasa;
            }
            if (state.provincia && document.getElementById('provincia')) {
                document.getElementById('provincia').value = state.provincia;
            }
            if (state.sueldo && document.getElementById('sueldoMensual')) {
                document.getElementById('sueldoMensual').value = state.sueldo;
            }
            if (state.valorPropiedad && document.getElementById('valorPropiedad')) {
                document.getElementById('valorPropiedad').value = state.valorPropiedad;
            }

            // Aplicar valores de gastos
            if (state.escritura && document.getElementById('escrituraSlider')) {
                document.getElementById('escrituraSlider').value = state.escritura;
            }
            if (state.inmobiliaria && document.getElementById('inmobiliariaSlider')) {
                document.getElementById('inmobiliariaSlider').value = state.inmobiliaria;
            }
            if (state.firmas && document.getElementById('firmasSlider')) {
                document.getElementById('firmasSlider').value = state.firmas;
            }
            if (state.sellos && document.getElementById('sellosSlider')) {
                document.getElementById('sellosSlider').value = state.sellos;
            }

            console.log('✅ Estado aplicado al formulario');
            return true;
        } catch (error) {
            console.error('❌ Error al aplicar estado al formulario:', error);
            return false;
        }
    }

    /**
     * Obtiene el estado actual del formulario
     */
    getCurrentFormState() {
        try {
            const state = {};

            // Obtener valores principales
            const montoInput = document.getElementById('montoPrestamo');
            const plazoInput = document.getElementById('plazo');
            const tasaInput = document.getElementById('tasaInteres');
            const provinciaInput = document.getElementById('provincia');
            const sueldoInput = document.getElementById('sueldoMensual');
            const valorPropiedadInput = document.getElementById('valorPropiedad');

            if (montoInput && montoInput.value) state.monto = parseFloat(montoInput.value);
            if (plazoInput && plazoInput.value) state.plazo = parseInt(plazoInput.value);
            if (tasaInput && tasaInput.value) state.tasa = parseFloat(tasaInput.value);
            if (provinciaInput && provinciaInput.value) state.provincia = provinciaInput.value;
            if (sueldoInput && sueldoInput.value) state.sueldo = parseFloat(sueldoInput.value);
            if (valorPropiedadInput && valorPropiedadInput.value) state.valorPropiedad = parseFloat(valorPropiedadInput.value);

            // Obtener valores de gastos
            const escrituraInput = document.getElementById('escrituraSlider');
            const inmobiliariaInput = document.getElementById('inmobiliariaSlider');
            const firmasInput = document.getElementById('firmasSlider');
            const sellosInput = document.getElementById('sellosSlider');

            if (escrituraInput && escrituraInput.value) state.escritura = parseFloat(escrituraInput.value);
            if (inmobiliariaInput && inmobiliariaInput.value) state.inmobiliaria = parseFloat(inmobiliariaInput.value);
            if (firmasInput && firmasInput.value) state.firmas = parseFloat(firmasInput.value);
            if (sellosInput && sellosInput.value) state.sellos = parseFloat(sellosInput.value);

            return state;
        } catch (error) {
            console.error('❌ Error al obtener estado del formulario:', error);
            return {};
        }
    }

    /**
     * Copia la URL actual con el estado de la simulación al portapapeles
     */
    async copySimulationURL() {
        try {
            const currentState = this.getCurrentFormState();
            const url = this.serializeStateToURL(currentState);
            
            await navigator.clipboard.writeText(url);
            
            // Mostrar feedback visual
            this.showCopyFeedback();
            
            console.log('📋 URL de simulación copiada:', url);
            return url;
        } catch (error) {
            console.error('❌ Error al copiar URL:', error);
            // Fallback para navegadores que no soportan clipboard API
            this.fallbackCopyURL();
        }
    }

    /**
     * Muestra feedback visual cuando se copia la URL
     */
    showCopyFeedback() {
        // Crear o actualizar botón de compartir
        let shareButton = document.getElementById('shareSimulationButton');
        
        if (!shareButton) {
            shareButton = document.createElement('button');
            shareButton.id = 'shareSimulationButton';
            shareButton.className = 'share-button';
            shareButton.innerHTML = '📋 Compartir simulación';
            shareButton.onclick = () => this.copySimulationURL();
            
            // Insertar después del header
            const header = document.querySelector('header');
            if (header) {
                header.appendChild(shareButton);
            }
        }

        // Cambiar temporalmente el texto para confirmar la copia
        const originalText = shareButton.innerHTML;
        shareButton.innerHTML = '✅ ¡Copiado!';
        shareButton.style.background = '#22c55e';
        
        setTimeout(() => {
            shareButton.innerHTML = originalText;
            shareButton.style.background = '';
        }, 2000);
    }

    /**
     * Fallback para copiar URL en navegadores sin clipboard API
     */
    fallbackCopyURL() {
        const currentState = this.getCurrentFormState();
        const url = this.serializeStateToURL(currentState);
        
        // Crear input temporal
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        tempInput.setSelectionRange(0, 99999); // Para dispositivos móviles
        
        try {
            document.execCommand('copy');
            this.showCopyFeedback();
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(tempInput);
    }

    /**
     * Verifica si hay parámetros en la URL al cargar la página
     */
    hasURLParams() {
        const url = new URL(window.location);
        return url.search.length > 0;
    }
}
