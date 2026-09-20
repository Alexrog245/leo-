/* =========================================================
   ARCADE 404 — GAME 04 · BREAKER
   5 niveles, bloques blindados y 6 power-ups:
   ANCHO · LENTO · MULTIBOLA · VIDA · LÁSER · PEGAMENTO
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       CONSTANTES
       --------------------------------------------------------- */

    const BASE_H = 720;

    const PADDLE_W = 92;
    const PADDLE_H = 14;
    const PADDLE_Y = BASE_H - 56;
    const PADDLE_SPEED = 620;

    const BALL_R = 7;
    const BALL_SPEED = 430;

    let COLS = 9;                  /* según el mundo */
    const MAX_ROWS = 9;

    const BRICK_TOP = 78;
    const BRICK_H = 24;
    const BRICK_GAP = 5;
    const MIN_BRICK_W = 34;
    const MARGIN = 20;

    let BRICK_W = 58;              /* se recalcula en createBricks() */


    /* ---------------------------------------------------------
       MUNDOS
       Cada mundo trae su paleta, su anchura de rejilla y sus
       propios niveles. Los caracteres:
         1/2/3  golpes que aguanta el ladrillo
         9      blindado (no se rompe)
         4/5    verdes (trébol)   0      hueco
       --------------------------------------------------------- */

    const WORLDS = [

        {
            id: "clasico",
            name: "CLÁSICO",
            label: "CLÁSICO",
            bg: "#070A10",
            levels: [

                [
                    "111111111",
                    "111111111",
                    "222222222",
                    "111111111",
                    "000000000",
                    "000000000"
                ],

                [
                    "211111112",
                    "122222221",
                    "211111112",
                    "001111100",
                    "000000000",
                    "000000000"
                ],

                [
                    "129999921",
                    "129111921",
                    "111212111",
                    "001111100",
                    "000000000",
                    "000000000"
                ],

                [
                    "000111000",
                    "001222100",
                    "012333210",
                    "123333321",
                    "001111100",
                    "000000000"
                ],

                [
                    "939999939",
                    "931111139",
                    "912222219",
                    "911333119",
                    "001111100",
                    "000000000"
                ]

            ]
        },

        {
            id: "arcade",
            name: "ARCADE",
            label: "ARCADE",
            bg: "#0A0710",
            levels: [

                /* CORAZÓN */
                [
                    ".22...22...",
                    "2222.2222..",
                    "22222222222",
                    "22222222222",
                    ".222222222.",
                    "..2222222..",
                    "...22222..."
                ],

                /* CALAVERA */
                [
                    "..3333333..",
                    ".333333333.",
                    "33.33.33.33",
                    "33333333333",
                    ".333333333.",
                    "..3.3.3.3.."
                ],

                /* FLECHA */
                [
                    ".....1.....",
                    "....111....",
                    "...11111...",
                    "..1111111..",
                    ".111111111.",
                    ".....1.....",
                    ".....1....."
                ],

                /* ZIGZAG BLINDADO */
                [
                    "222.....222",
                    ".222...222.",
                    "..222.222..",
                    "...22922...",
                    "..222.222..",
                    ".222...222.",
                    "222.....222"
                ]

            ]
        },

        {
            id: "trebol",
            name: "TRÉBOL",
            label: "TRÉBOL",
            bg: "#04120A",
            levels: [

                /* TRÉBOL DE 4 HOJAS */
                [
                    ".444.....444.",
                    "44444...44444",
                    "44444...44444",
                    "..444555444..",
                    "..444555444..",
                    "44444...44444",
                    "44444...44444",
                    ".444.....444.",
                    "......33....."
                ],

                /* HERRADURA DE LA SUERTE */
                [
                    "333.......333",
                    "3334.....4333",
                    ".333.....333.",
                    ".333.....333.",
                    "..334...433..",
                    "...3444443...",
                    "....33333...."
                ],

                /* ARCOÍRIS SOBRE EL Muro */
                [
                    "..111111111..",
                    ".22222222222.",
                    "3333333333333",
                    "3333333333333",
                    ".44444444444.",
                    "..444444444..",
                    "...9999999..."
                ]

            ]
        },

        {
            id: "neon",
            name: "NEÓN",
            label: "NEÓN",
            bg: "#0A0614",
            backdrop: true,
            levels: [

                /* ESTRELLA BLINDADA */
                [
                    "......9......",
                    ".....999.....",
                    "9999222999999",
                    ".99922222999.",
                    "..992222299..",
                    "...9222229...",
                    "..999...999..",
                    ".99.......99."
                ],

                /* JAULA DE NEÓN */
                [
                    "9999999999999",
                    "9333333333339",
                    "9322222222239",
                    "9321111111239",
                    "9322222222239",
                    "9333333333339",
                    "9999999999999"
                ],

                /* HÉLICE */
                [
                    "9999999......",
                    "9222229......",
                    "9222222999999",
                    "9999999222229",
                    "......9222229",
                    "......9999999"
                ]

            ]
        }

    ];



    const BRICK_COLORS = {
        1: ["#FBBF24", "#FB923C"],
        2: ["#22D3EE", "#3B82F6"],
        3: ["#A3E635", "#22C55E"],
        4: ["#4ADE80", "#15803D"],
        5: ["#86EFAC", "#166534"],
        solid: ["#5B6070", "#3A3F4C"]
    };


    const POWERUPS = {

        W: { label: "W", name: "ANCHO",     color: "#22D3EE", duration: 12000 },
        S: { label: "S", name: "LENTO",     color: "#A3E635", duration: 10000 },
        M: { label: "M", name: "MULTIBOLA", color: "#F43F5E", duration: 0 },
        L: { label: "L", name: "VIDA",      color: "#FBBF24", duration: 0 },
        A: { label: "A", name: "LÁSER",     color: "#8B5CF6", duration: 9000 },
        C: { label: "C", name: "PEGAMENTO", color: "#F5F7FF", duration: 12000 }

    };

    const POWERUP_KEYS = Object.keys(POWERUPS);

    const LASER_SPEED = 720;
    const LASER_COOLDOWN = 200;


    /* ---------------------------------------------------------
       JUEGO
       --------------------------------------------------------- */

    class BreakerGame {

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

            this.stars = canvasKit.createStars(this.stage, 45);

            this.worldId = "clasico";
            this.level = 1;
            this.score = 0;
            this.lives = 3;

            this.effects = {};

            this.resetLevel();
            this.resetRun();

            this.bindWorld();
            this.bindPointer();

            shell.setTouchControls({
                mode: "pointer",
                hint: "ARRASTRA PARA MOVER LA PALA — TOCA PARA LANZAR"
            });

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        resetRun() {

            this.level = 1;
            this.score = 0;
            this.lives = 3;

            this.effects = {};

            this.resetLevel();

        }


        resetLevel() {

            const levels = this.world.levels;

            this.bricks = this.createBricks(
                levels[utils.clamp(this.level - 1, 0, levels.length - 1)]
            );

            this.paddle = {
                x: this.W / 2,
                width: PADDLE_W,
                targetX: this.W / 2
            };

            this.powerups = [];
            this.lasers = [];
            this.particles = [];

            this.laserCooldown = 0;

            this.resetBall();

            this.updateStats();

            this.render();

        }


        resetBall() {

            this.balls = [
                {
                    x: this.paddle.x,
                    y: PADDLE_Y - BALL_R - 2,
                    vx: 0,
                    vy: 0,
                    stuck: true
                }
            ];

            this.speed = BALL_SPEED + (this.level - 1) * 30;

        }


        createBricks(pattern) {

            const bricks = [];

            COLS = Math.max(
                1,
                Math.max.apply(null, pattern.map((line) => line.length))
            );

            BRICK_W = Math.max(
                MIN_BRICK_W,
                (this.W - MARGIN * 2 - BRICK_GAP * (COLS - 1)) / COLS
            );

            const offsetX = (this.W - (COLS * BRICK_W + BRICK_GAP * (COLS - 1))) / 2;

            pattern.forEach((line, row) => {

                for (let col = 0; col < COLS; col += 1) {

                    const char = line[col] || "0";

                    if (char === "0" || char === ".") {
                        continue;
                    }

                    const solid = char === "9";

                    bricks.push({
                        x: offsetX + col * (BRICK_W + BRICK_GAP),
                        y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
                        width: BRICK_W,
                        height: BRICK_H,
                        hp: solid ? Infinity : parseInt(char, 10),
                        maxHp: solid ? Infinity : parseInt(char, 10),
                        solid,
                        row
                    });

                }

            });

            return bricks;

        }


        start() {
            this.resetRun();
        }


        restart() {
            this.resetRun();
        }


        /* ---------------------------------------------------------
           Medidas adaptativas
           --------------------------------------------------------- */

        measure() {

            const ratio = this.shell.stageRatio || 0.86;

            const width = utils.clamp(
                Math.round(BASE_H * ratio),
                600,
                1140
            );

            const changed = width !== this.W;

            this.W = width;
            this.H = BASE_H;

            if (this.stage) {
                this.stage.setLogical(width, BASE_H);
            }

            return changed;

        }


        layout() {

            if (this.shell.state === "running") {
                return;
            }

            if (this.measure()) {
                this.resetLevel();
            }

        }


        get world() {

            return WORLDS.find((item) => item.id === this.worldId) ||
                WORLDS[0];

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

                    this.resetRun();

                });

            });

        }


        destroy() {

            this.unbindPointer();

            this.stage.destroy();

        }


        /* ---------------------------------------------------------
           Entrada
           --------------------------------------------------------- */

        bindPointer() {

            const canvas = this.stage.canvas;

            this._onPointerMove = (event) => {

                const point = this.stage.toLogical(
                    event.clientX,
                    event.clientY
                );

                this.paddle.targetX = point.x;

            };

            this._onPointerDown = (event) => {

                const point = this.stage.toLogical(
                    event.clientX,
                    event.clientY
                );

                this.paddle.targetX = point.x;

                this.action();

            };

            canvas.addEventListener("pointermove", this._onPointerMove);
            canvas.addEventListener("pointerdown", this._onPointerDown);

        }


        unbindPointer() {

            if (this._onPointerMove) {
                this.stage.canvas.removeEventListener(
                    "pointermove",
                    this._onPointerMove
                );
            }

            if (this._onPointerDown) {
                this.stage.canvas.removeEventListener(
                    "pointerdown",
                    this._onPointerDown
                );
            }

        }


        /** ESPACIO / clic: lanzar, disparar láser o soltar bola pegada */
        action() {

            if (this.effects.A > 0) {
                this.fireLaser();
            }

            this.launch();

        }


        launch() {

            let launched = false;

            this.balls.forEach((ball) => {

                if (!ball.stuck) {
                    return;
                }

                ball.stuck = false;

                const angle = utils.rand(-0.5, 0.5) - Math.PI / 2;

                ball.vx = Math.cos(angle) * this.speed;
                ball.vy = Math.sin(angle) * this.speed;

                launched = true;

            });

            if (launched) {
                A.audio.play("bounce");
            }

        }


        fireLaser() {

            if (this.laserCooldown > 0) {
                return;
            }

            this.laserCooldown = LASER_COOLDOWN;

            [-1, 1].forEach((side) => {

                this.lasers.push({
                    x: this.paddle.x + side * (this.paddle.width / 2 - 8),
                    y: PADDLE_Y - 8
                });

            });

            A.audio.play("shoot");

        }


        key(key) {

            if (key === " " || key === "Spacebar") {

                this.action();

                return true;

            }

            return (
                key === "ArrowLeft" ||
                key === "ArrowRight" ||
                key === "a" ||
                key === "d"
            );

        }


        /* ---------------------------------------------------------
           Lógica
           --------------------------------------------------------- */

        update(dt) {

            const seconds = dt / 1000;

            canvasKit.starfield(this.stage, this.stars, 1, dt);

            if (this.laserCooldown > 0) {
                this.laserCooldown -= dt;
            }

            this.updatePaddle(seconds);
            this.updateEffects(dt);
            this.updateBalls(dt, seconds);
            this.updateLasers(dt, seconds);
            this.updatePowerups(dt, seconds);
            this.updateParticles(dt);

        }


        updatePaddle(seconds) {

            const input = A.input;

            let move = 0;

            if (input.isDown("ArrowLeft") || input.isDown("a")) {
                move -= 1;
            }

            if (input.isDown("ArrowRight") || input.isDown("d")) {
                move += 1;
            }

            if (move !== 0) {
                this.paddle.targetX += move * PADDLE_SPEED * seconds;
            }

            const width = this.effects.W > 0 ? PADDLE_W * 1.6 : PADDLE_W;

            this.paddle.width = utils.lerp(this.paddle.width, width, 0.12);

            this.paddle.targetX = utils.clamp(
                this.paddle.targetX,
                this.paddle.width / 2,
                this.W - this.paddle.width / 2
            );

            this.paddle.x = utils.lerp(
                this.paddle.x,
                this.paddle.targetX,
                0.28
            );

        }


        updateEffects(dt) {

            Object.keys(this.effects).forEach((key) => {

                if (this.effects[key] > 0) {

                    this.effects[key] -= dt;

                    if (this.effects[key] <= 0) {
                        delete this.effects[key];
                    }

                }

            });

        }


        updateBalls(dt, seconds) {

            const slow = this.effects.S > 0 ? 0.65 : 1;

            for (let i = this.balls.length - 1; i >= 0; i -= 1) {

                const ball = this.balls[i];

                if (ball.stuck) {

                    ball.x = this.paddle.x;
                    ball.y = PADDLE_Y - BALL_R - 2;

                    continue;

                }

                ball.x += ball.vx * seconds * slow;
                ball.y += ball.vy * seconds * slow;


                /* Paredes */
                if (ball.x - BALL_R <= 0) {

                    ball.x = BALL_R;
                    ball.vx *= -1;

                    A.audio.play("bounce");

                } else if (ball.x + BALL_R >= this.W) {

                    ball.x = this.W - BALL_R;
                    ball.vx *= -1;

                    A.audio.play("bounce");

                }

                if (ball.y - BALL_R <= 0) {

                    ball.y = BALL_R;
                    ball.vy *= -1;

                    A.audio.play("bounce");

                }


                /* Pala */
                if (
                    ball.vy > 0 &&
                    ball.y + BALL_R >= PADDLE_Y &&
                    ball.y - BALL_R <= PADDLE_Y + PADDLE_H &&
                    ball.x >= this.paddle.x - this.paddle.width / 2 - BALL_R &&
                    ball.x <= this.paddle.x + this.paddle.width / 2 + BALL_R
                ) {

                    const offset = utils.clamp(
                        (ball.x - this.paddle.x) / (this.paddle.width / 2),
                        -1,
                        1
                    );

                    const angle = offset * 1.0 - Math.PI / 2;

                    const magnitude = Math.max(
                        Math.hypot(ball.vx, ball.vy),
                        this.speed
                    );

                    ball.vx = Math.cos(angle) * magnitude;
                    ball.vy = Math.sin(angle) * magnitude;

                    ball.y = PADDLE_Y - BALL_R - 1;

                    /* PEGAMENTO: la bola se queda pegada */
                    if (this.effects.C > 0) {
                        ball.stuck = true;
                    }

                    A.audio.play("bounce");

                    this.spawnParticles(ball.x, PADDLE_Y, 6, "#8B5CF6");

                }


                this.hitBricks(ball);


                if (ball.y - BALL_R > this.H) {
                    this.balls.splice(i, 1);
                }

            }


            if (this.balls.length === 0) {

                this.loseLife();

                return;

            }


            this.checkLevel();

        }


        hitBricks(ball) {

            for (let i = 0; i < this.bricks.length; i += 1) {

                const brick = this.bricks[i];

                if (
                    ball.x + BALL_R < brick.x ||
                    ball.x - BALL_R > brick.x + brick.width ||
                    ball.y + BALL_R < brick.y ||
                    ball.y - BALL_R > brick.y + brick.height
                ) {
                    continue;
                }


                const overlapLeft = (ball.x + BALL_R) - brick.x;
                const overlapRight = (brick.x + brick.width) - (ball.x - BALL_R);
                const overlapTop = (ball.y + BALL_R) - brick.y;
                const overlapBottom = (brick.y + brick.height) - (ball.y - BALL_R);

                const minX = Math.min(overlapLeft, overlapRight);
                const minY = Math.min(overlapTop, overlapBottom);

                if (minX < minY) {

                    ball.vx *= -1;
                    ball.x += ball.vx > 0 ? minX : -minX;

                } else {

                    ball.vy *= -1;
                    ball.y += ball.vy > 0 ? minY : -minY;

                }


                this.damageBrick(brick, i);

                return;

            }

        }


        /** Devuelve true si el ladrillo se destruyó */
        damageBrick(brick, index) {

            if (brick.solid) {

                A.audio.play("hit");

                return false;

            }

            brick.hp -= 1;

            if (brick.hp > 0) {

                this.score += 10 * this.level;

                A.audio.play("hit");

                return false;

            }


            this.bricks.splice(index, 1);

            this.score += 50 * this.level;

            this.spawnParticles(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                12,
                BRICK_COLORS[brick.maxHp]
                    ? BRICK_COLORS[brick.maxHp][0]
                    : "#FBBF24"
            );

            if (Math.random() < 0.2) {

                this.powerups.push({
                    x: brick.x + brick.width / 2,
                    y: brick.y + brick.height / 2,
                    type: utils.pick(POWERUP_KEYS),
                    vy: 130
                });

            }

            A.audio.play("brick");

            this.updateStats();

            return true;

        }


        updateLasers(dt, seconds) {

            if (!this.lasers.length) {
                return;
            }

            for (let i = this.lasers.length - 1; i >= 0; i -= 1) {

                const bolt = this.lasers[i];

                bolt.y -= LASER_SPEED * seconds;

                if (bolt.y < -20) {

                    this.lasers.splice(i, 1);

                    continue;

                }

                for (let b = 0; b < this.bricks.length; b += 1) {

                    const brick = this.bricks[b];

                    if (
                        bolt.x >= brick.x &&
                        bolt.x <= brick.x + brick.width &&
                        bolt.y <= brick.y + brick.height &&
                        bolt.y >= brick.y
                    ) {

                        this.spawnParticles(
                            bolt.x,
                            brick.y + brick.height,
                            6,
                            "#8B5CF6"
                        );

                        this.damageBrick(brick, b);

                        this.lasers.splice(i, 1);

                        break;

                    }

                }

            }

            this.checkLevel();

        }


        updatePowerups(dt, seconds) {

            const paddleLeft = this.paddle.x - this.paddle.width / 2;
            const paddleRight = this.paddle.x + this.paddle.width / 2;

            for (let i = this.powerups.length - 1; i >= 0; i -= 1) {

                const item = this.powerups[i];

                item.y += item.vy * seconds;

                if (
                    item.y + 10 >= PADDLE_Y &&
                    item.y - 10 <= PADDLE_Y + PADDLE_H &&
                    item.x >= paddleLeft &&
                    item.x <= paddleRight
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

                case "M":

                    if (this.balls.length) {

                        const source = this.balls[0];

                        for (let i = 0; i < 2; i += 1) {

                            const angle = utils.rand(-0.9, 0.9) - Math.PI / 2;

                            this.balls.push({
                                x: source.x,
                                y: source.y,
                                vx: Math.cos(angle) * this.speed,
                                vy: Math.sin(angle) * this.speed,
                                stuck: source.stuck
                            });

                        }

                    }

                    break;

                case "L":

                    this.lives = Math.min(6, this.lives + 1);
                    this.shell.setLives("lives", this.lives);

                    break;

                default:

                    this.effects[type] = info.duration;

                    break;

            }


            this.score += 25;

            this.updateStats();

        }


        loseLife() {

            this.lives -= 1;

            A.audio.play("explode");

            this.shell.setLives("lives", this.lives);

            this.effects = {};

            this.lasers = [];

            if (this.lives <= 0) {

                this.shell.gameOver({
                    taunt: true,
                    text: `Te quedaste en el nivel ${this.level}.`,
                    score: this.score
                });

                return;

            }

            this.resetBall();

        }


        checkLevel() {

            const remaining = this.bricks.filter((brick) => !brick.solid);

            if (remaining.length > 0) {
                return;
            }

            this.level += 1;

            this.score += 250 * (this.level - 1);

            A.audio.play("win");

            /* La máquina niega haber perdido el muro */
            this.shell.levelUpTaunt();

            if (this.level > this.world.levels.length) {

                this.shell.win({
                    taunt: true,
                    title: "WORLD CLEARED",
                    text: `Has demolido el mundo ${this.world.name}.`,
                    score: this.score
                });

                return;

            }

            this.resetLevel();

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
            this.shell.setStat(
                "level",
                `${this.level}/${this.world.levels.length}`
            );
            this.shell.setStat("bricks", this.bricks.filter((b) => !b.solid).length);
            this.shell.setStat("balls", this.balls.length);
            this.shell.setLives("lives", this.lives);

        }


        /* ---------------------------------------------------------
           Partículas
           --------------------------------------------------------- */

        spawnParticles(x, y, count, color) {

            for (let i = 0; i < count; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.06 + Math.random() * 0.28;

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

            if (this.world.backdrop && A.pixelArt) {
                A.pixelArt.drawBackdrop(ctx, this.stage, {
                    alpha: 0.06,
                    fraction: 0.66
                });
            }

            this.drawStars();
            this.drawBricks();
            this.drawLasers();
            this.drawPowerups();
            this.drawPaddle();
            this.drawBalls();
            this.drawParticles();
            this.drawEffects();

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


        /* Degradados de ladrillo cacheados. La clave incluye la altura
           porque el degradado es vertical y depende de ella. */
        brickGradient(ctx, colors, brick) {

            if (!this._brickGradients) {
                this._brickGradients = new Map();
            }

            const key = colors[0] + "|" + colors[1] + "|" + Math.round(brick.height);

            let entry = this._brickGradients.get(key);

            if (!entry) {

                entry = ctx.createLinearGradient(0, 0, 0, brick.height);

                entry.addColorStop(0, colors[0]);
                entry.addColorStop(1, colors[1]);

                this._brickGradients.set(key, entry);

            }

            return entry;

        }


        drawBricks() {

            const { ctx } = this.stage;

            this.bricks.forEach((brick) => {

                const colors = brick.solid
                    ? BRICK_COLORS.solid
                    : (BRICK_COLORS[brick.hp] || BRICK_COLORS[1]);

                /* Los ladrillos comparten alto y paleta: se cachea un
                   degradado por combinación en vez de crear uno por
                   ladrillo y por frame. */
                const gradient = this.brickGradient(ctx, colors, brick);

                ctx.save();

                if (!brick.solid) {
                    ctx.shadowColor = colors[0];
                    ctx.shadowBlur = 12;
                }

                /* El degradado cacheado vive en coordenadas locales
                   (0,0)-(0,alto), así que trasladamos el contexto. */
                ctx.translate(brick.x, brick.y);

                canvasKit.fillRoundRect(
                    ctx, 0, 0, brick.width, brick.height, 5, gradient
                );

                ctx.restore();

                ctx.save();

                ctx.globalAlpha = 0.22;
                ctx.fillStyle = "#FFFFFF";

                canvasKit.fillRoundRect(
                    ctx, brick.x + 3, brick.y + 3, brick.width - 6, 4, 2, "#FFFFFF"
                );

                ctx.restore();

            });

        }


        drawPaddle() {

            const { ctx } = this.stage;

            const x = this.paddle.x - this.paddle.width / 2;

            const gradient = ctx.createLinearGradient(
                x, PADDLE_Y, x, PADDLE_Y + PADDLE_H
            );

            const wide = this.effects.W > 0;
            const laser = this.effects.A > 0;
            const sticky = this.effects.C > 0;

            gradient.addColorStop(0, laser ? "#C4B5FD" : wide ? "#22D3EE" : "#8B5CF6");
            gradient.addColorStop(1, laser ? "#8B5CF6" : wide ? "#3B82F6" : "#6D28D9");

            ctx.save();

            ctx.shadowColor = laser ? "#8B5CF6" : wide ? "#22D3EE" : "#8B5CF6";
            ctx.shadowBlur = 20;

            canvasKit.fillRoundRect(
                ctx, x, PADDLE_Y, this.paddle.width, PADDLE_H, 7, gradient
            );

            ctx.restore();


            /* Cañones láser */
            if (laser) {

                ctx.save();

                ctx.fillStyle = "#C4B5FD";

                [-1, 1].forEach((side) => {

                    ctx.fillRect(
                        this.paddle.x + side * (this.paddle.width / 2 - 8) - 2,
                        PADDLE_Y - 6,
                        4,
                        6
                    );

                });

                ctx.restore();

            }


            /* Indicador de pegamento */
            if (sticky) {

                ctx.save();

                ctx.strokeStyle = "rgba(245,247,255,0.55)";
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);

                ctx.beginPath();
                ctx.moveTo(x + 4, PADDLE_Y - 3);
                ctx.lineTo(x + this.paddle.width - 4, PADDLE_Y - 3);
                ctx.stroke();

                ctx.restore();

            }

        }


        drawBalls() {

            const { ctx } = this.stage;

            this.balls.forEach((ball) => {

                ctx.save();

                ctx.shadowColor = "#FFFFFF";
                ctx.shadowBlur = 18;
                ctx.fillStyle = "#FFFFFF";

                ctx.beginPath();
                ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

            });

        }


        drawLasers() {

            const { ctx } = this.stage;

            ctx.save();

            ctx.shadowColor = "#8B5CF6";
            ctx.shadowBlur = 14;

            this.lasers.forEach((bolt) => {

                ctx.fillStyle = "#C4B5FD";
                ctx.fillRect(bolt.x - 2, bolt.y - 14, 4, 16);

            });

            ctx.restore();

        }


        drawPowerups() {

            const { ctx } = this.stage;

            this.powerups.forEach((item) => {

                const info = POWERUPS[item.type];

                ctx.save();

                ctx.shadowColor = info.color;
                ctx.shadowBlur = 14;

                canvasKit.fillRoundRect(
                    ctx, item.x - 16, item.y - 10, 32, 20, 6, "rgba(6,7,11,0.9)"
                );

                ctx.restore();

                ctx.save();

                ctx.strokeStyle = info.color;
                ctx.lineWidth = 1.5;

                canvasKit.roundRect(ctx, item.x - 16, item.y - 10, 32, 20, 6);
                ctx.stroke();

                ctx.restore();

                canvasKit.text(ctx, info.label, item.x, item.y + 1, {
                    font: "700 11px 'JetBrains Mono', monospace",
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

            const active = Object.keys(this.effects);

            if (!active.length) {
                return;
            }

            let x = 22;

            active.forEach((key) => {

                const info = POWERUPS[key];

                if (!info) {
                    return;
                }

                const label =
                    `${info.name} ${Math.ceil(this.effects[key] / 1000)}s`;

                canvasKit.text(ctx, label, x, this.H - 18, {
                    font: "700 11px 'JetBrains Mono', monospace",
                    color: info.color,
                    align: "left"
                });

                x += ctx.measureText(label).width + 26;

            });

        }

    }


    /* ---------------------------------------------------------
       REGISTRO
       --------------------------------------------------------- */

    A.registerGame({

        id: "breaker",
        number: "04",
        name: "BREAKER",
        genre: "BLOCKS / ACTION",
        mode: "4 WORLDS",

        music: "arcade",

        accent: "var(--color-amber)",
        accentRgb: "251 191 36",
        cardRgb: "251 191 36",

        preview: `
            <span class="preview preview--breaker">

                <span class="preview__bricks">
                    <i></i><i></i><i></i><i></i><i></i>
                    <i></i><i></i><i></i><i></i><i></i>
                    <i></i><i></i><i></i><i></i><i></i>
                </span>

                <i class="preview__breaker-ball"></i>
                <i class="preview__breaker-paddle"></i>

            </span>
        `,

        /* El muro se estira en pantallas anchas */
        ratioMin: 0.8,
        ratioMax: 1.5,

        readyTitle: "SMASH",
        readyText: "4 mundos: CLÁSICO, ARCADE (corazón, calavera), TRÉBOL (trébol de 4 hojas) y NEÓN (jaulas blindadas).",
        readyHint: "ENTER — EMPEZAR    ESPACIO — LANZAR    ESC — SALIR",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.stat("level", "LEVEL", "1/5", { text: true })}
            ${A.ui.stat("bricks", "BRICKS", "0")}
            ${A.ui.lives("lives", 3)}
        `,

        controls: A.ui.switcher("world", [
            { value: "clasico", label: "CLÁSICO" },
            { value: "arcade", label: "ARCADE" },
            { value: "trebol", label: "TRÉBOL" },
            { value: "neon", label: "NEÓN" }
        ]),

        hint: "← → / RATÓN — PALA    ESPACIO — LANZAR / LÁSER    P — PAUSA    ESC — SALIR",

        create(shell) {
            return new BreakerGame(shell);
        }

    });

})(window.Arcade404);
