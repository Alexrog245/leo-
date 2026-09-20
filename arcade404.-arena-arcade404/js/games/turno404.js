/* =========================================================
   ARCADE 404 — GAME 10 · TURNO 404
   ---------------------------------------------------------
   Supervivencia psicológica original en la oficina de archivo.
   Vigila tres cámaras, administra energía y no dejes que el
   Manguangua llegue al escritorio antes de las seis.

   No replica personajes ni situaciones de otras obras: toma la
   tensión de una guardia nocturna y la convierte en una experiencia
   propia de ARCADE 404. Las expresiones reales del reparto sostienen
   las comunicaciones de radio y el dossier opcional.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils } = A;

    const ENERGY_MAX = 100;
    const PANIC_MAX = 100;
    const CAPRILES_REVEAL_MS = 2600;
    /* Todas las escenas de TURNO 404 esperan un gesto. Los temporizadores
       siguen reservados sólo para amenazas jugables, no para el relato. */
    const MANUAL_NARRATIVE_ADVANCE = true;
    const NIGHT_COUNT = 3;
    const DIFFICULTY_STORAGE_KEY = "turno404:difficulty";
    const DIFFICULTY_ORDER = ["facil", "normal", "dificil"];
    const HORROR_ENTRY_MINUTES = 4 * 60;
    const HORROR_ENTRY_FADE_MS = 3000;
    const HORROR_RESUME_FADE_MS = 520;
    const HORROR_ADJUST_FADE_MS = 240;
    const MANGUANGUA_SCREAM_VOLUME = 0.72;

    /* DIFÍCIL conserva aproximadamente la presión original. NORMAL ya no
       castiga como una prueba de velocidad: da aire para leer, aprender las
       rutas y responder. FÁCIL protege todavía más los recursos sin quitar
       la campaña, el horror ni las decisiones. */
    const TURNO_DIFFICULTIES = {
        facil: {
            label: "FÁCIL",
            short: "FÁCIL",
            protocol: "PROTOCOLO ACOMPAÑADO",
            description: "Más margen para leer la oficina, reaccionar y recuperar recursos.",
            startPanic: 10,
            time: "TURNOS +40% · ALERTAS +65%",
            shift: 1.4,
            reaction: 1.65,
            threat: 0.56,
            resource: 0.58,
            panic: 0.54,
            objective: 0.68,
            incident: 1.42,
            doorHold: 0.7,
            recovery: 1.34,
            breatheCooldown: 0.7,
            breatheRelief: 1.36,
            penalty: 0.56,
            color: "#a8f29a"
        },
        normal: {
            label: "NORMAL",
            short: "NORMAL",
            protocol: "PROTOCOLO RECOMENDADO",
            description: "El ritmo recomendado: más aire para actuar sin perder la tensión.",
            startPanic: 12,
            time: "TURNOS +18% · ALERTAS +34%",
            shift: 1.18,
            reaction: 1.34,
            threat: 0.76,
            resource: 0.74,
            panic: 0.72,
            objective: 0.82,
            incident: 1.18,
            doorHold: 0.82,
            recovery: 1.16,
            breatheCooldown: 0.84,
            breatheRelief: 1.16,
            penalty: 0.74,
            color: "#6be8ff"
        },
        dificil: {
            label: "DIFÍCIL",
            short: "DIFÍCIL",
            protocol: "PROTOCOLO DE ARCHIVO",
            description: "La presión de archivo original para quien ya domina cada acceso.",
            startPanic: 14,
            time: "RITMO ORIGINAL · SIN ASISTENCIA",
            shift: 1,
            reaction: 1,
            threat: 1,
            resource: 1,
            panic: 1,
            objective: 1,
            incident: 1,
            doorHold: 1,
            recovery: 1,
            breatheCooldown: 1,
            breatheRelief: 1,
            penalty: 1,
            color: "#ff8392"
        }
    };

    /* En el último tramo el reloj no entrega las 06:00 antes de tiempo:
       escala en marcas visibles para apretar la decisión final. */
    const FINAL_CLOCK_STEPS = [
        { at: 0, minutes: 300 },
        { at: 0.13, minutes: 310 },
        { at: 0.26, minutes: 320 },
        { at: 0.4, minutes: 330 },
        { at: 0.55, minutes: 340 },
        { at: 0.68, minutes: 345 },
        { at: 0.8, minutes: 350 },
        { at: 0.91, minutes: 355 }
    ];

    /* Puertas, ductos, vidrio y archivo comparten la amenaza, pero cada
       ruta exige una respuesta propia. La puerta normal no desaparece. */
    const BREACH_ROUTES = {
        ducto: {
            id: "ducto",
            label: "DUCTO 04",
            key: "V",
            duration: 5400,
            cue: ["davinchi", "gritando", "¡Algo empuja la rejilla! Descarga el ducto con V ahora, yeah."],
            saved: ["davinchi", "feliz", "Descarga limpia. El ducto quedó mudo por ahora, yeah."],
            failure: "La rejilla cedió encima de tu escritorio.",
            lossTitle: "MANGUANGUA CAYÓ DEL DUCTO"
        },
        ventana: {
            id: "ventana",
            label: "VENTANAL OESTE",
            key: "L",
            duration: 4800,
            cue: ["desire", "gritando", "Amor, hay una cara en el vidrio. Enciende la luz y no apartes la mirada."],
            saved: ["desire", "feliz", "La luz lo hizo retroceder, amor. No dejes el proyector encendido de más."],
            failure: "La sombra cruzó el ventanal antes de que la luz la tocara.",
            lossTitle: "MANGUANGUA CRUZÓ EL VIDRIO"
        },
        archivo: {
            id: "archivo",
            label: "ARCHIVO MUERTO",
            key: "3",
            duration: 5600,
            cue: ["sil", "miedo", "CAM 03 acaba de perder su fondo. Míralo: archivo, ahora."],
            saved: ["sil", "seria", "El archivo volvió a tener fondo. Mantener la cámara lo obligó a retroceder."],
            failure: "El archivo se abrió hacia la oficina mientras la cámara seguía sola.",
            lossTitle: "MANGUANGUA SALIÓ DEL ARCHIVO"
        }
    };

    /* Cada aviso humano se abre en la computadora de la oficina. Las tres
       frases no llevan etiquetas morales en pantalla: el jugador tiene que
       leer el caso. Sólo la respuesta que cuida a quien escribe contiene la
       información y el tono que cierran el incidente sin alimentar el miedo.
       El mazo combina seguridad, infraestructura, privacidad y señales
       extrañas: una misma noche no repite el mismo tipo de caso. */
    const CLIENT_HOLD_TEXT = "Permítame unos minutos para verificar. Siga conmigo en la línea mientras reviso el caso.";
    const CLIENT_HOLD_BASE_MS = 8200;
    const CLIENT_HOLD_FLOOR_MS = 4200;

    const CUSTOMER_MESSAGES = [
        {
            id: "ascensor",
            from: "CLIENTE 018",
            subject: "TICKET DUPLICADO // ASCENSOR",
            signal: "SENSOR DE PUERTA // FALLA INTERMITENTE",
            evidence: "Un ascensor cuya puerta no confirma cierre debe quedar fuera de uso: no se fuerza ni se reinicia desde cabina.",
            message: "Mi ticket reapareció tres veces y el ascensor no abre. ¿Siguen ahí?",
            reply: "Le dimos una ruta segura y dejamos el ascensor aislado antes de que intentara otro ciclo.",
            answers: [
                { id: "acompanar", text: "Sí, sigo aquí. No entre ni fuerce la puerta; si el sensor falla, use la ruta segura y me quedo en la línea.", correct: true },
                { id: "cortar", text: "Ticket duplicado. Espere instrucciones.", correct: false, dry: true },
                { id: "burlarse", text: "Qué eficiente: hasta el ascensor quiere atención. Pruebe otra vez más tarde.", correct: false, harsh: true }
            ]
        },
        {
            id: "canal-rojo",
            from: "MESA 27",
            subject: "ALERTA DE PANTALLA // CANAL ROJO",
            signal: "AISLAMIENTO ELÉCTRICO // INTERFERENCIA",
            evidence: "Una alerta anómala puede ser software o interferencia. Aísla el equipo antes de reiniciar y nunca manipules cableado energizado.",
            message: "La pantalla dice CANAL ROJO. No quiero tocar nada más.",
            reply: "La terminal quedó aislada y la persona al otro lado recibió pasos claros para salir del canal.",
            answers: [
                { id: "acompanar", text: "Hizo bien en detenerse. Puede ser interferencia: no reinicie ni toque cableado; aislamos su terminal y le indico cada paso.", correct: true },
                { id: "cortar", text: "Terminal aislada. Mantenga la espera.", correct: false, dry: true },
                { id: "burlarse", text: "Una frase roja no muerde. Reinicie si quiere comprobarlo.", correct: false, harsh: true }
            ]
        },
        {
            id: "reflejo",
            from: "CLIENTE 043",
            subject: "REFLEJO DETRÁS DEL MONITOR",
            signal: "ÓPTICA DE BAJA LUZ // REFLEJO",
            evidence: "La luz desigual puede duplicar reflejos en cámara y monitor. Una luz estable y distancia del equipo ayudan a verificar sin exponerse.",
            message: "Hay una sombra reflejada detrás de mi monitor. Necesito respuesta.",
            reply: "Le pedimos alejarse de la cámara y esperar acompañado mientras verificábamos la señal.",
            answers: [
                { id: "acompanar", text: "Le creo. Encienda una luz estable, aléjese del monitor y no se quede solo mientras reviso la señal con usted.", correct: true },
                { id: "cortar", text: "Reporte archivado. Desconecte la cámara.", correct: false, dry: true },
                { id: "burlarse", text: "Si la sombra paga la cuenta, quizá pueda atenderla ella.", correct: false, harsh: true }
            ]
        },
        {
            id: "firma",
            from: "SOPORTE EXTERNO",
            subject: "VALIDACIÓN ANTES DE LAS 06:00",
            signal: "AUTENTICACIÓN // FIRMA Y CANAL REAL",
            evidence: "Una validación legítima no solicita códigos por un canal no verificado: se comprueban dominio, firma y ruta interna primero.",
            message: "El contrato pide una confirmación antes de las seis. ¿Puede validar?",
            reply: "La validación llegó por el canal real y el equipo externo no quedó solo con la alarma.",
            answers: [
                { id: "acompanar", text: "Sí. Verifico dominio y firma por el canal real; no envíe códigos hasta que confirme que la ruta es segura.", correct: true },
                { id: "cortar", text: "Confirmación en proceso. Espere.", correct: false, dry: true },
                { id: "burlarse", text: "Claro, porque los contratos siempre mejoran a las cinco de la mañana.", correct: false, harsh: true }
            ]
        },
        {
            id: "respiracion",
            from: "CLIENTE 071",
            subject: "RESPIRACIÓN EN LA LLAMADA",
            signal: "AUDIO // RUTA INYECTADA O RETROALIMENTACIÓN",
            evidence: "Un bucle de respiración puede venir de un micrófono abierto o una ruta inyectada. Cuelga la línea sospechosa, registra la hora y usa un canal seguro.",
            message: "No puedo oír al operador, pero alguien respira en la llamada.",
            reply: "Separamos la línea humana del ruido y la persona supo que no estaba imaginándolo sola.",
            answers: [
                { id: "acompanar", text: "No está solo. Puede ser una ruta de audio anómala: cuelgue esa línea, conserve la hora y seguimos por este canal seguro.", correct: true },
                { id: "cortar", text: "Canal verificado. Espere nueva conexión.", correct: false, dry: true },
                { id: "burlarse", text: "Tal vez el operador respira mejor que usted. No alimente la llamada.", correct: false, harsh: true }
            ]
        },
        {
            id: "termica",
            from: "BODEGA 04",
            subject: "RACK 3 // OLOR A PLÁSTICO CALIENTE",
            signal: "TEMPERATURA // SUBIDA SOSTENIDA",
            evidence: "El olor a aislamiento caliente y una subida térmica pueden preceder a una falla eléctrica. No se reinicia el equipo: se despeja el área y se escala a mantenimiento autorizado.",
            message: "El rack está muy caliente y huele raro. ¿Lo reinicio para que deje de sonar?",
            reply: "La zona quedó despejada y mantenimiento recibió la alerta térmica antes de que alguien tocara el rack.",
            answers: [
                { id: "acompanar", text: "No lo reinicie ni lo toque. Aléjese del rack, no bloquee la salida y avisaré a mantenimiento para aislarlo con seguridad.", correct: true },
                { id: "cortar", text: "Reinicio pendiente. No manipule el panel.", correct: false, dry: true },
                { id: "burlarse", text: "Si ya huele a tostado, quizá por fin está trabajando de verdad.", correct: false, harsh: true }
            ]
        },
        {
            id: "agua",
            from: "PUESTO 12",
            subject: "GOTEO SOBRE REGLETA",
            signal: "HUMEDAD // RIESGO ELÉCTRICO",
            evidence: "Agua cerca de una regleta energizada aumenta el riesgo de descarga. Se mantiene distancia, no se desconecta con las manos mojadas y se llama al responsable del circuito.",
            message: "Está goteando del techo justo encima de las extensiones. ¿Las desenchufo?",
            reply: "La persona se apartó, el área quedó señalizada y el circuito fue atendido sin exponerla.",
            answers: [
                { id: "acompanar", text: "No toque las extensiones ni el agua. Aléjese, avise a quienes estén cerca y solicito que corten el circuito de forma segura.", correct: true },
                { id: "cortar", text: "Reporte de humedad recibido. No espere junto al puesto.", correct: false, dry: true },
                { id: "burlarse", text: "Ponga un vaso debajo; al menos alguien aprovechará la lluvia interior.", correct: false, harsh: true }
            ]
        },
        {
            id: "credencial",
            from: "GUARDIA 03",
            subject: "PUERTA ESTE // CREDENCIAL NO COINCIDE",
            signal: "ACCESO FÍSICO // IDENTIDAD SIN CONFIRMAR",
            evidence: "Una credencial que no coincide con el registro debe verificarse por un canal independiente. No se abre una puerta basándose en la urgencia de quien espera afuera.",
            message: "Hay alguien con uniforme diciendo que perdió la credencial y quiere que le abra. ¿Qué hago?",
            reply: "La identidad se verificó por la ruta oficial y la puerta permaneció cerrada hasta confirmar el acceso.",
            answers: [
                { id: "acompanar", text: "Mantenga la puerta cerrada y no discuta solo. Verifico identidad por el canal oficial y le aviso cuándo sea seguro abrir.", correct: true },
                { id: "cortar", text: "Acceso bloqueado. Espere protocolo.", correct: false, dry: true },
                { id: "burlarse", text: "Un uniforme y una historia triste: el paquete completo de madrugada.", correct: false, harsh: true }
            ]
        },
        {
            id: "impresora",
            from: "ARCHIVO 66",
            subject: "IMPRESORA // EXPEDIENTES REPETIDOS",
            signal: "COLA DE IMPRESIÓN // DATOS SENSIBLES",
            evidence: "Una cola duplicada puede exponer documentos. Detén nuevos trabajos, conserva una muestra para auditoría y usa el canal de privacidad en lugar de compartir hojas o capturas.",
            message: "La impresora sigue sacando expedientes con nombres aunque nadie mandó nada. ¿Los rompo?",
            reply: "Detuvimos la cola, protegimos los documentos y privacidad pudo revisar el origen sin difundirlos.",
            answers: [
                { id: "acompanar", text: "No los comparta ni los fotografíe. Aléjese de la impresora, detengo la cola y resguardo una muestra para que privacidad investigue.", correct: true },
                { id: "cortar", text: "Cola detenida. No distribuya el material.", correct: false, dry: true },
                { id: "burlarse", text: "Guárdelos; quizá la impresora está escribiendo su autobiografía.", correct: false, harsh: true }
            ]
        },
        {
            id: "ventilacion",
            from: "OFICINA 21",
            subject: "SALA SELLADA // MAREO Y AIRE PESADO",
            signal: "VENTILACIÓN // POSIBLE ACUMULACIÓN DE CO2",
            evidence: "El aire mal renovado puede elevar el CO2 y causar mareo. La respuesta segura es salir a una zona ventilada, no quedarse a comprobarlo ni volver solo.",
            message: "Mi compañero está mareado y la sala se siente pesada. La puerta se cerró sola hace un rato.",
            reply: "Ambas personas salieron a aire fresco y el recinto quedó revisado antes de volver a usarlo.",
            answers: [
                { id: "acompanar", text: "Salgan juntos a un área ventilada ahora y no regresen solos. Me quedo en la línea mientras coordinamos revisión del recinto.", correct: true },
                { id: "cortar", text: "Ventilación reportada. Espere inspección.", correct: false, dry: true },
                { id: "burlarse", text: "Tal vez la sala también está cansada de escuchar reuniones.", correct: false, harsh: true }
            ]
        },
        {
            id: "camara-falsa",
            from: "RECEPCIÓN B",
            subject: "CAM 02 // HORA NO COINCIDE",
            signal: "VIDEO // POSIBLE FEED REPRODUCIDO",
            evidence: "Un video con hora o luz incompatibles puede ser una reproducción. No se usa para tomar decisiones de seguridad sin contrastarlo con otra cámara o una verificación local segura.",
            message: "La cámara muestra sol afuera, pero aquí está oscuro. ¿Mando a alguien a revisar solo?",
            reply: "Se contrastó la imagen con otra fuente y nadie tuvo que ir solo a confirmar el pasillo.",
            answers: [
                { id: "acompanar", text: "No mande a nadie solo. Trato ese feed como no confiable, cruzo otra cámara y coordinamos una verificación acompañada si hace falta.", correct: true },
                { id: "cortar", text: "Cámara en revisión. Mantenga posición.", correct: false, dry: true },
                { id: "burlarse", text: "Qué lujo: una cámara que todavía vive de día.", correct: false, harsh: true }
            ]
        },
        {
            id: "ups",
            from: "MANTENIMIENTO 02",
            subject: "UPS // HUMO CERCA DEL TABLERO",
            signal: "BATERÍA DE RESPALDO // POSIBLE FALLA",
            evidence: "Humo o calentamiento en una UPS requiere evacuar la zona y activar el protocolo de emergencia local. No se abre la carcasa ni se intenta ventilar con las manos.",
            message: "Hay humo fino detrás de la UPS. El indicador sigue verde; ¿la abro?",
            reply: "El área se evacuó y el aviso llegó a emergencias sin que nadie abriera el equipo comprometido.",
            answers: [
                { id: "acompanar", text: "No la abra. Aléjese del equipo, active el protocolo de emergencia del lugar y espere al personal capacitado; sigo aquí con usted.", correct: true },
                { id: "cortar", text: "UPS reportada. No abra la carcasa.", correct: false, dry: true },
                { id: "burlarse", text: "Si el indicador está verde, claramente el humo es decoración corporativa.", correct: false, harsh: true }
            ]
        },
        {
            id: "pago",
            from: "CLIENTE 205",
            subject: "FACTURA URGENTE // CAMBIO DE CUENTA",
            signal: "PAGO // SOLICITUD FUERA DE FLUJO",
            evidence: "Un cambio de cuenta bancaria debe confirmarse con contactos oficiales y un flujo aprobado. La urgencia del mensaje no sustituye la autenticación.",
            message: "Me piden pagar una factura a una cuenta nueva antes de que cierre el sistema. ¿La paso ya?",
            reply: "La factura se retuvo y finanzas verificó la cuenta por la ruta oficial antes de mover dinero.",
            answers: [
                { id: "acompanar", text: "No envíe el pago todavía. Verificamos el cambio de cuenta con finanzas por un contacto oficial y me quedo con usted durante el proceso.", correct: true },
                { id: "cortar", text: "Pago retenido. Espere validación.", correct: false, dry: true },
                { id: "burlarse", text: "Qué coincidencia que el dinero siempre tenga una emergencia antes del amanecer.", correct: false, harsh: true }
            ]
        },
        {
            id: "voz",
            from: "DIRECCIÓN NORTE",
            subject: "ORDEN TELEFÓNICA // DESACTIVAR ACCESO",
            signal: "VOZ // IDENTIDAD NO VERIFICADA",
            evidence: "Una voz conocida no prueba identidad: el audio puede reenviarse o sintetizarse. Los cambios de acceso se confirman por una ruta independiente y registrada.",
            message: "La voz del director pide que desactive las puertas por teléfono, pero la llamada viene de un número oculto.",
            reply: "La orden se validó por el canal registrado y los accesos no se modificaron por una voz aislada.",
            answers: [
                { id: "acompanar", text: "No cambie accesos por esa llamada. Confirmo la orden por el canal registrado y le aviso; hizo bien en detenerse.", correct: true },
                { id: "cortar", text: "Orden pendiente de validar. Mantenga el sistema igual.", correct: false, dry: true },
                { id: "burlarse", text: "Si es el director de verdad, seguro entiende que un número oculto inspira mucha confianza.", correct: false, harsh: true }
            ]
        },
        {
            id: "refrigeracion",
            from: "LABORATORIO 5",
            subject: "REFRIGERADOR // ALARMA DE TEMPERATURA",
            signal: "MUESTRA // CADENA DE FRÍO INTERRUMPIDA",
            evidence: "Una alarma de refrigeración exige registrar la temperatura y proteger las muestras según el protocolo local. Abrir la puerta repetidamente empeora la pérdida de frío.",
            message: "El refrigerador de muestras pita y la temperatura sube. ¿Abro para mirar qué pasó?",
            reply: "Se registró la temperatura y el equipo de laboratorio protegió las muestras sin perder más frío.",
            answers: [
                { id: "acompanar", text: "No abra la puerta por ahora. Registre la alarma, mantenga el sello cerrado y contacte al responsable de cadena de frío; sigo con usted.", correct: true },
                { id: "cortar", text: "Alarma registrada. Espere al responsable.", correct: false, dry: true },
                { id: "burlarse", text: "Tal vez las muestras sólo quieren sentir un poco de calor humano.", correct: false, harsh: true }
            ]
        },
        {
            id: "pasillo",
            from: "PUESTO 14",
            subject: "PASILLO VACÍO // GOLPES REGULARES",
            signal: "ACÚSTICA // POSIBLE TUBERÍA O EQUIPO MECÁNICO",
            evidence: "Golpes repetidos pueden venir de tuberías, dilatación o equipos mecánicos. Se documenta hora y patrón, y una inspección se hace acompañada sin perseguir el ruido.",
            message: "Escucho tres golpes cada pocos segundos en el pasillo. Cuando miro, no hay nadie.",
            reply: "Registramos el patrón y mantenimiento revisó la ruta acompañado, sin dejar a nadie seguir el ruido a solas.",
            answers: [
                { id: "acompanar", text: "Le creo. No vaya a buscar el ruido solo; registre la hora y el ritmo, y coordinamos una revisión acompañada desde un punto seguro.", correct: true },
                { id: "cortar", text: "Patrón anotado. Espere revisión.", correct: false, dry: true },
                { id: "burlarse", text: "Si son tres golpes, quizá el pasillo aprendió a pedir turno.", correct: false, harsh: true }
            ]
        }
    ];


    /* La historia usa una entidad ficcional nacida de un archivo corrupto.
       El Manguangua es una máscara de voces, imágenes y pánico dentro del
       universo ARCADE 404; no presenta una biografía ni hechos reales. */
    const OPENING_CINEMATIC = [
        {
            id: "anomaly",
            kicker: "03:14 AM // CENTRO DE SOPORTE",
            title: "LA NOCHE DE LAS LUCES PARPADEANTES",
            direction: "La lluvia golpea el vidrio blindado. Los CRT zumban entre olor a café quemado, ozono y humedad.",
            focus: "sil",
            tone: "interferencia",
            lines: [
                {
                    member: "sil",
                    expression: "preocupada",
                    message: "Quítense los audífonos. El canal cuatro arrastra algo pesado por servidores."
                },
                {
                    member: "davinchi",
                    expression: "serio",
                    message: "Ese canal comparte cable con la cámara dos. La onda no cuadra con agua, yeah."
                },
                {
                    member: "desire",
                    expression: "miedo",
                    message: "Amor, son pasos. Blandos. Como si el suelo no quisiera que algo descalzo llegara hasta aquí."
                }
            ]
        },
        {
            id: "outage",
            kicker: "03:15 AM // CONSUMO ANÓMALO",
            title: "EL EDIFICIO RESPIRA DEBAJO",
            direction: "Los fluorescentes parpadean dos veces. El generador no responde; sólo las pantallas azul violeta sostienen la oficina.",
            focus: "rog",
            tone: "vacio",
            lines: [
                {
                    member: "colinas",
                    expression: "despreocupado",
                    message: "A esta hora el edificio debería estar cerrado incluso para visitas sin reserva. Será el cableado, ¿no?"
                },
                {
                    member: "rog",
                    expression: "preocupado",
                    message: "No. El sótano no tiene breakers activos y aun así bebe energía de la línea principal. Déjame revisar otra vez."
                },
                {
                    member: "desire",
                    expression: "preocupada",
                    message: "Entonces algo apagó el generador desde adentro, amor. Y sabe que seguimos conectados."
                }
            ]
        },
        {
            id: "dossier",
            kicker: "03:16 AM // ARCHIVO LOCAL 404",
            title: "LA LEYENDA NO ES UNA PERSONA",
            direction: "Sil recupera un expediente dañado: fotos, consignas y mensajes de voz se repiten hasta perder sus nombres.",
            focus: "sil",
            tone: "interferencia",
            lines: [
                {
                    member: "sil",
                    expression: "nerviosa",
                    message: "El archivo lo llama Manguangua. No es personal: es un collage de voces que aprendió a pedir una cara."
                },
                {
                    member: "davinchi",
                    expression: "preocupado",
                    message: "Las fotos están tachadas, pero cada cuadro perdido añade una figura. Es un bucle, yeah; nadie lo programó."
                },
                {
                    member: "colinas",
                    expression: "miedo",
                    message: "Eso es un cuento para pasantes, ¿verdad? Dime que un archivo no puede mirar a un miembro fundador."
                }
            ]
        },
        {
            id: "apparition",
            kicker: "03:17 AM // CAM 02 // PASILLO OESTE",
            title: "ALGO YA MIRABA LA CÁMARA",
            direction: "La estática se vuelve roja. Una figura alta, torcida y con una gorra deshilachada se queda inmóvil frente al lente.",
            focus: "entity",
            tone: "manguanguaWhisper",
            lines: [
                {
                    member: "desire",
                    expression: "gritando",
                    message: "¡Amor, mira la cámara dos! No busca salida; aprende dónde termina la imagen."
                },
                {
                    member: "rog",
                    expression: "serio",
                    message: "No le hablen. Si escucha una voz, la guarda. Si ve un rostro, intenta llevárselo. Sí, eso incluye chistes."
                },
                {
                    entity: true,
                    name: "MANGUANGUA // CANAL CORRUPTO",
                    message: "t0do e§ fáciI… en—tréguenme sus r0stros… n3cesito una v0z pa—ra sa—lir."
                }
            ]
        },
        {
            id: "lockdown",
            kicker: "03:18 AM // PROTOCOLO DE CIERRE",
            title: "QUE COMIENCE LA GUARDIA",
            direction: "Un golpe hunde la puerta metálica. Las balizas rojas giran; por primera vez, nadie discute quién está al mando.",
            focus: "rog",
            tone: "interferencia",
            lines: [
                {
                    member: "rog",
                    expression: "serio",
                    message: "Yo vigilo la batería y el cierre hidráulico. Calculé la carga tres veces: no dejen que la puerta consuma todo el turno."
                },
                {
                    member: "sil",
                    expression: "seria",
                    message: "Rojo en la señal: ductos. Davinchi, descarga con V antes de que encuentre el techo. Sin debate."
                },
                {
                    member: "davinchi",
                    expression: "preocupado",
                    message: "Yo marco los accesos. Desire, usa la luz contra cristal y pasillo; el protocolo térmico funciona, yeah."
                },
                {
                    member: "colinas",
                    expression: "nervioso",
                    message: "Yo… yo no haré ruido. Por favor, que nadie diga su nombre cerca del micrófono; esa voz no tiene categoría."
                }
            ]
        }
    ];


    /* Guía breve y manual: el equipo explica los verbos importantes antes
       del primer turno. No cronometra ni consume recursos; ESC permite
       saltarla cuando ya se conoce la oficina. */
    const OFFICE_TUTORIAL = [
        {
            id: "camaras",
            kicker: "GUÍA DE GUARDIA 01 / 04",
            title: "MIRA EL DATO, NO EL MIEDO",
            action: "C ABRE EL MONITOR · 1–3 CAMBIAN LA CÁMARA",
            member: "sil",
            expression: "seria",
            message: "La cámara indicada deja recuperar evidencia y mirar la ruta correcta frena su avance. No persigas cada sombra: sigue el objetivo amarillo."
        },
        {
            id: "alarmas",
            kicker: "GUÍA DE GUARDIA 02 / 04",
            title: "CADA ALERTA TIENE UNA RESPUESTA",
            action: "E CORTA SEÑAL · V DESCARGA DUCTO · Q ABRE CLIENTE",
            member: "davinchi",
            expression: "serio",
            message: "Si la luz de control cambia, no improvises, yeah. Señal con E, ducto con V y clientes con Q: leer primero también es defenderse."
        },
        {
            id: "cuidado",
            kicker: "GUÍA DE GUARDIA 03 / 04",
            title: "LA PERSONA AL OTRO LADO IMPORTA",
            action: "LEE LA FICHA TÉCNICA · RESPONDE CON 1–3",
            member: "desire",
            expression: "preocupada",
            message: "En los mensajes encontrarás una lectura técnica. La respuesta correcta cuida a quien pide ayuda y explica un paso seguro, amor."
        },
        {
            id: "oscuridad",
            kicker: "GUÍA DE GUARDIA 04 / 04",
            title: "CUANDO LA OFICINA PARPADEE",
            action: "L ILUMINA · F CIERRA · H ESCONDE · ESPACIO RESPIRA",
            member: "rog",
            expression: "serio",
            message: "A veces las luces caerán sin avisar. El monitor seguirá siendo una referencia; respira, verifica el dato y no gastes batería por miedo."
        }
    ];


    /* Tres turnos conectan la anomalía con las mecánicas de la oficina: cada
       nivel presenta una pista, un objetivo de vigilancia, una llamada y una
       alerta de ductos que puede empeorar la situación si se ignora. */
    const TURNOS = [
        {
            id: "canal-rojo",
            label: "NIVEL 01 / 03",
            title: "EL CANAL ROJO",
            checkpoint: "03:18 — 04:00 AM",
            startMinutes: 198,
            endMinutes: 240,
            duration: 62000,
            startStage: 0,
            initialAdvance: 14800,
            advanceTimers: [0, 13800, 11200, 0],
            repelStage: 0,
            repelDelay: 13700,
            hideDelay: 12100,
            doorHold: 3400,
            attackTime: 7900,
            blackoutAttack: 4400,
            pace: 0.9,
            watchedPace: 0.42,
            drain: 0.14,
            recoverEnergy: 0,
            recoverPanic: 0,
            objective: {
                camera: "pasillo",
                needed: 5600,
                label: "AISLA EL RASTRO DEL CANAL 04 · CAM 02",
                reward: 200,
                energy: 8,
                panic: 9,
                cue: {
                    member: "sil",
                    expression: "seria",
                    message: "El arrastre no está en el cable. Baja por mantenimiento hacia el archivo."
                }
            },
            signal: {
                at: 22400,
                duration: 7200,
                penalty: 13,
                accelerate: 2400,
                cue: {
                    member: "rog",
                    expression: "nervioso",
                    message: "El teléfono repite la extensión del sótano. No respondas; corta el canal. Y no me hagas repetirlo."
                },
                cut: {
                    member: "sil",
                    expression: "preocupada",
                    message: "Canal aislado. La estática respiró al otro lado. Un segundo bastó."
                },
                missed: {
                    member: "desire",
                    expression: "miedo",
                    message: "La llamada se colgó sola, amor. Ahora sabe que seguimos reunidos."
                }
            },
            vent: {
                at: 35200,
                duration: 5400,
                penalty: 12,
                accelerate: 1800,
                cue: {
                    member: "davinchi",
                    expression: "preocupado",
                    message: "Rojo en el techo. Palpa la rejilla: descarga el ducto antes de que entre, yeah."
                },
                discharge: {
                    member: "sil",
                    expression: "seria",
                    message: "Descarga activada. El zumbido volvió al ducto. No se fue del edificio."
                },
                missed: {
                    member: "colinas",
                    expression: "miedo",
                    message: "¡La rejilla se movió! Ese conducto ni siquiera tiene mantenimiento premium."
                }
            },
            intro: {
                member: "sil",
                expression: "preocupada",
                message: "Canal rojo abierto. Cámara dos: única ventana al pasillo oeste."
            },
            opening: {
                member: "rog",
                expression: "serio",
                message: "Primero aislamos el rastro. Nadie responde fuera del canal seguro. Ni aunque suene como yo."
            },
            beats: [
                {
                    at: 7200,
                    member: "desire",
                    expression: "miedo",
                    message: "Amor, si usa una voz conocida, mira el indicador azul antes de creerle."
                },
                {
                    at: 16800,
                    member: "davinchi",
                    expression: "preocupado",
                    message: "El pasillo oeste no termina donde debería. Cada cuadro renderiza una puerta más, yeah."
                },
                {
                    at: 46800,
                    member: "colinas",
                    expression: "nervioso",
                    message: "Dejé baterías de respaldo en el cajón. No hago ruido; mi silla heredada está crujiendo sola.",
                    panic: 7,
                    energy: 6
                }
            ],
            outro: {
                member: "rog",
                expression: "preocupado",
                message: "Rastro aislado. La fuente baja al archivo, justo debajo de nosotros. Lo comprobé dos veces."
            }
        },
        {
            id: "archivo-vivo",
            label: "NIVEL 02 / 03",
            title: "EL ARCHIVO QUE MIRA",
            checkpoint: "04:00 — 05:00 AM",
            startMinutes: 240,
            endMinutes: 300,
            duration: 68000,
            startStage: 1,
            initialAdvance: 11600,
            advanceTimers: [0, 0, 9200, 0],
            repelStage: 1,
            repelDelay: 10500,
            hideDelay: 9700,
            doorHold: 3700,
            attackTime: 7000,
            blackoutAttack: 3900,
            pace: 1.04,
            watchedPace: 0.4,
            drain: 0.18,
            recoverEnergy: 26,
            recoverPanic: 18,
            objective: {
                camera: "archivo",
                needed: 7600,
                label: "RECUPERA EL EXPEDIENTE 404 · CAM 03",
                reward: 260,
                energy: 10,
                panic: 11,
                cue: {
                    member: "sil",
                    expression: "nerviosa",
                    message: "Confirmado: Manguangua es una máscara de archivo. Copia voces, fotos y el miedo residual."
                }
            },
            signal: {
                at: 28600,
                duration: 6500,
                penalty: 17,
                accelerate: 3000,
                cue: {
                    member: "colinas",
                    expression: "miedo",
                    message: "Mi radio dijo mi clave con mi propia voz. Eso es acceso no autorizado. No abras otro canal."
                },
                cut: {
                    member: "rog",
                    expression: "serio",
                    message: "Señal aislada. Sigue mirando el archivo; aún no sabe cuál pantalla nos protege. Mejor que no aprenda."
                },
                missed: {
                    member: "sil",
                    expression: "nerviosa",
                    message: "La interferencia copió nuestra clave. Desde ahora puede hablar como cualquiera."
                }
            },
            vent: {
                at: 44800,
                duration: 4900,
                penalty: 16,
                accelerate: 2300,
                cue: {
                    member: "davinchi",
                    expression: "gritando",
                    message: "El ducto está sobre el escritorio. V, ahora: no dejes que encuentre el falso techo, yeah."
                },
                discharge: {
                    member: "desire",
                    expression: "preocupada",
                    message: "La descarga lo hizo retroceder, amor. La luz del tablero volvió por un segundo."
                },
                missed: {
                    member: "rog",
                    expression: "nervioso",
                    message: "Perdimos el ducto. Si oyes uñas sobre la rejilla, no mires arriba. Yo tampoco lo haría."
                }
            },
            intro: {
                member: "davinchi",
                expression: "serio",
                message: "El archivo está vivo porque conserva todo lo que escucha. Recupera el expediente; rastreo qué lo alimenta, yeah."
            },
            opening: {
                member: "desire",
                expression: "preocupada",
                message: "No dejes que las imágenes te convenzan de mirar atrás, amor. Cámara tres sólo muestra lo que quiere."
            },
            beats: [
                {
                    at: 9400,
                    member: "sil",
                    expression: "miedo",
                    message: "Cámara tres no perdió imagen. Alguien tapó el lente desde el otro lado."
                },
                {
                    at: 20800,
                    member: "rog",
                    expression: "preocupado",
                    message: "El consumo baja cuando callamos. No le demos otra voz. Déjame pensar antes de abrir nada."
                },
                {
                    at: 57200,
                    member: "colinas",
                    expression: "gritando",
                    message: "Traje dos linternas del depósito, pero las fotos tienen nuestros rostros. Nadie autorizó ese retrato.",
                    panic: 9,
                    energy: 7
                }
            ],
            outro: {
                member: "sil",
                expression: "triste",
                message: "El expediente no tiene cuerpo ni nombre. Una instrucción: necesita amanecer para usar una salida."
            }
        },
        {
            id: "ultima-hora",
            label: "NIVEL 03 / 03",
            title: "LA ÚLTIMA HORA",
            checkpoint: "05:00 — 06:00 AM",
            startMinutes: 300,
            endMinutes: 360,
            duration: 72000,
            startStage: 2,
            initialAdvance: 10500,
            advanceTimers: [0, 0, 0, 0],
            repelStage: 2,
            repelDelay: 9000,
            hideDelay: 8400,
            doorHold: 4000,
            attackTime: 6100,
            blackoutAttack: 3300,
            pace: 1.18,
            watchedPace: 0.37,
            drain: 0.21,
            recoverEnergy: 30,
            recoverPanic: 22,
            objective: {
                camera: "recepcion",
                needed: 9000,
                label: "CONFIRMA LA SALIDA DE EMERGENCIA · CAM 01",
                reward: 340,
                energy: 12,
                panic: 14,
                cue: {
                    member: "desire",
                    expression: "llorando",
                    message: "La salida sigue ahí, amor. Cuando marque seis, corremos sin mirar reflejos."
                }
            },
            signal: {
                at: 32600,
                duration: 5500,
                penalty: 22,
                accelerate: 3600,
                cue: {
                    member: "davinchi",
                    expression: "nervioso",
                    message: "Llama desde la oficina. No respondas: ya mapeó dónde termina la puerta, yeah."
                },
                cut: {
                    member: "sil",
                    expression: "gritando",
                    message: "Canal cortado. No contestes aunque oigas a uno de nosotros pedir ayuda."
                },
                missed: {
                    member: "rog",
                    expression: "miedo",
                    message: "La voz dejó de sonar. Los pasos rodean el cristal. No es una mejora."
                }
            },
            vent: {
                at: 50600,
                duration: 4300,
                penalty: 22,
                accelerate: 3000,
                cue: {
                    member: "davinchi",
                    expression: "gritando",
                    message: "Última alerta de ductos. Descarga el techo o no tendremos puerta que cerrar, yeah."
                },
                discharge: {
                    member: "rog",
                    expression: "serio",
                    message: "Ductos sellados. Guarda luz para el cristal y batería para el cierre. Casi termina."
                },
                missed: {
                    member: "desire",
                    expression: "miedo",
                    message: "Algo cayó sobre el falso techo, amor. No digas nada; escucha la oficina."
                }
            },
            intro: {
                member: "rog",
                expression: "serio",
                message: "Una hora. La salida abre a las seis. No dejemos que llegue antes; revisa cada recurso."
            },
            opening: {
                member: "sil",
                expression: "preocupada",
                message: "La ruta está en cámara uno. Rojo: usa luz, ducto o cierre según el acceso."
            },
            beats: [
                {
                    at: 9200,
                    member: "desire",
                    expression: "miedo",
                    message: "La luz lo obliga a retroceder, amor, pero el cristal refleja nuestros rostros."
                },
                {
                    at: 21400,
                    member: "rog",
                    expression: "preocupado",
                    message: "No queda nadie abajo. Somos el último canal encendido. No me encanta ese dato."
                },
                {
                    at: 61200,
                    member: "colinas",
                    expression: "nervioso",
                    message: "Guardé las baterías junto a la salida. El indicador verde no estaba incluido en mi membresía.",
                    panic: 6,
                    energy: 8
                }
            ],
            outro: {
                member: "desire",
                expression: "feliz",
                message: "Seis en punto, amor. La salida se abrió; corran y dejen al archivo hablando solo."
            }
        }
    ];


    const TEAM = [
        {
            id: "rog",
            name: "ROG",
            role: "MANDO TÁCTICO / ENERGÍA",
            color: "#38BDF8",
            idle: "serio"
        },
        {
            id: "sil",
            name: "SIL",
            role: "CÁMARAS / SEÑAL",
            color: "#FB923C",
            idle: "seria"
        },
        {
            id: "desire",
            name: "DESIRE",
            role: "PROYECTORES / LUZ",
            color: "#F472B6",
            idle: "seria"
        },
        {
            id: "davinchi",
            name: "DAVINCHI",
            role: "ACCESOS / DUCTOS",
            color: "#A3E635",
            idle: "serio"
        },
        {
            id: "colinas",
            name: "SR. DE LAS COLINAS",
            role: "SUMINISTROS / TENSIÓN",
            color: "#FBBF24",
            idle: "despreocupado"
        }
    ];


    const CAMERAS = [
        {
            id: "recepcion",
            short: "01",
            label: "RECEPCIÓN",
            stage: 0,
            idle: "La persiana de entrada está baja. Solo se oye el ascensor.",
            seen: "Hay una silueta detenida frente a recepción. No parpadees."
        },
        {
            id: "pasillo",
            short: "02",
            label: "PASILLO NORTE",
            stage: 1,
            idle: "Los fluorescentes zumban. Un archivador se balancea sin aire.",
            seen: "Movimiento en el pasillo norte. Está más cerca de la oficina."
        },
        {
            id: "archivo",
            short: "03",
            label: "ARCHIVO MUERTO",
            stage: 2,
            idle: "Filas de cajas. La cámara pierde un fotograma cada pocos segundos.",
            seen: "Algo cruzó el archivo. La puerta de seguridad quedó entreabierta."
        }
    ];


    const THREAT_STATES = [
        "FUERA DEL EDIFICIO",
        "EN EL PASILLO",
        "CRUZÓ EL ARCHIVO",
        "FRENTE A LA PUERTA"
    ];


    /* El registro conserva el dossier visual que ya tenía TURNO 404.
       No se cargan los PNG grandes hasta que la persona abre esta vista. */
    const THREATS = [
        { id: "enemy.backoffice", name: "BACK OFFICE", kind: "BURÓCRATA" },
        { id: "enemy.calidad", name: "CALIDAD", kind: "HOSTIL" },
        { id: "enemy.calidad-f", name: "CALIDAD F", kind: "HOSTIL" },
        { id: "enemy.chavista", name: "CHAVISTA", kind: "HOSTIL" },
        { id: "enemy.chavista-f", name: "CHAVISTA F", kind: "HOSTIL" },
        { id: "enemy.malandro", name: "MALANDRO", kind: "HOSTIL" },
        { id: "enemy.malandro-f", name: "MALANDRO F", kind: "HOSTIL" },
        { id: "enemy.militar", name: "MILITAR", kind: "COLECTIVO" },
        { id: "enemy.usuario", name: "USUARIO MOLESTO", kind: "HOSTIL" },
        { id: "enemy.usuario-f", name: "USUARIA MOLESTA", kind: "HOSTIL" },
        { id: "boss.supervisor", name: "EL SUPERVISOR", kind: "JEFE" },
        { id: "boss.ampa", name: "EL PRANES", kind: "JEFE" },
        { id: "boss.maduro", name: "MADURO", kind: "JEFE" },
        { id: "boss.chavez", name: "CHÁVEZ", kind: "JEFE" },
        { id: "boss.capriles", name: "EL MANGUANGUA", kind: "AMENAZA" },
        { id: "boss.srm", name: "SR. M", kind: "JEFE" }
    ];


    function displayExpression(expression) {

        const labels = {
            full: "PERFIL",
            despreocupado: "RELAX",
            despreocupada: "RELAX",
            dormido: "DORMIDO",
            dormida: "DORMIDA",
            emocionado: "EMOCIONADO",
            emocionada: "EMOCIONADA",
            enamorado: "ENAMORADO",
            enamorada: "ENAMORADA",
            enojado: "ENOJADO",
            molesto: "MOLESTO",
            molesta: "MOLESTA",
            feliz: "FELIZ",
            gritando: "GRITANDO",
            llorando: "LLORANDO",
            miedo: "MIEDO",
            nervioso: "NERVIOSO",
            nerviosa: "NERVIOSA",
            preocupado: "PREOCUPADO",
            preocupada: "PREOCUPADA",
            serio: "SERIO",
            seria: "SERIA",
            triste: "TRISTE"
        };

        return labels[expression] || String(expression || "serio").toUpperCase();

    }


    function clockFor(totalMinutes) {

        const safeMinutes = Math.min(360, Math.max(0, Math.floor(totalMinutes)));
        const hours = Math.floor(safeMinutes / 60);
        const minutes = safeMinutes % 60;
        const label = hours === 0 ? "12" : String(hours).padStart(2, "0");

        return `${label}:${String(minutes).padStart(2, "0")} AM`;

    }


    class Turno404Game {

        constructor(shell) {

            this.shell = shell;
            this.team = TEAM;
            this.teamById = TEAM.reduce((all, member) => {
                all[member.id] = member;
                return all;
            }, {});
            /* Evita solicitudes repetidas de la misma expresión cuando una
               radio cambia rápido o el jugador abre/cierra un registro. */
            this.warmedAssets = new Set();
            this.assetWarmVersion = 0;
            this.assetsReady = false;
            this.difficulty = this.readDifficulty();
            this.difficultyOpen = false;

            this.root = utils.create("section", "turno404");
            this.root.setAttribute("aria-label", "TURNO 404: guardia nocturna en la oficina de archivo");

            shell.refs.stage.appendChild(this.root);
            shell.setTouchControls({ mode: "none" });

            this._build();
            this._bind();
            this._createAudio();
            this.reset();
            /* GameShell ya calcula la proporción antes de crear el juego;
               aplicar la primera densidad aquí evita esperar al primer resize. */
            this.layout(shell.stageRatio || 1);

            const recordsButton = shell.q('[data-action="records"]');

            if (recordsButton) {
                recordsButton.addEventListener("click", () => this.toggleRecords());
                this.recordsButton = recordsButton;
            }

        }


        _build() {

            const cinematicOrder = ["desire", "davinchi", "rog", "colinas", "sil"];
            const cinematicTeam = cinematicOrder.map((id) => this.member(id)).map((member) => `
                <span class="turno404__cinematic-member" data-cinematic-member="${member.id}" style="--operator:${member.color}">
                    <img
                        data-cinematic-member-image="${member.id}"
                        src="${A.assets.url(A.assets.characterImageId(member.id, member.idle))}"
                        alt=""
                        loading="lazy"
                        decoding="async"
                    >
                    <i aria-hidden="true"></i>
                </span>
            `).join("");

            const cameras = CAMERAS.map((camera, index) => `
                <button
                    class="turno404__camera-button${index === 0 ? " is-selected" : ""}"
                    data-camera="${camera.id}"
                    type="button"
                    aria-pressed="${index === 0 ? "true" : "false"}"
                >
                    <span>CAM ${camera.short}</span>
                    <b>${camera.label}</b>
                </button>
            `).join("");

            const difficultyCards = DIFFICULTY_ORDER.map((id, index) => {
                const profile = TURNO_DIFFICULTIES[id];
                return `
                    <button class="turno404__difficulty-choice" data-turno-difficulty="${id}" type="button" aria-pressed="false" style="--difficulty-color:${profile.color}">
                        <span class="turno404__difficulty-index">0${index + 1}</span>
                        <b>${profile.label}</b>
                        <strong>${profile.protocol}</strong>
                        <small>${profile.description}</small>
                        <em>${profile.time}</em>
                        <kbd>${index + 1}</kbd>
                    </button>
                `;
            }).join("");

            this.root.innerHTML = `
                <div class="turno404__noise" aria-hidden="true"></div>
                <div class="turno404__scan" aria-hidden="true"></div>
                <div class="turno404__blackout" aria-hidden="true"></div>
                <div class="turno404__signal-flash" aria-hidden="true"></div>

                <header class="turno404__header">
                    <div class="turno404__brand">
                        <p>ARCHIVO CENTRAL // PISO 12</p>
                        <h3>TURNO <em>404</em></h3>
                    </div>
                    <div class="turno404__clock" aria-label="Hora del turno">
                        <span>RELOJ DE TURNO</span>
                        <strong data-role="clock">12:00 AM</strong>
                    </div>
                    <div class="turno404__state" data-role="state">EN ESPERA</div>
                </header>

                <main class="turno404__room">
                    <section class="turno404__office" data-role="office" aria-label="Oficina de archivo">
                        <div class="turno404__office-ceiling" aria-hidden="true">
                            <i></i><i></i><i></i>
                        </div>
                        <div class="turno404__ceiling-vent" data-role="ceiling-vent" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><b>DUCTO 04</b>
                        </div>
                        <div class="turno404__office-wall" aria-hidden="true">
                            <span>ARCHIVO // 12</span>
                            <span>NO RESPONDER AL CANAL ROJO</span>
                        </div>
                        <div class="turno404__office-window" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="turno404__window-threat" data-role="window-threat" aria-hidden="true">
                            <img src="${A.assets.url("boss.capriles")}" alt="" loading="lazy" decoding="async">
                            <span>VENTANAL OESTE</span>
                        </div>
                        <div class="turno404__doorway" data-role="doorway" aria-hidden="true">
                            <div class="turno404__door-sign">ACCESO NORTE</div>
                            <div class="turno404__office-threat" data-role="office-threat">
                                <img src="${A.assets.url("boss.capriles")}" alt="" loading="lazy" decoding="async">
                            </div>
                            <div class="turno404__door-shutter"></div>
                        </div>
                        <div class="turno404__desk-art">
                            <div class="turno404__desk-lamp" aria-hidden="true"><i></i></div>
                            <button class="turno404__desk-monitor turno404__desk-monitor--terminal" data-control="client" data-role="desk-monitor" type="button" aria-label="Monitor de escritorio. Sin mensajes de cliente pendientes.">
                                <span class="turno404__desk-monitor-screen">
                                    <span class="turno404__desk-monitor-topline">
                                        <b>ARCHIVO 404</b>
                                        <time data-role="desk-clock">12:00 AM</time>
                                    </span>
                                    <span class="turno404__desk-monitor-status" data-role="desk-monitor-status">CANAL DE SOPORTE · LISTO</span>
                                    <span class="turno404__client-notice" data-role="client-notice" hidden aria-live="assertive">
                                        <i class="turno404__client-notice-dot" aria-hidden="true"></i>
                                        <span class="turno404__client-notice-copy">
                                            <b>NUEVO MENSAJE</b>
                                            <small data-role="client-notice-from">CLIENTE // ENTRANTE</small>
                                            <em data-role="client-notice-preview">ABRE EL CANAL PARA LEERLO.</em>
                                        </span>
                                        <kbd>Q</kbd>
                                    </span>
                                    <span class="turno404__desk-monitor-idle">CÁMARAS · SOPORTE · CANAL SEGURO</span>
                                </span>
                            </button>
                            <div class="turno404__desk-phone" aria-hidden="true"></div>
                            <div class="turno404__desk-edge" aria-hidden="true"></div>
                        </div>
                        <div class="turno404__power-cut" data-role="power-cut" aria-hidden="true"></div>
                        <div class="turno404__hiding" data-role="hiding" aria-hidden="true">
                            <span>RESPIRA DESPACIO</span>
                            <i></i><i></i><i></i>
                        </div>
                        <section class="turno404__transcript" data-role="transcript" aria-label="Últimas comunicaciones">
                            <p>CANAL SEGURO // ÚLTIMOS MENSAJES</p>
                            <ol data-role="transcript-list"></ol>
                        </section>
                        <p class="turno404__office-caption" data-role="office-caption">La oficina está en silencio. Demasiado silencio.</p>

                    </section>

                    <aside class="turno404__console" aria-label="Consola de supervivencia">
                        <section class="turno404__meters">
                            <div class="turno404__meter turno404__meter--energy">
                                <div><span>ENERGÍA</span><b data-role="energy-value">100%</b></div>
                                <i><i data-role="energy-fill"></i></i>
                            </div>
                            <div class="turno404__meter turno404__meter--panic">
                                <div><span>PÁNICO</span><b data-role="panic-value">14%</b></div>
                                <i><i data-role="panic-fill"></i></i>
                            </div>
                            <div class="turno404__threat-readout">
                                <span>RIESGO</span>
                                <strong data-role="threat-label">FUERA DEL EDIFICIO</strong>
                            </div>
                            <div class="turno404__objective">
                                <p><span data-role="level-label">NIVEL 01 / 03</span><b data-role="objective-state">0/6S</b></p>
                                <strong data-role="objective-label">RASTREA LA LLAMADA · CAM 01</strong>
                                <i><i data-role="objective-fill"></i></i>
                            </div>
                        </section>

                        <section class="turno404__radio turno404__radio--speaker" data-role="radio-panel" aria-label="Intervención del equipo">
                            <div class="turno404__radio-art" data-role="radio-art">
                                <img data-role="radio-portrait" alt="">
                            </div>
                            <div class="turno404__radio-copy">
                                <p><span data-role="radio-name">ROG</span><i>CANAL SEGURO</i></p>
                                <strong data-role="radio-emotion">SERIO</strong>
                                <blockquote data-role="radio-message">Aún puedes salir cuando amanezca. No dejes que te escuche.</blockquote>
                            </div>
                        </section>

                        <section class="turno404__controls" aria-label="Controles de oficina">
                            <button class="turno404__control" data-control="camera" type="button">
                                <span>01</span><b>MONITOR</b><small>C</small>
                            </button>
                            <button class="turno404__control" data-control="lamp" type="button">
                                <span>02</span><b>PROYECTOR / LUZ</b><small>L</small>
                            </button>
                            <button class="turno404__control" data-control="door" type="button">
                                <span>03</span><b>CIERRE NORTE</b><small>F</small>
                            </button>
                            <button class="turno404__control" data-control="hide" type="button">
                                <span>04</span><b>ESCONDERSE</b><small>H</small>
                            </button>
                            <button class="turno404__control turno404__control--signal" data-control="signal" type="button">
                                <span>05</span><b>CORTAR SEÑAL</b><small data-role="signal-countdown">EN ESPERA</small>
                            </button>
                            <button class="turno404__control turno404__control--vent" data-control="vent" type="button">
                                <span>06</span><b>DESCARGA DUCTO</b><small data-role="vent-countdown">EN ESPERA</small>
                            </button>
                            <button class="turno404__control turno404__control--client" data-control="client" type="button">
                                <span>07</span><b>ABRIR MENSAJE</b><small data-role="client-countdown">EN ESPERA</small>
                            </button>
                            <button class="turno404__control turno404__control--wide" data-control="breathe" type="button">
                                <span>ESPACIO</span><b>CONTÉN LA RESPIRACIÓN</b><small data-role="breathe-cooldown">LISTO</small>
                            </button>
                        </section>
                    </aside>
                </main>

                <section class="turno404__monitor turno404__monitor--full" data-role="monitor" aria-label="Monitor de cámaras">
                    <header class="turno404__monitor-head">
                        <div>
                            <span>VIGILANCIA ANALÓGICA</span>
                            <strong data-role="camera-title">CAM 01 // RECEPCIÓN</strong>
                        </div>
                        <button class="turno404__monitor-close" data-control="camera" type="button" aria-label="Bajar monitor">×</button>
                    </header>
                    <div class="turno404__camera-feed" data-role="camera-feed" aria-live="polite">
                        <div class="turno404__camera-perspective" aria-hidden="true"><i></i><i></i><i></i></div>
                        <div class="turno404__camera-scene" aria-hidden="true">
                            <i class="turno404__camera-ceiling"></i>
                            <i class="turno404__camera-floor"></i>
                            <i class="turno404__camera-wall turno404__camera-wall--left"></i>
                            <i class="turno404__camera-wall turno404__camera-wall--right"></i>
                            <i class="turno404__camera-door"></i>
                            <i class="turno404__camera-counter"></i>
                            <i class="turno404__camera-shelves"></i>
                            <b class="turno404__camera-location" data-role="camera-scene-label">RECEPCIÓN // 01</b>
                        </div>
                        <div class="turno404__camera-figure" data-role="camera-figure" aria-hidden="true">
                            <img src="${A.assets.url("boss.capriles")}" alt="" loading="lazy" decoding="async">
                        </div>
                        <span class="turno404__camera-rec">● REC</span>
                        <span class="turno404__camera-glitch">NO HAY NADIE DETRÁS DE TI</span>
                    </div>
                    <p class="turno404__camera-copy" data-role="camera-copy">Sin señal estable.</p>
                    <nav class="turno404__camera-nav" aria-label="Cámaras de seguridad">
                        ${cameras}
                    </nav>
                </section>

                <section class="turno404__client-terminal" data-role="client-terminal" hidden role="dialog" aria-modal="true" aria-labelledby="client-terminal-title">
                    <div class="turno404__client-terminal-shell">
                        <header class="turno404__client-terminal-head">
                            <div class="turno404__client-terminal-backdrop" aria-hidden="true"><i>⌁</i></div>
                            <div class="turno404__client-terminal-identification">
                                <span>CANAL SEGURO // MENSAJES</span>
                                <h4 id="client-terminal-title" data-role="client-terminal-from">CLIENTE // DESCONOCIDO</h4>
                                <small data-role="client-terminal-subject">CANAL PENDIENTE</small>
                            </div>
                            <button class="turno404__client-terminal-close" data-client-close type="button" aria-label="Minimizar chat y volver a la oficina">×</button>
                        </header>
                        <div class="turno404__client-chat-thread" aria-label="Conversación de soporte">
                            <p class="turno404__client-chat-day">HOY · CANAL CIFRADO · RESPUESTA REQUERIDA</p>
                            <article class="turno404__client-chat-bubble turno404__client-chat-bubble--incoming">
                                <small>MENSAJE RECIBIDO</small>
                                <blockquote class="turno404__client-terminal-message" data-role="client-terminal-message"></blockquote>
                                <time data-role="client-terminal-time">00:00</time>
                            </article>
                            <aside class="turno404__client-terminal-evidence" aria-label="Lectura técnica del incidente">
                                <div><span>LECTURA TÉCNICA</span><b data-role="client-terminal-signal">SEÑAL PENDIENTE</b></div>
                                <p data-role="client-terminal-evidence">El sistema espera datos del incidente.</p>
                            </aside>
                            <button class="turno404__client-hold" data-client-hold data-role="client-hold" type="button" aria-label="Enviar mensaje de espera para ganar tiempo de lectura">
                                <kbd>0</kbd>
                                <span>
                                    <small>MENSAJE PUENTE · UNA VEZ</small>
                                    <b data-role="client-hold-message">Permítame unos minutos para verificar.</b>
                                    <em data-role="client-hold-status">ENVÍA ESTE MENSAJE PARA GANAR TIEMPO.</em>
                                </span>
                                <i aria-hidden="true">⌛</i>
                            </button>
                            <p class="turno404__client-terminal-prompt">ENVÍA EL MENSAJE PUENTE SI NECESITAS LEER; DESPUÉS ELIGE UNA RESPUESTA FINAL.</p>
                            <div class="turno404__client-terminal-choices" data-role="client-terminal-choices" role="group" aria-label="Tres respuestas rápidas"></div>
                            <p class="turno404__client-terminal-whisper" data-role="client-terminal-whisper">// EL CURSOR PARPADEA EN OTRO ESCRITORIO //</p>
                        </div>
                        <footer class="turno404__client-chat-composer" aria-hidden="true">
                            <i>＋</i><span>Selecciona una respuesta rápida…</span><b>ENVIAR</b>
                        </footer>
                    </div>
                </section>

                <section class="turno404__difficulty" data-role="difficulty" hidden aria-live="polite" aria-labelledby="turno404-difficulty-title">
                    <div class="turno404__difficulty-shell">
                        <div class="turno404__difficulty-signal" aria-hidden="true"><i></i><i></i><i></i><span>03:14</span></div>
                        <header>
                            <p>ARCHIVO CENTRAL // CALIBRACIÓN DE GUARDIA</p>
                            <h4 id="turno404-difficulty-title">ELIGE EL <em>PROTOCOLO</em></h4>
                            <strong>La historia no cambia: ajustamos el margen para que puedas leer la señal y actuar.</strong>
                        </header>
                        <div class="turno404__difficulty-choices" role="group" aria-label="Dificultad de TURNO 404">
                            ${difficultyCards}
                        </div>
                        <footer>
                            <p data-role="difficulty-status">NORMAL // PREPARANDO CANAL DE APERTURA</p>
                            <small>1 FÁCIL · 2 NORMAL · 3 DIFÍCIL · ENTER CONFIRMA EL PROTOCOLO ACTIVO</small>
                        </footer>
                    </div>
                </section>

                <section class="turno404__tutorial" data-role="tutorial" hidden aria-live="polite" aria-labelledby="turno404-tutorial-title">
                    <div class="turno404__tutorial-shell">
                        <div class="turno404__tutorial-grid" aria-hidden="true"></div>
                        <div class="turno404__tutorial-art" data-role="tutorial-art">
                            <img data-role="tutorial-portrait" alt="">
                        </div>
                        <div class="turno404__tutorial-copy">
                            <p data-role="tutorial-kicker">GUÍA DE GUARDIA 01 / 04</p>
                            <span data-role="tutorial-speaker">SIL // RED</span>
                            <h4 id="turno404-tutorial-title" data-role="tutorial-title">MIRA EL DATO, NO EL MIEDO</h4>
                            <blockquote data-role="tutorial-message"></blockquote>
                            <strong data-role="tutorial-action">C ABRE EL MONITOR · 1–3 CAMBIAN LA CÁMARA</strong>
                            <div class="turno404__tutorial-actions">
                                <button class="turno404__tutorial-next" data-control="tutorial-next" type="button">ENTENDIDO <kbd>ESPACIO</kbd></button>
                                <button class="turno404__tutorial-skip" data-control="tutorial-skip" type="button">SALTAR <kbd>ESC</kbd></button>
                            </div>
                            <small data-role="tutorial-count">PASO 1 DE 4 · LA GUÍA ESPERA TU RITMO</small>
                        </div>
                    </div>
                </section>

                <footer class="turno404__footer">
                    <p data-role="tip">C CÁMARAS · 1–3 ELEGIR CAM · E SEÑAL · V DUCTO · L LUZ · Q CLIENTE · F CIERRE · H ESCONDERSE</p>
                    <button class="turno404__records-button" data-control="records" type="button">
                        <span aria-hidden="true">▦</span> REGISTROS <kbd>R</kbd>
                    </button>
                </footer>

                <aside class="turno404__records" data-role="records" hidden aria-label="Registros visuales del turno">
                    <header class="turno404__records-head">
                        <div>
                            <p>ARCHIVO RECUPERADO // LECTURA SEGURA</p>
                            <h4 data-role="records-title">EQUIPO 404</h4>
                        </div>
                        <button class="turno404__records-close" data-control="records" type="button" aria-label="Cerrar registros">×</button>
                    </header>
                    <div class="turno404__records-mode" data-role="records-mode" role="group" aria-label="Tipo de registro"></div>
                    <div class="turno404__records-tabs" data-role="records-tabs" role="tablist" aria-label="Personajes"></div>
                    <div class="turno404__records-grid" data-role="records-grid"></div>
                    <p class="turno404__records-hint">LAS EXPRESIONES SON PISTAS, NO PRUEBAS. R PARA VOLVER A LA OFICINA.</p>
                </aside>

                <section class="turno404__cinematic" data-role="cinematic" hidden aria-live="polite" aria-label="Cinemática de inicio de TURNO 404">
                    <div class="turno404__cinematic-rain" aria-hidden="true"></div>
                    <div class="turno404__cinematic-flash" aria-hidden="true"></div>
                    <div class="turno404__cinematic-logo" aria-hidden="true">
                        <img src="${A.assets.url("brand.logo")}" alt="" loading="lazy" decoding="async">
                        <span>ARCHIVO DE INCIDENTE // 404</span>
                    </div>
                    <div class="turno404__cinematic-crt" aria-hidden="true">
                        <span>CAM 02 // PASILLO OESTE</span>
                        <i></i><i></i><i></i>
                        <div class="turno404__cinematic-entity">
                            <img src="${A.assets.url("boss.capriles")}" alt="" loading="lazy" decoding="async">
                        </div>
                    </div>
                    <div class="turno404__cinematic-beacon" aria-hidden="true"></div>
                    <div class="turno404__cinematic-card">
                        <p class="turno404__cinematic-kicker" data-role="cinematic-kicker">03:14 AM // CENTRO DE SOPORTE</p>
                        <h4 data-role="cinematic-title">LA NOCHE DE LAS LUCES PARPADEANTES</h4>
                        <p class="turno404__cinematic-direction" data-role="cinematic-direction"></p>
                        <ol class="turno404__cinematic-lines" data-role="cinematic-lines"></ol>
                        <button class="turno404__cinematic-next" data-control="cinematic-next" type="button">
                            CONTINUAR <kbd>ESPACIO</kbd>
                        </button>
                        <small data-role="cinematic-countdown">LECTURA MANUAL · LA ESCENA ESPERA</small>
                    </div>
                    <div class="turno404__cinematic-cast" aria-label="Equipo del turno">
                        ${cinematicTeam}
                    </div>
                </section>

                <section class="turno404__story" data-role="story" hidden aria-live="polite" aria-label="Transmisión de historia">
                    <div class="turno404__story-noise" aria-hidden="true"></div>
                    <p class="turno404__story-kicker" data-role="story-kicker">NIVEL 01 / 03</p>
                    <div class="turno404__story-body">
                        <div class="turno404__story-art" data-role="story-art">
                            <img data-role="story-portrait" alt="">
                        </div>
                        <div class="turno404__story-copy">
                            <span data-role="story-speaker">SIL // RED</span>
                            <h4 data-role="story-title">LA LLAMADA SIN OPERADOR</h4>
                            <blockquote data-role="story-message"></blockquote>
                            <button class="turno404__story-continue" data-control="continue" type="button">
                                CONTINUAR <kbd>ESPACIO</kbd>
                            </button>
                            <small>LECTURA MANUAL · PULSA ESPACIO O TOCA CONTINUAR</small>
                        </div>
                    </div>
                </section>

                <section class="turno404__capriles-reveal" data-role="capriles-reveal" hidden aria-live="assertive" aria-label="El Manguangua te encontró">
                    <div class="turno404__capriles-ghost" aria-hidden="true"></div>
                    <div class="turno404__capriles-face">
                        <img src="${A.assets.url("boss.capriles")}" alt="" loading="lazy" decoding="async">
                    </div>
                    <p>CANAL TOMADO // MANGUANGUA</p>
                    <strong data-role="reveal-reason">NO APARTES LA VISTA</strong>
                </section>

                <p class="sr-only" data-role="announce" role="status" aria-live="polite"></p>
            `;

            this.refs = {
                clock: this.root.querySelector('[data-role="clock"]'),
                state: this.root.querySelector('[data-role="state"]'),
                officeCaption: this.root.querySelector('[data-role="office-caption"]'),
                doorway: this.root.querySelector('[data-role="doorway"]'),
                officeThreat: this.root.querySelector('[data-role="office-threat"]'),
                ceilingVent: this.root.querySelector('[data-role="ceiling-vent"]'),
                windowThreat: this.root.querySelector('[data-role="window-threat"]'),
                powerCut: this.root.querySelector('[data-role="power-cut"]'),
                hiding: this.root.querySelector('[data-role="hiding"]'),
                transcript: this.root.querySelector('[data-role="transcript"]'),
                transcriptList: this.root.querySelector('[data-role="transcript-list"]'),
                monitor: this.root.querySelector('[data-role="monitor"]'),
                cameraTitle: this.root.querySelector('[data-role="camera-title"]'),
                cameraFeed: this.root.querySelector('[data-role="camera-feed"]'),
                cameraSceneLabel: this.root.querySelector('[data-role="camera-scene-label"]'),
                cameraFigure: this.root.querySelector('[data-role="camera-figure"]'),
                cameraCopy: this.root.querySelector('[data-role="camera-copy"]'),
                energyValue: this.root.querySelector('[data-role="energy-value"]'),
                energyFill: this.root.querySelector('[data-role="energy-fill"]'),
                panicValue: this.root.querySelector('[data-role="panic-value"]'),
                panicFill: this.root.querySelector('[data-role="panic-fill"]'),
                threatLabel: this.root.querySelector('[data-role="threat-label"]'),
                levelLabel: this.root.querySelector('[data-role="level-label"]'),
                objectiveLabel: this.root.querySelector('[data-role="objective-label"]'),
                objectiveState: this.root.querySelector('[data-role="objective-state"]'),
                objectiveFill: this.root.querySelector('[data-role="objective-fill"]'),
                signalCountdown: this.root.querySelector('[data-role="signal-countdown"]'),
                ventCountdown: this.root.querySelector('[data-role="vent-countdown"]'),
                clientCountdown: this.root.querySelector('[data-role="client-countdown"]'),
                deskMonitor: this.root.querySelector('[data-role="desk-monitor"]'),
                deskClock: this.root.querySelector('[data-role="desk-clock"]'),
                deskMonitorStatus: this.root.querySelector('[data-role="desk-monitor-status"]'),
                clientNotice: this.root.querySelector('[data-role="client-notice"]'),
                clientNoticeFrom: this.root.querySelector('[data-role="client-notice-from"]'),
                clientNoticePreview: this.root.querySelector('[data-role="client-notice-preview"]'),
                clientTerminal: this.root.querySelector('[data-role="client-terminal"]'),
                clientTerminalFrom: this.root.querySelector('[data-role="client-terminal-from"]'),
                clientTerminalSubject: this.root.querySelector('[data-role="client-terminal-subject"]'),
                clientTerminalTime: this.root.querySelector('[data-role="client-terminal-time"]'),
                clientTerminalMessage: this.root.querySelector('[data-role="client-terminal-message"]'),
                clientTerminalSignal: this.root.querySelector('[data-role="client-terminal-signal"]'),
                clientTerminalEvidence: this.root.querySelector('[data-role="client-terminal-evidence"]'),
                clientHold: this.root.querySelector('[data-role="client-hold"]'),
                clientHoldMessage: this.root.querySelector('[data-role="client-hold-message"]'),
                clientHoldStatus: this.root.querySelector('[data-role="client-hold-status"]'),
                clientTerminalChoices: this.root.querySelector('[data-role="client-terminal-choices"]'),
                clientTerminalWhisper: this.root.querySelector('[data-role="client-terminal-whisper"]'),
                difficulty: this.root.querySelector('[data-role="difficulty"]'),
                difficultyStatus: this.root.querySelector('[data-role="difficulty-status"]'),
                tutorial: this.root.querySelector('[data-role="tutorial"]'),
                tutorialArt: this.root.querySelector('[data-role="tutorial-art"]'),
                tutorialPortrait: this.root.querySelector('[data-role="tutorial-portrait"]'),
                tutorialKicker: this.root.querySelector('[data-role="tutorial-kicker"]'),
                tutorialSpeaker: this.root.querySelector('[data-role="tutorial-speaker"]'),
                tutorialTitle: this.root.querySelector('[data-role="tutorial-title"]'),
                tutorialMessage: this.root.querySelector('[data-role="tutorial-message"]'),
                tutorialAction: this.root.querySelector('[data-role="tutorial-action"]'),
                tutorialCount: this.root.querySelector('[data-role="tutorial-count"]'),
                radioPanel: this.root.querySelector('[data-role="radio-panel"]'),
                radioArt: this.root.querySelector('[data-role="radio-art"]'),
                radioPortrait: this.root.querySelector('[data-role="radio-portrait"]'),
                radioName: this.root.querySelector('[data-role="radio-name"]'),
                radioEmotion: this.root.querySelector('[data-role="radio-emotion"]'),
                radioMessage: this.root.querySelector('[data-role="radio-message"]'),
                breatheCooldown: this.root.querySelector('[data-role="breathe-cooldown"]'),
                tip: this.root.querySelector('[data-role="tip"]'),
                cinematic: this.root.querySelector('[data-role="cinematic"]'),
                cinematicKicker: this.root.querySelector('[data-role="cinematic-kicker"]'),
                cinematicTitle: this.root.querySelector('[data-role="cinematic-title"]'),
                cinematicDirection: this.root.querySelector('[data-role="cinematic-direction"]'),
                cinematicLines: this.root.querySelector('[data-role="cinematic-lines"]'),
                cinematicCountdown: this.root.querySelector('[data-role="cinematic-countdown"]'),
                story: this.root.querySelector('[data-role="story"]'),
                storyKicker: this.root.querySelector('[data-role="story-kicker"]'),
                storyArt: this.root.querySelector('[data-role="story-art"]'),
                storyPortrait: this.root.querySelector('[data-role="story-portrait"]'),
                storySpeaker: this.root.querySelector('[data-role="story-speaker"]'),
                storyTitle: this.root.querySelector('[data-role="story-title"]'),
                storyMessage: this.root.querySelector('[data-role="story-message"]'),
                caprilesReveal: this.root.querySelector('[data-role="capriles-reveal"]'),
                revealReason: this.root.querySelector('[data-role="reveal-reason"]'),
                records: this.root.querySelector('[data-role="records"]'),
                recordsTitle: this.root.querySelector('[data-role="records-title"]'),
                recordsMode: this.root.querySelector('[data-role="records-mode"]'),
                recordsTabs: this.root.querySelector('[data-role="records-tabs"]'),
                recordsGrid: this.root.querySelector('[data-role="records-grid"]'),
                announce: this.root.querySelector('[data-role="announce"]')
            };

            this.cameraButtons = Array.from(this.root.querySelectorAll("[data-camera]"));
            this.controlButtons = Array.from(this.root.querySelectorAll("[data-control]"));
            this.cinematicMembers = Array.from(this.root.querySelectorAll("[data-cinematic-member]"));
            this.difficultyButtons = Array.from(this.root.querySelectorAll("[data-turno-difficulty]"));

        }


        _bind() {

            this._onClick = (event) => {

                const difficultyChoice = event.target.closest("[data-turno-difficulty]");

                if (difficultyChoice) {
                    this.selectDifficulty(difficultyChoice.dataset.turnoDifficulty);
                    return;
                }

                const clientHold = event.target.closest("[data-client-hold]");

                if (clientHold) {
                    this.requestClientTime();
                    return;
                }

                const clientChoice = event.target.closest("[data-client-choice]");

                if (clientChoice) {
                    this.respondClient(clientChoice.dataset.clientChoice);
                    return;
                }

                const clientClose = event.target.closest("[data-client-close]");

                if (clientClose) {
                    this.closeClientTerminal();
                    return;
                }

                const camera = event.target.closest("[data-camera]");

                if (camera) {
                    this.selectCamera(camera.dataset.camera);
                    return;
                }

                const control = event.target.closest("[data-control]");

                if (control) {
                    this.control(control.dataset.control, true);
                    return;
                }

                const mode = event.target.closest("[data-records-mode]");

                if (mode) {
                    this.setRecordsMode(mode.dataset.recordsMode);
                    return;
                }

                const character = event.target.closest("[data-records-character]");

                if (character) {
                    this.setRecordsCharacter(character.dataset.recordsCharacter);
                    return;
                }

                const expression = event.target.closest("[data-record-expression]");

                if (expression) {
                    this.selectRecordExpression(expression.dataset.recordExpression);
                }

            };

            this.root.addEventListener("click", this._onClick);

        }


        _createAudio() {

            /* La pista nueva no acompaña toda la partida: espera al relevo de
               las 04:00 AM y entra desde casi silencio. El motor nunca queda
               bloqueado si el navegador no soporta medios nativos. */
            this.horrorTrack = A.assets.createAudio("audio.turno404-horror", {
                loop: true,
                preload: "auto",
                volume: 0.005
            });

            /* El grito entregado reemplaza el sintetizador en apariciones,
               ataques y derrotas. El tono procedural sólo queda de respaldo
               cuando esta pista no se puede iniciar. */
            this.manguanguaScreamTrack = A.assets.createAudio("audio.turno404-scream", {
                loop: false,
                preload: "auto",
                volume: MANGUANGUA_SCREAM_VOLUME
            });

            this.horrorVersion = 0;
            this.horrorRaf = null;
            this.horrorFadeActive = false;
            this.horrorFadeTarget = 0;
            this.horrorStartPending = false;
            this.horrorHasEntered = false;
            this.screamAssetFailed = false;
            this.screamVersion = 0;
            this.musicAllowed = null;
            this.isPaused = false;

            if (
                this.manguanguaScreamTrack &&
                typeof this.manguanguaScreamTrack.addEventListener === "function"
            ) {
                this.manguanguaScreamTrack.addEventListener("error", () => {
                    this.screamAssetFailed = true;
                });
            }

        }


        /* ---------------------------------------------------------
           DIFICULTAD Y RITMO
           --------------------------------------------------------- */

        readDifficulty() {

            const stored = A.storage && typeof A.storage.get === "function"
                ? A.storage.get(DIFFICULTY_STORAGE_KEY, "normal")
                : "normal";

            return TURNO_DIFFICULTIES[stored] ? stored : "normal";

        }


        get tuning() {
            return TURNO_DIFFICULTIES[this.difficulty] || TURNO_DIFFICULTIES.normal;
        }


        _levelDuration(level = this._currentLevel()) {
            return Math.round((level && level.duration || 0) * this.tuning.shift);
        }


        _responseWindow(milliseconds, floor = 0) {
            /* Las noches posteriores recuperan algo de tensión, pero NORMAL
               conserva un margen más amplio incluso en el relevo tres. */
            const nightPressure = 1 + Math.max(0, this.night - 1) * 0.07;
            return Math.max(floor, Math.round(milliseconds * this.tuning.reaction / nightPressure));
        }


        _incidentDelay(milliseconds) {
            return Math.round(milliseconds * this.tuning.incident);
        }


        _objectiveNeed(objective = this._currentLevel().objective) {
            return Math.max(1800, Math.round((objective && objective.needed || 0) * this.tuning.objective));
        }


        _penalty(value, minimum = 1) {
            return Math.max(minimum, Math.round(value * this.tuning.penalty));
        }


        _energyCost(value) {
            return Math.max(1, Math.round(value * this.tuning.resource));
        }


        _recovery(value, minimum = 0) {
            return Math.max(minimum, Math.round(value * this.tuning.recovery));
        }


        _doorHoldNeed(level = this._currentLevel()) {
            return Math.max(1500, Math.round((level && level.doorHold || 0) * this.tuning.doorHold));
        }


        _syncDifficultySelector() {

            const profile = this.tuning;

            (this.difficultyButtons || []).forEach((button) => {
                const active = button.dataset.turnoDifficulty === this.difficulty;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", active ? "true" : "false");
            });

            if (this.refs && this.refs.difficultyStatus) {
                this.refs.difficultyStatus.textContent = `${profile.label} // ${this.assetsReady
                    ? "CANAL DE APERTURA LISTO"
                    : "PREPARANDO CANAL DE APERTURA"}`;
            }

        }


        _warmAssets(ids) {

            if (!A.assets || typeof A.assets.preload !== "function") {
                return Promise.resolve([]);
            }

            const fresh = [...new Set((ids || []).filter(Boolean))]
                .filter((id) => !this.warmedAssets.has(id));

            if (!fresh.length) {
                return Promise.resolve([]);
            }

            fresh.forEach((id) => this.warmedAssets.add(id));

            try {
                const loading = A.assets.preload(fresh);
                return loading && typeof loading.then === "function"
                    ? loading.catch(() => [])
                    : Promise.resolve([]);
            } catch (error) {
                return Promise.resolve([]);
            }

        }


        _cinematicImageIds(scenes, includeIdleTeam = false) {

            const list = Array.isArray(scenes) ? scenes : [scenes];
            const ids = list.flatMap((scene) => (scene && scene.lines || []))
                .filter((line) => line.member && this.teamById[line.member])
                .map((line) => this._imageId(this.member(line.member), line.expression));

            if (includeIdleTeam) {
                this.team.forEach((member) => ids.push(this._imageId(member, member.idle)));
            }

            return [...new Set(ids)];

        }


        _primeDifficultyAssets() {

            const version = ++this.assetWarmVersion;
            /* La calibración sólo adelanta la primera escena y el elenco base.
               Las siguientes se preparan durante la lectura de cada pantalla,
               evitando una ráfaga de PNG antes de que el jugador decida jugar. */
            const cinematicIds = this._cinematicImageIds(OPENING_CINEMATIC[0], true);

            this.assetsReady = false;
            this._warmAssets(["brand.logo", "boss.capriles"].concat(cinematicIds)).then(() => {
                if (version !== this.assetWarmVersion) {
                    return;
                }
                this.assetsReady = true;
                this._syncDifficultySelector();
            });

        }


        openDifficultySelection() {

            this.phase = "briefing";
            this.difficultyOpen = true;
            this._stopHorror(true);
            this._primeDifficultyAssets();
            this._syncView(true);
            this._updateHud();
            this.announce("Elige Fácil, Normal o Difícil antes de abrir el archivo. Normal ofrece un margen de reacción más amable.");

        }


        selectDifficulty(id) {

            if (!TURNO_DIFFICULTIES[id] || this.phase !== "briefing" || !this.difficultyOpen) {
                return false;
            }

            const previousStartPanic = this.tuning.startPanic;
            this.difficulty = id;
            /* Conservar bonus VIP u otros ajustes ya aplicados: sólo se
               desplaza la base inicial entre perfiles, no se pisa el apoyo. */
            this.panic = utils.clamp(
                this.panic + this.tuning.startPanic - previousStartPanic,
                0,
                PANIC_MAX
            );

            if (A.storage && typeof A.storage.set === "function") {
                A.storage.set(DIFFICULTY_STORAGE_KEY, id);
            }

            this._syncDifficultySelector();
            this._tone("select");
            this.announce(`${this.tuning.protocol}. ${this.tuning.description}`);
            this._startCinematic();

            return true;

        }


        layout(ratio) {

            const safeRatio = Number.isFinite(Number(ratio)) ? Number(ratio) : 1;
            /* El ratio del shell dice cómo está encajado el escenario, pero la
               densidad depende de sus píxeles reales. Así una ventana baja no
               hereda mínimos pensados para un monitor alto. */
            const bounds = this.root && typeof this.root.getBoundingClientRect === "function"
                ? this.root.getBoundingClientRect()
                : {};
            const width = Number(bounds.width) || Number(this.root && this.root.clientWidth)
                || Number(this.root && this.root.offsetWidth) || 0;
            const height = Number(bounds.height) || Number(this.root && this.root.clientHeight)
                || Number(this.root && this.root.offsetHeight) || 0;
            const short = height > 0 && height < 620;
            const micro = height > 0 && height < 470;
            const narrow = width > 0 && width < 760;

            this.root.classList.toggle("is-compact", safeRatio < 0.98 || narrow);
            this.root.classList.toggle("is-ultrawide", safeRatio > 1.55 && !short);
            this.root.classList.toggle("is-short", short);
            this.root.classList.toggle("is-micro", micro);
            this.root.classList.toggle("is-narrow", narrow);
            this.root.style.setProperty("--turno-layout-ratio", String(safeRatio));
            this.root.style.setProperty("--turno-layout-width", `${Math.round(width || 0)}px`);
            this.root.style.setProperty("--turno-layout-height", `${Math.round(height || 0)}px`);

        }


        _viewInterval() {
            return (this.breach || this.callActive || this.ventActive || this.clientActive)
                ? 78
                : 108;
        }


        reset() {

            this.difficulty = TURNO_DIFFICULTIES[this.difficulty] ? this.difficulty : this.readDifficulty();
            this.difficultyOpen = false;
            this.assetsReady = false;
            this.phase = "briefing";
            this.elapsed = 0;
            this.levelIndex = 0;
            this.night = 1;
            this.dawn = false;
            this.nextNight = false;
            this.levelElapsed = 0;
            this.energy = ENERGY_MAX;
            this.panic = this.tuning.startPanic;
            this.score = 0;
            this.threatStage = 0;
            this.advanceTimer = 0;
            this.attackTimer = 0;
            this.doorHold = 0;
            this.lightTimer = 0;
            this.breatheCooldown = 0;
            this.paintTimer = 0;
            this.recordsOpen = false;
            this.recordsMode = "team";
            this.recordsCharacter = "rog";
            this.recordsExpression = "serio";
            this.selectedCamera = CAMERAS[0].id;
            this.monitorOpen = false;
            this.lightOn = false;
            this.doorClosed = false;
            this.hiddenUnderDesk = false;
            this.blackout = false;
            this.blackoutAnnounced = false;
            this.panicWarning = false;
            this.repelled = 0;
            this.lossShown = false;
            this.lossReason = "";
            this.lossKind = "";
            this.lossCopy = null;
            this.caprilesTimer = 0;
            this.cinematicIndex = 0;
            this.cinematic = null;
            this.tutorialIndex = 0;
            this.tutorial = null;
            this.psychologicalKind = "";
            this.psychologicalTimer = 0;
            this.nextPsychologicalAt = Infinity;
            this.psychologicalCount = 0;
            this.interlude = null;
            this.bridgeIntro = null;
            this.pendingOpening = null;
            this.storyBeatIndex = 0;
            this.objectiveProgress = 0;
            this.objectiveDone = false;
            this.objectivePrompted = false;
            this.callActive = false;
            this.callTimer = 0;
            this.callTriggered = false;
            this.callResolved = false;
            this.ventActive = false;
            this.ventTimer = 0;
            this.ventTriggered = false;
            this.ventResolved = false;
            this.breach = null;
            this.nextBreachAt = 0;
            this.lastBreachRoute = "";
            this.clientActive = null;
            this.clientTerminalOpen = false;
            this.nextClientAt = 0;
            this.clientIndex = 0;
            this.clientDeck = [];
            this.clientLastTemplate = -1;
            this.clientMissed = 0;
            this.vipTurnoBonus = { energy: 0, panic: 0, clientGrace: 0, ventDiscount: 0 };
            this.signalGlitch = 0;
            this.transcript = [];
            this.transcriptSignature = "";
            this.isPaused = false;

            this.expressions = this.team.reduce((state, member) => {
                state[member.id] = member.idle;
                return state;
            }, {});

            this.radio = {
                member: "rog",
                expression: "serio",
                message: "La línea está quieta. No significa que esté vacía. Ojalá fuera una falsa alarma, por variar."
            };

            this._stopHorror(true);

            if (this.refs.records) {
                this.refs.records.hidden = true;
            }
            if (this.refs.story) {
                this.refs.story.hidden = true;
            }
            if (this.refs.caprilesReveal) {
                this.refs.caprilesReveal.hidden = true;
            }
            if (this.refs.cinematic) {
                this.refs.cinematic.hidden = true;
            }
            if (this.refs.clientTerminal) {
                this.refs.clientTerminal.hidden = true;
            }
            if (this.refs.clientNotice) {
                this.refs.clientNotice.hidden = true;
            }
            if (this.refs.difficulty) {
                this.refs.difficulty.hidden = true;
            }
            if (this.refs.tutorial) {
                this.refs.tutorial.hidden = true;
            }

            this.root.classList.remove(
                "is-records-open",
                "is-jumpscare",
                "is-story-open",
                "is-call-active",
                "is-signal-glitch",
                "is-capriles-reveal",
                "is-cinematic",
                "is-vent-active",
                "is-breach-active",
                "is-breach-window",
                "is-client-active",
                "is-client-terminal-open",
                "is-difficulty-open",
                "is-tutorial-open",
                "is-psychological-flicker",
                "is-psychological-cut"
            );
            this._renderTranscript();
            this._syncView(true);
            this._updateHud();
            this.announce("Guardia preparada. Elige un protocolo para recibir la primera transmisión.");

        }


        start() {

            this.reset();

            /* TURNO 404 no mezcla pistas: al comenzar la guardia se apaga
               cualquier tema del HUB; horror-turno404 espera el hito 04:00. */
            if (A.audio && typeof A.audio.stopMusic === "function") {
                A.audio.stopMusic();
            }

            this.openDifficultySelection();

        }


        _startCinematic() {

            this._preloadCinematicArt();
            this.difficultyOpen = false;
            this.phase = "cinematic";
            this.cinematicIndex = 0;
            this.cinematic = OPENING_CINEMATIC[0];
            this.announce("Cinemática de apertura. Pulsa Espacio o toca Continuar para avanzar a tu ritmo.");
            this._applyCinematicScene(true);
            this._stopHorror(true);
            this._syncView(true);
            this._updateHud();

        }


        _preloadCinematicArt() {

            if (!A.assets || typeof A.assets.preload !== "function") {
                return;
            }

            /* Se prepara la escena actual y la siguiente mientras se lee;
               así la narrativa sigue fluida sin cargar todas las expresiones
               del archivo de una sola vez. */
            const upcoming = OPENING_CINEMATIC.slice(this.cinematicIndex, this.cinematicIndex + 2);
            const ids = this._cinematicImageIds(upcoming);

            this._warmAssets(ids.concat(["boss.capriles"]));

        }


        _applyCinematicScene(announceScene) {

            const scene = this.cinematic;
            if (!scene) {
                return;
            }

            this._preloadCinematicArt();

            const cue = scene.lines.find((line) => line.member && line.member !== "entity") || scene.lines[0];
            if (cue) {
                this._cue(cue.member || "sil", cue.expression || "alerta", cue.message, true);
            }

            if (scene.tone) {
                this._tone(scene.tone);
            }

            this._syncCinematic();
            if (announceScene) {
                this.announce(`${scene.kicker}. ${scene.title}.`);
            }

        }


        advanceCinematic() {

            if (this.phase !== "cinematic") {
                return false;
            }

            if (this.cinematicIndex < OPENING_CINEMATIC.length - 1) {
                this.cinematicIndex += 1;
                this.cinematic = OPENING_CINEMATIC[this.cinematicIndex];
                this._applyCinematicScene(true);
                this._syncView(true);
                return true;
            }

            this.cinematic = null;
            this._startTutorial();
            return true;

        }


        _startTutorial() {

            this.phase = "tutorial";
            this.tutorialIndex = 0;
            this.tutorial = OFFICE_TUTORIAL[0];
            this._preloadTutorialArt();
            this._applyTutorialStep(true);
            this._stopHorror(true);
            this._syncView(true);
            this._updateHud();

        }


        _preloadTutorialArt() {

            const ids = OFFICE_TUTORIAL.map((step) =>
                this._imageId(this.member(step.member), step.expression)
            );

            this._warmAssets(ids);

        }


        _applyTutorialStep(announceStep) {

            const step = OFFICE_TUTORIAL[this.tutorialIndex];

            if (!step) {
                return;
            }

            this.tutorial = step;
            this._cue(step.member, step.expression, step.message, true);
            this._syncTutorial();

            if (announceStep) {
                this.announce(`${step.kicker}. ${step.title}. ${step.action}.`);
            }

        }


        advanceTutorial() {

            if (this.phase !== "tutorial") {
                return false;
            }

            if (this.tutorialIndex < OFFICE_TUTORIAL.length - 1) {
                this.tutorialIndex += 1;
                this._applyTutorialStep(true);
                this._tone("select");
                this._syncView(true);
                return true;
            }

            this.tutorial = null;
            this.tutorialIndex = 0;
            this.announce("Guía completada. La primera transmisión espera tu ritmo.");
            this._prepareLevel(0, null, false);
            return true;

        }


        skipTutorial() {

            if (this.phase !== "tutorial") {
                return false;
            }

            this.tutorial = null;
            this.tutorialIndex = 0;
            this._tone("move");
            this.announce("Guía omitida. La primera transmisión espera tu ritmo.");
            this._prepareLevel(0, null, false);
            return true;

        }


        _currentLevel() {
            return TURNOS[Math.min(this.levelIndex, TURNOS.length - 1)];
        }


        _nightPace() {
            /* DIFÍCIL conserva la curva original. Los otros protocolos
               desaceleran la aproximación, sin borrar el aumento nocturno. */
            return (1 + Math.max(0, this.night - 1) * 0.13) * this.tuning.threat;
        }


        _clockMinutes() {

            if (this.dawn) {
                return 360;
            }

            const level = this._currentLevel();

            if (this.levelIndex !== TURNOS.length - 1) {
                return level.startMinutes + (this.levelElapsed / this._levelDuration(level)) *
                    (level.endMinutes - level.startMinutes);
            }

            const progress = Math.max(0, Math.min(1, this.levelElapsed / this._levelDuration(level)));
            let minute = FINAL_CLOCK_STEPS[0].minutes;

            FINAL_CLOCK_STEPS.forEach((step) => {
                if (progress >= step.at) {
                    minute = step.minutes;
                }
            });

            /* El último valor durante juego es 05:55; sólo la transición de
               turno habilita el 06:00 real mediante `dawn`. */
            return minute;

        }


        _nextBreachMoment(level, cooldown = 0) {

            const duration = this._levelDuration(level);
            const tail = this._responseWindow(9000);

            if (duration - this.levelElapsed < tail) {
                return Infinity;
            }

            const latest = duration - this._responseWindow(7800);
            const proposal = this.levelElapsed + this._incidentDelay(cooldown + 9000 + Math.random() * 6200);
            return Math.min(latest, Math.max(this.levelElapsed + this._incidentDelay(3600), proposal));

        }


        _nextClientMoment(level, cooldown = 0) {

            const duration = this._levelDuration(level);
            const tail = this._responseWindow(6800);

            if (duration - this.levelElapsed < tail) {
                return Infinity;
            }

            const latest = duration - this._responseWindow(5800);
            const proposal = this.levelElapsed + this._incidentDelay(cooldown + 7000 + Math.random() * 5200);
            return Math.min(latest, Math.max(this.levelElapsed + this._incidentDelay(3000), proposal));

        }


        _prepareLevel(index, bridge, startImmediately = false) {

            const level = TURNOS[index];

            if (!level) {
                this._win();
                return;
            }

            this._preloadLevelArt(level);
            this.levelIndex = index;
            this.levelElapsed = 0;
            this.dawn = false;
            this.nextNight = false;
            this.threatStage = level.startStage;
            this.advanceTimer = this._responseWindow(level.initialAdvance);
            this.attackTimer = 0;
            this.doorHold = 0;
            this.lightTimer = 0;
            this.breatheCooldown = 0;
            this.monitorOpen = false;
            this.lightOn = false;
            this.doorClosed = false;
            this.hiddenUnderDesk = false;
            this.blackout = false;
            this.blackoutAnnounced = false;
            this.panicWarning = false;
            this.objectiveProgress = 0;
            this.objectiveDone = false;
            this.objectivePrompted = false;
            this.callActive = false;
            this.callTimer = 0;
            this.callTriggered = false;
            this.callResolved = false;
            this.ventActive = false;
            this.ventTimer = 0;
            this.ventTriggered = false;
            this.ventResolved = false;
            this.breach = null;
            this.nextBreachAt = this._nextBreachMoment(level);
            this.clientActive = null;
            this.clientTerminalOpen = false;
            this.nextClientAt = this._nextClientMoment(level);
            this.clientMissed = 0;
            this.signalGlitch = 0;
            this.psychologicalKind = "";
            this.psychologicalTimer = 0;
            this.nextPsychologicalAt = Infinity;
            this.psychologicalCount = 0;
            this.storyBeatIndex = 0;
            this.pendingOpening = level.opening;
            this.bridgeIntro = bridge ? level.intro : null;

            if (index > 0) {
                this.energy = utils.clamp(this.energy + this._recovery(level.recoverEnergy), 0, ENERGY_MAX);
                this.panic = Math.max(8, this.panic - this._recovery(level.recoverPanic));
            }

            if (startImmediately) {
                this.phase = "running";
                this.interlude = null;
                this._schedulePsychologicalHorror(7600);
                this._cue(level.intro.member, level.intro.expression, level.intro.message, true);
                this._startHorror(true);
                this._syncView(true);
                this._updateHud();
                return;
            }

            this.phase = "interlude";
            this.interlude = {
                label: bridge ? `NIVEL ${index} SUPERADO // ${level.label}` : level.label,
                title: level.title,
                checkpoint: level.checkpoint,
                member: (bridge || level.intro).member,
                expression: (bridge || level.intro).expression,
                message: (bridge || level.intro).message
            };

            this._cue(
                this.interlude.member,
                this.interlude.expression,
                this.interlude.message,
                true
            );

            if (index === 1) {
                /* El sector 02 arranca exactamente a las 04:00. El tema entra
                   mientras el jugador puede leer el relevo a su propio ritmo. */
                this._startHorror(true);
            } else {
                this._stopHorror(false);
            }

            this._syncView(true);
            this._updateHud();

        }


        continueStory() {

            if (this.phase !== "interlude") {
                return false;
            }

            if (this.nextNight) {
                this.nextNight = false;
                this.night += 1;
                /* El amanecer ofrece un respiro, pero la siguiente noche
                   arranca con el desgaste que sobrevivió, no con un reset. */
                this.energy = utils.clamp(Math.max(this.energy, 62) + this._recovery(14), 0, ENERGY_MAX);
                this.panic = Math.max(10, this.panic - this._recovery(16));
                /* La siguiente noche vuelve a las 03:18: el tema de las
                   04:00 se rebobina y espera de nuevo su hito horario. */
                this._stopHorror(true);
                this._prepareLevel(0, null, true);
                this._cue(
                    "rog",
                    "serio",
                    `Noche ${String(this.night).padStart(2, "0")}: el reloj volvió a correr. Revisé las rutas; ninguna promete ser la misma.`,
                    true
                );
                this._syncView(true);
                this._updateHud();
                return true;
            }

            const level = this._currentLevel();

            this.phase = "running";
            this._schedulePsychologicalHorror(7600);

            if (this.bridgeIntro) {
                this._cue(
                    this.bridgeIntro.member,
                    this.bridgeIntro.expression,
                    this.bridgeIntro.message,
                    true
                );
                this.bridgeIntro = null;
            }

            this._startHorror(this.elapsed === 0);
            this._syncView(true);
            this._updateHud();
            this.announce(`${level.label}: ${level.objective.label}.`);

            return true;

        }


        restart() {

            /* GameShell prepara READY antes de pedir restart al volver a
               abrir una partida terminada. No suena Horror hasta JUGAR. */
            if (this.shell.state === "ready") {
                this.reset();
                return;
            }

            this.start();

        }


        /* El shell entrega los suministros y la afinidad una vez que `start`
           ya limpió la partida. Guardamos los efectos de turno para que el
           relevo entre sectores también los respete. */
        applyVipBonus(bonus, usedItems = []) {

            const perks = bonus && bonus.turno404 ? bonus.turno404 : null;

            if (!perks) {
                return;
            }

            this.vipTurnoBonus = {
                energy: Math.max(0, Math.floor(perks.energy || 0)),
                panic: Math.max(0, Math.floor(perks.panic || 0)),
                clientGrace: Math.max(0, Math.floor(perks.clientGrace || 0)),
                ventDiscount: Math.max(0, Math.floor(perks.ventDiscount || 0))
            };
            this.energy = utils.clamp(this.energy + this.vipTurnoBonus.energy, 0, ENERGY_MAX);
            this.panic = Math.max(0, this.panic - this.vipTurnoBonus.panic);

            const applied = [];
            if (this.vipTurnoBonus.energy) applied.push(`+${this.vipTurnoBonus.energy} ENERGÍA`);
            if (this.vipTurnoBonus.panic) applied.push(`−${this.vipTurnoBonus.panic} PÁNICO`);
            if (this.vipTurnoBonus.clientGrace) applied.push("BUFFER CLIENTES");
            if (this.vipTurnoBonus.ventDiscount) applied.push("DUCTO EFICIENTE");

            if (applied.length) {
                this.shell.setStatus("VIP CENTRAL: " + applied.join(" · "));
                this.announce("Apoyo VIP listo: " + applied.join(", ") + ".");
                this._syncView(true);
                this._updateHud();
            }

        }


        pause() {

            this.isPaused = true;
            this._stopHorror(false);

        }


        resume() {

            this.isPaused = false;

            if (this._hasReachedHorrorHour() && !this.recordsOpen) {
                this._startHorror(false);
            }

        }


        destroy() {

            this._stopHorror(true);

            if (this.root) {
                this.root.removeEventListener("click", this._onClick);

                if (this.root.parentNode) {
                    this.root.parentNode.removeChild(this.root);
                }
            }

            if (this.recordsButton) {
                this.recordsButton.remove();
            }

        }


        _hasReachedHorrorHour() {

            /* El reloj ya marca 04:00 durante el relevo narrativo entre los
               sectores 01 y 02. Permitimos la entrada ahí para que el cambio
               ocurra con la hora real, no después de que se cierre el texto. */
            return (this.phase === "running" || this.phase === "interlude") &&
                this._clockMinutes() >= HORROR_ENTRY_MINUTES;

        }


        _startHorror(restart = false) {

            if (
                !this.horrorTrack ||
                !this._musicEnabled() ||
                this.isPaused ||
                !this._hasReachedHorrorHour() ||
                this.horrorStartPending
            ) {
                return false;
            }

            const track = this.horrorTrack;

            /* Continuar la lectura después de las 04:00 no reinicia ni
               acorta el fundido que ya está ocurriendo en el relevo. */
            if (track.paused === false && !restart) {
                return true;
            }

            const version = ++this.horrorVersion;
            const entering = Boolean(restart || !this.horrorHasEntered);
            this.horrorStartPending = true;

            if (entering) {
                try {
                    track.currentTime = 0;
                } catch (error) { /* espera metadatos */ }

                track.volume = 0.005;
            }

            Promise.resolve(A.assets.playAudio(track, false)).then((playing) => {

                this.horrorStartPending = false;

                if (version !== this.horrorVersion || !playing || this.isPaused) {
                    return;
                }

                this.horrorHasEntered = true;
                this._fadeHorrorTo(
                    this._horrorVolume(),
                    entering ? HORROR_ENTRY_FADE_MS : HORROR_RESUME_FADE_MS,
                    version
                );

            }).catch(() => {
                if (version === this.horrorVersion) {
                    this.horrorStartPending = false;
                }
            });

            return true;

        }


        _fadeHorrorTo(target, duration, version = this.horrorVersion) {

            const track = this.horrorTrack;

            if (!track) {
                return;
            }

            if (this.horrorRaf !== null) {
                window.cancelAnimationFrame(this.horrorRaf);
                this.horrorRaf = null;
            }

            const from = Number(track.volume) || 0;
            const safeTarget = Math.max(0, Math.min(1, Number(target) || 0));
            const safeDuration = Math.max(0, Number(duration) || 0);
            this.horrorFadeTarget = safeTarget;
            this.horrorFadeActive = true;

            if (safeDuration === 0 || Math.abs(safeTarget - from) < 0.002) {
                track.volume = safeTarget;
                this.horrorFadeActive = false;
                return;
            }

            const start = window.performance && window.performance.now
                ? window.performance.now()
                : Date.now();

            const tick = (now) => {

                if (version !== this.horrorVersion || !this.horrorTrack) {
                    this.horrorRaf = null;
                    this.horrorFadeActive = false;
                    return;
                }

                const elapsed = Math.max(0, now - start);
                const progress = Math.min(1, elapsed / safeDuration);
                const eased = 1 - Math.pow(1 - progress, 3);

                track.volume = Math.max(0, Math.min(1, from + (safeTarget - from) * eased));

                if (progress < 1) {
                    this.horrorRaf = window.requestAnimationFrame(tick);
                } else {
                    this.horrorRaf = null;
                    this.horrorFadeActive = false;
                }

            };

            this.horrorRaf = window.requestAnimationFrame(tick);

        }


        _stopHorror(rewind) {

            this.horrorVersion += 1;
            this.horrorStartPending = false;
            this.horrorFadeActive = false;
            this.horrorFadeTarget = 0;

            if (this.horrorRaf !== null) {
                window.cancelAnimationFrame(this.horrorRaf);
                this.horrorRaf = null;
            }

            if (this.horrorTrack) {
                A.assets.stopAudio(this.horrorTrack, Boolean(rewind));
            }

            if (rewind) {
                this.horrorHasEntered = false;
            }

        }


        _musicEnabled() {
            return !A.audio || typeof A.audio.isMusicEnabled !== "function"
                ? true
                : A.audio.isMusicEnabled();
        }


        _sfxEnabled() {
            return !A.audio || typeof A.audio.isEnabled !== "function"
                ? true
                : A.audio.isEnabled();
        }


        _playManguanguaScream() {

            if (!this._sfxEnabled()) {
                return false;
            }

            const track = this.manguanguaScreamTrack;

            if (!track || this.screamAssetFailed) {
                this._tone("caprilesScream");
                return false;
            }

            const version = ++this.screamVersion;

            try {
                track.volume = MANGUANGUA_SCREAM_VOLUME;
            } catch (error) { /* volumen no disponible */ }

            Promise.resolve(A.assets.playAudio(track, true)).then((playing) => {
                if (!playing && version === this.screamVersion) {
                    this._tone("caprilesScream");
                }
            }).catch(() => {
                if (version === this.screamVersion) {
                    this._tone("caprilesScream");
                }
            });

            return true;

        }


        _syncAudio() {

            const allowed = this._musicEnabled();
            const horrorDue = this._hasReachedHorrorHour();

            if (allowed !== this.musicAllowed) {

                this.musicAllowed = allowed;

                if (!allowed) {
                    this._stopHorror(false);
                } else if (horrorDue && !this.isPaused && !this.recordsOpen) {
                    this._startHorror(false);
                }

            }

            if (!allowed || !horrorDue || this.isPaused || this.recordsOpen) {
                return;
            }

            if (this.horrorTrack && !this.horrorTrack.paused) {
                const wanted = this._horrorVolume();

                /* Nunca se pisa el fundido largo de las 04:00 con una
                   asignación directa en el frame siguiente. Los ajustes de
                   tensión posteriores son breves, pero también progresivos. */
                if (!this.horrorFadeActive && Math.abs(this.horrorTrack.volume - wanted) > 0.012) {
                    this._fadeHorrorTo(wanted, HORROR_ADJUST_FADE_MS, this.horrorVersion);
                }
            } else {
                this._startHorror(false);
            }

        }


        _horrorVolume() {

            /* Horror entra a las 04:00 y luego sube perceptiblemente cuando
               el pasillo y el pánico cierran, sin sobrepasar la voz del juego. */
            const clientPressure = this.clientActive
                ? (this.clientTerminalOpen ? 0.024 : 0.014)
                : 0;

            return utils.clamp(
                0.13 + this.threatStage * 0.018 + this.panic * 0.0004 + clientPressure,
                0.13,
                0.23
            );

        }


        update(dt) {

            this._syncAudio();

            if (this.recordsOpen || this.isPaused) {
                return;
            }

            /* La cinemática y cada relevo se quedan abiertos sin reloj.
               Sólo ESPACIO, Enter o el botón CONTINUAR cambian de escena. */
            if (MANUAL_NARRATIVE_ADVANCE &&
                (this.phase === "cinematic" || this.phase === "tutorial" || this.phase === "interlude")) {
                return;
            }

            if (this.phase === "revealing") {
                this.caprilesTimer = Math.max(0, this.caprilesTimer - dt);

                if (this.caprilesTimer <= 0) {
                    this._finishLoss();
                }

                return;
            }

            if (this.phase !== "running") {
                return;
            }

            const level = this._currentLevel();
            const seconds = dt / 1000;

            this.elapsed += dt;
            this.levelElapsed = Math.min(this._levelDuration(level), this.levelElapsed + dt);
            this._updateResources(dt, seconds);

            if (this.phase !== "running") {
                return;
            }

            this._updateSignal(dt);
            this._updateVent(dt);
            this._updateNarrative(dt);
            this._updatePsychologicalHorror(dt);
            this._updateObjective(dt);

            /* Si la evidencia ya está validada, el corte horario gana al
               último fotograma de ataque: la campaña se siente exigente,
               no arbitraria. */
            if (this.levelElapsed >= this._levelDuration(level) && this.objectiveDone) {
                this._completeLevel();
                return;
            }

            this._updateBreach(dt);

            if (this.phase !== "running") {
                return;
            }

            this._updateClientMessages(dt);

            if (this.phase !== "running") {
                return;
            }

            this._updateThreat(dt, seconds);

            if (this.phase !== "running") {
                return;
            }

            this._updatePanic(dt, seconds);

            if (this.phase !== "running") {
                return;
            }

            this.breatheCooldown = Math.max(0, this.breatheCooldown - dt);
            this.paintTimer += dt;

            if (this.paintTimer >= this._viewInterval()) {
                this.paintTimer = 0;
                this._syncView();
                this._updateHud();
            }

            if (this.levelElapsed >= this._levelDuration(level) && !this.objectivePrompted) {
                this.objectivePrompted = true;
                this._cue(
                    "sil",
                    "preocupada",
                    "El reloj llegó al corte, pero aún falta la pista. Vuelve a la cámara indicada.",
                    true
                );
                this._syncView(true);
            }

        }


        /* El relato ocurre mientras se juega: transmisiones programadas,
           objetivo de cámara y una llamada hostil por nivel. */
        _updateNarrative(dt) {

            const level = this._currentLevel();

            if (this.signalGlitch > 0) {
                this.signalGlitch = Math.max(0, this.signalGlitch - dt);
            }

            if (this.pendingOpening && this.levelElapsed >= 1800) {
                const opening = this.pendingOpening;
                this.pendingOpening = null;
                this._cue(opening.member, opening.expression, opening.message, true);
            }

            let resourcesChanged = false;

            while (this.storyBeatIndex < level.beats.length &&
                this.levelElapsed >= level.beats[this.storyBeatIndex].at) {
                const beat = level.beats[this.storyBeatIndex];
                this.storyBeatIndex += 1;
                this._cue(beat.member, beat.expression, beat.message, true);
                this.signalGlitch = Math.max(this.signalGlitch, 650);
                if (beat.panic) {
                    this.panic = utils.clamp(this.panic + this._penalty(beat.panic), 0, PANIC_MAX);
                    resourcesChanged = true;
                }
                if (beat.energy) {
                    this.energy = utils.clamp(this.energy + this._recovery(beat.energy), 0, ENERGY_MAX);
                    resourcesChanged = true;
                }
            }

            if (resourcesChanged) {
                this._updateHud();
            }

            if (!this.callTriggered && level.signal && this.levelElapsed >= level.signal.at) {
                this.callTriggered = true;
                this.callActive = true;
                this.callTimer = this._responseWindow(level.signal.duration, 2800);
                this.signalGlitch = Math.max(this.signalGlitch, 900);
                this._cue(
                    level.signal.cue.member,
                    level.signal.cue.expression,
                    level.signal.cue.message,
                    true
                );
                this._tone("interferencia");
                this._syncView(true);
            }

            if (!this.ventTriggered && level.vent && this.levelElapsed >= level.vent.at) {
                this.ventTriggered = true;
                this.ventActive = true;
                this.ventTimer = this._responseWindow(level.vent.duration, 2400);
                this.signalGlitch = Math.max(this.signalGlitch, 1000);
                this._cue(
                    level.vent.cue.member,
                    level.vent.cue.expression,
                    level.vent.cue.message,
                    true
                );
                this._tone("interferencia");
                this._syncView(true);
            }

        }


        _updateObjective(dt) {

            const objective = this._currentLevel().objective;

            if (!objective || this.objectiveDone) {
                return;
            }

            const needed = this._objectiveNeed(objective);

            if (this.monitorOpen && this.currentCamera().id === objective.camera) {
                this.objectiveProgress = Math.min(needed, this.objectiveProgress + dt);
            }

            if (this.objectiveProgress < needed) {
                return;
            }

            this.objectiveDone = true;
            this.score += objective.reward;
            this.energy = utils.clamp(this.energy + this._recovery(objective.energy), 0, ENERGY_MAX);
            this.panic = Math.max(0, this.panic - this._recovery(objective.panic));
            this._cue(
                objective.cue.member,
                objective.cue.expression,
                objective.cue.message,
                true
            );
            this._tone("secreto");
            this._syncView(true);
            this._updateHud();

        }


        _updateSignal(dt) {

            if (!this.callActive) {
                return;
            }

            this.callTimer = Math.max(0, this.callTimer - dt);

            if (this.callTimer > 0) {
                return;
            }

            const signal = this._currentLevel().signal;
            this.callActive = false;
            this.signalGlitch = Math.max(this.signalGlitch, 1150);
            this.panic = utils.clamp(this.panic + this._penalty(signal.penalty), 0, PANIC_MAX);
            this.advanceTimer = Math.max(0, this.advanceTimer - this._penalty(signal.accelerate));
            this._cue(
                signal.missed.member,
                signal.missed.expression,
                signal.missed.message,
                true
            );
            this._tone("vacio");
            this._syncView(true);
            this._updateHud();

        }


        _updateVent(dt) {

            if (!this.ventActive) {
                return;
            }

            this.ventTimer = Math.max(0, this.ventTimer - dt);

            if (this.ventTimer > 0) {
                return;
            }

            const vent = this._currentLevel().vent;
            this.ventActive = false;
            this.signalGlitch = Math.max(this.signalGlitch, 1300);
            this.panic = utils.clamp(this.panic + this._penalty(vent.penalty), 0, PANIC_MAX);
            this.advanceTimer = Math.max(0, this.advanceTimer - this._penalty(vent.accelerate));

            if (this.threatStage >= 3) {
                this.attackTimer = Math.max(0, this.attackTimer - this._penalty(vent.accelerate) * 0.65);
            }

            this._cue(vent.missed.member, vent.missed.expression, vent.missed.message, true);
            this._tone("dano");
            this._syncView(true);
            this._updateHud();

        }


        dischargeVent() {

            const lateralBreach = this.breach && this.breach.id === "ducto";

            if ((!this.ventActive && !lateralBreach) || this.phase !== "running") {
                this.announce("No hay una descarga de ducto pendiente.");
                this._tone("vacio");
                return false;
            }

            const discount = this.vipTurnoBonus ? this.vipTurnoBonus.ventDiscount : 0;
            const cost = Math.max(1, this._energyCost(4) - discount);

            if (this.energy < cost) {
                this.announce("La batería no alcanza para descargar el ducto.");
                this._tone("vacio");
                return false;
            }

            if (lateralBreach) {
                this.energy = Math.max(0, this.energy - cost);
                return this._resolveBreach("DESCARGA V");
            }

            const vent = this._currentLevel().vent;
            this.ventActive = false;
            this.ventResolved = true;
            this.ventTimer = 0;
            this.energy = Math.max(0, this.energy - cost);
            this.score += 115;
            this.panic = Math.max(0, this.panic - this._recovery(5));
            this.signalGlitch = Math.max(this.signalGlitch, 700);
            this._cue(vent.discharge.member, vent.discharge.expression, vent.discharge.message, true);
            this._tone("select");
            this._syncView(true);
            this._updateHud();

            return true;

        }


        cutSignal() {

            if (!this.callActive || this.phase !== "running") {
                this.announce("No hay una llamada activa que cortar.");
                this._tone("vacio");
                return false;
            }

            const signal = this._currentLevel().signal;
            this.callActive = false;
            this.callResolved = true;
            this.callTimer = 0;
            this.score += 90;
            this.panic = Math.max(0, this.panic - this._recovery(5));
            this._cue(signal.cut.member, signal.cut.expression, signal.cut.message, true);
            this._tone("select");
            this._syncView(true);
            this._updateHud();

            return true;

        }


        _completeLevel() {

            if (this.phase !== "running") {
                return;
            }

            const level = this._currentLevel();
            const levelScore = 360 + Math.round(this.energy * 2);

            this.score += levelScore;
            /* Cada tramo de guardia convierte su propio rendimiento en
               FICHAS VIP sin esperar al cierre completo de la tercera noche. */
            if (this.shell && typeof this.shell.awardVipLevel === "function") {
                this.shell.awardVipLevel(levelScore, `TURNO 404 · ${level.label} SUPERADO`);
            }

            if (this.levelIndex >= TURNOS.length - 1) {
                this._closeNight(level);
                return;
            }

            this._tone("win");
            this._prepareLevel(this.levelIndex + 1, level.outro);

        }


        _closeNight(level) {

            /* La bandera mantiene 06:00 en pantalla durante el relevo. No se
               puede ver esa hora al final del temporizador y seguir jugando. */
            this.dawn = true;

            if (this.night >= NIGHT_COUNT) {
                this._win();
                return;
            }

            const completed = this.night;
            const next = completed + 1;

            this.phase = "interlude";
            this.nextNight = true;
            this.interlude = {
                label: `NOCHE ${String(completed).padStart(2, "0")} CERRADA`,
                title: "06:00 AM // EL RELOJ NO TE LIBERÓ",
                checkpoint: `RELEVO NOCTURNO ${String(next).padStart(2, "0")} / ${String(NIGHT_COUNT).padStart(2, "0")}`,
                member: "sil",
                expression: "preocupada",
                message: `Las seis llegaron. La línea cayó unos segundos y volvió a pedir guardia. Prepárate para la noche ${next}.`
            };

            this._stopHorror(false);
            this._cue(this.interlude.member, this.interlude.expression, this.interlude.message, true);
            this._tone("win");
            this._syncView(true);
            this._updateHud();
            this.announce(`06:00 AM. Noche ${completed} superada; Espacio inicia el relevo ${next}.`);

        }


        render() {
            /* La oficina es una escena DOM: sincroniza entre 78 y 108 ms
               según la alerta, evita reflow por frame y deja margen al audio. */
        }


        /* Estos sobresaltos son de puesta en escena, nunca una amenaza
           escondida: no cambian reloj, energía, pánico, ruta ni ventana de
           respuesta. Se aplazan si ya hay una alerta que leer. */
        _schedulePsychologicalHorror(delay = 10500) {

            const level = this._currentLevel();
            const duration = this._levelDuration(level);
            const safeTail = this._responseWindow(9200);

            if (duration - this.levelElapsed <= safeTail) {
                this.nextPsychologicalAt = Infinity;
                return;
            }

            const proposed = this.levelElapsed + this._incidentDelay(delay);
            this.nextPsychologicalAt = Math.min(
                duration - safeTail,
                Math.max(this.levelElapsed + 1800, proposed)
            );

        }


        _updatePsychologicalHorror(dt) {

            if (this.psychologicalTimer > 0) {
                this.psychologicalTimer = Math.max(0, this.psychologicalTimer - dt);

                if (this.psychologicalTimer === 0) {
                    this.psychologicalKind = "";
                    this._schedulePsychologicalHorror(11200 + this.psychologicalCount * 900);
                    this._syncView(true);
                }

                return;
            }

            if (!Number.isFinite(this.nextPsychologicalAt) || this.levelElapsed < this.nextPsychologicalAt) {
                return;
            }

            /* Las decisiones activas siempre son más importantes que un
               sobresalto ambiental. El efecto simplemente espera un hueco. */
            if (
                this.blackout || this.energy <= 0 || this.breach || this.callActive
                || this.ventActive || this.clientActive || this.threatStage >= 3
            ) {
                this.nextPsychologicalAt = this.levelElapsed + 1800;
                return;
            }

            this.psychologicalCount += 1;
            this.psychologicalKind = this.psychologicalCount % 2 === 0 ? "cut" : "flicker";
            this.psychologicalTimer = this.psychologicalKind === "cut" ? 1180 : 460;
            this.nextPsychologicalAt = Infinity;
            this._syncView(true);

        }


        _updateResources(dt, seconds) {

            let drain = this._currentLevel().drain;

            if (this.monitorOpen) {
                drain += 0.11;
            }

            if (this.lightOn) {
                drain += 0.18;
            }

            if (this.doorClosed) {
                drain += 0.29;
            }

            if (this.hiddenUnderDesk) {
                drain += 0.03;
            }

            this.energy = Math.max(0, this.energy - drain * this.tuning.resource * seconds);

            if (this.lightOn) {
                this.lightTimer = Math.max(0, this.lightTimer - dt);

                if (this.lightTimer <= 0) {
                    this.lightOn = false;
                    this._cue("rog", "preocupado", "No mantengas la luz encendida. Nos deja sin batería; lo calculé para que salgamos todos.", false);
                }
            }

            if (this.energy > 0) {
                return;
            }

            this.blackout = true;
            this.monitorOpen = false;
            this.lightOn = false;
            this.doorClosed = false;

            if (!this.blackoutAnnounced) {
                this.blackoutAnnounced = true;
                this._cue(
                    "colinas",
                    "miedo",
                    "Se fue la energía. No hagas ruido. No mires la puerta; esto no estaba incluido en la membresía.",
                    true
                );
            }

        }


        _chooseBreachRoute() {

            const ids = Object.keys(BREACH_ROUTES).filter((id) => id !== this.lastBreachRoute);
            const available = ids.length ? ids : Object.keys(BREACH_ROUTES);
            const id = available[Math.floor(Math.random() * available.length)];

            this.lastBreachRoute = id;
            return BREACH_ROUTES[id];

        }


        _triggerBreach() {

            const route = this._chooseBreachRoute();
            const duration = this._responseWindow(route.duration, 2800);

            this.breach = Object.assign({}, route, { timer: duration, max: duration });
            this.signalGlitch = Math.max(this.signalGlitch, 1250);
            this._cue(route.cue[0], route.cue[1], route.cue[2], true);
            /* Grito entregado al materializarse por cualquier acceso lateral. */
            this._playManguanguaScream();
            this.announce(`Manguangua en ${route.label}. ${route.key} para responder.`);
            this._syncView(true);
            this._updateHud();

        }


        _updateBreach(dt) {

            const level = this._currentLevel();

            if (this.breach) {
                this.breach.timer = Math.max(0, this.breach.timer - dt);

                if (this.breach.timer > 0) {
                    return;
                }

                const route = this.breach;
                this.breach = null;
                this._lose(route.failure, route.id);
                return;
            }

            if (this.levelElapsed < this.nextBreachAt || !Number.isFinite(this.nextBreachAt)) {
                return;
            }

            /* Nunca se inicia una ruta lateral si ya no queda su ventana de
               reacción completa. Esto también neutraliza una cita antigua que
               haya quedado atrasada tras una llamada/cliente prolongado. */
            if (this._levelDuration(level) - this.levelElapsed < this._responseWindow(9000)) {
                this.nextBreachAt = Infinity;
                return;
            }

            /* No superponemos un acceso lateral con una alarma que ya exige
               tecla propia: la imprevisibilidad no debe sentirse arbitraria.
               Si el siguiente intento ya caería dentro del cierre, se cancela
               en vez de dejar nextBreachAt en el pasado. */
            if (this.threatStage >= 3 || this.callActive || this.ventActive || this.clientActive) {
                const retryAt = this.levelElapsed + this._incidentDelay(1800);
                this.nextBreachAt = retryAt <= this._levelDuration(level) - this._responseWindow(9000) ? retryAt : Infinity;
                return;
            }

            this._triggerBreach();

        }


        _resolveBreach(method) {

            if (!this.breach || this.phase !== "running") {
                return false;
            }

            const route = this.breach;
            this.breach = null;
            this.repelled += 1;
            this.score += 175;
            this.panic = Math.max(0, this.panic - this._recovery(8));
            this.signalGlitch = Math.max(this.signalGlitch, 620);
            this.nextBreachAt = this._nextBreachMoment(this._currentLevel(), 3800);
            this._cue(route.saved[0], route.saved[1], route.saved[2], true);
            this._tone("select");
            this.announce(`${route.label} contenido mediante ${method}.`);
            this._syncView(true);
            this._updateHud();

            return true;

        }


        _nextClientTemplate() {

            if (!Array.isArray(this.clientDeck) || !this.clientDeck.length) {
                const deck = CUSTOMER_MESSAGES.map((_template, index) => index);

                /* Un mazo mezclado evita la repetición inmediata y permite que
                   cada noche cruce incidentes de seguridad, salud, redes y
                   señales extrañas en distinto orden. */
                for (let index = deck.length - 1; index > 0; index -= 1) {
                    const swap = Math.floor(Math.random() * (index + 1));
                    const value = deck[index];
                    deck[index] = deck[swap];
                    deck[swap] = value;
                }

                if (deck.length > 1 && deck[0] === this.clientLastTemplate) {
                    const alternate = deck.findIndex((index) => index !== this.clientLastTemplate);
                    if (alternate > 0) {
                        const value = deck[0];
                        deck[0] = deck[alternate];
                        deck[alternate] = value;
                    }
                }

                this.clientDeck = deck;
            }

            const index = this.clientDeck.shift();
            this.clientLastTemplate = index;
            return CUSTOMER_MESSAGES[index] || CUSTOMER_MESSAGES[0];

        }


        _clientHoldWindow() {

            return this._responseWindow(CLIENT_HOLD_BASE_MS, CLIENT_HOLD_FLOOR_MS);

        }


        _clientChoices(template, sequence) {

            const answers = Array.isArray(template && template.answers)
                ? template.answers.slice(0, 3)
                : [];
            const offset = answers.length ? sequence % answers.length : 0;

            /* La frase cuidadosa no queda siempre en el mismo botón. La
               rotación es determinista para que una repetición conserve una
               secuencia legible sin convertirlo en azar opaco. */
            return answers.map((answer, index) => Object.assign({}, answer, {
                shortcut: index + 1,
                order: (index + offset) % answers.length
            })).sort((left, right) => left.order - right.order)
                .map((answer, index) => Object.assign(answer, { shortcut: index + 1 }));

        }


        _triggerClientMessage() {

            const sequence = this.clientIndex;
            const template = this._nextClientTemplate();
            this.clientIndex += 1;
            const duration = this._responseWindow(
                6200 + (this.vipTurnoBonus.clientGrace || 0),
                3500
            );
            const holdDuration = this._clientHoldWindow();

            this.clientTerminalOpen = false;
            this.clientActive = Object.assign({}, template, {
                choices: this._clientChoices(template, sequence),
                timer: duration,
                max: duration,
                holdMessage: template.hold || CLIENT_HOLD_TEXT,
                holdDuration,
                holdUsed: false
            });
            this.signalGlitch = Math.max(this.signalGlitch, 520);
            this._cue("sil", "preocupada", `${template.from}: ${template.message}`, true);
            this._tone("interferencia");
            this.announce(`${template.from} escribió. Abre la notificación o pulsa Q para leer el mensaje.`);
            this._syncView(true);
            this._updateHud();

        }


        openClientTerminal() {

            if (!this.clientActive || this.phase !== "running") {
                this.announce("No hay un mensaje de cliente pendiente.");
                this._tone("vacio");
                return false;
            }

            this.clientTerminalOpen = true;
            /* Es la computadora del escritorio, no otra cámara: bajar el
               monitor evita dos capas de lectura y deja el mensaje al frente. */
            this.monitorOpen = false;
            this.hiddenUnderDesk = false;
            this.signalGlitch = Math.max(this.signalGlitch, 300);
            this._cue("sil", "seria", `Terminal abierta. ${this.clientActive.from} sigue en la línea.`, false);
            this._tone("select");
            this.announce(`${this.clientActive.from}. Lee el mensaje y elige una respuesta rápida.`);
            this._syncView(true);

            return true;

        }


        requestClientTime() {

            if (!this.clientActive || this.phase !== "running") {
                this.announce("No hay un mensaje de cliente pendiente.");
                this._tone("vacio");
                return false;
            }

            const client = this.clientActive;

            if (client.holdUsed) {
                this.announce("Ya avisaste que estás verificando el caso. Ahora elige una respuesta final.");
                this._tone("vacio");
                return false;
            }

            const extra = Math.max(CLIENT_HOLD_FLOOR_MS, client.holdDuration || this._clientHoldWindow());
            client.holdUsed = true;
            client.holdDuration = extra;
            client.timer += extra;
            client.max += extra;
            this.signalGlitch = Math.max(this.signalGlitch, 170);
            this._cue("desire", "seria", `${client.from}, le dijiste que verificas el caso. Sigue en la línea: ahora tienes aire para leer antes de responder.`, false);
            this._tone("move");
            this.announce(`${client.from}: mensaje de espera enviado. +${Math.ceil(extra / 1000)} segundos para revisar y responder.`);
            this._syncView(true);
            this._updateHud();

            return true;

        }


        closeClientTerminal() {

            if (!this.clientTerminalOpen) {
                return false;
            }

            this.clientTerminalOpen = false;
            this._tone("move");
            this.announce("Mensaje minimizado. La notificación sigue esperando una respuesta.");
            this._syncView(true);

            return true;

        }


        _updateClientMessages(dt) {

            const level = this._currentLevel();

            if (this.clientActive) {
                this.clientActive.timer = Math.max(0, this.clientActive.timer - dt);

                if (this.clientActive.timer > 0) {
                    return;
                }

                const missed = this.clientActive;
                this.clientActive = null;
                this.clientTerminalOpen = false;
                this.clientMissed += 1;
                this.energy = Math.max(0, this.energy - this._penalty(3));
                this.panic = utils.clamp(this.panic + this._penalty(9), 0, PANIC_MAX);
                this.advanceTimer = Math.max(0, this.advanceTimer - this._penalty(1150));
                this.nextClientAt = this._nextClientMoment(level, 4500);
                this._cue("rog", "preocupado", `Perdimos a ${missed.from}. La oficina sigue trabajando aunque el pasillo no, y eso nos costó aire.`, true);
                this._tone("vacio");
                this._syncView(true);
                this._updateHud();
                return;
            }

            if (this.levelElapsed < this.nextClientAt || !Number.isFinite(this.nextClientAt)) {
                return;
            }

            /* Igual que las brechas: no se le pide al jugador responder un
               cliente cuando el corte horario ya no puede darle una ventana
               honesta. */
            if (this._levelDuration(level) - this.levelElapsed < this._responseWindow(6800)) {
                this.nextClientAt = Infinity;
                return;
            }

            if (this.breach || this.callActive || this.ventActive || this.threatStage >= 3) {
                const retryAt = this.levelElapsed + this._incidentDelay(1400);
                this.nextClientAt = retryAt <= this._levelDuration(level) - this._responseWindow(6800) ? retryAt : Infinity;
                return;
            }

            this._triggerClientMessage();

        }


        respondClient(choiceId) {

            if (!this.clientActive || this.phase !== "running") {
                this.announce("No hay un mensaje de cliente pendiente.");
                this._tone("vacio");
                return false;
            }

            /* Q y la notificación abren la computadora. El mensaje puente
               sólo concede lectura una vez; la resolución sigue exigiendo
               una de las tres frases contextuales visibles. */
            if (choiceId == null || choiceId === "") {
                return this.openClientTerminal();
            }
            if (choiceId === "hold") {
                return this.requestClientTime();
            }

            const client = this.clientActive;
            const choice = (client.choices || []).find((item) => (
                item.id === choiceId || String(item.shortcut) === String(choiceId)
            ));

            if (!choice) {
                this.announce("Esa respuesta ya no está disponible. Lee el mensaje otra vez.");
                this._tone("vacio");
                return false;
            }

            this.clientActive = null;
            this.clientTerminalOpen = false;
            this.nextClientAt = this._nextClientMoment(this._currentLevel(), 4700);

            if (choice.correct) {
                this.score += 125;
                this.energy = utils.clamp(this.energy + this._recovery(4), 0, ENERGY_MAX);
                this.panic = Math.max(0, this.panic - this._recovery(7));
                this._cue("desire", "feliz", `${client.from} atendido. ${client.reply}`, true);
                this._tone("select");
                this.announce(`${client.from} recibió una respuesta y el canal se calmó.`);
            } else if (choice.harsh) {
                this.score = Math.max(0, this.score - this._penalty(20));
                this.energy = Math.max(0, this.energy - this._penalty(2));
                this.panic = utils.clamp(this.panic + this._penalty(10), 0, PANIC_MAX);
                this.advanceTimer = Math.max(0, this.advanceTimer - this._penalty(650));
                this.signalGlitch = Math.max(this.signalGlitch, 880);
                this._cue("rog", "nervioso", `${client.from} cortó la conversación. La línea se quedó respirando un segundo más de lo normal.`, true);
                this._tone("vacio");
                this.announce(`${client.from} cerró el canal sin sentirse atendido.`);
            } else {
                this.score += 25;
                this.panic = utils.clamp(this.panic + this._penalty(3), 0, PANIC_MAX);
                this.signalGlitch = Math.max(this.signalGlitch, 430);
                this._cue("sil", "seria", `${client.from} recibió el protocolo, pero nadie le aseguró que no estaba solo.`, true);
                this._tone("move");
                this.announce(`${client.from} recibió el protocolo, pero la línea no se calmó del todo.`);
            }

            this._syncView(true);
            this._updateHud();

            return true;

        }


        _updateThreat(dt, seconds) {

            const level = this._currentLevel();

            /* Un acceso lateral congela por unos segundos el avance de la
               puerta para que la respuesta correcta nunca sea injusta. */
            if (this.breach) {
                return;
            }

            /* Ver al Manguangua en la cámara exacta lo retrasa, pero no lo
               detiene del todo y mantiene la presión de administrar energía. */
            const watched = this.monitorOpen && this.currentCamera().stage === this.threatStage;
            const speed = (watched
                ? level.watchedPace
                : level.pace + (this.levelElapsed / this._levelDuration(level)) * 0.24) * this._nightPace();

            if (this.threatStage < 3) {

                this.advanceTimer -= dt * speed;

                if (this.advanceTimer <= 0) {
                    this.threatStage += 1;
                    this.advanceTimer = this._responseWindow(level.advanceTimers[this.threatStage] || 0);
                    this._approachThreat();
                }

                return;

            }

            if (this.doorClosed) {

                this.doorHold += dt;
                this.attackTimer = Math.max(0, this.attackTimer - dt * 0.2);

                if (this.doorHold >= this._doorHoldNeed(level)) {
                    this._repelThreat("La persiana aguantó. Algo se aleja por el pasillo.");
                }

                return;

            }

            this.attackTimer -= dt;

            if (this.attackTimer > 0) {
                return;
            }

            if (this.hiddenUnderDesk) {
                this._hideFromThreat();
            } else {
                this._lose("La puerta quedó abierta demasiado tiempo.", "door");
            }

        }


        _updatePanic(dt, seconds) {

            let pressure = 0.35;

            if (this.threatStage === 1) {
                pressure += 0.4;
            } else if (this.threatStage === 2) {
                pressure += 0.95;
            } else if (this.threatStage >= 3) {
                pressure += this.lightOn ? 1.8 : 2.8;
            }

            if (this.blackout) {
                pressure += 1.1;
            }

            if (this.hiddenUnderDesk) {
                pressure += 0.45;
            }

            if (this.lightOn && this.threatStage < 3) {
                pressure = Math.max(0.1, pressure - 0.3);
            }

            this.panic = utils.clamp(this.panic + pressure * this.tuning.panic * seconds, 0, PANIC_MAX);

            if (this.panic >= 76 && !this.panicWarning) {
                this.panicWarning = true;
                this._cue("desire", "miedo", "Respira, amor. El ruido que oyes no viene del aire acondicionado.", false);
            }

            if (this.panic >= PANIC_MAX) {
                this._lose("El pánico llenó la oficina antes que el amanecer.", "panic");
            }

        }


        _approachThreat() {

            const level = this._currentLevel();
            this.signalGlitch = Math.max(this.signalGlitch, 800);

            if (this.threatStage === 1) {
                this._cue(
                    "davinchi",
                    "preocupado",
                    "Pasos en recepción. Revisa cámara uno y no abras la puerta norte, yeah.",
                    true
                );
                this._tone("move");
                return;
            }

            if (this.threatStage === 2) {
                this._cue(
                    "sil",
                    "miedo",
                    "Cámara dos perdió señal un segundo. No fue un fallo de red.",
                    true
                );
                this._tone("vacio");
                return;
            }

            this.attackTimer = this._responseWindow(this.blackout ? level.blackoutAttack : level.attackTime, 2600);
            this.doorHold = 0;
            this._cue(
                "desire",
                "gritando",
                "Amor, está en la puerta. Cierra el acceso o escóndete. No le hables.",
                true
            );
            /* El grito entregado ocurre al aparecer en la puerta, no sólo en
               el game over. La llamada es un susto y una pista de ruta. */
            this._playManguanguaScream();
            this._syncView(true);

        }


        _repelThreat(message) {

            const level = this._currentLevel();

            this.repelled += 1;
            this.score += 240;
            this.threatStage = level.repelStage;
            this.advanceTimer = Math.max(4200, this._responseWindow(level.repelDelay - Math.min(2600, this.repelled * 520)));
            this.attackTimer = 0;
            this.doorHold = 0;
            this.doorClosed = false;
            this.hiddenUnderDesk = false;
            this.panic = Math.max(8, this.panic - this._recovery(12));

            this._cue("rog", "feliz", message, true);
            this._tone("win");
            this._syncView(true);
            this._updateHud();

        }


        _hideFromThreat() {

            const level = this._currentLevel();

            this.repelled += 1;
            this.score += 150;
            this.threatStage = level.repelStage;
            this.advanceTimer = Math.max(3600, this._responseWindow(level.hideDelay - 1800));
            this.attackTimer = 0;
            this.hiddenUnderDesk = false;
            this.panic = utils.clamp(this.panic + this._penalty(18), 0, PANIC_MAX);

            this._cue(
                "davinchi",
                "nervioso",
                "No te vio. Espera a que el pasillo quede quieto. El patrón se reinicia, yeah.",
                true
            );
            this._tone("secreto");
            this._syncView(true);
            this._updateHud();

        }


        control(action, fromPointer = false) {

            if (action === "tutorial-next") {
                return this.advanceTutorial();
            }

            if (action === "tutorial-skip") {
                return this.skipTutorial();
            }

            if (action === "cinematic-next") {
                this.advanceCinematic();
                return true;
            }

            if (action === "continue") {
                this.continueStory();
                return true;
            }

            if (action === "records") {
                this.toggleRecords();
                return true;
            }

            if (this.phase !== "running" || this.recordsOpen) {
                this.announce("Espera la transmisión o inicia el turno para usar la oficina.");
                return true;
            }

            if (action === "camera") {
                this.toggleMonitor(fromPointer);
                return true;
            }

            if (action === "lamp") {
                this.toggleLamp(fromPointer);
                return true;
            }

            if (action === "door") {
                this.toggleDoor(fromPointer);
                return true;
            }

            if (action === "hide") {
                this.toggleHide(fromPointer);
                return true;
            }

            if (action === "signal") {
                this.cutSignal();
                return true;
            }

            if (action === "vent") {
                this.dischargeVent();
                return true;
            }

            if (action === "client") {
                this.openClientTerminal();
                return true;
            }

            if (action === "breathe") {
                this.breathe(fromPointer);
                return true;
            }

            return false;

        }


        toggleMonitor() {

            if (this.energy <= 0) {
                this.announce("Sin energía para levantar el monitor.");
                this._tone("vacio");
                return;
            }

            this.monitorOpen = !this.monitorOpen;

            if (this.monitorOpen) {
                this.hiddenUnderDesk = false;
                this._cue("sil", "seria", "La cámara muestra lo que el pasillo quiere que veas. Mira el dato, no el miedo.", false);
            }

            this._tone(this.monitorOpen ? "select" : "move");
            this._syncView(true);

        }


        toggleLamp() {

            if (this.energy <= 0) {
                this.announce("La luz no responde. La batería está vacía.");
                this._tone("vacio");
                return;
            }

            this.lightOn = !this.lightOn;
            this.lightTimer = this.lightOn ? this._responseWindow(4200, 2600) : 0;
            this._tone(this.lightOn ? "select" : "move");

            if (this.lightOn) {
                this._cue(
                    "desire",
                    this.threatStage === 3 ? "miedo" : "seria",
                    this.threatStage === 3
                        ? "Amor, no cierres los ojos. Está exactamente donde creías."
                        : "Amor, proyector encendido. La luz corta el cristal, pero no la sostengas más de unos segundos.",
                    false
                );

                if (this.breach && this.breach.id === "ventana") {
                    this._resolveBreach("LUZ");
                    return;
                }
            }

            this._syncView(true);

        }


        toggleDoor() {

            if (this.energy <= 0) {
                this.announce("El cierre está muerto. Solo queda esconderse.");
                this._tone("vacio");
                return;
            }

            this.doorClosed = !this.doorClosed;

            if (this.doorClosed) {
                this.hiddenUnderDesk = false;
                this.doorHold = 0;
                this._cue("davinchi", "serio", "Cierre activado. Escucha la persiana, no la voz detrás. El seguro aguanta, yeah.", false);
            }

            this._tone(this.doorClosed ? "select" : "move");
            this._syncView(true);

        }


        toggleHide() {

            this.hiddenUnderDesk = !this.hiddenUnderDesk;

            if (this.hiddenUnderDesk) {
                this.monitorOpen = false;
                this.lightOn = false;
                this.doorClosed = false;
                this._cue("rog", "nervioso", "Bajo el escritorio. Cuenta hasta cinco sin respirar fuerte. Perdón por el plan, es el mejor.", false);
            } else {
                this._cue("rog", "preocupado", "Vuelve a la consola. No tienes mucho tiempo; yo cubro el cálculo.", false);
            }

            this._tone(this.hiddenUnderDesk ? "secreto" : "move");
            this._syncView(true);

        }


        breathe() {

            if (this.breatheCooldown > 0) {
                this.announce("Recupera el aire antes de volver a contener la respiración.");
                this._tone("vacio");
                return;
            }

            this.breatheCooldown = Math.round(6500 * this.tuning.breatheCooldown);
            this.panic = Math.max(0, this.panic - Math.round(18 * this.tuning.breatheRelief));
            this._cue("desire", "preocupada", "Eso es, amor. Respira despacio. Él escucha los golpes, no el silencio.", false);
            this._tone("select");
            this._syncView(true);
            this._updateHud();

        }


        selectCamera(id) {

            if (this.phase !== "running" || this.recordsOpen) {
                return;
            }

            if (this.energy <= 0) {
                this.announce("Sin energía para cambiar de cámara.");
                this._tone("vacio");
                return;
            }

            const camera = CAMERAS.find((item) => item.id === id);

            if (!camera) {
                return;
            }

            this.selectedCamera = camera.id;
            this.monitorOpen = true;
            this.hiddenUnderDesk = false;
            this._tone("move");

            if (this.breach && this.breach.id === "archivo" && camera.id === "archivo") {
                this._resolveBreach("CAM 03");
                return;
            }

            this._syncView(true);

        }


        currentCamera() {
            return CAMERAS.find((camera) => camera.id === this.selectedCamera) || CAMERAS[0];
        }


        _cue(memberId, expression, message, announce) {

            const member = this.member(memberId);

            if (!member) {
                return;
            }

            const descriptor = A.assets.character(member.id);
            const safeExpression = descriptor && descriptor.expressions.indexOf(expression) >= 0
                ? expression
                : member.idle;

            this.expressions[member.id] = safeExpression;
            this.radio = {
                member: member.id,
                expression: safeExpression,
                message
            };

            this._warmAssets([this._imageId(member, safeExpression)]);

            this._appendTranscript(member, safeExpression, message);

            if (announce) {
                this.announce(`${member.name}: ${message}`);
            }

        }


        _appendTranscript(member, expression, message) {

            if (!this.transcript || !message) {
                return;
            }

            const signature = `${member.id}|${expression}|${message}`;

            if (signature === this.transcriptSignature) {
                return;
            }

            this.transcriptSignature = signature;
            this.transcript.push({
                name: member.name,
                expression,
                message
            });
            this.transcript = this.transcript.slice(-4);
            this._renderTranscript();

        }


        _renderTranscript() {

            if (!this.refs || !this.refs.transcriptList) {
                return;
            }

            this.refs.transcriptList.innerHTML = (this.transcript || []).slice().reverse().map((entry) =>
                `<li data-expression="${entry.expression}"><b>${entry.name}</b><span>${entry.message}</span></li>`
            ).join("");

        }


        _preloadLevelArt(level) {

            if (!level || !A.assets || typeof A.assets.preload !== "function") {
                return;
            }

            const cues = [level.intro, level.opening, level.outro]
                .concat(level.beats || [])
                .concat(level.signal ? [level.signal.cue, level.signal.cut, level.signal.missed] : [])
                .concat(level.vent ? [level.vent.cue, level.vent.discharge, level.vent.missed] : []);
            const ids = cues.filter(Boolean).map((cue) => {
                const member = this.member(cue.member);
                return this._imageId(member, cue.expression);
            });

            this._warmAssets(ids.concat(["boss.capriles"]));

        }


        member(id) {
            return this.teamById[id] || this.team[0];
        }


        _imageId(member, expression) {
            return A.assets.characterImageId(member.id, expression || member.idle);
        }


        _syncTutorial() {

            const step = this.tutorial;
            const open = this.phase === "tutorial" && Boolean(step);

            if (!this.refs || !this.refs.tutorial) {
                return;
            }

            this.refs.tutorial.hidden = !open;

            if (!open) {
                return;
            }

            const member = this.member(step.member);
            const expression = step.expression || member.idle;
            const source = A.assets.url(this._imageId(member, expression));

            if (this.refs.tutorialPortrait && this.refs.tutorialPortrait.getAttribute("src") !== source) {
                this.refs.tutorialPortrait.src = source;
            }

            if (this.refs.tutorialPortrait) {
                this.refs.tutorialPortrait.alt = `${member.name}, ${displayExpression(expression).toLowerCase()}`;
            }
            if (this.refs.tutorialArt) {
                this.refs.tutorialArt.style.setProperty("--tutorial-color", member.color);
            }
            if (this.refs.tutorialKicker) {
                this.refs.tutorialKicker.textContent = step.kicker;
            }
            if (this.refs.tutorialSpeaker) {
                this.refs.tutorialSpeaker.textContent = `${member.name} // ${member.role}`;
            }
            if (this.refs.tutorialTitle) {
                this.refs.tutorialTitle.textContent = step.title;
            }
            if (this.refs.tutorialMessage) {
                this.refs.tutorialMessage.textContent = step.message;
            }
            if (this.refs.tutorialAction) {
                this.refs.tutorialAction.textContent = step.action;
            }
            if (this.refs.tutorialCount) {
                this.refs.tutorialCount.textContent = `PASO ${this.tutorialIndex + 1} DE ${OFFICE_TUTORIAL.length} · LA GUÍA ESPERA TU RITMO`;
            }

        }


        _syncCinematic() {

            const scene = this.cinematic;
            const open = this.phase === "cinematic" && Boolean(scene);

            if (!this.refs || !this.refs.cinematic) {
                return;
            }

            this.refs.cinematic.hidden = !open;
            this.root.classList.toggle("is-cinematic", open);

            if (!open) {
                delete this.root.dataset.cinematicScene;
                return;
            }

            this.root.dataset.cinematicScene = scene.id;
            this.refs.cinematicKicker.textContent = scene.kicker;
            this.refs.cinematicTitle.textContent = scene.title;
            this.refs.cinematicDirection.textContent = scene.direction;
            this.refs.cinematicLines.innerHTML = scene.lines.map((line) => {
                const member = line.member ? this.member(line.member) : null;
                const name = line.entity ? (line.name || "MANGUANGUA // CANAL CORRUPTO") : member.name;
                const role = line.entity ? "SEÑAL NO IDENTIFICADA" : member.role;
                return `<li class="${line.entity ? "is-entity" : ""}"><b>${name}</b><small>${role}</small><span>${line.message}</span></li>`;
            }).join("");
            this.refs.cinematicCountdown.textContent = "LECTURA MANUAL · ESPACIO O TOCAR PARA AVANZAR";

            this.cinematicMembers.forEach((item) => {
                const id = item.dataset.cinematicMember;
                const member = this.member(id);
                const line = scene.lines.slice().reverse().find((entry) => entry.member === id);
                const expression = line ? line.expression : member.idle;
                const image = item.querySelector("[data-cinematic-member-image]");
                const source = A.assets.url(this._imageId(member, expression));
                const focused = scene.focus === id;

                if (image && image.getAttribute("src") !== source) {
                    image.src = source;
                }

                item.classList.toggle("is-focused", focused);
                item.classList.toggle("is-speaking", Boolean(line));
                item.classList.toggle("is-afraid", ["miedo", "nervioso", "nerviosa", "gritando"].includes(expression));
            });

        }


        _syncView(force = false) {

            if (!this.refs) {
                return;
            }

            const level = this._currentLevel();
            const cinematicOpen = this.phase === "cinematic" && Boolean(this.cinematic);
            const tutorialOpen = this.phase === "tutorial" && Boolean(this.tutorial);
            const clockMinutes = cinematicOpen
                ? 194 + this.cinematicIndex
                : this._clockMinutes();
            const camera = this.currentCamera();
            const objective = level.objective;
            const breach = this.breach;
            const breachAtArchive = Boolean(breach && breach.id === "archivo" && camera.id === "archivo");
            const enemyInView = (camera.stage === this.threatStage && this.threatStage < 3) || breachAtArchive;
            const radioMember = this.member(this.radio.member);
            const radioExpression = this.radio.expression || radioMember.idle;
            const black = this.blackout || this.energy <= 0;
            const atDoor = this.threatStage === 3;
            const breatheSeconds = Math.ceil(this.breatheCooldown / 1000);
            const storyOpen = this.phase === "interlude" && Boolean(this.interlude);
            const revealing = this.phase === "revealing";
            const difficultyOpen = this.phase === "briefing" && this.difficultyOpen;
            const clientTerminalOpen = Boolean(this.clientTerminalOpen && this.clientActive);
            const objectiveNeeded = this._objectiveNeed(objective);
            const objectiveSeconds = Math.ceil(objectiveNeeded / 1000);
            const objectiveProgress = Math.min(
                objectiveSeconds,
                Math.floor(this.objectiveProgress / 1000)
            );

            this.root.dataset.phase = this.phase;
            this.root.dataset.difficulty = this.difficulty;
            this.root.dataset.threatStage = String(this.threatStage);
            this.root.dataset.level = String(this.levelIndex + 1);
            this.root.dataset.night = String(this.night);
            if (breach) {
                this.root.dataset.breach = breach.id;
            } else {
                delete this.root.dataset.breach;
            }
            this.root.classList.toggle("is-monitor-open", this.monitorOpen);
            this.root.classList.toggle("is-light-on", this.lightOn);
            this.root.classList.toggle("is-door-closed", this.doorClosed);
            this.root.classList.toggle("is-hidden", this.hiddenUnderDesk);
            this.root.classList.toggle("is-blackout", black);
            this.root.classList.toggle("is-urgent", atDoor || this.panic >= 76 || this.callActive || this.ventActive || Boolean(breach) || Boolean(this.clientActive));
            this.root.classList.toggle("is-call-active", this.callActive);
            this.root.classList.toggle("is-signal-glitch", this.signalGlitch > 0);
            this.root.classList.toggle("is-story-open", storyOpen);
            this.root.classList.toggle("is-capriles-reveal", revealing);
            this.root.classList.toggle("is-cinematic", cinematicOpen);
            this.root.classList.toggle("is-vent-active", this.ventActive || Boolean(breach && breach.id === "ducto"));
            this.root.classList.toggle("is-breach-active", Boolean(breach));
            this.root.classList.toggle("is-breach-window", Boolean(breach && breach.id === "ventana"));
            this.root.classList.toggle("is-client-active", Boolean(this.clientActive));
            this.root.classList.toggle("is-client-terminal-open", clientTerminalOpen);
            this.root.classList.toggle("is-difficulty-open", difficultyOpen);
            this.root.classList.toggle("is-tutorial-open", tutorialOpen);
            this.root.classList.toggle("is-psychological-flicker", this.psychologicalKind === "flicker");
            this.root.classList.toggle("is-psychological-cut", this.psychologicalKind === "cut");

            if (this.psychologicalKind) {
                this.root.dataset.psychological = this.psychologicalKind;
            } else {
                delete this.root.dataset.psychological;
            }

            if (this.refs.difficulty) {
                this.refs.difficulty.hidden = !difficultyOpen;
            }
            if (this.refs.tutorial) {
                this.refs.tutorial.hidden = !tutorialOpen;
            }
            this._syncDifficultySelector();
            this._syncTutorial();

            const displayClock = clockFor(clockMinutes);
            this.refs.clock.textContent = displayClock;
            if (this.refs.deskClock) {
                this.refs.deskClock.textContent = displayClock;
            }
            if (this.refs.deskMonitorStatus) {
                this.refs.deskMonitorStatus.textContent = this.clientActive
                    ? (clientTerminalOpen
                        ? (this.clientActive.holdUsed ? "VERIFICANDO · RESPONDE" : "CHAT ABIERTO · RESPONDE")
                        : "MENSAJE NUEVO · PULSA Q")
                    : (this.monitorOpen ? "CÁMARAS EN LÍNEA · C" : "CANAL DE SOPORTE · LISTO");
            }
            if (this.refs.deskMonitor) {
                this.refs.deskMonitor.classList.toggle("is-client-active", Boolean(this.clientActive));
                this.refs.deskMonitor.classList.toggle("is-client-open", clientTerminalOpen);
                this.refs.deskMonitor.setAttribute("aria-label", this.clientActive
                    ? `Monitor de escritorio. Nuevo mensaje de ${this.clientActive.from}. Abrir chat.`
                    : `Monitor de escritorio. ${displayClock}. Sin mensajes de cliente pendientes.`);
            }
            let stateLabel = "EN VIGILANCIA";

            if (this.phase === "briefing") {
                stateLabel = difficultyOpen ? "PROTOCOLO REQUERIDO" : "EN ESPERA";
            } else if (cinematicOpen) {
                stateLabel = "ARCHIVO EN REPRODUCCIÓN";
            } else if (tutorialOpen) {
                stateLabel = "GUÍA DE GUARDIA";
            } else if (storyOpen) {
                stateLabel = this.dawn ? "06:00 // RELEVO" : "TRANSMISIÓN RECIBIDA";
            } else if (revealing) {
                stateLabel = "SEÑAL TOMADA";
            } else if (black) {
                stateLabel = "SIN ENERGÍA";
            } else if (breach) {
                stateLabel = `ACCESO · ${breach.key}`;
            } else if (clientTerminalOpen) {
                stateLabel = "MENSAJE ABIERTO";
            } else if (this.clientActive) {
                stateLabel = "CLIENTE EN ESPERA";
            } else if (this.callActive) {
                stateLabel = "LLAMADA ENTRANTE";
            } else if (atDoor) {
                stateLabel = "CIERRE REQUERIDO";
            }

            this.refs.state.textContent = stateLabel;
            let officeCaption = "La oficina está en silencio. Demasiado silencio.";

            if (difficultyOpen) {
                officeCaption = "La consola calibra el turno. Elige el margen con el que quieres enfrentar la noche.";
            } else if (cinematicOpen) {
                officeCaption = "Archivo 404 en reproducción: la guardia todavía no puede responder.";
            } else if (tutorialOpen) {
                officeCaption = "La guía espera. Ningún recurso ni reloj corre mientras el equipo explica la oficina.";
            } else if (breach) {
                officeCaption = breach.id === "ducto"
                    ? "La rejilla se abre sobre el escritorio. Descarga el DUCTO 04 con V."
                    : (breach.id === "ventana"
                        ? "Una cara cubre el vidrio oeste. Enciende la LUZ con L."
                        : "El archivo perdió su fondo. Selecciona CAM 03 antes de que cruce.");
            } else if (clientTerminalOpen) {
                officeCaption = this.clientActive.holdUsed
                    ? `${this.clientActive.from} espera mientras verificas el caso. Lee con calma y responde antes de que cierre el canal.`
                    : `${this.clientActive.from} sigue esperando al otro lado de la pantalla.`;
            } else if (this.clientActive) {
                officeCaption = `${this.clientActive.from} escribió. Abre la notificación o pulsa Q.`;
            } else if (this.ventActive) {
                officeCaption = "La rejilla del techo vibra. Descarga el ducto antes de que algo cruce.";
            } else if (revealing) {
                officeCaption = "No existe un lugar en la oficina donde su cara no pueda encontrarte.";
            } else if (storyOpen) {
                officeCaption = "La transmisión tapa por un momento el ruido del pasillo.";
            } else if (this.callActive) {
                officeCaption = "El teléfono suena aunque nadie le dio un número a la oficina.";
            } else if (this.hiddenUnderDesk) {
                officeCaption = "No mires hacia arriba. Espera a que los pasos se alejen.";
            } else if (atDoor) {
                officeCaption = this.doorClosed
                    ? "La persiana tiembla. Aguanta unos segundos."
                    : "Hay una sombra al otro lado de la puerta.";
            } else if (this.monitorOpen) {
                officeCaption = "El monitor emite un zumbido que no pertenece a la oficina.";
            }

            this.refs.officeCaption.textContent = officeCaption;

            this.refs.energyValue.textContent = `${Math.ceil(this.energy)}%`;
            this.refs.energyFill.style.width = `${this.energy}%`;
            this.refs.panicValue.textContent = `${Math.ceil(this.panic)}%`;
            this.refs.panicFill.style.width = `${this.panic}%`;
            this.refs.threatLabel.textContent = breach
                ? `MANGUANGUA · ${breach.label}`
                : (this.clientActive
                    ? `CLIENTE · ${this.clientActive.from}`
                    : (this.ventActive
                        ? "ALGO EN EL DUCTO"
                        : (this.callActive
                            ? "LA LÍNEA RESPIRA"
                            : (THREAT_STATES[this.threatStage] || THREAT_STATES[3]))));
            this.refs.breatheCooldown.textContent = breatheSeconds > 0 ? `${breatheSeconds}S` : "LISTO";

            if (this.refs.levelLabel) {
                this.refs.levelLabel.textContent = `NOCHE ${String(this.night).padStart(2, "0")} · SECTOR ${String(this.levelIndex + 1).padStart(2, "0")} / ${String(TURNOS.length).padStart(2, "0")}`;
            }
            if (this.refs.objectiveLabel) {
                this.refs.objectiveLabel.textContent = this.objectiveDone
                    ? `${objective.label} // VALIDADO`
                    : objective.label;
            }
            if (this.refs.objectiveState) {
                this.refs.objectiveState.textContent = this.objectiveDone
                    ? "LISTO"
                    : `${objectiveProgress}/${objectiveSeconds}S`;
            }
            if (this.refs.objectiveFill) {
                this.refs.objectiveFill.style.width = `${objective ? (this.objectiveProgress / objectiveNeeded) * 100 : 0}%`;
            }
            if (this.refs.signalCountdown) {
                this.refs.signalCountdown.textContent = this.callActive
                    ? `${Math.max(1, Math.ceil(this.callTimer / 1000))}S · E`
                    : (this.callTriggered
                        ? (this.callResolved ? "CORTADA" : "PERDIDA")
                        : "EN ESPERA");
            }
            if (this.refs.ventCountdown) {
                this.refs.ventCountdown.textContent = breach && breach.id === "ducto"
                    ? `${Math.max(1, Math.ceil(breach.timer / 1000))}S · V`
                    : (this.ventActive
                        ? `${Math.max(1, Math.ceil(this.ventTimer / 1000))}S · V`
                        : (this.ventTriggered
                            ? (this.ventResolved ? "SELLADO" : "ABIERTO")
                            : "EN ESPERA"));
            }
            if (this.refs.clientCountdown) {
                this.refs.clientCountdown.textContent = this.clientActive
                    ? `${Math.max(1, Math.ceil(this.clientActive.timer / 1000))}S · ${clientTerminalOpen
                        ? (this.clientActive.holdUsed ? "1–3" : "0 · 1–3")
                        : "Q"}`
                    : (this.clientMissed ? "SIN RESPUESTA" : "EN ESPERA");
            }

            if (this.refs.clientNotice) {
                this.refs.clientNotice.hidden = !this.clientActive || clientTerminalOpen;
            }
            if (this.refs.clientNoticeFrom) {
                this.refs.clientNoticeFrom.textContent = this.clientActive
                    ? this.clientActive.from
                    : "CLIENTE // SIN MENSAJES";
            }
            if (this.refs.clientNoticePreview) {
                this.refs.clientNoticePreview.textContent = this.clientActive
                    ? this.clientActive.message
                    : "ABRE EL CANAL PARA LEERLO.";
            }

            if (this.refs.clientTerminal) {
                this.refs.clientTerminal.hidden = !clientTerminalOpen;
            }
            if (clientTerminalOpen && this.clientActive) {
                const client = this.clientActive;
                const clientSeconds = Math.max(1, Math.ceil(client.timer / 1000));

                if (this.refs.clientTerminalFrom) {
                    this.refs.clientTerminalFrom.textContent = client.from;
                }
                if (this.refs.clientTerminalSubject) {
                    this.refs.clientTerminalSubject.textContent = client.subject || "CANAL PENDIENTE";
                }
                if (this.refs.clientTerminalTime) {
                    this.refs.clientTerminalTime.textContent = `${displayClock} · ${clientSeconds}S`;
                }
                if (this.refs.clientTerminalMessage) {
                    this.refs.clientTerminalMessage.textContent = client.message;
                }
                if (this.refs.clientTerminalSignal) {
                    this.refs.clientTerminalSignal.textContent = client.signal || "LECTURA PENDIENTE";
                }
                if (this.refs.clientTerminalEvidence) {
                    this.refs.clientTerminalEvidence.textContent = client.evidence || "Mantén el canal seguro y registra el incidente.";
                }
                if (this.refs.clientHold) {
                    const holdSeconds = Math.max(1, Math.ceil((client.holdDuration || this._clientHoldWindow()) / 1000));
                    this.refs.clientHold.disabled = Boolean(client.holdUsed);
                    this.refs.clientHold.classList.toggle("is-used", Boolean(client.holdUsed));
                    this.refs.clientHold.setAttribute("aria-label", client.holdUsed
                        ? "Mensaje de espera enviado. Elige una respuesta final."
                        : `Enviar mensaje de espera para ganar ${holdSeconds} segundos de lectura.`);
                }
                if (this.refs.clientHoldMessage) {
                    this.refs.clientHoldMessage.textContent = client.holdMessage || CLIENT_HOLD_TEXT;
                }
                if (this.refs.clientHoldStatus) {
                    const holdSeconds = Math.max(1, Math.ceil((client.holdDuration || this._clientHoldWindow()) / 1000));
                    this.refs.clientHoldStatus.textContent = client.holdUsed
                        ? `MENSAJE ENVIADO · +${holdSeconds}S DE LECTURA`
                        : `ENVÍALO UNA VEZ · +${holdSeconds}S PARA LEER`;
                }
                if (this.refs.clientTerminalWhisper) {
                    this.refs.clientTerminalWhisper.textContent = client.holdUsed
                        ? "// VERIFICACIÓN EN CURSO. EL CANAL SIGUE ABIERTO //"
                        : (clientSeconds <= 3
                            ? "// LA RESPUESTA LLEGA ANTES QUE LA VOZ //"
                            : "// ALGUIEN SIGUE ESCUCHANDO EL TECLADO //");
                }
                if (this.refs.clientTerminalChoices) {
                    const signature = (client.choices || []).map((choice) => (
                        `${choice.id}:${choice.shortcut}:${choice.text}`
                    )).join("|");

                    if (this.refs.clientTerminalChoices.dataset.signature !== signature) {
                        this.refs.clientTerminalChoices.dataset.signature = signature;
                        this.refs.clientTerminalChoices.innerHTML = (client.choices || []).map((choice) => `
                            <button class="turno404__client-choice" data-client-choice="${choice.id}" type="button" aria-label="Respuesta rápida ${choice.shortcut}: ${choice.text}">
                                <kbd>${choice.shortcut}</kbd>
                                <span><small>RESPUESTA RÁPIDA</small>${choice.text}</span>
                                <i aria-hidden="true">✓✓</i>
                            </button>
                        `).join("");
                    }
                }
            }

            if (this.refs.ceilingVent) {
                this.refs.ceilingVent.classList.toggle("is-active", this.ventActive || Boolean(breach && breach.id === "ducto"));
                this.refs.ceilingVent.classList.toggle("is-failed", this.ventTriggered && !this.ventResolved && !this.ventActive);
            }

            this.refs.cameraTitle.textContent = `CAM ${camera.short} // ${camera.label}`;
            this.refs.cameraCopy.textContent = breachAtArchive
                ? "LA FIGURA YA ESTÁ ENTRE LAS CAJAS. MANTÉN CAM 03."
                : (enemyInView ? camera.seen : camera.idle);
            this.refs.cameraFeed.dataset.camera = camera.id;
            if (this.refs.cameraSceneLabel) {
                this.refs.cameraSceneLabel.textContent = `${camera.label} // CAM ${camera.short}`;
            }
            this.refs.cameraFeed.classList.toggle("has-threat", enemyInView);
            this.refs.cameraFeed.classList.toggle(
                "is-static",
                black || this.signalGlitch > 0 || (this.threatStage === 2 && camera.stage !== 2)
            );
            this.refs.cameraFigure.classList.toggle("is-visible", enemyInView);
            this.refs.officeThreat.classList.toggle("is-visible", atDoor);
            if (this.refs.windowThreat) {
                this.refs.windowThreat.classList.toggle("is-visible", Boolean(breach && breach.id === "ventana"));
            }
            this.refs.doorway.classList.toggle("is-locked", this.doorClosed);
            this.refs.hiding.classList.toggle("is-visible", this.hiddenUnderDesk);

            const radioId = this._imageId(radioMember, radioExpression);
            const radioSrc = A.assets.url(radioId);

            if (this.refs.radioPortrait.getAttribute("src") !== radioSrc) {
                this.refs.radioPortrait.src = radioSrc;
            }

            this.refs.radioPortrait.alt = `${radioMember.name}, ${displayExpression(radioExpression).toLowerCase()}`;
            if (this.refs.radioPanel) {
                this.refs.radioPanel.style.setProperty("--operator", radioMember.color);
                this.refs.radioPanel.setAttribute("aria-label", `Intervención de ${radioMember.name}`);
            }
            this.refs.radioArt.style.setProperty("--operator", radioMember.color);
            this.refs.radioName.textContent = radioMember.name;
            this.refs.radioEmotion.textContent = displayExpression(radioExpression);
            this.refs.radioMessage.textContent = this.radio.message;

            if (this.refs.story) {
                this.refs.story.hidden = !storyOpen;
            }
            if (storyOpen && this.interlude) {
                const storyMember = this.member(this.interlude.member);
                const storyExpression = this.interlude.expression || storyMember.idle;
                const storySrc = A.assets.url(this._imageId(storyMember, storyExpression));

                if (this.refs.storyPortrait.getAttribute("src") !== storySrc) {
                    this.refs.storyPortrait.src = storySrc;
                }

                this.refs.storyPortrait.alt = `${storyMember.name}, ${displayExpression(storyExpression).toLowerCase()}`;
                this.refs.story.style.setProperty("--story-color", storyMember.color);
                this.refs.storyArt.style.setProperty("--story-color", storyMember.color);
                this.refs.storyKicker.textContent = `${this.interlude.label} · ${this.interlude.checkpoint}`;
                this.refs.storySpeaker.textContent = `${storyMember.name} // ${storyMember.role}`;
                this.refs.storyTitle.textContent = this.interlude.title;
                this.refs.storyMessage.textContent = this.interlude.message;
            }

            if (this.refs.caprilesReveal) {
                this.refs.caprilesReveal.hidden = !revealing;
            }
            if (revealing && this.refs.revealReason) {
                this.refs.revealReason.textContent = this.lossCopy && this.lossCopy.reveal
                    ? this.lossCopy.reveal
                    : "SU MIRADA YA ESTABA EN LA OFICINA";
            }

            this.cameraButtons.forEach((button) => {
                const selected = button.dataset.camera === camera.id;
                const unavailable = this.phase !== "running" || this.recordsOpen || this.energy <= 0;
                button.classList.toggle("is-selected", selected);
                button.disabled = unavailable;
                button.setAttribute("aria-pressed", selected ? "true" : "false");
            });

            this.controlButtons.forEach((button) => {
                const action = button.dataset.control;
                const ductBreach = Boolean(breach && breach.id === "ducto");
                const ventCost = Math.max(1, this._energyCost(4) - ((this.vipTurnoBonus && this.vipTurnoBonus.ventDiscount) || 0));
                const active = (action === "camera" && this.monitorOpen)
                    || (action === "lamp" && this.lightOn)
                    || (action === "door" && this.doorClosed)
                    || (action === "hide" && this.hiddenUnderDesk)
                    || (action === "signal" && this.callActive)
                    || (action === "vent" && (this.ventActive || ductBreach))
                    || (action === "client" && Boolean(this.clientActive));
                const disabled = action === "tutorial-next" || action === "tutorial-skip"
                    ? !tutorialOpen
                    : (action === "cinematic-next"
                        ? !cinematicOpen
                        : (action === "continue"
                            ? !storyOpen
                            : (action === "records"
                            ? ["revealing", "lost", "won", "interlude", "cinematic", "tutorial"].includes(this.phase)
                            : (this.phase !== "running"
                                || this.recordsOpen
                                || (action === "signal" && !this.callActive)
                                || (action === "vent" && ((!this.ventActive && !ductBreach) || this.energy < ventCost))
                                || (action === "client" && !this.clientActive)
                                || (this.energy <= 0 && ["camera", "lamp", "door"].includes(action))))));

                button.classList.toggle("is-active", active);
                button.classList.toggle("is-alert", (action === "signal" && this.callActive) || (action === "vent" && (this.ventActive || ductBreach)) || (action === "client" && this.clientActive));
                button.disabled = disabled;
                button.setAttribute("aria-pressed", active ? "true" : "false");
            });

            let tip = "C CÁMARAS · 1–3 ELEGIR CAM · E SEÑAL · Q CLIENTE · V DUCTO · L LUZ · F CIERRE · H ESCONDERSE";

            if (difficultyOpen) {
                tip = "ELIGE FÁCIL, NORMAL O DIFÍCIL · 1–3 · ENTER CONFIRMA EL PROTOCOLO ACTIVO";
            } else if (this.recordsOpen) {
                tip = "REGISTROS ABIERTOS · R PARA VOLVER A LA OFICINA";
            } else if (cinematicOpen) {
                tip = "ESPACIO O TOCAR PARA AVANZAR EL ARCHIVO";
            } else if (tutorialOpen) {
                tip = "GUÍA PAUSADA · ESPACIO O ENTER AVANZA · ESC SALTA";
            } else if (storyOpen) {
                tip = this.dawn
                    ? "ESPACIO PARA INICIAR EL SIGUIENTE RELEVO NOCTURNO"
                    : "ESPACIO PARA CONTINUAR LA TRANSMISIÓN";
            } else if (clientTerminalOpen) {
                tip = "1–3 PARA ENVIAR RESPUESTA · Q O ESC PARA MINIMIZAR EL MENSAJE";
            } else if (breach) {
                tip = `${breach.key} PARA CONTENER MANGUANGUA EN ${breach.label}`;
            } else if (this.clientActive) {
                tip = "Q O LA NOTIFICACIÓN PARA ABRIR EL MENSAJE DEL CLIENTE";
            } else if (this.ventActive) {
                tip = "V PARA DESCARGAR EL DUCTO ANTES DE QUE ABRA LA REJILLA";
            } else if (this.callActive) {
                tip = "E PARA CORTAR LA SEÑAL ANTES DE QUE APRENDA TU VOZ";
            } else if (this.hiddenUnderDesk) {
                tip = "H PARA SALIR DEL ESCONDITE · ESPACIO PARA CONTROLAR EL PÁNICO";
            }

            this.refs.tip.textContent = tip;

            this._syncCinematic();

        }


        _updateHud() {

            this.score = Math.max(
                this.score,
                Math.floor(this.elapsed / 1000) * 12 + this.repelled * 80
            );

            this.shell.setStat("score", utils.formatScore(this.score));
            this.shell.setStat("best", utils.formatScore(Math.max(this.shell.best, this.score)));
            this.shell.setStat("difficulty", this.tuning.short);
            this.shell.setStat("night", `N${this.night} · ${String(this.levelIndex + 1).padStart(2, "0")}/${String(TURNOS.length).padStart(2, "0")}`);
            this.shell.setStat(
                "threat",
                this.breach
                    ? this.breach.label
                    : (this.clientActive
                        ? "CLIENTE"
                        : (this.callActive ? "LLAMADA" : (this.threatStage >= 3 ? "PUERTA" : `CAM ${this.threatStage + 1}`)))
            );
            this.shell.setMeter("energy", this.energy / ENERGY_MAX);
            this.shell.setMeter("panic", this.panic / PANIC_MAX);

        }


        _win() {

            if (this.phase !== "running") {
                return;
            }

            const finale = this._currentLevel().outro || {
                member: "desire",
                expression: "feliz",
                message: "Son las seis, amor. La puerta de emergencia se abrió. Corre."
            };

            this.phase = "won";
            this.score += Math.round(this.energy * 12) + Math.max(0, 100 - this.panic) * 7;
            this._stopHorror(false);
            this._cue(finale.member, finale.expression, finale.message, true);
            this._syncView(true);
            this._updateHud();

            this.shell.win({
                eyebrow: "06:00 AM // ARCHIVO SELLADO",
                title: "SOBREVIVISTE TRES NOCHES",
                text: "La tercera mañana atravesó el archivo. Atendiste la línea, sellaste los accesos y el Manguangua ya no tenía una ruta que aprender.",
                score: this.score
            });

        }


        _lossNarrative(reason, kind) {

            const level = this._currentLevel();
            const signalOwned = this.callActive || (this.callTriggered && !this.callResolved);
            const suffix = signalOwned
                ? " La llamada siguió sonando desde dentro de la oficina."
                : (this.blackout
                    ? " Sin luz, la oficina le perteneció por completo."
                    : " La señal archivó el último segundo de tu turno.");

            if (kind === "panic") {
                return {
                    eyebrow: `NIVEL ${this.levelIndex + 1} // PÁNICO CRÍTICO`,
                    title: "ÉL ESCUCHÓ TU RESPIRACIÓN",
                    reveal: "TU MIEDO ABRIÓ EL CANAL",
                    text: `${reason} Intentaste encontrar una salida, pero el Manguangua encontró primero tu respiración.${suffix}`
                };
            }

            if (signalOwned || kind === "signal") {
                return {
                    eyebrow: `NIVEL ${this.levelIndex + 1} // LLAMADA COMPLETA`,
                    title: "NO CORTASTE LA SEÑAL",
                    reveal: "LA LLAMADA YA SABÍA TU NOMBRE",
                    text: `${reason} La voz de la línea aprendió el camino hasta tu escritorio.${suffix}`
                };
            }

            if (BREACH_ROUTES[kind]) {
                const route = BREACH_ROUTES[kind];
                return {
                    eyebrow: `NOCHE ${this.night} // ${route.label}`,
                    title: route.lossTitle,
                    reveal: `LA RUTA ${route.label} YA ESTABA ABIERTA`,
                    text: `${reason} El Manguangua no necesitó la puerta; aprendió el acceso que dejaste sin responder.${suffix}`
                };
            }

            if (this.blackout || this.energy <= 0) {
                return {
                    eyebrow: `NIVEL ${this.levelIndex + 1} // APAGÓN`,
                    title: "LA OSCURIDAD RESPONDIÓ",
                    reveal: "NO ERA UN CORTE DE LUZ",
                    text: `${reason} En ${level.title.toLowerCase()}, la batería murió antes de que la persiana pudiera protegerte.${suffix}`
                };
            }

            return {
                eyebrow: `NIVEL ${this.levelIndex + 1} // ACCESO NORTE`,
                title: "MANGUANGUA CRUZÓ LA PUERTA",
                reveal: "SU ROSTRO ESTABA DEL OTRO LADO",
                text: `${reason} En ${level.title.toLowerCase()}, dejaste un segundo de silencio entre la puerta y tú.${suffix}`
            };

        }


        _lose(reason, kind = "door") {

            if (this.phase !== "running") {
                return;
            }

            this.lossReason = reason;
            this.lossKind = kind;
            this.lossCopy = this._lossNarrative(reason, kind);
            this.phase = "revealing";
            this.caprilesTimer = CAPRILES_REVEAL_MS;
            this.callActive = false;
            this.breach = null;
            this.clientActive = null;
            this.clientTerminalOpen = false;
            this.monitorOpen = false;
            this.lightOn = true;
            this.doorClosed = false;
            this.hiddenUnderDesk = false;
            this._stopHorror(false);
            this.root.classList.add("is-jumpscare");
            this._cue("sil", "gritando", "Corta el canal. Corta el canal ahora.", true);
            this._syncView(true);
            this._playManguanguaScream();

        }


        _finishLoss() {

            if (this.lossShown) {
                return;
            }

            this.lossShown = true;
            this.phase = "lost";

            if (this.refs.caprilesReveal) {
                this.refs.caprilesReveal.hidden = true;
            }
            if (this.root) {
                this.root.classList.remove("is-capriles-reveal", "is-jumpscare");
            }

            const copy = this.lossCopy || this._lossNarrative(
                this.lossReason || "La oficina se quedó sin salida.",
                this.lossKind || "door"
            );

            this._syncView(true);
            this._updateHud();
            this.shell.gameOver({
                eyebrow: copy.eyebrow,
                title: copy.title,
                text: copy.text,
                score: this.score
            });

        }


        _tone(name) {

            if (A.audio && typeof A.audio.play === "function") {
                A.audio.play(name);
            }

        }


        announce(text) {

            if (this.refs && this.refs.announce) {
                this.refs.announce.textContent = text;
            }

        }


        toggleRecords() {

            if (["lost", "won", "revealing", "cinematic", "tutorial"].includes(this.phase)) {
                if (this.phase === "tutorial") {
                    this.announce("Termina o salta la guía antes de abrir los registros.");
                }
                return;
            }

            if (this.phase === "interlude") {
                this.announce("Termina la transmisión antes de abrir los registros.");
                return;
            }

            if (this.recordsOpen) {
                this.closeRecords();
            } else {
                this.openRecords();
            }

        }


        openRecords() {

            this.recordsOpen = true;
            this.recordsMode = "team";
            this.root.classList.add("is-records-open");
            this.refs.records.hidden = false;
            this._renderRecords();
            this._syncView(true);
            this.announce("Registros abiertos. El reloj se detiene mientras lees.");

        }


        closeRecords() {

            this.recordsOpen = false;
            this.root.classList.remove("is-records-open");
            this.refs.records.hidden = true;
            this._syncView(true);
            this.announce("Registros cerrados. La oficina vuelve a respirar.");

        }


        setRecordsMode(mode) {

            this.recordsMode = mode === "threats" ? "threats" : "team";
            this._renderRecords();
            this._tone("move");

        }


        setRecordsCharacter(id) {

            const member = this.member(id);

            this.recordsMode = "team";
            this.recordsCharacter = member.id;
            this.recordsExpression = member.idle;
            this._renderRecords();
            this._tone("move");

        }


        selectRecordExpression(expression) {

            const member = this.member(this.recordsCharacter);
            const descriptor = A.assets.character(member.id);

            if (!descriptor || descriptor.expressions.indexOf(expression) < 0) {
                return;
            }

            this.recordsExpression = expression;
            this._renderRecords();
            this.announce(`${member.name}: ${displayExpression(expression)}.`);
            this._tone("select");

        }


        _renderRecords() {

            const threats = this.recordsMode === "threats";
            const member = this.member(this.recordsCharacter);

            this.refs.recordsMode.innerHTML = `
                <button class="turno404__records-mode-button${!threats ? " is-active" : ""}" data-records-mode="team" type="button" aria-pressed="${!threats ? "true" : "false"}">EQUIPO</button>
                <button class="turno404__records-mode-button${threats ? " is-active" : ""}" data-records-mode="threats" type="button" aria-pressed="${threats ? "true" : "false"}">DOSSIER</button>
            `;

            if (threats) {

                this.refs.recordsTitle.textContent = "DOSSIER // AMENAZAS DE OPERACIÓN 404";
                this.refs.recordsTabs.hidden = true;
                A.assets.preload(THREATS.map((threat) => threat.id));

                this.refs.recordsGrid.innerHTML = THREATS.map((threat) => `
                    <article class="turno404__record-threat${threat.id === "boss.capriles" ? " is-primary" : ""}">
                        <span class="turno404__record-threat-art" aria-hidden="true">
                            <img src="${A.assets.url(threat.id)}" alt="" loading="lazy" decoding="async">
                        </span>
                        <div><b>${threat.name}</b><small>${threat.kind}</small></div>
                    </article>
                `).join("");

                return;

            }

            const descriptor = A.assets.character(member.id);
            const expressions = descriptor ? descriptor.expressions : [];

            this.refs.recordsTitle.textContent = `${member.name} // ${member.role}`;
            this.refs.recordsTabs.hidden = false;
            this.refs.recordsTabs.innerHTML = this.team.map((item) => `
                <button
                    class="turno404__records-tab${item.id === member.id ? " is-active" : ""}"
                    data-records-character="${item.id}"
                    type="button"
                    role="tab"
                    aria-selected="${item.id === member.id ? "true" : "false"}"
                    style="--operator:${item.color}"
                >${item.name}</button>
            `).join("");

            A.assets.preload(A.assets.characterImageIds(member.id));

            this.refs.recordsGrid.innerHTML = expressions.map((expression) => `
                <button
                    class="turno404__record-expression${expression === this.recordsExpression ? " is-selected" : ""}"
                    data-record-expression="${expression}"
                    type="button"
                    aria-label="${member.name}, ${displayExpression(expression).toLowerCase()}"
                    aria-pressed="${expression === this.recordsExpression ? "true" : "false"}"
                >
                    <img src="${A.assets.url(this._imageId(member, expression))}" alt="" loading="lazy" decoding="async">
                    <span>${displayExpression(expression)}</span>
                </button>
            `).join("");

        }


        key(key, event) {

            if (this.phase === "tutorial") {
                if (key === "Escape") {
                    event.preventDefault();
                    return event.repeat ? true : this.control("tutorial-skip");
                }

                if (key === "Enter" || key === " " || key === "Spacebar") {
                    event.preventDefault();
                    return event.repeat ? true : this.control("tutorial-next");
                }

                return true;
            }

            if (this.phase === "cinematic") {
                if (key === "Enter" || key === " " || key === "Spacebar") {
                    event.preventDefault();
                    /* Una tecla sostenida no puede saltar más de una escena. */
                    return event.repeat ? true : this.control("cinematic-next");
                }

                return true;
            }

            if (this.phase === "briefing" && this.difficultyOpen) {

                if (/^[1-3]$/.test(key)) {
                    event.preventDefault();
                    return this.selectDifficulty(DIFFICULTY_ORDER[Number(key) - 1]);
                }

                if (key === "Enter" || key === " " || key === "Spacebar") {
                    event.preventDefault();
                    return event.repeat ? true : this.selectDifficulty(this.difficulty);
                }

                return true;

            }

            if (key === "r" || key === "R") {
                event.preventDefault();
                this.toggleRecords();
                return true;
            }

            if (this.recordsOpen) {

                if (key === "Escape") {
                    this.closeRecords();
                }

                return true;

            }

            if (this.clientTerminalOpen) {

                if (key === "Escape" || key === "q" || key === "Q") {
                    event.preventDefault();
                    return this.closeClientTerminal();
                }

                if (key === "0" || key === "t" || key === "T") {
                    event.preventDefault();
                    return this.requestClientTime();
                }

                if (/^[1-3]$/.test(key)) {
                    event.preventDefault();
                    const choices = this.clientActive && this.clientActive.choices || [];
                    const choice = choices[Number(key) - 1];
                    return choice ? this.respondClient(choice.id) : true;
                }

                return true;

            }

            if (this.phase === "briefing") {
                return false;
            }

            if (this.phase === "interlude") {
                if (key === "Enter" || key === " " || key === "Spacebar") {
                    event.preventDefault();
                    return event.repeat ? true : this.control("continue");
                }

                return true;
            }

            if (this.phase !== "running") {
                return false;
            }

            if (key === "c" || key === "C") {
                event.preventDefault();
                return this.control("camera");
            }

            if (/^[1-3]$/.test(key)) {
                event.preventDefault();
                this.selectCamera(CAMERAS[Number(key) - 1].id);
                return true;
            }

            if (key === "e" || key === "E") {
                event.preventDefault();
                return this.control("signal");
            }

            if (key === "q" || key === "Q") {
                event.preventDefault();
                return this.control("client");
            }

            if (key === "v" || key === "V") {
                event.preventDefault();
                return this.control("vent");
            }

            if (key === "l" || key === "L") {
                event.preventDefault();
                return this.control("lamp");
            }

            if (key === "f" || key === "F") {
                event.preventDefault();
                return this.control("door");
            }

            if (key === "h" || key === "H") {
                event.preventDefault();
                return this.control("hide");
            }

            if (key === " " || key === "Spacebar") {
                event.preventDefault();
                return this.control("breathe");
            }

            return false;

        }

    }


    A.registerGame({

        id: "turno404",
        number: "10",
        name: "TURNO 404",
        genre: "HORROR / SURVIVAL",
        mode: "OFFICE ESCAPE",
        vipTicket: "turno404",

        /* La única música de esta guardia es horror-turno404 desde las
           04:00 AM. Omitimos la melodía procedural del shell para que jamás
           se superponga. */
        music: null,

        accent: "var(--color-pink)",
        accentRgb: "244 63 94",
        cardRgb: "244 63 94",

        /* Se limita el extremo ancho y se protege el vertical: el escenario
           conserva controles legibles sin reservar scroll extra. */
        ratioMin: 0.82,
        ratioMax: 1.68,

        preview: `
            <span class="preview preview--turno404">
                <i class="turno404p__hall"></i>
                <i class="turno404p__door"></i>
                <i class="turno404p__figure"></i>
                <i class="turno404p__monitor"></i>
                <i class="turno404p__eye turno404p__eye--a"></i>
                <i class="turno404p__eye turno404p__eye--b"></i>
                <i class="turno404p__scan"></i>
            </span>
        `,

        readyTitle: "TURNO 404",
        readyText: "Tres noches conectadas, rutas que cambian y clientes reales que atender. Tras JUGAR eliges Fácil, Normal o Difícil antes de la transmisión; Normal ofrece más margen para aprender sin apagar el horror.",
        readyHint: "ENTER — ELEGIR PROTOCOLO    1–3 — DIFICULTAD / CÁMARA    Q — CLIENTE    V — DUCTO    L — LUZ",

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.stat("night", "NOCHE", "N1 · 00/03", { text: true })}
            ${A.ui.stat("difficulty", "DIF.", "NORMAL", { text: true })}
            ${A.ui.stat("threat", "RIESGO", "CAM 1", { text: true })}
            ${A.ui.meter("energy", "ENERGÍA")}
            ${A.ui.meter("panic", "PÁNICO")}
        `,

        controls: A.ui.action("records", "REGISTROS", "▦"),

        hint: "C CÁMARAS    1–3 ELEGIR CAM    E CORTAR SEÑAL    Q CLIENTE    V DUCTO    L LUZ    F CIERRE    H ESCONDERSE    ESPACIO RESPIRAR    R REGISTROS    P PAUSA",

        create(shell) {
            return new Turno404Game(shell);
        }

    });

})(window.Arcade404);
