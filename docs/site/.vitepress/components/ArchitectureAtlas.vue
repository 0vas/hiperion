<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useData } from 'vitepress';
import DocIcon from './DocIcon.vue';
defineProps<{ kind?: 'journey' | 'deployment' }>();
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const selected = ref(0);
const narrow = ref(false);
let media: MediaQueryList | undefined;
const resize = () => {
  narrow.value = media?.matches ?? false;
};
onMounted(() => {
  media = matchMedia('(max-width: 640px)');
  resize();
  media.addEventListener('change', resize);
});
onUnmounted(() => media?.removeEventListener('change', resize));
const steps = computed(() => [
  {
    label: en.value ? 'Your request' : 'Tu petición',
    owner: en.value ? 'PERSON' : 'PERSONA',
    icon: 'chat',
    detail: en.value
      ? '“Use Hyperion to prepare a welcome guide.” The conversation supplies intent, not a technical specification.'
      : '«Usa Hyperion para preparar una guía de bienvenida». La conversación aporta la intención, sin pedirte una especificación técnica.',
    input: en.value ? 'Goal in the chat' : 'Objetivo en el chat',
    output: 'plan.request',
    tone: 'human',
  },
  {
    label: en.value ? 'An actionable plan' : 'Un plan ejecutable',
    owner: en.value ? 'EXTERNAL AGENT' : 'AGENTE EXTERNO',
    icon: 'flow',
    detail: en.value
      ? 'The agent proposes jobs, steps and typed inputs/outputs. CLI or MCP sends the plan to the same local service.'
      : 'El agente propone trabajos, pasos y entradas/salidas tipadas. CLI o MCP envía el plan al mismo servicio local.',
    input: en.value ? 'Request + context' : 'Petición + contexto',
    output: en.value ? 'Plan + run URL' : 'Plan + URL del run',
    tone: 'agent',
  },
  {
    label: en.value ? 'Process rules' : 'Reglas del proceso',
    owner: 'HYPERION',
    icon: 'connect',
    detail: en.value
      ? 'The engine checks dependencies, roles and required data. Gateways select paths; ready steps may run in parallel.'
      : 'El motor valida dependencias, roles y datos requeridos. Las compuertas seleccionan rutas; los pasos listos pueden avanzar en paralelo.',
    input: en.value ? 'Plan + current state' : 'Plan + estado actual',
    output: en.value ? 'Eligible tasks' : 'Tareas habilitadas',
    tone: 'core',
  },
  {
    label: en.value ? 'Human decision' : 'Decisión humana',
    owner: en.value ? 'PERSON' : 'PERSONA',
    icon: 'user',
    detail: en.value
      ? 'You select the audience on the canvas. The engine validates and saves it; the agent cannot approve on your behalf.'
      : 'Eliges la audiencia en el canvas. El motor valida y guarda la respuesta; el agente no puede aprobar en tu nombre.',
    input: en.value ? 'Audience choices' : 'Opciones de audiencia',
    output: en.value ? 'Selected audience' : 'Audiencia elegida',
    tone: 'human',
  },
  {
    label: en.value ? 'Real work' : 'Trabajo real',
    owner: en.value ? 'EXTERNAL AGENT' : 'AGENTE EXTERNO',
    icon: 'play',
    detail: en.value
      ? 'The agent reads the audience, writes the draft and reports public actions and outputs. The canvas reflects what it reports.'
      : 'El agente lee la audiencia, redacta el borrador y registra acciones públicas y salidas. El canvas refleja lo reportado.',
    input: en.value ? 'Audience + project context' : 'Audiencia + contexto',
    output: en.value ? 'Draft + activity' : 'Borrador + actividad',
    tone: 'agent',
  },
  {
    label: en.value ? 'Verified result' : 'Resultado verificado',
    owner: en.value ? 'PERSON + HYPERION' : 'PERSONA + HYPERION',
    icon: 'check',
    detail: en.value
      ? 'You review the draft. Hyperion retains the decision and reported evidence; publication would need a separate authorized step.'
      : 'Revisas el borrador. Hyperion conserva la decisión y la evidencia reportada; publicar requeriría un paso autorizado aparte.',
    input: en.value ? 'Draft for review' : 'Borrador para revisar',
    output: en.value ? 'Decision + evidence' : 'Decisión + evidencia',
    tone: 'core',
  },
]);
const positions = computed(() =>
  narrow.value
    ? steps.value.map((_, i) => [30, 20 + i * 134])
    : [
        [20, 30],
        [360, 30],
        [700, 30],
        [700, 208],
        [360, 208],
        [20, 208],
      ],
);
const routes = computed(() =>
  positions.value.slice(0, -1).map(([x, y], i) => {
    const [nx, ny] = positions.value[i + 1];
    if (narrow.value || x === nx) return `M${x + 120} ${y + 102}V${ny}`;
    return nx > x
      ? `M${x + 240} ${y + 51}H${nx}`
      : `M${x} ${y + 51}H${nx + 240}`;
  }),
);
const detail = computed(() => steps.value[selected.value]);
</script>

<template>
  <section
    v-if="kind !== 'deployment'"
    class="architecture-atlas"
    :aria-label="en ? 'From request to result' : 'De la petición al resultado'"
  >
    <div class="atlas-caption">
      <span>{{ en ? 'FOLLOW THE IDEA' : 'SIGUE LA IDEA' }}</span
      ><small>{{
        en
          ? 'Select a node · illustrative example'
          : 'Selecciona un nodo · ejemplo ilustrativo'
      }}</small>
    </div>
    <svg
      class="architecture-journey"
      :viewBox="narrow ? '0 0 300 812' : '0 0 960 340'"
      role="group"
      :aria-label="
        en
          ? 'Request, plan, rules, decision, work and result'
          : 'Petición, plan, reglas, decisión, trabajo y resultado'
      "
    >
      <g aria-hidden="true" class="atlas-routes">
        <path v-for="(d, i) in routes" :key="i" :d="d" />
        <circle
          v-for="([x, y], i) in positions.slice(1)"
          :key="i"
          :cx="narrow || i === 2 ? x + 120 : i < 2 ? x : x + 240"
          :cy="narrow || i === 2 ? y : y + 51"
          r="4"
        />
      </g>
      <g
        v-for="(step, i) in steps"
        :key="i"
        :transform="`translate(${positions[i][0]},${positions[i][1]})`"
        class="atlas-node"
        :class="[step.tone, { selected: selected === i }]"
        role="button"
        tabindex="0"
        :aria-label="step.label"
        :aria-pressed="selected === i"
        @click="selected = i"
        @keydown.enter.prevent="selected = i"
        @keydown.space.prevent="selected = i"
      >
        <rect width="240" height="102" rx="16" />
        <text x="20" y="26" class="atlas-owner">{{ step.owner }}</text>
        <text x="20" y="56" class="atlas-label">{{ step.label }}</text>
        <text x="20" y="81" class="atlas-number">
          {{ String(i + 1).padStart(2, '0') }}
        </text>
        <svg x="196" y="62" width="24" height="24">
          <DocIcon :name="step.icon" />
        </svg>
      </g>
    </svg>
    <div class="atlas-inspector" role="status">
      <div>
        <strong><DocIcon :name="detail.icon" />{{ detail.label }}</strong>
        <p>{{ detail.detail }}</p>
      </div>
      <dl>
        <div>
          <dt>{{ en ? 'Input' : 'Entrada' }}</dt>
          <dd>{{ detail.input }}</dd>
        </div>
        <DocIcon name="arrow" />
        <div>
          <dt>{{ en ? 'Output' : 'Salida' }}</dt>
          <dd>{{ detail.output }}</dd>
        </div>
      </dl>
    </div>
  </section>
  <section
    v-else
    class="architecture-atlas architecture-deployment"
    :aria-label="en ? 'Deployment map' : 'Mapa de despliegue'"
  >
    <div class="atlas-local">
      <div class="atlas-caption">
        <span>{{ en ? 'YOUR MACHINE' : 'TU EQUIPO' }}</span
        ><small>{{ en ? 'Local runtime' : 'Runtime local' }}</small>
      </div>
      <div class="atlas-hosts">
        <div class="atlas-host">
          <DocIcon name="chat" /><strong>{{
            en ? 'Your harness' : 'Tu harness'
          }}</strong
          ><small>CLI / MCP</small>
        </div>
        <DocIcon name="data" />
        <div class="atlas-host atlas-engine">
          <DocIcon name="flow" /><strong>Hyperion</strong
          ><small>{{ en ? 'API + engine' : 'API + motor' }}</small
          ><span
            >SQLite · {{ en ? 'state + evidence' : 'estado + evidencia' }}</span
          >
        </div>
        <DocIcon name="data" />
        <div class="atlas-host">
          <DocIcon name="user" /><strong>Canvas</strong
          ><small>Browser / Desktop</small
          ><span>{{
            en ? 'Decisions + live updates' : 'Decisiones + cambios en vivo'
          }}</span>
        </div>
      </div>
    </div>
    <div class="atlas-outside">
      <div>
        <DocIcon name="pause" /><strong>{{
          en ? 'Optional resume connector' : 'Conector de reanudación opcional'
        }}</strong>
        <p>
          {{
            en
              ? 'Queue → I/O worker → real harness session. Native connectors are pending.'
              : 'Cola → worker de IO → sesión real del harness. Los conectores nativos están pendientes.'
          }}
        </p>
      </div>
      <div>
        <DocIcon name="repository" /><strong>GitHub Pages</strong>
        <p>
          {{
            en
              ? 'Documentation + simulations. Separate from the runtime; no workflow execution.'
              : 'Documentación + simulaciones. Separado del runtime; no ejecuta workflows.'
          }}
        </p>
      </div>
    </div>
  </section>
</template>
