#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — smoke de refinamientos de OPERACIÓN 404

   Uso: node tools/smoke-op404-refinements.js

   Sin navegador ni dependencias externas comprueba los contratos
   delicados de esta revisión: dossier de lectura manual, visor táctico, cola de
   arte escalonada, retratos narrativos de aliados, voces coherentes,
   dificultad propia, encuentro secreto de Sil, Bolsa CLAP 60/40,
   regateo implícito por visita de la Sala VIP, Taller persistente, cajas de
   arsenal escalonadas, mapas ampliados con spawns zonales, cobertura sólida para
   visión/balas, barra de escudo, VFX y los 5 s jugables de botín incluso al matar
   con una ráfaga.
   ========================================================= */

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SHOP_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "op404", "shop.js"),
    "utf8"
);
const GAME_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "op404", "game.js"),
    "utf8"
);
const CLAP_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "op404", "clap.js"),
    "utf8"
);
const MAPS_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "op404", "maps.js"),
    "utf8"
);
const TURNO_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "turno404.js"),
    "utf8"
);
const INTRO_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "op404", "intro.js"),
    "utf8"
);
const SPRITES_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "games", "op404", "sprites.js"),
    "utf8"
);
const ASSETS_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "core", "assets.js"),
    "utf8"
);
const PIXEL_ART_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "core", "pixelart.js"),
    "utf8"
);


function createShopHarness() {

    const preloaded = [];
    let portraitReady = false;
    const A = {
        op404: {},
        audio: { play: () => {} },
        assets: {
            characterImageIds: () => [
                "character.colinas.despreocupado",
                "character.colinas.serio"
            ],
            preload: (ids) => preloaded.push(...ids),
            characterImageId: (id, expression) => `character.${id}.${expression}`,
            readyImage: (id) => portraitReady
                ? { id, naturalWidth: 250, naturalHeight: 230 }
                : null
        },
        canvasKit: {}
    };
    const window = { Arcade404: A };

    vm.runInNewContext(SHOP_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/shop.js"
    });

    const game = {
        /* La primera visita activa el monólogo que ahora se prueba como
           lectura manual; las pruebas de comercio lo cierran luego a mano. */
        shopVisits: 1,
        health: 100,
        maxHealth: 100,
        money: 0,
        ammo: { balas: 0, cartuchos: 0, pastichos: 0, celdas: 0 },
        owned: { pistola: true },
        report: { flawless: false },
        insurance: false,
        claps: 0,
        ammoMax: () => 120,
        furiaNeeded: () => 100,
        updateStats: () => {}
    };
    const shop = new A.op404.Shop({ ctx: {} }, game);

    return {
        A,
        game,
        shop,
        preloaded,
        setPortraitReady(value) {
            portraitReady = value;
        }
    };

}


function smokeShop() {

    const harness = createShopHarness();
    const { A, game, shop, preloaded } = harness;

    assert.strictEqual(game.haggleAttempts, 5,
        "cada entrada a la Sala VIP conserva internamente cinco márgenes de regateo");
    assert.strictEqual(game.haggleAnnoyance, 0,
        "el fastidio pertenece a la visita actual y empieza limpio");
    assert.ok(preloaded.length > 0,
        "la Sala VIP precarga el retrato de entrada del Sr. de las Colinas");

    const welcomeLine = shop.message;
    shop.update(60000);
    assert.strictEqual(shop.intro, 0,
        "la bienvenida de Colinas no salta líneas sola mientras el jugador lee");
    assert.strictEqual(shop.message, welcomeLine,
        "la primera línea de bienvenida queda visible hasta un gesto explícito");
    assert.strictEqual(shop.advanceIntro(), true,
        "ESPACIO o el control táctil pueden avanzar manualmente la bienvenida");
    assert.strictEqual(shop.intro, 1,
        "cada avance manual muestra sólo la siguiente línea del monólogo");

    /* No hay fallback de personaje antiguo: antes de que llegue la imagen
       merchantImage() no devuelve otro sprite; render usa la tarjeta VIP. */
    assert.strictEqual(shop.merchantImage(), null,
        "el primer retrato no sustituye el asset pendiente por un vendedor viejo");
    harness.setPortraitReady(true);
    const readyPortrait = shop.merchantImage();
    assert.ok(readyPortrait && readyPortrait.id.endsWith("despreocupado"),
        "el retrato VIP listo se usa como primera imagen");
    harness.setPortraitReady(false);
    assert.strictEqual(shop.merchantImage(), readyPortrait,
        "un cambio de expresión conserva el último retrato listo");
    assert.ok(!/function\s+drawVendedor\s*\(/.test(SHOP_SOURCE),
        "el fallback procedural del mercader ya no existe en la Sala VIP");
    assert.ok(SHOP_SOURCE.includes("lastMerchantExpression")
        && SHOP_SOURCE.includes("const variant = labels[expression]"),
    "el bocadillo incluye la variante emocional real del mercader");

    const bubbleText = [];
    const bubbleCtx = {
        measureText: (text) => ({ width: String(text).length * 6 }),
        fillText: (text) => bubbleText.push(String(text)),
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {},
        drawImage: () => {}
    };
    harness.setPortraitReady(true);
    shop.drawBubble(bubbleCtx, "Mensaje de prueba");
    assert.ok(bubbleText.includes("VARIANTE · RELAJADO"),
        "el diálogo escribe la variante relajada junto al texto");
    bubbleText.length = 0;
    shop.setMerchantMood("molesto", 1000);
    shop.drawBubble(bubbleCtx, "Mensaje de prueba");
    assert.ok(bubbleText.includes("VARIANTE · MOLESTO"),
        "el diálogo cambia la etiqueta al gesto molesto del mercader");
    bubbleText.length = 0;
    shop.asleep = true;
    shop.drawBubble(bubbleCtx, "Zzz");
    assert.ok(bubbleText.includes("VARIANTE · DORMIDO"),
        "el diálogo refleja también la variante dormida del mercader");
    shop.asleep = false;
    shop.setMerchantMood("despreocupado", 0);

    const nativeRandom = Math.random;
    try {
        const withRoll = (roll) => {
            Math.random = () => roll;
            return shop.haggleOutcome();
        };
        assert.strictEqual(withRoll(0.79).kind, "empty",
            "el 80% inicial del regateo termina sin trato");
        assert.strictEqual(withRoll(0.84).kind, "money",
            "el tramo de regalo puede entregar efectivo limitado");
        assert.strictEqual(withRoll(0.915).item.ammo, "balas",
            "el tramo de regalo puede entregar balas, nunca un arma");
        assert.strictEqual(withRoll(0.955).item.kind, "health",
            "el tramo de regalo puede entregar una arepa limitada");
        assert.strictEqual(withRoll(0.978).item.kind, "insurance",
            "el tramo de regalo puede entregar un seguro VIP");
        assert.strictEqual(withRoll(0.992).item.kind, "clap",
            "el último tramo de regalo puede entregar una bolsa CLAP");
    } finally {
        Math.random = nativeRandom;
    }

    shop.intro = -1;
    shop.haggleOutcome = () => ({ kind: "empty", label: "SIN TRATO" });
    shop.buy();
    assert.strictEqual(game.haggleAttempts, 4,
        "intentar pagar sin saldo pide descuento implícitamente y consume un margen");
    assert.match(shop.message, /trato|regalo|argumento|labia|audiencia|beneficencia|curaduría/i,
        "la compra sin fondos abre conversación con Colinas, sin instrucción de botón");
    assert.ok(!SHOP_SOURCE.includes("HAGGLE_BUTTON") && !SHOP_SOURCE.includes("drawHaggle") &&
        !SHOP_SOURCE.includes("5 INTENTOS"),
    "la Sala VIP no renderiza contador numérico ni botón de cinco intentos");

    shop.haggleOutcome = () => ({ kind: "money", amount: 25, label: "$25" });
    assert.strictEqual(shop.pointer(500, 330), false,
        "el lugar que antes ocupaba el botón no es una interacción fija");
    assert.strictEqual(shop.pointer(148, 250), true,
        "hablar directamente con el Sr. de las Colinas activa el pedido implícito");
    assert.strictEqual(game.haggleAttempts, 3,
        "la interacción con el mercader consume un único margen interno");
    assert.strictEqual(game.money, 25,
        "el regateo implícito puede entregar dinero como premio limitado");
    assert.strictEqual(shop.merchantExpression(), "feliz",
        "el mercader usa un gesto feliz al cerrar un trato favorable");
    assert.match(shop.message, /Jaja, come ahi tremendo pobre/,
        "cada regalo del Sr. de las Colinas usa la frase de entrega solicitada");
    assert.ok(!Object.prototype.hasOwnProperty.call(shop, "haggleSpin"),
        "el regateo no conserva estado de animación ni resolución diferida");

    game.money = 0;
    shop.haggleOutcome = () => ({ kind: "empty", label: "SIN TRATO" });
    for (let attempt = 0; attempt < 3; attempt += 1) {
        shop.askDiscount("limosna");
    }

    assert.strictEqual(game.haggleAttempts, 0,
        "ninguna ruta permite un sexto intento en la misma visita");
    assert.ok(game.haggleAnnoyance >= 3,
        "los rechazos acumulados aumentan el fastidio del mercader");
    assert.strictEqual(shop.merchantExpression(), "molesto",
        "el fastidio acumulado cambia el gesto del mercader");

    const returningShop = new A.op404.Shop({ ctx: {} }, game);
    assert.strictEqual(game.haggleAttempts, 5,
        "volver a entrar a la Sala VIP reinicia internamente cinco márgenes");
    assert.strictEqual(game.haggleAnnoyance, 0,
        "volver a entrar también reinicia el ánimo del nuevo trato");
    assert.ok(SHOP_SOURCE.includes("const HAGGLE_GIFT_CHANCE = 0.20")
        && SHOP_SOURCE.includes("const giftStart = 1 - HAGGLE_GIFT_CHANCE")
        && !/HAGGLE_SPIN|HAGGLE_WHEEL|haggleSpin/.test(SHOP_SOURCE),
    "el regateo implícito conserva 20% de regalo y no contiene mecánica de azar visual");
    assert.ok(SHOP_SOURCE.includes("advanceIntro()")
        && SHOP_SOURCE.includes("SIGUIENTE MENSAJE")
        && !SHOP_SOURCE.includes("introTimer"),
    "la bienvenida VIP espera un avance manual y no conserva un temporizador oculto");
    assert.ok(returningShop,
        "la visita de regreso se puede construir con el estado renovado");

}


function createGameHarness(options = {}) {

    /* El render smoke sólo necesita que cada API de Canvas exista; no hace
       falta un navegador ni rasterizar 640 × 400 píxeles en Node. */
    const gradient = { addColorStop: () => {} };
    const ctx = new Proxy({}, {
        get(target, key) {
            if (key in target) {
                return target[key];
            }
            if (key === "createLinearGradient" || key === "createRadialGradient") {
                return () => gradient;
            }
            return () => {};
        },
        set(target, key, value) {
            target[key] = value;
            return true;
        }
    });
    const canvas = {
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 })
    };
    const stage = { canvas, ctx, destroy: () => {}, options: null };
    let definition = null;
    let wins = 0;
    const vipLevelRewards = [];
    const stored = Object.assign({}, options.storage || {});
    const statuses = [];
    const stats = {};
    const storyChecks = [];
    let touchConfig = null;
    const shell = {
        refs: { stage: {} },
        root: options.root || null,
        state: options.shellState || "ready",
        best: 0,
        setTouchControls: (config) => { touchConfig = config; },
        setStatus: (text) => statuses.push(text),
        setStat: (name, value) => { stats[name] = value; },
        setMeter: () => {},
        checkStory: (score) => {
            storyChecks.push(score);
            return false;
        },
        levelUpTaunt: () => {},
        awardVipLevel: (score, label) => vipLevelRewards.push({ score, label }),
        win: () => { wins += 1; }
    };
    const A = {
        utils: {
            clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
            formatScore: (value) => String(value),
            pick: (items) => items[0],
            qsa: (selector, root) => typeof options.qsa === "function"
                ? options.qsa(selector, root)
                : []
        },
        canvasKit: {
            text: () => {},
            roundRect: () => {},
            fillRoundRect: () => {},
            glow: (_ctx, _color, _blur, draw) => draw()
        },
        storage: {
            get: (key, fallback) => Object.prototype.hasOwnProperty.call(stored, key)
                ? stored[key]
                : fallback,
            set: (key, value) => { stored[key] = String(value); }
        },
        op404: {
            MAP_W: 5,
            MAP_H: 5,
            TEX_SIZE: 1,
            sprites: () => {
                const sprite = { width: 16, height: 16, naturalWidth: 16, naturalHeight: 16 };
                return {
                    textures: { panel: sprite },
                    hands: {
                        pistola: sprite,
                        escopeta: sprite,
                        ametralladora: sprite,
                        lanzapasticho: sprite,
                        riflepulso: sprite,
                        criopasticho: sprite,
                        rebotador: sprite
                    },
                    enemies: {},
                    allies: {},
                    companions: {
                        rog: {
                            follow: [sprite, sprite], danger: [sprite, sprite],
                            cheer: [sprite, sprite], support: [sprite, sprite], focus: [sprite, sprite]
                        }
                    },
                    props: {},
                    items: {
                        clap: sprite, balas: sprite, cartuchos: sprite, pastichos: sprite,
                        celdas: sprite, escopeta: sprite, ametralladora: sprite,
                        lanzapasticho: sprite, riflepulso: sprite, criopasticho: sprite, rebotador: sprite
                    },
                    money: { billete: sprite, moneda: [sprite] },
                    shots: {
                        bala: sprite, pasticho: sprite, pulso: sprite, crio: sprite, rebote: sprite,
                        texto: sprite, cucharada: sprite, petroleo: sprite
                    }
                };
            },
            LEVELS: options.levels || [{
                id: "prueba",
                map: ["#####", "#...#", "#.P.#", "#...#", "#####"],
                name: "PRUEBA",
                subtitle: "smoke",
                light: "#ffffff",
                world: "callcenter",
                stage: "1-1",
                tex: ["panel", "panel", "panel"],
                hp: 1,
                speed: 1,
                damage: 1
            }],
            WORLDS: [{ id: "callcenter", short: "CALL CENTER" }],
            DOSSIER: options.dossier || {
                prueba: {
                    speaker: "sil",
                    expression: "seria",
                    channel: "CANAL DE PRUEBA",
                    objective: "VALIDA EL VISOR",
                    lines: ["La prueba mantiene el control.", "El dossier no pausa la zona."],
                    clear: {
                        speaker: "rog",
                        expression: "serio",
                        channel: "PRUEBA CERRADA",
                        lines: ["El enlace se mantiene.", "Recoge el botín sin prisa."]
                    }
                }
            }
        },
        createStage: (_host, stageOptions) => {
            stage.options = stageOptions;
            return stage;
        },
        audio: { music: () => {}, play: () => {} },
        registerGame: (entry) => { definition = entry; },
        ui: {
            stat: () => "",
            divider: () => "",
            meter: () => "",
            switcher: (name, entries) => `<switch name="${name}" count="${entries.length}"></switch>`
        }
    };
    const window = {
        Arcade404: A,
        addEventListener: () => {},
        removeEventListener: () => {},
        matchMedia: () => ({ matches: Boolean(options.coarsePointer) })
    };
    const document = {
        addEventListener: () => {},
        removeEventListener: () => {},
        createElement: () => ({ getContext: () => ctx }),
        pointerLockElement: null
    };

    vm.runInNewContext(GAME_SOURCE, {
        window,
        document,
        Math,
        Float32Array,
        console,
        /* Ejecuta de inmediato el audio diferido de la Bolsa CLAP: el smoke
           valida estado, no necesita esperar un reloj real de Node. */
        setTimeout: (callback) => {
            callback();
            return 0;
        },
        performance: { now: () => 0 },
        navigator: options.navigator || {}
    }, { filename: "js/games/op404/game.js" });

    return {
        game: definition.create(shell),
        stage,
        A,
        shell,
        window,
        stored,
        stats,
        statuses,
        storyChecks,
        definition,
        getWins: () => wins,
        getVipLevelRewards: () => vipLevelRewards.slice(),
        getTouchConfig: () => touchConfig
    };

}


function smokeAnalogStickInput() {

    const { game, getTouchConfig } = createGameHarness();
    const touch = getTouchConfig();

    assert.ok(touch && touch.mode === "dpad-fire" && typeof touch.onMove === "function",
        "OPERACIÓN 404 recibe el vector continuo del joystick compartido");
    assert.match(touch.analogLabel, /Joystick analógico/,
        "OPERACIÓN 404 explica el giro y avance del stick en su etiqueta accesible");

    game.phase = "run";
    touch.onMove({ x: 0.58, y: -0.76 });
    assert.strictEqual(game.touchMotion.x, 0.58,
        "el vector radial conserva el giro X con su magnitud real");
    assert.strictEqual(game.touchMotion.y, -0.76,
        "el vector radial conserva el avance Y con su magnitud real");

    game.phase = "shop";
    touch.onMove({ x: -1, y: 1 });
    assert.strictEqual(game.touchMotion.x, 0,
        "el stick no deja giro retenido mientras la Sala VIP toma el control");
    assert.strictEqual(game.touchMotion.y, 0,
        "el stick no deja avance retenido mientras la Sala VIP toma el control");

    game.touchMotion = { x: 0.7, y: -0.7 };
    game.releaseKeys();
    assert.strictEqual(game.touchMotion.x, 0,
        "pausa, reintento o pérdida de foco limpian el giro analógico");
    assert.strictEqual(game.touchMotion.y, 0,
        "pausa, reintento o pérdida de foco limpian el avance analógico");

}


function smokeExpandedMaps() {

    const A = { op404: {} };
    const window = { Arcade404: A };

    vm.runInNewContext(MAPS_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/maps.js"
    });

    const { LEVELS, MAP_W, MAP_H, ENEMY_SPAWN_TABLE, DOSSIER } = A.op404;
    const solids = new Set(["#", "%", "&", "v", "x", "o", "t"]);
    const targetChars = new Set(["B", "2", "3", "4", "5", "6", "7"]);
    const enemyTiles = new Set(["C", "U", "M", "G", "T", "R", "K"]);
    const expectedPools = {
        soporte: "UC",
        torre: "UGR",
        barrio: "MTK",
        plaza: "MTK",
        archivo: "CGR",
        palacio: "CGR",
        control: "CGR",
        pdvsa: "CGR",
        avenida: "MTK",
        casa: "UMTK",
        antesala: "UGRMTK",
        comedor: "CUGRMTK"
    };

    assert.strictEqual(LEVELS.length, 12,
        "la campaña conserva los doce niveles al ampliar sus rutas");
    assert.strictEqual(MAP_W, 34,
        "cada mapa crece horizontalmente de 24 a 34 celdas");
    assert.strictEqual(MAP_H, 32,
        "cada mapa crece verticalmente de 24 a 32 celdas");

    LEVELS.forEach((level) => {
        const map = level.map;
        const player = [];
        const targets = [];
        const dossier = DOSSIER[level.id];

        assert.ok(dossier && Array.isArray(dossier.lines) && dossier.lines.length === 2,
            level.id + " conserva un briefing de dos líneas para lectura manual");
        assert.ok(Array.isArray(dossier.variants) && dossier.variants.length >= 2,
            level.id + " suma pares alternos de diálogo para reintentos y campañas nuevas");
        assert.ok(dossier.variants.every((variant) => Array.isArray(variant.lines)
            && variant.lines.length === 2 && variant.expression),
        level.id + " conserva gesto y dos líneas completas en cada variación");
        if (level.boss) {
            assert.ok(dossier.clear && Array.isArray(dossier.clear.variants)
                && dossier.clear.variants.length >= 2,
            level.id + " también varía el debrief posterior al jefe");
        }

        assert.strictEqual(map.length, MAP_H,
            level.id + " conserva la altura ampliada sin filas perdidas");
        map.forEach((row, y) => {
            assert.strictEqual(row.length, MAP_W,
                level.id + " conserva el ancho ampliado en cada fila");
            [...row].forEach((tile, x) => {
                if (tile === "P") player.push([x, y]);
                if (targetChars.has(tile)) targets.push([x, y, tile]);
            });
        });
        assert.strictEqual(player.length, 1,
            level.id + " deja una posición de jugador única y transitable");
        assert.strictEqual(level.expanded, true,
            level.id + " se marca como plano expandido de campaña");
        assert.ok(Array.isArray(level.enemyPool) && level.enemyPool.length > 0,
            level.id + " declara un pool de enemigos cerrado para la zona");
        assert.strictEqual(level.enemyPool.join(""), expectedPools[level.id],
            level.id + " conserva sólo el elenco apropiado para su mundo y tema");
        assert.ok(ENEMY_SPAWN_TABLE[level.id]
            && ENEMY_SPAWN_TABLE[level.id].world === level.world,
        level.id + " enlaza la tabla de spawn con el mundo declarado");
        map.forEach((row) => [...row].forEach((tile) => {
            if (enemyTiles.has(tile)) {
                assert.ok(level.enemyPool.includes(tile),
                    level.id + " no filtra " + tile + " fuera de su pool zonal");
            }
        }));

        const edge = [
            ...map[0], ...map[MAP_H - 1],
            ...map.map((row) => row[0]), ...map.map((row) => row[MAP_W - 1])
        ];
        assert.ok(edge.every((tile) => solids.has(tile)),
            level.id + " conserva bordes sólidos fuera de las nuevas rutas");

        const visited = new Set();
        const queue = [player[0]];
        visited.add(player[0].join(","));
        while (queue.length) {
            const [x, y] = queue.shift();
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                const nx = x + dx;
                const ny = y + dy;
                const key = nx + "," + ny;
                if (nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H &&
                    !visited.has(key) && !solids.has(map[ny][nx])) {
                    visited.add(key);
                    queue.push([nx, ny]);
                }
            });
        }

        assert.ok(targets.every(([x, y]) => visited.has(x + "," + y)),
            level.id + " conecta jugador, objetivos y prototipos sin callejón cerrado");
        const wingProps = [];
        map.forEach((row, y) => [...row].forEach((tile, x) => {
            if ("xot".includes(tile) && (x < 5 || x >= 29 || y < 4 || y >= 28)) {
                wingProps.push(tile);
            }
        }));
        assert.ok(wingProps.length >= 3,
            level.id + " integra mobiliario de su ambiente en las alas nuevas");

        const signalCover = [];
        map.forEach((row, y) => [...row].forEach((tile, x) => {
            if (tile === "v") {
                signalCover.push([x, y]);
            }
        }));
        assert.ok(signalCover.length >= 2,
            level.id + " incorpora barreras de señal como cobertura táctica en rutas amplias");
        assert.ok(signalCover.every(([x, y]) => x < 5 || x >= 29 || y < 4 || y >= 28),
            level.id + " mantiene la cobertura nueva en alas abiertas y no sella el plano central");

        [

            (x, y) => x < 5,
            (x, y) => x >= 29,
            (x, y) => y < 4,
            (x, y) => y >= 28
        ].forEach((isWing, index) => {
            const wingTiles = [...visited].filter((key) => {
                const [x, y] = key.split(",").map(Number);
                return isWing(x, y);
            });
            assert.ok(wingTiles.length > 12,
                level.id + " conecta el ala secundaria " + (index + 1));
        });
    });

    assert.ok(LEVELS.slice(1).every((level) => /[567]/.test(level.map.join(""))),
        "las rutas laterales distribuyen los tres prototipos de arma nuevos");

    const supportTiles = [...LEVELS.find((level) => level.id === "soporte").map.join("")]
        .filter((tile) => enemyTiles.has(tile));
    assert.strictEqual([...new Set(supportTiles)].sort().join(""), "CU",
        "Soporte Técnico inicial conserva sólo usuarios y chavistas de atención");
    assert.ok(!supportTiles.some((tile) => "MGTRK".includes(tile)),
        "las variantes avanzadas nunca se filtran en el primer mapa");
    assert.ok(MAPS_SOURCE.includes("const ENEMY_SPAWN_TABLE")
        && MAPS_SOURCE.includes("zonedEnemyTile")
        && MAPS_SOURCE.includes("const zoneEnemies = zone && zone.enemies")
        && !MAPS_SOURCE.includes('const sideEnemies = ["U", "C", "M", "G", "T", "R", "K"]'),
    "la expansión no conserva un pool global que mezcle mundos");
    assert.ok(MAPS_SOURCE.includes('const BLOCKING_TILE = "#%&vxot"')
        && MAPS_SOURCE.includes("const shieldCover")
        && MAPS_SOURCE.includes('grid[y][x] = "v"'),
    "los mapas declaran barreras de señal como cobertura sólida, no decoración libre");

}


function smokePhysicalCoverAndShieldHud() {

    const { game } = createGameHarness();

    /* Mapa mínimo con los cuatro tipos de cobertura: la barrera alta `v`
       y los props bajos x/o/t. El fondo no importa para esta prueba; se
       ejerce directamente la física de balas y de visión. */
    game.grid = [
        ["#", "#", "#", "#", "#"],
        ["#", ".", "v", ".", "#"],
        ["#", ".", "x", ".", "#"],
        ["#", ".", "o", ".", "#"],
        ["#", ".", "t", ".", "#"]
    ];
    game.phase = "run";
    game.health = 100;

    assert.strictEqual(game.isWall(2.5, 1.5), true,
        "la barrera de señal se proyecta como muro alto del visor");
    assert.strictEqual(game.isSolid(2.5, 1.5), true,
        "la barrera de señal no permite atravesarla");

    [[2.5, 1.5, "barrera"], [2.5, 2.5, "escritorio"],
        [2.5, 3.5, "barril"], [2.5, 4.5, "mesa"]].forEach(([x, y, label]) => {
        assert.strictEqual(game.blocksProjectile(x, y), true,
            "la " + label + " bloquea proyectiles");
        assert.strictEqual(game.canSee(1.5, y, 3.5, y), false,
            "la " + label + " corta la línea de visión enemiga");
    });

    /* Un único frame lento intenta recorrer dos casillas. El muestreo de
       trayecto evita que una bala enemiga se teletransporte a través del
       prop, que era la regresión más costosa de combate. */
    [1.5, 2.5, 3.5, 4.5].forEach((y) => {
        game.player = { x: 3.5, y, angle: 0 };
        game.hostileShots = [{
            x: 1.5, y, vx: 20, vy: 0, damage: 25, life: 1000,
            sprite: "bala", trailX: 1.5, trailY: y
        }];
        const before = game.health;
        game.updateShots(100);
        assert.strictEqual(game.hostileShots.length, 0,
            "un disparo enemigo desaparece al impactar la cobertura");
        assert.strictEqual(game.health, before,
            "la cobertura evita el daño incluso con un frame lento");
    });

    game.clearShield();
    assert.strictEqual(game.shieldRatio(), 0,
        "sin protección la barra de escudo se mantiene descargada");
    game.grantShield(60);
    assert.strictEqual(game.shield, 60,
        "una recarga agrega blindaje a la reserva persistente");
    assert.strictEqual(game.shieldMax, 100,
        "el HUD conserva la capacidad fija del blindaje");
    assert.strictEqual(game.shieldRatio(), 0.6,
        "la barra representa proporcionalmente la carga disponible");
    game.updateAbilities(60000);
    assert.strictEqual(game.shield, 60,
        "el blindaje no se vacía por tiempo aunque transcurra un minuto");
    assert.doesNotThrow(() => game.drawHud(),
        "el visor puede dibujar salud, escudo y Taller con carga persistente");
    game.hurtPlayer(25);
    assert.strictEqual(game.shield, 35,
        "un impacto pequeño resta sólo el daño absorbido por el escudo");
    assert.strictEqual(game.health, 100,
        "el blindaje evita daño de vida mientras tiene carga");
    game.hurtPlayer(50);
    assert.strictEqual(game.shield, 0,
        "un golpe fuerte termina de descargar la reserva");
    assert.strictEqual(game.shieldMax, 100,
        "vaciarla no borra la capacidad visible del escudo");
    assert.strictEqual(game.health, 85,
        "sólo el excedente que supera el blindaje llega a la salud");

    assert.ok(GAME_SOURCE.includes("projectilePathBlocked")
        && GAME_SOURCE.includes("this.blocksProjectile")
        && GAME_SOURCE.includes("shieldRatio()")
        && GAME_SOURCE.includes("ESCUDO"),
    "el juego centraliza cobertura balística y declara una barra de escudo visible");
    assert.ok(SPRITES_SOURCE.includes("escudo: () => makeTex"),
        "la barrera de señal tiene una textura propia para leerse en el raycaster");

}


function smokeArsenalAndRecovery() {

    const { game } = createGameHarness();

    game.phase = "run";
    game.player = { x: 2.5, y: 2.5, angle: 0 };
    game.owned.riflepulso = true;
    game.owned.criopasticho = true;
    game.owned.rebotador = true;
    game.ammo.celdas = 30;
    game.ammo.balas = 50;

    game.weapon = "riflepulso";
    game.shootTimer = 0;
    game.shoot();
    assert.strictEqual(game.shots[0].pierce, 1,
        "el Rifle de Pulso crea un proyectil que atraviesa una silueta");
    assert.strictEqual(game.shots[0].sprite, "pulso",
        "el Rifle de Pulso usa un proyectil visual propio");
    assert.strictEqual(game.ammo.celdas, 29,
        "las armas de pulso consumen celdas separadas del arsenal clásico");
    assert.ok(game.muzzleFlash && game.muzzleFlash.life > 0 && game.tracers.length > 0,
        "cada disparo abre un fogonazo animado y una trazadora neón de boca");

    game.weapon = "criopasticho";
    game.shootTimer = 0;
    game.shoot();
    const crio = game.shots.at(-1);
    assert.ok(crio.splash > 0 && crio.slow >= 2500 && crio.sprite === "crio",
        "el Crio-Pasticho combina área, ralentización y proyectil diferenciado");

    game.weapon = "rebotador";
    game.shootTimer = 0;
    game.shoot();
    const rebote = game.shots.at(-1);
    assert.strictEqual(rebote.bounces, 3,
        "el Rebota-404 conserva tres rebotes en pared");

    const enemy = {
        x: 2.2,
        y: 2.5,
        hp: 90,
        maxHp: 90,
        dead: false,
        hidden: false,
        flash: 0,
        stagger: 0,
        type: { boss: false, size: 1, score: 1, label: "PRUEBA", drop: 0 }
    };
    game.enemies = [enemy];
    game.splash(2.5, 2.5, 1, 10, 2500, "#60A5FA");
    assert.ok(enemy.slowed >= 2500,
        "el área criogénica ralentiza enemigos que no mueren en el impacto");
    assert.ok(game.aoeBursts.length > 0
        && game.impactBursts.length > 0
        && game.particles.some((particle) => particle.style === "aoe")
        && game.particles.some((particle) => particle.style === "hitspark"),
    "las armas de área dibujan onda AoE, hitsparks y fragmentos pixel-art visibles");
    game.zbuffer = new Float32Array(game.renderCols).fill(Infinity);
    assert.doesNotThrow(() => {
        game.drawCombatVfx();
        game.drawGun();
    }, "trazadoras, impactos, AoE y fogonazo se proyectan sin romper el visor");

    game.enemies = [];
    game.shots = [{
        x: 1.5, y: 2.5, vx: -10, vy: 0, damage: 10,
        splash: 0, slow: 0, pierce: 0, bounces: 1,
        hitIds: [], color: "#C084FC", sprite: "rebote", life: 1600, spin: 0
    }];
    game.updateShots(100);
    assert.strictEqual(game.shots.length, 1,
        "un rebote no destruye el proyectil en la primera pared");
    assert.ok(game.shots[0].vx > 0 && game.shots[0].bounces === 0 && game.shots[0].x === 1.5,
        "el rebote invierte el eje bloqueado sin atravesar la pared en un frame lento");

    game.health = 100;
    const stableDrop = game.recoveryDropBonus();
    game.health = 30;
    const lowHealthDrop = game.recoveryDropBonus();
    assert.ok(lowHealthDrop > stableDrop && stableDrop >= 0.22,
        "la dificultad Normal mejora drops y los inclina más a recuperación con vida baja");
    game.cfg.enemyPool = ["U"];
    game.enemies = [];
    assert.strictEqual(game.spawnEnemy("malandro", { x: 2.5, y: 2.5 }), null,
        "la compuerta runtime rechaza un esbirro fuera del pool del nivel");
    assert.ok(game.spawnEnemy("usuario", { x: 2.5, y: 2.5 }),
        "la compuerta runtime conserva un enemigo permitido por la zona");

    assert.ok(GAME_SOURCE.includes("checkpointHealth") && GAME_SOURCE.includes("itemDropChance"),
        "la curva de dificultad declara recuperación de checkpoint y drop rate justo");
    assert.ok(SPRITES_SOURCE.includes("function pulso()") &&
        SPRITES_SOURCE.includes("function crio()") &&
        SPRITES_SOURCE.includes("function rebote()"),
    "los efectos del arsenal tienen sprites pixel-art diferenciados");
    assert.ok(GAME_SOURCE.includes("spawnHitSpark")
        && GAME_SOURCE.includes("spawnAoEVisual")
        && GAME_SOURCE.includes("drawNeonTracer")
        && GAME_SOURCE.includes("drawCombatVfx")
        && GAME_SOURCE.includes("muzzleFlash"),
    "el renderer declara hitsparks, onda de área, trazadoras neón y fogonazo animado");

}


function smokeWeaponWorkshopAndRandomLoot() {

    const { game, A, window, stage } = createGameHarness();

    game.phase = "run";
    game.player = { x: 2.5, y: 2.5, angle: 0 };
    game.owned.escopeta = true;
    game.ammo.cartuchos = 24;
    game.weapon = "escopeta";

    const base = game.weaponProfile("escopeta");
    assert.strictEqual(game.upgradeWeapon("escopeta", "impact"), 1,
        "el Taller puede subir el módulo de impacto del arma equipada");
    assert.strictEqual(game.upgradeWeapon("escopeta", "cycle"), 1,
        "el Taller puede subir el ciclo de disparo del arma equipada");
    assert.strictEqual(game.upgradeWeapon("escopeta", "control"), 1,
        "el Taller puede subir el control del arma equipada");
    const tuned = game.weaponProfile("escopeta");
    assert.ok(tuned.damage > base.damage && tuned.cooldown < base.cooldown &&
        tuned.spread < base.spread && tuned.speed > base.speed,
    "impacto, ciclo y control cambian daño, cadencia, dispersión y velocidad reales");

    game.shootTimer = 0;
    game.shoot();
    assert.strictEqual(game.shots[0].damage, tuned.damage,
        "el disparo usa el perfil mejorado, no sólo una etiqueta de tienda");
    assert.ok(game.shots[0].vx > base.speed,
        "el módulo de control también acelera el proyectil en el mundo");

    game.saveFieldCheckpoint();
    game.weaponUpgrades.escopeta.impact = 0;
    game.restoreFieldCheckpoint();
    assert.strictEqual(game.weaponUpgradeLevel("escopeta", "impact"), 1,
        "el checkpoint de campo restaura los módulos del Taller junto al arma");

    vm.runInNewContext(SHOP_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/shop.js"
    });
    game.phase = "shop";
    game.weapon = "escopeta";
    game.weaponUpgrades = {};
    game.money = 1000;
    const shop = new A.op404.Shop(stage, game);
    shop.intro = -1;
    shop.tab = Array.from({ length: 8 }, (_unused, index) => index)
        .find((index) => {
            shop.tab = index;
            return shop.category().id === "taller";
        });
    shop.cursor = 0;
    const firstWorkshopPrice = shop.itemPrice(shop.current());
    shop.buy();
    assert.strictEqual(game.weaponUpgradeLevel("escopeta", "impact"), 1,
        "la pestaña TALLER compra una mejora para el arma activa");
    assert.strictEqual(game.money, 1000 - firstWorkshopPrice,
        "el Taller cobra el precio escalonado del primer nivel");
    const secondWorkshopPrice = shop.itemPrice(shop.current());
    assert.ok(secondWorkshopPrice > firstWorkshopPrice,
        "el siguiente nivel cuesta más y evita una escalada plana de daño");
    shop.buy();
    const thirdWorkshopPrice = shop.itemPrice(shop.current());
    assert.ok(thirdWorkshopPrice > secondWorkshopPrice,
        "el tercer nivel conserva la progresión de precio del Taller");
    shop.buy();
    assert.strictEqual(game.weaponUpgradeLevel("escopeta", "impact"), 3,
        "cada módulo se detiene exactamente en tres niveles");
    const moneyAtWorkshopMax = game.money;
    shop.buy();
    assert.strictEqual(game.money, moneyAtWorkshopMax,
        "un módulo MAX no cobra un cuarto nivel");
    assert.strictEqual(shop.itemInfo(shop.current()).completion, "MAX",
        "la tarjeta del Taller anuncia MAX al alcanzar el tope");
    assert.doesNotThrow(() => shop.drawStock(stage.ctx, game),
        "la tienda puede dibujar sus siete pestañas y la tarjeta del Taller");
    assert.ok(SHOP_SOURCE.includes('id: "taller"')
        && SHOP_SOURCE.includes("weaponUpgrade")
        && SHOP_SOURCE.includes("Y el Taller")
        && !/HAGGLE_BUTTON|drawHaggle/.test(SHOP_SOURCE),
    "la nueva sección se explica en la visita VIP y coexiste con el regateo implícito sin añadir un botón de intentos");

    shop.tab = Array.from({ length: 7 }, (_unused, index) => index)
        .find((index) => {
            shop.tab = index;
            return shop.category().id === "seguro";
        });
    shop.cursor = 0;
    game.shield = 20;
    game.shieldMax = 100;
    const shieldPrice = shop.itemPrice(shop.current());
    const moneyBeforeShield = game.money;
    shop.buy();
    assert.strictEqual(game.shield, 60,
        "la Sala VIP vende una recarga que suma carga persistente al escudo");
    assert.strictEqual(game.money, moneyBeforeShield - shieldPrice,
        "la recarga de escudo cobra su precio de Sala VIP");
    game.shield = 100;
    const moneyAtShieldCap = game.money;
    shop.buy();
    assert.strictEqual(game.money, moneyAtShieldCap,
        "la tienda no cobra una recarga cuando el blindaje ya está lleno");
    game.shield = 60;

    game.leaveShop();
    assert.strictEqual(game.checkpoint.weaponUpgrades.escopeta.impact, 3,
        "al salir de la Sala VIP el checkpoint se refresca con la compra del Taller");
    game.weaponUpgrades = {};
    game.shield = 0;
    game.insurance = true;
    assert.strictEqual(game.useInsurance(), true,
        "el seguro puede volver a la Sala VIP después de una compra de módulo");
    assert.strictEqual(game.weaponUpgradeLevel("escopeta", "impact"), 3,
        "el seguro restaura el módulo comprado, no el inventario previo a la visita");
    assert.strictEqual(game.shield, 60,
        "el seguro conserva la carga de escudo consolidada en la Sala VIP");

    game.levelIndex = 0;
    game.owned = { pistola: true };
    assert.deepStrictEqual(Array.from(game.weaponLootPool()), ["escopeta"],
        "la primera zona limita la caja aleatoria al arsenal inicial");
    assert.strictEqual(game.randomWeaponPickup("escopeta"), "escopeta",
        "una caja temprana entrega una escopeta válida de su pool");

    game.levelIndex = 9;
    game.owned = { pistola: true };
    const lateWeapon = withRandomRolls([0.99], () => game.randomWeaponPickup());
    assert.strictEqual(lateWeapon, "rebotador",
        "las zonas tardías abren el extremo alto del pool aleatorio");

    game.levelIndex = 1;
    game.owned = { pistola: true };
    game.pickups = [];
    const enemyDrop = withRandomRolls([0, 0], () => game.maybeDropRandomWeapon({
        x: 2.5,
        y: 2.5,
        type: { boss: false }
    }));
    assert.ok(["escopeta", "ametralladora"].includes(enemyDrop)
        && game.pickups[0].randomWeapon && game.pickups[0].source === "enemigo",
    "una baja común puede soltar una caja de la pool aleatoria sin fijar un arma");

    game.pickups = [];
    const bossDrop = withRandomRolls([0], () => game.maybeDropRandomWeapon({
        x: 2.5,
        y: 2.5,
        type: { boss: true }
    }));
    assert.ok(["escopeta", "ametralladora"].includes(bossDrop)
        && game.pickups[0].randomWeapon && game.pickups[0].source === "jefe",
    "un jefe garantiza una caja aleatoria de la pool actual mientras falte arsenal");

    const randomMap = createGameHarness({
        levels: [{
            id: "prueba",
            map: ["#####", "#P2.#", "#...#", "#...#", "#####"],
            name: "PRUEBA",
            subtitle: "smoke",
            light: "#ffffff",
            world: "callcenter",
            stage: "1-1",
            tex: ["panel", "panel", "panel"],
            hp: 1,
            speed: 1,
            damage: 1
        }]
    });
    assert.ok(randomMap.game.pickups.some((item) => item.type === "escopeta" && item.randomWeapon),
        "las marcas de arma del mapa se convierten en cajas de arsenal aleatorias al cargar");
    randomMap.game.player = { x: 2.5, y: 1.5, angle: 0 };
    assert.doesNotThrow(() => randomMap.game.drawMinimap(),
        "el radar compacto puede diferenciar las cajas aleatorias sin romper el visor");
    randomMap.game.updatePickups(0);
    assert.strictEqual(randomMap.game.banner.title, "CAJA ALEATORIA",
        "la primera caja anuncia que la nueva arma vino del sistema aleatorio");
    randomMap.game.pickups.push({
        type: "escopeta", randomWeapon: true, x: 2.5, y: 1.5, bob: 0
    });
    randomMap.game.updatePickups(0);
    assert.strictEqual(randomMap.game.banner.title, "CAJA · MUNICIÓN",
        "una caja repetida conserva su lectura propia al convertirse en munición");
    assert.ok(GAME_SOURCE.includes("weaponLootPool")
        && GAME_SOURCE.includes("maybeDropRandomWeapon")
        && GAME_SOURCE.includes("CAJA ALEATORIA")
        && GAME_SOURCE.includes("CAJA · MUNICIÓN"),
    "el runtime declara pool escalonada, drop de enemigo y lectura visual de la caja");

}


function smokeFieldCheckpointAndCompanion() {

    const { game, statuses } = createGameHarness();

    game.money = 48;
    game.ammo.celdas = 12;
    game.owned.riflepulso = true;
    game.weapon = "riflepulso";
    game.saveFieldCheckpoint();
    game.health = 3;
    game.hurtPlayer(20, true);

    assert.strictEqual(game.health, 70,
        "Normal restaura una salud justa al consumir el checkpoint de campo");
    assert.strictEqual(game.money, 48,
        "el checkpoint de campo conserva la cartera local de exploración");
    assert.strictEqual(game.ammo.celdas, 12,
        "el checkpoint de campo conserva celdas y arsenal desbloqueado");
    assert.strictEqual(game.weapon, "riflepulso",
        "el checkpoint conserva el arma que el jugador ya consiguió");
    assert.ok(game.fieldCheckpoint && !game.fieldCheckpoint.available,
        "cada zona ofrece exactamente un reintento gratuito, no reinicios infinitos");
    assert.match(String(statuses.at(-1)), /CHECKPOINT/i,
        "la restauración informa el reintento de campo al jugador");

    game.applyVipBonus({
        companionId: "rog",
        companionLevel: 4,
        universal: { enabled: true, focusDuration: 1200, focus: "RUTA EN FOCO" },
        op404: { claps: 0, shield: 0, cash: 0, bullets: 0 }
    });
    assert.ok(game.virtualCompanion && game.virtualCompanion.id === "rog",
        "un compañero desbloqueado se materializa como mascota dentro del mapa");
    assert.strictEqual(game.virtualCompanion.level, 4,
        "la entidad de mapa recibe el nivel de afinidad del canal activo");

    const companion = game.virtualCompanion;
    game.phase = "run";
    game.time = 10000;
    game.player = { x: 3.3, y: 2.5, angle: 0 };
    companion.x = 1.5;
    companion.y = 2.5;
    companion.level = 2;
    companion.nextCollectAt = 0;
    const remoteCash = { type: "dinero", value: 9, x: 1.7, y: 2.5, bob: 0 };
    game.pickups = [remoteCash];
    game.updateVirtualCompanion(120);
    assert.strictEqual(game.money, 57,
        "desde afinidad 2 la mascota recoge efectivo lejano dentro de la ruta");
    assert.strictEqual(game.pickups.length, 0,
        "la ficha remota se retira una sola vez al recogerla el compañero");

    companion.level = 3;
    companion.nextAlertAt = 0;
    companion.nextBuffAt = Infinity;
    game.time = 20000;
    game.canSee = () => false;
    game.enemies = [{ x: 4, y: 2.5, dead: false, hidden: false }];
    game.updateVirtualCompanion(100);
    assert.strictEqual(companion.mood, "danger",
        "desde afinidad 3 el compañero reacciona ante una emboscada oculta");

    companion.level = 4;
    companion.nextAlertAt = Infinity;
    companion.nextBuffAt = 0;
    game.time = 30000;
    game.health = 50;
    game.enemies = [];
    game.updateVirtualCompanion(100);
    assert.strictEqual(game.health, 56,
        "desde afinidad 4 entrega un pequeño buff de recuperación escalonado");

    game.setVipCompanionMood("cheer", "¡JEFE ABAJO!", 2000);
    assert.strictEqual(companion.mood, "cheer",
        "la mascota celebra visualmente una victoria de jefe");
    game.onVipFocus({ focusDuration: 900, focus: "RUTA EN FOCO" });
    assert.strictEqual(companion.mood, "focus",
        "el impulso VIP conserva su gesto dentro de la entidad de mapa");
    assert.ok(GAME_SOURCE.includes("updateVirtualCompanion") &&
        GAME_SOURCE.includes("companionPickupTarget") &&
        SPRITES_SOURCE.includes("function companionMini"),
    "el companion tiene seguimiento, recolección, alertas, buffs y sprite propio");

}


function createClapHarness() {

    const A = { op404: {} };
    const window = { Arcade404: A };

    vm.runInNewContext(CLAP_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/clap.js"
    });

    return A.op404.clap;

}


function withRandomRolls(rolls, callback) {

    const nativeRandom = Math.random;
    let index = 0;

    Math.random = () => {
        const roll = rolls[Math.min(index, rolls.length - 1)];
        index += 1;
        return roll;
    };

    try {
        return callback();
    } finally {
        Math.random = nativeRandom;
    }

}


function smokeClapSupplies() {

    const clap = createClapHarness();

    assert.strictEqual(clap.GOOD_CHANCE, 0.60,
        "la Bolsa CLAP expone explícitamente 60% de suministros favorables");
    assert.strictEqual(clap.BAD_CHANCE, 0.40,
        "la Bolsa CLAP expone explícitamente 40% de contratiempos");
    assert.strictEqual(
        clap.GOOD.reduce((sum, item) => sum + item.weight, 0),
        100,
        "los pesos de suministros favorables forman una tabla completa"
    );
    assert.strictEqual(
        clap.BAD.reduce((sum, item) => sum + item.weight, 0),
        100,
        "los pesos de contratiempos forman una tabla completa"
    );
    assert.ok(clap.GOOD.length >= 8 && clap.BAD.length >= 4,
        "la bolsa amplía el catálogo útil sin borrar los riesgos");
    assert.strictEqual(withRandomRolls([0.599999, 0], () => clap.roll()).good, true,
        "un roll por debajo de 0.60 entra al grupo favorable");
    assert.strictEqual(withRandomRolls([0.60, 0], () => clap.roll()).good, false,
        "un roll desde 0.60 entra al grupo adverso");

    const { game, window } = createGameHarness();

    vm.runInNewContext(CLAP_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/clap.js"
    });

    game.phase = "run";
    game.health = 48;
    game.shield = 0;
    game.applyClap({ id: "arepa", health: 40, fallbackShield: 32 });
    assert.strictEqual(game.health, 88,
        "la arepa de la Bolsa recupera una cantidad útil y predecible de vida");

    game.health = game.maxHealth;
    game.shield = 0;
    game.applyClap({ id: "harina", health: 25, fallbackShield: 22 });
    assert.strictEqual(game.shield, 22,
        "un alimento favorable conserva valor como recarga de escudo con vida llena");

    game.ammo = { balas: 0, cartuchos: 0, pastichos: 0 };
    game.shield = 0;
    game.applyClap({
        id: "municion",
        ammo: { balas: 60, cartuchos: 12, pastichos: 3 },
        fallbackShield: 28
    });
    assert.strictEqual(game.ammo.balas, 60,
        "la caja CLAP repone balas");
    assert.strictEqual(game.ammo.cartuchos, 12,
        "la caja CLAP repone cartuchos");
    assert.strictEqual(game.ammo.pastichos, 3,
        "la caja CLAP repone pastichos");

    game.ammo = { balas: 200, cartuchos: 40, pastichos: 12 };
    game.shield = 0;
    game.applyClap({ id: "municion", ammo: {}, fallbackShield: 28 });
    assert.strictEqual(game.shield, 28,
        "la caja CLAP llena se convierte en recarga y nunca queda vacía");

    game.sticky = 3800;
    game.slow = 1800;
    game.sugar = 0;
    game.applyClap({ id: "cafe", duration: 3200 });
    assert.strictEqual(game.sticky, 0,
        "el café limpia la penalización de pasta");
    assert.strictEqual(game.slow, 0,
        "el café limpia la penalización de lentitud");
    assert.strictEqual(game.sugar, 3200,
        "el café entrega un sprint corto");

    game.money = 10;
    game.tuning.money = 1;
    game.applyClap({ id: "vale", money: 65 });
    assert.strictEqual(game.money, 75,
        "el vale suma efectivo local para la Sala VIP actual");

    game.furiaUnlocked = false;
    game.shield = 0;
    game.applyClap({ id: "furia", fallbackShield: 35 });
    assert.strictEqual(game.shield, 35,
        "la cafeína recarga blindaje si la Furia aún no está desbloqueada");
    game.furiaUnlocked = true;
    game.furiaCharge = 0;
    game.applyClap({ id: "furia" });
    assert.strictEqual(game.furiaCharge, game.furiaNeeded(),
        "la cafeína carga la Furia al estar desbloqueada");

    game.health = 10;
    game.applyClap({ id: "sardina", damage: 18 });
    assert.strictEqual(game.health, 1,
        "la sardina adversa nunca puede rematar al jugador");

    game.owned = { pistola: true, escopeta: true, ametralladora: true };
    game.ammo = { balas: 100, cartuchos: 20, pastichos: 10 };
    game.money = 100;
    game.applyClap({ id: "rota", ammoLoss: 0.45, moneyLoss: 0.20 });
    assert.strictEqual(game.ammo.balas, 55,
        "una bolsa rota pierde sólo 45% de las balas");
    assert.strictEqual(game.ammo.cartuchos, 11,
        "una bolsa rota pierde sólo 45% de los cartuchos");
    assert.strictEqual(game.ammo.pastichos, 5,
        "una bolsa rota pierde sólo 45% de los pastichos");
    assert.strictEqual(game.money, 80,
        "una bolsa rota pierde sólo 20% del efectivo local");
    assert.strictEqual(game.owned.ametralladora, true,
        "una bolsa rota conserva el arsenal comprado y el progreso de campaña");

    game.spawnGorgojo = () => false;
    game.slow = 0;
    game.applyClap({ id: "gorgojos", fallbackSlow: 1800 });
    assert.strictEqual(game.slow, 1800,
        "un mapa sin espacio convierte el gorgojo en lentitud reversible");

    window.Arcade404.op404.clap.roll = () => ({
        id: "arepa",
        label: "AREPA DE PRUEBA",
        text: "recuperación",
        color: "#ffffff",
        good: true,
        health: 40,
        fallbackShield: 32
    });
    game.claps = 1;
    game.health = 50;
    game.openClap();
    assert.strictEqual(game.claps, 0,
        "abrir una bolsa consume exactamente una unidad de la mochila");
    assert.strictEqual(game.health, 90,
        "openClap aplica el resultado de la tabla real al jugador");

}


function smokeCheckpointHaggleVisit() {

    const { game, window } = createGameHarness();

    /* Se carga el mercader real sobre el mismo Arcade404 simulado para que
       useInsurance() atraviese enterShop() como lo hace en el navegador. */
    vm.runInNewContext(SHOP_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/shop.js"
    });

    game.setDifficulty("dificil");
    game.saveCheckpoint();
    assert.ok(!Object.prototype.hasOwnProperty.call(game.checkpoint, "haggleAttempts") &&
        !Object.prototype.hasOwnProperty.call(game.checkpoint, "haggleAnnoyance"),
    "el checkpoint no serializa intentos ni fastidio de una visita VIP");

    game.haggleAttempts = 0;
    game.haggleAnnoyance = 5;
    assert.strictEqual(game.useInsurance(), true,
        "el seguro puede devolver al checkpoint de la Sala VIP");
    assert.strictEqual(game.haggleAttempts, 5,
        "volver por seguro abre una nueva visita con cinco intentos");
    assert.strictEqual(game.haggleAnnoyance, 0,
        "volver por seguro no conserva el fastidio de la visita anterior");
    assert.strictEqual(game.difficulty, "dificil",
        "el seguro conserva el perfil de dificultad del checkpoint");

}


function smokeLootWindow() {

    const { game, getWins, getVipLevelRewards } = createGameHarness();

    game.phase = "run";
    game.enemies = [{ dead: true, type: { score: 0 } }];
    game.clearLevel();

    assert.strictEqual(game.phase, "loot",
        "limpiar la zona abre una fase de botín en vez de transicionar al instante");
    assert.strictEqual(game.phaseTimer, 5000,
        "la ventana de botín dura exactamente 5000 ms");

    game.clearLevel();
    assert.strictEqual(game.phase, "loot",
        "una llamada temprana no puede saltarse los cinco segundos de botín");

    const beforeX = game.player.x;
    game.keys.up = true;
    game.update(100);
    assert.strictEqual(game.phaseTimer, 4900,
        "la cuenta usa tiempo jugable transcurrido");
    assert.notStrictEqual(game.player.x, beforeX,
        "el jugador puede moverse mientras recoge botín");

    const shotCount = game.shots.length;
    game.key(" ");
    assert.strictEqual(game.shots.length, shotCount,
        "la tecla de fuego no puede disparar durante la ventana de botín");

    game.update(4899);
    assert.strictEqual(game.phase, "loot",
        "a 1 ms del cierre la zona sigue activa para recoger");
    assert.strictEqual(game.phaseTimer, 1,
        "el contador no añade una transición oculta después del quinto segundo");

    game.update(1);
    assert.strictEqual(game.phase, "won",
        "al llegar a cero se completa la transición de la zona");
    assert.strictEqual(getWins(), 1,
        "el final se muestra sólo después de los cinco segundos de botín");
    assert.deepStrictEqual(getVipLevelRewards(), [{ score: 500, label: "OPERACIÓN 404 · ZONA 1-1 LIMPIA" }],
        "la zona acredita FICHAS VIP sólo después del botín y antes del cierre total");
    assert.strictEqual(game.finishLootWindow(), false,
        "la compuerta no puede ejecutar una segunda transición al terminar");

}


function makeEnemyForShot(game) {

    return {
        x: game.player.x,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        dead: false,
        hidden: false,
        type: {
            boss: false,
            score: 100,
            drop: 0,
            label: "ÚLTIMO OBJETIVO",
            size: 1
        }
    };

}


function makeShot(game, damage) {

    return {
        x: game.player.x,
        y: game.player.y,
        vx: 0,
        vy: 0,
        damage,
        splash: 0,
        sprite: "bala",
        life: 1000,
        spin: 0
    };

}


function smokeLastShotRegression() {

    const { game, getWins } = createGameHarness();

    game.phase = "run";
    game.enemies = [makeEnemyForShot(game)];

    /* El bucle recorre de atrás hacia adelante: el proyectil de índice 1
       mata y vacía `shots`; el índice 0 sólo existe para reproducir el
       acceso inválido que antes congelaba el RAF. */
    game.shots = [makeShot(game, 0), makeShot(game, 10)];

    assert.doesNotThrow(() => game.updateShots(16),
        "dos proyectiles con el último impacto no indexan el array vaciado");
    assert.strictEqual(game.phase, "loot",
        "el último impacto abre la ventana de botín sin sacar la partida");
    assert.strictEqual(game.phaseTimer, 5000,
        "la regresión conserva los cinco segundos completos tras la ráfaga");
    assert.strictEqual(game.shots.length, 0,
        "la ventana elimina el fuego residual y updateShots deja el frame");

    const beforeX = game.player.x;
    assert.strictEqual(game.key("w"), true,
        "el input direccional sigue aceptándose durante el botín de regresión");
    game.update(120);
    assert.notStrictEqual(game.player.x, beforeX,
        "la misma partida se puede mover después del último disparo");

    game.update(4880);
    assert.strictEqual(game.phase, "won",
        "la ruta de regresión llega automáticamente a la victoria");
    assert.strictEqual(getWins(), 1,
        "la victoria de regresión ocurre una sola vez");

}


function smokeLootToRealShop() {

    const maps = ["#####", "#...#", "#.P.#", "#...#", "#####"];
    const levels = [
        {
            id: "vip-smoke",
            map: maps,
            name: "PASILLO VIP",
            subtitle: "transición real",
            light: "#ffffff",
            world: "callcenter",
            stage: "1-1",
            tex: ["panel", "panel", "panel"],
            hp: 1,
            speed: 1,
            damage: 1,
            shop: true
        },
        {
            id: "siguiente-smoke",
            map: maps,
            name: "SIGUIENTE ZONA",
            subtitle: "continúa",
            light: "#ffffff",
            world: "callcenter",
            stage: "1-2",
            tex: ["panel", "panel", "panel"],
            hp: 1,
            speed: 1,
            damage: 1
        }
    ];
    const { game, window, storyChecks } = createGameHarness({ levels, dossier: {} });

    /* La prueba debe atravesar la clase de tienda real, no un objeto falso. */
    vm.runInNewContext(SHOP_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/shop.js"
    });

    game.score = 5500;
    storyChecks.length = 0;
    game.phase = "run";
    game.enemies = [{ dead: true, type: { score: 0 } }];
    game.clearLevel();

    assert.strictEqual(game.phase, "loot",
        "la zona con Sala VIP también mantiene primero el botín jugable");
    assert.strictEqual(game.score, 6000,
        "el premio de limpieza cruza el umbral narrativo durante el botín");
    assert.deepStrictEqual(storyChecks, [],
        "el umbral no abre una historia que recorte los cinco segundos de botín");

    game.update(5000);
    assert.strictEqual(game.phase, "shop",
        "al finalizar el botín se entra automáticamente a la Sala VIP real");
    assert.ok(game.shop instanceof window.Arcade404.op404.Shop,
        "la transición construye la tienda real, no un marcador de fase");
    assert.strictEqual(game.haggleAttempts, 5,
        "la tienda de transición conserva sus cinco intentos nuevos");
    assert.deepStrictEqual(storyChecks, [6000],
        "el umbral narrativo se revisa después de estabilizar la transición VIP");

    game.leaveShop();
    assert.strictEqual(game.phase, "run",
        "salir de la Sala VIP vuelve al FPS sin regresar al menú");
    assert.strictEqual(game.levelIndex, 1,
        "la tienda real carga la siguiente zona de la campaña");

}


function smokeLootToNextZone() {

    const maps = ["#####", "#...#", "#.P.#", "#...#", "#####"];
    const levels = [
        {
            id: "paso-uno",
            map: maps,
            name: "PASO UNO",
            subtitle: "sin tienda",
            light: "#ffffff",
            world: "callcenter",
            stage: "1-1",
            tex: ["panel", "panel", "panel"],
            hp: 1,
            speed: 1,
            damage: 1
        },
        {
            id: "paso-dos",
            map: maps,
            name: "PASO DOS",
            subtitle: "continuación",
            light: "#ffffff",
            world: "callcenter",
            stage: "1-2",
            tex: ["panel", "panel", "panel"],
            hp: 1,
            speed: 1,
            damage: 1
        }
    ];
    const { game } = createGameHarness({ levels, dossier: {} });

    game.phase = "run";
    game.enemies = [{ dead: true, type: { score: 0 } }];
    game.clearLevel();
    game.update(5000);

    assert.strictEqual(game.phase, "run",
        "una zona sin Sala VIP carga la siguiente zona al cerrar el botín");
    assert.strictEqual(game.levelIndex, 1,
        "la transición de cinco segundos no requiere regresar al menú");

}


function makeDifficultyButton(id) {

    const listeners = {};
    const classes = new Set(["hud-switch__option"]);

    return {
        dataset: { op404Difficulty: id },
        attributes: {},
        classList: {
            toggle: (name, enabled) => {
                if (enabled) {
                    classes.add(name);
                } else {
                    classes.delete(name);
                }
            },
            contains: (name) => classes.has(name)
        },
        setAttribute(name, value) {
            this.attributes[name] = String(value);
        },
        addEventListener(name, callback) {
            listeners[name] = callback;
        },
        click() {
            listeners.click();
        }
    };

}


function smokeDifficulty() {

    const buttons = [
        makeDifficultyButton("facil"),
        makeDifficultyButton("normal"),
        makeDifficultyButton("dificil")
    ];
    const mounted = createGameHarness({
        root: {},
        qsa: (selector) => selector === "[data-op404-difficulty]" ? buttons : []
    });

    assert.match(mounted.definition.controls, /op404-difficulty/,
        "el HUD registra un selector dedicado de dificultad");
    assert.match(mounted.definition.controls, /count="3"/,
        "el selector expone Fácil, Normal y Difícil");
    assert.strictEqual(mounted.game.difficulty, "normal",
        "Normal es el perfil inicial de OPERACIÓN 404");
    assert.ok(buttons[1].classList.contains("is-active") &&
        buttons[1].attributes["aria-pressed"] === "true",
    "el selector refleja la dificultad activa y su estado accesible");

    buttons[2].click();
    assert.strictEqual(mounted.game.difficulty, "dificil",
        "el botón DIFÍCIL reinicia la incursión desde el perfil elegido");
    assert.strictEqual(mounted.stored["op404:difficulty"], "dificil",
        "OP404 persiste su preferencia bajo una clave propia");
    assert.strictEqual(mounted.stats.difficulty, "DIFÍCIL",
        "el HUD expone el perfil activo durante la campaña");

    mounted.shell.state = "running";
    buttons[0].click();
    assert.strictEqual(mounted.game.difficulty, "dificil",
        "un combate ya iniciado no cambia sus multiplicadores a escondidas");
    assert.match(mounted.statuses[mounted.statuses.length - 1], /READY/,
        "el selector explica que el cambio se hace antes de jugar");

    const saved = createGameHarness({ storage: { "op404:difficulty": "facil" } });
    assert.strictEqual(saved.game.difficulty, "facil",
        "la preferencia de OP404 se recupera en una sesión posterior");

    const easy = createGameHarness();
    const normal = createGameHarness();
    const hard = createGameHarness();
    easy.game.setDifficulty("facil");
    hard.game.setDifficulty("dificil");
    easy.game.spawnEnemy("gorgojo", { x: 1.5, y: 1.5 });
    normal.game.spawnEnemy("gorgojo", { x: 1.5, y: 1.5 });
    hard.game.spawnEnemy("gorgojo", { x: 1.5, y: 1.5 });

    assert.ok(easy.game.enemies[easy.game.enemies.length - 1].maxHp < normal.game.enemies[normal.game.enemies.length - 1].maxHp &&
        normal.game.enemies[normal.game.enemies.length - 1].maxHp < hard.game.enemies[hard.game.enemies.length - 1].maxHp,
    "la dificultad escala el HP de spawn sin alterar el mapa");
    assert.ok(easy.game.enemyDamage(10) < normal.game.enemyDamage(10) &&
        normal.game.enemyDamage(10) < hard.game.enemyDamage(10),
    "la dificultad escala el daño de contacto, proyectil y explosión desde una ruta común");
    assert.ok(GAME_SOURCE.includes("this.tuning.speed") &&
        GAME_SOURCE.includes("this.tuning.money") &&
        !GAME_SOURCE.includes("settings.difficulty"),
    "velocidad y economía usan el perfil de OP404 sin acoplarse a Chess");

    const haggledMoney = (difficulty) => {
        const harness = createGameHarness();
        vm.runInNewContext(SHOP_SOURCE, { window: harness.window, Math, console }, {
            filename: "js/games/op404/shop.js"
        });
        harness.game.setDifficulty(difficulty);
        const shop = new harness.window.Arcade404.op404.Shop(harness.stage, harness.game);
        shop.intro = -1;
        shop.haggleOutcome = () => ({ kind: "money", amount: 20, label: "$20" });
        shop.askDiscount("prueba de economía");
        return harness.game.money;
    };

    assert.deepStrictEqual(
        [haggledMoney("facil"), haggledMoney("normal"), haggledMoney("dificil")],
        [27, 22, 19],
        "el efectivo de regateo también respeta la economía de cada dificultad"
    );

}


function smokeSilSecret() {

    const dialogueHarness = createGameHarness();
    const dialogueGame = dialogueHarness.game;
    dialogueGame.money = 0;
    dialogueGame.spawnAlly("sil", dialogueGame.player.x + 1, dialogueGame.player.y);
    const dialogueSil = dialogueGame.allies[dialogueGame.allies.length - 1];
    dialogueGame.updateAllies(16);
    assert.strictEqual(dialogueSil.step, 0,
        "acercarse a Sil abre la primera línea de la escena secreta");
    dialogueGame.updateAllies(60000);
    assert.strictEqual(dialogueSil.step, 0,
        "el diálogo secreto no adelanta frases ni entrega dinero por temporizador");
    assert.strictEqual(dialogueSil.gave, false,
        "el fondo de Sil espera la última confirmación manual");
    assert.strictEqual(dialogueGame.advanceAllyDialogue(), true,
        "ESPACIO o tocar el control avanza una línea del encuentro secreto");
    assert.strictEqual(dialogueSil.step, 1,
        "el avance manual de Sil muestra sólo la siguiente frase");
    while (dialogueGame.activeAllyDialogue()) {
        dialogueGame.advanceAllyDialogue();
    }
    assert.strictEqual(dialogueSil.gave, true,
        "la recompensa secreta llega únicamente al terminar el diálogo manual");

    const { game, statuses } = createGameHarness();

    game.money = 0;
    game.spawnAlly("sil", game.player.x + 1, game.player.y);
    const sil = game.allies[game.allies.length - 1];

    assert.strictEqual(sil.label, "SIL",
        "Sil se crea como encuentro secreto con identidad propia");
    assert.ok(Array.isArray(sil.script) && sil.script.length >= 3,
        "Sil tiene un diálogo de encuentro, no sólo una recompensa muda");
    assert.match(sil.script.join(" "), /Sala VIP/i,
        "el diálogo de Sil orienta explícitamente su aporte hacia la Sala VIP");

    game.allyGift(sil);
    assert.strictEqual(game.money, 198,
        "el encuentro secreto entrega un fondo útil y directo para compras");
    assert.match(statuses[statuses.length - 1], /SIL.*\+\$198/i,
        "la recompensa de Sil confirma la cantidad que llegó al inventario");
    assert.ok(GAME_SOURCE.includes("SIL_SECRET_CHANCE") &&
        GAME_SOURCE.includes('sil: { idle: "character.sil.full" }')
        && GAME_SOURCE.includes("advanceAllyDialogue()")
        && !GAME_SOURCE.includes("ally.stepTimer"),
    "Sil entra mediante una probabilidad secreta, usa su PNG y espera diálogo manual");
    assert.ok(SPRITES_SOURCE.includes("function sil(frame = 0)") &&
        SPRITES_SOURCE.includes("sil: [sil(0), sil(1)]"),
    "el encuentro conserva un fallback animado mientras carga el arte externo");
    assert.ok(ASSETS_SOURCE.includes('"character.sil.full": { x: 538, y: 89, width: 562, height: 829 }'),
        "el PNG de Sil usa el recorte de cuerpo completo, no el lienzo transparente completo");

}


function smokeSilFallbackSprite() {

    const A = { op404: {} };
    const ctx = new Proxy({ globalAlpha: 1 }, {
        get(target, key) {
            return key in target ? target[key] : () => {};
        },
        set(target, key, value) {
            target[key] = value;
            return true;
        }
    });
    const document = {
        createElement: () => ({
            width: 0,
            height: 0,
            getContext: () => ctx
        })
    };
    const window = { Arcade404: A };

    vm.runInNewContext(PIXEL_ART_SOURCE, { window, document, Math, console }, {
        filename: "js/core/pixelart.js"
    });
    vm.runInNewContext(SPRITES_SOURCE, { window, document, Math, console }, {
        filename: "js/games/op404/sprites.js"
    });

    const frames = A.op404.sprites().allies.sil;
    assert.ok(Array.isArray(frames) && frames.length === 2 &&
        frames.every((frame) => frame.width > 0 && frame.height > 0),
    "el fallback pixel-art de Sil se construye en dos frames utilizables");

}


function smokePerformanceProfile() {

    const desktop = createGameHarness({
        navigator: { hardwareConcurrency: 8, deviceMemory: 8 }
    });

    assert.strictEqual(desktop.game.renderCols, 320,
        "el perfil de escritorio conserva el raycaster completo");
    assert.strictEqual(desktop.stage.options.maxDpr, 1.25,
        "el lienzo de escritorio limita el fill-rate Retina sin cambiar su lógica");
    assert.strictEqual(desktop.game.zbuffer.length, 320,
        "el z-buffer usa exactamente las columnas activas");
    desktop.game.render();

    desktop.game.onFps(30);
    desktop.game.onFps(30);
    assert.strictEqual(desktop.game.renderCols, 192,
        "dos mediciones bajas activan el modo de recuperación sin reiniciar");
    assert.strictEqual(desktop.game.zbuffer.length, 192,
        "la recuperación reajusta también el z-buffer");

    const mobile = createGameHarness({
        coarsePointer: true,
        navigator: { hardwareConcurrency: 4, deviceMemory: 4 }
    });

    assert.strictEqual(mobile.game.renderCols, 192,
        "el perfil táctil reduce rayos antes de iniciar el combate");
    assert.strictEqual(mobile.stage.options.maxDpr, 1,
        "el perfil táctil evita el backbuffer 2x innecesario");
    assert.strictEqual(mobile.game.zbuffer.length, 192,
        "el z-buffer se ajusta al perfil táctil");
    mobile.game.render();

}


function smokeDialogueContract() {

    assert.ok(GAME_SOURCE.includes("ALLY_DIALOGUE_EXPRESSIONS"),
        "los aliados tienen una tabla de expresiones por línea narrativa");
    assert.ok(GAME_SOURCE.includes('desire: { idle: "character.desire.full" }')
        && GAME_SOURCE.includes('davinchi: { idle: "character.davinchi.full" }'),
    "los cuerpos completos siguen siendo los sprites del mundo");
    assert.ok(GAME_SOURCE.includes("ally.expression = allyDialogueExpression(ally)")
        && GAME_SOURCE.includes("allyDialogueArtId(talking)"),
    "el diálogo consume la expresión narrativa actual del aliado");

    ["amor", "yeah", "déjame pensarlo", "dato primero", "nivel VIP"].forEach((signature) => {
        assert.ok(ASSETS_SOURCE.includes(`signature: "${signature}"`),
            "la ficha de assets conserva la firma de voz de " + signature);
    });
    assert.ok(MAPS_SOURCE.includes("Busca los lentes espejo, amor")
        && MAPS_SOURCE.includes("Ya preparé el bypass, yeah")
        && MAPS_SOURCE.includes("Lo revisé tres veces")
        && MAPS_SOURCE.includes("No es coincidencia")
        && MAPS_SOURCE.includes("inversión de categoría"),
    "los dossiers de OP404 hacen reconocible a Desire, Davinchi, Rog, Sil y Colinas");
    assert.ok(TURNO_SOURCE.includes("Amor, son pasos")
        && TURNO_SOURCE.includes("La onda no cuadra con agua, yeah")
        && TURNO_SOURCE.includes("Déjame revisar otra vez")
        && TURNO_SOURCE.includes("Mira el dato, no el miedo")
        && TURNO_SOURCE.includes("miembro fundador"),
    "TURNO404 conserva voces diferenciadas aun bajo el horror de oficina");
    assert.ok(SHOP_SOURCE.includes("El estatus no se explica; se factura.")
        && SHOP_SOURCE.includes("Mi paciencia no tiene acceso general"),
    "la Sala VIP concentra la voz mordaz y obsesionada con estatus de Colinas");

}


function smokeIntroRoute() {

    const { stage, A, window } = createGameHarness();

    stage.ctx.measureText = (text) => ({ width: String(text).length * 6 });

    vm.runInNewContext(INTRO_SOURCE, { window, Math, console }, {
        filename: "js/games/op404/intro.js"
    });

    assert.strictEqual(A.op404.INTRO_SCENES.length, 5,
        "la intro mantiene cinco viñetas de lectura rápida");
    assert.strictEqual(A.op404.INTRO_SCENES[3].title, "CINCO CANALES ABIERTOS",
        "la cuarta viñeta presenta al equipo completo");
    assert.match(A.op404.INTRO_SCENES[4].lines.join(" "), /seis nodos/i,
        "el cierre de intro prepara la ruta de seis nodos");

    const intro = new A.op404.Intro(stage);

    intro.update(60000);
    assert.strictEqual(intro.index, 0,
        "la intro de OP404 no cambia de viñeta al agotarse el tiempo de lectura");
    assert.strictEqual(intro.done, false,
        "la última viñeta tampoco puede cerrar sola la campaña");

    A.op404.INTRO_SCENES.forEach(() => {
        intro.elapsed = 700;
        intro.render();
        intro.skipScene();
    });

    assert.strictEqual(intro.done, true,
        "las cinco viñetas nuevas se renderizan y siguen siendo saltables");

}


function smokeVipBonus() {

    const { game, statuses } = createGameHarness();

    game.claps = 0;
    game.shield = 0;
    game.money = 0;
    game.ammo.balas = 0;
    game.applyVipBonus({
        op404: { claps: 1, shield: 32, cash: 28, bullets: 18 }
    }, ["op-kit"]);

    assert.strictEqual(game.claps, 1, "el kit VIP entrega una Bolsa CLAP a OPERACIÓN 404");
    assert.strictEqual(game.shield, 32, "el apoyo VIP recarga su escudo persistente de campo");
    assert.strictEqual(game.money, 28, "el apoyo VIP entrega efectivo local sin mezclar la moneda global");
    assert.strictEqual(game.ammo.balas, 18, "el apoyo técnico añade munición a OPERACIÓN 404");
    assert.match(String(statuses.at(-1)), /VIP CENTRAL/,
        "la llegada del apoyo global se comunica dentro de la campaña");

}


function smokeDossierAndArtworkQueue() {

    const { game, A } = createGameHarness();

    assert.ok(game.transmission,
        "cada zona con dossier abre una transmisión narrativa al cargar");
    assert.strictEqual(game.transmission.kind, "briefing",
        "una zona normal usa un briefing contextual, no una amenaza");
    assert.strictEqual(game.phase, "run",
        "el dossier conserva la fase del FPS para reanudar sin recargar el mapa");
    assert.strictEqual(game.transmission.blocking, true,
        "el briefing congela el combate mientras se lee, sin depender de un temporizador");
    assert.match(game.transmission.objective, /VALIDA EL VISOR/,
        "la transmisión conserva un objetivo contextual de zona");
    const briefing = game.transmission;
    game.updateTransmission(60000);
    assert.strictEqual(game.transmission, briefing,
        "un briefing sigue abierto después de su antigua duración automática");
    assert.strictEqual(game.dismissTransmission(), true,
        "ESPACIO o el control táctil cierran el briefing cuando el jugador decide");

    game.startLootWindow();
    assert.strictEqual(game.phase, "loot",
        "el debrief narrativo mantiene la ventana de botín activa");
    assert.ok(game.transmission && game.transmission.kind === "clear",
        "la victoria usa la pista de salida durante el botín");
    assert.strictEqual(game.transmission.blocking, false,
        "la pista de botín no sacrifica los cinco segundos de movimiento exigidos");
    const clearTransmission = game.transmission;
    game.updateTransmission(60000);
    assert.strictEqual(game.transmission, clearTransmission,
        "la pista de salida no se desvanece antes de que el jugador pueda leerla");
    game.render();

    const requested = [];
    A.assets = {
        preload: (ids) => requested.push(...ids),
        readyImage: () => null,
        characterImageId: (id, expression) => `character.${id}.${expression}`
    };
    game.boss = {
        type: { label: "JEFE DE PRUEBA" },
        assetId: "boss.supervisor",
        assetRequested: false
    };
    const threat = game.makeTransmission(game.dossierForLevel(), "threat");
    game.preloadTransmissionArtwork(threat);
    assert.strictEqual(threat.threatAsset, "boss.supervisor",
        "la alerta de jefe conserva el asset de su amenaza");
    assert.strictEqual(game.boss.assetRequested, true,
        "el aviso marca el retrato del jefe para el encuadre dual de amenaza");
    assert.deepStrictEqual(requested, ["boss.supervisor", "character.sil.seria"],
        "la amenaza prepara exactamente al jefe y a quien lo reporta, no un lote de retratos");

    requested.length = 0;
    game.boss = null;
    const radio = game.makeTransmission(game.dossierForLevel(), "briefing");
    game.preloadTransmissionArtwork(radio);
    assert.strictEqual(radio.portraitId, "character.sil.seria",
        "la radio pide la expresión adecuada de quien habla");
    assert.deepStrictEqual(requested, ["character.sil.seria"],
        "una transmisión normal prepara sólo un retrato emocional");

    /* Los pares alternos se rotan por zona/tipo de transmisión y pueden
       cambiar gesto sin diluir la identidad de la misma voz. */
    const variedDossier = {
        speaker: "sil",
        expression: "seria",
        channel: "CANAL VARIABLE",
        lines: ["Línea base de lectura.", "La misión conserva el rumbo."],
        variants: [{
            expression: "emocionada",
            lines: ["Línea alterna de lectura.", "La misión mantiene el rumbo."]
        }]
    };
    game.transmissionVariantCursor = {};
    const baseScript = game.makeTransmission(variedDossier, "briefing");
    const alternateScript = game.makeTransmission(variedDossier, "briefing");
    assert.strictEqual(baseScript.lines[0], "Línea base de lectura.",
        "la primera lectura conserva el briefing principal de la zona");
    assert.strictEqual(alternateScript.lines[0], "Línea alterna de lectura.",
        "un reintento rota hacia un par de diálogo alterno");
    assert.strictEqual(alternateScript.portraitId, "character.sil.emocionada",
        "la variación también solicita el gesto emocional que corresponde");
    game.transmissionVariantCursor = {};
    game.levelIndex = 1;
    const chapterScript = game.makeTransmission(variedDossier, "briefing");
    assert.strictEqual(chapterScript.lines[0], "Línea alterna de lectura.",
        "los capítulos posteriores también distribuyen una voz alterna en la primera ruta");
    game.levelIndex = 0;

    /* Una alerta de jefe no sustituye a la voz por el objetivo: ambas
       imágenes se dibujan dentro de la misma tarjeta de transmisión. */
    const portraitArtwork = {
        "character.sil.seria": {
            id: "character.sil.seria",
            naturalWidth: 80,
            naturalHeight: 120
        },
        "boss.supervisor": {
            id: "boss.supervisor",
            naturalWidth: 90,
            naturalHeight: 140
        }
    };
    const drawnTransmissionArtwork = [];
    A.assets = {
        preload: (ids) => requested.push(...ids),
        readyImage: (id) => portraitArtwork[id] || null,
        canvasFrame: () => null,
        characterImageId: (id, expression) => `character.${id}.${expression}`
    };
    game.stage.ctx.drawImage = (image, ...args) => drawnTransmissionArtwork.push({
        id: image.id,
        x: args[4],
        width: args[6]
    });
    threat.elapsed = threat.revealDuration;
    game.transmission = threat;
    game.drawTransmission();
    assert.deepStrictEqual(drawnTransmissionArtwork.map((art) => art.id), [
        "character.sil.seria",
        "boss.supervisor"
    ], "la tarjeta de jefe encuadra a quien habla y al jefe en el mismo frame");
    assert.ok(drawnTransmissionArtwork[0].x + drawnTransmissionArtwork[0].width
        < drawnTransmissionArtwork[1].x,
    "el retrato de la voz y la imagen del jefe ocupan ventanas distintas");

    requested.length = 0;
    game.phase = "run";
    game.time = 1000;
    game.nextArtStreamAt = 0;
    game.player = { x: 2, y: 2, angle: 0 };
    game.enemies = [{
        x: 5,
        y: 2,
        dead: false,
        hidden: false,
        assetId: "enemy.malandro",
        assetRequested: false,
        type: { boss: false }
    }];

    game.updateArtStreaming();
    assert.strictEqual(game.enemies[0].assetRequested, true,
        "el arte se solicita al enemigo que entra al campo visual");
    assert.deepStrictEqual(requested, ["enemy.malandro"],
        "la cola pide un solo PNG visible por ciclo");

    game.enemies.push({
        x: 6,
        y: 2,
        dead: false,
        hidden: false,
        assetId: "enemy.usuario",
        assetRequested: false,
        type: { boss: false }
    });
    game.updateArtStreaming();
    assert.strictEqual(requested.length, 1,
        "la cola espacia la siguiente decodificación en lugar de cargar la oleada completa");

    /* Al cargar una zona, todos los retratos únicos se piden fuera del
       primer render. Mientras una imagen sigue pendiente, la baliza neutral
       reemplaza al sprite procedural viejo; al estar lista toma su lugar. */
    requested.length = 0;
    const oldProcedural = { marker: "procedural", width: 16, height: 16, naturalWidth: 16, naturalHeight: 16 };
    const pendingSignal = { marker: "pending", width: 30, height: 44, naturalWidth: 30, naturalHeight: 44 };
    const readyExternal = { marker: "external", width: 90, height: 130, naturalWidth: 90, naturalHeight: 130 };
    game.art.pendingEnemy = [pendingSignal, pendingSignal];
    game.art.enemies.malandro = [oldProcedural];
    game.enemies = [
        { x: 5, y: 2, dead: false, hidden: false, assetId: "enemy.malandro", assetRequested: false, variant: "malandro", kind: "malandro", anim: 0, stagger: 0, flash: 0, deadTimer: 0, type: { size: 1 } },
        { x: 6, y: 2, dead: false, hidden: false, assetId: "enemy.malandro", assetRequested: false, variant: "malandro", kind: "malandro", anim: 0, stagger: 0, flash: 0, deadTimer: 0, type: { size: 1 } }
    ];
    let externalReady = false;
    A.assets = {
        preload: (ids) => {
            requested.push(...ids);
            return Promise.resolve([]);
        },
        readyImage: () => externalReady ? readyExternal : null,
        canvasFrame: () => null,
        characterImageId: (id, expression) => `character.${id}.${expression}`
    };
    game.preloadLevelEnemyArtwork();
    assert.deepStrictEqual(requested, ["enemy.malandro"],
        "la zona precarga una sola vez cada retrato enemigo único");
    assert.ok(game.enemies.every((enemy) => enemy.assetRequested),
        "los enemigos de la zona quedan marcados antes del primer frame");

    const drawn = [];
    game.stage.ctx.drawImage = (sprite) => drawn.push(sprite);
    game.player = { x: 2, y: 2, angle: 0 };
    game.zbuffer = new Float32Array(game.renderCols).fill(Infinity);
    game.drawSprites();
    assert.ok(drawn.length > 0 && drawn.every((sprite) => sprite === pendingSignal),
        "un PNG externo pendiente muestra la baliza, nunca el sprite procedural anterior");

    drawn.length = 0;
    externalReady = true;
    game.drawSprites();
    assert.ok(drawn.length > 0 && drawn.every((sprite) => sprite === readyExternal),
        "al quedar listo, el retrato integrado sustituye directamente a la baliza");
    assert.strictEqual(game.stage.ctx.imageSmoothingEnabled, true,
        "los PNG externos se interpolan al proyectarse y no heredan el escalado dentado del pixel-art");

    assert.ok(GAME_SOURCE.includes("preloadLevelEnemyArtwork")
        && GAME_SOURCE.includes("sprite: external || pending || fallback")
        && GAME_SOURCE.includes("externalArtwork")
        && GAME_SOURCE.includes("imageSmoothingQuality")
        && SPRITES_SOURCE.includes("pendingEnemy")
        && SPRITES_SOURCE.includes("assetSignal"),
        "la ruta de render precarga, marca arte externo y evita su deformación al aparecer");
    assert.ok(GAME_SOURCE.includes("drawWorldAtmosphere")
        && GAME_SOURCE.includes("drawTacticalFrame")
        && GAME_SOURCE.includes("drawTransmission"),
    "el visor combina ambiente por mundo, marco táctico y transmisiones");

}


smokeAnalogStickInput();
smokeExpandedMaps();
smokePhysicalCoverAndShieldHud();
smokeArsenalAndRecovery();
smokeWeaponWorkshopAndRandomLoot();
smokeFieldCheckpointAndCompanion();
smokeDialogueContract();
smokeIntroRoute();
smokeVipBonus();
smokeDossierAndArtworkQueue();
smokePerformanceProfile();
smokeShop();
smokeClapSupplies();
smokeCheckpointHaggleVisit();
smokeDifficulty();
smokeSilSecret();
smokeSilFallbackSprite();
smokeLootWindow();
smokeLastShotRegression();
smokeLootToNextZone();
smokeLootToRealShop();
console.log("✓ OPERACIÓN 404 smoke: mapas, VFX, Taller, cajas, checkpoints, VIP y botín sin freeze");
