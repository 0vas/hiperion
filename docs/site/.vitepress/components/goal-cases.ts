/** Illustrative GoalExplorer cases — simulation only, not live execution. */

export type NodeKind =
  | 'start'
  | 'agent'
  | 'human'
  | 'exclusive'
  | 'parallelSplit'
  | 'parallelJoin'
  | 'end';

export type BranchId = 'A' | 'B' | 'always';

export type GoalNode = {
  id: string;
  kind: NodeKind;
  es: string;
  en: string;
};

export type GoalEdge = {
  from: string;
  to: string;
  branch?: BranchId;
};

export type GoalChoice = {
  branch: 'A' | 'B';
  es: { label: string; output: string };
  en: { label: string; output: string };
};

export type GoalLocale = {
  title: string;
  summary: string;
  prompt: string;
  question: string;
  requires: string;
  gatewayLabel: string;
  gatewayLabelA?: string;
  gatewayLabelB?: string;
};

export type GoalCase = {
  icon: string;
  topology:
    | 'exclusive-mid'
    | 'linear-decision'
    | 'exclusive-asymmetric'
    | 'parallel-or-sequence';
  es: GoalLocale;
  en: GoalLocale;
  nodes: GoalNode[];
  edges: GoalEdge[];
  /** parallel-or-sequence: graph after choice A (stages) */
  sequenceNodes?: GoalNode[];
  sequenceEdges?: GoalEdge[];
  /** parallel-or-sequence: graph after choice B (parallel) */
  parallelNodes?: GoalNode[];
  parallelEdges?: GoalEdge[];
  choices: GoalChoice[];
};

export const goalCases: GoalCase[] = [
  {
    icon: 'flow',
    topology: 'exclusive-mid',
    es: {
      title: 'Construir',
      summary:
        'De una idea a una funcionalidad revisada — el alcance elige la rama.',
      prompt: 'Usa Hyperion para añadir un buscador a mi proyecto.',
      question: '¿Qué debería buscar el ejemplo?',
      requires:
        'Agente con acceso al repositorio y capacidad para ejecutar tests.',
      gatewayLabel: 'Exclusiva (una rama)',
    },
    en: {
      title: 'Build',
      summary: 'From an idea to a reviewed feature — scope picks the branch.',
      prompt: 'Use Hyperion to add search to my project.',
      question: 'What should the example search cover?',
      requires: 'An agent with repository access and the ability to run tests.',
      gatewayLabel: 'Exclusive (one branch)',
    },
    nodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'clarify',
        kind: 'agent',
        es: 'Aclarar objetivo',
        en: 'Clarify goal',
      },
      {
        id: 'gw_scope',
        kind: 'exclusive',
        es: '¿Alcance?',
        en: 'Scope?',
      },
      {
        id: 'impl_titles',
        kind: 'agent',
        es: 'Implementar búsqueda en títulos',
        en: 'Implement title search',
      },
      {
        id: 'impl_full',
        kind: 'agent',
        es: 'Implementar búsqueda amplia',
        en: 'Implement broader search',
      },
      { id: 'review', kind: 'human', es: 'Revisar', en: 'Review' },
      { id: 'end', kind: 'end', es: 'Fin', en: 'End' },
    ],
    edges: [
      { from: 'start', to: 'clarify' },
      { from: 'clarify', to: 'gw_scope' },
      { from: 'gw_scope', to: 'impl_titles', branch: 'A' },
      { from: 'gw_scope', to: 'impl_full', branch: 'B' },
      { from: 'impl_titles', to: 'review', branch: 'A' },
      { from: 'impl_full', to: 'review', branch: 'B' },
      { from: 'review', to: 'end' },
    ],
    choices: [
      {
        branch: 'A',
        es: {
          label: 'Solo títulos',
          output:
            'Rama: títulos. El plan ilustrativo sigue tests de coincidencia y tu revisión.',
        },
        en: {
          label: 'Titles only',
          output:
            'Branch: titles. The illustrative plan follows match tests and your review.',
        },
      },
      {
        branch: 'B',
        es: {
          label: 'Títulos y contenido',
          output:
            'Rama: títulos y contenido. El plan añade tests de relevancia y tu revisión.',
        },
        en: {
          label: 'Titles and content',
          output:
            'Branch: titles and content. The plan adds relevance tests and your review.',
        },
      },
    ],
  },
  {
    icon: 'eye',
    topology: 'exclusive-mid',
    es: {
      title: 'Investigar',
      summary: 'Compara alternativas; el criterio abre un camino distinto.',
      prompt:
        'Usa Hyperion para comparar herramientas de gestión de proyectos para mi equipo.',
      question: '¿Qué priorizarías en esta comparación?',
      requires: 'Agente con navegación o fuentes proporcionadas por ti.',
      gatewayLabel: 'Exclusiva (una rama)',
    },
    en: {
      title: 'Research',
      summary: 'Compare alternatives; the criterion opens a different path.',
      prompt: 'Use Hyperion to compare project management tools for my team.',
      question: 'What would you prioritize in this comparison?',
      requires: 'An agent with browsing or sources you provide.',
      gatewayLabel: 'Exclusive (one branch)',
    },
    nodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'define',
        kind: 'agent',
        es: 'Definir necesidad',
        en: 'Define the need',
      },
      {
        id: 'gw_criterion',
        kind: 'exclusive',
        es: '¿Criterio?',
        en: 'Criterion?',
      },
      {
        id: 'cmp_use',
        kind: 'agent',
        es: 'Comparar por uso',
        en: 'Compare onboarding and daily use',
      },
      {
        id: 'cmp_int',
        kind: 'agent',
        es: 'Comparar integraciones',
        en: 'Compare compatibility',
      },
      {
        id: 'review',
        kind: 'human',
        es: 'Revisar evidencia',
        en: 'Review evidence',
      },
      { id: 'end', kind: 'end', es: 'Fin', en: 'End' },
    ],
    edges: [
      { from: 'start', to: 'define' },
      { from: 'define', to: 'gw_criterion' },
      { from: 'gw_criterion', to: 'cmp_use', branch: 'A' },
      { from: 'gw_criterion', to: 'cmp_int', branch: 'B' },
      { from: 'cmp_use', to: 'review', branch: 'A' },
      { from: 'cmp_int', to: 'review', branch: 'B' },
      { from: 'review', to: 'end' },
    ],
    choices: [
      {
        branch: 'A',
        es: {
          label: 'Facilidad de uso',
          output:
            'Rama: facilidad de uso. La comparación ilustrativa se centra en incorporación y tareas habituales.',
        },
        en: {
          label: 'Ease of use',
          output:
            'Branch: ease of use. The illustrative comparison focuses on onboarding and everyday tasks.',
        },
      },
      {
        branch: 'B',
        es: {
          label: 'Integraciones',
          output:
            'Rama: integraciones. La comparación revisa compatibilidad y fuentes.',
        },
        en: {
          label: 'Integrations',
          output:
            'Branch: integrations. The comparison checks compatibility and sources.',
        },
      },
    ],
  },
  {
    icon: 'chat',
    topology: 'linear-decision',
    es: {
      title: 'Crear',
      summary:
        'Das forma al contenido en un recorrido lineal con tu visto bueno.',
      prompt:
        'Usa Hyperion para preparar una guía de bienvenida a mi proyecto.',
      question: '¿Para quién sería esta guía de ejemplo?',
      requires:
        'Contexto del proyecto y un agente capaz de redactar. Publicar requiere una acción aparte.',
      gatewayLabel: 'Decisión humana',
    },
    en: {
      title: 'Create',
      summary: 'You shape the content on a linear path with your approval.',
      prompt: 'Use Hyperion to prepare a welcome guide for my project.',
      question: 'Who is this sample guide for?',
      requires:
        'Project context and an agent that can write. Publishing is a separate action.',
      gatewayLabel: 'Human decision',
    },
    nodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'context',
        kind: 'agent',
        es: 'Recoger contexto',
        en: 'Gather context',
      },
      {
        id: 'audience',
        kind: 'human',
        es: 'Destinatario',
        en: 'Audience',
      },
      {
        id: 'draft',
        kind: 'agent',
        es: 'Preparar borrador',
        en: 'Prepare a draft',
      },
      {
        id: 'review',
        kind: 'human',
        es: 'Revisar contenido',
        en: 'Review content',
      },
      { id: 'end', kind: 'end', es: 'Fin', en: 'End' },
    ],
    edges: [
      { from: 'start', to: 'context' },
      { from: 'context', to: 'audience' },
      { from: 'audience', to: 'draft' },
      { from: 'draft', to: 'review' },
      { from: 'review', to: 'end' },
    ],
    choices: [
      {
        branch: 'A',
        es: {
          label: 'Equipo técnico',
          output:
            'Destinatario: equipo técnico. El borrador ilustrativo cubre entorno, arquitectura y primera contribución.',
        },
        en: {
          label: 'Technical team',
          output:
            'Audience: technical team. The illustrative draft covers setup, architecture and a first contribution.',
        },
      },
      {
        branch: 'B',
        es: {
          label: 'Clientes',
          output:
            'Destinatario: clientes. El borrador ilustrativo cubre primeros pasos, funciones y ayuda.',
        },
        en: {
          label: 'Customers',
          output:
            'Audience: customers. The illustrative draft covers getting started, features and help.',
        },
      },
    ],
  },
  {
    icon: 'data',
    topology: 'exclusive-mid',
    es: {
      title: 'Analizar',
      summary:
        'Los datos se validan una vez; el enfoque elige cómo se analizan.',
      prompt:
        'Usa Hyperion para analizar este archivo de ventas y preparar un informe.',
      question: '¿Qué explorarías primero?',
      requires:
        'Archivo o fuente de datos y herramientas de análisis disponibles para el agente.',
      gatewayLabel: 'Exclusiva (una rama)',
    },
    en: {
      title: 'Analyze',
      summary: 'Data is validated once; focus chooses how it is analyzed.',
      prompt: 'Use Hyperion to analyze this sales file and prepare a report.',
      question: 'What would you explore first?',
      requires:
        'A data file or source and analysis tools available to the agent.',
      gatewayLabel: 'Exclusive (one branch)',
    },
    nodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'validate',
        kind: 'agent',
        es: 'Validar datos',
        en: 'Validate data',
      },
      {
        id: 'gw_focus',
        kind: 'exclusive',
        es: '¿Enfoque?',
        en: 'Focus?',
      },
      {
        id: 'by_month',
        kind: 'agent',
        es: 'Evolución mensual',
        en: 'Analyze by month',
      },
      {
        id: 'by_product',
        kind: 'agent',
        es: 'Rendimiento producto',
        en: 'Compare products',
      },
      {
        id: 'review',
        kind: 'human',
        es: 'Revisar conclusiones',
        en: 'Review conclusions',
      },
      { id: 'end', kind: 'end', es: 'Fin', en: 'End' },
    ],
    edges: [
      { from: 'start', to: 'validate' },
      { from: 'validate', to: 'gw_focus' },
      { from: 'gw_focus', to: 'by_month', branch: 'A' },
      { from: 'gw_focus', to: 'by_product', branch: 'B' },
      { from: 'by_month', to: 'review', branch: 'A' },
      { from: 'by_product', to: 'review', branch: 'B' },
      { from: 'review', to: 'end' },
    ],
    choices: [
      {
        branch: 'A',
        es: {
          label: 'Evolución mensual',
          output:
            'Rama: evolución mensual. El plan ilustrativo agrupa por mes y señala periodos incompletos.',
        },
        en: {
          label: 'Monthly trends',
          output:
            'Branch: monthly trends. The illustrative plan groups by month and flags incomplete periods.',
        },
      },
      {
        branch: 'B',
        es: {
          label: 'Rendimiento por producto',
          output:
            'Rama: productos. El plan compara ventas por producto y marca datos ausentes.',
        },
        en: {
          label: 'Product performance',
          output:
            'Branch: products. The plan compares sales by product and flags missing data.',
        },
      },
    ],
  },
  {
    icon: 'reset',
    topology: 'exclusive-asymmetric',
    es: {
      title: 'Operar',
      summary:
        'Investigas una incidencia; el alcance puede cerrar o pedir tu revisión.',
      prompt:
        'Usa Hyperion para investigar por qué mi aplicación falla al iniciar.',
      question: '¿Qué alcance darías a esta investigación?',
      requires:
        'Acceso a logs y al entorno autorizado. El agente debe verificar el estado antes de reintentar.',
      gatewayLabel: 'Exclusiva (una rama)',
    },
    en: {
      title: 'Operate',
      summary:
        'You investigate an incident; scope may stop or ask for your review.',
      prompt: 'Use Hyperion to investigate why my application fails to start.',
      question: 'What scope would you give this investigation?',
      requires:
        'Access to logs and an authorized environment. The agent must check state before retrying.',
      gatewayLabel: 'Exclusive (one branch)',
    },
    nodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'symptoms',
        kind: 'agent',
        es: 'Recoger síntomas',
        en: 'Gather symptoms',
      },
      {
        id: 'gw_scope',
        kind: 'exclusive',
        es: '¿Alcance?',
        en: 'Scope?',
      },
      {
        id: 'diagnose',
        kind: 'agent',
        es: 'Documentar diagnóstico',
        en: 'Document hypotheses',
      },
      {
        id: 'end_diag',
        kind: 'end',
        es: 'Fin',
        en: 'End',
      },
      {
        id: 'fix',
        kind: 'agent',
        es: 'Preparar corrección',
        en: 'Prepare a fix',
      },
      {
        id: 'review',
        kind: 'human',
        es: 'Revisar propuesta',
        en: 'Review proposal',
      },
      { id: 'end_fix', kind: 'end', es: 'Fin', en: 'End' },
    ],
    edges: [
      { from: 'start', to: 'symptoms' },
      { from: 'symptoms', to: 'gw_scope' },
      { from: 'gw_scope', to: 'diagnose', branch: 'A' },
      { from: 'diagnose', to: 'end_diag', branch: 'A' },
      { from: 'gw_scope', to: 'fix', branch: 'B' },
      { from: 'fix', to: 'review', branch: 'B' },
      { from: 'review', to: 'end_fix', branch: 'B' },
    ],
    choices: [
      {
        branch: 'A',
        es: {
          label: 'Solo diagnóstico',
          output:
            'Rama corta: solo diagnóstico. El plan ilustrativo termina con evidencia, sin aplicar cambios.',
        },
        en: {
          label: 'Diagnosis only',
          output:
            'Short branch: diagnosis only. The illustrative plan ends with evidence, without applying changes.',
        },
      },
      {
        branch: 'B',
        es: {
          label: 'Proponer una corrección',
          output:
            'Rama larga: proponer corrección. Incluye tu revisión humana antes de cualquier cambio.',
        },
        en: {
          label: 'Propose a fix',
          output:
            'Long branch: propose a fix. Includes your human review before any change.',
        },
      },
    ],
  },
  {
    icon: 'connect',
    topology: 'parallel-or-sequence',
    es: {
      title: 'Coordinar',
      summary: 'Reúne revisiones en serie o en paralelo antes de decidir.',
      prompt:
        'Usa Hyperion para coordinar una revisión de código, pruebas y documentación de mi proyecto.',
      question: '¿Cómo organizarías esta revisión?',
      requires:
        'Un coordinador y herramientas que permitan delegación. El paralelismo del proceso no implica que Hyperion arranque varios modelos por su cuenta.',
      gatewayLabel: 'Elige organización',
      gatewayLabelA: 'Secuencia',
      gatewayLabelB: 'Paralela (se reúne)',
    },
    en: {
      title: 'Coordinate',
      summary:
        'Bring reviews together in series or in parallel before you decide.',
      prompt:
        "Use Hyperion to coordinate a review of my project's code, tests and documentation.",
      question: 'How would you organize this review?',
      requires:
        'A coordinator and tools that support delegation. Process parallelism does not mean Hyperion starts several models on its own.',
      gatewayLabel: 'Choose organization',
      gatewayLabelA: 'Sequence',
      gatewayLabelB: 'Parallel (then join)',
    },
    nodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'define',
        kind: 'agent',
        es: 'Definir entregables',
        en: 'Define deliverables',
      },
      {
        id: 'gw_org',
        kind: 'exclusive',
        es: '¿Organización?',
        en: 'Organization?',
      },
    ],
    edges: [
      { from: 'start', to: 'define' },
      { from: 'define', to: 'gw_org' },
    ],
    sequenceNodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'define',
        kind: 'agent',
        es: 'Definir entregables',
        en: 'Define deliverables',
      },
      {
        id: 'rev_code',
        kind: 'agent',
        es: 'Revisar código',
        en: 'Review code',
      },
      {
        id: 'rev_tests',
        kind: 'agent',
        es: 'Revisar pruebas',
        en: 'Review tests',
      },
      {
        id: 'rev_docs',
        kind: 'agent',
        es: 'Revisar docs',
        en: 'Review docs',
      },
      {
        id: 'resolve',
        kind: 'human',
        es: 'Resolver hallazgos',
        en: 'Resolve findings',
      },
      { id: 'end', kind: 'end', es: 'Fin', en: 'End' },
    ],
    sequenceEdges: [
      { from: 'start', to: 'define' },
      { from: 'define', to: 'rev_code' },
      { from: 'rev_code', to: 'rev_tests' },
      { from: 'rev_tests', to: 'rev_docs' },
      { from: 'rev_docs', to: 'resolve' },
      { from: 'resolve', to: 'end' },
    ],
    parallelNodes: [
      { id: 'start', kind: 'start', es: 'Inicio', en: 'Start' },
      {
        id: 'define',
        kind: 'agent',
        es: 'Definir entregables',
        en: 'Define deliverables',
      },
      {
        id: 'split',
        kind: 'parallelSplit',
        es: 'Paralela',
        en: 'Split',
      },
      {
        id: 'rev_code',
        kind: 'agent',
        es: 'Código',
        en: 'Code',
      },
      {
        id: 'rev_tests',
        kind: 'agent',
        es: 'Pruebas',
        en: 'Tests',
      },
      {
        id: 'rev_docs',
        kind: 'agent',
        es: 'Docs',
        en: 'Docs',
      },
      {
        id: 'join',
        kind: 'parallelJoin',
        es: 'Reunir',
        en: 'Join',
      },
      {
        id: 'resolve',
        kind: 'human',
        es: 'Resolver hallazgos',
        en: 'Resolve findings',
      },
      { id: 'end', kind: 'end', es: 'Fin', en: 'End' },
    ],
    parallelEdges: [
      { from: 'start', to: 'define' },
      { from: 'define', to: 'split' },
      { from: 'split', to: 'rev_code', branch: 'B' },
      { from: 'split', to: 'rev_tests', branch: 'B' },
      { from: 'split', to: 'rev_docs', branch: 'B' },
      { from: 'rev_code', to: 'join', branch: 'B' },
      { from: 'rev_tests', to: 'join', branch: 'B' },
      { from: 'rev_docs', to: 'join', branch: 'B' },
      { from: 'join', to: 'resolve' },
      { from: 'resolve', to: 'end' },
    ],
    choices: [
      {
        branch: 'A',
        es: {
          label: 'Por etapas',
          output:
            'Organización: por etapas. Cada revisión ilustrativa usa el resultado de la anterior.',
        },
        en: {
          label: 'In stages',
          output:
            'Organization: in stages. Each illustrative review uses the previous result.',
        },
      },
      {
        branch: 'B',
        es: {
          label: 'En paralelo',
          output:
            'Organización: en paralelo. Tres revisiones parten del mismo contexto y se reúnen antes de tu decisión.',
        },
        en: {
          label: 'In parallel',
          output:
            'Organization: in parallel. Three reviews share context and join before your decision.',
        },
      },
    ],
  },
];
