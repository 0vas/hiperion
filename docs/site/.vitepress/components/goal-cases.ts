export const goalCases = [
  {
    icon: 'flow',
    es: {
      title: 'Construir',
      summary: 'De una idea a una funcionalidad revisada.',
      prompt: 'Usa Hyperion para añadir un buscador a mi proyecto.',
      steps: [
        'Aclarar objetivo',
        'Elegir alcance',
        'Tests e implementación',
        'Revisar resultado',
      ],
      question: 'En este ejemplo, ¿qué debería buscar?',
      choices: [
        {
          label: 'Títulos',
          next: 'Buscar en títulos',
          output:
            'Alcance: títulos. El plan incluye tests de coincidencias y una revisión del buscador.',
        },
        {
          label: 'Títulos y contenido',
          next: 'Buscar en títulos y contenido',
          output:
            'Alcance: títulos y contenido. El plan añade tests de relevancia y revisión de resultados.',
        },
      ],
      requires:
        'Agente con acceso al repositorio y capacidad para ejecutar tests.',
    },
    en: {
      title: 'Build',
      summary: 'From an idea to a reviewed feature.',
      prompt: 'Use Hyperion to add search to my project.',
      steps: [
        'Clarify the goal',
        'Choose scope',
        'Tests and implementation',
        'Review the result',
      ],
      question: 'In this example, what should search cover?',
      choices: [
        {
          label: 'Titles',
          next: 'Search titles',
          output:
            'Scope: titles. The plan includes matching tests and a search review.',
        },
        {
          label: 'Titles and content',
          next: 'Search titles and content',
          output:
            'Scope: titles and content. The plan adds relevance tests and a results review.',
        },
      ],
      requires: 'An agent with repository access and the ability to run tests.',
    },
  },
  {
    icon: 'eye',
    es: {
      title: 'Investigar',
      summary: 'Compara alternativas con criterios y evidencia.',
      prompt:
        'Usa Hyperion para comparar herramientas de gestión de proyectos para mi equipo.',
      steps: [
        'Definir necesidad',
        'Elegir criterio',
        'Comparar alternativas',
        'Revisar evidencia',
      ],
      question: '¿Qué priorizarías en esta comparación?',
      choices: [
        {
          label: 'Facilidad de uso',
          next: 'Comparar facilidad de uso',
          output:
            'Criterio: facilidad de uso. La comparación se centra en incorporación y tareas habituales.',
        },
        {
          label: 'Integraciones',
          next: 'Comparar integraciones',
          output:
            'Criterio: integraciones. La comparación revisa compatibilidad y fuentes de cada alternativa.',
        },
      ],
      requires: 'Agente con navegación o fuentes proporcionadas por ti.',
    },
    en: {
      title: 'Research',
      summary: 'Compare alternatives using criteria and evidence.',
      prompt: 'Use Hyperion to compare project management tools for my team.',
      steps: [
        'Define the need',
        'Choose a criterion',
        'Compare alternatives',
        'Review evidence',
      ],
      question: 'What would you prioritize in this comparison?',
      choices: [
        {
          label: 'Ease of use',
          next: 'Compare ease of use',
          output:
            'Criterion: ease of use. The comparison focuses on onboarding and everyday tasks.',
        },
        {
          label: 'Integrations',
          next: 'Compare integrations',
          output:
            'Criterion: integrations. The comparison checks compatibility and sources for each option.',
        },
      ],
      requires: 'An agent with browsing or sources you provide.',
    },
  },
  {
    icon: 'chat',
    es: {
      title: 'Crear',
      summary: 'Da forma al contenido antes de aprobarlo.',
      prompt:
        'Usa Hyperion para preparar una guía de bienvenida a mi proyecto.',
      steps: [
        'Recoger contexto',
        'Elegir destinatario',
        'Preparar borrador',
        'Revisar contenido',
      ],
      question: '¿Para quién sería esta guía de ejemplo?',
      choices: [
        {
          label: 'Equipo técnico',
          next: 'Borrador para el equipo',
          output:
            'Destinatario: equipo técnico. El borrador propuesto cubre entorno, arquitectura y primera contribución.',
        },
        {
          label: 'Clientes',
          next: 'Borrador para clientes',
          output:
            'Destinatario: clientes. El borrador propuesto cubre primeros pasos, funciones y ayuda.',
        },
      ],
      requires:
        'Contexto del proyecto y un agente capaz de redactar. Publicar requiere una acción aparte.',
    },
    en: {
      title: 'Create',
      summary: 'Shape the content before approving it.',
      prompt: 'Use Hyperion to prepare a welcome guide for my project.',
      steps: [
        'Gather context',
        'Choose audience',
        'Prepare a draft',
        'Review content',
      ],
      question: 'Who is this sample guide for?',
      choices: [
        {
          label: 'Technical team',
          next: 'Draft for the team',
          output:
            'Audience: technical team. The proposed draft covers setup, architecture and a first contribution.',
        },
        {
          label: 'Customers',
          next: 'Draft for customers',
          output:
            'Audience: customers. The proposed draft covers getting started, features and help.',
        },
      ],
      requires:
        'Project context and an agent that can write. Publishing is a separate action.',
    },
  },
  {
    icon: 'data',
    es: {
      title: 'Analizar',
      summary: 'Convierte datos en conclusiones revisables.',
      prompt:
        'Usa Hyperion para analizar este archivo de ventas y preparar un informe.',
      steps: [
        'Validar datos',
        'Elegir enfoque',
        'Analizar resultados',
        'Revisar conclusiones',
      ],
      question: '¿Qué explorarías primero?',
      choices: [
        {
          label: 'Evolución mensual',
          next: 'Analizar evolución mensual',
          output:
            'Enfoque: evolución mensual. El plan agrupa por mes y comprueba periodos incompletos.',
        },
        {
          label: 'Rendimiento por producto',
          next: 'Comparar productos',
          output:
            'Enfoque: productos. El plan compara ventas por producto y señala datos ausentes.',
        },
      ],
      requires:
        'Archivo o fuente de datos y herramientas de análisis disponibles para el agente.',
    },
    en: {
      title: 'Analyze',
      summary: 'Turn data into conclusions you can review.',
      prompt: 'Use Hyperion to analyze this sales file and prepare a report.',
      steps: [
        'Validate data',
        'Choose a focus',
        'Analyze results',
        'Review conclusions',
      ],
      question: 'What would you explore first?',
      choices: [
        {
          label: 'Monthly trends',
          next: 'Analyze monthly trends',
          output:
            'Focus: monthly trends. The plan groups by month and checks for incomplete periods.',
        },
        {
          label: 'Product performance',
          next: 'Compare products',
          output:
            'Focus: products. The plan compares sales by product and flags missing data.',
        },
      ],
      requires:
        'A data file or source and analysis tools available to the agent.',
    },
  },
  {
    icon: 'reset',
    es: {
      title: 'Operar',
      summary: 'Investiga una incidencia y controla cada acción.',
      prompt:
        'Usa Hyperion para investigar por qué mi aplicación falla al iniciar.',
      steps: [
        'Recoger síntomas',
        'Acordar intervención',
        'Investigar y proponer',
        'Revisar propuesta',
      ],
      question: '¿Qué alcance darías a esta investigación?',
      choices: [
        {
          label: 'Solo diagnóstico',
          next: 'Documentar diagnóstico',
          output:
            'Alcance: diagnóstico. El plan termina con hipótesis y evidencia, sin aplicar cambios.',
        },
        {
          label: 'Proponer una corrección',
          next: 'Preparar corrección',
          output:
            'Alcance: proponer una corrección. El plan incluye una revisión humana antes de aplicarla.',
        },
      ],
      requires:
        'Acceso a logs y al entorno autorizado. El agente debe verificar el estado antes de reintentar.',
    },
    en: {
      title: 'Operate',
      summary: 'Investigate an incident and control each action.',
      prompt: 'Use Hyperion to investigate why my application fails to start.',
      steps: [
        'Gather symptoms',
        'Agree on scope',
        'Investigate and propose',
        'Review the proposal',
      ],
      question: 'What scope would you give this investigation?',
      choices: [
        {
          label: 'Diagnosis only',
          next: 'Document diagnosis',
          output:
            'Scope: diagnosis. The plan ends with hypotheses and evidence, without applying changes.',
        },
        {
          label: 'Propose a fix',
          next: 'Prepare a fix',
          output:
            'Scope: propose a fix. The plan includes human review before applying it.',
        },
      ],
      requires:
        'Access to logs and an authorized environment. The agent must check state before retrying.',
    },
  },
  {
    icon: 'connect',
    es: {
      title: 'Coordinar',
      summary: 'Reúne trabajo paralelo en una decisión compartida.',
      prompt:
        'Usa Hyperion para coordinar una revisión de código, pruebas y documentación de mi proyecto.',
      steps: [
        'Definir entregables',
        'Elegir organización',
        'Reunir revisiones',
        'Resolver hallazgos',
      ],
      question: '¿Cómo organizarías esta revisión?',
      choices: [
        {
          label: 'Por etapas',
          next: 'Revisiones por etapas',
          output:
            'Organización: por etapas. Cada revisión utiliza los resultados de la anterior.',
        },
        {
          label: 'En paralelo',
          next: 'Revisiones en paralelo',
          output:
            'Organización: en paralelo. Las revisiones parten del mismo contexto y se reúnen antes de decidir.',
        },
      ],
      requires:
        'Un coordinador y herramientas que permitan delegación. La ejecución paralela depende del agente.',
    },
    en: {
      title: 'Coordinate',
      summary: 'Bring parallel work into a shared decision.',
      prompt:
        'Use Hyperion to coordinate a review of my project’s code, tests and documentation.',
      steps: [
        'Define deliverables',
        'Choose organization',
        'Gather reviews',
        'Resolve findings',
      ],
      question: 'How would you organize this review?',
      choices: [
        {
          label: 'In stages',
          next: 'Reviews in stages',
          output:
            'Organization: in stages. Each review uses results from the previous one.',
        },
        {
          label: 'In parallel',
          next: 'Reviews in parallel',
          output:
            'Organization: in parallel. Reviews share the same starting context and join before a decision.',
        },
      ],
      requires:
        'A coordinator and tools that support delegation. Parallel execution depends on the agent.',
    },
  },
];
