<script setup lang="ts">
import { computed, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
import ProductCanvas from './ProductCanvas.vue';
const props = withDefaults(
  defineProps<{ kind?: 'canvas' | 'resume' | 'architecture' }>(),
  { kind: 'canvas' },
);
const { lang } = useData();
const selected = ref(0);
const en = computed(() => lang.value !== 'es');
const content = computed(() => {
  const copy = {
    canvas: {
      title: en.value
        ? 'Read a task at a glance'
        : 'Lee una tarea de un vistazo',
      steps: en.value
        ? [
            [
              'data',
              'Inputs',
              'What does this task receive?',
              'Context and outputs from completed tasks become inputs. Open I/O to see their values before deciding.',
            ],
            [
              'user',
              'Your turn',
              'One question, one decision',
              'An amber task needs you. Open it, answer the specific question and save. Your decision becomes part of the workflow.',
            ],
            [
              'logs',
              'Evidence',
              'See what actually happened',
              'I/O holds results. Logs show public actions and observations sent by the agent. Animation alone does not prove that work is running.',
            ],
          ]
        : [
            [
              'data',
              'Entradas',
              '¿Qué recibe esta tarea?',
              'El contexto y las salidas de tareas completadas alimentan este paso. Abre I/O para consultar sus valores antes de decidir.',
            ],
            [
              'user',
              'Tu turno',
              'Una pregunta, una decisión',
              'Una tarea ámbar te necesita. Ábrela, responde la pregunta y guarda. Tu decisión pasa a formar parte del flujo.',
            ],
            [
              'logs',
              'Evidencia',
              'Mira lo que realmente ocurrió',
              'I/O conserva los resultados. Logs muestra las acciones y observaciones públicas enviadas por el agente. La animación por sí sola no demuestra ejecución.',
            ],
          ],
    },
    resume: {
      title: en.value
        ? 'Your answer stays in the workflow'
        : 'Tu respuesta permanece en el flujo',
      steps: en.value
        ? [
            [
              'user',
              'You answer',
              'Saved before continuing',
              'Hyperion records the answer and enables dependent tasks. You do not need to repeat the same decision.',
            ],
            [
              'pause',
              'State persists',
              'A pause keeps the context',
              'Core 0.5 can keep a continuation request in its durable queue. This infrastructure is separate from the agent that performs the work.',
            ],
            [
              'connect',
              'Agent resumes',
              'The connector makes the difference',
              'Native resume connectors are still pending. Today, an active tool wait can continue; after the chat ends, send the saved continuation in that chat.',
            ],
          ]
        : [
            [
              'user',
              'Respondes',
              'Se guarda antes de continuar',
              'Hyperion registra la respuesta y habilita las tareas dependientes. No necesitas repetir la misma decisión.',
            ],
            [
              'pause',
              'Se conserva',
              'Una pausa mantiene el contexto',
              'El núcleo 0.5 puede conservar una solicitud de continuación en su cola persistente. Esa infraestructura es distinta del agente que realiza el trabajo.',
            ],
            [
              'connect',
              'El agente retoma',
              'El conector marca la diferencia',
              'Los conectores nativos de reanudación siguen pendientes. Hoy, una espera activa puede continuar; si el chat terminó, envía allí la continuación guardada.',
            ],
          ],
    },
    architecture: {
      title: en.value
        ? 'Three responsibilities, one process'
        : 'Tres responsabilidades, un proceso',
      steps: en.value
        ? [
            [
              'chat',
              'Agent',
              'Plans and performs the work',
              'Your AI translates the request into tasks, calls its tools and records real results. It retains its own permissions.',
            ],
            [
              'flow',
              'Hyperion',
              'Coordinates and remembers',
              'The domain validates tasks, gateways and typed data. SQLite persists the process; events update the canvas.',
            ],
            [
              'user',
              'You',
              'Decide in the canvas',
              'You inspect inputs, answer questions and review results. The same process can appear in a browser or the desktop application.',
            ],
          ]
        : [
            [
              'chat',
              'Agente',
              'Planifica y realiza el trabajo',
              'Tu IA traduce la petición en tareas, usa sus herramientas y registra resultados reales. Conserva sus propios permisos.',
            ],
            [
              'flow',
              'Hyperion',
              'Coordina y recuerda',
              'El dominio valida tareas, compuertas y datos tipados. SQLite conserva el proceso y los eventos actualizan el canvas.',
            ],
            [
              'user',
              'Tú',
              'Decides en el canvas',
              'Consultas entradas, respondes preguntas y revisas resultados. El mismo proceso puede verse en el navegador o en escritorio.',
            ],
          ],
    },
  };
  return copy[props.kind];
});
const active = computed(() => content.value.steps[selected.value]);
</script>
<template>
  <section class="guide-lens" :aria-label="content.title">
    <header>
      <span class="guide-eyebrow"
        ><DocIcon name="eye" />{{ en ? 'Visual guide' : 'Guía visual' }}</span
      >
      <h2>{{ content.title }}</h2>
      <p>
        {{
          en
            ? 'Select a point to explore it.'
            : 'Selecciona un punto para explorarlo.'
        }}
      </p>
    </header>
    <div v-if="kind === 'canvas'" class="guide-example">
      <ProductCanvas :stage="2" :paused="true" /><small>{{
        en
          ? 'Illustrative workflow · no agent connected'
          : 'Flujo ilustrativo · sin agente conectado'
      }}</small>
    </div>
    <div class="guide-points">
      <button
        v-for="(step, i) in content.steps"
        :key="step[0]"
        type="button"
        :aria-pressed="selected === i"
        @click="selected = i"
      >
        <span class="guide-point-icon"
          ><DocIcon :name="step[0]" /><span>{{ i + 1 }}</span></span
        ><strong>{{ step[1] }}</strong>
      </button>
    </div>
    <div class="guide-annotation" aria-live="polite" aria-atomic="true">
      <DocIcon :name="active[0]" />
      <div>
        <strong>{{ active[2] }}</strong>
        <p>{{ active[3] }}</p>
      </div>
    </div>
    <a
      v-if="kind !== 'architecture'"
      class="guide-explore"
      :href="
        withBase(
          `${en ? '/en' : ''}/referencia/arquitectura.html#${en ? 'explore-the-architecture' : 'explora-la-arquitectura'}`,
        )
      "
      >{{ en ? 'Explore the model in Archify' : 'Explorar el modelo en Archify'
      }}<DocIcon name="arrow"
    /></a>
  </section>
</template>
