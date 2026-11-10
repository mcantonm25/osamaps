// BASE DE DATOS Y GRAFO DEL HOSPITAL
const hospitalGraph = {
  nodes: {
    "ENTRADA": {
      text: { es: "Siga recto pasando el mostrador rojo", eu: "Jarraitu zuzen harrera-txartel gorria igarota" },
      landmark: "red_desk",
      arrows: [{ type: "straight" }]
    },
    "PASILLO_CENTRAL": {
      text: { es: "Siga la línea azul del suelo", eu: "Jarraitu lurreko lerro urdina" },
      landmark: "blue_line",
      arrows: [{ type: "straight" }]
    },
    "CRUCE_ACCESIBLE": {
      text: { es: "Gire a la derecha hacia los ascensores", eu: "Bira eskuinera igogailuetarantz" },
      landmark: "elevator_hall",
      arrows: [{ type: "right" }]
    },
    "CRUCE_ESCALERAS": {
      text: { es: "Suba por las escaleras a la 1ª Planta", eu: "Igo eskaileretatik 1. solairura" },
      landmark: "stairs",
      arrows: [{ type: "up" }]
    },
    "PLANTA1_ASCENSOR": {
      text: { es: "Salga del ascensor y gire a la izquierda", eu: "Irten igogailutik eta biratu ezkerrera" },
      landmark: "p1_hall",
      arrows: [{ type: "left" }]
    },
    "PLANTA1_ESCALERAS": {
      text: { es: "Al terminar las escaleras, gire a la izquierda", eu: "Eskailerak amaitzean, biratu ezkerrera" },
      landmark: "p1_hall",
      arrows: [{ type: "left" }]
    },
    "CONS_CARDIOLOGIA": {
      text: { es: "Ha llegado a Cardiología. Tome asiento", eu: "Kardiologiara iritsi zara. Eseri zaitez" },
      landmark: "door_cardio",
      arrows: []
    },
    "ANALITICAS": {
      text: { es: "Gire a la izquierda hacia Extracciones", eu: "Biratu ezkerrera Odol-erauzketetarantz" },
      landmark: "door_blood",
      arrows: []
    },
    "RADIOLOGIA": {
      text: { es: "Baje por el ascensor a la Planta -1", eu: "Jaitsi igogailuz -1 solairura" },
      landmark: "elevator_hall",
      arrows: []
    }
  },
  edges: [
    { from: "ENTRADA", to: "PASILLO_CENTRAL", weight: 1, stairs: false },
    { from: "PASILLO_CENTRAL", to: "CRUCE_ACCESIBLE", weight: 1, stairs: false },
    { from: "PASILLO_CENTRAL", to: "CRUCE_ESCALERAS", weight: 1, stairs: true },
    { from: "PASILLO_CENTRAL", to: "ANALITICAS", weight: 1, stairs: false },
    { from: "CRUCE_ACCESIBLE", to: "PLANTA1_ASCENSOR", weight: 2, stairs: false },
    { from: "CRUCE_ESCALERAS", to: "PLANTA1_ESCALERAS", weight: 1, stairs: true },
    { from: "PLANTA1_ASCENSOR", to: "CONS_CARDIOLOGIA", weight: 1, stairs: false },
    { from: "PLANTA1_ESCALERAS", to: "CONS_CARDIOLOGIA", weight: 1, stairs: true },
    { from: "CRUCE_ACCESIBLE", to: "RADIOLOGIA", weight: 2, stairs: false }
  ]
};

// ESTADO DE LA APLICACIÓN
let currentLang = 'es';
let avoidStairs = false;
let currentPath = [];
let currentStepIndex = 0;

// DICCIONARIO I18N
const i18n = {
  es: {
    btnLang: "Euskara",
    scanPrompt: "Apunte al código de barras de su cita",
    selectLabel: "O elija su destino a mano:",
    selectDefault: "-- Seleccione Consulta --",
    avoidStairs: "Evitar escaleras (Usar ascensor)",
    step: "Paso",
    of: "de",
    next: "Siguiente paso",
    prev: "Atrás",
    arrivalTitle: "Ha llegado a su destino",
    arrivalSub: "Por favor, tome asiento y espere a ser llamado.",
    restart: "Volver al Inicio"
  },
  eu: {
    btnLang: "Castellano",
    scanPrompt: "Zuzendu zure hitzorduaren barra-kodera",
    selectLabel: "Edo aukeratu helmuga eskuz:",
    selectDefault: "-- Hautatu Kontsulta --",
    avoidStairs: "Eskailerak ekidin (Igogailua erabili)",
    step: "Uratsa",
    of: "nondik",
    next: "Hurrengo urratsa",
    prev: "Atzera",
    arrivalTitle: "Zure helmugara iritsi zara",
    arrivalSub: "Mesedez, eseri eta itxaron deitu arte.",
    restart: "Hasierara reitzuli"
  }
};

// ALGORITMO DIJKSTRA
function findShortestPath(startNode, targetNode, filterStairs) {
  const distances = {};
  const previous = {};
  const nodes = new Set();

  Object.keys(hospitalGraph.nodes).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
    nodes.add(node);
  });
  distances[startNode] = 0;

  while (nodes.size > 0) {
    let smallest = null;
    nodes.forEach(node => {
      if (smallest === null || distances[node] < distances[smallest]) {
        smallest = node;
      }
    });

    if (smallest === targetNode || distances[smallest] === Infinity) break;
    nodes.delete(smallest);

    const neighborEdges = hospitalGraph.edges.filter(e => e.from === smallest);
    for (let edge of neighborEdges) {
      if (filterStairs && edge.stairs) continue; // Penalización por accesibilidad

      let alt = distances[smallest] + edge.weight;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = smallest;
      }
    }
  }

  const path = [];
  let curr = targetNode;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }
  return path[0] === startNode ? path : [];
}

// RENDERIZADO VISUAL SVG (LANDMARKS + AR)
function renderARScene(nodeKey) {
  const node = hospitalGraph.nodes[nodeKey];
  const svg = document.getElementById('ar-scene');
  if (!svg) return;

  let content = `
    <rect width="800" height="600" fill="#cbd5e1"/>
    <polygon points="0,600 250,300 550,300 800,600" fill="#94a3b8"/>
    <polygon points="250,300 550,300 500,0 300,0" fill="#64748b"/>
    <path d="M 400,600 L 400,300" stroke="#ffffff" stroke-width="8" stroke-dasharray="20,15"/>
  `;

  if (node.landmark === 'red_desk') {
    content += `
      <rect x="520" y="320" width="180" height="120" fill="#dc2626" rx="8"/>
      <rect x="540" y="280" width="140" height="40" fill="#fee2e2" rx="4"/>
      <text x="610" y="305" fill="#991b1b" font-size="16" font-weight="bold" text-anchor="middle">HARRERA / RECEPCIÓN</text>
    `;
  } else if (node.landmark === 'blue_line') {
    content += `<polygon points="380,600 395,300 405,300 420,600" fill="#0284c7"/>`;
  } else if (node.landmark === 'elevator_hall') {
    content += `
      <rect x="500" y="220" width="160" height="240" fill="#475569" stroke="#eab308" stroke-width="6"/>
      <rect x="520" y="250" width="55" height="190" fill="#94a3b8"/>
      <rect x="585" y="250" width="55" height="190" fill="#94a3b8"/>
      <circle cx="580" cy="235" r="8" fill="#22c55e"/>
    `;
  } else if (node.landmark === 'stairs') {
    content += `
      <polygon points="450,450 650,450 650,250 550,250" fill="#64748b"/>
      <line x1="450" y1="450" x2="650" y2="450" stroke="#0f172a" stroke-width="4"/>
      <line x1="480" y1="410" x2="650" y2="410" stroke="#0f172a" stroke-width="4"/>
      <line x1="510" y1="370" x2="650" y2="370" stroke="#0f172a" stroke-width="4"/>
      <line x1="540" y1="330" x2="650" y2="330" stroke="#0f172a" stroke-width="4"/>
    `;
  }

  // Flecha Vectorial de Ultra-Alto Contraste
  node.arrows.forEach(arrow => {
    if (arrow.type === 'straight') {
      content += `
        <g transform="translate(400, 480)">
          <path d="M 0,40 L 0,-60 M -30,-20 L 0,-70 L 30,-20" fill="none" stroke="#0f172a" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 0,40 L 0,-60 M -30,-20 L 0,-70 L 30,-20" fill="none" stroke="#facc15" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
    } else if (arrow.type === 'right') {
      content += `
        <g transform="translate(420, 460)">
          <path d="M -80,40 L 20,40 L 60,-20 M 20,-30 L 70,-25 L 55,25" fill="none" stroke="#0f172a" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M -80,40 L 20,40 L 60,-20 M 20,-30 L 70,-25 L 55,25" fill="none" stroke="#facc15" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
    } else if (arrow.type === 'left') {
      content += `
        <g transform="translate(380, 460)">
          <path d="M 80,40 L -20,40 L -60,-20 M -20,-30 L -70,-25 L -55,25" fill="none" stroke="#0f172a" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 80,40 L -20,40 L -60,-20 M -20,-30 L -70,-25 L -55,25" fill="none" stroke="#facc15" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
    }
  });

  svg.innerHTML = content;
}

// CONTROL DE NAVEGACIÓN DE PANTALLAS
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function startNavigation(destinationKey) {
  avoidStairs = document.getElementById('wheelchair-switch').checked;
  currentPath = findShortestPath("ENTRADA", destinationKey, avoidStairs);
  currentStepIndex = 0;

  if (currentPath.length > 0) {
    showScreen('screen-navigation');
    updateNavigationStep();
  }
}

function updateNavigationStep() {
  const totalSteps = currentPath.length;
  const currentNodeKey = currentPath[currentStepIndex];
  const nodeData = hospitalGraph.nodes[currentNodeKey];

  // Barra de progreso
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;
  document.getElementById('progress-bar-fill').style.width = `${progressPercent}%`;
  document.getElementById('progress-text').innerText = `${i18n[currentLang].step} ${currentStepIndex + 1} ${i18n[currentLang].of} ${totalSteps}`;

  // Texto de instrucción
  const instructionText = nodeData.text[currentLang];
  document.getElementById('instruction-text').innerText = instructionText;

  // Renderizado visual y voz
  renderARScene(currentNodeKey);
  speakText(instructionText);

  // Botón atrás
  document.getElementById('btn-prev').style.visibility = currentStepIndex === 0 ? 'hidden' : 'visible';
}

// SÍNTESIS DE VOZ (TTS)
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'es' ? 'es-ES' : 'eu-ES';
    utterance.rate = 0.85; // Velocidad pausada para tercera edad
    window.speechSynthesis.speak(utterance);
  }
}

// SONIDO DE CONFIRMACIÓN (WEB AUDIO API)
function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.30); // G5
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log("Audio no soportado o bloqueado");
  }
}

// CAMBIO DE IDIOMA EN TIEMPO REAL
function toggleLanguage() {
  currentLang = currentLang === 'es' ? 'eu' : 'es';
  const texts = i18n[currentLang];

  document.getElementById('lang-btn').innerText = texts.btnLang;
  document.getElementById('txt-scan-prompt').innerText = texts.scanPrompt;
  document.getElementById('lbl-select').innerText = texts.selectLabel;
  document.getElementById('opt-default').innerText = texts.selectDefault;
  document.getElementById('txt-avoid-stairs').innerText = texts.avoidStairs;
  document.getElementById('btn-next').innerText = texts.next;
  document.getElementById('btn-prev').innerText = texts.prev;
  document.getElementById('txt-arrival-title').innerText = texts.arrivalTitle;
  document.getElementById('txt-arrival-sub').innerText = texts.arrivalSub;
  document.getElementById('btn-restart').innerText = texts.restart;

  if (document.getElementById('screen-navigation').classList.contains('active')) {
    updateNavigationStep();
  }
}

// INICIALIZACIÓN DE EVENTOS
document.addEventListener('DOMContentLoaded', () => {
  // Cambio de idioma
  document.getElementById('lang-btn').addEventListener('click', toggleLanguage);

  // Escáner simulado (al hacer clic en la cámara)
  document.getElementById('camera-viewport').addEventListener('click', () => {
    startNavigation("CONS_CARDIOLOGIA");
  });

  // Selector manual
  document.getElementById('manual-select').addEventListener('change', (e) => {
    if (e.target.value) {
      startNavigation(e.target.value);
    }
  });

  // Botón TTS
  document.getElementById('tts-btn').addEventListener('click', () => {
    const text = document.getElementById('instruction-text').innerText;
    speakText(text);
  });

  // Botón Siguiente
  document.getElementById('btn-next').addEventListener('click', () => {
    if (currentStepIndex < currentPath.length - 1) {
      currentStepIndex++;
      updateNavigationStep();
    } else {
      showScreen('screen-arrival');
      playSuccessSound();
      speakText(i18n[currentLang].arrivalTitle);
    }
  });

  // Botón Atrás
  document.getElementById('btn-prev').addEventListener('click', () => {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      updateNavigationStep();
    }
  });

  // Botón Reiniciar
  document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('manual-select').selectedIndex = 0;
    showScreen('screen-scanner');
  });
});