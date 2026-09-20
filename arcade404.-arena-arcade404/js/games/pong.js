/* =========================================================
   ARCADE 404 — GAME 03 · PONG
   1P contra la CPU (3 niveles) o 2 jugadores.
   Power-ups: PALA GRANDE · MULTIBOLA · RIVAL LENTO
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       CONSTANTES
       --------------------------------------------------------- */

    const BASE_H = 480;

    const PADDLE_W = 12;
    const PADDLE_H = 84;
    const PADDLE_MARGIN = 28;

    const PADDLE_SPEED = 430;

    const BALL_R = 8;
    const BALL_SPEED = 390;
    const BALL_MAX = 780;

    /* Límite de puntos elegible antes de empezar. El primero que
       llegue gana la partida. */
    const WIN_SCORES = [5, 7, 11, 15, 21];

    const DEFAULT_WIN_SCORE = 11;

    const CPU_LEVELS = {
        easy:   { speed: 235, error: 52, label: "EASY" },
        normal: { speed: 330, error: 28, label: "NORMAL" },
        hard:   { speed: 440, error: 10, label: "HARD" }
    };


    const POWERUPS = {

        B: { label: "B", name: "PALA GRANDE", color: "#22D3EE" },
        M: { label: "M", name: "MULTIBOLA",   color: "#A3E635" },
        S: { label: "S", name: "RIVAL LENTO", color: "#FBBF24" }

    };

    const POWERUP_KEYS = Object.keys(POWERUPS);

    const PICKUP_TIME = 9000;
    const EFFECT_TIME = 9000;


    /* ---------------------------------------------------------
       MUNDOS
       Cada mundo mete obstáculos (o gravedad) en la pista.
       --------------------------------------------------------- */

    const WORLDS = [

        {
            id: "clasico",
            name: "CLÁSICO",
            label: "CLÁSICO",
            bg: "#070A10",
            net: "rgba(255,255,255,0.14)",
            obstacles: null,
            gravity: 0
        },

        {
            id: "asteroides",
            name: "ASTEROIDES",
            label: "ASTEROIDES",
            bg: "#0A0906",
            net: "rgba(251,191,36,0.12)",
            gravity: 0,
            obstacles(w, h) {

                return [
                    {
                        x: w / 2 - 9,
                        y: h * 0.18,
                        w: 18,
                        h: 96,
                        vy: 70,
                        color: "#FBBF24"
                    },
                    {
                        x: w * 0.32 - 9,
                        y: h * 0.52,
                        w: 18,
                        h: 64,
                        vy: -52,
                        color: "#FB923C"
                    },
                    {
                        x: w * 0.68 - 9,
                        y: h * 0.3,
                        w: 18,
                        h: 64,
                        vy: 58,
                        color: "#FB923C"
                    }
                ];

            }
        },

        {
            id: "agujero",
            name: "AGUJERO NEGRO",
            label: "AGUJERO",
            bg: "#08060F",
            net: "rgba(139,92,246,0.12)",
            gravity: 620,
            obstacles: null
        },

        {
            id: "portal",
            name: "PÓRTAL",
            label: "PÓRTAL",
            bg: "#060D10",
            net: "rgba(34,211,238,0.12)",
            gravity: 0,
            obstacles(w, h) {

                const barW = Math.round(w * 0.2);

                return [
                    {
                        x: (w - barW) / 2,
                        y: 26,
                        w: barW,
                        h: 16,
                        vy: 0,
                        color: "#22D3EE"
                    },
                    {
                        x: (w - barW) / 2,
                        y: h - 42,
                        w: barW,
                        h: 16,
                        vy: 0,
                        color: "#22D3EE"
                    }
                ];

            }
        }

    ];


    /* ---------------------------------------------------------
       JUEGO
       --------------------------------------------------------- */

    class PongGame {

        constructor(shell) {

            this.shell = shell;

            this.W = 760;
            this.H = BASE_H;

            this.stage = A.createStage(shell.refs.stage, {
                width: this.W,
                height: this.H,
                background: "#070A10"
            });

            this.measure();

            this.twoPlayers = false;
            this.cpuLevel = "normal";
            this.worldId = "clasico";
            this.winScore = DEFAULT_WIN_SCORE;

            this.score = { left: 0, right: 0 };

            this.rally = 0;
            this.maxRally = utils.clamp(A.storage.getBest("pong"), 0, 9999);

            this.particles = [];

            this.resetMatch();

            this.bindWorld();
            this.bindModeSwitch();
            this.bindCpuSwitch();
            this.bindTargetSwitch();
            this.bindPointer();

            shell.setTouchControls({
                mode: "pointer",
                hint: "ARRASTRA EN EL ÁREA DE JUEGO PARA MOVER TU PALA"
            });

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        resetMatch() {

            this.score.left = 0;
            this.score.right = 0;

            this.paddles = {

                left: {
                    y: (this.H - PADDLE_H) / 2,
                    base: PADDLE_H,
                    big: 0,
                    slow: 0
                },

                right: {
                    y: (this.H - PADDLE_H) / 2,
                    base: PADDLE_H,
                    big: 0,
                    slow: 0
                }

            };

            this.pickup = null;
            this.pickupTimer = 5000;

            this.buildObstacles();

            this.lastHit = null;

            this.pointerLeft = null;
            this.pointerRight = null;

            this.resetBall(true);

            this.updateStats();

            this.render();

        }


        resetBall(toPlayer = false) {

            this.balls = [
                {
                    x: this.W / 2,
                    y: this.H / 2,
                    vx: 0,
                    vy: 0,
                    speed: BALL_SPEED,
                    radius: BALL_R,
                    trail: []
                }
            ];

            this.serveTimer = 850;

            this.serveToRight = !toPlayer;

            this.rally = 0;

            this.aiError = utils.rand(-1, 1) * this.cpu.error;

        }


        start() {
            this.resetMatch();
        }


        restart() {
            this.resetMatch();
        }


        /* ---------------------------------------------------------
           Medidas adaptativas
           --------------------------------------------------------- */

        measure() {

            const ratio = this.shell.stageRatio || 1.6;

            const width = utils.clamp(
                Math.round(BASE_H * ratio),
                720,
                1280
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
                this.resetMatch();
            }

        }


        get world() {

            return WORLDS.find((item) => item.id === this.worldId) ||
                WORLDS[0];

        }


        /* ---------------------------------------------------------
           Obstáculos del mundo
           --------------------------------------------------------- */

        buildObstacles() {

            const world = this.world;

            this.obstacles = [];

            if (!world.obstacles) {
                return;
            }

            world.obstacles(this.W, this.H).forEach((item) => {
                this.obstacles.push(item);
            });

        }


        updateObstacles(dt, seconds) {

            this.obstacles.forEach((obstacle) => {

                if (!obstacle.vy) {
                    return;
                }

                obstacle.y += obstacle.vy * seconds;

                if (obstacle.y < 40) {
                    obstacle.y = 40;
                    obstacle.vy = Math.abs(obstacle.vy);
                }

                if (obstacle.y + obstacle.h > this.H - 40) {
                    obstacle.y = this.H - 40 - obstacle.h;
                    obstacle.vy = -Math.abs(obstacle.vy);
                }

            });

        }


        /** Rebote de la bola contra los obstáculos del mundo */
        hitObstacles(ball, seconds) {

            for (let i = 0; i < this.obstacles.length; i += 1) {

                const obstacle = this.obstacles[i];

                const left = obstacle.x;
                const right = obstacle.x + obstacle.w;
                const top = obstacle.y;
                const bottom = obstacle.y + obstacle.h;

                const overlapLeft = (ball.x + ball.radius) - left;
                const overlapRight = right - (ball.x - ball.radius);
                const overlapTop = (ball.y + ball.radius) - top;
                const overlapBottom = bottom - (ball.y - ball.radius);

                if (
                    overlapLeft <= 0 ||
                    overlapRight <= 0 ||
                    overlapTop <= 0 ||
                    overlapBottom <= 0
                ) {
                    continue;
                }

                const minX = Math.min(overlapLeft, overlapRight);
                const minY = Math.min(overlapTop, overlapBottom);

                if (minX < minY) {

                    ball.vx *= -1;
                    ball.x += ball.vx > 0 ? minX : -minX;

                } else {

                    ball.vy *= -1;
                    ball.y += ball.vy > 0 ? minY : -minY;

                }

                ball.speed = Math.min(BALL_MAX, ball.speed + 12);

                const magnitude = Math.max(
                    1,
                    Math.hypot(ball.vx, ball.vy)
                );

                ball.vx = (ball.vx / magnitude) * ball.speed;
                ball.vy = (ball.vy / magnitude) * ball.speed;

                this.bounceEffect(
                    ball.x,
                    ball.y,
                    obstacle.color || "#FBBF24"
                );

                A.audio.play("hit");

                return true;

            }

            if (this.world.gravity) {
                this.applyGravity(ball, seconds);
            }

            return false;

        }


        /** Agujero negro: atrae la bola manteniendo la velocidad */
        applyGravity(ball, seconds) {

            const cx = this.W / 2;
            const cy = this.H / 2;

            const dx = cx - ball.x;
            const dy = cy - ball.y;

            const distance = Math.max(40, Math.hypot(dx, dy));

            const pull = this.world.gravity * (1 - distance / this.W);

            if (pull <= 0) {
                return;
            }

            ball.vx += (dx / distance) * pull * seconds;
            ball.vy += (dy / distance) * pull * seconds;

            const magnitude = Math.max(1, Math.hypot(ball.vx, ball.vy));

            ball.vx = (ball.vx / magnitude) * ball.speed;
            ball.vy = (ball.vy / magnitude) * ball.speed;

        }


        drawObstacles() {

            if (!this.obstacles.length) {
                return;
            }

            const { ctx } = this.stage;

            this.obstacles.forEach((obstacle) => {

                const color = obstacle.color || "#FBBF24";

                ctx.save();

                ctx.shadowColor = color;
                ctx.shadowBlur = 16;

                canvasKit.fillRoundRect(
                    ctx,
                    obstacle.x,
                    obstacle.y,
                    obstacle.w,
                    obstacle.h,
                    7,
                    color
                );

                ctx.restore();

            });

        }


        drawGravity() {

            if (!this.world.gravity) {
                return;
            }

            const { ctx } = this.stage;

            const cx = this.W / 2;
            const cy = this.H / 2;

            const pulse = 1 + Math.sin(this.pickupPulse = (this.pickupPulse || 0) + 3) * 0.02;

            const gradient = ctx.createRadialGradient(
                cx, cy, 4, cx, cy, 120 * pulse
            );

            gradient.addColorStop(0, "rgba(139, 92, 246, 0.55)");
            gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.14)");
            gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

            ctx.save();

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.arc(cx, cy, 120, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(196, 181, 253, 0.5)";
            ctx.lineWidth = 1.5;

            [64, 88, 112].forEach((radius) => {

                ctx.beginPath();
                ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
                ctx.stroke();

            });

            ctx.restore();

        }


        destroy() {

            this.unbindPointer();

            this.stage.destroy();

        }


        get cpu() {
            return CPU_LEVELS[this.cpuLevel] || CPU_LEVELS.normal;
        }


        paddleHeight(side) {

            const paddle = this.paddles[side];

            return paddle.base * (paddle.big > 0 ? 1.6 : 1);

        }


        paddleSpeed(side) {

            const paddle = this.paddles[side];

            return PADDLE_SPEED * (paddle.slow > 0 ? 0.45 : 1);

        }


        /* ---------------------------------------------------------
           Controles de la interfaz
           --------------------------------------------------------- */

        bindModeSwitch() {

            const buttons = utils.qsa("[data-mode]", this.shell.root);

            buttons.forEach((button) => {

                button.addEventListener("click", () => {

                    this.twoPlayers = button.dataset.mode === "2p";

                    buttons.forEach((item) => {

                        item.classList.toggle("is-active", item === button);

                    });

                    A.audio.play("select");

                    this.shell.setLog(
                        this.twoPlayers ? "2P LOCAL" : "1P vs CPU"
                    );

                    this.resetMatch();

                });

            });

        }


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

                    this.resetMatch();

                });

            });

        }


        /* Límite de puntos: se puede cambiar antes de empezar y
           reinicia el marcador para que la partida sea limpia. */
        bindTargetSwitch() {

            const buttons = utils.qsa("[data-target]", this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    Number(button.dataset.target) === this.winScore
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {
                        item.classList.toggle("is-active", item === button);
                    });

                    this.winScore = Number(button.dataset.target);

                    A.audio.play("select");

                    this.shell.setLog("A " + this.winScore + " PUNTOS");

                    this.resetMatch();

                    this.updateStats();

                });

            });

        }


        bindCpuSwitch() {

            const buttons = utils.qsa("[data-cpu]", this.shell.root);

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset.cpu === this.cpuLevel
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {

                        item.classList.toggle("is-active", item === button);

                    });

                    this.cpuLevel = button.dataset.cpu;

                    A.audio.play("select");

                    this.shell.setLog(
                        this.twoPlayers
                            ? "2P LOCAL"
                            : `CPU: ${this.cpu.label}`
                    );

                });

            });

        }


        bindPointer() {

            const canvas = this.stage.canvas;

            this._onPointerMove = (event) => {

                const point = this.stage.toLogical(
                    event.clientX,
                    event.clientY
                );

                if (this.twoPlayers) {

                    if (point.x < this.W / 2) {
                        this.pointerLeft = point.y;
                    } else {
                        this.pointerRight = point.y;
                    }

                } else {

                    this.pointerLeft = point.y;

                }

            };

            canvas.addEventListener("pointermove", this._onPointerMove);

        }


        unbindPointer() {

            if (this._onPointerMove) {

                this.stage.canvas.removeEventListener(
                    "pointermove",
                    this._onPointerMove
                );

            }

        }


        key(key) {

            /* El teclado se lee en update(): sólo evitamos el scroll */
            return (
                key === "ArrowUp" ||
                key === "ArrowDown" ||
                key === "w" ||
                key === "s"
            );

        }


        /* ---------------------------------------------------------
           Lógica
           --------------------------------------------------------- */

        update(dt) {

            const seconds = dt / 1000;

            this.updateEffects(dt);

            this.updatePaddles(seconds);

            if (this.serveTimer > 0) {

                this.serveTimer -= dt;

                if (this.serveTimer <= 0) {
                    this.serve();
                }

            } else {

                this.updateBalls(seconds);

            }

            this.updateObstacles(dt, seconds);
            this.updatePickup(dt, seconds);
            this.updateParticles(dt);

            this.updateStats();

        }


        updateEffects(dt) {

            ["left", "right"].forEach((side) => {

                const paddle = this.paddles[side];

                ["big", "slow"].forEach((key) => {

                    if (paddle[key] > 0) {

                        paddle[key] -= dt;

                        if (paddle[key] <= 0) {
                            paddle[key] = 0;
                        }

                    }

                });

            });

        }


        updatePaddles(seconds) {

            const input = A.input;

            /* Izquierda: W/S o puntero */
            let leftMove = 0;

            if (input.isDown("w")) {
                leftMove -= 1;
            }

            if (input.isDown("s")) {
                leftMove += 1;
            }

            this.movePaddle("left", leftMove, seconds, "pointerLeft");


            /* Derecha: CPU o jugador 2 */
            if (this.twoPlayers) {

                let rightMove = 0;

                if (input.isDown("ArrowUp")) {
                    rightMove -= 1;
                }

                if (input.isDown("ArrowDown")) {
                    rightMove += 1;
                }

                this.movePaddle("right", rightMove, seconds, "pointerRight");

            } else {

                this.updateAI(seconds);

            }

        }


        movePaddle(side, move, seconds, pointerKey) {

            const paddle = this.paddles[side];

            const height = this.paddleHeight(side);

            const speed = this.paddleSpeed(side);

            if (move !== 0) {

                this[pointerKey] = null;

                paddle.y = utils.clamp(
                    paddle.y + move * speed * seconds,
                    0,
                    this.H - height
                );

                return;

            }

            if (this[pointerKey] != null) {

                const center = paddle.y + height / 2;

                const delta = this[pointerKey] - center;

                const step = utils.clamp(
                    delta * 12 * seconds,
                    -speed * seconds,
                    speed * seconds
                );

                paddle.y = utils.clamp(
                    paddle.y + step,
                    0,
                    this.H - height
                );

            }

        }


        updateAI(seconds) {

            const height = this.paddleHeight("right");

            const speed = this.paddleSpeed("right") *
                (this.cpu.speed / 330);

            const ball = this.nearestBall("right");

            const incoming = ball && ball.vx > 0;

            const target = incoming
                ? ball.y + this.aiError
                : this.H / 2;

            const center = this.paddles.right.y + height / 2;

            const delta = target - center;

            const step = utils.clamp(delta, -speed * seconds, speed * seconds);

            this.paddles.right.y = utils.clamp(
                this.paddles.right.y + step,
                0,
                this.H - height
            );

        }


        nearestBall(side) {

            if (!this.balls.length) {
                return null;
            }

            let best = this.balls[0];

            for (let i = 1; i < this.balls.length; i += 1) {

                const ball = this.balls[i];

                if (side === "right" && ball.x > best.x) {
                    best = ball;
                }

                if (side === "left" && ball.x < best.x) {
                    best = ball;
                }

            }

            return best;

        }


        serve() {

            this.balls.forEach((ball) => {

                const angle = utils.rand(-0.42, 0.42);

                const direction = this.serveToRight ? -1 : 1;

                ball.vx = Math.cos(angle) * ball.speed * direction;
                ball.vy = Math.sin(angle) * ball.speed;

            });

            A.audio.play("bounce");

        }


        updateBalls(seconds) {

            const leftX = PADDLE_MARGIN;
            const rightX = this.W - PADDLE_MARGIN - PADDLE_W;

            const leftH = this.paddleHeight("left");
            const rightH = this.paddleHeight("right");

            for (let i = this.balls.length - 1; i >= 0; i -= 1) {

                const ball = this.balls[i];

                ball.x += ball.vx * seconds;
                ball.y += ball.vy * seconds;


                /* Rebote vertical */
                if (ball.y - ball.radius <= 0) {

                    ball.y = ball.radius;
                    ball.vy *= -1;

                    this.bounceEffect(ball.x, ball.y);

                } else if (ball.y + ball.radius >= this.H) {

                    ball.y = this.H - ball.radius;
                    ball.vy *= -1;

                    this.bounceEffect(ball.x, ball.y);

                }


                /* Obstáculos del mundo */
                this.hitObstacles(ball, seconds);

                /* Palas */
                if (
                    ball.vx < 0 &&
                    ball.x - ball.radius <= leftX + PADDLE_W &&
                    ball.x + ball.radius >= leftX &&
                    ball.y >= this.paddles.left.y &&
                    ball.y <= this.paddles.left.y + leftH
                ) {

                    this.paddleHit(ball, leftX + PADDLE_W, "left");

                } else if (
                    ball.vx > 0 &&
                    ball.x + ball.radius >= rightX &&
                    ball.x - ball.radius <= rightX + PADDLE_W &&
                    ball.y >= this.paddles.right.y &&
                    ball.y <= this.paddles.right.y + rightH
                ) {

                    this.paddleHit(ball, rightX, "right");

                }


                /* Puntos */
                if (ball.x < -20) {

                    this.balls.splice(i, 1);

                    this.point("right");

                    return;

                }

                if (ball.x > this.W + 20) {

                    this.balls.splice(i, 1);

                    this.point("left");

                    return;

                }


                /* Recogida de power-up */
                if (
                    this.pickup &&
                    Math.abs(ball.x - this.pickup.x) < ball.radius + 14 &&
                    Math.abs(ball.y - this.pickup.y) < ball.radius + 14
                ) {

                    this.collectPickup(this.lastHit || "left");

                }


                ball.trail.push({ x: ball.x, y: ball.y });

                if (ball.trail.length > 12) {
                    ball.trail.shift();
                }

            }

        }


        paddleHit(ball, contactX, side) {

            const height = this.paddleHeight(side);

            const paddleY = this.paddles[side].y;

            const relative = utils.clamp(
                (ball.y - (paddleY + height / 2)) / (height / 2),
                -1,
                1
            );

            const angle = relative * 0.9;

            ball.speed = Math.min(BALL_MAX, ball.speed + 18);

            const direction = side === "left" ? 1 : -1;

            ball.vx = Math.cos(angle) * ball.speed * direction;
            ball.vy = Math.sin(angle) * ball.speed;

            ball.x = side === "left"
                ? contactX + ball.radius + 1
                : contactX - ball.radius - 1;

            this.lastHit = side;

            this.rally += 1;

            this.maxRally = Math.max(this.maxRally, this.rally);

            this.aiError = utils.rand(-1, 1) * this.cpu.error;

            this.bounceEffect(
                ball.x,
                ball.y,
                side === "left" ? "#22D3EE" : "#F5F7FF"
            );

            A.audio.play("bounce");

        }


        point(side) {

            this.score[side] += 1;

            A.audio.play(side === "left" ? "score" : "hit");

            this.spawnParticles(
                side === "left" ? this.W - 10 : 10,
                this.balls.length ? this.balls[0].y : this.H / 2,
                18,
                side === "left" ? "#22D3EE" : "#F43F5E"
            );

            this.pickup = null;
            this.pickupTimer = 6000;


            if (this.score[side] >= this.winScore) {

                this.finish(side);

                return;

            }


            this.resetBall(side === "right");

            this.updateStats();

        }


        /* ---------------------------------------------------------
           Power-ups
           --------------------------------------------------------- */

        updatePickup(dt, seconds) {

            if (this.pickup) {

                this.pickup.pulse += dt;

                if (this.pickup.life > 0) {

                    this.pickup.life -= dt;

                    if (this.pickup.life <= 0) {
                        this.pickup = null;
                    }

                }

                return;

            }

            this.pickupTimer -= dt;

            if (this.pickupTimer > 0) {
                return;
            }

            this.pickup = {
                x: utils.rand(this.W * 0.32, this.W * 0.68),
                y: utils.rand(this.H * 0.2, this.H * 0.8),
                type: utils.pick(POWERUP_KEYS),
                life: PICKUP_TIME,
                pulse: 0
            };

            this.pickupTimer = 11000;

        }


        collectPickup(side) {

            if (!this.pickup) {
                return;
            }

            const info = POWERUPS[this.pickup.type];

            this.pickup = null;

            this.pickupTimer = 11000;

            A.audio.play("coin");

            const rival = side === "left" ? "right" : "left";


            switch (info.name) {

                case "PALA GRANDE":
                    this.paddles[side].big = EFFECT_TIME;
                    break;

                case "MULTIBOLA":

                    if (this.balls.length) {

                        const source = this.balls[0];

                        const angle = utils.rand(-0.7, 0.7);

                        const direction = source.vx > 0 ? 1 : -1;

                        this.balls.push({
                            x: source.x,
                            y: source.y,
                            vx: Math.cos(angle) * source.speed * direction,
                            vy: Math.sin(angle) * source.speed,
                            speed: source.speed,
                            radius: BALL_R,
                            trail: []
                        });

                    }

                    break;

                case "RIVAL LENTO":
                    this.paddles[rival].slow = 6000;
                    break;

                default:
                    break;

            }


            const px = side === "left"
                ? PADDLE_MARGIN + PADDLE_W
                : this.W - PADDLE_MARGIN - PADDLE_W;

            const py = this.paddles[side].y +
                this.paddleHeight(side) / 2;

            this.spawnParticles(px, py, 12, info.color);

        }


        finish(winner) {

            const versusCpu = !this.twoPlayers;

            const playerWon = this.twoPlayers || winner === "left";

            const result = A.storage.submitScore("pong", this.maxRally);

            this.maxRally = Math.max(this.maxRally, result.best);

            this.updateStats();

            const payload = {

                score: this.maxRally,
                scoreLabel: "BEST RALLY",
                scoreFormat: "raw",
                taunt: versusCpu,

                text: this.twoPlayers
                    ? `Gana el jugador ${winner === "left" ? "1" : "2"} por ${this.score.left} — ${this.score.right}.`
                    : winner === "left"
                        ? `Le has ganado a la CPU por ${this.score.left} — ${this.score.right}.`
                        : `La CPU te gana por ${this.score.right} — ${this.score.left}.`

            };

            if (playerWon) {

                this.shell.win(Object.assign({
                    title: "MATCH WON",
                    eyebrow: "VICTORY"
                }, payload));

            } else {

                this.shell.gameOver(Object.assign({
                    title: "MATCH LOST",
                    eyebrow: "DEFEAT"
                }, payload));

            }

        }


        /* ---------------------------------------------------------
           Partículas
           --------------------------------------------------------- */

        bounceEffect(x, y, color = "#22D3EE") {
            this.spawnParticles(x, y, 6, color);
        }


        spawnParticles(x, y, count, color) {

            for (let i = 0; i < count; i += 1) {

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.05 + Math.random() * 0.25;

                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: 0.002 + Math.random() * 0.002,
                    size: 2 + Math.random() * 2.5,
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


        updateStats() {

            /* Hilo narrativo: el capítulo salta al llegar a 5 puntos
               (el intercambio de la pelota que nadie quiere). */
            if (this.shell.checkStory) {
                this.shell.checkStory(this.score.left);
            }

            this.shell.setStat("player", utils.pad(this.score.left, 2));
            this.shell.setStat("rival", utils.pad(this.score.right, 2));
            this.shell.setStat("rally", this.rally);
            this.shell.setStat("bestrally", this.maxRally);
            this.shell.setStat("balls", this.balls.length);
            this.shell.setStat("target", this.winScore);

        }


        /* ---------------------------------------------------------
           Dibujo
           --------------------------------------------------------- */

        render() {

            const { ctx } = this.stage;

            this.stage.clear(this.world.bg);

            this.drawGravity();
            this.drawScoreboard();
            this.drawNet();
            this.drawObstacles();
            this.drawPickup();
            this.drawParticles();

            this.balls.forEach((ball) => this.drawBall(ball));

            this.drawPaddle(PADDLE_MARGIN, "left");
            this.drawPaddle(this.W - PADDLE_MARGIN - PADDLE_W, "right");

            this.drawEffects();

            if (this.serveTimer > 0) {
                this.drawServeCountdown();
            }

        }


        drawScoreboard() {

            const { ctx } = this.stage;

            ctx.save();

            ctx.globalAlpha = 0.09;

            canvasKit.text(ctx, String(this.score.left), this.W / 2 - 90, this.H / 2, {
                font: "900 180px 'Orbitron', sans-serif",
                color: "#22D3EE"
            });

            canvasKit.text(ctx, String(this.score.right), this.W / 2 + 90, this.H / 2, {
                font: "900 180px 'Orbitron', sans-serif",
                color: "#F5F7FF"
            });

            ctx.restore();

        }


        drawNet() {

            const { ctx } = this.stage;

            ctx.save();

            ctx.strokeStyle = this.world.net;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 14]);

            ctx.beginPath();
            ctx.moveTo(this.W / 2, 0);
            ctx.lineTo(this.W / 2, this.H);
            ctx.stroke();

            ctx.restore();

        }


        drawBall(ball) {

            const { ctx } = this.stage;

            ball.trail.forEach((point, index) => {

                const t = index / ball.trail.length;

                ctx.globalAlpha = t * 0.35;
                ctx.fillStyle = "#F5F7FF";

                ctx.beginPath();
                ctx.arc(point.x, point.y, ball.radius * t * 0.9, 0, Math.PI * 2);
                ctx.fill();

            });

            ctx.globalAlpha = 1;

            ctx.save();

            ctx.shadowColor = "#F5F7FF";
            ctx.shadowBlur = 20;
            ctx.fillStyle = "#FFFFFF";

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

        }


        drawPaddle(x, side) {

            const { ctx } = this.stage;

            const paddle = this.paddles[side];

            const height = this.paddleHeight(side);

            const color =
                paddle.slow > 0 ? "#FBBF24" :
                paddle.big > 0 ? "#22D3EE" :
                side === "left" ? "#22D3EE" :
                this.twoPlayers ? "#F5F7FF" : "#F43F5E";

            ctx.save();

            ctx.shadowColor = color;
            ctx.shadowBlur = 18;

            canvasKit.fillRoundRect(ctx, x, paddle.y, PADDLE_W, height, 6, color);

            ctx.restore();

        }


        drawPickup() {

            if (!this.pickup) {
                return;
            }

            const { ctx } = this.stage;

            const info = POWERUPS[this.pickup.type];

            const pulse = 1 + Math.sin(this.pickup.pulse / 160) * 0.12;

            ctx.save();

            ctx.translate(this.pickup.x, this.pickup.y);
            ctx.rotate(this.pickup.pulse / 700);
            ctx.scale(pulse, pulse);

            ctx.shadowColor = info.color;
            ctx.shadowBlur = 18;

            ctx.strokeStyle = info.color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, -13);
            ctx.lineTo(13, 0);
            ctx.lineTo(0, 13);
            ctx.lineTo(-13, 0);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = "rgba(6,7,11,0.75)";
            ctx.fill();

            ctx.restore();

            canvasKit.text(ctx, info.label, this.pickup.x, this.pickup.y + 1, {
                font: "700 11px 'JetBrains Mono', monospace",
                color: info.color
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

            ["left", "right"].forEach((side) => {

                const paddle = this.paddles[side];

                const who = side === "left" ? "P1" : "P2";

                if (paddle.big > 0) {
                    chips.push({
                        label: `${who} GRANDE ${Math.ceil(paddle.big / 1000)}s`,
                        color: "#22D3EE"
                    });
                }

                if (paddle.slow > 0) {
                    chips.push({
                        label: `${who} LENTO ${Math.ceil(paddle.slow / 1000)}s`,
                        color: "#FBBF24"
                    });
                }

            });

            if (!chips.length) {
                return;
            }

            let x = 14;

            chips.forEach((chip) => {

                const width = 16 + chip.label.length * 7.2;

                ctx.save();
                ctx.globalAlpha = 0.9;

                canvasKit.fillRoundRect(
                    ctx, x, this.H - 26, width, 18, 6, "rgba(6,7,11,0.85)"
                );

                ctx.strokeStyle = chip.color;
                ctx.lineWidth = 1;

                canvasKit.roundRect(ctx, x, this.H - 26, width, 18, 6);
                ctx.stroke();

                ctx.restore();

                canvasKit.text(ctx, chip.label, x + width / 2, this.H - 16, {
                    font: "700 9px 'JetBrains Mono', monospace",
                    color: chip.color
                });

                x += width + 8;

            });

        }


        drawServeCountdown() {

            const { ctx } = this.stage;

            const value = Math.ceil(this.serveTimer / 280);

            const label = value > 0 ? String(Math.min(3, value)) : "GO";

            canvasKit.text(ctx, label, this.W / 2, this.H / 2 - 130, {
                font: "900 46px 'Orbitron', sans-serif",
                color: "rgba(245,247,255,0.55)",
                shadow: "rgba(34,211,238,0.6)",
                shadowBlur: 20
            });

        }

    }


    /* ---------------------------------------------------------
       REGISTRO
       --------------------------------------------------------- */

    A.registerGame({

        id: "pong",
        number: "03",
        name: "PONG",
        genre: "SPORT / VERSUS",
        mode: "PONG // VS CPU",

        music: "arcade",

        accent: "var(--color-cyan)",
        accentRgb: "34 211 238",
        cardRgb: "34 211 238",

        preview: `
            <span class="preview preview--pong">
                <i class="preview__paddle preview__paddle--l"></i>
                <i class="preview__paddle preview__paddle--r"></i>
                <i class="preview__net"></i>
                <i class="preview__ball"></i>
            </span>
        `,

        readyTitle: "SERVE",
        readyText: "4 mundos: CLÁSICO, ASTEROIDES (bloques móviles), AGUJERO NEGRO (gravedad) y PÓRTAL (topes). Elige el límite de puntos (5, 7, 11, 15 o 21) en la barra de abajo antes de sacar: gana el primero que llegue.",
        readyHint: "ENTER — EMPEZAR    META — LÍMITE DE PUNTOS    P — PAUSA    ESC — SALIR",

        /* La pista se estira en pantallas anchas */
        ratioMin: 1.3,
        ratioMax: 2.5,

        hud: `
            ${A.ui.stat("player", "P1", "00")}
            ${A.ui.stat("rival", "P2", "00")}
            ${A.ui.divider()}
            ${A.ui.stat("rally", "RALLY", "0")}
            ${A.ui.stat("bestrally", "BEST", "0")}
            ${A.ui.stat("balls", "BALLS", "1")}
            ${A.ui.stat("target", "META", "11")}
        `,

        controls: `
            ${A.ui.switcher("world", [
                { value: "clasico", label: "CLÁSICO" },
                { value: "asteroides", label: "ASTEROIDES" },
                { value: "agujero", label: "AGUJERO" },
                { value: "portal", label: "PÓRTAL" }
            ])}
            ${A.ui.switcher("mode", [
                { value: "1p", label: "1P vs CPU" },
                { value: "2p", label: "2P LOCAL" }
            ])}
            ${A.ui.switcher("cpu", [
                { value: "easy", label: "EASY" },
                { value: "normal", label: "NORMAL" },
                { value: "hard", label: "HARD" }
            ])}
            ${A.ui.switcher("target", WIN_SCORES.map((value) => ({
                value: String(value),
                label: value + " PTS"
            })))}
        `,

        hint: "W / S — PALA IZQ.    ↑ / ↓ — PALA DER. (2P)    RATÓN — PALA IZQ.    P — PAUSA",

        create(shell) {
            return new PongGame(shell);
        }

    });

})(window.Arcade404);
