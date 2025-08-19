// Configuración de Privacidad y Cookies - Separado de la presentación
// Este archivo maneja toda la lógica de consentimiento y privacidad

class PrivacyManager {
    constructor() {
        this.cookieName = 'analytics_consent';
        this.cookieExpiry = 365; // días
        this.isConsentRequired = this.shouldRequestConsent();
        
        this.init();
    }

    init() {
        // Verificar si ya existe consentimiento
        const existingConsent = this.getStoredConsent();
        
        if (existingConsent === null && this.isConsentRequired) {
            // Mostrar banner de cookies si es necesario
            this.showConsentBanner();
        } else if (existingConsent === 'accepted') {
            // Habilitar analytics si ya se aceptó
            this.enableAnalytics();
        }
        
        // Configurar botón de gestión de privacidad (si existe)
        this.setupPrivacyControls();
    }

    shouldRequestConsent() {
        // Detectar si el usuario está en la UE/EEA (GDPR) o California (CCPA)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language || navigator.languages[0];
        
        // Lista simplificada de zonas que requieren consentimiento
        const gdprZones = [
            'Europe/Madrid', 'Europe/Berlin', 'Europe/Paris', 'Europe/Rome',
            'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Prague',
            'Europe/Warsaw', 'Europe/Budapest', 'Europe/Stockholm', 'Europe/Helsinki',
            'Europe/Copenhagen', 'Europe/Oslo', 'Europe/Dublin', 'Europe/Lisbon',
            'Europe/Athens', 'Europe/Bucharest', 'Europe/Sofia', 'Europe/Zagreb',
            'Europe/Ljubljana', 'Europe/Bratislava', 'Europe/Tallinn', 'Europe/Riga',
            'Europe/Vilnius', 'Europe/Luxembourg', 'Europe/Malta', 'Europe/Nicosia'
        ];

        const ccpaZones = ['America/Los_Angeles', 'America/San_Francisco'];
        
        return gdprZones.includes(timezone) || 
               ccpaZones.includes(timezone) || 
               language.startsWith('de') || 
               language.startsWith('fr') || 
               language.startsWith('it') ||
               language.startsWith('es-ES'); // España, no Argentina
    }

    getStoredConsent() {
        try {
            const cookie = document.cookie
                .split('; ')
                .find(row => row.startsWith(this.cookieName + '='));
            
            if (cookie) {
                return cookie.split('=')[1];
            }
            
            // También verificar localStorage como fallback
            return localStorage.getItem(this.cookieName);
        } catch (e) {
            return null;
        }
    }

    setConsent(consent) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.cookieExpiry);
        
        try {
            // Guardar en cookie
            document.cookie = `${this.cookieName}=${consent}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
            
            // Guardar en localStorage como backup
            localStorage.setItem(this.cookieName, consent);
            localStorage.setItem(this.cookieName + '_date', new Date().toISOString());
        } catch (e) {
            console.warn('No se pudo guardar el consentimiento');
        }
    }

    showConsentBanner() {
        // Solo mostrar si no existe ya el banner
        if (document.getElementById('cookie-consent-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #2563eb;
            color: white;
            padding: 16px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
        `;

        banner.innerHTML = `
            <div style="flex: 1; min-width: 300px;">
                <strong>🍪 Usamos Google Analytics</strong><br>
                Para mejorar tu experiencia, analizamos cómo usas nuestra calculadora. 
                No compartimos datos personales.
                <a href="#" id="privacy-details" style="color: #93c5fd; text-decoration: underline;">Más información</a>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button id="reject-analytics" style="
                    background: transparent;
                    border: 1px solid white;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">Solo necesarias</button>
                <button id="accept-analytics" style="
                    background: #10b981;
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                ">Aceptar todo</button>
            </div>
        `;

        document.body.appendChild(banner);

        // Event listeners
        document.getElementById('accept-analytics').addEventListener('click', () => {
            this.setConsent('accepted');
            this.enableAnalytics();
            this.hideBanner();
        });

        document.getElementById('reject-analytics').addEventListener('click', () => {
            this.setConsent('rejected');
            this.disableAnalytics();
            this.hideBanner();
        });

        document.getElementById('privacy-details').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacyDetails();
        });
    }

    hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => banner.remove(), 300);
        }
    }

    showPrivacyDetails() {
        const modal = document.createElement('div');
        modal.id = 'privacy-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 8px;
                padding: 24px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button id="close-privacy-modal" style="
                    position: absolute;
                    top: 12px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                ">×</button>
                
                <h2 style="margin-top: 0; color: #1f2937;">🔒 Tu Privacidad es Importante</h2>
                
                <h3 style="color: #374151;">¿Qué datos recopilamos?</h3>
                <ul style="color: #6b7280;">
                    <li><strong>Datos de uso:</strong> Qué campos completas, qué sliders mueves</li>
                    <li><strong>Datos técnicos:</strong> Tipo de dispositivo, navegador, tiempo en la página</li>
                    <li><strong>Rendimiento:</strong> Velocidad de carga, errores técnicos</li>
                </ul>

                <h3 style="color: #374151;">¿Qué NO recopilamos?</h3>
                <ul style="color: #6b7280;">
                    <li>❌ Nombres, emails, o datos personales</li>
                    <li>❌ Números de teléfono o direcciones</li>
                    <li>❌ Información financiera real</li>
                    <li>❌ Datos de otras páginas web que visitas</li>
                </ul>

                <h3 style="color: #374151;">¿Para qué lo usamos?</h3>
                <ul style="color: #6b7280;">
                    <li>✅ Mejorar la calculadora (qué funciones son más útiles)</li>
                    <li>✅ Detectar y corregir errores</li>
                    <li>✅ Entender qué consejos son más valorados</li>
                    <li>✅ Optimizar la velocidad de la página</li>
                </ul>

                <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 6px;">
                    <p style="margin: 0; color: #374151; font-size: 14px;">
                        <strong>Compromiso:</strong> Todos los datos se procesan de forma anónima a través de Google Analytics 4 
                        con las configuraciones de privacidad más estrictas habilitadas.
                    </p>
                </div>

                <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="modal-reject" style="
                        background: #e5e7eb;
                        border: none;
                        color: #374151;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Solo necesarias</button>
                    <button id="modal-accept" style="
                        background: #2563eb;
                        border: none;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Aceptar analytics</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners para el modal
        document.getElementById('close-privacy-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('modal-accept').addEventListener('click', () => {
            this.setConsent('accepted');
            this.enableAnalytics();
            this.hideBanner();
            modal.remove();
        });

        document.getElementById('modal-reject').addEventListener('click', () => {
            this.setConsent('rejected');
            this.disableAnalytics();
            this.hideBanner();
            modal.remove();
        });

        // Cerrar al hacer click fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    enableAnalytics() {
        // Habilitar analytics si la clase está disponible
        if (window.calculadoraAnalytics) {
            window.calculadoraAnalytics.enable();
        }
        
        // Configurar gtag con consentimiento
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
        
        console.log('Analytics habilitado con consentimiento del usuario');
    }

    disableAnalytics() {
        // Deshabilitar analytics
        if (window.calculadoraAnalytics) {
            window.calculadoraAnalytics.disable();
        }
        
        // Configurar gtag sin consentimiento
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
        
        console.log('Analytics deshabilitado por elección del usuario');
    }

    setupPrivacyControls() {
        // Buscar botón de configuración de privacidad si existe
        const privacyButton = document.getElementById('privacy-settings');
        if (privacyButton) {
            privacyButton.addEventListener('click', () => {
                this.showPrivacyDetails();
            });
        }
    }

    // Método público para cambiar configuración
    changeConsentStatus() {
        const currentConsent = this.getStoredConsent();
        if (currentConsent === 'accepted') {
            this.setConsent('rejected');
            this.disableAnalytics();
            alert('Analytics deshabilitado. Se requerirá recarga de página para aplicar todos los cambios.');
        } else {
            this.setConsent('accepted');
            this.enableAnalytics();
            alert('Analytics habilitado. ¡Gracias por ayudarnos a mejorar!');
        }
    }

    // Verificar estado actual
    getConsentStatus() {
        return this.getStoredConsent();
    }
}

// Inicializar gestión de privacidad
let privacyManager = null;

document.addEventListener('DOMContentLoaded', function() {
    privacyManager = new PrivacyManager();
    
    // Hacer disponible globalmente
    window.privacyManager = privacyManager;
    
    console.log('Gestión de privacidad inicializada');
});

// Configurar consentimiento inicial para gtag (antes de que se cargue)
if (typeof gtag !== 'undefined') {
    gtag('consent', 'default', {
        'analytics_storage': 'denied'
    });
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacyManager;
}
