<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const t = (es: string, english: string) => (en.value ? english : es);
const stage = ref(0);
const audience = ref('');
const id = useId();
const nodes = computed(() => [
  t('Tu petición', 'Your request'),
  t('Elegir destinatario', 'Choose audience'),
  t('Revisar borrador', 'Review draft'),
  t('Resultado', 'Result'),
]);
const target = computed(() =>
  audience.value === 'team'
    ? t('el equipo', 'the team')
    : t('nuevos usuarios', 'new users'),
);
const draft = computed(() =>
  audience.value === 'team'
    ? t(
        'Bienvenido al equipo. Empieza por conocer el proyecto, revisar los recursos compartidos y presentar tu primera pregunta.',
        'Welcome to the team. Start by getting to know the project, reviewing the shared resources and asking your first question.',
      )
    : t(
        'Te damos la bienvenida. Abre el proyecto, explora sus funciones y completa tu primera actividad con esta guía.',
        'Welcome aboard. Open the project, explore its features and complete your first activity with this guide.',
      ),
);
const status = computed(
  () =>
    [
      t('Empieza con una petición', 'Start with a request'),
      t('Tu turno: elige el destinatario', 'Your turn: choose the audience'),
      t('Tu turno: revisa el borrador', 'Your turn: review the draft'),
      t('Ejemplo completado', 'Example completed'),
    ][stage.value],
);
function restart() {
  stage.value = 0;
  audience.value = '';
}
</script>
<template>
  <section
    class="workflow-demo"
    role="region"
    :aria-label="t('Ejemplo interactivo', 'Interactive example')"
  >
    <header class="demo-header">
      <span class="demo-label"
        ><DocIcon name="play" />{{ t('Simulación', 'Simulation') }}</span
      ><span>{{
        t(
          'Sin instalación · sin datos enviados',
          'No installation · no data sent',
        )
      }}</span>
    </header>
    <div class="demo-layout">
      <ol class="demo-flow" :aria-label="t('Plan del ejemplo', 'Example plan')">
        <li
          v-for="(node, index) in nodes"
          :key="node"
          :class="{
            done: index < stage || stage === 3,
            current: index === stage && stage < 3,
          }"
          :aria-current="index === stage && stage < 3 ? 'step' : undefined"
        >
          <span class="demo-node-icon"
            ><DocIcon
              :name="
                index < stage || stage === 3
                  ? 'check'
                  : ['chat', 'user', 'eye', 'check'][index]
              "
          /></span>
          <span
            ><small
              >{{ String(index + 1).padStart(2, '0') }} ·
              {{
                index === 1 || index === 2
                  ? t('Tú', 'You')
                  : t('Agente', 'Agent')
              }}</small
            ><strong>{{ node }}</strong
            ><span class="demo-state">{{
              index < stage || stage === 3
                ? t('Completado', 'Completed')
                : index === stage
                  ? t('Paso actual', 'Current step')
                  : t('Pendiente', 'Pending')
            }}</span></span
          >
        </li>
      </ol>
      <div class="demo-workspace">
        <p class="demo-status" role="status" aria-live="polite">{{ status }}</p>
        <div v-if="stage === 0" class="demo-stage">
          <DocIcon name="chat" />
          <h3>{{ t('Todo empieza en tu chat', 'It starts in your chat') }}</h3>
          <blockquote>
            {{
              t(
                'Usa Hyperion para preparar una guía de bienvenida a mi proyecto.',
                'Use Hyperion to prepare a welcome guide for my project.',
              )
            }}
          </blockquote>
          <p>
            {{
              t(
                'El agente convierte tu objetivo en tareas y pregunta solo lo que falta.',
                'The agent turns your goal into tasks and asks only for missing information.',
              )
            }}
          </p>
          <button class="demo-primary" @click="stage = 1">
            {{ t('Crear el plan', 'Create the plan') }}<DocIcon name="flow" />
          </button>
        </div>
        <form
          v-else-if="stage === 1"
          class="demo-stage"
          @submit.prevent="stage = 2"
        >
          <DocIcon name="user" />
          <h3>{{ t('Una decisión concreta', 'One clear decision') }}</h3>
          <label :for="id">{{
            t('¿A quién va dirigida la guía?', 'Who is the guide for?')
          }}</label>
          <select :id="id" v-model="audience" required>
            <option disabled value="">
              {{ t('Elige una opción', 'Choose an option') }}
            </option>
            <option value="team">{{ t('Mi equipo', 'My team') }}</option>
            <option value="users">
              {{ t('Nuevos usuarios', 'New users') }}
            </option>
          </select>
          <p>
            {{
              t(
                'Tu respuesta será la entrada del siguiente paso.',
                'Your answer becomes an input to the next step.',
              )
            }}
          </p>
          <button class="demo-primary" :disabled="!audience" type="submit">
            {{ t('Guardar respuesta', 'Save answer') }}<DocIcon name="check" />
          </button>
        </form>
        <div v-else-if="stage === 2" class="demo-stage">
          <DocIcon name="eye" />
          <h3>{{ t('El borrador está listo', 'The draft is ready') }}</h3>
          <p class="demo-draft">{{ draft }}</p>
          <button class="demo-primary" @click="stage = 3">
            {{ t('Aprobar borrador', 'Approve draft') }}<DocIcon name="check" />
          </button>
          <button class="demo-secondary" @click="stage = 1">
            {{ t('Cambiar destinatario', 'Change audience') }}
          </button>
        </div>
        <div v-else class="demo-stage">
          <DocIcon name="check" />
          <h3>
            {{
              t(
                'Una petición. Un resultado revisado.',
                'One request. A reviewed result.',
              )
            }}
          </h3>
          <p>
            {{ t('La guía para ', 'The guide for ') }}{{ target
            }}{{
              t(
                ' quedó revisada en este ejemplo. No se publicó ni se envió nada.',
                ' has been reviewed in this example. Nothing was published or sent.',
              )
            }}
          </p>
          <button class="demo-secondary" @click="restart">
            <DocIcon name="reset" />{{
              t('Reiniciar ejemplo', 'Restart example')
            }}
          </button>
        </div>
        <div class="demo-evidence" v-if="stage > 0">
          <details>
            <summary>
              <DocIcon name="data" />{{
                t('Entradas y salidas', 'Inputs and outputs')
              }}
            </summary>
            <dl>
              <dt>{{ t('Entrada', 'Input') }}</dt>
              <dd>
                {{
                  stage > 1 ? target : t('Petición del chat', 'Chat request')
                }}
              </dd>
              <dt>{{ t('Salida', 'Output') }}</dt>
              <dd>
                {{
                  stage > 1
                    ? draft
                    : t(
                        'Plan con una pregunta pendiente',
                        'Plan with one unanswered question',
                      )
                }}
              </dd>
            </dl>
          </details>
          <details>
            <summary>
              <DocIcon name="logs" />{{
                t('Actividad del ejemplo', 'Example activity')
              }}
            </summary>
            <ul>
              <li>
                {{ t('Plan de ejemplo creado.', 'Example plan created.') }}
              </li>
              <li v-if="stage > 1">
                {{
                  t(
                    'Respuesta guardada y borrador de muestra preparado.',
                    'Answer saved and sample draft prepared.',
                  )
                }}
              </li>
              <li v-if="stage > 2">
                {{ t('Borrador aprobado por ti.', 'Draft approved by you.') }}
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
    <footer class="demo-disclaimer">
      {{
        t(
          'Este ejemplo usa un borrador predefinido, no una IA conectada. En la aplicación real, continuar depende de la conexión del agente.',
          'This example uses a predefined draft, not a connected AI. In the real app, continuation depends on the agent connection.',
        )
      }}
      <a :href="withBase(`${en ? '/en' : ''}/guia/reanudacion.html`)">{{
        t('Ver cómo se retoma', 'How resumption works')
      }}</a>
    </footer>
  </section>
</template>
