/* =========================================================
   ARCADE 404 — OPERACIÓN 404
   BOLSA DEL CLAP — caja ciega de suministros

   Es el artículo más barato de la Sala VIP y también aparece
   tirada por los mapas. Al abrirla:

     60%  llega un suministro útil
     40%  llega un contratiempo

   Sigue siendo una bolsa impredecible, pero ya no castiga al
   jugador por intentar recuperarse. Los efectos viven aquí como
   datos para poder ampliar el catálogo sin tocar el motor.
   ========================================================= */

(function (A) {

    "use strict";


    /* ---------------------------------------------------------
       Tabla de resultados

       `weight` es el peso dentro de su grupo (bueno / malo).
       El reparto 60/40 se aplica antes de elegir dentro del grupo.
       Las entradas buenas dan una respuesta incluso si el recurso
       principal ya está lleno: la bolsa nunca se siente desperdiciada.
       --------------------------------------------------------- */

    const GOOD = [
        {
            id: "azucar",
            label: "AZÚCAR TURBO",
            text: "Azúcar puro: acelera las piernas y despeja el paso.",
            color: "#FDE68A",
            duration: 4200,
            weight: 12
        },
        {
            id: "nutrivicha",
            label: "NUTRIVICHA MÁGICA",
            text: "Nutrivicha mágica: recarga blindaje que resiste hasta recibir daño.",
            color: "#38BDF8",
            shield: 55,
            weight: 13
        },
        {
            id: "harina",
            label: "HARINA DE HOJA",
            text: "Harina de hoja de la buena: recuperas aire y sigues.",
            color: "#A3E635",
            health: 25,
            fallbackShield: 22,
            weight: 12
        },
        {
            id: "arepa",
            label: "AREPA RELLENA",
            text: "Arepa rellena, recién resuelta: +40 de vida.",
            color: "#FBBF24",
            health: 40,
            fallbackShield: 32,
            weight: 17
        },
        {
            id: "municion",
            label: "CAJA DE MUNICIÓN",
            text: "Caja surtida: balas, cartuchos y pastichos para resistir.",
            color: "#F87171",
            ammo: { balas: 60, cartuchos: 12, pastichos: 3 },
            fallbackShield: 28,
            weight: 18
        },
        {
            id: "cafe",
            label: "CAFÉ DE GUARDIA",
            text: "Café fuerte: limpia lo pegajoso y activa un sprint corto.",
            color: "#C084FC",
            duration: 3200,
            weight: 10
        },
        {
            id: "vale",
            label: "VALE DE SUMINISTROS",
            text: "Un vale legítimo, por una vez: efectivo para la Sala VIP.",
            color: "#34D399",
            money: 65,
            weight: 10
        },
        {
            id: "furia",
            label: "SOBRE DE CAFEÍNA",
            text: "Cafeína táctica: carga la Furia o te deja protegido.",
            color: "#FB7185",
            fallbackShield: 35,
            weight: 8
        }
    ];


    const BAD = [
        {
            id: "gorgojos",
            label: "ARROZ CON GORGOJOS",
            text: "Ese arroz tenía gorgojos. Uno de ellos decidió discutirlo.",
            color: "#B45309",
            fallbackSlow: 1800,
            weight: 25
        },
        {
            id: "sardina",
            label: "SARDINA EN LATA DAÑADA",
            text: "La lata estaba soplada: pierdes 18 de vida, no la partida.",
            color: "#F43F5E",
            damage: 18,
            weight: 25
        },
        {
            id: "pasta",
            label: "PASTA PICADA Y DEFORMADA",
            text: "Pasta picada: los pies se pegan al piso por unos segundos.",
            color: "#A16B3A",
            duration: 3800,
            weight: 25
        },
        {
            id: "rota",
            label: "BOLSA ROTA",
            text: "La bolsa se abre: pierdes parte de la munición y efectivo.",
            color: "#94A3B8",
            ammoLoss: 0.45,
            moneyLoss: 0.20,
            weight: 25
        }
    ];


    const GOOD_CHANCE = 0.60;
    const BAD_CHANCE = 1 - GOOD_CHANCE;


    function pickWeighted(list) {

        const total = list.reduce((sum, entry) => sum + entry.weight, 0);

        let roll = Math.random() * total;

        for (let i = 0; i < list.length; i += 1) {

            roll -= list[i].weight;

            if (roll <= 0) {
                return list[i];
            }

        }

        return list[list.length - 1];

    }


    /* Decide qué sale de la bolsa */
    function roll() {

        const good = Math.random() < GOOD_CHANCE;

        const result = pickWeighted(good ? GOOD : BAD);

        return Object.assign({ good }, result);

    }


    A.op404 = A.op404 || {};

    A.op404.clap = {
        roll,
        GOOD,
        BAD,
        GOOD_CHANCE,
        BAD_CHANCE
    };

})(window.Arcade404);
