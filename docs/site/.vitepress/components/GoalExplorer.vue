<script setup lang="ts">
import { computed, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
import { goalCases } from './goal-cases';
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const selected = ref(0);
const choice = ref<number | null>(null);
const copyState = ref('');
const cases = computed(() =>
  goalCases.map((item) => ({
    icon: item.icon,
    ...(en.value ? item.en : item.es),
  })),
);
const active = computed(() => cases.value[selected.value]);
const planSteps = computed(() => {
  const steps = [...active.value.steps];
  if (choice.value !== null) steps[2] = active.value.choices[choice.value].next;
  return steps;
});
function select(index: number) {
  selected.value = index;
  choice.value = null;
  copyState.value = '';
}
async function copy() {
  try {
    await navigator.clipboard.writeText(active.value.prompt);
    copyState.value = en.value ? 'Copied' : 'Copiado';
  } catch {
    copyState.value = en.value
      ? 'Select and copy the request above.'
      : 'Selecciona y copia la petición de arriba.';
  }
}
</script>
<template>
  <section
    class="goal-explorer"
    :aria-label="en ? 'Explore use cases' : 'Explora los casos de uso'"
  >
    <div class="goal-categories">
      <button
        v-for="(item, i) in cases"
        :key="i"
        :aria-pressed="selected === i"
        @click="select(i)"
      >
        <DocIcon :name="item.icon" /><span>{{ item.title }}</span>
      </button>
    </div>
    <div class="goal-body">
      <header class="goal-heading">
        <span class="goal-kicker">{{
          en ? 'FROM INTENT TO PROCESS' : 'DEL OBJETIVO AL PROCESO'
        }}</span>
        <h3>{{ active.summary }}</h3>
      </header>
      <div class="goal-request">
        <p class="goal-prompt">{{ active.prompt }}</p>
        <button class="demo-secondary" @click="copy">
          <DocIcon name="chat" />{{
            en ? 'Copy request' : 'Copiar petición'
          }}</button
        ><span class="goal-copy-status" role="status">{{ copyState }}</span>
      </div>
      <div class="goal-preview">
        <div class="goal-preview-title">
          <DocIcon name="flow" /><span>{{
            en ? 'Illustrative plan' : 'Plan ilustrativo'
          }}</span
          ><span>{{ en ? 'Simulation' : 'Simulación' }}</span>
        </div>
        <ol
          class="goal-path"
          :aria-label="en ? 'Example steps' : 'Pasos del ejemplo'"
        >
          <li
            v-for="(step, i) in planSteps"
            :key="step"
            :class="{ 'is-decision': i === 1 }"
          >
            <span class="goal-step-icon"
              ><DocIcon
                :name="
                  i === 0
                    ? 'chat'
                    : i === 1
                      ? 'user'
                      : i === 2
                        ? active.icon
                        : 'check'
                "
              /><small>{{ i + 1 }}</small></span
            >
            <strong>{{ step }}</strong
            ><span>{{
              i === 1
                ? en
                  ? 'You decide'
                  : 'Tú decides'
                : i === 3
                  ? en
                    ? 'You review'
                    : 'Tú revisas'
                  : en
                    ? 'Agent'
                    : 'Agente'
            }}</span>
          </li>
        </ol>
        <div class="goal-decision">
          <p>
            <DocIcon name="user" /><strong>{{ active.question }}</strong>
          </p>
          <div class="goal-choices">
            <button
              v-for="(option, i) in active.choices"
              :key="option.label"
              :aria-pressed="choice === i"
              @click="choice = i"
            >
              <DocIcon :name="choice === i ? 'check' : 'play'" />{{
                option.label
              }}
            </button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            <div v-if="choice !== null" class="goal-output">
              <DocIcon name="data" />
              <div>
                <strong>{{
                  en
                    ? 'Your decision shapes the plan'
                    : 'Tu decisión orienta el plan'
                }}</strong>
                <p>{{ active.choices[choice].output }}</p>
              </div>
            </div>
          </div>
        </div>
        <footer class="goal-preview-footer">
          <small>{{
            en
              ? 'Sample data. This example does not run tools or connect to an agent.'
              : 'Datos de ejemplo. Esta simulación no ejecuta herramientas ni conecta con un agente.'
          }}</small
          ><button v-if="choice !== null" @click="choice = null">
            <DocIcon name="reset" />{{
              en ? 'Reset example' : 'Reiniciar ejemplo'
            }}
          </button>
        </footer>
      </div>
      <div class="goal-requires">
        <DocIcon name="connect" />
        <div>
          <strong>{{
            en ? 'To use it with your AI' : 'Para usarlo con tu IA'
          }}</strong>
          <p>{{ active.requires }}</p>
          <a :href="withBase(`${en ? '/en' : ''}/guia/integraciones.html`)"
            >{{
              en ? 'Check available connections' : 'Ver conexiones disponibles'
            }}<DocIcon name="arrow"
          /></a>
        </div>
      </div>
    </div>
  </section>
</template>
