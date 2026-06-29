/**
 * Landing Factory — Configuraciones de las 14 verticales de IAMET
 * Cada objeto define el contenido completo de una landing page.
 * El componente LandingPage.tsx consume este tipo para renderizar la página.
 */

const R2 = "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev";

export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingUseCase {
  sector: string;
  title: string;
  description: string;
}

export interface LandingFAQ {
  question: string;
  answer: string;
}

export interface LandingStat {
  value: string;
  label: string;
}

export interface LandingConfig {
  vertical: string;          // slug único, ej. "cctv"
  title: string;             // Título principal del hero
  subtitle: string;          // Subtítulo del hero
  heroImage: string;         // URL imagen hero (R2)
  accentColor: string;       // Color Tailwind para acentos, ej. "cyan"
  specialistId: string;      // ID del especialista IA asignado
  specialistName: string;    // Nombre para mostrar en el chat
  specialistRole: string;    // Rol del especialista
  metaTitle: string;
  metaDescription: string;
  stats: LandingStat[];
  features: LandingFeature[];
  useCases: LandingUseCase[];
  faqs: LandingFAQ[];
  ctaText: string;
  ctaSubtext: string;
}

export const LANDINGS: Record<string, LandingConfig> = {
  "cableado": {
    vertical: "cableado",
    title: "Cableado Estructurado Certificado",
    subtitle: "Infraestructura de red de alto rendimiento para empresas que no pueden permitirse el tiempo de inactividad. Certificación TIA-568-C garantizada.",
    heroImage: `${R2}/services/cableado.jpg`,
    accentColor: "blue",
    specialistId: "cableado",
    specialistName: "Ing. Álvaro Rivera",
    specialistRole: "Especialista en Infraestructura de Red",
    metaTitle: "Cableado Estructurado Empresarial | IAMET — Certificado TIA-568-C",
    metaDescription: "Instalación de cableado estructurado Cat6A, fibra óptica y centros de cableado certificados. Proyectos llave en mano para empresas en México.",
    stats: [
      { value: "+500", label: "Proyectos instalados" },
      { value: "100%", label: "Certificación TIA" },
      { value: "15 años", label: "De experiencia" },
      { value: "48h", label: "Tiempo de respuesta" },
    ],
    features: [
      { icon: "Cable", title: "Cat6A y Fibra Óptica", description: "Instalación de cableado de cobre Cat6A y fibra óptica monomodo/multimodo con certificación de cada punto." },
      { icon: "Server", title: "Centros de Cableado", description: "Diseño e instalación de racks, patch panels, organizadores y etiquetado profesional según normas TIA-606." },
      { icon: "Shield", title: "Certificación Garantizada", description: "Cada punto de red es certificado con equipo Fluke Networks. Entregamos reportes de certificación completos." },
      { icon: "Zap", title: "PoE y Alimentación", description: "Infraestructura preparada para PoE+ (802.3at) y PoE++ (802.3bt) para cámaras, APs y teléfonos IP." },
      { icon: "FileText", title: "Documentación Completa", description: "Planos As-Built, etiquetado de puertos, inventario de materiales y manual de usuario incluidos." },
      { icon: "Wrench", title: "Mantenimiento Preventivo", description: "Pólizas de mantenimiento anual con revisión de continuidad, limpieza de conectores y actualización de documentación." },
    ],
    useCases: [
      { sector: "Manufactura", title: "Planta Industrial con 300 nodos", description: "Red Cat6A para planta de 8,000 m² con zona de producción, oficinas y almacén. Certificación completa en 10 días." },
      { sector: "Corporativo", title: "Torre de Oficinas 20 pisos", description: "Backbone de fibra óptica con distribución Cat6A por piso. Cuarto de telecomunicaciones por nivel." },
      { sector: "Salud", title: "Hospital con red redundante", description: "Infraestructura de red con rutas redundantes para sistemas clínicos críticos. Certificación hospitalaria." },
    ],
    faqs: [
      { question: "¿Cuánto tiempo tarda un proyecto de cableado?", answer: "Depende del alcance. Un proyecto de 100 nodos en oficinas tarda entre 3 y 5 días hábiles. Proyectos industriales de 500+ nodos pueden tomar 2-3 semanas." },
      { question: "¿Qué incluye la certificación?", answer: "Certificamos cada punto de red con equipo Fluke Networks DSX-8000. El reporte incluye: mapa de cableado, atenuación, NEXT, PSNEXT, longitud y resultado PASS/FAIL." },
      { question: "¿Trabajan con infraestructura existente?", answer: "Sí. Realizamos auditorías de infraestructura existente, identificamos puntos deficientes y proponemos un plan de mejora sin necesidad de reemplazar todo el cableado." },
      { question: "¿Ofrecen garantía?", answer: "Garantizamos la instalación por 1 año contra defectos de mano de obra. Los materiales tienen la garantía del fabricante (Panduit, Commscope, Belden)." },
    ],
    ctaText: "Solicitar diagnóstico gratuito",
    ctaSubtext: "Un ingeniero evaluará su infraestructura actual sin costo",
  },

  "cctv": {
    vertical: "cctv",
    title: "CCTV Empresarial con Analítica de Video IA",
    subtitle: "Sistemas de videovigilancia inteligente que no solo graban: detectan, alertan y protegen. Desde 4 cámaras hasta miles de puntos de monitoreo.",
    heroImage: `${R2}/services/cctv.jpg`,
    accentColor: "cyan",
    specialistId: "cctv",
    specialistName: "Ing. Marco Reyes",
    specialistRole: "Especialista en Seguridad Electrónica",
    metaTitle: "CCTV Empresarial con IA | IAMET — Videovigilancia Inteligente",
    metaDescription: "Sistemas CCTV IP con analítica de video por inteligencia artificial. Detección de personas, vehículos y comportamientos anómalos. Instalación y soporte en México.",
    stats: [
      { value: "+2,000", label: "Cámaras instaladas" },
      { value: "4K", label: "Resolución máxima" },
      { value: "30 días", label: "Retención de video" },
      { value: "24/7", label: "Monitoreo activo" },
    ],
    features: [
      { icon: "Camera", title: "Cámaras IP 4K con IA", description: "Cámaras Hikvision y Dahua con detección de personas, vehículos, reconocimiento facial y análisis de comportamiento." },
      { icon: "Monitor", title: "VMS Centralizado", description: "Plataforma de gestión de video (Genetec, Milestone, Hikvision iVMS) para visualización y gestión centralizada de múltiples sitios." },
      { icon: "Bell", title: "Alertas en Tiempo Real", description: "Notificaciones push, email y SMS cuando el sistema detecta eventos: intrusión, merodeo, abandono de objetos, aglomeraciones." },
      { icon: "HardDrive", title: "Almacenamiento Escalable", description: "NVR local, SAN/NAS o almacenamiento en nube. Retención configurable de 7 a 90 días según normativa." },
      { icon: "Shield", title: "Integración con Acceso", description: "Sincronización con control de acceso para video verificación: cada evento de acceso genera un clip de video asociado." },
      { icon: "Globe", title: "Acceso Remoto Seguro", description: "Visualización desde cualquier dispositivo con VPN o acceso seguro. App móvil incluida." },
    ],
    useCases: [
      { sector: "Retail", title: "Cadena de 50 tiendas", description: "Sistema centralizado con analítica de conteo de personas, mapas de calor y detección de comportamientos sospechosos." },
      { sector: "Logística", title: "Centro de distribución 24/7", description: "360 cámaras con cobertura total de andenes, almacén y perímetro. Integración con sistema de gestión de almacén." },
      { sector: "Gobierno", title: "Ciudad segura municipal", description: "Red de videovigilancia urbana con cámaras PTZ, reconocimiento de placas y centro de monitoreo C2." },
    ],
    faqs: [
      { question: "¿Qué diferencia hay entre cámaras analógicas e IP?", answer: "Las cámaras IP ofrecen mayor resolución (hasta 4K), compresión H.265+ para menor uso de almacenamiento, analítica integrada y administración remota. Las analógicas son más económicas pero limitadas en funcionalidad." },
      { question: "¿Cuánto almacenamiento necesito?", answer: "Depende de la resolución, FPS y días de retención. Para 16 cámaras 4MP a 15fps con 30 días de retención, se requieren aproximadamente 8TB con compresión H.265+." },
      { question: "¿Funciona la analítica de IA en tiempo real?", answer: "Sí. Los algoritmos de detección corren en el edge (dentro de la cámara o NVR) sin necesidad de enviar video a la nube, garantizando baja latencia y privacidad." },
      { question: "¿Qué pasa si se va la luz?", answer: "Los NVR y cámaras pueden conectarse a UPS. Adicionalmente, muchas cámaras tienen almacenamiento local en micro SD como respaldo ante fallas de red." },
    ],
    ctaText: "Solicitar evaluación de seguridad",
    ctaSubtext: "Diagnóstico gratuito de vulnerabilidades en su instalación actual",
  },

  "control-acceso": {
    vertical: "control-acceso",
    title: "Control de Acceso Empresarial",
    subtitle: "Gestione quién entra, cuándo y a dónde. Desde lectores biométricos hasta plataformas de identidad para múltiples sitios.",
    heroImage: `${R2}/services/cctv.jpg`,
    accentColor: "indigo",
    specialistId: "control-acceso",
    specialistName: "Ing. Marco Reyes",
    specialistRole: "Especialista en Control de Acceso",
    metaTitle: "Control de Acceso Empresarial | IAMET — Biométrico y RFID",
    metaDescription: "Sistemas de control de acceso biométrico, RFID y tarjeta inteligente para empresas. Integración con CCTV, RRHH y nómina. Instalación en México.",
    stats: [
      { value: "+300", label: "Instalaciones activas" },
      { value: "50,000+", label: "Usuarios gestionados" },
      { value: "99.9%", label: "Disponibilidad" },
      { value: "< 1s", label: "Tiempo de verificación" },
    ],
    features: [
      { icon: "Fingerprint", title: "Biometría Avanzada", description: "Lectores de huella dactilar, reconocimiento facial y venas de la palma. Falso rechazo < 0.001%." },
      { icon: "CreditCard", title: "Tarjetas RFID", description: "Credenciales MIFARE Classic, DESFire EV3 y tarjetas de alta seguridad con cifrado AES-128." },
      { icon: "Smartphone", title: "Acceso Móvil", description: "Credenciales digitales en smartphone via Bluetooth o NFC. Elimina la gestión de tarjetas físicas." },
      { icon: "Users", title: "Gestión Centralizada", description: "Plataforma web para administrar usuarios, permisos, horarios y reportes de acceso en tiempo real." },
      { icon: "Link", title: "Integración con RRHH", description: "Sincronización automática con sistemas de RRHH y nómina. Alta/baja de empleados refleja inmediatamente en accesos." },
      { icon: "AlertTriangle", title: "Antipassback y Zonas", description: "Reglas de antipassback, zonas de seguridad, mustering y evacuación de emergencia." },
    ],
    useCases: [
      { sector: "Farmacéutico", title: "Laboratorio con zonas restringidas", description: "Control de acceso por niveles de seguridad: zona pública, área de producción y laboratorio de alta seguridad." },
      { sector: "Financiero", title: "Banco con 20 sucursales", description: "Sistema centralizado con credenciales unificadas, reportes de auditoría y integración con sistema de alarmas." },
      { sector: "Manufactura", title: "Planta con 1,500 empleados", description: "Torniquetes de alta velocidad, control de contratistas y visitantes, integración con sistema de nómina." },
    ],
    faqs: [
      { question: "¿Funciona sin conexión a internet?", answer: "Sí. Los controladores de acceso operan de forma autónoma con su base de datos local. La conexión al servidor central es para sincronización y reportes, no para operación." },
      { question: "¿Cómo se integra con CCTV?", answer: "Cada evento de acceso (entrada, salida, acceso denegado) genera automáticamente un clip de video asociado en el NVR. Puede ver el video de cualquier evento desde la plataforma de acceso." },
      { question: "¿Qué pasa si un empleado pierde su tarjeta?", answer: "La tarjeta se bloquea inmediatamente desde la plataforma web o app móvil. Si usa credencial móvil, simplemente se revoca el acceso desde el teléfono." },
      { question: "¿Pueden acceder visitantes temporales?", answer: "Sí. El sistema incluye módulo de visitantes con registro, foto, credencial temporal con fecha/hora de expiración y notificación al anfitrión." },
    ],
    ctaText: "Solicitar demo del sistema",
    ctaSubtext: "Le mostramos el sistema funcionando en 30 minutos",
  },

  "rfid": {
    vertical: "rfid",
    title: "Soluciones RFID para Inventario y Trazabilidad",
    subtitle: "Identifique, rastree y gestione activos, inventario y personal en tiempo real. Precisión del 99.9% sin línea de visión.",
    heroImage: `${R2}/services/computo.jpg`,
    accentColor: "emerald",
    specialistId: "rfid",
    specialistName: "Ing. Luis Hernández",
    specialistRole: "Especialista en RFID y Automatización",
    metaTitle: "Soluciones RFID Empresarial | IAMET — Inventario y Trazabilidad",
    metaDescription: "Implementación de sistemas RFID para inventario, trazabilidad de activos y control de personal. Tecnología UHF, HF y NFC. Integración con ERP y WMS.",
    stats: [
      { value: "99.9%", label: "Precisión de lectura" },
      { value: "10m", label: "Rango de lectura UHF" },
      { value: "1,000+", label: "Tags por segundo" },
      { value: "50%", label: "Reducción de mermas" },
    ],
    features: [
      { icon: "Tag", title: "RFID UHF para Inventario", description: "Lectores fijos y portátiles UHF (860-960 MHz) para conteo masivo de inventario sin línea de visión. Compatible con GS1 EPC Gen2." },
      { icon: "MapPin", title: "Localización en Tiempo Real (RTLS)", description: "Sistemas de localización en tiempo real con precisión de 1-3 metros para activos de alto valor en plantas y almacenes." },
      { icon: "Package", title: "Integración con WMS/ERP", description: "Conectores nativos para SAP, Oracle, Microsoft Dynamics y sistemas WMS. Sincronización bidireccional en tiempo real." },
      { icon: "Truck", title: "Control de Puertas y Andenes", description: "Portales RFID en puertas de almacén para registro automático de entradas y salidas sin detener el flujo." },
      { icon: "Shield", title: "Anti-hurto y Seguridad", description: "Etiquetas de seguridad EAS integradas con RFID para protección de activos en retail y manufactura." },
      { icon: "BarChart", title: "Analítica de Inventario", description: "Dashboard con niveles de stock en tiempo real, alertas de reorden, análisis de rotación y reportes de auditoría." },
    ],
    useCases: [
      { sector: "Retail", title: "Cadena de moda con 200 tiendas", description: "RFID en prendas para inventario en 15 minutos vs. 8 horas manual. Reducción de merma del 40%." },
      { sector: "Manufactura", title: "Control de herramientas en planta", description: "Localización en tiempo real de 5,000 herramientas. Eliminación de pérdidas y tiempos de búsqueda." },
      { sector: "Salud", title: "Trazabilidad de equipos médicos", description: "RFID en equipos de alto valor para localización inmediata, mantenimiento preventivo y auditoría de uso." },
    ],
    faqs: [
      { question: "¿Qué diferencia hay entre RFID HF y UHF?", answer: "HF (13.56 MHz) tiene rango corto (hasta 1m) y se usa en tarjetas de acceso y pagos. UHF (860-960 MHz) tiene rango largo (hasta 10m) y es ideal para inventario masivo y logística." },
      { question: "¿Funciona con metales y líquidos?", answer: "Existen etiquetas especiales para superficies metálicas (on-metal tags) y para líquidos. El diseño de la antena es crítico; nuestros ingenieros realizan pruebas de lectura antes de la implementación." },
      { question: "¿Cuánto tiempo toma implementar RFID?", answer: "Un piloto en un almacén de 1,000 m² puede estar operativo en 2-3 semanas. La implementación completa con integración a ERP toma entre 1 y 3 meses según la complejidad." },
      { question: "¿Qué ROI puedo esperar?", answer: "En retail, el ROI típico es de 12-18 meses por reducción de merma y mejora en disponibilidad de producto. En manufactura, la recuperación de inversión suele ser de 6-12 meses." },
    ],
    ctaText: "Solicitar prueba de concepto",
    ctaSubtext: "Realizamos un piloto en su instalación sin costo",
  },

  "data-center": {
    vertical: "data-center",
    title: "Diseño e Implementación de Data Centers",
    subtitle: "Desde salas de servidores hasta data centers Tier III. Infraestructura crítica diseñada para máxima disponibilidad y eficiencia energética.",
    heroImage: `${R2}/services/proyectos.jpg`,
    accentColor: "slate",
    specialistId: "data-center",
    specialistName: "Ing. Diego Castillo",
    specialistRole: "Arquitecto de Infraestructura",
    metaTitle: "Data Centers y Salas de Servidores | IAMET — Diseño Tier III",
    metaDescription: "Diseño, construcción y certificación de data centers Tier I-III. Infraestructura eléctrica, climatización, cableado estructurado y seguridad física.",
    stats: [
      { value: "Tier III", label: "Nivel de diseño" },
      { value: "99.98%", label: "Disponibilidad" },
      { value: "1.4", label: "PUE objetivo" },
      { value: "+50", label: "Data centers construidos" },
    ],
    features: [
      { icon: "Server", title: "Infraestructura de TI", description: "Racks, PDU, KVM, cableado estructurado y sistemas de gestión de infraestructura (DCIM)." },
      { icon: "Zap", title: "Infraestructura Eléctrica", description: "UPS, generadores, tableros de distribución, transferencia automática y sistemas de tierra física." },
      { icon: "Wind", title: "Climatización de Precisión", description: "CRAC/CRAH, pasillos fríos/calientes, economizadores y monitoreo de temperatura/humedad." },
      { icon: "Shield", title: "Seguridad Física", description: "Control de acceso biométrico, CCTV, detección de incendio y sistemas de supresión limpia (FM-200, Novec)." },
      { icon: "Activity", title: "Monitoreo DCIM", description: "Plataforma de gestión de infraestructura para monitoreo en tiempo real de energía, temperatura y capacidad." },
      { icon: "FileText", title: "Certificación Uptime", description: "Diseño y documentación para certificación Uptime Institute Tier I, II o III según requerimientos." },
    ],
    useCases: [
      { sector: "Financiero", title: "Data center Tier III para banco", description: "Sala de 200 m² con redundancia N+1 en todos los sistemas. Certificación Uptime Institute Tier III." },
      { sector: "Gobierno", title: "Centro de datos municipal", description: "Infraestructura para consolidación de servidores de 12 dependencias municipales. PUE 1.45." },
      { sector: "Manufactura", title: "Sala de servidores industrial", description: "Cuarto de telecomunicaciones para planta con ambientes extremos. Climatización de precisión y protección contra polvo." },
    ],
    faqs: [
      { question: "¿Qué significa Tier III?", answer: "Tier III (Uptime Institute) significa que el data center tiene redundancia N+1 en todos los sistemas críticos, permitiendo mantenimiento sin interrumpir operaciones. Garantiza 99.98% de disponibilidad (1.6h de downtime/año)." },
      { question: "¿Cuánto espacio necesito para un data center?", answer: "Depende de la cantidad de racks. Una sala de 20 racks requiere aproximadamente 40-60 m² considerando pasillos, equipos de soporte y espacio de trabajo. Hacemos el diseño según sus necesidades." },
      { question: "¿Cuánto consume un data center?", answer: "El consumo depende de la carga de TI. Un rack promedio consume 5-10 kW. El PUE (Power Usage Effectiveness) mide la eficiencia: un PUE de 1.4 significa que por cada 1W de TI se consumen 0.4W adicionales en infraestructura." },
      { question: "¿Pueden hacer el proyecto llave en mano?", answer: "Sí. Nos encargamos de todo: diseño, obra civil, instalaciones eléctricas, climatización, cableado, seguridad y puesta en marcha. Entregamos el data center operativo y documentado." },
    ],
    ctaText: "Solicitar diseño conceptual",
    ctaSubtext: "Evaluamos sus requerimientos y proponemos una solución",
  },

  "redes": {
    vertical: "redes",
    title: "Redes Empresariales de Alto Rendimiento",
    subtitle: "Arquitecturas de red diseñadas para soportar las aplicaciones más exigentes. Switching, routing, SD-WAN y seguridad de red integrada.",
    heroImage: `${R2}/services/computo.jpg`,
    accentColor: "blue",
    specialistId: "redes",
    specialistName: "Ing. Álvaro Rivera",
    specialistRole: "Arquitecto de Redes",
    metaTitle: "Redes Empresariales | IAMET — Switching, Routing y SD-WAN",
    metaDescription: "Diseño e implementación de redes empresariales LAN/WAN. Cisco, HPE, Fortinet. SD-WAN, segmentación, QoS y monitoreo 24/7. Soporte en México.",
    stats: [
      { value: "10 Gbps", label: "Backbone máximo" },
      { value: "< 1ms", label: "Latencia LAN" },
      { value: "99.99%", label: "Disponibilidad SLA" },
      { value: "24/7", label: "NOC propio" },
    ],
    features: [
      { icon: "Network", title: "Switching Empresarial", description: "Switches administrables L2/L3 con VLAN, QoS, LACP y redundancia. Marcas: Cisco, HPE Aruba, Juniper." },
      { icon: "Globe", title: "SD-WAN y Conectividad WAN", description: "Soluciones SD-WAN para múltiples sitios con failover automático, optimización de tráfico y visibilidad centralizada." },
      { icon: "Shield", title: "Seguridad de Red", description: "Firewalls NGFW, segmentación con microsegmentación, IPS/IDS, filtrado web y protección contra amenazas avanzadas." },
      { icon: "Wifi", title: "WiFi Empresarial", description: "Redes inalámbricas con controlador centralizado, SSID múltiples, autenticación 802.1X y cobertura garantizada." },
      { icon: "Activity", title: "Monitoreo y NOC", description: "Monitoreo 24/7 con alertas proactivas, análisis de tráfico y resolución de incidentes antes de que impacten al negocio." },
      { icon: "Settings", title: "Automatización de Red", description: "Configuración mediante Ansible, Terraform y APIs. Reducción de errores humanos y despliegue más rápido." },
    ],
    useCases: [
      { sector: "Corporativo", title: "Red para 500 usuarios en 3 edificios", description: "Arquitectura core-distribución-acceso con fibra entre edificios, switching L3 y WiFi 6 en toda la planta." },
      { sector: "Retail", title: "SD-WAN para 80 sucursales", description: "Reemplazo de MPLS por SD-WAN con failover a LTE. Reducción del 60% en costos de conectividad WAN." },
      { sector: "Manufactura", title: "Red OT/IT convergente", description: "Segmentación de red OT e IT con firewall industrial. Visibilidad de activos industriales sin comprometer seguridad." },
    ],
    faqs: [
      { question: "¿Qué es SD-WAN y por qué lo necesito?", answer: "SD-WAN (Software-Defined WAN) permite gestionar múltiples conexiones WAN (fibra, MPLS, LTE) de forma inteligente, seleccionando automáticamente la mejor ruta para cada aplicación. Reduce costos y mejora el rendimiento." },
      { question: "¿Cómo segmentan la red?", answer: "Usamos VLANs para separar tráfico por departamento o función (usuarios, servidores, IoT, invitados). Con microsegmentación podemos aislar aplicaciones críticas y limitar el movimiento lateral de amenazas." },
      { question: "¿Qué marcas manejan?", answer: "Somos partners de Cisco, HPE Aruba, Juniper, Fortinet y Palo Alto Networks. Seleccionamos la marca según el presupuesto, requerimientos y preferencias del cliente." },
      { question: "¿Ofrecen soporte 24/7?", answer: "Sí. Nuestro NOC opera 24/7/365 con monitoreo proactivo. Los SLAs de respuesta van desde 4 horas para incidentes críticos hasta 8 horas para incidentes de impacto medio." },
    ],
    ctaText: "Solicitar auditoría de red",
    ctaSubtext: "Identificamos cuellos de botella y vulnerabilidades sin costo",
  },

  "wifi-industrial": {
    vertical: "wifi-industrial",
    title: "WiFi Industrial para Entornos Críticos",
    subtitle: "Conectividad inalámbrica confiable en plantas, almacenes y entornos con interferencias. Roaming sin interrupciones para AGVs, lectores y dispositivos móviles.",
    heroImage: `${R2}/services/computo.jpg`,
    accentColor: "amber",
    specialistId: "wifi-industrial",
    specialistName: "Ing. Álvaro Rivera",
    specialistRole: "Especialista en Redes Industriales",
    metaTitle: "WiFi Industrial | IAMET — Conectividad para Manufactura y Logística",
    metaDescription: "Redes WiFi industriales para plantas, almacenes y entornos críticos. WiFi 6, roaming < 50ms, resistencia IP67. Cisco, HPE Aruba, Cisco Meraki.",
    stats: [
      { value: "WiFi 6", label: "Estándar más reciente" },
      { value: "< 50ms", label: "Roaming seamless" },
      { value: "IP67", label: "Protección industrial" },
      { value: "300+", label: "Dispositivos por AP" },
    ],
    features: [
      { icon: "Wifi", title: "APs Industriales IP67", description: "Access points con protección contra polvo, humedad y temperaturas extremas (-40°C a +70°C). Montaje en rieles DIN." },
      { icon: "Zap", title: "Roaming < 50ms para AGVs", description: "Roaming rápido (802.11r/k/v) para vehículos guiados automáticamente sin pérdida de conexión en movimiento." },
      { icon: "Shield", title: "Seguridad WPA3 Enterprise", description: "Autenticación 802.1X con RADIUS, certificados digitales y segmentación por SSID para diferentes tipos de dispositivos." },
      { icon: "Activity", title: "Análisis de Espectro RF", description: "Estudio de cobertura y análisis de interferencias antes de la instalación. Garantizamos cobertura en cada punto." },
      { icon: "Settings", title: "Gestión Centralizada", description: "Controlador en la nube o on-premise para gestión de todos los APs, políticas de red y monitoreo de rendimiento." },
      { icon: "Cpu", title: "Integración con OT", description: "Soporte para protocolos industriales sobre WiFi: PROFINET, EtherNet/IP, Modbus TCP. Latencia determinística." },
    ],
    useCases: [
      { sector: "Automotriz", title: "Planta de ensamble con 200 AGVs", description: "Red WiFi 6 con roaming < 30ms para flota de AGVs. Cero interrupciones en 18 meses de operación." },
      { sector: "Logística", title: "Centro de distribución de 50,000 m²", description: "Cobertura total con 80 APs industriales. Lectores RFID, terminales de almacén y cámaras sobre la misma red." },
      { sector: "Alimentos", title: "Planta con ambientes de limpieza", description: "APs con protección IP67 para zonas de lavado. Red separada para sistemas de control y usuarios." },
    ],
    faqs: [
      { question: "¿Por qué WiFi industrial y no WiFi comercial?", answer: "Los APs industriales están diseñados para soportar vibraciones, temperaturas extremas, humedad y ambientes con interferencias electromagnéticas. Los APs comerciales fallan prematuramente en estos entornos." },
      { question: "¿Cómo garantizan la cobertura?", answer: "Realizamos un estudio de sitio (site survey) con herramientas profesionales antes de la instalación. Modelamos la propagación de señal considerando obstáculos, materiales y fuentes de interferencia." },
      { question: "¿Pueden coexistir dispositivos IoT con usuarios?", answer: "Sí. Usamos SSIDs separados con VLANs distintas para aislar el tráfico de dispositivos IoT/OT del tráfico de usuarios. Esto mejora seguridad y rendimiento." },
      { question: "¿Qué pasa si un AP falla?", answer: "Los APs vecinos aumentan automáticamente su potencia para cubrir el área del AP fallido (RRM/ARM). El impacto en cobertura es mínimo y el sistema notifica inmediatamente." },
    ],
    ctaText: "Solicitar site survey gratuito",
    ctaSubtext: "Analizamos su planta y diseñamos la red óptima",
  },

  "ia-empresarial": {
    vertical: "ia-empresarial",
    title: "Inteligencia Artificial para Empresas",
    subtitle: "De los datos a las decisiones. Implementamos IA que resuelve problemas reales de negocio: predicción, automatización, visión computacional y procesamiento de lenguaje natural.",
    heroImage: `${R2}/services/software.jpg`,
    accentColor: "violet",
    specialistId: "ia-empresarial",
    specialistName: "Ing. Sofía Morales",
    specialistRole: "Consultora en IA y Machine Learning",
    metaTitle: "Inteligencia Artificial Empresarial | IAMET — ML, NLP y Visión",
    metaDescription: "Implementación de IA empresarial: machine learning, NLP, visión computacional y automatización inteligente. Casos de uso reales con ROI medible.",
    stats: [
      { value: "85%", label: "Precisión promedio" },
      { value: "60%", label: "Reducción de tiempo manual" },
      { value: "6 meses", label: "ROI típico" },
      { value: "GPT-4o", label: "Modelos de última gen." },
    ],
    features: [
      { icon: "Brain", title: "Machine Learning Predictivo", description: "Modelos de predicción para demanda, mantenimiento predictivo, detección de fraude y análisis de riesgo." },
      { icon: "MessageSquare", title: "Procesamiento de Lenguaje Natural", description: "Chatbots empresariales, análisis de sentimientos, extracción de información de documentos y contratos." },
      { icon: "Eye", title: "Visión Computacional", description: "Inspección de calidad automatizada, conteo de objetos, detección de defectos y análisis de video en tiempo real." },
      { icon: "Zap", title: "RPA con IA", description: "Automatización robótica de procesos potenciada con IA para manejar excepciones y documentos no estructurados." },
      { icon: "Database", title: "Analítica Avanzada", description: "Dashboards predictivos, análisis de causa raíz y recomendaciones accionables basadas en datos históricos." },
      { icon: "Shield", title: "IA Responsable", description: "Modelos explicables, auditoría de sesgos y cumplimiento con regulaciones de privacidad (LFPDPPP, GDPR)." },
    ],
    useCases: [
      { sector: "Manufactura", title: "Inspección visual de calidad", description: "Visión computacional para detección de defectos en línea de producción. 99.2% de precisión vs. 94% humano." },
      { sector: "Financiero", title: "Detección de fraude en tiempo real", description: "Modelo ML que analiza transacciones en < 100ms. Reducción del 70% en fraudes no detectados." },
      { sector: "Retail", title: "Predicción de demanda", description: "Modelo de forecasting que reduce el exceso de inventario en 35% y los quiebres de stock en 45%." },
    ],
    faqs: [
      { question: "¿Necesito muchos datos para implementar IA?", answer: "Depende del caso de uso. Para algunos modelos de clasificación, 1,000-5,000 ejemplos son suficientes. Para visión computacional, generalmente se necesitan 500-2,000 imágenes por clase. Evaluamos la viabilidad con sus datos actuales." },
      { question: "¿Cuánto tiempo toma un proyecto de IA?", answer: "Un piloto (prueba de concepto) toma 4-8 semanas. Una implementación completa con integración a sistemas existentes toma 3-6 meses. Trabajamos en sprints para entregar valor incremental." },
      { question: "¿Funciona con mis sistemas actuales?", answer: "Sí. Integramos los modelos de IA con ERP, CRM, MES y cualquier sistema con API. También podemos trabajar con archivos Excel o bases de datos existentes." },
      { question: "¿Cómo miden el ROI?", answer: "Definimos KPIs de negocio antes de iniciar (reducción de costos, aumento de ingresos, ahorro de tiempo). Medimos el impacto real del modelo vs. el proceso anterior." },
    ],
    ctaText: "Solicitar taller de casos de uso",
    ctaSubtext: "Identificamos las oportunidades de IA en su empresa en 2 horas",
  },

  "software": {
    vertical: "software",
    title: "Desarrollo de Software Empresarial",
    subtitle: "Aplicaciones web, móviles y de escritorio que automatizan procesos, eliminan ineficiencias y escalan con su negocio.",
    heroImage: `${R2}/services/software.jpg`,
    accentColor: "teal",
    specialistId: "software",
    specialistName: "Ing. Diego Castillo",
    specialistRole: "Arquitecto de Software",
    metaTitle: "Desarrollo de Software Empresarial | IAMET — Web, Móvil y Cloud",
    metaDescription: "Desarrollo de software a medida para empresas. Aplicaciones web, móviles, APIs, integraciones ERP y automatización de procesos. Stack moderno y escalable.",
    stats: [
      { value: "+100", label: "Proyectos entregados" },
      { value: "React/Node", label: "Stack principal" },
      { value: "AWS/Azure", label: "Cloud partners" },
      { value: "Agile", label: "Metodología" },
    ],
    features: [
      { icon: "Globe", title: "Aplicaciones Web", description: "SPA y PWA con React, Vue o Angular. Backend con Node.js, Python o .NET. Arquitectura de microservicios o monolito modular." },
      { icon: "Smartphone", title: "Apps Móviles", description: "Aplicaciones iOS y Android nativas o con React Native/Flutter. Publicación en App Store y Google Play." },
      { icon: "Link", title: "Integraciones y APIs", description: "Integración con SAP, Oracle, Salesforce, Microsoft 365 y cualquier sistema con API REST o SOAP." },
      { icon: "Zap", title: "Automatización de Procesos", description: "RPA con UiPath o Power Automate para automatizar tareas repetitivas: captura de datos, generación de reportes, envío de correos." },
      { icon: "Cloud", title: "Migración a la Nube", description: "Migración de aplicaciones on-premise a AWS, Azure o GCP. Arquitectura cloud-native con contenedores y serverless." },
      { icon: "Shield", title: "Seguridad y Cumplimiento", description: "Desarrollo seguro (OWASP), pruebas de penetración, cifrado de datos y cumplimiento con LFPDPPP y PCI-DSS." },
    ],
    useCases: [
      { sector: "Logística", title: "Portal de clientes y tracking", description: "Plataforma web para seguimiento de embarques en tiempo real con integración a sistemas de transporte." },
      { sector: "Manufactura", title: "MES para planta de producción", description: "Sistema de ejecución de manufactura con captura de datos en tiempo real, OEE y gestión de órdenes." },
      { sector: "Servicios", title: "CRM y gestión de campo", description: "CRM personalizado con app móvil para técnicos de campo. Gestión de órdenes, inventario y facturación." },
    ],
    faqs: [
      { question: "¿Cuánto cuesta desarrollar una aplicación?", answer: "Depende de la complejidad. Una aplicación web simple puede costar $150,000-$300,000 MXN. Un sistema empresarial complejo puede superar $1,000,000 MXN. Hacemos una estimación detallada sin costo." },
      { question: "¿Cuánto tiempo toma el desarrollo?", answer: "Una aplicación simple toma 2-3 meses. Un sistema empresarial completo puede tomar 6-12 meses. Trabajamos en sprints de 2 semanas con entregas incrementales." },
      { question: "¿Qué pasa después de la entrega?", answer: "Ofrecemos soporte post-lanzamiento y mantenimiento evolutivo. También podemos capacitar a su equipo interno para que gestione la aplicación." },
      { question: "¿Pueden integrar con nuestro ERP actual?", answer: "Sí. Tenemos experiencia integrando con SAP, Oracle, Microsoft Dynamics, Aspel y otros ERPs comunes en México." },
    ],
    ctaText: "Solicitar estimación de proyecto",
    ctaSubtext: "Analizamos sus requerimientos y proponemos una solución en 48h",
  },

  "servicios-administrados": {
    vertical: "servicios-administrados",
    title: "Servicios de TI Administrados (MSP)",
    subtitle: "Su departamento de TI externo. Monitoreo proactivo, soporte 24/7, gestión de infraestructura y ciberseguridad por una tarifa mensual predecible.",
    heroImage: `${R2}/services/mantenimiento.jpg`,
    accentColor: "orange",
    specialistId: "servicios-administrados",
    specialistName: "Ing. Álvaro Rivera",
    specialistRole: "Director de Servicios Administrados",
    metaTitle: "Servicios TI Administrados (MSP) | IAMET — Soporte 24/7",
    metaDescription: "Servicios de TI administrados para empresas: monitoreo 24/7, helpdesk, gestión de infraestructura, ciberseguridad y respaldo. SLA garantizado.",
    stats: [
      { value: "24/7", label: "Monitoreo activo" },
      { value: "< 4h", label: "Respuesta crítica" },
      { value: "99.9%", label: "Uptime garantizado" },
      { value: "+200", label: "Clientes activos" },
    ],
    features: [
      { icon: "Monitor", title: "Monitoreo Proactivo", description: "Monitoreo 24/7 de servidores, red, aplicaciones y seguridad. Alertas antes de que los problemas impacten al negocio." },
      { icon: "Headphones", title: "Helpdesk Multicanal", description: "Soporte técnico por teléfono, email, chat y portal web. Niveles N1, N2 y N3 con SLA garantizado." },
      { icon: "Shield", title: "Ciberseguridad Gestionada", description: "SOC como servicio, gestión de parches, antivirus/EDR, backup y recuperación ante desastres." },
      { icon: "Cloud", title: "Gestión de Nube", description: "Administración de AWS, Azure y GCP: optimización de costos, escalado automático y cumplimiento." },
      { icon: "FileText", title: "Reportes Ejecutivos", description: "Reportes mensuales de disponibilidad, incidentes, capacidad y cumplimiento de SLA para la dirección." },
      { icon: "Users", title: "vCIO Estratégico", description: "Director de TI virtual que alinea la tecnología con los objetivos de negocio y planifica la hoja de ruta tecnológica." },
    ],
    useCases: [
      { sector: "PyME", title: "Empresa de 100 empleados sin TI interno", description: "Servicio completo de TI administrado: helpdesk, infraestructura, seguridad y estrategia tecnológica." },
      { sector: "Retail", title: "Cadena de tiendas con TI limitado", description: "Monitoreo y soporte remoto para 30 tiendas. Resolución del 80% de incidentes sin visita presencial." },
      { sector: "Manufactura", title: "Planta con sistemas críticos", description: "Monitoreo de OT/IT con SLA de 2 horas para sistemas de producción. Gestión de parches y backups." },
    ],
    faqs: [
      { question: "¿Qué incluye el servicio básico?", answer: "El plan básico incluye monitoreo 24/7, helpdesk en horario hábil, gestión de parches, antivirus y backup. Los planes avanzados agregan SOC, vCIO y gestión de nube." },
      { question: "¿Cómo se calcula el precio?", answer: "El precio se basa en el número de usuarios y dispositivos gestionados. Típicamente entre $500 y $1,500 MXN por usuario/mes según el nivel de servicio." },
      { question: "¿Pueden gestionar nuestra infraestructura actual?", answer: "Sí. Realizamos una auditoría inicial para documentar su infraestructura y definir el alcance del servicio. No es necesario cambiar equipos para comenzar." },
      { question: "¿Qué pasa si necesito soporte fuera de horario?", answer: "Los planes con soporte 24/7 incluyen atención en cualquier hora. Los incidentes críticos (sistemas caídos) se atienden inmediatamente; los no críticos en el siguiente horario hábil." },
    ],
    ctaText: "Solicitar auditoría de TI gratuita",
    ctaSubtext: "Evaluamos su infraestructura y proponemos el plan adecuado",
  },

  "audio-voceo": {
    vertical: "audio-voceo",
    title: "Sistemas de Audio y Voceo Profesional",
    subtitle: "Comunicación clara en cualquier entorno. Desde salas de juntas hasta plantas industriales y espacios públicos con miles de personas.",
    heroImage: `${R2}/services/audiovisual.jpg`,
    accentColor: "rose",
    specialistId: "audio-voceo",
    specialistName: "Ing. Marco Reyes",
    specialistRole: "Especialista en Sistemas AV",
    metaTitle: "Sistemas de Audio y Voceo | IAMET — Comunicación Profesional",
    metaDescription: "Instalación de sistemas de audio profesional, voceo IP y comunicación de emergencia. Bosch, TOA, Bose. Cobertura uniforme garantizada.",
    stats: [
      { value: "±3dB", label: "Uniformidad de cobertura" },
      { value: "IP65", label: "Bocinas industriales" },
      { value: "EN54", label: "Norma de emergencia" },
      { value: "+150", label: "Instalaciones" },
    ],
    features: [
      { icon: "Volume2", title: "Voceo IP sobre Red", description: "Sistemas de voceo sobre red IP para múltiples zonas independientes. Integración con telefonía IP y sistemas de emergencia." },
      { icon: "Bell", title: "Comunicación de Emergencia", description: "Sistemas certificados EN54 para evacuación y emergencias. Mensajes pregrabados, tono de alarma y prioridad de zona." },
      { icon: "Music", title: "Música Ambiental", description: "Distribución de música ambiental por zonas con control de volumen independiente. Streaming y fuentes locales." },
      { icon: "Mic", title: "Sistemas de Conferencia", description: "Micrófonos de mesa, sistemas de votación y gestión de turnos para salas de juntas y auditorios." },
      { icon: "Settings", title: "Procesamiento Digital DSP", description: "Procesadores de señal digital para ecualización, delay, limitación de nivel y cancelación de retroalimentación." },
      { icon: "Smartphone", title: "Control por App", description: "Control de zonas, volumen y fuentes desde tablet o smartphone. Programación de horarios y eventos." },
    ],
    useCases: [
      { sector: "Industrial", title: "Planta con 50 zonas de voceo", description: "Sistema de voceo IP con bocinas industriales IP65. Integración con sistema de alarma contra incendio." },
      { sector: "Retail", title: "Centro comercial con 200 bocinas", description: "Música ambiental por zonas, mensajes promocionales programados y sistema de emergencia certificado." },
      { sector: "Educación", title: "Campus universitario", description: "Red de voceo IP para 40 edificios con campanas automáticas, mensajes de emergencia y música ambiental." },
    ],
    faqs: [
      { question: "¿Qué diferencia hay entre voceo analógico e IP?", answer: "El voceo IP usa la red de datos existente para transmitir audio, eliminando el cableado dedicado. Permite gestión centralizada, múltiples zonas independientes y integración con otros sistemas." },
      { question: "¿Cómo garantizan la cobertura uniforme?", answer: "Realizamos simulaciones acústicas con software especializado antes de la instalación. Calculamos la posición y tipo de bocina para lograr ±3dB de uniformidad en todo el espacio." },
      { question: "¿El sistema funciona durante una emergencia eléctrica?", answer: "Los sistemas de emergencia incluyen UPS y baterías de respaldo. El sistema de voceo de emergencia debe operar mínimo 30 minutos sin energía según norma EN54." },
      { question: "¿Pueden integrar con el sistema de alarma?", answer: "Sí. Integramos el sistema de voceo con centrales de alarma contra incendio para activar automáticamente mensajes de evacuación y tonos de alerta por zona." },
    ],
    ctaText: "Solicitar diseño acústico",
    ctaSubtext: "Simulamos la cobertura de su espacio sin costo",
  },

  "salas-juntas": {
    vertical: "salas-juntas",
    title: "Salas de Juntas y Espacios de Colaboración",
    subtitle: "Tecnología que hace que las reuniones sean más productivas. Videoconferencia 4K, audio cristalino y control intuitivo desde cualquier dispositivo.",
    heroImage: `${R2}/services/audiovisual.jpg`,
    accentColor: "sky",
    specialistId: "salas-juntas",
    specialistName: "Ing. Marco Reyes",
    specialistRole: "Especialista en Salas de Colaboración",
    metaTitle: "Salas de Juntas Tecnológicas | IAMET — Videoconferencia y AV",
    metaDescription: "Integración de tecnología AV para salas de juntas: videoconferencia 4K, pantallas interactivas, audio profesional y control centralizado. Teams, Zoom, Webex.",
    stats: [
      { value: "4K", label: "Videoconferencia" },
      { value: "Teams/Zoom", label: "Plataformas" },
      { value: "< 30s", label: "Inicio de reunión" },
      { value: "+200", label: "Salas integradas" },
    ],
    features: [
      { icon: "Video", title: "Videoconferencia 4K", description: "Cámaras PTZ 4K con seguimiento automático del orador. Compatible con Teams, Zoom, Webex y Google Meet." },
      { icon: "Monitor", title: "Pantallas Interactivas", description: "Pantallas táctiles 4K de 65\" a 98\" con pizarrón digital, anotaciones y colaboración en tiempo real." },
      { icon: "Mic", title: "Audio Profesional", description: "Micrófonos de techo o mesa con cancelación de eco y ruido. Audio claro para todos los participantes locales y remotos." },
      { icon: "Smartphone", title: "Control Centralizado", description: "Panel táctil o app móvil para controlar todos los dispositivos: pantallas, cámara, audio, persianas y climatización." },
      { icon: "Wifi", title: "Presentación Inalámbrica", description: "Compartir pantalla desde cualquier dispositivo sin cables ni instalación de software. Hasta 4 fuentes simultáneas." },
      { icon: "Calendar", title: "Reserva de Salas", description: "Pantalla exterior con disponibilidad en tiempo real. Integración con Exchange, Google Calendar y Microsoft 365." },
    ],
    useCases: [
      { sector: "Corporativo", title: "Torre de oficinas con 20 salas", description: "Estandarización de 20 salas con tecnología Teams Rooms. Gestión centralizada y soporte remoto." },
      { sector: "Educación", title: "Aulas híbridas universitarias", description: "Aulas con cámara de seguimiento automático, micrófonos de techo y pantalla interactiva para clases híbridas." },
      { sector: "Gobierno", title: "Sala de crisis y videoconferencia", description: "Sala de situaciones con múltiples pantallas, videoconferencia segura y sistema de presentación para directivos." },
    ],
    faqs: [
      { question: "¿Qué plataformas de videoconferencia soportan?", answer: "Integramos con Microsoft Teams, Zoom, Webex, Google Meet y cualquier plataforma que use el estándar SIP/H.323. También podemos instalar dispositivos certificados para Teams Rooms o Zoom Rooms." },
      { question: "¿Cuánto tiempo toma instalar una sala?", answer: "Una sala estándar (pantalla + cámara + audio + control) toma 1-2 días de instalación. Proyectos con múltiples salas se planifican para minimizar la interrupción." },
      { question: "¿Qué pasa si la tecnología falla durante una reunión?", answer: "Diseñamos los sistemas con redundancia y modos de respaldo. Además, ofrecemos soporte remoto para resolver problemas en minutos sin necesidad de visita presencial." },
      { question: "¿Pueden integrar con el sistema de reservas existente?", answer: "Sí. Integramos con Exchange, Google Calendar, Microsoft 365 y sistemas de reservas como Robin, Condeco o EMS." },
    ],
    ctaText: "Solicitar diseño de sala",
    ctaSubtext: "Le mostramos cómo quedaría su sala con tecnología IAMET",
  },

  "automatizacion": {
    vertical: "automatizacion",
    title: "Automatización Industrial e IoT",
    subtitle: "Conecte sus máquinas, procesos y sistemas. Desde PLCs y SCADA hasta plataformas IIoT que convierten datos de planta en decisiones de negocio.",
    heroImage: `${R2}/services/proyectos.jpg`,
    accentColor: "yellow",
    specialistId: "automatizacion",
    specialistName: "Ing. Luis Hernández",
    specialistRole: "Especialista en Automatización e IIoT",
    metaTitle: "Automatización Industrial e IIoT | IAMET — SCADA y PLCs",
    metaDescription: "Soluciones de automatización industrial: PLCs, SCADA, HMI, IIoT y conectividad OT. Integración con ERP y sistemas de gestión. Siemens, Allen-Bradley, Schneider.",
    stats: [
      { value: "OEE +15%", label: "Mejora promedio" },
      { value: "< 1ms", label: "Latencia OT" },
      { value: "IEC 62443", label: "Seguridad OT" },
      { value: "+80", label: "Plantas conectadas" },
    ],
    features: [
      { icon: "Cpu", title: "PLCs y Controladores", description: "Programación y puesta en marcha de PLCs Siemens, Allen-Bradley, Schneider y Mitsubishi. IEC 61131-3." },
      { icon: "Monitor", title: "SCADA y HMI", description: "Sistemas SCADA con visualización en tiempo real, alarmas, tendencias e historial de proceso." },
      { icon: "Wifi", title: "IIoT y Conectividad", description: "Gateways industriales para conectar equipos legacy a plataformas IIoT: AWS IoT, Azure IoT Hub, Ignition." },
      { icon: "BarChart", title: "Analítica de Proceso", description: "Dashboards de OEE, análisis de paradas, predicción de fallos y optimización de parámetros de proceso." },
      { icon: "Shield", title: "Ciberseguridad OT", description: "Segmentación de red OT/IT, monitoreo de activos industriales y cumplimiento con IEC 62443." },
      { icon: "Link", title: "Integración con ERP/MES", description: "Conectores para SAP, Oracle y MES propios. Datos de planta en tiempo real para planificación y trazabilidad." },
    ],
    useCases: [
      { sector: "Alimentos", title: "Línea de envasado automatizada", description: "Automatización de línea con PLC Siemens, SCADA y control de calidad por visión. Aumento de OEE del 18%." },
      { sector: "Química", title: "Planta de procesos continuos", description: "SCADA con 2,000 tags, control de reactores y sistema de gestión de alarmas según ISA-18.2." },
      { sector: "Automotriz", title: "Conectividad IIoT para 500 máquinas", description: "Gateways IIoT para conectar tornos, fresadoras y robots a plataforma de analítica. Mantenimiento predictivo." },
    ],
    faqs: [
      { question: "¿Pueden conectar equipos antiguos sin PLC?", answer: "Sí. Usamos gateways industriales con protocolos seriales (RS-232, RS-485, Modbus RTU) para conectar equipos legacy a redes modernas. También instalamos sensores IoT para capturar datos de máquinas sin electrónica." },
      { question: "¿Qué es OEE y cómo lo mejoran?", answer: "OEE (Overall Equipment Effectiveness) mide la eficiencia real de una máquina considerando disponibilidad, rendimiento y calidad. Lo mejoramos identificando las principales causas de pérdida con datos en tiempo real." },
      { question: "¿Cómo protegen los sistemas OT de ciberataques?", answer: "Implementamos segmentación de red con firewall industrial, monitoreo de activos OT, gestión de parches y cumplimiento con IEC 62443. La seguridad OT requiere un enfoque diferente al IT tradicional." },
      { question: "¿Cuánto tiempo toma un proyecto de automatización?", answer: "Un proyecto de automatización de una línea toma 2-4 meses. La integración IIoT de máquinas existentes puede hacerse en 4-8 semanas. Trabajamos en fases para minimizar paros de producción." },
    ],
    ctaText: "Solicitar diagnóstico de planta",
    ctaSubtext: "Identificamos oportunidades de automatización sin costo",
  },

  "fabricantes": {
    vertical: "fabricantes",
    title: "Soluciones por Fabricante Líder",
    subtitle: "Partners certificados de los principales fabricantes de tecnología. Le ayudamos a seleccionar, adquirir e implementar la solución correcta para su empresa.",
    heroImage: `${R2}/services/proyectos.jpg`,
    accentColor: "gray",
    specialistId: "fabricantes",
    specialistName: "Ing. Álvaro Rivera",
    specialistRole: "Especialista en Preventa",
    metaTitle: "Partners Certificados | IAMET — Cisco, Hikvision, Panduit y más",
    metaDescription: "Partners certificados de Cisco, Hikvision, Panduit, Bosch, Zebra, Microsoft y más. Asesoría, suministro e implementación de soluciones tecnológicas en México.",
    stats: [
      { value: "+20", label: "Fabricantes partners" },
      { value: "Gold", label: "Nivel de partnership" },
      { value: "48h", label: "Cotización técnica" },
      { value: "15 años", label: "En el mercado" },
    ],
    features: [
      { icon: "Award", title: "Cisco — Redes y Seguridad", description: "Partner certificado Cisco. Switching, routing, wireless, firewall y colaboración. Licencias Smart Net y EA." },
      { icon: "Camera", title: "Hikvision / Dahua — CCTV", description: "Distribuidor autorizado. Cámaras IP, NVR, control de acceso y analítica de video. Stock disponible." },
      { icon: "Cable", title: "Panduit / Commscope — Cableado", description: "Instalador certificado. Cableado Cat6A, fibra óptica, racks y centros de cableado con garantía de fabricante." },
      { icon: "Tag", title: "Zebra Technologies — RFID", description: "Partner Zebra. Lectores RFID, impresoras de etiquetas, terminales móviles y software de gestión." },
      { icon: "Volume2", title: "Bosch / TOA — Audio", description: "Integrador certificado. Sistemas de voceo, conferencia, detección de incendio y seguridad perimetral." },
      { icon: "Cloud", title: "Microsoft / AWS / Azure", description: "Partners de nube. Licencias, implementación y gestión de servicios en la nube para empresas." },
    ],
    useCases: [
      { sector: "Corporativo", title: "Renovación tecnológica integral", description: "Reemplazo de infraestructura obsoleta con soluciones Cisco + Panduit + Hikvision. Proyecto llave en mano." },
      { sector: "Retail", title: "Expansión de cadena", description: "Suministro e instalación de tecnología estandarizada para 15 nuevas tiendas en 3 meses." },
      { sector: "Manufactura", title: "Actualización de red OT", description: "Migración de red industrial a Cisco IE con segmentación OT/IT y switches industriales." },
    ],
    faqs: [
      { question: "¿Por qué comprar con IAMET y no directamente con el fabricante?", answer: "Como partner certificado, tenemos acceso a precios especiales, soporte técnico pre y post-venta, y la capacidad de integrar productos de múltiples fabricantes en una solución coherente. Además, nos responsabilizamos de la implementación." },
      { question: "¿Tienen stock disponible?", answer: "Sí. Mantenemos stock de los productos más demandados. Para proyectos grandes, coordinamos con el fabricante para garantizar disponibilidad y tiempos de entrega." },
      { question: "¿Pueden hacer comparativos entre fabricantes?", answer: "Sí. Uno de nuestros servicios de preventa es el análisis comparativo técnico-económico entre fabricantes para ayudarle a tomar la mejor decisión según sus requerimientos y presupuesto." },
      { question: "¿Ofrecen financiamiento?", answer: "Trabajamos con esquemas de financiamiento a través de los programas de los fabricantes y de instituciones financieras. Podemos estructurar pagos mensuales para proyectos de inversión." },
    ],
    ctaText: "Solicitar cotización técnica",
    ctaSubtext: "Comparativo técnico-económico en 48 horas",
  },
};

export const LANDING_SLUGS = Object.keys(LANDINGS);

export function getLanding(slug: string): LandingConfig | null {
  return LANDINGS[slug] ?? null;
}
