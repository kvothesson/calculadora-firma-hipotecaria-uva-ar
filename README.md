# 🏠 Calculadora Hipotecaria UVA - Argentina

Una calculadora web simple y completa para ayudarte a calcular tu crédito hipotecario UVA en Argentina, incluyendo todos los gastos extra y diferentes escenarios de tipo de cambio.

## ✨ Características

- **Cálculo automático** de cuotas hipotecarias
- **Gastos extra** por provincia (CABA y Buenos Aires)
- **Escenarios de tipo de cambio** (mejor caso, peor caso)
- **Ajuste UVA** en las proyecciones
- **Diseño responsive** para móvil y desktop
- **Sin dependencias externas** - funciona en cualquier navegador
- **Monto en USD o pesos** - entrada flexible en ambas monedas
- **Cotización oficial del día** - se actualiza automáticamente
- **Tasas con decimales** - precisión en los cálculos
- **Plazo personalizable** - de 5 a 35 años
- **Validación en tiempo real** - previene errores comunes
- **Cálculos automáticos** - sin necesidad de botones

## 🚀 Cómo usar

### 1. Datos de entrada
- **Valor de la propiedad**: Precio en USD de la propiedad (se muestra automáticamente en pesos)
- **Provincia**: Selecciona CABA o Buenos Aires
- **Monto del préstamo**: Cuánto vas a pedir prestado **en USD o pesos** (seleccionable)
- **Plazo**: Años del crédito (5 a 35 años, personalizable)
- **Tasa de interés**: Porcentaje anual del crédito (con decimales)

### 2. Resultados automáticos
- Primera cuota
- Total a pagar
- Gastos extra (escritura, inmobiliaria, firmas)
- Cuota mensual promedio

### 3. Escenarios de análisis
- **🔴 Peor caso**: Con dólar en $1400 (techo de banda)
- **🟢 Mejor caso**: Con dólar en $1200 (piso de banda)

## 💡 Consejos importantes

- **Calculá siempre con el peor escenario** - Usá el techo de la banda cambiaria
- **No llegues con la plata justa** - Dejá un margen de seguridad
- **El tipo de cambio se fija el día de la escritura** - No se puede congelar antes
- **Considerá los gastos extra** - Escritura, inmobiliaria, firmas, etc.

## 🛠️ Instalación y uso local

1. Clona este repositorio:
```bash
git clone https://github.com/tu-usuario/calculadora-firma-hipotecaria-uva-ar.git
cd calculadora-firma-hipotecaria-uva-ar
```

2. Abre `index.html` en tu navegador

3. ¡Listo! La calculadora funciona sin necesidad de servidor

## 🌐 Despliegue en GitHub Pages

### Opción 1: Automático (recomendado)
1. Sube tu código a GitHub
2. Ve a Settings > Pages
3. Selecciona "Deploy from a branch"
4. Elige la rama `main` y la carpeta `/ (root)`
5. ¡Tu calculadora estará disponible en `https://tu-usuario.github.io/nombre-repo`!

### Opción 2: Manual
1. Crea una nueva rama llamada `gh-pages`
2. Sube los archivos a esa rama
3. Configura GitHub Pages para usar esa rama

## 📁 Estructura del proyecto

```
calculadora-firma-hipotecaria-uva-ar/
├── index.html          # Página principal
├── styles.css          # Estilos y diseño
├── script.js           # Lógica de cálculos
└── README.md           # Este archivo
```

## 🔧 Personalización

### Modificar gastos extra
Edita el objeto `CONFIG.gastosExtra` en `script.js`:

```javascript
gastosExtra: {
    'CABA': {
        escritura: 2.5,        // 2.5% del valor
        inmobiliaria: 3.0,     // 3% del valor
        firmas: 0.5,           // 0.5% del valor
        otros: 1.0             // 1% del valor
    }
}
```

### Cambiar tipos de cambio
Modifica `CONFIG.tiposCambio`:

```javascript
tiposCambio: {
    actual: 1225,      // Dólar actual
    peorCaso: 1400,   // Dólar alto
    mejorCaso: 1200    // Dólar bajo
}
```

### Agregar nuevas provincias
1. Agrega la provincia en el HTML
2. Configura los gastos en `CONFIG.gastosExtra`
3. Actualiza la lógica de cálculos si es necesario

## 📱 Compatibilidad

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Móviles (iOS Safari, Chrome Mobile)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Algunas ideas:

- Agregar más provincias
- Mejorar los cálculos UVA
- Agregar gráficos de proyección
- Incluir más escenarios de análisis
- Traducción a otros idiomas

## ⚠️ Descargo de responsabilidad

Esta calculadora es **solo informativa** y no reemplaza la asesoría profesional. Los resultados son aproximados y pueden variar según las condiciones específicas de tu banco y crédito.

**Siempre consultá con tu banco para datos oficiales y precisos.**

## 📞 Soporte

Si encontrás algún bug o tenés sugerencias:

1. Abre un issue en GitHub
2. Describe el problema o sugerencia
3. Incluye detalles de tu navegador y sistema operativo

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**¡Esperamos que esta calculadora te ayude a tomar la mejor decisión para tu crédito hipotecario! 🏡**
