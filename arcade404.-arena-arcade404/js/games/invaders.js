/* =========================================================
   ARCADE 404 — GAME 02 · INVADERS
   Oleadas infinitas, 3 dificultades y power-ups:
   DISPARO TRIPLE · BARRERA · CONGELAR · BOMBA · VIDA
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       CONSTANTES
       --------------------------------------------------------- */

    const BASE_H = 700;

    const PIXEL = 3;

    let COLS = 10;

    let CELL_W = 46;
    const CELL_H = 40;

    let GRID_X = 20;        /* se recalcula en measure() */
    const GRID_Y = 110;

    let PLAYER_Y = 638;      /* se recalcula en measure() */
    const PLAYER_SPEED = 340;

    const BULLET_SPEED = 620;
    const ENEMY_BULLET_SPEED = 260;

    const BUNKER_BLOCK = 6;

    /* Jefe */
    const BOSS_W = 108;
    const BOSS_H = 100;
    const BOSS_SPEED = 95;
    const BOSS_Y = 158;
    let BUNKER_Y = 550;      /* se recalcula en measure() */

    const DIFFICULTY = {
        calm:   { march: 1.25, fire: 1.35, label: "CALM" },
        normal: { march: 1.00, fire: 1.00, label: "NORMAL" },
        fury:   { march: 0.78, fire: 0.70, label: "FURY" }
    };


    const POWERUPS = {

        S: { label: "S", name: "TRIPLE",  color: "#22D3EE" },
        B: { label: "B", name: "BARRERA", color: "#8B5CF6" },
        F: { label: "F", name: "CONGELA", color: "#A3E635" },
        X: { label: "X", name: "BOMBA",   color: "#FBBF24" },
        L: { label: "+", name: "VIDA",    color: "#F43F5E" }

    };

    const POWERUP_KEYS = Object.keys(POWERUPS);
    const DROP_CHANCE = 0.14;


    const SPRITES = {

        squid: [
            [
                "..X.....X..",
                "...X...X...",
                "..XXXXXXX..",
                ".XX.XXX.XX.",
                "XXXXXXXXXXX",
                "X.XXXXXXX.X",
                "X.X.....X.X",
                "...XX.XX..."
            ],
            [
                "..X.....X..",
                "X..X...X..X",
                "X.XXXXXXX.X",
                "XXX.XXX.XXX",
                "XXXXXXXXXXX",
                ".XXXXXXXXX.",
                "..X.....X..",
                ".X.......X."
            ]
        ],

        crab: [
            [
                "...XXXXX...",
                ".XXXXXXXXX.",
                "XXXXXXXXXXX",
                "XX.XXXXX.XX",
                "XXXXXXXXXXX",
                "...XX.XX...",
                "..XX...XX..",
                ".XX.....XX."
            ],
            [
                "...XXXXX...",
                ".XXXXXXXXX.",
                "XXXXXXXXXXX",
                "XX.XXXXX.XX",
                "XXXXXXXXXXX",
                "..XX...XX..",
                ".XX.....XX.",
                "XX.......XX"
            ]
        ],

        skull: [
            [
                "..XXXXXXX..",
                ".XXXXXXXXX.",
                "XXXXXXXXXXX",
                "XXX..X..XXX",
                "XXXXXXXXXXX",
                "..XX...XX..",
                ".XX.....XX.",
                "X.........X"
            ],
            [
                "..XXXXXXX..",
                ".XXXXXXXXX.",
                "XXXXXXXXXXX",
                "XXX..X..XXX",
                "XXXXXXXXXXX",
                "...XX.XX...",
                "..XX...XX..",
                "XX.......XX"
            ]
        ],

        /* ---- JEFES: uno por mundo, 22x14 ----
           Antes los tres mundos reutilizaban el sprite del gordo,
           así que no había forma de distinguirlos. */

        /* ÓRBITA — nave nodriza clásica con cúpula y pinzas */
        bossNodriza: [
            [
                "......XXXXXXXXXX......",
                "....XXXXXXXXXXXXXX....",
                "..XXXXXXXXXXXXXXXXXX..",
                ".XXXXXX..XXXX..XXXXXX.",
                "XXXXXX....XX....XXXXXX",
                "XXXXXXXXXXXXXXXXXXXXXX",
                "XX.XXXXXXXXXXXXXXXX.XX",
                "X...XXXXXXXXXXXXXX...X",
                "X....XXXXXXXXXXXX....X",
                ".X....XXXXXXXXXX....X.",
                "..XX...XXXXXXXX...XX..",
                "...XX...XX..XX...XX...",
                "..XX.....X..X.....XX..",
                ".XX......X..X......XX."
            ],
            [
                "......XXXXXXXXXX......",
                "....XXXXXXXXXXXXXX....",
                "..XXXXXXXXXXXXXXXXXX..",
                ".XXXXXX..XXXX..XXXXXX.",
                "XXXXXX....XX....XXXXXX",
                "XXXXXXXXXXXXXXXXXXXXXX",
                "XX.XXXXXXXXXXXXXXXX.XX",
                "X...XXXXXXXXXXXXXX...X",
                "X....XXXXXXXXXXXX....X",
                ".X....XXXXXXXXXX....X.",
                "..XX...XXXXXXXX...XX..",
                "...XX..XXX..XXX..XX...",
                "..XX....X....X....XX..",
                ".XX.....X....X.....XX."
            ]
        ],

        /* NEBULOSA — cerebro flotante con tentáculos */
        bossCerebro: [
            [
                "....XX.XXXXXX.XX....",
                "..XXXXXXXXXXXXXXXX..",
                ".XX.XXX.XXXX.XXX.XX.",
                "XXXXXXXXXXXXXXXXXXXX",
                "XX.XXXX.XXXX.XXXX.XX",
                "XXXXXXXXXXXXXXXXXXXX",
                "XXX..XXXXXXXXXX..XXX",
                "XX....XXXXXXXX....XX",
                ".X..XX..XXXX..XX..X.",
                "....X....XX....X....",
                "...X....X..X....X...",
                "..X....X....X....X..",
                ".X....X......X....X.",
                "X....X........X....X"
            ],
            [
                "....XX.XXXXXX.XX....",
                "..XXXXXXXXXXXXXXXX..",
                ".XX.XXX.XXXX.XXX.XX.",
                "XXXXXXXXXXXXXXXXXXXX",
                "XX.XXXX.XXXX.XXXX.XX",
                "XXXXXXXXXXXXXXXXXXXX",
                "XXX..XXXXXXXXXX..XXX",
                "XX....XXXXXXXX....XX",
                ".X..XX..XXXX..XX..X.",
                "....X....XX....X....",
                "...X.....XX.....X...",
                "..X.....X..X.....X..",
                ".X.....X....X.....X.",
                "X.....X......X.....X"
            ]
        ],

        /* CIUDADELA — fortaleza acorazada con cañones */
        bossFortaleza: [
            [
                "XX................XX",
                "XX.XXXXXXXXXXXXXX.XX",
                "XXXXXXXXXXXXXXXXXXXX",
                "XXXX..XXXXXXXX..XXXX",
                "XXX....XXXXXX....XXX",
                "XXXXXX.XXXXXX.XXXXXX",
                "XXXXXXXXXXXXXXXXXXXX",
                "X.XXXXXXXXXXXXXXXX.X",
                "X.XX.XXXXXXXXXX.XX.X",
                "X.XX..XXXXXXXX..XX.X",
                "XXXX...XXXXXX...XXXX",
                ".XXXXX........XXXXX.",
                "..XXX..XX..XX..XXX..",
                "...X...XX..XX...X..."
            ],
            [
                "XX................XX",
                "XX.XXXXXXXXXXXXXX.XX",
                "XXXXXXXXXXXXXXXXXXXX",
                "XXXX..XXXXXXXX..XXXX",
                "XXX....XXXXXX....XXX",
                "XXXXXX.XXXXXX.XXXXXX",
                "XXXXXXXXXXXXXXXXXXXX",
                "X.XXXXXXXXXXXXXXXX.X",
                "X.XX.XXXXXXXXXX.XX.X",
                "X.XX..XXXXXXXX..XX.X",
                "XXXX...XXXXXX...XXXX",
                ".XXXXX........XXXXX.",
                "..XXX...XXXX...XXX..",
                "...X....XXXX....X..."
            ]
        ],

        ship: [
            [
                "......X......",
                ".....XXX.....",
                ".....XXX.....",
                ".XXXXXXXXXXX.",
                "XXXXXXXXXXXXX",
                "XXXXXXXXXXXXX",
                "XXXXXXXXXXXXX",
                "XXXXXXXXXXXXX"
            ]
        ]

    };


    const TYPE_BY_ROW = ["skull", "crab", "crab", "squid", "squid"];
    const VALUE_BY_ROW = [30, 20, 20, 10, 10];


    /* ---------------------------------------------------------
       MUNDOS
       Cada mundo cambia paleta, número de búnkeres, carácter
       de la marcha y cada cuántas oleadas sale el jefe.
       --------------------------------------------------------- */

    const WORLDS = [

        {
            id: "orbita",
            name: "ÓRBITA",
            label: "ÓRBITA",
            bg: "#070A10",
            colors: ["#F43F5E", "#FB923C", "#FBBF24"],
            bunker: "#22D3EE",
            bunkers: 3,
            armor: 1,
            march: 1,
            fire: 1,
            bossEach: 3,
            nebula: null,
            boss: {
                sprite: "bossNodriza",
                name: "NODRIZA",
                color: "#F43F5E",
                /* dispara en abanico amplio */
                spread: 5,
                aimRate: 1,
                speed: 1
            }
        },

        {
            id: "nebulosa",
            name: "NEBULOSA",
            label: "NEBULOSA",
            bg: "#0A0716",
            colors: ["#C084FC", "#8B5CF6", "#22D3EE"],
            bunker: "#A78BFA",
            bunkers: 4,
            armor: 1,
            march: 0.92,
            fire: 1.15,
            bossEach: 3,
            nebula: ["rgba(139, 92, 246, 0.16)", "rgba(34, 211, 238, 0.12)"],
            boss: {
                sprite: "bossCerebro",
                name: "CEREBRO",
                color: "#C084FC",
                /* menos abanico pero apunta más seguido y se mueve rápido */
                spread: 3,
                aimRate: 0.6,
                speed: 1.45
            }
        },

        {
            id: "ciudadela",
            name: "CIUDADELA",
            label: "CIUDADELA",
            bg: "#0C0A06",
            colors: ["#FBBF24", "#F59E0B", "#A3E635"],
            bunker: "#FBBF24",
            bunkers: 2,
            armor: 2,
            march: 1.12,
            fire: 0.85,
            bossEach: 2,
            backdrop: true,
            nebula: ["rgba(251, 191, 36, 0.12)", "rgba(244, 63, 94, 0.08)"],
            boss: {
                sprite: "bossFortaleza",
                name: "FORTALEZA",
                color: "#FBBF24",
                /* lento y aguantador, pero descarga muros de fuego */
                spread: 7,
                aimRate: 1.25,
                speed: 0.7,
                tough: 1.4
            }
        }

    ];


    /* ---------------------------------------------------------
       PATRONES DE FORMACIÓN

       Cada oleada elige uno. Cambian el ritmo de la marcha, cuánto
       bajan al tocar el borde y si la formación se balancea, así
       que dos oleadas seguidas nunca se juegan igual.

         march  — multiplicador del intervalo entre pasos
         step   — píxeles que avanza en horizontal por paso
         drop   — cuánto baja al rebotar en el borde
         sway   — amplitud del vaivén continuo (0 = clásico)
         swayHz — velocidad de ese vaivén
       --------------------------------------------------------- */

    const PATTERNS = [
        {
            id: "clasico",
            label: "FORMACIÓN CERRADA",
            march: 1,
            step: 10,
            drop: 18,
            sway: 0,
            swayHz: 0
        },
        {
            id: "vaiven",
            label: "VAIVÉN",
            march: 1.15,
            step: 7,
            drop: 14,
            sway: 22,
            swayHz: 0.55
        },
        {
            id: "avalancha",
            label: "AVALANCHA",
            march: 0.72,
            step: 13,
            drop: 26,
            sway: 0,
            swayHz: 0
        },
        {
            id: "serpiente",
            label: "SERPIENTE",
            march: 0.95,
            step: 9,
            drop: 12,
            sway: 34,
            swayHz: 0.85
        },
        {
            id: "acecho",
            label: "ACECHO",
            march: 1.5,
            step: 5,
            drop: 34,
            sway: 12,
            swayHz: 0.35
        }
    ];


    /* La primera oleada siempre es la clásica: que el jugador
       aprenda la regla antes de que se la rompan. */
    function patternForWave(wave) {

        if (wave <= 1) {
            return PATTERNS[0];
        }

        return PATTERNS[(wave - 1) % PATTERNS.length];

    }


    const BUNKER_PATTERN = [
        "..XXXXX..",
        ".XXXXXXX.",
        "XXXXXXXXX",
        "XXXXXXXXX",
        "XXX...XXX",
        "XX.....XX",
        "X.......X"
    ];


    function rowsForWave(wave) {
        return wave >= 6 ? 7 : wave >= 3 ? 6 : 5;
    }


    /* ---------------------------------------------------------
       JUEGO
       --------------------------------------------------------- */

    class InvadersGame {

        constructor(shell) {

            this.shell = shell;

            this.W = 620;
            this.H = BASE_H;

            this.stage = A.createStage(shell.refs.stage, {
                width: this.W,
                height: this.H,
                background: "#070A10"
            });

            this.measure();

            this.wave = 1;
            this.score = 0;
            this.lives = 3;

            this.worldId = "orbita";
            this.difficulty = "normal";

            this.resetState();

            this.bindWorld();
            this.bindDifficulty();

            shell.setTouchControls({
                mode: "dpad-fire",
                analogDirections: ["left", "right"],
                analogLabel: "Joystick horizontal para mover la nave.",
                /* INVADERS sólo necesita un eje: la magnitud X del stick se
                   convierte en velocidad lateral proporcional y FIRE queda
                   separado, para que subir el pulgar nunca dispare por error. */
                onMove: (move) => {

                    const x = utils.clamp(Number(move && move.x) || 0, -1, 1);

                    this.touchDir = x;
                    this.touchHoldUntil = x ? Number.POSITIVE_INFINITY : 0;

                },
                onAction: (name) => {

                    if (name === "fire") {
                        this.shoot();
                    }

                }
            });

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        resetState() {

            this.player = {
                x: this.W / 2,
                y: PLAYER_Y,
                dir: 0,
                cooldown: 0
            };

            this.bullets = [];
            this.enemyBullets = [];
            this.particles = [];
            this.powerups = [];

            this.offsetX = 0;
            this.sway = 0;
            this.offsetY = 0;

            this.touchDir = 0;
            this.touchHoldUntil = 0;

            this.frame = 0;
            this.frameTimer = 0;
            this.marchTimer = 0;
            this.shootTimer = 900;
            this.marchDir = 1;
            this.flashTimer = 0;

            /* Patrón de esta oleada */
            this.pattern = patternForWave(this.wave);
            this.swayTime = 0;
            this.sway = 0;

            /* Relevo de oleada pendiente de aplicar */
            this.wavePending = false;

            this.effects = { spread: 0, freeze: 0 };
            this.barrier = 0;

            this.bunkers = this.createBunkers();
            this.invaders = this.createInvaders();

            this.boss = null;

            if (this.wave % this.world.bossEach === 0) {
                this.spawnBoss();
            }

            this.shell.setMeter("boss", this.boss ? 1 : 0);

            /* Avisa del patrón de la oleada (el jefe manda sobre el aviso) */
            if (!this.boss && this.wave > 1) {
                this.shell.setLog("OLEADA " + this.wave + " · " + this.pattern.label);
            }

            this.updateStats();

            this.render();

        }


        /* Desplazamiento horizontal efectivo de la formación:
           la marcha a pasos más el vaivén continuo del patrón. */
        get fleetX() {
            return this.offsetX + (this.sway || 0);
        }


        createInvaders() {

            const invaders = [];

            const rows = rowsForWave(this.wave);

            for (let row = 0; row < rows; row += 1) {

                const type = TYPE_BY_ROW[Math.min(row, TYPE_BY_ROW.length - 1)];
                const value = VALUE_BY_ROW[Math.min(row, VALUE_BY_ROW.length - 1)];

                for (let col = 0; col < COLS; col += 1) {

                    invaders.push({
                        row,
                        col,
                        type,
                        value,
                        alive: true
                    });

                }

            }

            return invaders;

        }


        createBunkers() {

            const total = this.world.bunkers;

            const patternWidth = BUNKER_PATTERN[0].length * BUNKER_BLOCK;
            const spacing = (this.W - patternWidth * total) / (total + 1);

            const bunkers = [];

            for (let i = 0; i < total; i += 1) {

                const originX = spacing + i * (patternWidth + spacing);

                const blocks = [];

                BUNKER_PATTERN.forEach((line, row) => {

                    for (let col = 0; col < line.length; col += 1) {

                        if (line[col] !== "X") {
                            continue;
                        }

                        blocks.push({
                            x: originX + col * BUNKER_BLOCK,
                            y: BUNKER_Y + row * BUNKER_BLOCK,
                            size: BUNKER_BLOCK,
                            hp: this.world.armor
                        });

                    }

                });

                bunkers.push({ blocks });

            }

            return bunkers;

        }


        start() {

            this.wave = 1;
            this.score = 0;
            this.lives = 3;

            this.resetState();

        }


        restart() {
            this.start();
        }


        destroy() {
            this.stage.destroy();
        }


        /* ---------------------------------------------------------
           Medidas adaptativas
           --------------------------------------------------------- */

        measure() {

            const ratio = this.shell.stageRatio || 0.86;

            const width = utils.clamp(Math.round(BASE_H * ratio), 600, 1180);

            const changed = width !== this.W;

            this.W = width;
            this.H = BASE_H;

            COLS = utils.clamp(Math.round((width - 40) / 56), 8, 18);
            CELL_W = (width - 40) / COLS;

            GRID_X = (width - (COLS * CELL_W)) / 2;
            PLAYER_Y = BASE_H - 62;
            BUNKER_Y = BASE_H - 150;

            if (this.stage) {

                this.stage.setLogical(width, BASE_H);

                this.stars = canvasKit.createStars(this.stage, 70);

            }

            return changed;

        }


        layout() {

            if (this.shell.state === "running") {
                return;
            }

            if (this.measure()) {
                this.resetState();
            }

        }


        get world() {
            return WORLDS.find((item) => item.id === this.worldId) || WORLDS[0];
        }


        get aliveInvaders() {
            return this.invaders.filter((invader) => invader.alive);
        }


        get tuning() {
            return DIFFICULTY[this.difficulty] || DIFFICULTY.normal;
        }


        /* ---------------------------------------------------------
           Mundo
           --------------------------------------------------------- */

        bindWorld() {

            const buttons = utils.qsa("[data-world]", this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset.world === this.worldId
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {
                        item.classList.toggle("is-active", item === button);
                    });

                    this.worldId = button.dataset.world;

                    A.audio.play("select");

                    this.shell.setLog(this.world.name);

                    this.wave = 1;
                    this.score = 0;
                    this.lives = 3;

                    this.resetState();

                });

            });

        }


        /* ---------------------------------------------------------
           Dificultad
           --------------------------------------------------------- */

        bindDifficulty() {

            const buttons = utils.qsa("[data-difficulty]", this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset.difficulty === this.difficulty
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {

                        item.classList.toggle(
                            "is-active",
                            item === button
                        );

                    });

                    this.difficulty = button.dataset.difficulty;

                    A.audio.play("select");

                });

            });

        }


        /* ---------------------------------------------------------
           JEFE — aparece cada X oleadas según el mundo
           --------------------------------------------------------- */

        spawnBoss() {

            /* Cada mundo tiene el suyo, con aguante y maneras propias */
            const type = this.world.boss || {
                sprite: "bossNodriza",
                name: "JEFE",
                color: "#F43F5E",
                spread: 5,
                aimRate: 1,
                speed: 1
            };

            const maxHp = Math.round(
                (14 + this.wave * 4) * (type.tough || 1)
            );

            this.boss = {
                x: this.W / 2,
                y: 40,
                dir: 1,
                hp: maxHp,
                maxHp,
                fireTimer: 1200,
                spreadTimer: 2000,
                hitFlash: 0,
                t: 0,
                type
            };

            this.shell.setMeter("boss", 1);

            this.shell.setLog("¡" + type.name + "!");

        }


        updateBoss(dt, seconds) {

            const boss = this.boss;

            boss.t += dt;

            /* Entrada en escena */
            if (boss.y < BOSS_Y) {
                boss.y = Math.min(BOSS_Y, boss.y + 110 * seconds);
            }

            const pace = (boss.type && boss.type.speed) || 1;

            boss.x += boss.dir * BOSS_SPEED * pace * seconds;

            const margin = BOSS_W / 2 + 10;

            if (boss.x < margin) {
                boss.x = margin;
                boss.dir = 1;
            }

            if (boss.x > this.W - margin) {
                boss.x = this.W - margin;
                boss.dir = -1;
            }

            if (boss.hitFlash > 0) {
                boss.hitFlash -= dt;
            }

            if (boss.y < BOSS_Y - 4) {
                return;
            }


            /* Disparo dirigido */
            boss.fireTimer -= dt;

            if (boss.fireTimer <= 0) {

                const dx = this.player.x - boss.x;
                const dy = (this.player.y - 20) - (boss.y + 30);

                const length = Math.max(1, Math.hypot(dx, dy));

                const speed = 300 + this.wave * 8;

                this.enemyBullets.push({
                    x: boss.x,
                    y: boss.y + 34,
                    vx: (dx / length) * speed,
                    vy: (dy / length) * speed
                });

                const aim = (boss.type && boss.type.aimRate) || 1;

                boss.fireTimer = Math.max(
                    240,
                    (900 - this.wave * 40) * aim
                );

            }


            /* Abanico */
            boss.spreadTimer -= dt;

            if (boss.spreadTimer <= 0) {

                const speed = 260 + this.wave * 8;

                /* Cuántos chorros abre este jefe */
                const shots = (boss.type && boss.type.spread) || 5;

                for (let i = 0; i < shots; i += 1) {

                    /* Reparto simétrico en un arco de ±0.55 rad */
                    const angle = shots === 1
                        ? 0
                        : (i / (shots - 1) - 0.5) * 1.1;

                    this.enemyBullets.push({
                        x: boss.x,
                        y: boss.y + 34,
                        vx: Math.sin(angle) * speed,
                        vy: Math.cos(angle) * speed
                    });

                }

                boss.spreadTimer = Math.max(1100, 2000 - this.wave * 60);

            }

        }


        hitBoss(bullet) {

            const boss = this.boss;

            const left = boss.x - BOSS_W / 2;
            const right = boss.x + BOSS_W / 2;
            const top = boss.y - BOSS_H / 2 + 8;
            const bottom = boss.y + BOSS_H / 2;

            if (
                bullet.x < left ||
                bullet.x > right ||
                bullet.y < top ||
                bullet.y > bottom
            ) {
                return false;
            }

            boss.hp -= 1;
            boss.hitFlash = 90;

            this.score += 20 * this.wave;

            this.spawnParticles(bullet.x, bullet.y, 8, this.world.colors[0]);

            A.audio.play("hit");

            this.shell.setMeter("boss", Math.max(0, boss.hp / boss.maxHp));

            if (boss.hp <= 0) {
                this.killBoss();
            }

            return true;

        }


        killBoss() {

            const boss = this.boss;

            this.score += 500 * this.wave;

            this.spawnParticles(boss.x, boss.y, 70, this.world.colors[1]);
            this.spawnParticles(boss.x, boss.y, 40, "#FBBF24");

            A.audio.play("explode");

            ["S", "B", "L", "X"].forEach((type, index) => {

                this.powerups.push({
                    x: boss.x + (index - 1.5) * 46,
                    y: boss.y,
                    type,
                    vy: 140
                });

            });

            this.boss = null;

            this.flashTimer = 900;

            this.shell.setMeter("boss", 0);

            this.shell.setLog("JEFE DERROTADO");

            this.updateStats();

            /* Si el jefe cayó de último, la oleada termina con él.
               Sin esto el juego se quedaba clavado con la pantalla
               vacía y sin avanzar nunca. */
            this.checkWave();

        }


        /* ---------------------------------------------------------
           Entrada
           --------------------------------------------------------- */

        key(key) {

            if (key === " " || key === "Spacebar") {

                this.shoot();

                return true;

            }

            if (key === "ArrowLeft" || key === "a") {

                this.player.dir = -1;

                return true;

            }

            if (key === "ArrowRight" || key === "d") {

                this.player.dir = 1;

                return true;

            }

            return false;

        }


        shoot() {

            if (this.player.cooldown > 0) {
                return;
            }

            const spread = this.effects.spread > 0;

            const limit = spread ? 6 : 3;

            if (this.bullets.length >= limit) {
                return;
            }

            this.player.cooldown = spread ? 190 : 240;

            if (spread) {

                [-0.22, 0, 0.22].forEach((angle) => {

                    this.bullets.push({
                        x: this.player.x,
                        y: this.player.y - 10,
                        vx: Math.sin(angle) * BULLET_SPEED,
                        vy: -Math.cos(angle) * BULLET_SPEED
                    });

                });

            } else {

                this.bullets.push({
                    x: this.player.x,
                    y: this.player.y - 10,
                    vx: 0,
                    vy: -BULLET_SPEED
                });

            }

            A.audio.play("shoot");

        }


        /* ---------------------------------------------------------
           Lógica
           --------------------------------------------------------- */

        update(dt) {

            const seconds = dt / 1000;

            canvasKit.starfield(this.stage, this.stars, 1, dt);

            this.frameTimer += dt;

            if (this.frameTimer > 480) {
                this.frameTimer = 0;
                this.frame = this.frame === 0 ? 1 : 0;
            }

            /* Jugador */
            this.player.x += this.player.dir * PLAYER_SPEED * seconds;

            this.player.x = utils.clamp(this.player.x, 24, this.W - 24);

            if (this.player.cooldown > 0) {
                this.player.cooldown -= dt;
            }

            this.player.dir = this.readDirection();


            /* Efectos */
            ["spread", "freeze"].forEach((key) => {

                if (this.effects[key] > 0) {

                    this.effects[key] -= dt;

                    if (this.effects[key] <= 0) {
                        this.effects[key] = 0;
                    }

                }

            });


            /* Balas del jugador */
            for (let i = this.bullets.length - 1; i >= 0; i -= 1) {

                const bullet = this.bullets[i];

                bullet.x += (bullet.vx || 0) * seconds;
                bullet.y += bullet.vy * seconds;

                if (bullet.y < -10 || bullet.x < -10 || bullet.x > this.W + 10) {

                    this.bullets.splice(i, 1);

                    continue;

                }

                if (this.hitBunkers(bullet) || this.hitInvaders(bullet)) {

                    this.bullets.splice(i, 1);

                }

            }


            /* Balas enemigas */
            for (let i = this.enemyBullets.length - 1; i >= 0; i -= 1) {

                const bullet = this.enemyBullets[i];

                bullet.y += bullet.vy * seconds;
                bullet.x += (bullet.vx || 0) * seconds;

                if (
                    bullet.y > this.H + 10 ||
                    bullet.x < -30 ||
                    bullet.x > this.W + 30
                ) {

                    this.enemyBullets.splice(i, 1);

                    continue;

                }

                if (this.hitBunkers(bullet)) {

                    this.enemyBullets.splice(i, 1);

                    continue;

                }

                if (this.hitBarrier(bullet) || this.hitPlayer(bullet)) {

                    this.enemyBullets.splice(i, 1);

                }

            }


            if (this.boss) {
                this.updateBoss(dt, seconds);
            } else {
                this.march(dt);
                this.enemyShooting(dt);
            }

            this.updatePowerups(dt, seconds);
            this.updateParticles(dt);

            if (this.flashTimer > 0) {
                this.flashTimer -= dt;
            }

            /* Relevo de oleada: se aplica aquí, cuando ya no queda
               ningún bucle recorriendo balas o invasores. */
            if (this.wavePending) {
                this.advanceWave();
            }

        }


        readDirection() {

            const input = A.input;

            let dir = 0;

            if (input.isDown("ArrowLeft") || input.isDown("a")) {
                dir -= 1;
            }

            if (input.isDown("ArrowRight") || input.isDown("d")) {
                dir += 1;
            }

            if (dir !== 0) {
                return dir;
            }

            if (performance.now() > this.touchHoldUntil) {
                this.touchDir = 0;
            }

            return this.touchDir;

        }


        march(dt) {

            if (this.effects.freeze > 0) {
                return;
            }

            const alive = this.aliveInvaders;

            if (!alive.length) {
                return;
            }

            const total = alive.length;
            const ratio = total / (rowsForWave(this.wave) * COLS);

            const pattern = this.pattern || PATTERNS[0];

            /* Vaivén continuo: se recalcula aunque no toque paso */
            if (pattern.sway) {

                this.swayTime += dt / 1000;

                this.sway = Math.sin(this.swayTime * pattern.swayHz * Math.PI * 2)
                    * pattern.sway;

            }

            const interval = utils.clamp(
                (520 - (this.wave - 1) * 45) *
                (0.25 + ratio * 0.75) *
                this.tuning.march *
                pattern.march,
                70,
                620
            );

            this.marchTimer += dt;

            if (this.marchTimer < interval) {
                return;
            }

            this.marchTimer = 0;

            const step = pattern.step;

            const nextX = this.offsetX + this.marchDir * step;

            let hitEdge = false;

            alive.forEach((invader) => {

                const x = GRID_X + invader.col * CELL_W + nextX + this.sway;
                const width = 11 * PIXEL;

                if (x < 8 || x + width > this.W - 8) {
                    hitEdge = true;
                }

            });

            if (hitEdge) {

                this.marchDir *= -1;
                this.offsetY += pattern.drop;

            } else {

                this.offsetX = nextX;

            }

            const lowest = alive.reduce((max, invader) => {

                const y = GRID_Y + invader.row * CELL_H + this.offsetY;

                return Math.max(max, y);

            }, 0);

            if (lowest + 8 * PIXEL >= this.player.y) {
                this.loseLife(true);
            }

        }


        enemyShooting(dt) {

            if (this.effects.freeze > 0) {
                return;
            }

            this.shootTimer -= dt;

            if (this.shootTimer > 0) {
                return;
            }

            const alive = this.aliveInvaders;

            if (!alive.length) {
                return;
            }

            const columns = {};

            alive.forEach((invader) => {

                const current = columns[invader.col];

                if (!current || invader.row > current.row) {
                    columns[invader.col] = invader;
                }

            });

            const list = Object.keys(columns).map((key) => columns[key]);

            const shooter = utils.pick(list);

            if (shooter) {

                this.enemyBullets.push({

                    x: GRID_X + shooter.col * CELL_W + this.fleetX + (11 * PIXEL) / 2,

                    y: GRID_Y + shooter.row * CELL_H + this.offsetY + 8 * PIXEL,

                    vy: ENEMY_BULLET_SPEED + this.wave * 12

                });

            }

            this.shootTimer = utils.clamp(
                utils.rand(700, 1900) * this.tuning.fire - this.wave * 90,
                260,
                2200
            );

        }


        hitInvaders(bullet) {

            if (this.boss && this.hitBoss(bullet)) {
                return true;
            }

            const alive = this.aliveInvaders;

            for (let i = 0; i < alive.length; i += 1) {

                const invader = alive[i];

                const x = GRID_X + invader.col * CELL_W + this.fleetX;
                const y = GRID_Y + invader.row * CELL_H + this.offsetY;
                const w = 11 * PIXEL;
                const h = 8 * PIXEL;

                if (
                    bullet.x >= x &&
                    bullet.x <= x + w &&
                    bullet.y >= y &&
                    bullet.y <= y + h
                ) {

                    invader.alive = false;

                    this.score += invader.value * this.wave;

                    this.spawnParticles(x + w / 2, y + h / 2, 16, "#F43F5E");

                    A.audio.play("explode");

                    if (Math.random() < DROP_CHANCE) {

                        this.powerups.push({
                            x: x + w / 2,
                            y: y + h / 2,
                            type: utils.pick(POWERUP_KEYS),
                            vy: 140
                        });

                    }

                    this.updateStats();

                    this.checkWave();

                    return true;

                }

            }

            return false;

        }


        hitBunkers(bullet) {

            for (let b = 0; b < this.bunkers.length; b += 1) {

                const blocks = this.bunkers[b].blocks;

                for (let i = blocks.length - 1; i >= 0; i -= 1) {

                    const block = blocks[i];

                    if (
                        bullet.x >= block.x &&
                        bullet.x <= block.x + block.size &&
                        bullet.y >= block.y &&
                        bullet.y <= block.y + block.size
                    ) {

                        block.hp -= 1;

                        if (block.hp <= 0) {
                            blocks.splice(i, 1);
                        }

                        this.spawnParticles(
                            block.x + block.size / 2,
                            block.y + block.size / 2,
                            4,
                            this.world.bunker
                        );

                        A.audio.play("hit");

                        return true;

                    }

                }

            }

            return false;

        }


        hitBarrier(bullet) {

            if (this.barrier <= 0) {
                return false;
            }

            const y = PLAYER_Y - 34;

            if (bullet.y >= y - 6 && bullet.y <= y + 6) {

                this.barrier -= 1;

                this.spawnParticles(bullet.x, y, 10, "#8B5CF6");

                A.audio.play("hit");

                return true;

            }

            return false;

        }


        hitPlayer(bullet) {

            const left = this.player.x - 20;
            const right = this.player.x + 20;

            if (
                bullet.x >= left &&
                bullet.x <= right &&
                bullet.y >= this.player.y - 8 &&
                bullet.y <= this.player.y + 12
            ) {

                this.loseLife(false);

                return true;

            }

            return false;

        }


        /* ---------------------------------------------------------
           Power-ups
           --------------------------------------------------------- */

        updatePowerups(dt, seconds) {

            for (let i = this.powerups.length - 1; i >= 0; i -= 1) {

                const item = this.powerups[i];

                item.y += item.vy * seconds;

                /* Recogida por la nave */
                if (
                    item.y + 12 >= this.player.y - 8 &&
                    item.y - 12 <= this.player.y + 12 &&
                    Math.abs(item.x - this.player.x) < 26
                ) {

                    this.applyPowerup(item.type);

                    this.powerups.splice(i, 1);

                    continue;

                }

                if (item.y > this.H + 20) {
                    this.powerups.splice(i, 1);
                }

            }

        }


        applyPowerup(type) {

            const info = POWERUPS[type];

            if (!info) {
                return;
            }

            A.audio.play("coin");

            switch (type) {

                case "S":
                    this.effects.spread = 8000;
                    break;

                case "B":
                    this.barrier = 3;
                    break;

                case "F":
                    this.effects.freeze = 3500;
                    break;

                case "L":
                    this.lives = Math.min(6, this.lives + 1);
                    this.shell.setLives("lives", this.lives);
                    break;

                case "X":
                    this.dropBomb();
                    break;

                default:
                    break;

            }

            this.score += 25;

            this.updateStats();

        }


        dropBomb() {

            const alive = this.aliveInvaders;

            if (!alive.length) {
                return;
            }

            const lowest = alive.reduce(
                (max, invader) => Math.max(max, invader.row),
                -1
            );

            alive
                .filter((invader) => invader.row === lowest)
                .forEach((invader) => {

                    invader.alive = false;

                    this.score += invader.value * this.wave;

                    this.spawnParticles(
                        GRID_X + invader.col * CELL_W + this.fleetX + 16,
                        GRID_Y + invader.row * CELL_H + this.offsetY + 12,
                        12,
                        "#FBBF24"
                    );

                });

            A.audio.play("explode");

            this.flashTimer = 700;

            this.checkWave();

        }


        /* Sólo comprueba y marca. El cambio de oleada NO puede pasar
           aquí: a esto se llama desde dentro del bucle que recorre
           this.bullets, y reemplazar el array a media iteración
           reventaba el update (y con él, el juego entero). */
        checkWave() {

            if (this.aliveInvaders.length > 0) {
                return;
            }

            /* El jefe cuenta como parte de la oleada: mientras siga
               en pantalla no se pasa de nivel aunque no quede tropa. */
            if (this.boss) {
                return;
            }

            this.wavePending = true;

        }


        /* El relevo de oleada de verdad, ya fuera de cualquier bucle */
        advanceWave() {

            this.wavePending = false;

            this.wave += 1;

            this.score += 100 * this.wave;

            A.audio.play("win");

            /* Excusa de la máquina: ella estaba en otra cosa */
            this.shell.levelUpTaunt();

            this.flashTimer = 1200;

            this.offsetX = 0;
            this.sway = 0;
            this.offsetY = 0;

            /* length = 0 en vez de reasignar: si alguien sigue
               iterando el array, lo ve vaciarse, no desaparecer. */
            this.bullets.length = 0;
            this.enemyBullets.length = 0;
            this.powerups.length = 0;

            /* Patrón nuevo para la oleada nueva */
            this.pattern = patternForWave(this.wave);
            this.swayTime = 0;

            this.marchDir = 1;
            this.marchTimer = 0;

            this.invaders = this.createInvaders();
            this.bunkers = this.createBunkers();

            /* Las oleadas de jefe también lo traen al encadenar */
            this.boss = null;

            if (this.wave % this.world.bossEach === 0) {
                this.spawnBoss();
            }

            this.shell.setMeter("boss", this.boss ? 1 : 0);

            if (!this.boss) {
                this.shell.setLog("OLEADA " + this.wave + " · " + this.pattern.label);
            }

            this.updateStats();

        }


        loseLife(invaded) {

            this.lives -= 1;

            this.flashTimer = 900;

            this.spawnParticles(
                this.player.x,
                this.player.y,
                28,
                invaded ? "#F43F5E" : "#FBBF24"
            );

            A.audio.play("explode");

            this.bullets = [];
            this.enemyBullets = [];
            this.powerups = [];

            this.effects.spread = 0;
            this.effects.freeze = 0;
            this.barrier = 0;

            this.player.x = this.W / 2;

            this.updateStats();

            if (this.lives <= 0) {

                this.shell.gameOver({
                    taunt: true,
                    text: `Caíste en la oleada ${this.wave}.`,
                    score: this.score
                });

            }

        }


        updateStats() {

            /* Hilo narrativo: la primera vez que se cruza el umbral
               de este juego, el shell cuenta su capítulo. */
            if (this.shell.checkStory) {
                this.shell.checkStory(this.score);
            }

            this.shell.setStat("score", utils.formatScore(this.score));
            this.shell.setStat("best", utils.formatScore(
                Math.max(this.shell.best, this.score)
            ));
            this.shell.setStat("wave", this.wave);
            this.shell.setStat("enemies", this.aliveInvaders.length);
            this.shell.setLives("lives", this.lives);

        }


        /* ---------------------------------------------------------
           Partículas
           --------------------------------------------------------- */

        spawnParticles(x, y, count, color) {

            for (let i = 0; i < count; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.06 + Math.random() * 0.3;

                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: 0.0018 + Math.random() * 0.002,
                    size: 2 + Math.random() * 3,
                    color
                });

            }

        }


        updateParticles(dt) {

            for (let i = this.particles.length - 1; i >= 0; i -= 1) {

                const particle = this.particles[i];

                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.life -= particle.decay * dt;

                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }

            }

        }


        /* ---------------------------------------------------------
           Dibujo
           --------------------------------------------------------- */

        render() {

            const { ctx } = this.stage;

            this.stage.clear(this.world.bg);

            if (this.world.nebula) {
                this.drawNebula();
            }

            if (this.world.backdrop && A.pixelArt) {
                A.pixelArt.drawBackdrop(ctx, this.stage, {
                    alpha: 0.07,
                    fraction: 0.78
                });
            }

            this.drawStars();
            this.drawFloor();
            this.drawBunkers();
            this.drawBoss();
            this.drawInvaders();
            this.drawPlayer();
            this.drawBarrier();
            this.drawBullets();
            this.drawPowerups();
            this.drawParticles();
            this.drawEffects();

            if (this.flashTimer > 0) {
                this.drawFlash();
            }

        }


        drawStars() {

            const { ctx } = this.stage;

            ctx.save();

            this.stars.forEach((star) => {

                ctx.globalAlpha = star.alpha;
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(star.x, star.y, star.size, star.size);

            });

            ctx.restore();

        }


        drawBunkers() {

            const { ctx } = this.stage;

            ctx.save();

            this.bunkers.forEach((bunker) => {

                bunker.blocks.forEach((block) => {

                    ctx.fillStyle = this.world.bunker;

                    ctx.shadowColor = this.world.bunker;
                    ctx.shadowBlur = 6;

                    ctx.fillRect(
                        block.x,
                        block.y,
                        block.size,
                        block.size
                    );

                });

            });

            ctx.restore();

        }


        drawFloor() {

            const { ctx } = this.stage;

            ctx.save();

            ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, this.H - 34);
            ctx.lineTo(this.W, this.H - 34);
            ctx.stroke();

            ctx.restore();

        }


        drawNebula() {

            const { ctx } = this.stage;

            const colors = this.world.nebula;

            /* La nebulosa es fija: dos gradientes radiales a pantalla
               completa. Crearlos cada frame era tirar trabajo, así
               que se rasterizan una vez a un canvas y se copian. */
            const key = colors.join("|") + ":" + this.W + "x" + this.H;

            if (!this._nebula || this._nebulaKey !== key) {

                const canvas = document.createElement("canvas");

                canvas.width = this.W;
                canvas.height = this.H;

                const c = canvas.getContext("2d");

                colors.forEach((color, index) => {

                    const cx = this.W * (index === 0 ? 0.28 : 0.74);
                    const cy = this.H * (index === 0 ? 0.32 : 0.62);

                    const radius = this.W * 0.42;

                    const gradient = c.createRadialGradient(
                        cx, cy, 0, cx, cy, radius
                    );

                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, "rgba(0,0,0,0)");

                    c.fillStyle = gradient;

                    c.fillRect(0, 0, this.W, this.H);

                });

                this._nebula = canvas;
                this._nebulaKey = key;

            }

            ctx.drawImage(this._nebula, 0, 0);

        }


        drawBoss() {

            if (!this.boss || !A.pixelArt) {
                return;
            }

            const { ctx } = this.stage;

            const boss = this.boss;

            const type = boss.type || {};

            const frames = SPRITES[type.sprite] || SPRITES.bossNodriza;

            const pattern = frames[this.frame % frames.length];

            const color = boss.hitFlash > 0
                ? "#F5F7FF"
                : (type.color || this.world.colors[0]);

            /* Mismo cacheado que la tropa: el sprite se pinta una
               vez y luego sólo se blitea. */
            const sprite = this.spriteCanvas(pattern, color, 14);

            const cols = pattern[0].length;

            const scale = BOSS_W / (cols * PIXEL);

            const w = sprite.canvas.width * scale;
            const h = sprite.canvas.height * scale;

            ctx.save();

            /* Flotación suave */
            const bob = Math.sin(boss.t / 320) * 3;

            ctx.drawImage(
                sprite.canvas,
                boss.x - w / 2,
                boss.y - h / 2 + bob,
                w,
                h
            );

            ctx.restore();


            /* Barra de vida */
            const barW = BOSS_W + 20;
            const barH = 9;

            const barX = boss.x - barW / 2;
            const barY = boss.y - h / 2 - 20;

            canvasKit.fillRoundRect(
                ctx, barX, barY, barW, barH, 4, "rgba(6,7,11,0.9)"
            );

            const ratio = Math.max(0, boss.hp / boss.maxHp);

            canvasKit.fillRoundRect(
                ctx,
                barX + 1,
                barY + 1,
                Math.max(2, (barW - 2) * ratio),
                barH - 2,
                3,
                ratio > 0.5 ? "#A3E635" : ratio > 0.25 ? "#FBBF24" : "#F43F5E"
            );

            canvasKit.text(
                ctx,
                (boss.type && boss.type.name) || "JEFE",
                boss.x,
                barY - 8,
                {
                    font: "700 10px 'JetBrains Mono', monospace",
                    color: (boss.type && boss.type.color) || this.world.colors[0]
                }
            );

        }


        /* ---------------------------------------------------------
           Sprites cacheados

           Antes cada invasor se pintaba píxel a píxel con fillRect y
           con shadowBlur activo: con 90 invasores en pantalla eran
           miles de rectángulos con sombra por frame y el P95 se iba
           por encima de 200 ms.

           Ahora cada combinación de patrón + color + brillo se pinta
           UNA vez en un lienzo propio y después solo se copia con
           drawImage, que es una operación que la GPU resuelve barata.
           --------------------------------------------------------- */

        spriteCanvas(pattern, color, glow) {

            if (!this._spriteCache) {
                this._spriteCache = new Map();
            }

            /* El patrón se identifica por su contenido: son constantes
               compartidas, así que la primera línea y el alto bastan
               para distinguirlos sin recorrerlos enteros. */
            const key = pattern.length + ":" + pattern[0] + "|" + color + "|" + glow;

            let cached = this._spriteCache.get(key);

            if (cached) {
                return cached;
            }

            const cols = pattern[0].length;
            const rows = pattern.length;

            /* Margen para que el resplandor no se recorte */
            const pad = glow ? Math.ceil(glow) : 0;

            const canvas = document.createElement("canvas");

            canvas.width = cols * PIXEL + pad * 2;
            canvas.height = rows * PIXEL + pad * 2;

            const c = canvas.getContext("2d");

            c.fillStyle = color;

            if (glow) {
                c.shadowColor = color;
                c.shadowBlur = glow;
            }

            for (let row = 0; row < rows; row += 1) {

                const line = pattern[row];

                /* Se agrupan los píxeles contiguos en un solo rect:
                   menos llamadas y menos pasadas de sombra. */
                let run = 0;

                for (let col = 0; col <= cols; col += 1) {

                    if (line[col] === "X") {

                        run += 1;

                        continue;

                    }

                    if (run) {

                        c.fillRect(
                            pad + (col - run) * PIXEL,
                            pad + row * PIXEL,
                            run * PIXEL,
                            PIXEL
                        );

                        run = 0;

                    }

                }

            }

            cached = { canvas, pad };

            this._spriteCache.set(key, cached);

            return cached;

        }


        drawSprite(pattern, x, y, color, glow = 0) {

            const { ctx } = this.stage;

            const sprite = this.spriteCanvas(pattern, color, glow);

            ctx.drawImage(
                sprite.canvas,
                x - sprite.pad,
                y - sprite.pad
            );

        }


        drawInvaders() {

            const frozen = this.effects.freeze > 0;

            this.aliveInvaders.forEach((invader) => {

                const x = GRID_X + invader.col * CELL_W + this.fleetX;
                const y = GRID_Y + invader.row * CELL_H + this.offsetY;

                const frames = SPRITES[invader.type];

                const pattern = frames[this.frame % frames.length];

                const palette = this.world.colors;

                const color = palette[
                    Math.min(invader.row, palette.length - 1)
                ];

                this.drawSprite(pattern, x, y, frozen ? "#22D3EE" : color, 10);

            });

        }


        drawPlayer() {

            const pattern = SPRITES.ship[0];

            const x = this.player.x - (13 * PIXEL) / 2;

            this.drawSprite(
                pattern,
                x,
                this.player.y - 8,
                this.effects.spread > 0 ? "#A3E635" : "#22D3EE",
                16
            );

        }


        drawBarrier() {

            if (this.barrier <= 0) {
                return;
            }

            const { ctx } = this.stage;

            const y = PLAYER_Y - 34;

            ctx.save();

            ctx.globalAlpha = 0.35 + this.barrier * 0.15;

            ctx.shadowColor = "#8B5CF6";
            ctx.shadowBlur = 16;
            ctx.strokeStyle = "#C4B5FD";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(this.player.x - 42, y);
            ctx.lineTo(this.player.x + 42, y);
            ctx.stroke();

            ctx.restore();

        }


        drawBullets() {

            const { ctx } = this.stage;

            ctx.save();

            this.bullets.forEach((bullet) => {

                ctx.shadowColor = "#A3E635";
                ctx.shadowBlur = 14;
                ctx.fillStyle = "#A3E635";

                ctx.fillRect(bullet.x - 2, bullet.y - 10, 4, 12);

            });

            this.enemyBullets.forEach((bullet) => {

                ctx.shadowColor = "#F43F5E";
                ctx.shadowBlur = 12;
                ctx.fillStyle = "#FBBF24";

                ctx.fillRect(bullet.x - 2, bullet.y - 6, 4, 12);

            });

            ctx.restore();

        }


        drawPowerups() {

            const { ctx } = this.stage;

            this.powerups.forEach((item) => {

                const info = POWERUPS[item.type];

                ctx.save();

                ctx.translate(item.x, item.y);
                ctx.rotate(Math.sin(item.y / 18) * 0.35);

                ctx.shadowColor = info.color;
                ctx.shadowBlur = 14;

                canvasKit.fillRoundRect(ctx, -15, -11, 30, 22, 7, "rgba(6,7,11,0.9)");

                ctx.restore();

                ctx.save();

                ctx.translate(item.x, item.y);
                ctx.rotate(Math.sin(item.y / 18) * 0.35);

                ctx.strokeStyle = info.color;
                ctx.lineWidth = 1.5;

                canvasKit.roundRect(ctx, -15, -11, 30, 22, 7);
                ctx.stroke();

                ctx.restore();

                canvasKit.text(ctx, info.label, item.x, item.y + 1, {
                    font: "700 12px 'JetBrains Mono', monospace",
                    color: info.color
                });

            });

        }


        drawParticles() {

            const { ctx } = this.stage;

            this.particles.forEach((particle) => {

                ctx.globalAlpha = Math.max(0, particle.life);
                ctx.fillStyle = particle.color;

                ctx.fillRect(
                    particle.x - particle.size / 2,
                    particle.y - particle.size / 2,
                    particle.size,
                    particle.size
                );

            });

            ctx.globalAlpha = 1;

        }


        drawEffects() {

            const { ctx } = this.stage;

            const chips = [];

            if (this.effects.spread > 0) {
                chips.push({
                    label: `TRIPLE ${Math.ceil(this.effects.spread / 1000)}s`,
                    color: "#A3E635"
                });
            }

            if (this.effects.freeze > 0) {
                chips.push({
                    label: `CONGELA ${Math.ceil(this.effects.freeze / 1000)}s`,
                    color: "#22D3EE"
                });
            }

            if (this.barrier > 0) {
                chips.push({
                    label: `BARRERA ×${this.barrier}`,
                    color: "#C4B5FD"
                });
            }

            if (!chips.length) {
                return;
            }

            let x = 12;

            chips.forEach((chip) => {

                const width = 16 + chip.label.length * 7.2;

                ctx.save();
                ctx.globalAlpha = 0.9;

                canvasKit.fillRoundRect(
                    ctx, x, this.H - 30, width, 20, 6, "rgba(6,7,11,0.85)"
                );

                ctx.strokeStyle = chip.color;
                ctx.lineWidth = 1;

                canvasKit.roundRect(ctx, x, this.H - 30, width, 20, 6);
                ctx.stroke();

                ctx.restore();

                canvasKit.text(ctx, chip.label, x + width / 2, this.H - 19, {
                    font: "700 9px 'JetBrains Mono', monospace",
                    color: chip.color
                });

                x += width + 8;

            });

        }


        drawFlash() {

            const { ctx } = this.stage;

            const alpha = utils.clamp(this.flashTimer / 1200, 0, 1) * 0.3;

            ctx.save();

            ctx.fillStyle = this.effects.freeze > 0
                ? `rgba(34, 211, 238, ${alpha})`
                : `rgba(244, 63, 94, ${alpha})`;

            ctx.fillRect(0, 0, this.W, this.H);

            ctx.restore();

        }

    }


    /* ---------------------------------------------------------
       REGISTRO
       --------------------------------------------------------- */

    A.registerGame({

        id: "invaders",
        number: "02",
        name: "INVADERS",
        genre: "SHOOTER / CLASSIC",
        mode: "WAVE DEFENSE",

        music: "arcade",

        accent: "var(--color-pink)",
        accentRgb: "244 63 94",
        cardRgb: "244 63 94",

        preview: `
            <span class="preview preview--invaders">

                <span class="preview__invaders-row">
                    <i></i><i></i><i></i><i></i><i></i>
                </span>

                <span class="preview__invaders-row preview__invaders-row--b">
                    <i></i><i></i><i></i><i></i><i></i>
                </span>

                <span class="preview__invaders-row preview__invaders-row--c">
                    <i></i><i></i><i></i><i></i><i></i>
                </span>

                <i class="preview__ship"></i>

            </span>
        `,

        /* El campo de batalla se estira en pantallas anchas */
        ratioMin: 0.85,
        ratioMax: 1.5,

        readyTitle: "DEFEND",
        readyText: "3 mundos con jefes: ÓRBITA, NEBULOSA y CIUDADELA. Power-ups: TRIPLE, BARRERA, CONGELAR, BOMBA y VIDA.",
        readyHint: "ENTER — EMPEZAR    ESPACIO — DISPARAR    ESC — SALIR",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.stat("wave", "WAVE", "1")}
            ${A.ui.stat("enemies", "LEFT", "50")}
            ${A.ui.lives("lives", 3)}
            ${A.ui.meter("boss", "BOSS")}
        `,

        controls: `
            ${A.ui.switcher("world", [
                { value: "orbita", label: "ÓRBITA" },
                { value: "nebulosa", label: "NEBULOSA" },
                { value: "ciudadela", label: "CIUDADELA" }
            ])}
            ${A.ui.switcher("difficulty", [
                { value: "calm", label: "CALM" },
                { value: "normal", label: "NORMAL" },
                { value: "fury", label: "FURY" }
            ])}
        `,

        hint: "← → — MOVER    ESPACIO — DISPARAR    P — PAUSA    ESC — SALIR",

        create(shell) {
            return new InvadersGame(shell);
        }

    });

})(window.Arcade404);
