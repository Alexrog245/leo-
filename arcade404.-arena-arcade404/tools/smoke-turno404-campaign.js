#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — smoke de campaña de TURNO 404

   Uso: node tools/smoke-turno404-campaign.js

   Sin navegador ni dependencias externas ejercita la cinemática de apertura,
   tres noches de tres sectores, objetivos de cámara, rutas laterales, clientes,
   llamada cortable, ductos, voces coherentes y la revelación contextual final.
   ========================================================= */

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "turno404.js"),
    "utf8"
);
const AUDIO_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "core", "audio.js"),
    "utf8"
);
const CSS_SOURCE = fs.readFileSync(
    path.join(ROOT, "css", "games", "turno404.css"),
    "utf8"
);


function classList() {
    const values = new Set();

    return {
        add: (...names) => names.forEach((name) => values.add(name)),
        remove: (...names) => names.forEach((name) => values.delete(name)),
        contains: (name) => values.has(name),
        toggle: (name, enabled) => {
            const active = enabled === undefined ? !values.has(name) : Boolean(enabled);
            active ? values.add(name) : values.delete(name);
            return active;
        }
    };
}


function node(dataset = {}) {
    const attributes = {};
    const style = {
        setProperty(name, value) {
            this[name] = value;
        }
    };
    const output = {
        dataset,
        style,
        classList: classList(),
        hidden: false,
        textContent: "",
        innerHTML: "",
        disabled: false,
        addEventListener: () => {},
        removeEventListener: () => {},
        setAttribute(name, value) {
            attributes[name] = String(value);
        },
        getAttribute(name) {
            return attributes[name] || null;
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        closest: () => null
    };

    Object.defineProperty(output, "src", {
        get: () => attributes.src || "",
        set: (value) => {
            attributes.src = String(value);
        }
    });

    return output;
}


function createHarness() {
    let definition = null;
    const tones = [];
    const gameOvers = [];
    const wins = [];
    const levelRewards = [];
    const stats = {};
    const meters = {};
    const statuses = [];
    const randomRolls = [];
    const viewport = { width: 1024, height: 650 };
    const sandboxMath = Object.create(Math);
    sandboxMath.random = () => randomRolls.length ? randomRolls.shift() : 0.42;
    const roles = [
        "clock", "state", "office-caption", "doorway", "office-threat", "window-threat", "ceiling-vent", "hiding", "power-cut",
        "transcript", "transcript-list", "monitor", "camera-title", "camera-feed", "camera-scene-label",
        "camera-figure", "camera-copy", "energy-value", "energy-fill", "panic-value",
        "panic-fill", "threat-label", "level-label", "objective-label", "objective-state",
        "objective-fill", "signal-countdown", "vent-countdown", "client-countdown", "desk-monitor", "desk-clock", "desk-monitor-status",
        "client-notice", "client-notice-from", "client-notice-preview", "client-terminal", "client-terminal-from", "client-terminal-subject", "client-terminal-time", "client-terminal-message",
        "client-terminal-signal", "client-terminal-evidence", "client-hold", "client-hold-message", "client-hold-status",
        "client-terminal-choices", "client-terminal-whisper",
        "difficulty", "difficulty-status", "tutorial", "tutorial-art", "tutorial-portrait", "tutorial-kicker", "tutorial-speaker", "tutorial-title", "tutorial-message", "tutorial-action", "tutorial-count", "radio-panel", "radio-art", "radio-portrait", "radio-name",
        "radio-emotion", "radio-message", "breathe-cooldown", "tip", "cinematic",
        "cinematic-kicker", "cinematic-title", "cinematic-direction", "cinematic-lines",
        "cinematic-countdown", "story", "story-kicker", "story-art", "story-portrait",
        "story-speaker", "story-title", "story-message", "capriles-reveal", "reveal-reason",
        "records", "records-title", "records-mode", "records-tabs", "records-grid", "announce"
    ];
    const refs = Object.fromEntries(roles.map((role) => [role, node()]));
    const cameraButtons = ["recepcion", "pasillo", "archivo"].map((camera) => node({ camera }));
    const controlButtons = [
        "camera", "lamp", "door", "hide", "signal", "vent", "client", "breathe", "records", "continue", "cinematic-next", "tutorial-next", "tutorial-skip"
    ].map((control) => node({ control }));
    const cinematicMembers = ["desire", "davinchi", "rog", "colinas", "sil"].map((member) => {
        const item = node({ cinematicMember: member });
        const portrait = node();
        item.querySelector = () => portrait;
        return item;
    });
    const difficultyButtons = ["facil", "normal", "dificil"].map((turnoDifficulty) => node({ turnoDifficulty }));
    const root = node();

    root.offsetWidth = viewport.width;
    root.offsetHeight = viewport.height;
    root.getBoundingClientRect = () => ({ width: viewport.width, height: viewport.height });
    root.querySelector = (selector) => {
        const match = selector.match(/^\[data-role="([^"]+)"\]$/);
        return match ? refs[match[1]] || null : null;
    };
    root.querySelectorAll = (selector) => {
        if (selector === "[data-camera]") {
            return cameraButtons;
        }
        if (selector === "[data-control]") {
            return controlButtons;
        }
        if (selector === "[data-cinematic-member]") {
            return cinematicMembers;
        }
        if (selector === "[data-turno-difficulty]") {
            return difficultyButtons;
        }
        return [];
    };

    const stage = {
        appendChild(child) {
            child.parentNode = this;
        },
        removeChild: () => {}
    };
    const shell = {
        refs: { stage },
        best: 0,
        setTouchControls: () => {},
        setStat(key, value) {
            stats[key] = value;
        },
        setMeter(key, value) {
            meters[key] = value;
        },
        setStatus(value) {
            statuses.push(value);
        },
        q: () => null,
        gameOver(payload) {
            gameOvers.push(payload);
        },
        win(payload) {
            wins.push(payload);
        },
        awardVipLevel(score, label) {
            levelRewards.push({ score, label });
        }
    };
    const allExpressions = [
        "serio", "seria", "nervioso", "nerviosa", "preocupado", "preocupada",
        "miedo", "gritando", "feliz", "triste", "llorando", "despreocupado"
    ];
    const audioTracks = [];
    const audioPlays = [];

    function audioTrack(id, options = {}) {
        const listeners = new Map();
        const track = {
            id,
            options,
            paused: true,
            ended: false,
            volume: options.volume || 0,
            currentTime: 0,
            addEventListener(type, callback) {
                const current = listeners.get(type) || [];
                current.push(callback);
                listeners.set(type, current);
            },
            emit(type) {
                (listeners.get(type) || []).slice().forEach((callback) => callback());
            }
        };

        audioTracks.push(track);
        return track;
    }

    const A = {
        utils: {
            clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
            formatScore: (value) => String(Math.round(value)),
            create: () => root
        },
        assets: {
            url: (id) => `asset://${id}`,
            character: () => ({ expressions: allExpressions }),
            characterImageId: (id, expression) => `character.${id}.${expression}`,
            characterImageIds: (id) => allExpressions.map((expression) => `character.${id}.${expression}`),
            preload: () => Promise.resolve([]),
            createAudio: (id, options) => audioTrack(id, options),
            playAudio: (track, restart = false) => {
                if (track) {
                    if (restart) {
                        track.currentTime = 0;
                    }
                    track.paused = false;
                    track.ended = false;
                    audioPlays.push({ id: track.id, restart: Boolean(restart) });
                    if (typeof track.emit === "function") {
                        track.emit("playing");
                    }
                }
                return Promise.resolve(Boolean(track));
            },
            stopAudio: (track, rewind = false) => {
                if (track) {
                    track.paused = true;
                    if (rewind) {
                        track.currentTime = 0;
                    }
                }
            }
        },
        audio: {
            play: (name) => tones.push(name),
            isEnabled: () => true,
            isMusicEnabled: () => true,
            stopMusic: () => {}
        },
        ui: {
            stat: () => "",
            divider: () => "",
            meter: () => "",
            action: () => ""
        },
        registerGame(game) {
            definition = game;
        }
    };
    const window = {
        Arcade404: A,
        performance: { now: () => 0 },
        requestAnimationFrame: () => 1,
        cancelAnimationFrame: () => {},
        clearTimeout: () => {}
    };

    vm.runInNewContext(SOURCE, {
        window,
        Math: sandboxMath,
        Promise,
        console,
        Date,
        setTimeout: () => 1,
        clearTimeout: () => {}
    }, { filename: "js/games/turno404.js" });

    assert.ok(definition, "TURNO 404 debe registrarse para poder crear una partida");

    return {
        game: definition.create(shell),
        refs,
        root,
        cinematicMembers,
        difficultyButtons,
        tones,
        audioTracks,
        audioPlays,
        gameOvers,
        wins,
        stats,
        meters,
        statuses,
        levelRewards,
        setRandomRolls(values) {
            randomRolls.splice(0, randomRolls.length, ...(values || []));
        },
        setViewport(width, height) {
            viewport.width = width;
            viewport.height = height;
            root.offsetWidth = width;
            root.offsetHeight = height;
        }
    };
}


function completeObjective(game, camera, milliseconds) {
    game.selectCamera(camera);
    game.update(milliseconds);
    assert.strictEqual(game.objectiveDone, true,
        `el objetivo de ${camera} debe validarse al vigilar su cámara`);
}


function smokeCampaign() {
    const harness = createHarness();
    const { game, refs, root, tones, audioPlays, stats, levelRewards } = harness;

    /* Formato horizontal bajo equivalente a la captura reportada: conserva el
       modo compacto sin pasar la oficina ni la consola a una escala ilegible. */
    harness.setViewport(696, 350);
    game.layout(1.48);
    assert.strictEqual(root.classList.contains("is-micro"), true,
        "una guardia horizontal baja activa la composición de lectura prioritaria");
    assert.strictEqual(root.classList.contains("is-narrow"), true,
        "la composición horizontal baja reordena medidores, elenco y acciones");

    harness.setViewport(558, 432);
    game.layout(1);
    assert.strictEqual(root.classList.contains("is-short"), true,
        "el layout compacto se decide con el alto real del escenario");
    assert.strictEqual(root.classList.contains("is-micro"), true,
        "una altura muy baja activa la composición de emergencia");
    assert.strictEqual(root.classList.contains("is-narrow"), true,
        "un escenario estrecho reordena filas y controles");
    harness.setViewport(1024, 650);
    game.layout(1.28);
    assert.strictEqual(root.classList.contains("is-short"), false,
        "la composición recupera el modo completo al volver a tener altura");
    assert.ok(CSS_SOURCE.includes("MICRO / HORIZONTAL — legibilidad")
        && CSS_SOURCE.includes("grid-template-rows: minmax(125px, 1.08fr) minmax(138px, 0.92fr)")
        && CSS_SOURCE.includes("font-size: clamp(7px, 1.38vw, 9px)")
        && CSS_SOURCE.includes("turno404__meters .turno404__threat-readout"),
    "la guardia baja prioriza escena, medidores y etiquetas de control legibles");

    assert.strictEqual(game.phase, "briefing", "la partida comienza preparada, no en marcha");
    game.start();
    assert.strictEqual(game.phase, "briefing", "la guardia abre con un protocolo visible antes de la cinemática");
    assert.strictEqual(refs.difficulty.hidden, false, "el selector de dificultad aparece antes del archivo de las 03:14");
    assert.strictEqual(root.classList.contains("is-difficulty-open"), true,
        "el selector de dificultad tiene un estado visual explícito");
    assert.ok(game._levelDuration(game._currentLevel()) > game._currentLevel().duration,
        "NORMAL da más tiempo total que el equilibrio original");
    assert.ok(game._responseWindow(6200) > 6200,
        "NORMAL amplía las ventanas de reacción de las alertas");
    let difficultyKeyPrevented = false;
    game.key("2", { repeat: false, preventDefault() { difficultyKeyPrevented = true; } });
    assert.strictEqual(difficultyKeyPrevented, true, "2 consume el atajo de dificultad antes de empezar");
    assert.strictEqual(game.difficulty, "normal", "2 selecciona el protocolo Normal recomendado");
    assert.strictEqual(game.phase, "cinematic", "la elección de protocolo abre la cinemática de las 03:14");
    assert.strictEqual(refs.difficulty.hidden, true, "el selector desaparece al comenzar la cinemática");
    assert.strictEqual(refs.cinematic.hidden, false, "la capa cinematográfica aparece antes de los controles");
    assert.match(refs["cinematic-kicker"].textContent, /03:14 AM/,
        "la apertura sitúa el incidente a las 03:14 AM");
    assert.match(refs["cinematic-title"].textContent, /LUCES PARPADEANTES/,
        "la primera escena presenta La Noche de las Luces Parpadeantes");
    assert.match(refs["cinematic-lines"].innerHTML, /SIL/,
        "Sil detecta la anomalía en la transmisión de apertura");
    assert.strictEqual(root.classList.contains("is-cinematic"), true,
        "la cinemática tiene un estado visual explícito");

    game.update(6200);
    assert.match(refs["cinematic-kicker"].textContent, /03:14 AM/,
        "la primera escena no avanza sola aunque pase su antigua duración");
    assert.match(refs["cinematic-countdown"].textContent, /LECTURA MANUAL/,
        "la interfaz deja claro que la cinemática espera al jugador");
    let spacePrevented = false;
    game.key(" ", { repeat: true, preventDefault() { spacePrevented = true; } });
    assert.strictEqual(spacePrevented, true,
        "ESPACIO se reserva para la escena incluso si el teclado empieza a repetir");
    assert.match(refs["cinematic-kicker"].textContent, /03:14 AM/,
        "una pulsación repetida no puede saltar otra escena de lectura");
    game.key(" ", { repeat: false, preventDefault() {} });
    assert.match(refs["cinematic-kicker"].textContent, /03:15 AM/,
        "una sola pulsación de ESPACIO mueve exactamente una escena");
    game.control("cinematic-next");
    game.control("cinematic-next");
    assert.match(refs["cinematic-lines"].innerHTML, /MANGUANGUA/,
        "la aparición revela a la entidad ficticia como Manguangua");
    assert.ok(tones.includes("manguanguaWhisper"),
        "la aparición activa el susurro sintético de la entidad");

    game.control("cinematic-next");
    game.control("cinematic-next");
    assert.strictEqual(game.phase, "tutorial", "la última escena abre la guía antes de entregar el turno");
    assert.strictEqual(refs.cinematic.hidden, true, "la capa cinematográfica desaparece al abrir la guía");
    assert.strictEqual(refs.tutorial.hidden, false, "el tutorial se presenta como una capa propia");
    assert.match(refs["tutorial-speaker"].textContent, /SIL/,
        "Sil abre el tutorial explicando cómo leer cámaras");
    assert.match(refs["tutorial-action"].textContent, /C ABRE EL MONITOR/,
        "el primer paso explica los controles reales de cámara");
    const tutorialEnergy = game.energy;
    const tutorialPanic = game.panic;
    game.update(9000);
    assert.strictEqual(game.energy, tutorialEnergy, "la guía no consume energía mientras se lee");
    assert.strictEqual(game.panic, tutorialPanic, "la guía no cambia pánico mientras se lee");
    let tutorialKeyPrevented = false;
    game.key(" ", { repeat: false, preventDefault() { tutorialKeyPrevented = true; } });
    assert.strictEqual(tutorialKeyPrevented, true, "ESPACIO avanza manualmente la guía");
    assert.match(refs["tutorial-speaker"].textContent, /DAVINCHI/,
        "Davinchi explica las alertas en el segundo paso");
    game.control("tutorial-next");
    assert.match(refs["tutorial-speaker"].textContent, /DESIRE/,
        "Desire explica las respuestas de cliente");
    game.control("tutorial-next");
    assert.match(refs["tutorial-speaker"].textContent, /ROG/,
        "Rog explica cómo actuar cuando la oficina queda oscura");
    game.control("tutorial-next");
    assert.strictEqual(game.phase, "interlude", "la guía entrega una primera transmisión manual, no un reloj activo");
    assert.strictEqual(refs.tutorial.hidden, true, "la guía desaparece antes del interludio inicial");
    game.control("continue");
    assert.strictEqual(game.phase, "running", "la transmisión inicial entrega finalmente el control de la guardia");
    assert.match(refs.clock.textContent, /3:18 AM/,
        "la guardia jugable empieza a las 03:18 AM");
    assert.strictEqual(refs["desk-clock"].textContent, refs.clock.textContent,
        "el monitor físico del escritorio replica la hora operativa de la guardia");
    assert.match(refs["desk-monitor-status"].textContent, /CANAL DE SOPORTE/,
        "el CRT de escritorio muestra un estado legible incluso sin mensajes pendientes");
    assert.match(refs["transcript-list"].innerHTML, /ROG|SIL/,
        "las transmisiones de apertura dejan rastro en el transcript");

    /* El monitor es una capa de toda la guardia y conserva una escena legible
       aunque Capriles no esté en el encuadre. */
    game.control("camera");
    assert.strictEqual(game.monitorOpen, true, "C abre el monitor de vigilancia");
    assert.strictEqual(refs["camera-feed"].dataset.camera, "recepcion",
        "la cámara activa identifica la escena de Recepción desde el primer cuadro");
    assert.match(refs["camera-scene-label"].textContent, /RECEPCIÓN.*CAM 01/,
        "el feed deja visible el rótulo de la escena, no una pantalla vacía");
    game.selectCamera("archivo");
    assert.strictEqual(refs["camera-feed"].dataset.camera, "archivo",
        "cada cámara actualiza la escena que dibuja el monitor");
    assert.match(refs["camera-scene-label"].textContent, /ARCHIVO MUERTO.*CAM 03/,
        "Archivo Muerto conserva un nombre visible dentro del feed");
    game.control("camera");
    assert.strictEqual(game.monitorOpen, false, "C baja el monitor y devuelve la vista de oficina");

    assert.match(refs["radio-portrait"].src, /^asset:\/\/character\./,
        "la consola conserva sólo el retrato de la persona que está hablando");
    assert.ok(refs["radio-name"].textContent && refs["radio-message"].textContent,
        "la intervención muestra nombre y comunicación actual, no cinco tarjetas estáticas");
    game._cue("desire", "feliz", "La señal se aclara. Yo cubro el canal.", false);
    game._syncView(true);
    assert.match(refs["radio-portrait"].src, /character\.desire\.feliz/,
        "el único avatar cambia al personaje que toma la palabra");
    assert.strictEqual(refs["radio-name"].textContent, "DESIRE",
        "la tarjeta de voz identifica a la interlocutora actual");
    assert.strictEqual(refs["radio-panel"].style["--operator"], game.member("desire").color,
        "el único avatar hereda el color de la persona que toma la palabra");

    /* El horror psicológico es una puesta visual: puede oscurecer o parpadear,
       pero jamás cambia los valores que deciden una partida. */
    const visualSnapshot = {
        energy: game.energy,
        panic: game.panic,
        elapsed: game.elapsed,
        advanceTimer: game.advanceTimer,
        attackTimer: game.attackTimer
    };
    game.nextPsychologicalAt = game.levelElapsed;
    game._updatePsychologicalHorror(0);
    assert.strictEqual(game.psychologicalKind, "flicker", "el primer evento visual es un parpadeo breve");
    assert.strictEqual(root.classList.contains("is-psychological-flicker"), true,
        "el parpadeo recibe una clase visual propia");
    assert.deepStrictEqual({
        energy: game.energy,
        panic: game.panic,
        elapsed: game.elapsed,
        advanceTimer: game.advanceTimer,
        attackTimer: game.attackTimer
    }, visualSnapshot, "el parpadeo no altera recursos, reloj ni amenaza");
    game._updatePsychologicalHorror(2000);
    game.nextPsychologicalAt = game.levelElapsed;
    game._updatePsychologicalHorror(0);
    assert.strictEqual(game.psychologicalKind, "cut", "el siguiente evento apaga visualmente la oficina");
    assert.strictEqual(root.classList.contains("is-psychological-cut"), true,
        "el corte ambiental no se confunde con el apagón real de batería");
    game._updatePsychologicalHorror(2000);
    game.nextPsychologicalAt = Infinity;

    /* Evita que el recorrido heredado dependa de una ruta aleatoria: las
       rutas y los clientes se verifican de forma aislada más abajo. */
    game.nextBreachAt = Infinity;
    game.nextClientAt = Infinity;

    game.energy = 60;
    game.panic = 43;
    game.applyVipBonus({
        turno404: { energy: 10, panic: 8, clientGrace: 1100, ventDiscount: 2 }
    }, ["turno-cafe"]);
    assert.strictEqual(game.energy, 70, "el apoyo VIP suma energía sin superar el máximo");
    assert.strictEqual(game.panic, 35, "el apoyo VIP reduce el pánico inicial");
    assert.strictEqual(game.vipTurnoBonus.ventDiscount, 2,
        "el apoyo de compañeros/suministros conserva el descuento de ducto");
    assert.match(String(harness.statuses.at(-1)), /VIP CENTRAL/,
        "la aplicación del apoyo VIP queda registrada en la consola");

    completeObjective(game, "pasillo", game._objectiveNeed());
    assert.match(refs["objective-state"].textContent, /LISTO/,
        "el HUD confirma que la primera pista de cámara fue validada");

    /* La llamada es un evento jugable, no sólo una línea de diálogo. */
    game.update(game._currentLevel().signal.at - game.levelElapsed + 100);
    assert.strictEqual(game.callActive, true, "la primera llamada hostil queda activa en el turno");
    assert.strictEqual(root.classList.contains("is-call-active"), true,
        "la llamada activa enciende el estado visual urgente");
    assert.ok(tones.includes("interferencia"),
        "una llamada hostil emite su interferencia antes de exigir respuesta");
    game.control("signal");
    assert.strictEqual(game.callResolved, true, "E o CORTAR SEÑAL resuelve la llamada a tiempo");
    assert.strictEqual(game.callActive, false, "la llamada deja de castigar al cortarla");

    /* El ducto es otro peligro activo: V debe sellarlo antes de que penalice. */
    game.update(game._currentLevel().vent.at - game.levelElapsed + 100);
    assert.strictEqual(game.ventActive, true, "la alerta del ducto se activa durante el primer turno");
    assert.match(refs["vent-countdown"].textContent, /V/,
        "el HUD indica la tecla V y el tiempo de respuesta del ducto");
    assert.strictEqual(root.classList.contains("is-vent-active"), true,
        "la rejilla recibe un estado visual de amenaza");
    let ventKeyPrevented = false;
    game.key("V", { preventDefault() { ventKeyPrevented = true; } });
    assert.strictEqual(ventKeyPrevented, true, "la tecla V consume el atajo de descarga");
    assert.strictEqual(game.ventResolved, true, "V o DESCARGA DUCTO sella el acceso a tiempo");
    assert.strictEqual(game.ventActive, false, "el ducto deja de estar activo al descargarlo");
    assert.match(refs["vent-countdown"].textContent, /SELLADO/,
        "el HUD conserva el resultado del cierre del ducto");

    /* Las rutas laterales tienen respuesta propia y congelan el avance de
       puerta para que la presión no se vuelva arbitraria. */
    const screamsBeforeBreaches = audioPlays.filter((play) => play.id === "audio.turno404-scream").length;
    const advanceBeforeBreach = 9800;
    game.advanceTimer = advanceBeforeBreach;
    harness.setRandomRolls([0]);
    game.lastBreachRoute = "";
    game._triggerBreach();
    assert.strictEqual(game.breach.id, "ducto", "la primera ruta lateral puede irrumpir por el ducto");
    game._updateThreat(1000, 1);
    assert.strictEqual(game.advanceTimer, advanceBeforeBreach,
        "una ruta lateral pausa el avance normal de la puerta mientras se responde");
    game.key("V", { preventDefault() {} });
    assert.strictEqual(game.breach, null, "V contiene la irrupción lateral de ducto");

    harness.setRandomRolls([0]);
    game.lastBreachRoute = "ducto";
    game._triggerBreach();
    assert.strictEqual(game.breach.id, "ventana", "la segunda ruta lateral puede llegar por el ventanal");
    assert.strictEqual(root.classList.contains("is-breach-window"), true,
        "el ventanal recibe un estado visual separado");
    game.lightOn = false;
    game.key("L", { preventDefault() {} });
    assert.strictEqual(game.breach, null, "L repele al Manguangua que cubre el vidrio");
    game.lightOn = false;
    game.lightTimer = 0;

    harness.setRandomRolls([0.99]);
    game.lastBreachRoute = "ventana";
    game._triggerBreach();
    assert.strictEqual(game.breach.id, "archivo", "la tercera ruta lateral puede abrirse desde el archivo");
    game.key("3", { preventDefault() {} });
    assert.strictEqual(game.breach, null, "CAM 03 contiene la irrupción de archivo");
    assert.ok(audioPlays.filter((play) => play.id === "audio.turno404-scream").length >= screamsBeforeBreaches + 3,
        "cada aparición lateral reproduce el asset de grito de Manguangua");

    /* Un aviso de cliente abre una computadora: Q sólo muestra el mensaje;
       la resolución exige una de tres respuestas rápidas contextuales. */
    game._triggerClientMessage();
    const clientCaseId = game.clientActive.id;
    const clientScore = game.score;
    const clientEnergy = game.energy;
    const clientPanic = game.panic;
    assert.strictEqual(root.classList.contains("is-client-active"), true,
        "un mensaje de cliente activa su estado visual urgente");
    assert.strictEqual(refs["client-notice"].hidden, false,
        "un cliente nuevo muestra una notificación dentro del monitor físico");
    assert.strictEqual(refs["desk-monitor"].classList.contains("is-client-active"), true,
        "el CRT cambia de estado cuando llega un mensaje, sin usar una tarjeta flotante");
    assert.strictEqual(refs["client-notice-preview"].textContent, game.clientActive.message,
        "la pantalla de escritorio adelanta el mensaje que debe abrirse");
    assert.strictEqual(game.clientActive.choices.length, 3,
        "cada mensaje prepara exactamente tres respuestas rápidas");
    assert.strictEqual(game.clientActive.choices.filter((choice) => choice.correct).length, 1,
        "sólo la frase que acompaña al cliente resuelve correctamente cada caso");
    assert.ok(game.clientActive.choices.some((choice) => choice.dry)
        && game.clientActive.choices.some((choice) => choice.harsh),
    "las otras dos respuestas conservan los tonos seco y sarcástico sin nombrarlos al jugador");
    let clientKeyPrevented = false;
    game.key("Q", { preventDefault() { clientKeyPrevented = true; } });
    assert.strictEqual(clientKeyPrevented, true, "Q consume el atajo de atención al cliente");
    assert.strictEqual(game.clientTerminalOpen, true,
        "Q abre la pantalla de computadora en vez de contestar a ciegas");
    assert.strictEqual(refs["client-terminal"].hidden, false,
        "la terminal aparece al abrir el mensaje");
    assert.strictEqual(refs["client-terminal-message"].textContent, game.clientActive.message,
        "la terminal permite leer el mensaje completo antes de responder");
    assert.strictEqual(refs["client-terminal-signal"].textContent, game.clientActive.signal,
        "la terminal presenta la lectura técnica del incidente");
    assert.strictEqual(refs["client-terminal-evidence"].textContent, game.clientActive.evidence,
        "cada caso aporta una pista científica coherente y visible");
    assert.ok(refs["client-terminal-time"].textContent.startsWith(refs.clock.textContent)
        && /S$/.test(refs["client-terminal-time"].textContent),
        "el chat conserva la hora real de guardia junto al margen para responder");
    assert.strictEqual((refs["client-terminal-choices"].innerHTML.match(/data-client-choice/g) || []).length, 3,
        "la terminal renderiza tres botones de respuesta, sin etiquetas de tono");
    assert.match(refs["client-terminal-choices"].innerHTML, /RESPUESTA RÁPIDA[\s\S]*✓✓/,
        "las tres opciones se presentan como burbujas de respuesta de un chat, no como botones técnicos planos");
    assert.doesNotMatch(refs["client-terminal-choices"].innerHTML, /emp[aá]tica|sarc[aá]stica|seca/i,
        "los botones muestran frases naturales, no las categorías de conducta");
    const clientTimerBeforeBridge = game.clientActive.timer;
    const bridgeSeconds = Math.ceil(game.clientActive.holdDuration / 1000);
    let bridgeKeyPrevented = false;
    game.key("0", { preventDefault() { bridgeKeyPrevented = true; } });
    assert.strictEqual(bridgeKeyPrevented, true,
        "0 envía el mensaje puente desde el chat sin cerrar la conversación");
    assert.strictEqual(game.clientActive.holdUsed, true,
        "el mensaje 'permítame unos minutos' sólo prepara más lectura; no resuelve el caso");
    assert.ok(game.clientActive.timer >= clientTimerBeforeBridge + game.clientActive.holdDuration,
        "el mensaje puente añade una ventana real para leer y responder");
    assert.strictEqual(refs["client-hold"].disabled, true,
        "cada cliente acepta el mensaje de espera una sola vez, sin poder farmear tiempo");
    assert.match(refs["client-hold-message"].textContent, /Permítame unos minutos para verificar/,
        "el puente responde con una frase humana y explícita antes de la solución final");
    assert.ok(refs["client-hold-status"].textContent.includes(`+${bridgeSeconds}S`),
        "el chat comunica visualmente cuántos segundos extra concedió la verificación");
    const clientTimerAfterBridge = game.clientActive.timer;
    assert.strictEqual(game.requestClientTime(), false,
        "no se puede pedir tiempo dos veces al mismo cliente");
    assert.strictEqual(game.clientActive.timer, clientTimerAfterBridge,
        "un segundo intento no altera el reloj del cliente");
    const compassionate = game.clientActive.choices.find((choice) => choice.correct);
    game.key(String(compassionate.shortcut), { preventDefault() {} });
    assert.strictEqual(game.clientActive, null,
        "enviar la respuesta adecuada cierra el mensaje pendiente");
    assert.strictEqual(game.clientTerminalOpen, false,
        "la terminal vuelve a la oficina después de una respuesta");
    assert.ok(game.score >= clientScore + 125 && game.energy >= clientEnergy,
        "atender con cuidado suma puntuación y ayuda a recuperar energía");
    assert.ok(game.panic <= clientPanic, "la respuesta adecuada reduce la presión de pánico");

    game._triggerClientMessage();
    assert.notStrictEqual(game.clientActive.id, clientCaseId,
        "el mazo de incidencias evita repetir el mismo caso en mensajes consecutivos");
    const missedClientEnergy = game.energy;
    const missedClientPanic = game.panic;
    const missedClientAdvance = game.advanceTimer;
    game._updateClientMessages(game.clientActive.timer + 1);
    assert.strictEqual(game.clientActive, null, "el cliente vence si no recibe respuesta");
    assert.ok(game.energy <= missedClientEnergy - game._penalty(3)
        && game.panic >= missedClientPanic + game._penalty(9),
        "ignorar al cliente resta energía y aumenta pánico, de forma escalada");
    assert.ok(game.advanceTimer <= missedClientAdvance,
        "ignorar al cliente acelera la amenaza de la puerta");

    game.levelElapsed = game._levelDuration(game._currentLevel());
    game.update(1);
    assert.strictEqual(game.levelIndex, 1, "completar nivel 01 abre nivel 02");
    assert.strictEqual(game.phase, "interlude", "el cambio de turno conserva un puente narrativo");
    assert.match(refs["story-kicker"].textContent, /NIVEL 1 SUPERADO/,
        "el puente nombra el nivel que se acaba de superar");
    assert.strictEqual(levelRewards.length, 1,
        "cada tramo de guardia acredita una recompensa VIP al completarse");
    assert.match(levelRewards[0].label, /TURNO 404 · NIVEL 01 \/ 03 SUPERADO/,
        "la recompensa del nivel conserva el identificador de la guardia terminada");
    assert.ok(levelRewards[0].score >= 360,
        "la conversión de nivel recibe el score logrado en ese tramo");

    game.update(9000);
    assert.strictEqual(game.phase, "interlude",
        "el puente narrativo tampoco desaparece solo mientras se lee");
    assert.match(refs["story-message"].textContent, /Noche|canal|archivo/i,
        "el texto de relevo sigue disponible después de esperar");
    game.control("continue");
    completeObjective(game, "archivo", game._objectiveNeed());

    /* Ignorar una alerta siguiente aumenta pánico y acelera la amenaza. */
    const levelTwo = game._currentLevel();
    const panicBeforeVentFailure = game.panic;
    const advanceBeforeVentFailure = game.advanceTimer;
    game.levelElapsed = levelTwo.vent.at;
    game._updateNarrative(0);
    assert.strictEqual(game.ventActive, true, "cada turno programa su propia alerta de ducto");
    game._updateVent(game._responseWindow(levelTwo.vent.duration) + 1);
    assert.strictEqual(game.ventActive, false, "el ducto expira si no recibe la descarga");
    assert.ok(game.panic >= panicBeforeVentFailure + game._penalty(levelTwo.vent.penalty),
        "fallar el ducto agrega la penalización de pánico escalada");
    assert.ok(game.advanceTimer <= advanceBeforeVentFailure,
        "fallar el ducto acelera el avance de la amenaza");

    game.levelElapsed = game._levelDuration(game._currentLevel());
    game.update(1);
    assert.strictEqual(game.levelIndex, 2, "completar nivel 02 abre nivel 03");

    game.control("continue");
    completeObjective(game, "recepcion", game._objectiveNeed());
    assert.match(String(stats.night), /03\/03/, "el HUD refleja la progresión de tres sectores");

    /* La recta final sólo expone hitos de 05:xx. 06:00 pertenece al relevo,
       no al último fotograma jugable. */
    const finalDuration = game._levelDuration(game._currentLevel());
    game.dawn = false;
    game.levelElapsed = Math.ceil(finalDuration * 0.91);
    game._syncView(true);
    assert.match(refs.clock.textContent, /05:55 AM/,
        "la recta final llega a la marca mental de 05:55");
    /* Conflictos tardíos no pueden reprogramar una alerta en el pasado ni
       iniciar algo que termine después del relevo. */
    game.levelElapsed = finalDuration - 9200;
    game.nextBreachAt = game.levelElapsed;
    game.callActive = true;
    game._updateBreach(0);
    assert.strictEqual(game.nextBreachAt, Infinity,
        "un conflicto tardío cancela la brecha en vez de dejar una cita vencida");

    game.levelElapsed = finalDuration - 7000;
    game.nextClientAt = game.levelElapsed;
    game._updateClientMessages(0);
    assert.strictEqual(game.nextClientAt, Infinity,
        "un conflicto tardío cancela el cliente en vez de dejar una cita vencida");
    game.callActive = false;

    game.levelElapsed = finalDuration - 6200;
    game.nextBreachAt = game.levelElapsed;
    game.nextClientAt = game.levelElapsed;
    game._updateBreach(0);
    game._updateClientMessages(0);
    assert.strictEqual(game.nextBreachAt, Infinity,
        "la recta final no dispara una brecha con menos de su ventana justa");
    assert.strictEqual(game.nextClientAt, Infinity,
        "la recta final no dispara un cliente con menos de su ventana justa");

    game.levelElapsed = finalDuration;
    game._syncView(true);
    assert.match(refs.clock.textContent, /05:55 AM/,
        "06:00 no aparece mientras el último sector siga en juego");

    game._completeLevel();
    assert.strictEqual(game.phase, "interlude", "terminar el sector 03 cierra la primera noche en relevo");
    assert.strictEqual(game.night, 1, "el relevo conserva la noche completada hasta confirmar");
    assert.match(refs.clock.textContent, /06:00 AM/, "el relevo confirma las 06:00 AM");
    assert.strictEqual(harness.wins.length, 0, "una sola noche no concede aún la campaña completa");

    function clearNightSectors(expectedNight) {
        for (let sector = 0; sector < 3; sector += 1) {
            assert.strictEqual(game.phase, "running", `la noche ${expectedNight} entrega el sector ${sector + 1}`);
            game.objectiveDone = true;
            game._completeLevel();

            if (sector < 2) {
                assert.strictEqual(game.phase, "interlude", "cada sector intermedio conserva su puente narrativo");
                game.control("continue");
            }
        }
    }

    game.control("continue");
    assert.strictEqual(game.night, 2, "Enter desde 06:00 inicia la segunda noche");
    assert.strictEqual(game.levelIndex, 0, "cada noche vuelve a comenzar en el sector 01");
    clearNightSectors(2);
    assert.strictEqual(game.phase, "interlude", "la segunda noche también termina en un relevo");
    assert.strictEqual(game.night, 2, "el contador conserva la segunda noche hasta el siguiente Enter");
    assert.match(refs.clock.textContent, /06:00 AM/, "cada noche ganada alcanza 06:00 AM");

    game.control("continue");
    assert.strictEqual(game.night, 3, "el segundo relevo inicia la tercera noche");
    clearNightSectors(3);
    assert.strictEqual(game.phase, "won", "cerrar la tercera noche termina la campaña");
    assert.strictEqual(harness.wins.length, 1,
        "sólo sobrevivir tres noches concede la victoria de campaña");

    /* Fácil y Difícil conservan la misma campaña, pero exponen perfiles
       inequívocos a quien prefiere entrenar o recuperar la presión original. */
    const difficultyHarness = createHarness();
    const difficultyGame = difficultyHarness.game;
    difficultyGame.start();
    difficultyGame.selectDifficulty("facil");
    assert.strictEqual(difficultyGame.phase, "cinematic", "Fácil también abre la misma cinemática");
    assert.strictEqual(difficultyGame.panic, 10, "Fácil ajusta la presión inicial al perfil elegido");
    assert.ok(difficultyGame._levelDuration(difficultyGame._currentLevel()) > game._levelDuration(game._currentLevel()),
        "Fácil concede más tiempo de turno que Normal");
    assert.ok(difficultyGame._responseWindow(6200) > game._responseWindow(6200),
        "Fácil concede la ventana de reacción más amplia");
    const hardHarness = createHarness();
    const hardGame = hardHarness.game;
    hardGame.start();
    hardGame.selectDifficulty("dificil");
    assert.strictEqual(hardGame.difficulty, "dificil", "Difícil se puede seleccionar desde el mismo protocolo");
    assert.strictEqual(hardGame.panic, 14, "Difícil restaura la presión inicial de referencia");
    assert.strictEqual(hardGame._levelDuration(hardGame._currentLevel()), hardGame._currentLevel().duration,
        "Difícil conserva la duración original de referencia");
    assert.strictEqual(hardGame._responseWindow(6200), 6200,
        "Difícil conserva la ventana de reacción original en la primera noche");

    const skipHarness = createHarness();
    const skipGame = skipHarness.game;
    skipGame.start();
    skipGame.selectDifficulty("normal");
    for (let index = 0; index < 5; index += 1) {
        skipGame.control("cinematic-next");
    }
    let skipPrevented = false;
    skipGame.key("Escape", { repeat: false, preventDefault() { skipPrevented = true; } });
    assert.strictEqual(skipPrevented, true, "ESC consume el gesto de saltar guía");
    assert.strictEqual(skipGame.phase, "interlude", "ESC sale de la guía sin arrancar el reloj");
    assert.strictEqual(skipHarness.refs.tutorial.hidden, true, "la guía queda cerrada al saltarla");

    /* Se fuerza una derrota durante una llamada: debe verse el rostro antes
       de que el shell reciba un GAME OVER adaptado a esa causa. */
    const lossHarness = createHarness();
    const lossGame = lossHarness.game;

    lossGame.start();
    lossGame.selectDifficulty("normal");
    for (let index = 0; index < 5; index += 1) {
        lossGame.control("cinematic-next");
    }
    for (let index = 0; index < 4; index += 1) {
        lossGame.control("tutorial-next");
    }
    lossGame.control("continue");
    lossGame.callActive = true;
    lossGame.callTriggered = true;
    lossGame._lose("La puerta quedó abierta durante la llamada.", "door");
    assert.strictEqual(lossGame.phase, "revealing", "la derrota entra primero en revelación");
    assert.strictEqual(lossHarness.refs["capriles-reveal"].hidden, false,
        "el Manguangua ocupa el plano con un overlay dedicado");
    assert.ok(lossHarness.audioPlays.some((play) => play.id === "audio.turno404-scream" && play.restart),
        "la revelación reinicia el asset de grito específico de la amenaza");

    lossGame.update(2700);
    assert.strictEqual(lossGame.phase, "lost", "la revelación desemboca en una derrota final");
    assert.strictEqual(lossHarness.gameOvers.length, 1,
        "el shell recibe un único GAME OVER después del plano");
    assert.match(lossHarness.gameOvers[0].title, /NO CORTASTE LA SEÑAL/,
        "el GAME OVER se adapta a que la llamada quedó abierta");
    assert.match(lossHarness.gameOvers[0].text, /camino hasta tu escritorio/i,
        "el texto de derrota explica la consecuencia concreta del encuentro");
}

async function flushAudioMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
}


async function smokeAudioCues() {
    const harness = createHarness();
    const { game, audioTracks, audioPlays, tones } = harness;

    game.phase = "running";
    game.levelIndex = 0;
    const firstTurnDuration = game._levelDuration(game._currentLevel());
    game.levelElapsed = firstTurnDuration - 1;
    game._syncAudio();
    await flushAudioMicrotasks();

    assert.strictEqual(
        audioPlays.filter((play) => play.id === "audio.turno404-horror").length,
        0,
        "horror-turno404 permanece en silencio antes de las 04:00 AM"
    );

    /* El reloj del primer sector llega exactamente a las 04:00: la pista
       nueva comienza desde casi silencio y su RAF largo hace el fundido. */
    game.levelElapsed = firstTurnDuration;
    game._syncAudio();
    await flushAudioMicrotasks();

    const horrorTrack = audioTracks.find((track) => track.id === "audio.turno404-horror");
    assert.ok(horrorTrack, "TURNO 404 crea la pista horror-turno404 de forma diferida");
    assert.strictEqual(
        audioPlays.filter((play) => play.id === "audio.turno404-horror").length,
        1,
        "horror-turno404 entra al alcanzar las 04:00 AM"
    );
    assert.ok(horrorTrack.volume > 0 && horrorTrack.volume < game._horrorVolume(),
        "la entrada de las 04:00 comienza por debajo del volumen objetivo"
    );
    assert.strictEqual(game.horrorFadeActive, true,
        "la entrada de horror mantiene un fundido progresivo, no un corte de volumen");
    assert.strictEqual(audioPlays.some((play) => play.id === "audio.horror"), false,
        "la pista antigua no sustituye el relevo horario entregado");

    game._triggerBreach();
    await flushAudioMicrotasks();
    assert.ok(audioPlays.some((play) => play.id === "audio.turno404-scream" && play.restart),
        "la aparición del Manguangua usa el asset de gritos y lo reinicia por evento");
    assert.strictEqual(tones.includes("caprilesScream"), false,
        "el sintetizador no acompaña al asset cuando el grito nativo puede sonar");

    game.manguanguaScreamTrack = null;
    game._playManguanguaScream();
    assert.ok(tones.includes("caprilesScream"),
        "el grito procedural se conserva como fallback si el asset no está disponible");
}


function smokeContracts() {
    assert.ok(SOURCE.includes("const OPENING_CINEMATIC = [")
        && ["anomaly", "outage", "dossier", "apparition", "lockdown"].every((id) => SOURCE.includes(`id: "${id}"`)),
    "la campaña declara las cinco escenas de apertura del incidente");
    assert.ok(SOURCE.includes("const TURNOS = [")
        && ["canal-rojo", "archivo-vivo", "ultima-hora"].every((id) => SOURCE.includes(`id: "${id}"`)),
    "la campaña declara tres turnos progresivos hasta las seis");
    assert.ok(SOURCE.includes("03:14 AM")
        && SOURCE.includes("03:18 — 04:00 AM")
        && SOURCE.includes("05:00 — 06:00 AM"),
    "la cronología va de las 03:14 AM al amanecer");
    assert.ok(SOURCE.includes("HORROR_ENTRY_MINUTES = 4 * 60")
        && SOURCE.includes("HORROR_ENTRY_FADE_MS = 3000")
        && SOURCE.includes("_hasReachedHorrorHour")
        && SOURCE.includes("audio.turno404-horror"),
    "horror-turno404 está ligado al reloj de las 04:00 AM con una entrada progresiva");
    assert.ok(SOURCE.includes("turno404__cinematic")
        && SOURCE.includes("data-control=\"cinematic-next\"")
        && SOURCE.includes("advanceCinematic")
        && SOURCE.includes("MANUAL_NARRATIVE_ADVANCE")
        && SOURCE.includes("LECTURA MANUAL")
        && !SOURCE.includes("AUTOENLACE"),
    "el DOM y la lógica conectan una cinemática manual, sin avance automático");
    assert.ok(SOURCE.includes("const OFFICE_TUTORIAL = [")
        && ["camaras", "alarmas", "cuidado", "oscuridad"].every((id) => SOURCE.includes(`id: "${id}"`))
        && SOURCE.includes("advanceTutorial")
        && SOURCE.includes("skipTutorial")
        && SOURCE.includes('data-role="tutorial"')
        && SOURCE.includes("tutorial-next")
        && CSS_SOURCE.includes("turno404__tutorial"),
    "el equipo ofrece una guía manual de cámaras, alertas, clientes y oscuridad antes de la guardia");
    assert.ok(SOURCE.includes("data-control=\"vent\"")
        && SOURCE.includes("dischargeVent")
        && SOURCE.includes("_updateVent"),
    "el ducto tiene control V, resolución y penalización propia");
    assert.ok(SOURCE.includes("turno404__story")
        && SOURCE.includes("turno404__transcript")
        && SOURCE.includes("data-control=\"signal\""),
    "el DOM conserva historia, transcripción y respuesta a llamadas");
    assert.ok(SOURCE.includes("CAPRILES_REVEAL_MS")
        && SOURCE.includes("is-capriles-reveal")
        && SOURCE.includes("_playManguanguaScream")
        && SOURCE.includes("audio.turno404-scream"),
    "la pérdida tiene una fase de revelación explícita y usa el grito entregado");
    assert.ok(AUDIO_SOURCE.includes("manguanguaWhisper")
        && AUDIO_SOURCE.includes("caprilesScream")
        && AUDIO_SOURCE.includes("interferencia: () =>"),
    "el motor de audio define susurro sintético, señal rota y grito agudo");
    assert.ok(SOURCE.includes("Amor, son pasos")
        && SOURCE.includes("La onda no cuadra con agua, yeah")
        && SOURCE.includes("Déjame revisar otra vez")
        && SOURCE.includes("Mira el dato, no el miedo")
        && SOURCE.includes("miembro fundador"),
    "Desire, Davinchi, Rog, Sil y Colinas conservan firmas reconocibles durante la guardia");
    assert.ok(SOURCE.includes("const NIGHT_COUNT = 3")
        && SOURCE.includes("FINAL_CLOCK_STEPS")
        && SOURCE.includes("_closeNight")
        && SOURCE.includes("SOBREVIVISTE TRES NOCHES"),
        "la campaña enlaza tres noches y reserva las 06:00 para cada relevo");
    assert.ok(["ducto", "ventana", "archivo"].every((id) => SOURCE.includes(`id: "${id}"`))
        && SOURCE.includes("_triggerBreach")
        && SOURCE.includes("_resolveBreach")
        && SOURCE.includes("audio.turno404-scream")
        && SOURCE.includes("_playManguanguaScream"),
        "Manguangua usa ducto, ventanal y archivo con respuestas y el grito propio entregado");
    assert.ok(SOURCE.includes("CUSTOMER_MESSAGES")
        && SOURCE.includes("openClientTerminal")
        && SOURCE.includes("_clientChoices")
        && SOURCE.includes("_nextClientTemplate")
        && SOURCE.includes("clientDeck")
        && SOURCE.includes("CLIENT_HOLD_TEXT")
        && SOURCE.includes("requestClientTime()")
        && SOURCE.includes('data-client-hold')
        && SOURCE.includes('data-role="desk-clock"')
        && SOURCE.includes('data-role="desk-monitor"')
        && !SOURCE.includes('<button class="turno404__client-notice"')
        && SOURCE.includes('data-role="client-terminal"')
        && SOURCE.includes("turno404__client-chat-thread")
        && SOURCE.includes('data-role="client-terminal-evidence"')
        && SOURCE.includes("AUTENTICACIÓN // FIRMA Y CANAL REAL")
        && SOURCE.includes('data-client-choice="${choice.id}"')
        && SOURCE.includes("Abre la notificación o pulsa Q")
        && CSS_SOURCE.includes("MONITOR DE ESCRITORIO + CHAT DE SOPORTE")
        && CSS_SOURCE.includes("turno404__client-hold"),
        "los clientes avisan dentro del CRT, muestran la hora, casos variados y un chat con mensaje puente más tres respuestas contextuales");
    const customerStart = SOURCE.indexOf("const CUSTOMER_MESSAGES");
    const customerEnd = SOURCE.indexOf("/* La historia usa", customerStart);
    const customerCases = SOURCE.slice(customerStart, customerEnd);
    assert.ok((customerCases.match(/id: "/g) || []).length >= 15,
        "el mazo ofrece al menos quince casos variados antes de repetir incidencias");
    assert.ok(SOURCE.includes("const TURNO_DIFFICULTIES")
        && SOURCE.includes("openDifficultySelection()")
        && SOURCE.includes("selectDifficulty(id)")
        && SOURCE.includes('data-turno-difficulty')
        && SOURCE.includes("_responseWindow")
        && SOURCE.includes("_levelDuration")
        && CSS_SOURCE.includes("turno404__difficulty")
        && CSS_SOURCE.includes("turno404__client-terminal-evidence"),
        "TURNO 404 ofrece protocolos visibles y escala tiempo, presión y lectura técnica");
    assert.ok(SOURCE.includes("applyVipBonus")
        && SOURCE.includes('vipTicket: "turno404"')
        && SOURCE.includes("clientGrace")
        && SOURCE.includes("ventDiscount"),
        "TURNO 404 acepta el apoyo persistente de VIP Central");
    const monitorIndex = SOURCE.indexOf('<section class="turno404__monitor');
    const mainCloseBeforeMonitor = SOURCE.lastIndexOf("</main>", monitorIndex);
    assert.ok(monitorIndex > -1 && mainCloseBeforeMonitor > -1 && mainCloseBeforeMonitor < monitorIndex
        && SOURCE.includes("turno404__monitor--full")
        && SOURCE.includes('data-role="camera-scene-label"')
        && ["recepcion", "pasillo", "archivo"].every((id) => CSS_SOURCE.includes(`[data-camera="${id}"]`))
        && CSS_SOURCE.includes("turno404__camera-scene")
        && CSS_SOURCE.includes("MONITOR DE GUARDIA A PANTALLA COMPLETA"),
    "el monitor cubre la guardia completa y cada cámara conserva una escena identificable");
    assert.ok(!SOURCE.includes("data-operator-visual")
        && !SOURCE.includes('data-operator="${member.id}"')
        && !SOURCE.includes("feature(id)")
        && SOURCE.includes("turno404__radio--speaker")
        && CSS_SOURCE.includes("turno404__radio--speaker"),
    "el elenco deja la fila estática: sólo aparece el avatar de quien toma la palabra");
    assert.ok(SOURCE.includes("_updatePsychologicalHorror")
        && SOURCE.includes("psychologicalKind")
        && SOURCE.includes("no cambian reloj, energía, pánico")
        && CSS_SOURCE.includes("turno404__power-cut")
        && CSS_SOURCE.includes("is-psychological-cut")
        && CSS_SOURCE.includes("turno-psychological-flicker"),
    "los parpadeos y cortes psicológicos son visuales, internos a la oficina y no punitivos");
    assert.ok(CSS_SOURCE.includes("turno404__cinematic")
        && CSS_SOURCE.includes("turno404__ceiling-vent")
        && CSS_SOURCE.includes("turno404__capriles-reveal")
        && CSS_SOURCE.includes("turno404__client-terminal")
        && CSS_SOURCE.includes("turno-client-whisper"),
    "los estilos presentan cinemática, alertas, consola de cliente y horror de interferencia");
}


async function run() {
    smokeCampaign();
    await smokeAudioCues();
    smokeContracts();
    console.log("✓ TURNO 404 smoke: guía, audio 04:00, rutas, clientes, VIP y derrota contextual");
}

run().catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
});
