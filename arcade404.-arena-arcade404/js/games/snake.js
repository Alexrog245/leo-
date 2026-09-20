/* =========================================================
   ARCADE 404 — GAME 01 · SNAKE
   Rejilla adaptativa, 4 mundos (obstáculos, laberinto,
   portales), niveles progresivos, 3 dificultades y comida
   especial (ORO · LENTO · RECORTE · ESCUDO).
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       CONSTANTES
       --------------------------------------------------------- */

    const CELL = 30;
    const ROWS = 20;

    const COLOR_HEAD = [190, 255, 120];
    const COLOR_TAIL = [34, 211, 238];

    const MIN_STEP = 58;

    const SPEEDS = {
        calm: 172,
        normal: 132,
        fury: 98
    };


    const FOOD_TYPES = {

        normal: {
            glyph: "",
            color: "#F43F5E",
            points: 10,
            label: "MANZANA"
        },

        gold: {
            glyph: "★",
            color: "#FBBF24",
            points: 60,
            label: "ORO"
        },

        slow: {
            glyph: "⏱",
            color: "#22D3EE",
            points: 25,
            label: "LENTO"
        },

        cut: {
            glyph: "✂",
            color: "#A3E635",
            points: 25,
            label: "RECORTE"
        },

        shield: {
            glyph: "◆",
            color: "#8B5CF6",
            points: 25,
            label: "ESCUDO"
        },

        ghost: {
            glyph: "☁",
            color: "#F5F7FF",
            points: 40,
            label: "FANTASMA"
        }

    };

    const SPECIAL_TYPES = ["gold", "slow", "cut", "shield", "ghost"];

    const SPECIAL_LIFE = 9000;     /* ms que dura la comida especial */


    /* ---------------------------------------------------------
       MUNDOS
       Cada mundo tiene paleta, tipo de suelo y un generador de
       obstáculos que depende del nivel.
       --------------------------------------------------------- */

    function key(x, y) {
        return `${x},${y}`;
    }


    const WORLDS = [

        {
            id: "neo",
            name: "NEO",
            label: "NEO",
            bg: "#080B10",
            grid: "rgba(163, 230, 53, 0.05)",
            wall: null,
            accent: "#A3E635",
            build() {
                return { blocks: new Set(), portals: [] };
            }
        },

        {
            id: "ruinas",
            name: "RUINAS",
            label: "RUINAS",
            bg: "#0C0A08",
            grid: "rgba(251, 191, 36, 0.05)",
            wall: ["#8B6B3F", "#4A3720"],
            accent: "#FBBF24",
            build(cols, rows, level) {

                const blocks = new Set();

                const safe = this.safeZone(cols, rows);

                const clusters = utils.clamp(4 + level * 2, 4, 18);

                for (let i = 0; i < clusters; i += 1) {

                    const w = utils.randInt(2, 4);
                    const h = utils.randInt(1, 3);

                    const x = utils.randInt(1, Math.max(1, cols - w - 2));
                    const y = utils.randInt(1, Math.max(1, rows - h - 2));

                    for (let dy = 0; dy < h; dy += 1) {

                        for (let dx = 0; dx < w; dx += 1) {

                            const cell = key(x + dx, y + dy);

                            if (safe.has(cell)) {
                                continue;
                            }

                            if (x + dx >= cols - 1 || y + dy >= rows - 1) {
                                continue;
                            }

                            blocks.add(cell);

                        }

                    }

                }

                return { blocks, portals: [] };

            }
        },

        {
            id: "laberinto",
            name: "LABERINTO",
            label: "LABERINTO",
            bg: "#070A12",
            grid: "rgba(34, 211, 238, 0.05)",
            wall: ["#1E4E6B", "#0E2733"],
            accent: "#22D3EE",
            build(cols, rows, level) {

                const blocks = new Set();

                const safe = this.safeZone(cols, rows);

                const step = 5;
                const shift = (level - 1) % 2;

                for (let x = step; x < cols - 2; x += step) {

                    const gap = 1 + ((Math.round(x / step) + shift) % (rows - 6));

                    for (let y = 1; y < rows - 1; y += 1) {

                        if (y >= gap && y <= gap + 3) {
                            continue;
                        }

                        const cell = key(x, y);

                        if (safe.has(cell)) {
                            continue;
                        }

                        blocks.add(cell);

                    }

                }

                return { blocks, portals: [] };

            }
        },

        {
            id: "nexo",
            name: "NEXO",
            label: "NEXO",
            bg: "#0A0713",
            grid: "rgba(139, 92, 246, 0.06)",
            wall: ["#4C3A7A", "#241A3D"],
            accent: "#8B5CF6",
            backdrop: true,
            build(cols, rows, level) {

                const blocks = new Set();

                const safe = this.safeZone(cols, rows);

                /* Pilares en diagonal */
                for (let x = 3; x < cols - 2; x += 6) {

                    for (let y = 2; y < rows - 2; y += 6) {

                        const cell = key(x, y);

                        if (!safe.has(cell)) {
                            blocks.add(cell);
                        }

                        const cell2 = key(
                            Math.min(cols - 3, x + 2),
                            Math.min(rows - 3, y + 2)
                        );

                        if (!safe.has(cell2)) {
                            blocks.add(cell2);
                        }

                    }

                }

                /* Dos portales cruzados */
                const portals = [
                    {
                        a: { x: 1, y: 1 },
                        b: { x: cols - 2, y: rows - 2 },
                        hue: "#22D3EE"
                    },
                    {
                        a: { x: cols - 2, y: 1 },
                        b: { x: 1, y: rows - 2 },
                        hue: "#F43F5E"
                    }
                ];

                portals.forEach((portal) => {

                    blocks.delete(key(portal.a.x, portal.a.y));
                    blocks.delete(key(portal.b.x, portal.b.y));

                });

                return { blocks, portals };

            }
        },

        /* Zona de seguridad compartida: nunca se bloquea el centro */
        {
            id: "_helper",
            safeZone(cols, rows) {

                const safe = new Set();

                const cx = Math.floor(cols / 2);
                const cy = Math.floor(rows / 2);

                for (let y = cy - 2; y <= cy + 2; y += 1) {

                    for (let x = cx - 4; x <= cx + 4; x += 1) {

                        if (x < 0 || y < 0 || x >= cols || y >= rows) {
                            continue;
                        }

                        safe.add(key(x, y));

                    }

                }

                return safe;

            }
        }

    ];


    /* El helper vive aparte para no aparecer en el selector */
    const SAFE_ZONE = WORLDS.pop().safeZone;

    WORLDS.forEach((world) => {
        world.safeZone = SAFE_ZONE;
    });


    /* ---------------------------------------------------------
       JUEGO
       --------------------------------------------------------- */

    class SnakeGame {

        constructor(shell) {

            this.shell = shell;

            this.worldId = "neo";
            this.speedMode = "normal";

            this.directionQueue = [];
            this.particles = [];
            this.foodPulse = 0;

            this.cols = 20;
            this.rows = ROWS;

            this.stage = A.createStage(shell.refs.stage, {
                width: this.cols * CELL,
                height: this.rows * CELL,
                background: "#080B10"
            });

            this.measure();

            this.reset();

            this.bindWorld();
            this.bindSpeed();

            shell.setTouchControls({
                mode: "dpad",
                analogLabel: "Joystick analógico para cambiar el rumbo de la serpiente.",
                onDirection: (dir) => this.turn(dir)
            });

        }


        /* ---------------------------------------------------------
           Medidas adaptativas
           --------------------------------------------------------- */

        measure() {

            const ratio = this.shell.stageRatio || 1;

            const cols = utils.clamp(Math.round(ROWS * ratio), 16, 44);

            if (cols === this.cols && this.stage) {
                return false;
            }

            this.cols = cols;
            this.rows = ROWS;

            this.W = cols * CELL;
            this.H = ROWS * CELL;

            if (this.stage) {
                this.stage.setLogical(this.W, this.H);
            }

            return true;

        }


        layout() {

            if (this.shell.state === "running") {
                return;
            }

            if (this.measure()) {
                this.reset();
            }

        }


        get world() {

            return WORLDS.find((item) => item.id === this.worldId) || WORLDS[0];

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        reset() {

            const centerX = Math.floor(this.cols / 2);
            const centerY = Math.floor(this.rows / 2);

            this.snake = [
                { x: centerX, y: centerY },
                { x: centerX - 1, y: centerY },
                { x: centerX - 2, y: centerY }
            ];

            this.direction = { x: 1, y: 0 };
            this.directionQueue = [];

            this.pendingGrowth = 0;
            this.score = 0;
            this.apples = 0;
            this.level = 1;

            this.effects = { slow: 0, shield: 0, ghost: 0 };
            this.flash = 0;

            this.step = SPEEDS[this.speedMode];
            this.timer = 0;

            this.particles = [];

            this.buildWorld();

            this.food = this.spawnFood();

            this.updateStats();

            this.render();

        }


        buildWorld() {

            const built = this.world.build(this.cols, this.rows, this.level);

            this.blocks = built.blocks || new Set();
            this.portals = built.portals || [];

        }


        start() {
            this.reset();
        }


        restart() {
            this.reset();
        }


        destroy() {
            this.stage.destroy();
        }


        get baseStep() {
            return SPEEDS[this.speedMode] || SPEEDS.normal;
        }


        /* ---------------------------------------------------------
           Comida
           --------------------------------------------------------- */

        spawnFood() {

            const free = [];

            for (let y = 0; y < this.rows; y += 1) {

                for (let x = 0; x < this.cols; x += 1) {

                    const cell = key(x, y);

                    if (this.blocks.has(cell)) {
                        continue;
                    }

                    const taken = this.snake.some(
                        (segment) => segment.x === x && segment.y === y
                    );

                    if (!taken) {
                        free.push({ x, y });
                    }

                }

            }

            const cell = utils.pick(free) || { x: 1, y: 1 };

            /* Cada 3 manzanas aparece una comida especial */
            const isSpecial = this.apples > 0 && (this.apples + 1) % 3 === 0;

            return {
                x: cell.x,
                y: cell.y,
                type: isSpecial ? utils.pick(SPECIAL_TYPES) : "normal",
                life: isSpecial ? SPECIAL_LIFE : 0
            };

        }


        /* ---------------------------------------------------------
           Selectores
           --------------------------------------------------------- */

        bindSwitch(attr, current, onChange) {

            const buttons = utils.qsa(`[data-${attr}]`, this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset[attr] === current
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {
                        item.classList.toggle("is-active", item === button);
                    });

                    A.audio.play("select");

                    onChange(button.dataset[attr]);

                });

            });

        }


        bindWorld() {

            this.bindSwitch("world", this.worldId, (value) => {

                this.worldId = value;

                this.shell.setLog(this.world.name);

                this.reset();

            });

        }


        bindSpeed() {

            this.bindSwitch("speed", this.speedMode, (value) => {

                this.speedMode = value;

                this.reset();

            });

        }


        /* ---------------------------------------------------------
           Entrada
           --------------------------------------------------------- */

        turn(direction) {

            const vectors = {
                up: { x: 0, y: -1 },
                down: { x: 0, y: 1 },
                left: { x: -1, y: 0 },
                right: { x: 1, y: 0 }
            };

            const vector = vectors[direction];

            if (!vector) {
                return;
            }

            const last = this.directionQueue.length
                ? this.directionQueue[this.directionQueue.length - 1]
                : this.direction;

            if (last.x === -vector.x && last.y === -vector.y) {
                return;
            }

            if (last.x === vector.x && last.y === vector.y) {
                return;
            }

            if (this.directionQueue.length < 3) {
                this.directionQueue.push(vector);
                A.audio.play("turn");
            }

        }


        key(key) {

            const map = {
                ArrowUp: "up",
                ArrowDown: "down",
                ArrowLeft: "left",
                ArrowRight: "right",
                w: "up",
                s: "down",
                a: "left",
                d: "right"
            };

            const direction = map[key];

            if (!direction) {
                return false;
            }

            this.turn(direction);

            return true;

        }


        /* ---------------------------------------------------------
           Lógica
           --------------------------------------------------------- */

        update(dt) {

            this.foodPulse += dt;

            if (this.flash > 0) {
                this.flash -= dt;
            }

            /* Efectos activos */
            ["slow", "shield", "ghost"].forEach((name) => {

                if (this.effects[name] > 0) {

                    this.effects[name] -= dt;

                    if (this.effects[name] <= 0) {
                        this.effects[name] = 0;
                    }

                }

            });

            /* Caducidad de la comida especial */
            if (this.food.life > 0) {

                this.food.life -= dt;

                if (this.food.life <= 0) {

                    this.food = {
                        x: this.food.x,
                        y: this.food.y,
                        type: "normal",
                        life: 0
                    };

                }

            }

            this.updateParticles(dt);

            this.timer += dt;

            if (this.timer >= this.step) {

                this.timer -= this.step;

                this.move();

            }

        }


        move() {

            if (this.directionQueue.length) {
                this.direction = this.directionQueue.shift();
            }

            const head = this.snake[0];

            const next = {
                x: head.x + this.direction.x,
                y: head.y + this.direction.y
            };


            const hitsWall =
                next.x < 0 ||
                next.y < 0 ||
                next.x >= this.cols ||
                next.y >= this.rows;


            const willGrow = this.pendingGrowth > 0 ||
                (next.x === this.food.x && next.y === this.food.y);

            const limit = willGrow
                ? this.snake.length
                : this.snake.length - 1;

            let hitsBody = false;

            for (let i = 0; i < limit; i += 1) {

                if (this.snake[i].x === next.x && this.snake[i].y === next.y) {
                    hitsBody = true;
                    break;
                }

            }


            const hitsBlock = this.effects.ghost > 0
                ? false
                : this.blocks.has(key(next.x, next.y));


            if (hitsWall || hitsBody || hitsBlock) {

                if (this.effects.shield > 0 && !hitsBlock) {

                    this.useShield();

                    return;

                }

                this.die();

                return;

            }


            this.snake.unshift(next);


            /* Portales del NEXO */
            const portal = this.portalAt(next.x, next.y);

            if (portal) {

                const exit = portal.a.x === next.x && portal.a.y === next.y
                    ? portal.b
                    : portal.a;

                this.snake[0] = { x: exit.x, y: exit.y };

                this.spawnParticles(
                    exit.x * CELL + CELL / 2,
                    exit.y * CELL + CELL / 2,
                    14,
                    portal.hue
                );

                A.audio.play("coin");

            }


            if (next.x === this.food.x && next.y === this.food.y) {

                this.eat();

            } else if (this.pendingGrowth > 0) {

                this.pendingGrowth -= 1;

            } else {

                this.snake.pop();

            }

        }


        portalAt(x, y) {

            return this.portals.find((portal) =>
                (portal.a.x === x && portal.a.y === y) ||
                (portal.b.x === x && portal.b.y === y)
            ) || null;

        }


        useShield() {

            /* Se anula el movimiento, se recorta la serpiente y se
               invierte el sentido: el escudo absorbe un golpe */
            this.effects.shield = 0;

            this.flash = 420;

            this.direction = {
                x: -this.direction.x,
                y: -this.direction.y
            };

            this.directionQueue = [];

            this.snake.splice(-4, 4);

            if (this.snake.length < 3) {

                const head = this.snake[0];

                this.snake.push({ x: head.x - 1, y: head.y });

            }

            this.spawnParticles(
                this.snake[0].x * CELL + CELL / 2,
                this.snake[0].y * CELL + CELL / 2,
                22,
                "#C4B5FD"
            );

            A.audio.play("hit");

        }


        eat() {

            const info = FOOD_TYPES[this.food.type] || FOOD_TYPES.normal;

            this.score += info.points + (this.level - 1) * 2;

            this.apples += 1;

            this.spawnParticles(
                this.food.x * CELL + CELL / 2,
                this.food.y * CELL + CELL / 2,
                16,
                info.color
            );

            A.audio.play("coin");


            switch (this.food.type) {

                case "gold":
                    this.pendingGrowth += 2;
                    break;

                case "slow":
                    this.effects.slow = 6000;
                    break;

                case "cut":
                    this.snake.splice(-4, 4);
                    if (this.snake.length < 3) {
                        this.snake.push({
                            x: this.snake[this.snake.length - 1].x,
                            y: this.snake[this.snake.length - 1].y
                        });
                    }
                    break;

                case "shield":
                    this.effects.shield = 15000;
                    break;

                case "ghost":
                    this.effects.ghost = 5000;
                    break;

                default:
                    this.pendingGrowth += 1;
                    break;

            }


            /* Nivel cada 4 manzanas */
            const nextLevel = Math.floor(this.apples / 4) + 1;

            if (nextLevel > this.level) {

                this.level = nextLevel;

                this.step = Math.max(
                    MIN_STEP,
                    this.baseStep - (this.level - 1) * 9
                );

                A.audio.play("win");

                /* La máquina se lo quita de encima con una excusa */
                this.shell.levelUpTaunt();

                this.buildWorld();

            }


            this.food = this.spawnFood();

            this.updateStats();

        }


        die() {

            this.flash = 420;

            const head = this.snake[0];

            this.spawnParticles(
                head.x * CELL + CELL / 2,
                head.y * CELL + CELL / 2,
                30,
                "#F43F5E"
            );

            this.shell.gameOver({
                taunt: true,
                text: `Nivel ${this.level} · ${this.apples} comidas · ${this.world.name}.`,
                score: this.score
            });

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
                    decay: 0.0016 + Math.random() * 0.002,
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
                particle.vy += 0.00035 * dt;
                particle.life -= particle.decay * dt;

                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }

            }

        }


        /* ---------------------------------------------------------
           Estadísticas
           --------------------------------------------------------- */

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
            this.shell.setStat("level", this.level);
            this.shell.setStat("apples", this.apples);
            this.shell.setStat("length", this.snake.length);

        }


        /* ---------------------------------------------------------
           Dibujo
           --------------------------------------------------------- */

        render() {

            const { ctx } = this.stage;

            this.stage.clear(this.world.bg);

            if (this.world.backdrop && A.pixelArt) {
                A.pixelArt.drawBackdrop(ctx, this.stage, {
                    alpha: 0.06,
                    fraction: 0.8
                });
            }

            canvasKit.grid(this.stage, CELL, this.world.grid);

            this.drawPortals();
            this.drawBlocks();
            this.drawFood();
            this.drawSnake();
            this.drawParticles();
            this.drawEffects();

            if (this.flash > 0) {
                this.drawFlash();
            }

        }


        drawBlocks() {

            if (!this.blocks.size || !this.world.wall) {
                return;
            }

            const { ctx } = this.stage;

            const [light, dark] = this.world.wall;

            if (!this._wallGradient || this._wallKey !== light + dark) {

                const g = ctx.createLinearGradient(0, 0, 0, CELL);

                g.addColorStop(0, light);
                g.addColorStop(1, dark);

                this._wallGradient = g;
                this._wallKey = light + dark;

            }

            const gradient = this._wallGradient;

            this.blocks.forEach((cellKey) => {

                const [x, y] = cellKey.split(",").map(Number);

                const px = x * CELL;
                const py = y * CELL;

                ctx.save();

                /* Todos los bloques miden CELL y comparten paleta: se
                   reutiliza un único degradado trasladando el contexto. */
                ctx.translate(px, py);

                canvasKit.fillRoundRect(
                    ctx, 1, 1, CELL - 2, CELL - 2, 5, gradient
                );

                ctx.strokeStyle = "rgba(255,255,255,0.07)";
                ctx.lineWidth = 1;

                canvasKit.roundRect(ctx, px + 1, py + 1, CELL - 2, CELL - 2, 5);
                ctx.stroke();

                ctx.restore();

            });

        }


        drawPortals() {

            if (!this.portals.length) {
                return;
            }

            const { ctx } = this.stage;

            const pulse = 0.5 + Math.sin(this.foodPulse / 260) * 0.5;

            this.portals.forEach((portal) => {

                [portal.a, portal.b].forEach((point, index) => {

                    const cx = point.x * CELL + CELL / 2;
                    const cy = point.y * CELL + CELL / 2;

                    const radius = 9 + pulse * 3 + index * 0.5;

                    ctx.save();

                    ctx.strokeStyle = portal.hue;
                    ctx.shadowColor = portal.hue;
                    ctx.shadowBlur = 16 + pulse * 10;
                    ctx.lineWidth = 2;

                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.globalAlpha = 0.35 + pulse * 0.3;

                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
                    ctx.fillStyle = portal.hue;
                    ctx.fill();

                    ctx.restore();

                });

            });

        }


        drawFood() {

            const { ctx } = this.stage;

            const info = FOOD_TYPES[this.food.type] || FOOD_TYPES.normal;

            const pulse = 0.5 + Math.sin(this.foodPulse / 200) * 0.5;

            const cx = this.food.x * CELL + CELL / 2;
            const cy = this.food.y * CELL + CELL / 2;

            const radius = (this.food.type === "normal" ? 7 : 9) + pulse * 2.5;

            ctx.save();

            ctx.shadowColor = info.color;
            ctx.shadowBlur = 18 + pulse * 14;

            ctx.fillStyle = info.color;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();


            /* Anillo de caducidad */
            if (this.food.life > 0) {

                ctx.save();

                ctx.strokeStyle = "rgba(255,255,255,0.35)";
                ctx.lineWidth = 2;

                ctx.beginPath();

                ctx.arc(
                    cx,
                    cy,
                    radius + 7,
                    -Math.PI / 2,
                    -Math.PI / 2 + (this.food.life / SPECIAL_LIFE) * Math.PI * 2
                );

                ctx.stroke();

                ctx.restore();

            }


            if (info.glyph) {

                canvasKit.text(ctx, info.glyph, cx, cy + 1, {
                    font: "700 15px 'JetBrains Mono', monospace",
                    color: "#0B0D14"
                });

            } else {

                ctx.fillStyle = "rgba(255,255,255,0.85)";

                ctx.beginPath();
                ctx.arc(cx - 2, cy - 2, radius * 0.28, 0, Math.PI * 2);
                ctx.fill();

            }

        }


        drawSnake() {

            const { ctx } = this.stage;

            const total = this.snake.length;

            for (let i = total - 1; i >= 0; i -= 1) {

                const segment = this.snake[i];

                const t = total > 1 ? i / (total - 1) : 0;

                const r = Math.round(utils.lerp(COLOR_HEAD[0], COLOR_TAIL[0], t));
                const g = Math.round(utils.lerp(COLOR_HEAD[1], COLOR_TAIL[1], t));
                const b = Math.round(utils.lerp(COLOR_HEAD[2], COLOR_TAIL[2], t));

                let color = `rgb(${r}, ${g}, ${b})`;

                /* Escudo activo: la cabeza cambia de color */
                if (i === 0 && this.effects.shield > 0) {
                    color = "#C4B5FD";
                }

                const inset = 2 + t * 1.5;

                const x = segment.x * CELL + inset;
                const y = segment.y * CELL + inset;
                const size = CELL - inset * 2;

                ctx.save();

                if (this.effects.ghost > 0) {
                    ctx.globalAlpha = 0.55;
                }

                if (i === 0) {

                    ctx.save();

                    ctx.shadowColor = color;
                    ctx.shadowBlur = 22;

                    canvasKit.fillRoundRect(ctx, x, y, size, size, 8, color);

                    ctx.restore();

                    this.drawEyes(segment, x, y, size);

                } else {

                    ctx.globalAlpha *= 1 - t * 0.25;

                    canvasKit.fillRoundRect(ctx, x, y, size, size, 7, color);

                }

                ctx.restore();

            }

        }


        drawEyes(segment, x, y, size) {

            const { ctx } = this.stage;

            const { x: dx, y: dy } = this.direction;

            const centerX = x + size / 2;
            const centerY = y + size / 2;

            const offsetX = dx * 4;
            const offsetY = dy * 4;

            const perpX = -dy * 5;
            const perpY = dx * 5;

            ctx.fillStyle = "#06070B";

            [1, -1].forEach((side) => {

                ctx.beginPath();

                ctx.arc(
                    centerX + offsetX + perpX * side,
                    centerY + offsetY + perpY * side,
                    2.6,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

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

            if (this.effects.slow > 0) {
                chips.push({
                    label: `LENTO ${Math.ceil(this.effects.slow / 1000)}s`,
                    color: "#22D3EE"
                });
            }

            if (this.effects.shield > 0) {
                chips.push({
                    label: `ESCUDO ${Math.ceil(this.effects.shield / 1000)}s`,
                    color: "#C4B5FD"
                });
            }

            if (this.effects.ghost > 0) {
                chips.push({
                    label: `FANTASMA ${Math.ceil(this.effects.ghost / 1000)}s`,
                    color: "#F5F7FF"
                });
            }

            if (!chips.length) {
                return;
            }

            let x = 12;

            chips.forEach((chip) => {

                const width = 14 + chip.label.length * 7.2;

                ctx.save();

                ctx.globalAlpha = 0.9;

                canvasKit.fillRoundRect(
                    ctx,
                    x,
                    this.H - 30,
                    width,
                    20,
                    6,
                    "rgba(6,7,11,0.85)"
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

            const alpha = utils.clamp(this.flash / 420, 0, 1) * 0.35;

            ctx.save();

            ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;

            ctx.fillRect(0, 0, this.W, this.H);

            ctx.restore();

        }

    }


    /* ---------------------------------------------------------
       REGISTRO
       --------------------------------------------------------- */

    A.registerGame({

        id: "snake",
        number: "01",
        name: "SNAKE",
        genre: "CLASSIC / ARCADE",
        mode: "4 WORLDS",

        music: "arcade",

        accent: "var(--color-lime)",
        accentRgb: "163 230 53",
        cardRgb: "163 230 53",

        /* La serpiente se estira hasta donde haya sitio */
        ratioMin: 0.9,
        ratioMax: 2.1,

        preview: `
            <span class="preview preview--snake">
                <i class="preview__seg preview__seg--1"></i>
                <i class="preview__seg preview__seg--2"></i>
                <i class="preview__seg preview__seg--3"></i>
                <i class="preview__seg preview__seg--4"></i>
                <i class="preview__seg preview__seg--5"></i>
                <i class="preview__food"></i>
            </span>
        `,

        readyTitle: "READY?",
        readyText: "Elige mundo: NEO (libre), RUINAS (escombros), LABERINTO (pasillos) y NEXO (pilares y portales).",
        readyHint: "ENTER — EMPEZAR    P — PAUSA    ESC — SALIR",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.stat("level", "LEVEL", "1")}
            ${A.ui.stat("apples", "FOOD", "0")}
            ${A.ui.stat("length", "LEN", "3")}
        `,

        controls: `
            ${A.ui.switcher("world", [
                { value: "neo", label: "NEO" },
                { value: "ruinas", label: "RUINAS" },
                { value: "laberinto", label: "LABERINTO" },
                { value: "nexo", label: "NEXO" }
            ])}
            ${A.ui.switcher("speed", [
                { value: "calm", label: "CALM" },
                { value: "normal", label: "NORMAL" },
                { value: "fury", label: "FURY" }
            ])}
        `,

        hint: "WASD / FLECHAS — MOVER    P — PAUSA    ESC — SALIR",

        create(shell) {
            return new SnakeGame(shell);
        }

    });

})(window.Arcade404);
