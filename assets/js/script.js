const selector = document.querySelector("#moneda-selector");
const resultado = document.querySelector("#resultado");
const btnConvertir = document.querySelector("#convertir-btn");
const inputMonto = document.querySelector("#monto");
let myChart = null; // Variable global para destruir el gráfico anterior

// 1. Cargar selector al inicio
async function getCurrencies() {
    try {
        const res = await fetch("https://mindicador.cl/api/");
        const data = await res.json();
        let template = '<option value="" disabled selected>Seleccione moneda</option>';
        
        for (const codigo in data) {
            if (data[codigo].unidad_medida) {
                // Guardamos el código (dolar, euro) como valor para buscar el historial luego
                template += `<option value="${codigo}" data-valor="${data[codigo].valor}">${data[codigo].nombre}</option>`;
            }
        }
        selector.innerHTML = template;
    } catch (e) {
        resultado.innerHTML = "Error al cargar monedas";
    }
}

// 2. Función para obtener datos del gráfico (últimos 10 días)
async function getHistorial(moneda) {
    try {
        const res = await fetch(`https://mindicador.cl/api/${moneda}`);
        const data = await res.json();
        // Tomamos los primeros 10 elementos (últimos 10 días) y los invertimos para orden cronológico
        const ultimosDiez = data.serie.slice(0, 10).reverse();
        
        const labels = ultimosDiez.map(d => d.fecha.split('T')[0]);
        const valores = ultimosDiez.map(d => d.valor);
        
        return { labels, valores };
    } catch (e) {
        alert("Error al obtener el historial para el gráfico");
    }
}

// 3. Función para dibujar/actualizar el gráfico
function renderGrafico(labels, valores) {
    const ctx = document.getElementById('myChart').getContext('2d');
    
    // Si ya existe un gráfico, lo borramos para que no se solapen
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Historial últimos 10 días',
                data: valores,
                borderColor: '#6366f1',
                borderWidth: 2
            }]
        }
    });
}

// 4. Lógica de conversión + disparo de gráfico
btnConvertir.addEventListener("click", async () => {
    const pesos = Number(inputMonto.value);
    const codigoMoneda = selector.value;
    const opcionSeleccionada = selector.options[selector.selectedIndex];
    const valorMoneda = Number(opcionSeleccionada.getAttribute("data-valor"));

    if (!pesos || !codigoMoneda) {
        alert("Ingresa monto y selecciona moneda");
        return;
    }

    // Cálculo
    const total = pesos / valorMoneda;
    resultado.innerHTML = `Resultado: $${total.toFixed(2)}`;

    // Gráfico
    const datosGrafico = await getHistorial(codigoMoneda);
    renderGrafico(datosGrafico.labels, datosGrafico.valores);
});

getCurrencies();