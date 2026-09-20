#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — comprobación estática sin dependencias

   Uso: node tools/verify-project.js

   Comprueba que el HTML cargue los recursos en un orden seguro,
   que cada ruta del manifiesto exista, que los diez juegos estén
   registrados y que todo JavaScript pase el parser de Node.
   ========================================================= */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const EXPECTED_GAMES = [
    "snake",
    "invaders",
    "pong",
    "breaker",
    "tetris",
    "chess",
    "blockblast",
    "pac404",
    "op404",
    "turno404"
];

let failures = 0;

function fail(message) {
    failures += 1;
    console.error("✗ " + message);
}

function pass(message) {
    console.log("✓ " + message);
}

function assert(condition, message) {
    if (condition) {
        pass(message);
    } else {
        fail(message);
    }
}

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
    return fs.existsSync(path.join(ROOT, relativePath));
}

function walk(directory) {
    const output = [];

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            output.push(...walk(absolute));
        } else {
            output.push(absolute);
        }
    }

    return output;
}

function localPath(url, from = "") {
    if (!url || /^(?:https?:|data:|#)/i.test(url)) {
        return null;
    }

    const withoutQuery = url.replace(/[?#].*$/, "");
    const decoded = decodeURIComponent(withoutQuery);

    return path.normalize(path.join(from, decoded.replace(/^\.\//, "")));
}

function validateIndexResources() {
    const html = read("index.html");
    const scriptSources = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi))
        .map((match) => match[1]);
    const styleSources = Array.from(html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi))
        .map((match) => match[1]);
    const iconSources = Array.from(html.matchAll(/<link\b[^>]*\b(?:rel=["'][^"']*icon[^"']*["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi))
        .map((match) => match[1]);

    assert(scriptSources.length >= 30, "index.html declara los scripts del núcleo y los 10 juegos");

    const missingScripts = scriptSources.filter((url) => {
        const relative = localPath(url);
        return !relative || !exists(relative);
    });
    const localStyles = styleSources.filter((url) => localPath(url));
    const missingStyles = localStyles.filter((url) => !exists(localPath(url)));
    const externalStyles = styleSources.filter((url) => !localPath(url));
    const missingIcons = iconSources.filter((url) => {
        const relative = localPath(url);
        return !relative || !exists(relative);
    });

    assert(!missingScripts.length,
        `${scriptSources.length} scripts locales disponibles${missingScripts.length ? `: ${missingScripts.join(", ")}` : ""}`);
    assert(!missingStyles.length,
        `${localStyles.length} hoja(s) local(es) disponibles${missingStyles.length ? `: ${missingStyles.join(", ")}` : ""}`);
    assert(!missingIcons.length,
        `${iconSources.length} iconos disponibles${missingIcons.length ? `: ${missingIcons.join(", ")}` : ""}`);

    if (externalStyles.length) {
        pass(`${externalStyles.length} hoja(s) de estilo externa(s) declarada(s)`);
    }

    /* Las rutas pueden llevar una versión de caché en el preview. El orden
       lógico se evalúa contra el archivo, no contra ese sufijo HTTP. */
    const scriptIndex = (file) => scriptSources.findIndex(
        (source) => source.replace(/[?#].*$/, "") === file
    );
    const assetsIndex = scriptIndex("./js/core/assets.js");
    const storyIndex = scriptIndex("./js/core/story.js");
    const turnoIndex = scriptIndex("./js/games/turno404.js");
    const appIndex = scriptIndex("./js/app.js");

    assert(assetsIndex !== -1 && assetsIndex < storyIndex,
        "el manifiesto de assets carga antes de los consumidores del núcleo");
    assert(turnoIndex !== -1 && turnoIndex < appIndex,
        "TURNO 404 se registra antes del bootstrap de la aplicación");
}

function validateHomeExperience() {
    const html = read("index.html");
    const app = read("js/app.js");
    const router = read("js/core/router.js");
    const assets = read("js/core/assets.js");
    const homeCss = read("css/screens/home.css");
    const homeStart = html.indexOf('id="screen-home"');
    const homeEnd = html.indexOf('id="screen-hub"', homeStart);
    const home = html.slice(homeStart, homeEnd);
    const orderedCharacterPaths = [
        "./assets/Desire/Desire.png",
        "./assets/Davinchi/Davinchi.png",
        "./assets/Rog/Rog.png",
        "./assets/Sr de las colinas/Sr de las colinas.png",
        "./assets/Sil/Sil.png"
    ];
    const orderedPositions = orderedCharacterPaths.map((assetPath) => home.indexOf(assetPath));
    const inRequestedOrder = orderedPositions.every((position, index) => (
        position !== -1 && (index === 0 || position > orderedPositions[index - 1])
    ));
    const homeCssBracesBalanced = (homeCss.match(/\{/g) || []).length === (homeCss.match(/\}/g) || []).length;

    assert(
        home.includes("hero__logo")
            && home.includes("hero__logo-tagline")
            && home.includes("JUEGOS HECHOS A MI MANERA")
            && !home.includes("ARCADE NETWORK // ONLINE")
            && !home.includes('id="homeAmbience"')
            && home.includes("hero__world")
            && home.includes("hero__district-art")
            && home.includes("./assets/Home/inicio-neon-base.png")
            && exists("assets/Home/inicio-neon-base.png")
            && home.includes("hero__cast")
            && home.match(/class=\"hero__operator\"/g)?.length === 5
            && home.includes("./assets/logo.png")
            && inRequestedOrder,
        "HOME integra logo, eslogan, cinco capas y elenco en el orden solicitado"
    );
    assert(
        homeCss.includes("body.is-home .hero__scene")
            && homeCss.includes("height: 100dvh")
            && homeCss.includes("body.is-home .topbar")
            && homeCss.includes("body.is-home .footer")
            && homeCss.includes("hero__logo-tagline")
            && homeCss.includes("\n.hero__cast {")
            && homeCssBracesBalanced
            && !home.includes("hero__eyebrow")
            && !home.includes("hero__subtitle")
            && !home.includes("hero__stats")
            && !home.includes("<figcaption>")
            && router.includes('"is-home"'),
        "HOME ocupa el viewport limpio: escena, logo, elenco y CTA sin UI periférica"
    );
    assert(
        home.includes("hero__ufo-flight")
            && home.includes("hero__meteor--one")
            && home.includes("hero__meteor--two")
            && home.includes("hero__cloud--three")
            && [
                "hero-district-parallax",
                "hero-sky-flicker",
                "hero-ufo-patrol",
                "hero-cloud-drift-one",
                "hero-operator-idle",
                "hero-cast-grid",
                "hero-cta-beacon"
            ].every((selector) => homeCss.includes(selector))
            && homeCss.includes("bottom: clamp(18px, 3.5vh, 40px)")
            && homeCss.includes("min-height: 56px"),
        "HOME anima ilustración, cielo, OVNI, nubes y operadores; CTA queda anclado al viewport"
    );
    assert(
        home.includes('id="enterArcade"')
            && home.includes("hero__cta-emblem")
            && home.includes("hero__cta-status")
            && home.includes("hero__cta-key")
            && homeCss.includes("hero-cta-console")
            && homeCss.includes("hero-cta-sweep")
            && homeCss.includes(".hero__cta-key kbd"),
        "ENTRAR AL ARCADE usa una consola de lanzamiento con estado, emblema y atajo visible"
    );

    assert(
        home.includes('data-character="colinas"')
            && home.includes('id="homeVipColinas"')
            && homeCss.includes("hero__operator-vip-button")
            && app.includes("homeVipColinas")
            && app.includes('A.router.go("vip")'),
        "el Sr. de las Colinas abre VIP Central directamente desde HOME"
    );
    assert(
        home.includes('data-character="davinchi"')
            && home.includes('id="homeDavinchi"')
            && home.includes('aria-label="Reproducir la pista de Davinchi"')
            && home.includes('id="homeAudioStatus"')
            && homeCss.includes("hero__operator-audio-button")
            && app.includes("homeDavinchi")
            && app.includes("homeDavinchiAudio")
            && app.includes('"audio.davinchi"')
            && assets.includes('"audio.davinchi": "./assets/Sonido/Davinchi.mp3"')
            && exists("assets/Sonido/Davinchi.mp3"),
        "Davinchi conserva una interacción de audio accesible y diferida en HOME"
    );
    assert(
        html.includes('main.css?v=home-audio-37')
            && html.includes('assets.js?v=op404-companion-22')
            && html.includes('vip.js?v=campaign-open-24')
            && html.includes('story.js?v=op404-companion-22')
            && html.includes('game-shell.js?v=touch-analog-26')
            && html.includes('tetris.js?v=stack-modes-23')
            && html.includes('op404/maps.js?v=op404-cover-25')
            && html.includes('op404/sprites.js?v=op404-cover-25')
            && html.includes('op404/intro.js?v=op404-companion-22')
            && html.includes('op404/clap.js?v=op404-companion-22')
            && html.includes('op404/shop.js?v=op404-weapons-23')
            && html.includes('op404/game.js?v=op404-cover-25')
            && html.includes('turno404.js?v=turno404-protocol-30')
            && html.includes('app.js?v=op404-companion-22')
            && html.includes('vip-central.js?v=campaign-open-24')
            && read("css/main.css").includes('reset.css?v=op404-companion-22')
            && read("css/main.css").includes('shell.css?v=op404-companion-22')
            && read("css/main.css").includes('touch.css?v=touch-analog-26')
            && read("css/main.css").includes('vip.css?v=op404-companion-22')
            && read("css/main.css").includes('home.css?v=ui-cover-25')
            && read("css/main.css").includes('game.css?v=touch-analog-26')
            && read("css/main.css").includes('op404.css?v=op404-companion-22')
            && read("css/main.css").includes('turno404.css?v=turno404-protocol-32'),
        "los recursos de la sala VIP usan una versión fresca de preview"
    );

    assert(
        html.includes('rel="preload" href="./assets/Sonido/Inicio.mp3" as="audio"')
            && html.includes('id="homeMusicNative"')
            && html.includes('src="./assets/Sonido/Inicio.mp3"')
            && /<audio[\s\S]*?id="homeMusicNative"[\s\S]*?\bautoplay\b/.test(html)
            && html.includes("playsinline")
            && html.includes('const playback = track.play();')
            && app.includes('"audio.inicio"')
            && app.includes('"audio.click"')
            && app.includes("homeMusicNative")
            && app.includes("homeMusic")
            && app.includes("autoplay: true")
            && app.includes('preload: "auto"')
            && app.includes('track.addEventListener("canplay"')
            && app.includes('window.addEventListener("load"')
            && app.includes('window.addEventListener("pageshow"')
            && assets.includes("audio.autoplay = Boolean(options.autoplay)")
            && homeCss.includes(".home-audio")
            && app.includes("activateHomeFromGesture")
            && app.includes('document.addEventListener("click"'),
        "HOME intenta Inicio desde el parseo y reintentos automáticos; conserva click/fallback invisible"
    );
}

function validateHubExperience() {
    const html = read("index.html");
    const app = read("js/app.js");
    const router = read("js/core/router.js");
    const hub = read("js/core/hub.js");
    const hubCss = read("css/screens/hub.css");
    const cardCss = read("css/cards/card.css");
    const transitionCss = read("css/components/transition.css");
    const audioTags = Array.from(html.matchAll(/<audio\b[^>]*>/gi)).map((match) => match[0]);
    const tensionTag = audioTags.find((tag) => tag.includes('id="hubTensionMusicNative"')) || "";
    const transitionStart = html.indexOf('id="arcadeTransition"');
    const transitionEnd = html.indexOf('<!-- =================================================\n         APPLICATION', transitionStart);
    const transition = transitionStart >= 0 && transitionEnd >= 0
        ? html.slice(transitionStart, transitionEnd)
        : "";
    const slatCount = (transition.match(/--close-delay:/g) || []).length;

    assert(
        transitionStart >= 0
            && slatCount === 12
            && transition.includes("arcade-transition__slats")
            && transitionCss.includes("arcade-slat-close")
            && transitionCss.includes("arcade-slat-open")
            && app.includes("HUB_SWAP_DELAY")
            && app.includes('curtain.classList.add("is-closing")')
            && app.includes('curtain.classList.add("is-opening")'),
        "ENTER usa doce listones para cubrir HOME y revelar el selector"
    );
    assert(
        html.includes('href="./assets/Sonido/Abiente%20%20de%20tension.mp3"')
            && tensionTag.includes('src="./assets/Sonido/Abiente%20%20de%20tension.mp3"')
            && tensionTag.includes('preload="auto"')
            && tensionTag.includes("loop")
            && tensionTag.includes("playsinline")
            && !/\bautoplay\b/.test(tensionTag)
            && app.includes("hubTensionMusicNative")
            && app.includes('"audio.tension"')
            && app.includes("prepareTransition")
            && app.includes("fadeHomeForHub")
            && app.includes("fadeTrackVolume")
            && app.includes("HUB_FADE_IN_MS"),
        "HOME baja suavemente e inicia la tensión preparada al aparecer el hub"
    );
    assert(
        router.includes('"is-hub"')
            && router.includes("playEntrance")
            && hub.includes("game-card__screen")
            && hub.includes("game-card__mode")
            && hub.includes("game-card--entering")
            && hubCss.includes("hub-district-backdrop")
            && hubCss.includes("inicio-neon-base.png")
            && cardCss.includes("game-card__screen")
            && cardCss.includes("game-card--entering")
            && cardCss.includes("card-screen-sweep"),
        "HUB conserva el distrito oscurecido y presenta tarjetas arcade mejoradas"
    );
}

function validateCssImports() {
    const visited = new Set();
    const missing = [];

    function inspect(relativePath) {
        if (visited.has(relativePath)) {
            return;
        }

        visited.add(relativePath);
        const content = read(relativePath);
        const base = path.dirname(relativePath);
        const imports = Array.from(content.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;/g))
            .map((match) => match[1]);

        imports.forEach((url) => {
            const child = localPath(url, base);

            if (!child || !exists(child)) {
                missing.push(`${relativePath} → ${url}`);
                return;
            }

            inspect(child);
        });
    }

    inspect("css/main.css");
    assert(!missing.length,
        `${visited.size - 1} imports CSS locales disponibles${missing.length ? `: ${missing.join(", ")}` : ""}`);
    assert(visited.has("css/games/turno404.css"), "main.css incorpora el estilo de TURNO 404");
    assert(visited.has("css/screens/vip.css"), "main.css incorpora la vista de VIP Central");
}

function validateVipCentral() {
    const index = read("index.html");
    const vip = read("js/core/vip.js");
    const central = read("js/core/vip-central.js");
    const shell = read("js/core/game-shell.js");
    const router = read("js/core/router.js");
    const hub = read("js/core/hub.js");
    const assets = read("js/core/assets.js");
    const vipCss = read("css/screens/vip.css");
    const gameCss = read("css/screens/game.css");
    const op404 = read("js/games/op404/game.js");
    const turno = read("js/games/turno404.js");
    const app = read("js/app.js");

    assert(
        exists("js/core/vip.js")
            && exists("js/core/vip-central.js")
            && exists("css/screens/vip.css")
            && index.includes('id="screen-vip"')
            && index.includes('id="vipButton"')
            && index.includes('id="vipHubButton"')
            && index.includes('./js/core/vip.js')
            && index.includes('./js/core/vip-central.js')
            && router.includes('type: "vip"')
            && router.includes('"is-vip"'),
        "VIP Central queda fuera de OP404 y es accesible desde el menú y el hub"
    );
    assert(
        assets.includes('"home.vip-lounge"')
            && central.includes('imageUrl("home.vip-lounge")')
            && vipCss.includes("vip-scene__backdrop")
            && vipCss.includes("vip-scene__grid")
            && vipCss.includes("vip-scene__carpet")
            && vipCss.includes("vip-scene__sign"),
        "la Sala VIP reutiliza la ciudad de HOME con retícula, alfombra y letrero neón"
    );
    assert(
        vipCss.includes("MODO MÓVIL COMPACTO · SALA Y MOSTRADOR")
            && vipCss.includes("min-height: clamp(470px, calc(100dvh - 128px), 530px)")
            && vipCss.includes("min-height: clamp(420px, calc(100dvh - 128px), 480px)")
            && vipCss.includes(".vip-menu__catalog {")
            && vipCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr))")
            && vipCss.includes("@media (max-width: 350px)")
            && vipCss.includes("@media (max-width: 900px) and (max-height: 600px) and (orientation: landscape)")
            && vipCss.includes("Panel contextual en flujo: historia primero, espacio justo")
            && vipCss.includes(".vip-scene.is-context-open")
            && vipCss.includes("min-height: clamp(300px, calc(100dvh - 278px), 340px)")
            && vipCss.includes(".vip-central__ledger-row.is-idle")
            && vipCss.includes("min-height: min(460px, calc(100dvh - 12px))")
            && !vipCss.includes("Mostrador a primer plano en teléfono")
            && central.includes("const contextOpen")
            && central.includes("const deferPanelsForIntro = introOpen")
            && central.includes("const accountIdle = !state.active && !state.ledger.length")
            && central.includes('block: compactMenu ? "nearest" : "start"')
            && vipCss.includes("env(safe-area-inset-left)")
            && vipCss.includes("min-height: 40px"),
        "VIP conserva la historia en flujo y recoge sólo el espacio móvil sobrante antes del mostrador"
    );
    assert(
        central.includes("const LOUNGE_ACTIVITY_ORDER")
            && central.includes("const LOUNGE_ACTIVITY_DELAY = 3400")
            && central.includes("function scheduleLoungeMotion()")
            && central.includes("unlistenRoute")
            && central.includes('route.type !== "vip"')
            && central.includes("is-lounge-beat")
            && central.includes("vip-scene__activity")
            && vipCss.includes("Ritmo vivo de la Sala VIP")
            && vipCss.includes("vip-desire-lounge-idle")
            && vipCss.includes("vip-davinchi-lounge-idle")
            && vipCss.includes("vip-rog-lounge-idle")
            && vipCss.includes("vip-sil-lounge-idle")
            && vipCss.includes("vip-colinas-lounge-idle")
            && vipCss.includes("vip-lounge-beat")
            && vipCss.includes("vip-intro-speaking")
            && vipCss.includes(".vip-intro__speaker img")
            && vipCss.includes("prefers-reduced-motion: reduce")
            && vipCss.includes("animation: none !important"),
        "la Sala VIP alterna gestos de los cinco personajes, anima la intro y respeta movimiento reducido"
    );
    assert(
        vip.includes("const TICKET_GAMES")
            && vip.includes("const CAMPAIGN_TICKETS_ENABLED = false")
            && vip.includes("isCampaignOpen(gameId)")
            && vip.includes("const ITEM_CATALOG")
            && vip.includes("const COMPANIONS")
            && vip.includes("fichas: 0")
            && vip.includes("tickets: { op404: 0, turno404: 0 }")
            && vip.includes("completeRun(gameId, score, won)")
            && vip.includes("scoreReward = Math.min(36, Math.floor(value / 50))")
            && vip.includes("completeLevel(gameId, score, label)")
            && vip.includes("buyTicket(gameId)")
            && vip.includes("awardAffinity(gameId, won)")
            && vip.includes("const PREVIEW_TEST_STIPEND = 10000")
            && vip.includes("claimPreviewTestStipend()")
            && vip.includes("isArenaPreviewHost()")
            && !vip.includes("grantPreviewFunds")
            && !app.includes("seedArenaPreviewVip")
            && !app.includes("grantPreviewFunds")
            && central.includes("previewTestVoucher")
            && central.includes("preview-stipend")
            && central.includes("ACCESO DE CAMPAÑA")
            && central.includes("No se acredita al abrir la sala")
            && shell.includes("_claimVipEntry")
            && shell.includes("ACCESO ABIERTO PARA AJUSTES")
            && shell.includes("A.vip.completeRun(this.id, score")
            && hub.includes("A.vip.needsTicket"),
        "FICHAS VIP parten en cero, las campañas quedan abiertas para ajustes y el preview sólo ofrece un vale QA manual de una vez"
    );
    assert(
        vip.includes("const LEVELS")
            && vip.includes("giveGift(id)")
            && vip.includes("const CONVERSATION_LIMIT = 5")
            && vip.includes("const DIALOGUE_TRIVIA")
            && vip.includes("answerTrivia(id, choiceId)")
            && vip.includes("trivia: { answered: 0")
            && vip.includes("reaction(gameId, phase")
            && vip.includes("vipIntroSeen")
            && vip.includes("markVipIntroSeen")
            && vip.includes("turno404: { energy")
            && vip.includes("op404: { shield")
            && central.includes("const INTRO_SCENES")
            && central.includes("vip-scene__character")
            && central.includes("is-in-dialogue")
            && central.includes("trivia-answer")
            && central.includes("vip-bond__trivia")
            && central.includes("vip-bond__companion-note")
            && central.includes("camina contigo")
            && !central.includes("vip-bond__mini-note")
            && !central.includes("toca su insignia")
            && central.includes("vip-menu--merchant")
            && central.includes("openMerchant")
            && central.includes("vip-bond__ladder")
            && central.includes("HABILITAR CANAL")
            && shell.includes("_showCompanionSignal")
            && vipCss.includes("vip-scene__character.is-in-dialogue")
            && vipCss.includes("vip-scene__character.is-returning")
            && vipCss.includes("vip-bond__trivia")
            && vipCss.includes("vip-bond__companion-note")
            && !vipCss.includes("vip-bond__mini-note")
            && vipCss.includes("vip-trivia__choices"),
        "la Sala VIP integra foco dinámico, cinco bloques de trivia y vínculos por personaje"
    );
    assert(
        op404.includes('vipTicket: "op404"')
            && op404.includes("applyVipBonus")
            && op404.includes("awardVipLevel")
            && turno.includes('vipTicket: "turno404"')
            && turno.includes("applyVipBonus")
            && turno.includes("awardVipLevel"),
        "OPERACIÓN 404 y TURNO 404 reciben apoyos y acreditan FICHAS por nivel"
    );
    assert(
        vip.includes("const MINI_SUPPORT")
            && vip.includes("universal: {")
            && shell.includes("_configureVipSupport(entry)")
            && shell.includes("_setVipSupportMood(mood, text)")
            && shell.includes("useVipFocus()")
            && shell.includes("_openVipTicketDesk()")
            && shell.includes("awardVipLevel(score, label)")
            && !shell.includes("vip-spectator")
            && !shell.includes("_mountVipSpectator")
            && !gameCss.includes(".vip-spectator")
            && !gameCss.includes("vip-mini-focus")
            && op404.includes("configureVipCompanion")
            && op404.includes("updateVirtualCompanion")
            && op404.includes("setVipCompanionMood")
            && op404.includes("onVipFocusEnd"),
        "el apoyo VIP llega a un Companion caminante de OP404, sin overlay fijo de espectadores"
    );
}


function validateManifest() {
    const content = read("js/core/assets.js");
    const paths = new Set(
        Array.from(content.matchAll(/["'](\.\/assets\/[^"']+)["']/g))
            .map((match) => match[1])
    );

    const missing = Array.from(paths).filter((assetPath) => {
        const relative = localPath(assetPath);
        return !relative || !exists(relative);
    });

    assert(!missing.length,
        `${paths.size} assets del manifiesto disponibles${missing.length ? `: ${missing.join(", ")}` : ""}`);
    assert(paths.size >= 91, `manifiesto cubre ${paths.size} recursos locales`);
}

function validateAssetConsumers() {
    const op404 = read("js/games/op404/game.js");
    const shop = read("js/games/op404/shop.js");
    const story = read("js/core/story.js");
    const intro = read("js/games/op404/intro.js");
    const op404Css = read("css/games/op404.css");
    const turno = read("js/games/turno404.js");
    const assets = read("js/core/assets.js");
    const op404Art = [
        "enemy.chavista", "enemy.chavista-f", "enemy.usuario", "enemy.usuario-f",
        "enemy.malandro", "enemy.malandro-f", "enemy.calidad", "enemy.calidad-f",
        "enemy.backoffice", "enemy.militar", "boss.supervisor", "boss.ampa",
        "boss.maduro", "boss.chavez", "boss.capriles", "boss.srm"
    ];

    assert(op404.includes("const EXTERNAL_ART") && op404Art.every((id) => op404.includes(id)),
        "OPERACIÓN 404 asocia todos los enemigos y jefes entregados");
    assert(
        assets.includes("const CANVAS_FRAMES")
            && assets.includes('"character.desire.full"')
            && assets.includes('"character.davinchi.full"')
            && op404.includes("A.assets.canvasFrame")
            && op404.includes("EXTERNAL_SPRITE_FIT")
            && op404.includes("ground: Boolean(external)")
            && op404.includes("fittedSpriteScale"),
        "OPERACIÓN 404 recorta padding transparente, ajusta altura y apoya sprites en el suelo"
    );
    assert(
        op404.includes("character.desire.full")
            && op404.includes("character.davinchi.full")
            && op404.includes("ALLY_DIALOGUE_EXPRESSIONS")
            && op404.includes("allyDialogueArtId(talking)")
            && op404.includes("legacyAllyKeys")
            && op404.includes("savedAllies[legacyAllyKeys"),
        "OPERACIÓN 404 conserva cuerpos completos en mundo y usa expresiones en diálogo"
    );
    assert(
        op404.includes("updateArtStreaming")
            && op404.includes("assetRequested")
            && op404.includes("drawWorldAtmosphere")
            && op404.includes("drawTransmission")
            && op404.includes("drawTacticalFrame")
            && intro.includes("CINCO CANALES ABIERTOS")
            && intro.includes("RUTA 404 // SEIS NODOS")
            && story.includes("Los cinco canales miran el Palacio")
            && op404Css.includes("op404-visor-breath"),
        "OPERACIÓN 404 combina dossier, visor y arte externo sin sprite procedural prematuro"
    );
    assert(
        shop.includes("characterImageId(")
            && shop.includes('"colinas"')
            && shop.includes("drawVendedorLoading")
            && !/function\s+drawVendedor\s*\(/.test(shop)
            && story.includes("character.desire.full")
            && story.includes("character.davinchi.full"),
        "Sala VIP y cinemática consumen retratos correctos sin fallback procedural"
    );
    assert(
        turno.includes("const TEAM")
            && turno.includes("const THREATS")
            && turno.includes("const CAMERAS")
            && turno.includes("audio.turno404-horror")
            && turno.includes("audio.turno404-scream")
            && turno.includes("HORROR_ENTRY_MINUTES")
            && turno.includes("_playManguanguaScream")
            && turno.includes("music: null")
            && turno.includes("A.assets.preload"),
        "TURNO 404 conserva cámaras, energía, cierre, registros y audio de 04:00/Manguangua"
    );
}

function validateTurno404Campaign() {
    const turno = read("js/games/turno404.js");
    const turnoCss = read("css/games/turno404.css");
    const audio = read("js/core/audio.js");
    const campaignIds = ["canal-rojo", "archivo-vivo", "ultima-hora"];
    const scenes = ["anomaly", "outage", "dossier", "apparition", "lockdown"];
    const cast = ["desire", "davinchi", "rog", "sil", "colinas"];

    assert(
        turno.includes("const OPENING_CINEMATIC = [")
            && scenes.every((id) => turno.includes(`id: "${id}"`))
            && turno.includes("03:14 AM // CENTRO DE SOPORTE")
            && turno.includes("Manguangua es una máscara de archivo")
            && turno.includes("_startCinematic()")
            && turno.includes("advanceCinematic()")
            && turno.includes("_prepareLevel(0, null, false)"),
        "TURNO 404 abre con la cinemática ficticia de las 03:14 y reserva la guardia para las 03:18"
    );
    assert(
        turno.includes("const OFFICE_TUTORIAL = [")
            && ["camaras", "alarmas", "cuidado", "oscuridad"].every((id) => turno.includes(`id: "${id}"`))
            && turno.includes("_startTutorial()")
            && turno.includes("advanceTutorial()")
            && turno.includes("skipTutorial()")
            && turno.includes('data-role="tutorial"')
            && turno.includes('data-control="tutorial-next"')
            && turnoCss.includes("turno404__tutorial")
            && turnoCss.includes("turno404.is-tutorial-open"),
        "TURNO 404 intercala una guía manual del equipo antes de la primera guardia"
    );
    assert(
        turno.includes("const TURNO_DIFFICULTIES")
            && turno.includes("openDifficultySelection()")
            && turno.includes("selectDifficulty(id)")
            && turno.includes("_levelDuration")
            && turno.includes("_responseWindow")
            && turno.includes('data-turno-difficulty')
            && turnoCss.includes("turno404__difficulty")
            && turnoCss.includes("turno404.is-compact"),
        "TURNO 404 muestra protocolos Fácil/Normal/Difícil antes de la cinemática y escala reloj, reacción y tamaño"
    );
    assert(
        turno.includes("_updatePsychologicalHorror(dt)")
            && turno.includes("psychologicalKind")
            && turno.includes("no cambian reloj, energía, pánico")
            && turnoCss.includes("turno404__power-cut")
            && turnoCss.includes("is-psychological-cut")
            && turnoCss.includes("is-psychological-flicker")
            && turnoCss.includes("prefers-reduced-motion"),
        "TURNO 404 reserva parpadeos y cortes de luz psicológicos como efectos visuales no punitivos"
    );
    assert(
        turno.includes("_warmAssets(ids)")
            && turno.includes("_primeDifficultyAssets()")
            && turno.includes("_viewInterval()")
            && turno.includes("decoding=\"async\"")
            && turnoCss.includes("contain: layout paint")
            && turnoCss.includes("turno404__noise"),
        "TURNO 404 anticipa arte crítico y limita composición/repintado de la oficina"
    );
    assert(
        turno.includes("getBoundingClientRect")
            && turno.includes('"is-short"')
            && turno.includes('"is-micro"')
            && turnoCss.includes("turno404.is-short")
            && turnoCss.includes("turno404.is-micro")
            && turnoCss.includes("min-height: 0"),
        "TURNO 404 mide el escenario real y elimina mínimos rígidos en composición baja"
    );
    assert(
        turno.includes("SENSOR DE PUERTA // FALLA INTERMITENTE")
            && turno.includes("AUTENTICACIÓN // FIRMA Y CANAL REAL")
            && turno.includes('data-role=\"client-terminal-evidence\"')
            && turno.includes("clientTerminalEvidence")
            && turnoCss.includes("turno404__client-terminal-evidence"),
        "los casos de clientes incluyen una lectura técnica científica, visible y contextual"
    );

    assert(
        turno.includes("const TURNOS = [")
            && campaignIds.every((id) => turno.includes(`id: "${id}"`))
            && turno.includes("03:18 — 04:00 AM")
            && turno.includes("04:00 — 05:00 AM")
            && turno.includes("05:00 — 06:00 AM")
            && turno.includes("_prepareLevel(index, bridge, startImmediately = false)")
            && turno.includes("_completeLevel()")
            && turno.includes("levelElapsed")
            && turno.includes("const NIGHT_COUNT = 3")
            && turno.includes("FINAL_CLOCK_STEPS")
            && turno.includes("_closeNight"),
        "TURNO 404 enlaza tres sectores por tres noches y escala el reloj antes de las seis"
    );
    assert(
        cast.every((member) => turno.includes(`member: "${member}"`))
            && turno.includes('const cinematicOrder = ["desire", "davinchi", "rog", "colinas", "sil"]')
            && turno.includes("turno404__transcript")
            && turno.includes("_appendTranscript")
            && turno.includes("turno404__story"),
        "TURNO 404 integra al elenco en el orden solicitado, transcript e interludios jugables"
    );
    assert(
        turno.includes("data-control=\"signal\"")
            && turno.includes("cutSignal()")
            && turno.includes("callActive")
            && turno.includes("callResolved"),
        "TURNO 404 convierte cada llamada hostil en una decisión de juego"
    );
    assert(
        turno.includes("data-control=\"vent\"")
            && turno.includes("_updateVent(dt)")
            && turno.includes("dischargeVent()")
            && turno.includes("ventActive")
            && turno.includes("ventResolved")
            && turno.includes('key === "v" || key === "V"'),
        "TURNO 404 integra alertas de ducto, tecla V, éxito y penalización por omisión"
    );
    assert(
        ["ducto", "ventana", "archivo"].every((id) => turno.includes(`id: "${id}"`))
            && turno.includes("_triggerBreach")
            && turno.includes("_resolveBreach")
            && turno.includes("CUSTOMER_MESSAGES")
            && turno.includes("_clientChoices")
            && turno.includes("openClientTerminal")
            && turno.includes('data-role="client-terminal"')
            && turno.includes('data-client-choice="${choice.id}"')
            && turno.includes('key === "q" || key === "Q"')
            && turnoCss.includes("turno404__window-threat")
            && turnoCss.includes("turno404__control--client.is-alert")
            && turnoCss.includes("turno404__client-terminal"),
        "Manguangua cambia entre ducto, vidrio y archivo mientras los clientes avisan y abren respuestas contextuales"
    );
    assert(
        turno.includes("CAPRILES_REVEAL_MS")
            && turno.includes('this.phase = "revealing"')
            && turno.includes("_playManguanguaScream")
            && turno.includes('"audio.turno404-scream"')
            && turno.includes("_lossNarrative(reason, kind)")
            && turno.includes("MANGUANGUA CRUZÓ LA PUERTA")
            && audio.includes("caprilesScream: () =>"),
        "el Manguangua tiene grito entregado, fallback seguro, revelación facial y derrota contextual"
    );
    assert(
        audio.includes("manguanguaWhisper: () =>")
            && turnoCss.includes("turno404__cinematic")
            && turnoCss.includes("turno404__ceiling-vent")
            && turnoCss.includes("turno404__control--vent.is-alert")
            && turnoCss.includes("turno404__capriles-reveal")
            && turnoCss.includes("object-position: 50% 19%"),
        "TURNO 404 presenta lluvia/CRT, ducto urgente y el primer plano de derrota"
    );
}

function validateReadingAndResponsiveExperience() {
    const index = read("index.html");
    const shell = read("js/core/game-shell.js");
    const story = read("js/core/story.js");
    const intro = read("js/games/op404/intro.js");
    const op404 = read("js/games/op404/game.js");
    const invaders = read("js/games/invaders.js");
    const shop = read("js/games/op404/shop.js");
    const turno = read("js/games/turno404.js");
    const tetris = read("js/games/tetris.js");
    const vipCentral = read("js/core/vip-central.js");
    const utilities = read("js/core/utils.js");
    const gameCss = read("css/screens/game.css");
    const touchCss = read("css/components/touch.css");
    const hubCss = read("css/screens/hub.css");
    const cardCss = read("css/cards/card.css");
    const shellCss = read("css/layout/shell.css");
    const turnoCss = read("css/games/turno404.css");

    assert(
        index.includes("viewport-fit=cover")
            && index.includes("interactive-widget=resizes-content")
            && index.includes("mobile-web-app-capable")
            && index.includes("apple-mobile-web-app-capable")
            && shell.includes("visualViewport")
            && shell.includes("orientationchange")
            && shell.includes("--game-viewport-height")
            && shell.includes("setPointerCapture")
            && utilities.includes("any-pointer: coarse")
            && gameCss.includes("env(safe-area-inset-top)")
            && gameCss.includes("orientation: landscape")
            && shellCss.includes("safe-area-inset-left")
            && touchCss.includes("touch-action: none")
            && touchCss.includes("max-height: 620px")
            && hubCss.includes("max-height: 540px")
            && cardCss.includes("orientation: landscape")
            && tetris.includes('mode: "dpad-fire"')
            && tetris.includes('actionLabel: "DROP"')
            && turnoCss.includes("min-height: 44px"),
        "la interfaz mide el viewport real, refina móvil vertical/horizontal y conserva controles táctiles en teléfono, tableta y escritorio"
    );

    assert(
        shell.includes("_bindAnalogStick")
            && shell.includes("_directionForAnalog")
            && shell.includes("onMove")
            && shell.includes("aria-keyshortcuts")
            && shell.includes("utils.isTouchDevice()")
            && !shell.includes("utils.isTouchDevice() || window.innerWidth <= 900")
            && touchCss.includes(".touch-stick")
            && touchCss.includes(".touch-btn__kicker")
            && !touchCss.includes(".touch-dpad")
            && gameCss.includes("dock compacto continúa EN FLUJO")
            && gameCss.includes("position: static")
            && op404.includes("this.touchMotion")
            && op404.includes("onMove: (move)")
            && invaders.includes("analogDirections: [\"left\", \"right\"]")
            && invaders.includes("Number.POSITIVE_INFINITY")
            && tetris.includes('actionLabel: "DROP"'),
        "el shell comparte joystick radial normalizado, FIRE/PAUSE compacto y un dock que no cubre el canvas"
    );

    assert(
        tetris.includes('A.ui.switcher("tetrismode"')
            && tetris.includes('{ value: "arena", label: "ARENA" }')
            && tetris.includes('{ value: "classic", label: "CLÁSICO" }')
            && tetris.includes("resetClassic()")
            && tetris.includes("classicBoard")
            && tetris.includes("CLASSIC_LINE_SCORES")
            && tetris.includes("SAND_HZ_ECO")
            && tetris.includes("refreshTopRow()")
            && tetris.includes("clearList")
            && tetris.includes("maxDpr: 1.5"),
        "STACK permite elegir Tetris clásico o arena y acota física, limpieza y píxeles en hardware limitado"
    );

    assert(
        turno.includes("preview--turno404")
            && turnoCss.includes(".preview--turno404")
            && turnoCss.includes("width: 100%")
            && turnoCss.includes("height: 100%")
            && turnoCss.includes("turno-preview-sweep")
            && turnoCss.includes("turno-preview-figure")
            && turnoCss.includes("turno-preview-monitor"),
        "la tarjeta de TURNO 404 llena su visor y anima pasillo, silueta, monitor y barrido de alarma"
    );

    assert(
        story.includes("this.elapsed = Math.min(duration, this.elapsed + delta)")
            && !story.includes("if (this.elapsed >= this.durations[this.index])")
            && intro.includes("this.elapsed = Math.min(duration, this.elapsed + delta)")
            && !intro.includes("if (this.elapsed >= this.durations[this.index])")
            && shell.includes("stage-narrative-control")
            && shell.includes("setNarrativeControl(config)")
            && shell.includes("handleStoryKey(key, event)")
            && vipCentral.includes('key === "Spacebar"'),
        "el hilo global, OP404 y la Sala VIP esperan ESPACIO/tocar en vez de avanzar escenas automáticamente"
    );

    assert(
        shell.includes("stage-narrative-control__cue")
            && gameCss.includes("top: 42px")
            && gameCss.includes("background: rgb(4 12 27 / 0.52)")
            && !gameCss.includes("bottom: 13px"),
        "el control de continuar se convierte en una señal superior ligera y deja libre la caja de diálogo"
    );

    assert(
        op404.includes("dismissTransmission()")
            && op404.includes('blocking: kind !== "clear"')
            && op404.includes("syncNarrativeControl()")
            && op404.includes("advanceAllyDialogue()")
            && !op404.includes("this.transmission.timer -= dt")
            && !op404.includes("ally.stepTimer")
            && shop.includes("advanceIntro()")
            && !shop.includes("introTimer")
            && turno.includes("MANUAL_NARRATIVE_ADVANCE")
            && !turno.includes("cinematicTimer")
            && !turno.includes("interludeTimer")
            && !turno.includes("AUTOENLACE"),
        "las transmisiones y aliados de OP404, la bienvenida VIP y los relevos de TURNO 404 conservan lectura manual"
    );
}

function validateOp404Refinements() {
    const op404 = read("js/games/op404/game.js");
    const maps = read("js/games/op404/maps.js");
    const shop = read("js/games/op404/shop.js");
    const sprites = read("js/games/op404/sprites.js");
    const assets = read("js/core/assets.js");

    assert(
        op404.includes("const LOOT_WINDOW_MS = 5000")
            && op404.includes('this.phase = "loot"')
            && op404.includes("this.updatePlayer(lootDt)")
            && op404.includes("this.updatePickups(lootDt)")
            && op404.includes("this.updateParticles(lootDt)")
            && op404.includes("this.clearLevel();")
            && op404.includes("this.phase !== \"run\" && this.phase !== \"loot\""),
        "OPERACIÓN 404 abre 5000 ms de botín con movimiento y sin combate"
    );
    assert(
        op404.includes("finishLootWindow()")
            && op404.includes("lootTransitioning")
            && op404.includes("this.shots = []")
            && op404.includes('if (this.phase !== "run") {')
            && op404.includes("this.finishLootWindow();"),
        "OPERACIÓN 404 abandona el bucle de proyectiles al abrir botín y cierra la transición una sola vez"
    );
    assert(
        op404.includes("const DIFFICULTIES")
            && op404.includes('"op404:difficulty"')
            && op404.includes("A.ui.switcher(")
            && op404.includes("this.tuning.hp")
            && op404.includes("this.tuning.speed")
            && op404.includes("this.enemyDamage(")
            && op404.includes("this.tuning.money")
            && op404.includes("checkpointHealth")
            && op404.includes("recoveryDropBonus()")
            && op404.includes("itemDropChance")
            && op404.includes("restoreFieldCheckpoint()")
            && !op404.includes("settings.difficulty"),
        "OPERACIÓN 404 ofrece dificultad propia, drops y checkpoint justo sin alterar Chess"
    );
    assert(
        op404.includes("riflepulso")
            && op404.includes("criopasticho")
            && op404.includes("rebotador")
            && op404.includes("celdas")
            && op404.includes("pierce")
            && op404.includes("bounces")
            && op404.includes("combatDt")
            && sprites.includes("function pulso()")
            && sprites.includes("function crio()")
            && sprites.includes("function rebote()")
            && sprites.includes("function companionMini"),
        "OPERACIÓN 404 añade arsenal de pulso, área lenta, rebotes y sprites para Companion de mundo"
    );
    assert(
        op404.includes("MAX_TRACERS")
            && op404.includes("MAX_IMPACT_BURSTS")
            && op404.includes("spawnHitSpark")
            && op404.includes("spawnAoEVisual")
            && op404.includes("drawNeonTracer")
            && op404.includes("drawPixelImpact")
            && op404.includes("drawAoEBurst")
            && op404.includes("drawCombatVfx();")
            && op404.includes("muzzleFlash")
            && op404.includes("Fogonazo animado"),
        "OPERACIÓN 404 proyecta hitsparks pixel-art, trazadoras neón, fogonazo animado y AoE con límites de rendimiento"
    );
    assert(
        op404.includes('const WALL_CHARS = "#%&v"')
            && op404.includes('const SOLID_CHARS = "#%&vxot"')
            && op404.includes("projectilePathBlocked")
            && op404.includes("this.blocksProjectile")
            && op404.includes("shieldRatio()")
            && op404.includes("absorbShieldDamage")
            && op404.includes("const MAX_SHIELD = 100")
            && op404.includes("shieldMax")
            && op404.includes("ESCUDO")
            && op404.includes("externalArtwork")
            && op404.includes("imageSmoothingQuality")
            && shop.includes('id: "recargaEscudo"')
            && shop.includes('kind: "shield"')
            && maps.includes("const shieldCover")
            && maps.includes('grid[y][x] = "v"')
            && sprites.includes("escudo: () => makeTex"),
        "OPERACIÓN 404 usa cobertura, blindaje persistente recargable y PNG externos sin deformación"
    );
    assert(
        op404.includes("configureVipCompanion")
            && op404.includes("updateVirtualCompanion")
            && op404.includes("companionPickupTarget")
            && op404.includes("¡EMBOSCADA!")
            && op404.includes("¡JEFE ABAJO!")
            && op404.includes("this.art.companions"),
        "el Companion sigue, recoge, alerta emboscadas y reacciona a jefe dentro del raycaster"
    );
    assert(
        op404.includes("SIL_SECRET_CHANCE")
            && op404.includes("SIL_VIP_STASH")
            && op404.includes('sil: { idle: "character.sil.full" }')
            && sprites.includes("function sil(frame = 0)")
            && sprites.includes("sil: [sil(0), sil(1)]")
            && assets.includes('"character.sil.full": { x: 538, y: 89, width: 562, height: 829 }'),
        "Sil aparece como contacto secreto con PNG recortado, fallback y fondo para la Sala VIP"
    );
    assert(
        shop.includes("const HAGGLE_MAX_ATTEMPTS = 5")
            && shop.includes("const HAGGLE_GIFT_CHANCE = 0.20")
            && shop.includes("pointer(x, y)")
            && shop.includes("askDiscount(reason)")
            && shop.includes("this.askDiscount(\"saldo insuficiente")
            && shop.includes("this.askDiscount(\"interacción con el Sr. de las Colinas")
            && op404.includes('canvas.addEventListener("touchstart"')
            && op404.includes("this.shop.pointer(x, y)")
            && op404.includes('this.shop.askDiscount("pedido de descuento")')
            && shop.includes("game.haggleAttempts = HAGGLE_MAX_ATTEMPTS")
            && shop.includes("game.haggleAttempts -= 1")
            && shop.includes("const giftStart = 1 - HAGGLE_GIFT_CHANCE")
            && shop.includes('kind: "insurance"')
            && shop.includes('kind: "money"')
            && shop.includes("lastMerchantExpression")
            && shop.includes("Jaja, come ahi tremendo pobre")
            && !shop.includes("HAGGLE_BUTTON")
            && !shop.includes("drawHaggle")
            && !shop.includes("5 INTENTOS")
            && !/HAGGLE_SPIN|HAGGLE_WHEEL|haggleSpin/.test(shop)
            && !op404.includes("haggleAttempts: this.haggleAttempts")
            && !shop.includes("limosnaChance")
            && !/\bbeg\s*\(/.test(shop),
        "Sala VIP conserva cinco márgenes y 20% de regalo, activados implícitamente sin contador ni botón"
    );
}

function validateOp404Campaign() {
    const A = { op404: {} };
    let levels = [];
    let dossier = {};
    let spawnTable = {};

    try {
        vm.runInNewContext(read("js/games/op404/maps.js"), {
            window: { Arcade404: A }
        }, { filename: "js/games/op404/maps.js" });
        levels = A.op404.LEVELS || [];
        dossier = A.op404.DOSSIER || {};
        spawnTable = A.op404.ENEMY_SPAWN_TABLE || {};
    } catch (error) {
        fail("mapas de OPERACIÓN 404 se pueden evaluar: " + error.message);
        return;
    }

    const expectedBosses = [
        "supervisor", "jefeBarrio", "maduro",
        "chavez", "manguangua", "srm"
    ];
    const solidMapChars = new Set(["#", "%", "&", "v", "x", "o", "t"]);
    const enemyMapChars = new Set(["C", "U", "M", "G", "T", "R", "K"]);
    const expectedSpawnPools = {
        soporte: "UC", torre: "UGR", barrio: "MTK", plaza: "MTK",
        archivo: "CGR", palacio: "CGR", control: "CGR", pdvsa: "CGR",
        avenida: "MTK", casa: "UMTK", antesala: "UGRMTK", comedor: "CUGRMTK"
    };
    const zoneSpawnIntegrity = levels.every((level) => {
        const zone = spawnTable[level.id];
        const pool = Array.isArray(level.enemyPool) ? level.enemyPool : [];

        return zone && zone.world === level.world && zone.theme &&
            pool.join("") === expectedSpawnPools[level.id] &&
            level.map.join("").split("").every((cell) =>
                !enemyMapChars.has(cell) || pool.includes(cell)
            );
    });
    const supportEnemyTiles = levels.find((level) => level.id === "soporte");
    const supportStartsClean = supportEnemyTiles &&
        [...supportEnemyTiles.map.join("")]
            .filter((cell) => enemyMapChars.has(cell))
            .every((cell) => cell === "C" || cell === "U");
    const allWingsDressed = levels.every((level) => {
        let props = 0;
        level.map.forEach((row, y) => row.split("").forEach((cell, x) => {
            if ("xot".includes(cell) && (x < 5 || x >= 29 || y < 4 || y >= 28)) {
                props += 1;
            }
        }));
        return props >= 3;
    });
    const allWingsCovered = levels.every((level) => {
        const cover = [];
        level.map.forEach((row, y) => row.split("").forEach((cell, x) => {
            if (cell === "v") {
                cover.push([x, y]);
            }
        }));
        return cover.length >= 2 && cover.every(([x, y]) =>
            x < 5 || x >= 29 || y < 4 || y >= 28
        );
    });
    const allTargetsReachable = (level) => {
        const spawn = [];
        const visited = new Set();
        const queue = [];

        level.map.forEach((row, y) => row.split("").forEach((cell, x) => {
            if (cell === "P") {
                spawn.push([x, y]);
                queue.push([x, y]);
                visited.add(`${x},${y}`);
            }
        }));

        while (queue.length) {
            const [x, y] = queue.shift();
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                const nx = x + dx;
                const ny = y + dy;
                const key = `${nx},${ny}`;
                const row = level.map[ny];

                if (row && nx >= 0 && nx < row.length &&
                    !solidMapChars.has(row[nx]) && !visited.has(key)) {
                    visited.add(key);
                    queue.push([nx, ny]);
                }
            });
        }

        return spawn.length === 1 && level.map.every((row, y) =>
            row.split("").every((cell, x) =>
                cell === "." || cell === "P" || solidMapChars.has(cell) ||
                visited.has(`${x},${y}`)
            )
        );
    };
    const mapShape = levels.every((level) =>
        Array.isArray(level.map) && level.map.length === 32 &&
        level.map.every((row) => typeof row === "string" && row.length === 34) &&
        level.map.join("").split("P").length === 2 &&
        level.expanded === true &&
        [
            ...level.map[0], ...level.map[level.map.length - 1],
            ...level.map.map((row) => row[0]),
            ...level.map.map((row) => row[row.length - 1])
        ].every((cell) => solidMapChars.has(cell))
    );
    const hasExplorableWings = levels.every((level) => {
        const passable = (cell) => !solidMapChars.has(cell);
        const map = level.map;
        const wings = [
            map.flatMap((row, y) => row.split("").map((cell, x) => [x, y, cell])).filter(([x, y, cell]) => x < 5 && passable(cell)),
            map.flatMap((row, y) => row.split("").map((cell, x) => [x, y, cell])).filter(([x, y, cell]) => x >= 29 && passable(cell)),
            map.flatMap((row, y) => row.split("").map((cell, x) => [x, y, cell])).filter(([x, y, cell]) => y < 4 && passable(cell)),
            map.flatMap((row, y) => row.split("").map((cell, x) => [x, y, cell])).filter(([x, y, cell]) => y >= 28 && passable(cell))
        ];
        return wings.every((wing) => wing.length > 12);
    });
    const cadence = levels.every((level, index) => {
        const bossSlot = index % 2 === 1;
        const hasBossMark = level.map.join("").includes("B");
        const expectedStage = `${Math.floor(index / 2) + 1}-${bossSlot ? 2 : 1}`;

        return Boolean(level.boss) === bossSlot &&
            hasBossMark === bossSlot &&
            level.stage === expectedStage;
    });
    const bosses = levels
        .filter((level) => level.boss)
        .map((level) => level.boss);
    const validVoices = new Set(["rog", "sil", "desire", "davinchi", "colinas"]);
    const dossierCoverage = Object.keys(dossier).length === levels.length &&
        levels.every((level) => {
            const entry = dossier[level.id];

            return entry && validVoices.has(entry.speaker) &&
                typeof entry.objective === "string" && entry.objective.length > 8 &&
                Array.isArray(entry.lines) && entry.lines.length >= 2;
        });
    const bossDebriefs = levels
        .filter((level) => level.boss)
        .every((level) => {
            const clear = dossier[level.id] && dossier[level.id].clear;

            return clear && validVoices.has(clear.speaker) &&
                Array.isArray(clear.lines) && clear.lines.length >= 2;
        });

    assert(
        levels.length === 12 && mapShape && hasExplorableWings && allWingsCovered &&
            levels.every(allTargetsReachable) &&
            levels.some((level) => level.id === "archivo") &&
            levels.some((level) => level.id === "antesala") &&
            levels.slice(1).every((level) => /[567]/.test(level.map.join(""))),
        "OPERACIÓN 404 amplía los 12 mapas con alas explorables, cobertura y rutas/prototipos transitables"
    );
    assert(
        zoneSpawnIntegrity && supportStartsClean && allWingsDressed,
        "OPERACIÓN 404 filtra spawns por mundo/zona, protege el inicio y viste las alas sin cerrar rutas"
    );
    assert(
        cadence && bosses.join("|") === expectedBosses.join("|"),
        "OPERACIÓN 404 presenta exactamente un jefe existente cada dos niveles"
    );
    assert(
        dossierCoverage && bossDebriefs,
        "las 12 zonas tienen dossier contextual y los seis jefes entregan una pista de salida"
    );
}

function validateCharacterIdentity() {
    const assets = read("js/core/assets.js");
    const index = read("index.html");
    const story = read("js/core/story.js");
    const readme = read("README.md");
    const turno = read("js/games/turno404.js");
    const publicText = [assets, index, story, readme, turno].join("\n");

    const formerFirstName = ["A", "lex", "a"].join("");
    const formerSecondName = ["Le", "ón"].join("");
    const formerUpperSecondName = formerSecondName.toUpperCase();
    const publicAliases = new RegExp(
        `\\b${formerFirstName}\\b|\\b${formerSecondName}\\b|\\b${formerUpperSecondName}\\b`,
        "i"
    );

    assert(
        assets.includes('name: "DESIRE"')
            && assets.includes('name: "DAVINCHI"')
            && !assets.includes(`name: "${formerFirstName.toUpperCase()}"`)
            && !assets.includes(`name: "${formerUpperSecondName}"`)
            && !publicAliases.test(publicText),
        "Desire y Davinchi son las identidades visibles definitivas"
    );
}

function validateGameRegistry() {
    const gamesDirectory = path.join(ROOT, "js", "games");
    const source = walk(gamesDirectory)
        .filter((file) => file.endsWith(".js"))
        .map((file) => fs.readFileSync(file, "utf8"))
        .join("\n");
    const registered = new Set(
        Array.from(source.matchAll(/A\.registerGame\(\{\s*id:\s*["']([^"']+)["']/g))
            .map((match) => match[1])
    );

    const missing = EXPECTED_GAMES.filter((id) => !registered.has(id));

    assert(!missing.length,
        `juegos esperados registrados: ${EXPECTED_GAMES.length}${missing.length ? `; faltan ${missing.join(", ")}` : ""}`);
    assert(registered.size === EXPECTED_GAMES.length,
        `registro completo: ${registered.size} juegos`);
}

function validateJavaScript() {
    const files = ["js", "tools"]
        .flatMap((directory) => walk(path.join(ROOT, directory)))
        .filter((file) => file.endsWith(".js"))
        .sort();
    let allValid = true;

    files.forEach((file) => {
        const result = spawnSync(process.execPath, ["--check", file], {
            encoding: "utf8"
        });

        if (result.status !== 0) {
            allValid = false;
            fail(path.relative(ROOT, file) + " no pasa node --check\n" + result.stderr.trim());
        }
    });

    if (allValid) {
        pass(`sintaxis válida en ${files.length} archivos JavaScript de js/ y tools/`);
    }
}

console.log("\nARCADE 404 · verificación estática\n");
validateIndexResources();
validateHomeExperience();
validateHubExperience();
validateVipCentral();
validateCssImports();
validateManifest();
validateAssetConsumers();
validateTurno404Campaign();
validateReadingAndResponsiveExperience();
validateOp404Refinements();
validateOp404Campaign();
validateCharacterIdentity();
validateGameRegistry();
validateJavaScript();

if (failures) {
    console.error(`\n${failures} comprobación(es) fallaron.`);
    process.exitCode = 1;
} else {
    console.log("\nTodo listo: estructura, assets, registro y sintaxis son consistentes.");
}
