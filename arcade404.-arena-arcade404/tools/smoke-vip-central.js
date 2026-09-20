#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — smoke de VIP Central
   ---------------------------------------------------------
   Verifica la economía global sin navegador: saldo inicial cero, score
   convertido en FICHAS, entradas, suministros, trivia de afinidad,
   niveles, companions de mundo y las reacciones que GameShell entrega a cada ROM.
   ========================================================= */

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const VIP_SOURCE = fs.readFileSync(path.join(ROOT, "js", "core", "vip.js"), "utf8");
const CENTRAL_SOURCE = fs.readFileSync(path.join(ROOT, "js", "core", "vip-central.js"), "utf8");
const VIP_CSS = fs.readFileSync(path.join(ROOT, "css", "screens", "vip.css"), "utf8");
const SHELL_SOURCE = fs.readFileSync(path.join(ROOT, "js", "core", "game-shell.js"), "utf8");
const ROUTER_SOURCE = fs.readFileSync(path.join(ROOT, "js", "core", "router.js"), "utf8");
const HUB_SOURCE = fs.readFileSync(path.join(ROOT, "js", "core", "hub.js"), "utf8");
const INDEX = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const APP_SOURCE = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
const OP_SOURCE = fs.readFileSync(path.join(ROOT, "js", "games", "op404", "game.js"), "utf8");
const TURNO_SOURCE = fs.readFileSync(path.join(ROOT, "js", "games", "turno404.js"), "utf8");

const GAME_IDS = [
    "snake", "invaders", "pong", "breaker", "tetris",
    "chess", "blockblast", "pac404", "op404", "turno404"
];

function createVip(initialState, options = {}) {
    const records = new Map();
    const writes = [];
    const hostname = String(options.hostname || "");

    if (initialState !== undefined) {
        records.set("vip-central:v1", JSON.parse(JSON.stringify(initialState)));
    }

    const A = {
        storage: {
            getObject(key, fallback) {
                return records.has(key) ? records.get(key) : fallback;
            },
            setObject(key, value) {
                /* Simula la serialización de localStorage para detectar que
                   el estado no dependa de referencias mutables del cliente. */
                const saved = JSON.parse(JSON.stringify(value));
                records.set(key, saved);
                writes.push({ key, value: saved });
            }
        }
    };

    vm.runInNewContext(VIP_SOURCE, {
        window: { Arcade404: A, location: { hostname } },
        Date,
        JSON,
        Math,
        Number,
        Object,
        Array,
        Set,
        console
    }, { filename: "js/core/vip.js" });

    assert.ok(A.vip, "VIP Central expone una API de economía global");
    return { vip: A.vip, A, writes, records };
}

function replace(vip, patch = {}) {
    vip._replaceForTest(Object.assign({
        fichas: 500,
        totalEarned: 500,
        tickets: { op404: 2, turno404: 2 },
        inventory: { "op-kit": 0, "turno-cafe": 0, "turno-buffer": 0 },
        companions: {},
        activeCompanion: null,
        previewTestStipendClaimed: false,
        runs: {},
        ledger: []
    }, patch));
}

function smokeStateNormalization() {
    /* Una versión parcial del estado no debe borrar las claves que se
       añadieron después al catálogo ni fabricar números negativos. */
    const { vip } = createVip({
        fichas: 9,
        tickets: { op404: 0 },
        inventory: { "op-kit": 2 },
        companions: { rog: { unlocked: true, affinity: 31 } }
    });
    const restored = vip.snapshot();

    assert.strictEqual(restored.fichas, 9, "la migración conserva el saldo existente");
    assert.strictEqual(restored.tickets.op404, 0, "la migración conserva el ticket gastado");
    assert.strictEqual(restored.tickets.turno404, 0,
        "un guardado parcial recibe la clave de ticket nueva sin pases de cortesía");
    assert.strictEqual(restored.inventory["op-kit"], 2, "la migración conserva el inventario existente");
    assert.strictEqual(restored.inventory["turno-buffer"], 0,
        "la migración añade suministros nuevos sin tocar los anteriores");
    assert.ok(restored.companions.rog.unlocked && restored.companions.rog.level >= 2,
        "la migración conserva afinidad y vuelve a calcular el nivel del compañero");
    assert.deepStrictEqual(restored.companions.rog.trivia,
        { answered: 0, correct: 0, incorrect: 0, completed: false },
        "la migración añade una conversación de cinco bloques sin fabricar respuestas");
    assert.strictEqual(restored.vipIntroSeen, false,
        "la migración habilita la introducción de Sala VIP para guardados anteriores");

    const { vip: legacyVip } = createVip({
        version: 2,
        fichas: 72,
        totalEarned: 72,
        tickets: { op404: 1, turno404: 1 },
        inventory: { "op-kit": 0, "turno-cafe": 0, "turno-buffer": 0 },
        companions: {},
        activeCompanion: null,
        runs: {},
        ledger: []
    });
    assert.strictEqual(legacyVip.snapshot().fichas, 0,
        "el perfil de cortesía intacto de la versión anterior migra al nuevo inicio cero");
    assert.strictEqual(legacyVip.ticketsFor("op404"), 0,
        "la migración elimina sólo los pases de cortesía que nunca se usaron");

    const { vip: automaticPreview } = createVip({
        version: 3,
        fichas: 10000,
        totalEarned: 10000,
        tickets: { op404: 0, turno404: 0 },
        inventory: { "op-kit": 0, "turno-cafe": 0, "turno-buffer": 0 },
        companions: {},
        activeCompanion: null,
        runs: {},
        ledger: [{ type: "preview-credit", amount: 10000, label: "BONO DE PRUEBAS ARENA" }]
    });
    assert.strictEqual(automaticPreview.snapshot().fichas, 0,
        "un perfil intacto con el antiguo crédito automático vuelve al inicio de cero");
    assert.deepStrictEqual(automaticPreview.snapshot().ledger, [],
        "la limpieza del crédito automático no deja una recompensa fantasma en la bitácora");

    const progressedPreview = {
        version: 3,
        fichas: 9940,
        totalEarned: 10000,
        tickets: { op404: 1, turno404: 0 },
        inventory: { "op-kit": 0, "turno-cafe": 0, "turno-buffer": 0 },
        companions: {},
        activeCompanion: null,
        runs: { snake: 1 },
        ledger: [
            { type: "preview-credit", amount: 10000, label: "BONO DE PRUEBAS ARENA" },
            { type: "ticket", amount: -60, label: "PASE OPERACIÓN 404" }
        ]
    };
    const { vip: retainedProgress } = createVip(progressedPreview);
    assert.strictEqual(retainedProgress.snapshot().fichas, 9940,
        "la normalización nunca descuenta un saldo que ya tenga compras o progreso real");
}


function smokeEconomy() {
    const { vip, writes } = createVip();
    const initial = vip.snapshot();

    assert.strictEqual(initial.fichas, 0, "un perfil nuevo inicia con saldo cero de FICHAS VIP");
    assert.strictEqual(initial.totalEarned, 0, "un perfil nuevo no fabrica saldo histórico");
    assert.strictEqual(initial.previewTestStipendClaimed, false,
        "un perfil nuevo conserva sin usar el vale manual, sin convertirlo en saldo inicial");
    assert.strictEqual(initial.tickets.op404, 0, "OPERACIÓN 404 no entrega un ticket de cortesía");
    assert.strictEqual(initial.tickets.turno404, 0, "TURNO 404 no entrega un ticket de cortesía");
    assert.strictEqual(vip.CAMPAIGN_TICKETS_ENABLED, false,
        "los tickets de campaña quedan desactivados durante los ajustes");
    assert.strictEqual(vip.needsTicket("op404"), false,
        "OP404 abre sin ticket");
    assert.strictEqual(vip.needsTicket("turno404"), false,
        "TURNO404 abre sin ticket");
    assert.strictEqual(vip.isCampaignOpen("op404"), true,
        "la API declara el acceso abierto de OPERACIÓN 404");
    assert.deepStrictEqual(Object.keys(initial.ticketCatalog), [],
        "el mostrador no publica pases que no se necesitan durante los ajustes");
    assert.strictEqual(vip.needsTicket("snake"), false, "los arcades libres no consumen ticket");
    assert.strictEqual(vip.hasSeenVipIntro(), false,
        "un perfil nuevo conserva pendiente la cinemática inicial de la Sala VIP");
    assert.strictEqual(vip.markVipIntroSeen(), true,
        "completar la introducción la persiste una única vez");
    assert.strictEqual(vip.hasSeenVipIntro(), true,
        "la introducción ya vista no se fuerza en accesos posteriores");

    const openAtZero = vip.entry("op404");
    assert.strictEqual(openAtZero.ok, true,
        "una campaña se inicia desde saldo cero mientras el acceso está abierto");
    assert.strictEqual(openAtZero.access, "open",
        "la entrada abierta se identifica sin fabricar un ticket");
    assert.strictEqual(vip.ticketsFor("op404"), 0,
        "el acceso abierto no crea ni consume pases heredados");
    const openTurnoAtZero = vip.entry("turno404");
    assert.strictEqual(openTurnoAtZero.ok, true,
        "TURNO 404 también se inicia desde saldo cero sin ticket");
    assert.strictEqual(openTurnoAtZero.access, "open",
        "el acceso abierto cubre las dos campañas");
    const firstFreeReward = vip.completeRun("snake", 0, false);
    assert.ok(firstFreeReward.reward >= 3,
        "un primer intento libre sin score deja el mínimo para progresar desde cero");
    const scoreReward = vip.completeRun("snake", 500, false);
    assert.strictEqual(scoreReward.scoreConverted, 10,
        "cada 50 puntos de score se convierte linealmente en una FICHA VIP");
    assert.ok(scoreReward.reward > firstFreeReward.reward,
        "un score mayor entrega proporcionalmente más FICHAS VIP");

    replace(vip, { tickets: { op404: 2, turno404: 1 } });
    const beforeEntry = vip.snapshot();
    const firstOp = vip.entry("op404");
    const secondOp = vip.entry("op404");
    const thirdOp = vip.entry("op404");
    assert.ok(firstOp.ok && secondOp.ok && thirdOp.ok,
        "OPERACIÓN 404 permite entradas repetidas sin exigir tickets");
    assert.strictEqual(vip.ticketsFor("op404"), 2,
        "el acceso abierto no descuenta los pases guardados en perfiles anteriores");
    assert.strictEqual(vip.snapshot().fichas, beforeEntry.fichas,
        "abrir una campaña no confunde el acceso con FICHAS VIP");

    const freeBefore = vip.snapshot();
    const freeEntry = vip.entry("snake");
    assert.strictEqual(freeEntry.ok, true, "una ROM libre se puede iniciar sin ticket");
    assert.strictEqual(vip.snapshot().fichas, freeBefore.fichas,
        "abrir una ROM libre no cobra FICHAS VIP");

    const payoutBefore = vip.snapshot().fichas;
    GAME_IDS.forEach((gameId, index) => {
        const result = vip.completeRun(gameId, 200 + index * 120, index % 2 === 0);
        assert.strictEqual(result.ok, true, `${gameId} acredita una recompensa global al cerrar una partida`);
        assert.ok(result.reward >= 4, `${gameId} entrega al menos la recompensa mínima de FICHAS VIP`);
    });
    const afterPayout = vip.snapshot();
    assert.ok(afterPayout.fichas > payoutBefore,
        "jugar todos los juegos —incluidos OP404 y TURNO404— aumenta las FICHAS VIP");
    assert.ok(afterPayout.runs.op404 >= 1 && afterPayout.runs.turno404 >= 1,
        "las dos campañas registran sus intentos en la economía común");

    const beforeLevelReward = vip.snapshot().fichas;
    const levelReward = vip.completeLevel("op404", 600, "OPERACIÓN 404 · ZONA DE PRUEBA");
    assert.strictEqual(levelReward.scoreConverted, 5,
        "un nivel de campaña convierte sus propios puntos en FICHAS VIP");
    assert.ok(vip.snapshot().fichas > beforeLevelReward,
        "los hitos de campaña acreditan FICHAS antes del final de la partida");

    const fundsBeforeTicket = vip.snapshot().fichas;
    const ticketsBeforeTicket = vip.ticketsFor("turno404");
    const ticketResult = vip.buyTicket("turno404");
    assert.strictEqual(ticketResult.ok, false,
        "el mostrador no vende un ticket innecesario mientras las campañas están abiertas");
    assert.strictEqual(ticketResult.code, "tickets-disabled",
        "la solicitud de pase explica que el acceso ya está abierto");
    assert.strictEqual(vip.ticketsFor("turno404"), ticketsBeforeTicket,
        "desactivar tickets no modifica pases guardados");
    assert.strictEqual(vip.snapshot().fichas, fundsBeforeTicket,
        "un pase desactivado no descuenta FICHAS VIP");
    assert.ok(writes.length > 0, "las operaciones VIP persisten en storage");
}


function smokePreviewTestVoucher() {
    const { vip: normalVip, writes: normalWrites } = createVip();

    assert.strictEqual(normalVip.snapshot().fichas, 0,
        "un perfil normal conserva cero FICHAS sin recibir crédito al cargar");
    assert.strictEqual(normalVip.isArenaPreviewHost(), false,
        "el vale QA no se habilita fuera de un host de preview Arena");
    assert.strictEqual(normalVip.canClaimPreviewTestStipend(), false,
        "un perfil normal no puede reclamar la recompensa de calibración");
    const blocked = normalVip.claimPreviewTestStipend();
    assert.strictEqual(blocked.ok, false,
        "la API rechaza un vale de pruebas fuera del preview aunque se invoque directamente");
    assert.strictEqual(blocked.code, "preview-only",
        "el rechazo del vale identifica el aislamiento de entorno");
    assert.strictEqual(normalVip.snapshot().fichas, 0,
        "un intento bloqueado no modifica la cartera normal");
    assert.strictEqual(normalWrites.length, 0,
        "un intento bloqueado tampoco persiste créditos de QA");
    const { vip: rootDomainVip } = createVip(undefined, { hostname: "e2b.app" });
    assert.strictEqual(rootDomainVip.isArenaPreviewHost(), false,
        "el dominio raíz no habilita el vale: se exige un host *.e2b.app de preview");

    const { vip: previewVip, records, writes } = createVip(undefined, {
        hostname: "4316-arena-qa.e2b.app"
    });
    assert.strictEqual(previewVip.snapshot().fichas, 0,
        "un perfil nuevo del preview también inicia con cero FICHAS");
    assert.strictEqual(previewVip.isArenaPreviewHost(), true,
        "el host *.e2b.app habilita sólo el vale voluntario de calibración");
    assert.strictEqual(previewVip.canClaimPreviewTestStipend(), true,
        "el vale queda disponible una vez, sin acreditarse por sí solo");

    const claim = previewVip.claimPreviewTestStipend();
    assert.ok(claim.ok && claim.granted === previewVip.PREVIEW_TEST_STIPEND,
        "canjear voluntariamente el vale acredita el lote completo de pruebas");
    assert.strictEqual(previewVip.snapshot().fichas, previewVip.PREVIEW_TEST_STIPEND,
        "el lote QA entra en la misma cartera usada por tickets, objetos y vínculos");
    assert.strictEqual(previewVip.snapshot().previewTestStipendClaimed, true,
        "el perfil persiste que su recompensa única ya fue usada");
    assert.strictEqual(previewVip.snapshot().ledger[0].type, "preview-test-stipend",
        "la bitácora distingue el vale manual del antiguo crédito automático");
    assert.match(claim.message, /Jaja, come ahi tremendo pobre/,
        "la recompensa de Colinas conserva su remate de entrega requerido");
    assert.ok(writes.some((write) => write.value.previewTestStipendClaimed),
        "el canje voluntario persiste la marca de una sola vez");

    const balanceAfterClaim = previewVip.snapshot().fichas;
    const duplicate = previewVip.claimPreviewTestStipend();
    assert.strictEqual(duplicate.ok, false,
        "el vale no puede canjearse una segunda vez en el mismo perfil");
    assert.strictEqual(duplicate.code, "preview-stipend-claimed",
        "la segunda solicitud explica que el vale único ya se utilizó");
    assert.strictEqual(previewVip.snapshot().fichas, balanceAfterClaim,
        "un canje repetido no duplica las FICHAS QA");

    const persisted = records.get("vip-central:v1");
    const { vip: reloadedPreview } = createVip(persisted, { hostname: "4316-arena-qa.e2b.app" });
    assert.strictEqual(reloadedPreview.canClaimPreviewTestStipend(), false,
        "recargar el preview conserva el límite del vale por perfil");
}

function smokeSuppliesAndCompanions() {
    const { vip } = createVip();
    replace(vip, {
        inventory: { "op-kit": 1, "turno-cafe": 1, "turno-buffer": 1 },
        tickets: { op404: 1, turno404: 1 }
    });

    const opEntry = vip.entry("op404");
    assert.deepStrictEqual([...opEntry.usedItems], ["op-kit"],
        "el kit de campo se reserva y consume sólo al entrar a OP404");
    assert.strictEqual(opEntry.bonus.op404.claps, 1, "el kit añade una Bolsa CLAP a OP404");
    assert.ok(opEntry.bonus.op404.shield >= 32, "el kit concede carga inicial al escudo persistente de OP404");
    assert.strictEqual(vip.snapshot().inventory["turno-cafe"], 1,
        "un suministro de TURNO404 no se gasta durante OP404");

    const turnoEntry = vip.entry("turno404");
    assert.deepStrictEqual([...turnoEntry.usedItems].sort(), ["turno-buffer", "turno-cafe"].sort(),
        "los suministros compatibles se aplican al siguiente TURNO404");
    assert.strictEqual(turnoEntry.bonus.turno404.energy, 10, "el café añade energía al turno nocturno");
    assert.strictEqual(turnoEntry.bonus.turno404.panic, 8, "el café reduce el pánico inicial");
    assert.strictEqual(turnoEntry.bonus.turno404.clientGrace, 2200,
        "el buffer amplía el margen de mensajes de clientes");

    replace(vip, { fichas: 1000, totalEarned: 1000 });
    const rog = vip.unlockCompanion("rog");
    assert.strictEqual(rog.ok, true, "un compañero se puede desbloquear con FICHAS VIP");
    assert.strictEqual(vip.snapshot().activeCompanion, "rog", "el compañero desbloqueado queda activo de inmediato");
    assert.ok(vip.snapshot().companions.rog.unlocked, "el canal de Rog queda persistente");

    const rogTurno = vip.gameBonus("turno404");
    const rogOp = vip.gameBonus("op404");
    assert.ok(rogTurno.turno404.energy > 0, "Rog ofrece energía concreta dentro de TURNO404");
    assert.ok(rogOp.op404.shield > 0, "Rog ofrece escudo concreto dentro de OP404");
    assert.match(vip.reaction("turno404", "start").text, /energía|acceso/i,
        "Rog tiene una reacción específica de TURNO404");
    assert.notStrictEqual(vip.reaction("snake", "start").text, vip.reaction("op404", "start").text,
        "las reacciones del compañero cambian según la ROM");

    const affinityBefore = vip.snapshot().companions.rog.affinity;
    const run = vip.completeRun("turno404", 1800, true);
    assert.strictEqual(run.affinity.gain, 8, "una victoria de TURNO404 entrega afinidad reforzada al compañero activo");
    assert.strictEqual(vip.snapshot().companions.rog.affinity, affinityBefore + 8,
        "la afinidad crece de forma persistente tras jugar");

    const levelBeforeGifts = vip.snapshot().companions.rog.level;
    vip.giveGift("rog");
    vip.giveGift("rog");
    vip.giveGift("rog");
    const rogAfterGifts = vip.snapshot().companions.rog;
    assert.ok(rogAfterGifts.gifts === 3 && rogAfterGifts.affinity > affinityBefore,
        "los objetos favoritos aumentan afinidad y registran regalos");
    assert.ok(rogAfterGifts.level > levelBeforeGifts,
        "la afinidad de regalos puede subir el nivel del vínculo");
    const rogUniversal = vip.gameBonus("snake").universal;
    assert.ok(rogUniversal.enabled && rogUniversal.focusCharges >= 1 && rogUniversal.focusDuration > 0,
        "al llegar a Confianza Rog desbloquea un impulso Companion útil en cualquier ROM");

    /* Los demás compañeros representan apoyos diferenciados y no variantes
       cosméticas del mismo bonus. */
    vip.unlockCompanion("desire");
    vip.selectCompanion("desire");
    assert.ok(vip.gameBonus("turno404").turno404.panic > 0,
        "Desire aporta reducción de pánico al turno nocturno");
    vip.unlockCompanion("davinchi");
    vip.selectCompanion("davinchi");
    assert.ok(vip.gameBonus("turno404").turno404.ventDiscount > 0,
        "Davinchi modifica la descarga de ducto");
    vip.unlockCompanion("sil");
    vip.selectCompanion("sil");
    assert.ok(vip.gameBonus("turno404").turno404.clientGrace > 0,
        "Sil mejora el tiempo de respuesta de clientes");
    vip.unlockCompanion("colinas");
    vip.selectCompanion("colinas");
    assert.ok(vip.gameBonus("op404").fichasMultiplier > 1,
        "Colinas aporta un multiplicador medido de FICHAS VIP");
    const colinasReward = vip.completeRun("snake", 420, true);
    assert.match(colinasReward.reaction.text, /Jaja, come ahi tremendo pobre/,
        "las recompensas de cierre con Colinas conservan su frase característica");
}

function smokeTriviaBond() {
    const { vip, records } = createVip();
    replace(vip, { fichas: 500, totalEarned: 500 });

    const desire = vip.unlockCompanion("desire");
    assert.strictEqual(desire.ok, true, "la conversación se habilita al abrir el canal del compañero");
    assert.strictEqual(vip.CONVERSATION_LIMIT, 5,
        "cada compañero tiene exactamente cinco bloques de conversación");
    assert.strictEqual(vip.DIALOGUE_TRIVIA.desire.length, 5,
        "la trivia de Desire contiene cinco preguntas vinculadas a sus diálogos");
    assert.deepStrictEqual(
        ["desire", "davinchi", "rog", "sil", "colinas"].map((id) => vip.DIALOGUE_TRIVIA[id].length),
        [5, 5, 5, 5, 5],
        "cada integrante, incluido Colinas, conserva exactamente cinco bloques propios"
    );

    const affinityBefore = vip.snapshot().companions.desire.affinity;
    const first = vip.answerTrivia("desire", "luz");
    assert.ok(first.ok && first.correct && first.affinityDelta === 9,
        "una respuesta correcta suma afinidad real al vínculo");
    assert.strictEqual(vip.snapshot().companions.desire.trivia.answered, 1,
        "la respuesta queda marcada y no se puede reutilizar tras recargar");

    const second = vip.answerTrivia("desire", "llave");
    assert.ok(second.ok && !second.correct && second.affinityDelta === -4,
        "una respuesta incorrecta resta puntos de afinidad reales");
    assert.strictEqual(vip.snapshot().companions.desire.affinity, affinityBefore + 5,
        "el vínculo conserva la suma y la penalización de los dos primeros bloques");
    const reloaded = createVip(records.get("vip-central:v1")).vip.snapshot().companions.desire;
    assert.strictEqual(reloaded.trivia.answered, 2,
        "la trivia no se reinicia al volver a cargar la Sala VIP");
    assert.strictEqual(reloaded.affinity, affinityBefore + 5,
        "la penalización y el acierto sobreviven la serialización de storage");

    ["panico", "escudo", "amor"].forEach((choice) => {
        const outcome = vip.answerTrivia("desire", choice);
        assert.strictEqual(outcome.ok, true, "cada bloque restante acepta una sola respuesta");
    });
    const after = vip.snapshot().companions.desire.trivia;
    assert.deepStrictEqual(after, { answered: 5, correct: 4, incorrect: 1, completed: true },
        "la conversación se cierra tras los cinco bloques y conserva sus resultados");
    const exhausted = vip.answerTrivia("desire", "amor");
    assert.strictEqual(exhausted.ok, false,
        "una vez agotada, la trivia no permite farmear afinidad");
    assert.strictEqual(exhausted.code, "trivia-complete",
        "el límite de conversación devuelve el motivo correcto");
}


function smokeGameShellGate() {
    const { vip, A } = createVip();
    replace(vip, { tickets: { op404: 0, turno404: 0 } });

    /* No construimos el DOM completo: el prototipo basta para recorrer la
       ruta real de start/restart y demuestra que el gate vive en GameShell,
       no en las pantallas de cada juego. */
    A.utils = {
        create: () => ({ classList: { add: () => {}, remove: () => {} } }),
        formatScore: (value) => String(value)
    };
    A.audio = { play: () => {}, music: () => {}, duckMusic: () => {}, stopMusic: () => {} };
    A.input = { clear: () => {} };
    A.taunts = {};
    A.Loop = function Loop() {};

    vm.runInNewContext(SHELL_SOURCE, {
        window: { Arcade404: A },
        console,
        setTimeout: () => 1,
        clearTimeout: () => {}
    }, { filename: "js/core/game-shell.js" });

    assert.ok(!SHELL_SOURCE.includes("vip-spectator") &&
        !SHELL_SOURCE.includes("_mountVipSpectator") &&
        !SHELL_SOURCE.includes("refs.spectator"),
    "GameShell no monta un espectador fijo ni reserva un panel de pantalla");

    let merchantOpens = 0;
    let ticketRoute = "";
    A.vipCentral = { openMerchant: () => { merchantOpens += 1; } };
    A.router = { go: (route) => { ticketRoute = route; } };
    const ticketDeskShell = Object.create(A.GameShell.prototype);
    ticketDeskShell._openVipTicketDesk();
    assert.strictEqual(merchantOpens, 1,
        "un bloqueo de ticket abre directamente el mostrador de Colinas");
    assert.strictEqual(ticketRoute, "vip",
        "el bloqueo de ticket conserva la ruta #/vip al abrir el comercio");

    let readyOverlay = null;
    const readyShell = Object.create(A.GameShell.prototype);
    readyShell.id = "turno404";
    readyShell.def = {
        name: "TURNO 404",
        vipTicket: "turno404",
        readyText: "Guardia de prueba"
    };
    readyShell.showOverlay = (config) => { readyOverlay = config; };
    readyShell.showReady();
    assert.match(readyOverlay.text, /ACCESO ABIERTO PARA AJUSTES/,
        "READY comunica que TURNO404 no necesita ticket durante los ajustes");
    assert.doesNotMatch(readyOverlay.text, /TICKET 0/,
        "READY no anuncia un saldo de tickets que pueda bloquear la entrada");

    vip.unlockCompanion("rog");

    let starts = 0;
    let restarts = 0;
    const applied = [];
    const signals = [];
    const moods = [];
    const blocked = [];
    const shell = Object.create(A.GameShell.prototype);
    shell.id = "op404";
    shell.def = { name: "OPERACIÓN 404", vipTicket: "op404" };
    shell.state = "ready";
    shell.instance = {
        start() { starts += 1; },
        restart() { restarts += 1; },
        applyVipBonus(bonus, usedItems) { applied.push({ bonus, usedItems }); },
        setVipCompanionMood(mood, text) { moods.push({ mood, text }); }
    };
    shell.loop = { resume: () => {}, pause: () => {} };
    shell.hideOverlay = () => {};
    shell.setLog = () => {};
    shell._showCompanionSignal = (reaction) => signals.push(reaction);
    shell._showTicketRequired = (entry) => blocked.push(entry);

    shell.start();
    assert.strictEqual(shell.state, "running", "GameShell inicia OP404 con acceso abierto");
    assert.strictEqual(starts, 1, "la primera entrada llama start una sola vez");
    assert.strictEqual(vip.ticketsFor("op404"), 0,
        "GameShell inicia aunque no exista ningún ticket guardado");
    assert.ok(applied[0].bonus.op404.shield > 0 && applied[0].bonus.companionId === "rog",
        "GameShell transmite identidad, nivel y apoyo del compañero al motor iniciado");
    assert.strictEqual(signals.length, 0,
        "OP404 recibe la reacción dentro de su mundo, sin toast fijo del shell");
    assert.ok(shell.vipSupport && shell.vipSupport.companionId === "rog",
        "el shell conserva sólo estado de soporte para el companion activo");

    shell.state = "over";
    shell.restart();
    assert.strictEqual(restarts, 1, "una nueva partida llama al reinicio del juego");
    assert.strictEqual(vip.ticketsFor("op404"), 0,
        "reiniciar OP404 tampoco requiere ni crea un ticket");

    shell.state = "ready";
    shell.start();
    assert.strictEqual(starts, 2, "OP404 vuelve a iniciar aunque el saldo de tickets sea cero o irrelevante");
    assert.strictEqual(blocked.length, 0,
        "GameShell no muestra el control de acceso VIP durante los ajustes");

    let lateFinishes = 0;
    shell._finish = () => { lateFinishes += 1; };
    shell.state = "over";
    shell.gameOver();
    shell.win();
    shell.taunt("mock");
    assert.strictEqual(lateFinishes, 0,
        "una señal tardía no vuelve a premiar ni a cerrar una entrada ya terminada");

    /* Las ROM libres recorren la misma capa de bonus/reacciones sin tocar
       los tickets de campaña. */
    const free = Object.create(A.GameShell.prototype);
    let freeStarts = 0;
    free.id = "snake";
    free.def = { name: "SNAKE" };
    free.state = "ready";
    free.instance = { start() { freeStarts += 1; }, applyVipBonus: () => {} };
    free.loop = { resume: () => {} };
    free.hideOverlay = () => {};
    free.setLog = () => {};
    free._showCompanionSignal = () => {};
    free._showTicketRequired = () => { throw new Error("snake no debe pedir ticket"); };
    free.start();
    assert.strictEqual(freeStarts, 1, "las ROM libres comienzan sin pasar por un bloqueo de ticket");
    assert.strictEqual(vip.ticketsFor("turno404"), 0, "una ROM libre no modifica tickets de TURNO404");

    /* Dos regalos llevan a Rog a Confianza (nivel 2) y habilitan el foco.
       El hook llega al motor del mapa; no crea miniatura ni DOM persistente. */
    vip.giveGift("rog");
    vip.giveGift("rog");
    let receivedDt = 0;
    let focusStarts = 0;
    let focusEnds = 0;
    const world = Object.create(A.GameShell.prototype);
    world.id = "op404";
    world.state = "running";
    world.setLog = () => {};
    world.instance = {
        update(dt) { receivedDt = dt; },
        onVipFocus() { focusStarts += 1; },
        onVipFocusEnd() { focusEnds += 1; },
        setVipCompanionMood(mood, text) { moods.push({ mood, text }); }
    };
    world._configureVipSupport({ bonus: vip.gameBonus("op404") });
    assert.ok(world.vipSupport.focusCharges >= 1 && world.vipSupport.companionLevel >= 2,
        "la afinidad de Confianza habilita un impulso con datos del companion de mundo");
    assert.strictEqual(world.useVipFocus(), true,
        "la tecla Y activa el apoyo práctico sin necesitar insignia visual");
    assert.strictEqual(focusStarts, 1,
        "GameShell llama al hook de foco del motor para animar al companion físico");
    world._update(100);
    assert.ok(receivedDt < 100 && receivedDt > 20,
        "el impulso sigue ralentizando la simulación sin crear overlay");
    world._update(4000);
    assert.strictEqual(focusEnds, 1,
        "al terminar el foco el shell devuelve el companion a su gesto de seguimiento");
    assert.ok(moods.some((entry) => entry.mood === "focus") &&
        moods.some((entry) => entry.mood === "watch"),
    "los gestos de soporte se propagan al companion de mapa mediante callbacks");
}



function smokeVipRouteAndView() {
    const { A } = createVip(undefined, { hostname: "4316-arena-ui.e2b.app" });
    const classValues = new Set();
    const body = {
        classList: {
            toggle(name, enabled) {
                enabled ? classValues.add(name) : classValues.delete(name);
            },
            contains(name) {
                return classValues.has(name);
            }
        }
    };
    const message = {
        textContent: "",
        classList: { add: () => {}, toggle: () => {} }
    };
    const vipScreen = { hidden: true };
    const loungeScene = { dataset: {} };
    const loungeMembers = ["desire", "davinchi", "rog", "sil", "colinas"].map((id) => {
        const classes = new Set();
        return {
            dataset: { vipId: id },
            classList: {
                add(name) { classes.add(name); },
                remove(name) { classes.delete(name); },
                contains(name) { return classes.has(name); }
            }
        };
    });
    let vipClick = null;
    let compactViewport = false;
    let reducedMotion = false;
    let loungeTimerId = 0;
    const loungeTimers = new Map();
    const menuScrolls = [];
    const menuNode = {
        scrollIntoView(options) {
            menuScrolls.push(options);
        }
    };
    const vipRoot = {
        innerHTML: "",
        parentElement: vipScreen,
        addEventListener(type, listener) {
            if (type === "click") {
                vipClick = listener;
            }
        },
        querySelector(selector) {
            if (selector === '[data-role="vip-message"]') {
                return message;
            }
            if (selector === ".vip-menu" && vipRoot.innerHTML.includes("vip-menu")) {
                return menuNode;
            }
            if (selector === ".vip-scene") {
                return loungeScene;
            }
            return null;
        },
        querySelectorAll(selector) {
            return selector === ".vip-scene__character" ? loungeMembers : [];
        },
        closest(selector) {
            return selector === ".screen" ? vipScreen : null;
        }
    };
    const balance = { textContent: "" };
    const home = { hidden: true };
    const hub = { hidden: true };
    const live = { textContent: "" };
    const routeListeners = [];
    let hash = "#/";
    const location = { hostname: "4316-arena-ui.e2b.app" };
    Object.defineProperty(location, "hash", {
        get: () => hash,
        set(value) {
            hash = String(value);
            routeListeners.slice().forEach((listener) => listener());
        }
    });
    const window = {
        Arcade404: A,
        location,
        matchMedia(query) {
            const value = String(query);
            return {
                matches: value.includes("prefers-reduced-motion")
                    ? reducedMotion
                    : compactViewport && value.includes("max-width: 900px")
            };
        },
        addEventListener(type, listener) {
            if (type === "hashchange") {
                routeListeners.push(listener);
            }
        },
        setTimeout(callback, delay) {
            loungeTimerId += 1;
            loungeTimers.set(loungeTimerId, { callback, delay });
            return loungeTimerId;
        },
        clearTimeout(id) {
            loungeTimers.delete(id);
        }
    };
    let hubRefreshes = 0;
    A.utils = {};
    A.assets = { url: (id) => `asset://${id}` };
    A.getGame = () => null;
    A.hub = { refresh: () => { hubRefreshes += 1; }, playEntrance: () => {} };

    vm.runInNewContext(ROUTER_SOURCE, {
        window,
        document: { body },
        console,
        Map,
        Set
    }, { filename: "js/core/router.js" });
    vm.runInNewContext(CENTRAL_SOURCE, {
        window,
        console,
        Intl,
        Math,
        Number,
        Object,
        Array,
        Set,
        JSON
    }, { filename: "js/core/vip-central.js" });
    A.vipCentral.init({ root: vipRoot, balance });
    assert.match(vipRoot.innerHTML, /VIP <em>CENTRAL<\/em>/,
        "la vista VIP se puede construir sin depender de una partida activa");
    assert.match(vipRoot.innerHTML, /SR\. DE LAS COLINAS/,
        "la tienda presenta al Sr. de las Colinas como anfitrión de la sala");
    assert.match(vipRoot.innerHTML, /vip-intro/,
        "la primera visita abre la cinemática guiada de la Sala VIP");
    assert.match(vipRoot.innerHTML, /vip-central is-intro-open/,
        "la cinemática marca el estado de lectura sin desmontar la Sala VIP");
    assert.doesNotMatch(vipRoot.innerHTML, /vip-menu--idle|vip-central__ledger-row/,
        "durante la introducción no se apilan paneles vacíos debajo de la historia");
    assert.match(vipRoot.innerHTML, /vip-scene__carpet/,
        "la escena integra la alfombra y el lenguaje retrowave del HOME");
    assert.ok((vipRoot.innerHTML.match(/data-character=/g) || []).length >= 5,
        "la escena distribuye al elenco completo como personajes pulsables");
    assert.match(vipRoot.innerHTML, /vip-scene__activity/,
        "cada asiento conserva un indicador decorativo para su gesto ambiental");
    assert.match(balance.textContent, /0 ◈/,
        "la vista VIP sincroniza el saldo inicial cero en la barra");

    assert.strictEqual(A.vipCentral.handleKey("Enter", { repeat: false }), true,
        "ENTER avanza la introducción sin depender del ratón");
    assert.match(vipRoot.innerHTML, /DESIRE \/\/ LUZ Y ÁNIMO/,
        "la segunda escena incorpora a Desire al diálogo explicativo");
    for (let index = 0; index < 5; index += 1) {
        A.vipCentral.handleKey("Enter", { repeat: false });
    }
    assert.strictEqual(A.vip.hasSeenVipIntro(), true,
        "la escena final registra la introducción como completada");
    assert.match(vipRoot.innerHTML, /vip-menu--idle/,
        "al terminar una entrada normal vuelve todo el elenco a la sala");
    assert.match(vipRoot.innerHTML, /vip-central__ledger-row is-idle/,
        "sin compañero ni movimientos, el estado de cuenta vuelve como una franja compacta");
    assert.ok(!/vip-scene__character[^"]*is-in-dialogue/.test(vipRoot.innerHTML),
        "sin menú abierto, ningún personaje pierde temporalmente su posición");
    assert.strictEqual(typeof vipClick, "function",
        "la escena registra un único manejador delegado para personajes y comercio");

    const clickVip = (action, id, choice) => vipClick({
        target: {
            closest: (selector) => selector === "[data-vip-action]"
                ? { disabled: false, dataset: { vipAction: action, vipId: id, vipChoice: choice } }
                : null
        }
    });
    clickVip("character", "desire");
    assert.match(vipRoot.innerHTML, /vip-menu--bond/,
        "pulsar a un compañero despliega su menú personalizado de afinidad");
    assert.match(vipRoot.innerHTML, /RUTA DE AFINIDAD/,
        "el menú de vínculo muestra sus recompensas progresivas");
    assert.match(vipRoot.innerHTML, /CANAL AÚN CERRADO/,
        "un canal bloqueado deja claro que la conversación requiere vínculo");
    assert.match(vipRoot.innerHTML, /vip-scene__character[^"]*is-in-dialogue[^"]*"[^>]*data-vip-id="desire"/,
        "el personaje seleccionado sale de su posición y queda en primer plano");

    clickVip("character", "rog");
    assert.match(vipRoot.innerHTML, /vip-scene__character[^"]*is-returning[^"]*"[^>]*data-vip-id="desire"/,
        "al cambiar de persona, la anterior vuelve animadamente a su sitio");
    assert.match(vipRoot.innerHTML, /vip-scene__character[^"]*is-in-dialogue[^"]*"[^>]*data-vip-id="rog"/,
        "el nuevo personaje ocupa el foco de conversación");
    clickVip("close-menu");
    assert.match(vipRoot.innerHTML, /vip-scene__character[^"]*is-returning[^"]*"[^>]*data-vip-id="rog"/,
        "cerrar el menú devuelve el último personaje a la sala");

    A.vip._replaceForTest({
        fichas: 500,
        totalEarned: 500,
        tickets: { op404: 0, turno404: 0 },
        inventory: { "op-kit": 0, "turno-cafe": 0, "turno-buffer": 0 },
        companions: {},
        activeCompanion: null,
        runs: {},
        ledger: []
    });
    clickVip("character", "desire");
    clickVip("unlock", "desire");
    assert.match(vipRoot.innerHTML, /CONVERSACIÓN FINITA \/ 1 DE 5/,
        "un compañero desbloqueado abre el primer bloque de trivia finita");
    clickVip("trivia-answer", "desire", "luz");
    assert.match(vipRoot.innerHTML, /RESPUESTA CORRECTA/,
        "la trivia refleja la respuesta correcta antes de avanzar");
    assert.match(vipRoot.innerHTML, /\+9 AFINIDAD/,
        "la interfaz comunica los puntos de vínculo obtenidos");
    clickVip("trivia-next", "desire");
    assert.match(vipRoot.innerHTML, /CONVERSACIÓN FINITA \/ 2 DE 5/,
        "el siguiente bloque sólo aparece tras resolver el anterior");

    clickVip("character", "colinas");
    clickVip("open-bond", "colinas");
    assert.match(vipRoot.innerHTML, /VÍNCULO PERSONAL/,
        "Colinas conserva también su propio menú de afinidad como compañero");
    compactViewport = true;
    menuScrolls.length = 0;
    clickVip("open-shop", "colinas");
    assert.strictEqual(menuScrolls.length, 1,
        "en móvil, abrir la tienda conserva el panel en flujo y calcula un salto mínimo");
    assert.strictEqual(menuScrolls[0].block, "nearest",
        "la tienda móvil sólo se desplaza lo necesario para mostrar su inicio");
    assert.match(vipRoot.innerHTML, /vip-scene[^\"]*is-context-open/,
        "abrir un panel recoge espacio decorativo sin quitar la Sala VIP");
    assert.ok(vipRoot.innerHTML.indexOf("vip-scene__host-note") < vipRoot.innerHTML.indexOf("vip-menu--merchant"),
        "el recibimiento y la historia siguen antes del mostrador dentro del flujo");
    compactViewport = false;
    assert.match(vipRoot.innerHTML, /VALE ÚNICO DE PRUEBAS/,
        "el mostrador enseña el vale voluntario únicamente dentro del preview");
    assert.match(vipRoot.innerHTML, /No se acredita al abrir la sala/,
        "la tarjeta explica que la economía no recibe saldo automático");
    const voucherBalance = A.vip.snapshot().fichas;
    clickVip("preview-stipend");
    assert.strictEqual(A.vip.snapshot().fichas, voucherBalance + A.vip.PREVIEW_TEST_STIPEND,
        "el botón del mostrador canjea el lote QA sólo tras el gesto del usuario");
    assert.match(vipRoot.innerHTML, /VALE DE CALIBRACIÓN EMITIDO/,
        "la entrega del vale produce una reacción contextual de Colinas");
    assert.match(vipRoot.innerHTML, /Jaja, come ahi tremendo pobre/,
        "la reacción de entrega incluye la línea de recompensa de Colinas");
    assert.match(vipRoot.innerHTML, /CANJEADO/,
        "la tarjeta se transforma al agotarse la recompensa única");
    assert.match(vipRoot.innerHTML, /ACCESO DE CAMPAÑA/,
        "el mostrador explica que las campañas están abiertas durante los ajustes");
    assert.match(vipRoot.innerHTML, /Las dos campañas están abiertas para revisar y mejorar/,
        "la Sala VIP no invita a gastar pases para probar las campañas");
    assert.doesNotMatch(vipRoot.innerHTML, /data-vip-action="ticket"/,
        "el mostrador oculta los botones de compra de tickets mientras no hacen falta");
    const passesBefore = A.vip.ticketsFor("op404");
    clickVip("ticket", "op404");
    assert.strictEqual(A.vip.ticketsFor("op404"), passesBefore,
        "una acción de ticket heredada no fabrica ni gasta pases");
    assert.match(vipRoot.innerHTML, /ACCESO ABIERTO/,
        "la reacción de Colinas confirma que la campaña ya se puede iniciar");
    assert.match(vipRoot.innerHTML, /vip-menu--merchant/,
        "la mesa de Colinas permanece abierta después de informar el acceso");

    A.vip._replaceForTest({
        fichas: 0,
        totalEarned: 0,
        tickets: { op404: 0, turno404: 0 },
        inventory: { "op-kit": 0, "turno-cafe": 0, "turno-buffer": 0 },
        companions: {},
        activeCompanion: null,
        runs: {},
        ledger: []
    });
    clickVip("item", "op-kit");
    assert.match(vipRoot.innerHTML, /CAJA EN REVISIÓN/,
        "sin saldo Colinas conserva una reacción inmediata para suministros");
    assert.match(vipRoot.innerHTML, /is-unaffordable/,
        "los suministros sin saldo siguen pulsables para que el NPC pueda reaccionar");

    A.vipCentral.receiveFromColinas();
    assert.match(vipRoot.innerHTML, /viniste directamente por mí/,
        "la llegada desde el personaje de Colinas activa su bienvenida personal");
    A.vipCentral.handleKey("Escape", { repeat: false });

    A.router.init({ home, hub, vip: vipScreen, gameRoot: {}, liveRegion: live });
    assert.strictEqual(home.hidden, false, "el router conserva HOME como ruta inicial");

    A.router.go("vip");
    assert.strictEqual(vipScreen.hidden, false, "#/vip muestra la pantalla de VIP Central");
    assert.strictEqual(home.hidden, true, "#/vip oculta HOME al cambiar de pantalla");
    assert.ok(body.classList.contains("is-vip"), "#/vip activa la clase visual de VIP Central");
    assert.strictEqual(live.textContent, "VIP Central", "la ruta VIP anuncia su pantalla");
    assert.ok(hubRefreshes >= 0 && vipRoot.innerHTML.length > 500,
        "la ruta VIP conserva una vista completa aunque el hub no esté visible");
    assert.strictEqual(loungeMembers.filter((member) => member.classList.contains("is-lounge-beat")).length, 1,
        "la sala activa un solo gesto ambiental, en vez de mover a todo el elenco a la vez");
    assert.strictEqual(loungeScene.dataset.loungeActivity, "desire",
        "el primer gesto alternado identifica al asiento que recibe el foco visual");
    assert.strictEqual(loungeTimers.size, 1,
        "el gesto ambiental mantiene un único temporizador controlado mientras VIP está visible");
    loungeMembers.forEach((member) => member.classList.remove("is-lounge-beat"));
    reducedMotion = true;
    A.vipCentral.refresh();
    assert.strictEqual(loungeMembers.filter((member) => member.classList.contains("is-lounge-beat")).length, 0,
        "el programador de gestos no se activa cuando el sistema solicita movimiento reducido");
    assert.strictEqual(loungeTimers.size, 0,
        "movimiento reducido también cancela el temporizador de ambiente pendiente");
    reducedMotion = false;
    A.vipCentral.refresh();
    assert.strictEqual(loungeTimers.size, 1,
        "al restablecer movimiento, la sala agenda de nuevo sólo un pulso ambiental");

    A.router.go("hub");
    assert.strictEqual(loungeTimers.size, 0,
        "salir de VIP cancela inmediatamente el temporizador de ambiente");
    assert.strictEqual(hub.hidden, false, "VIP Central puede volver de forma segura al selector");
    assert.ok(!body.classList.contains("is-vip"), "volver al hub limpia el estado visual VIP");
}


function smokeIntegrationContracts() {
    const homeColinasButton = INDEX.match(/<button\s+class="hero__operator-vip-button"\s+id="homeVipColinas"[\s\S]*?<\/button>/);

    assert.ok(homeColinasButton && !/VIP CENTRAL/.test(homeColinasButton[0]),
        "la silueta de Colinas abre la sala sin rótulo visible en HOME");
    assert.ok(INDEX.includes('id="screen-vip"')
        && INDEX.includes('id="vipButton"')
        && INDEX.includes('id="vipHubButton"')
        && INDEX.includes('id="homeVipColinas"')
        && INDEX.includes('./js/core/vip.js')
        && INDEX.includes('./js/core/vip-central.js'),
    "VIP Central está montado fuera de OP404 y accesible desde menú y hub");
    assert.ok(ROUTER_SOURCE.includes('type: "vip"')
        && ROUTER_SOURCE.includes('"is-vip"')
        && ROUTER_SOURCE.includes('A.vipCentral.refresh')
        && APP_SOURCE.includes("homeVipColinas")
        && !APP_SOURCE.includes("seedArenaPreviewVip")
        && !APP_SOURCE.includes("grantPreviewFunds")
        && APP_SOURCE.includes("receiveFromColinas")
        && APP_SOURCE.includes("A.vipCentral.handleKey")
        && CENTRAL_SOURCE.includes("const INTRO_SCENES")
        && CENTRAL_SOURCE.includes("openMerchant")
        && CENTRAL_SOURCE.includes("vip-menu--merchant")
        && CENTRAL_SOURCE.includes("previewTestVoucher")
        && CENTRAL_SOURCE.includes("preview-stipend")
        && CENTRAL_SOURCE.includes("vip-bond__ladder")
        && CENTRAL_SOURCE.includes("vip-bond__companion-note")
        && CENTRAL_SOURCE.includes("camina contigo")
        && !CENTRAL_SOURCE.includes("vip-bond__mini-note")
        && !CENTRAL_SOURCE.includes("toca su insignia"),
    "el router reconoce #/vip y describe el Companion de campo sin la UI Mini anterior");
    assert.ok(HUB_SOURCE.includes("A.vip.needsTicket")
        && VIP_SOURCE.includes("const CAMPAIGN_TICKETS_ENABLED = false"),
    "el selector consulta el estado de acceso y las campañas quedan abiertas para ajustes");
    assert.ok(SHELL_SOURCE.includes("_claimVipEntry")
        && SHELL_SOURCE.includes("_showTicketRequired")
        && SHELL_SOURCE.includes("completeRun")
        && SHELL_SOURCE.includes("awardVipLevel")
        && !SHELL_SOURCE.includes("vip-spectator")
        && !SHELL_SOURCE.includes("_mountVipSpectator")
        && SHELL_SOURCE.includes("_configureVipSupport")
        && SHELL_SOURCE.includes("setVipCompanionMood")
        && SHELL_SOURCE.includes("useVipFocus")
        && SHELL_SOURCE.includes("_showCompanionSignal"),
    "GameShell abre campañas, entrega FICHAS y pasa apoyo al companion sin montar overlay");
    assert.ok(CENTRAL_SOURCE.includes("const LOUNGE_ACTIVITY_ORDER")
        && CENTRAL_SOURCE.includes("scheduleLoungeMotion")
        && CENTRAL_SOURCE.includes("unlistenRoute")
        && CENTRAL_SOURCE.includes('route.type !== "vip"')
        && CENTRAL_SOURCE.includes("is-lounge-beat")
        && CENTRAL_SOURCE.includes("vip-scene__activity")
        && VIP_CSS.includes("vip-desire-lounge-idle")
        && VIP_CSS.includes("vip-davinchi-lounge-idle")
        && VIP_CSS.includes("vip-rog-lounge-idle")
        && VIP_CSS.includes("vip-sil-lounge-idle")
        && VIP_CSS.includes("vip-colinas-lounge-idle")
        && VIP_CSS.includes("vip-intro-speaking")
        && VIP_CSS.includes("animation: none !important"),
    "la Sala VIP alterna gestos de los cinco asientos y conserva una salida accesible de movimiento reducido");
    assert.ok(OP_SOURCE.includes('vipTicket: "op404"')
        && OP_SOURCE.includes("applyVipBonus")
        && OP_SOURCE.includes("awardVipLevel"),
    "OP404 declara su campaña, recibe apoyos y acredita FICHAS por zona limpia");
    assert.ok(TURNO_SOURCE.includes('vipTicket: "turno404"')
        && TURNO_SOURCE.includes("applyVipBonus")
        && TURNO_SOURCE.includes("awardVipLevel"),
    "TURNO404 declara su campaña, recibe apoyos y acredita FICHAS por tramo superado");
    assert.ok(CENTRAL_SOURCE.includes("ACCESO DE CAMPAÑA")
        && CENTRAL_SOURCE.includes("Las dos campañas están abiertas")
        && CENTRAL_SOURCE.includes("HABILITAR CANAL")
        && CENTRAL_SOURCE.includes("AFINIDAD /")
        && CENTRAL_SOURCE.includes("trivia-answer")
        && CENTRAL_SOURCE.includes("CONVERSACIÓN FINITA")
        && CENTRAL_SOURCE.includes("is-in-dialogue")
        && CENTRAL_SOURCE.includes("FICHAS VIP"),
    "la Sala VIP expone acceso abierto, economía inicial cero, trivia, foco y menús de apoyo");
}

smokeStateNormalization();
smokeEconomy();
smokePreviewTestVoucher();
smokeSuppliesAndCompanions();
smokeTriviaBond();
smokeGameShellGate();
smokeVipRouteAndView();
smokeIntegrationContracts();
console.log("✓ VIP Central smoke: acceso abierto, saldo cero, ayudas, trivia y companions");
