// Motor Lógico de OsaMaps (Teoría de Grafos, Dijkstra, TTS y Accesibilidad)

// 1. DICCIONARIOS BILINGÜES (Castellano / Euskera)
const TRANSLATIONS = {
    es: {
        scanTitle: "Apunte al código de barras de su cita",
        scanHint: "Toque aquí para simular lectura del pase",
        planBLabel: "¿No funciona? Elija su consulta aquí:",
        selectPlaceholder: "-- Seleccionar Destino --",
        accLabel: "Evitar escaleras",
        btnBack: "⬅️ Atrás",
        btnNext: "Siguiente paso ➡️",
        stepText: "Paso {current} de {total}",
        listen: "🔊 Escuchar",
        arrivalTitle: "¡Ha llegado a su destino!",
        arrivalMsg: "Por favor, tome asiento en la sala de espera. Su médico le llamará por pantalla.",
        btnRestart: "🏠 Volver al inicio",
        nodes: {
            node_entrance: "Entrada principal del hospital. Avance recto.",
            node_hall: "Pasillo central. Pase las puertas de cristal dobles.",
            node_desk: "Siga la línea azul del suelo pasando el mostrador rojo.",
            node_stairs: "Suba por las escaleras hasta la primera planta.",
            node_elevator: "Tome el ascensor dorado hasta la planta deseada.",
            node_cardiology: "Llegada a Analíticas / Consulta 14 de Cardiología.",
            node_radiology: "Llegada a Radiología y Rayos X.",
            node_trauma: "Llegada a Consulta de Traumatología."
        }
    },
    eu: {
        scanTitle: "Zuzendu zure txandaren barra-kodera",
        scanHint: "Ukitu hemen txartelaren irakurketa simulatzeko",
        planBLabel: "Ez dabil? Hazi zure kontsulta hemen:",
        selectPlaceholder: "-- Hautatu Helburua --",
        accLabel: "Escalera gabe (Irisgarria)",
        btnBack: "⬅️ Atzera",
        btnNext: "Hurrengo urratsa ➡️",
        stepText: "Urratsa {current} / {total}",
        listen: "🔊 Entzun",
        arrivalTitle: "Zure helburura iritsi zara!",
        arrivalMsg: "Mesedez, eseri itxaronaretoan. Zure medikuak pantaila bidez deituko zaitu.",
        btnRestart: "🏠 Hasierara bueltatu",
        nodes: {
            node_entrance: "Ospitaleko sarrera nagusia. Jarraitu zuzen.",
            node_hall: "Korrido nagusia. igaro beirazko ate bikoitzak.",
            node_desk: "Jarraitu lurreko linea urdina mahai gorria igarotzean.",
            node_stairs: "Igo eskailerak lehenengo solairuraino.",
            node_elevator: "Hartzazu igogailu urreztatua nahi duzun solairuraino.",
            node_cardiology: "Kardiologiako 14. Kontsultara iritsiera.",
            node_radiology: "Erradiologia eta X izpietara iritsiera.",
            node_trauma: "Traumatologia Kontsultara iritsiera."
        }
    }
};

let currentLang = 'es';
let avoidStairs = true;

// 2. GRAFO DEL HOSPITAL (Nodos y Aristas con Pesos de Accesibilidad)
const HOSPITAL_GRAPH = {
    nodes: {
        'node_entrance': { id: 'node_entrance', type: 'hall', landmark: 'entrance' },
        'node_hall': { id: 'node_hall', type: 'hall', landmark: 'glass_doors' },
        'node_desk': { id: 'node_desk', type: 'desk', landmark: 'red_desk' },
        'node_stairs': { id: 'node_stairs', type: 'stairs', landmark: 'stairs' },
        'node_elevator': { id: 'node_elevator', type: 'elevator', landmark: 'elevator' },
        'node_cardiology': { id: 'node_cardiology', type: 'destination', landmark: 'cardiology_door' },
        'node_radiology': { id: 'node_radiology', type: 'destination', landmark: 'radiology_door' },
        'node_trauma': { id: 'node_trauma', type: 'destination', landmark: 'trauma_door' }
    },
    edges: [
        { from: 'node_entrance', to: 'node_hall', weight: 1, stairs: false },
        { from: 'node_hall', to: 'node_desk', weight: 1, stairs: false },
        { from: 'node_desk', to: 'node_cardiology', weight: 1, stairs: false },
        { from: 'node_desk', to: 'node_stairs', weight: 1, stairs: true },
        { from: 'node_desk', to: 'node_elevator', weight: 2, stairs: false },
        { from: 'node_stairs', to: 'node_trauma', weight: 1, stairs: true },
        { from: 'node_elevator', to: 'node_radiology', weight: 1, stairs: false },
        { from: 'node_elevator', to: 'node_trauma', weight: 3, stairs: false }
    ]
};

// 3. ESTADO DE NAVEGACIÓN
let activeRoute = [];
let currentStepIndex = 0;

// 4. ALGORITMO DIJKSTRA DE ENRUTAMIENTO ACCESIBLE
function calculateShortestPath(startNodeId, targetNodeId, filterStairs) {
    const graph = HOSPITAL_GRAPH;
    const distances = {};
    const previous = {};
    const nodesQueue = new Set();

    Object.keys(graph.nodes).forEach(nodeId => {
        distances[nodeId] = Infinity;
        previous[nodeId] = null;
        nodesQueue.add(nodeId);
    });

    distances[startNodeId] = 0;

    while (nodesQueue.size > 0) {
        let smallestNode = null;
        nodesQueue.forEach(nodeId => {
            if (smallestNode === null || distances[nodeId] < distances[smallestNode]) {
                smallestNode = nodeId;
            }
        });

        if (smallestNode === targetNodeId || distances[smallestNode] === Infinity) {
            break;
        }

        nodesQueue.delete(smallestNode);

        // Buscar vecinos
        const neighbors = graph.edges.filter(e => e.from === smallestNode || e.to === smallestNode);
        neighbors.forEach(edge => {
            if (filterStairs && edge.stairs) return; // Penalizar o omitir escaleras si accesibilidad está activa

            const neighborId = edge.from === smallestNode ? edge.to : edge.from;
            if (nodesQueue.has(neighborId)) {
                const alt = distances[smallestNode] + edge.weight;
                if (alt < distances[neighborId]) {
                    distances[neighborId] = alt;
                    previous[neighborId] = smallestNode;
                }
            }
        });
    }

    const path = [];
    let curr = targetNodeId;
    while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr];
    }
    return path;
}

// 5. CAMBIO DE IDIOMA
function toggleLanguage() {
    currentLang = currentLang === 'es' ? 'eu' : 'es';
    document.getElementById('lang-toggle-btn').innerText = currentLang === 'es' ? '🌐 EU / ES' : '🌐 ES / EU';
    updateStaticTexts();
    if (activeRoute.length > 0 && currentStepIndex < activeRoute.length) {
        renderCurrentStep();
    }
}

function updateStaticTexts() {
    const t = TRANSLATIONS[currentLang];
    document.getElementById('txt-scan-title').innerText = t.scanTitle;
    document.getElementById('txt-scan-hint').innerText = t.scanHint;
    document.getElementById('txt-plan-b').innerText = t.planBLabel;
    document.getElementById('txt-select-placeholder').innerText = t.selectPlaceholder;
    document.getElementById('txt-acc-label').innerText = t.accLabel;
    document.getElementById('btn-back').innerText = t.btnBack;
    document.getElementById('btn-next').innerText = t.btnNext;
    document.getElementById('arrival-title').innerText = t.arrivalTitle;
    document.getElementById('arrival-message').innerText = t.arrivalMsg;
}

// 6. CONTROL DE FLUIJO DE PANTALLAS
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function toggleAccessibility(checked) {
    avoidStairs = checked;
}

function simulateBarcodeScan() {
    // Escaneo predeterminado a Analíticas/Cardiología
    startRouteTo('node_cardiology');
}

function onManualSelect(targetNodeId) {
    if (targetNodeId) {
        startRouteTo(targetNodeId);
    }
}

function startRouteTo(targetNodeId) {
    const startNode = 'node_entrance';
    activeRoute = calculateShortestPath(startNode, targetNodeId, avoidStairs);
    
    if (activeRoute.length === 0 || activeRoute[activeRoute.length - 1] !== targetNodeId) {
        alert(currentLang === 'es' ? 'Ruta no disponible con accesibilidad activa' : 'Bidea ez dago erabilgarri');
        return;
    }

    currentStepIndex = 0;
    showScreen('screen-navigation');
    renderCurrentStep();
}

// 7. RENDERIZADO VISUAL PASO A PASO (SVG AR Estático)
function renderCurrentStep() {
    const nodeId = activeRoute[currentStepIndex];
    const totalSteps = activeRoute.length;

    // Actualizar Barra de Progreso
    const percent = ((currentStepIndex + 1) / totalSteps) * 100;
    document.getElementById('progress-fill').style.width = percent + '%';
    
    let stepStr = TRANSLATIONS[currentLang].stepText;
    stepStr = stepStr.replace('{current}', currentStepIndex + 1).replace('{total}', totalSteps);
    document.getElementById('progress-text').innerText = stepStr;

    // Actualizar Texto de Instrucción Gigante
    const instructionText = TRANSLATIONS[currentLang].nodes[nodeId];
    document.getElementById('nav-text-instruction').innerText = instructionText;

    // Actualizar Escena Gráfica Vectorial (Landmarks y Vectores)
    renderSVGScene(nodeId);

    // Reproducción de voz (Text-To-Speech)
    speakInstruction(instructionText);
}

function renderSVGScene(nodeId) {
    const landmarksGroup = document.getElementById('svg-landmarks');
    const arrowPath = document.getElementById('vector-arrow');
    const pointer = document.getElementById('vector-pointer');
    landmarksGroup.innerHTML = '';

    // Modificar visualización SVG según el hito arquitectónico
    if (nodeId === 'node_entrance') {
        arrowPath.setAttribute('d', 'M 400 460 L 400 280');
        pointer.setAttribute('points', '400,230 360,290 440,290');
    } else if (nodeId === 'node_hall') {
        // Puertas de Cristal
        landmarksGroup.innerHTML = `
            <rect x="280" y="160" width="110" height="230" fill="#38BDF8" opacity="0.6" stroke="#0284C7" stroke-width="4"/>
            <rect x="410" y="160" width="110" height="230" fill="#38BDF8" opacity="0.6" stroke="#0284C7" stroke-width="4"/>
        `;
        arrowPath.setAttribute('d', 'M 400 460 L 400 250');
        pointer.setAttribute('points', '400,200 360,260 440,260');
    } else if (nodeId === 'node_desk') {
        // Mostrador Rojo
        landmarksGroup.innerHTML = `
            <rect x="500" y="260" width="180" height="100" fill="#DC2626" rx="10"/>
            <text x="590" y="315" font-size="20" fill="#FFF" font-weight="bold" text-anchor="middle">RECEPCIÓN</text>
        `;
        // Giro a la izquierda
        arrowPath.setAttribute('d', 'M 400 450 L 400 340 Q 400 300 340 300 L 260 300');
        pointer.setAttribute('points', '210,300 270,260 270,340');
    } else if (nodeId === 'node_elevator') {
        // Ascensor Dorado
        landmarksGroup.innerHTML = `
            <rect x="330" y="140" width="140" height="240" fill="#D97706" rx="8"/>
            <rect x="350" y="160" width="100" height="220" fill="#FBBF24"/>
        `;
        arrowPath.setAttribute('d', 'M 400 460 L 400 350');
        pointer.setAttribute('points', '400,300 360,360 440,360');
    }
}

// 8. SÍNTESIS DE VOZ (Web Speech API) Y SONIDO WEB AUDIO API
function speakInstruction(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancelar anteriores
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang === 'es' ? 'es-ES' : 'eu-ES';
        utterance.rate = 0.85; // Habla ligeramente más lenta para mayor claridad senior
        window.speechSynthesis.speak(utterance);
    }
}

function speakCurrentInstruction() {
    const nodeId = activeRoute[currentStepIndex];
    const text = TRANSLATIONS[currentLang].nodes[nodeId];
    speakInstruction(text);
}

function playArrivalChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

// 9. NAVEGACIÓN ENTRE PASOS
function navigateStep(direction) {
    currentStepIndex += direction;

    if (currentStepIndex < 0) {
        currentStepIndex = 0;
        return;
    }

    if (currentStepIndex >= activeRoute.length) {
        // Llegada al destino
        playArrivalChime();
        showScreen('screen-arrival');
        speakInstruction(TRANSLATIONS[currentLang].arrivalTitle);
        return;
    }

    renderCurrentStep();
}

function resetApp() {
    activeRoute = [];
    currentStepIndex = 0;
    document.getElementById('destination-select').value = "";
    showScreen('screen-scanner');
}

// Inicialización al cargar la página
window.onload = function() {
    updateStaticTexts();
};