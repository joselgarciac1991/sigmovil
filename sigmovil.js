// ========== CONFIGURACIÓN MAPA SIGMOVIL ==========

// Estado de los puntos (usando localStorage para persistencia offline)
let puntos = JSON.parse(localStorage.getItem('sigmovil_puntos') || "[]");
let puntosFiltrados = [...puntos];

// Inicialización de mapa y capa de puntos
let mapa = null;
let capaPuntos = null;

// ------ INICIALIZAR MAPA LEAFLET ------
function inicializarMapa() {
    if (!mapa) {
        mapa = L.map('mapaHistorial', { zoomControl: true, attributionControl: false, minZoom: 2 })
            .setView([6.254, -75.57], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(mapa);
    }
    if (!capaPuntos) capaPuntos = L.layerGroup().addTo(mapa);
}

// ------ REFRESCAR MAPA CON PUNTOS ------
function refrescarMapaHistorial() {
    inicializarMapa();
    const filtroSel = document.getElementById('filtroTipo');
    const filtro = filtroSel ? filtroSel.value : "";
    puntosFiltrados = filtro ? puntos.filter(p => p.tipo === filtro) : [...puntos];

    if (capaPuntos) capaPuntos.clearLayers();
    let marcadores = [];

    puntosFiltrados.forEach((p, idx) => {
        if (p.norte && p.este) {
            let lat = Number(p.norte);
            let lon = Number(p.este);
            let marker = L.marker([lat, lon])
                .bindPopup(
                    `<b>${idx + 1}. ${p.tipo}</b><br>Norte: ${p.norte}<br>Este: ${p.este}<br>Altitud: ${p.altitud}<br>
                    <a href="https://www.google.com/maps?q=${p.norte},${p.este}" target="_blank">
                    <i class='fa-brands fa-google'></i> Ver en Google Maps</a>`
                );
            marker.addTo(capaPuntos);
            marcadores.push(marker);
        }
    });

    // Centrar mapa a los puntos si hay
    if (marcadores.length) {
        let group = new L.featureGroup(marcadores);
        mapa.fitBounds(group.getBounds().pad(0.35));
    } else {
        mapa.setView([6.254, -75.57], 15);
    }
    setTimeout(() => { mapa.invalidateSize(); }, 350);
}

// ---- Abrir y cerrar modal de mapa ----
if (document.getElementById("btnVisorMapa")) {
    document.getElementById("btnVisorMapa").onclick = function() {
        document.getElementById("modalMapa").style.display = "block";
        setTimeout(refrescarMapaHistorial, 120);
    };
}
if (document.getElementById("cerrarMapa")) {
    document.getElementById("cerrarMapa").onclick = function() {
        document.getElementById("modalMapa").style.display = "none";
    };
}
window.onclick = function(event) {
    const modal = document.getElementById("modalMapa");
    if (modal && event.target == modal) modal.style.display = "none";
};

// ---- Filtrar por tipo ----
if (document.getElementById('filtroTipo')) {
    document.getElementById('filtroTipo').onchange = refrescarMapaHistorial;
}

// ------ GUARDAR NUEVO PUNTO ------
function guardarPunto(ev) {
    if (ev) ev.preventDefault();
    let tipo = document.getElementById('tipoPunto').value;
    let norte = document.getElementById('norte').value;
    let este = document.getElementById('este').value;
    let altitud = document.getElementById('altitud').value;
    let fotosInput = document.getElementById('fotos');
    let fotos = fotosInput ? Array.from(fotosInput.files || []).map(f=>f.name) : [];

    if (!norte || !este) { alert('Debes registrar las coordenadas.'); return; }

    let nuevo = { tipo, norte, este, altitud, fotos };
    puntos.push(nuevo);
    localStorage.setItem('sigmovil_puntos', JSON.stringify(puntos));
    refrescarMapaHistorial();
    refrescarHistorial();
    alert('Punto guardado.');
}

// ------ MOSTRAR HISTORIAL ------
function refrescarHistorial() {
    const lista = document.getElementById('listaPuntos');
    if (!lista) return;
    lista.innerHTML = '';
    puntos.forEach((p, i) => {
        lista.innerHTML += `
        <div class="sec-btn punto-item">
            <i class="fa fa-map-marker-alt"></i>
            <div>
                <b>${i + 1}. ${p.tipo}</b><br>
                Norte: ${p.norte}<br>
                Este: ${p.este}<br>
                Altitud: ${p.altitud}
            </div>
            <button class="map-btn" title="Ver en Google Maps"
                onclick="abrirEnGoogleMaps('${p.norte}','${p.este}')">
                <i class="fa-brands fa-google"></i>
            </button>
        </div>
        `;
    });
}

// ------ GOOGLE MAPS ------
function abrirEnGoogleMaps(norte, este) {
    window.open(`https://www.google.com/maps?q=${norte},${este}`, '_blank');
}

// ------ EXPORTACIONES ------
function exportarTXT() {
    let content = "tipo,norte,este,altitud\n";
    puntos.forEach(p=> content += `${p.tipo},${p.norte},${p.este},${p.altitud}\n`);
    let blob = new Blob([content], {type: "text/plain"});
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sigmovil_puntos.txt";
    a.click();
}

function exportarGeoJSON(arr = puntos) {
    let geojson = {
        "type":"FeatureCollection",
        "features": arr.map((pt, idx) => ({
            "type":"Feature",
            "geometry": { "type":"Point", "coordinates":[Number(pt.este), Number(pt.norte), Number(pt.altitud)||0] },
            "properties":{ "tipo":pt.tipo, "id":idx+1 }
        }))
    };
    let blob = new Blob([JSON.stringify(geojson,null,2)], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url; a.download = "puntos_sigmovil.geojson"; a.click();
}

function exportarKML(arr = puntos) {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n`;
    arr.forEach((pt, idx) => {
        kml += `
        <Placemark>
            <name>Punto ${idx+1}</name>
            <description>${pt.tipo}</description>
            <Point>
                <coordinates>${pt.este},${pt.norte},${pt.altitud||0}</coordinates>
            </Point>
        </Placemark>
        `;
    });
    kml += `</Document>\n</kml>`;
    let blob = new Blob([kml], {type: 'application/vnd.google-earth.kml+xml'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url; a.download = "puntos_sigmovil.kml"; a.click();
}

// ------ OBTENER GEOLOCALIZACIÓN ------
function obtenerCoordenadas() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            document.getElementById('norte').value = position.coords.latitude.toFixed(7);
            document.getElementById('este').value = position.coords.longitude.toFixed(7);
            document.getElementById('altitud').value =
                position.coords.altitude !== null ? position.coords.altitude.toFixed(2) : "No disponible";
        }, function(err) {
            alert("No se pudo obtener posición GPS: " + err.message);
        }, { enableHighAccuracy: true });
    } else {
        alert("Este dispositivo no soporta geolocalización.");
    }
}

// ------ FUNCIÓN PARA CARGAR HTML EXTERNO EN UN PANEL ------
function cargarContenidoHTML(ruta, contenedorId) {
    fetch(ruta)
      .then(res => res.text())
      .then(html => {
        document.getElementById(contenedorId).innerHTML = html;
      })
      .catch(() => {
        document.getElementById(contenedorId).innerHTML = "<div style='padding:24px;color:#d00;'>No se pudo cargar el contenido.</div>";
      });
}

// ------ SINCRONIZACIÓN API SIMULADA ------
function sincronizar() {
    // Simulación de envío, personaliza a tu backend si lo necesitas
    fetch('https://tuservidor.com/api/sigmovil/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: 'usuario1', puntos })
    })
    .then(r => r.json())
    .then(resp => alert('¡Sincronización exitosa!'))
    .catch(err => alert('Error al sincronizar: ' + err));
}

// ------ EVENTOS ------
window.onload = () => {
    refrescarHistorial();
    // Otros eventos y hooks si los necesitas
};

// Registrar service worker para offline (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// ========== FIN CÓDIGO ==========
