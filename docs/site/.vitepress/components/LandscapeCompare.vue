<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useData } from 'vitepress';
const props = defineProps<{ compact?: boolean }>();
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const reduced = ref(true);
let media: MediaQueryList | undefined;
const syncMotion = () => {
  reduced.value = media?.matches ?? true;
};
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotion();
  media.addEventListener('change', syncMotion);
});
onUnmounted(() => media?.removeEventListener('change', syncMotion));
const flow = computed(() =>
  en.value
    ? ['Start', 'Agent task', 'Decision?', 'Next', 'End']
    : ['Inicio', 'Tarea agente', '¿Decisión?', 'Siguiente', 'Fin'],
);
</script>
<template>
  <figure
    class="landscape-diagram landscape-compare"
    :class="{ compact: props.compact, 'motion-ready': !reduced }"
    role="img"
    :aria-label="
      en
        ? 'Left: a chat thread. Right: the same work as a path with steps, your decision and evidence.'
        : 'Izquierda: un hilo de chat. Derecha: el mismo trabajo como recorrido con pasos, una decisión tuya y evidencia.'
    "
  >
    <div class="compare-grid">
      <div class="compare-panel chat-only">
        <p class="panel-label">{{ en ? 'Chat only' : 'Solo chat' }}</p>
        <div class="chat-stack" aria-hidden="true">
          <span class="bubble agent"></span>
          <span class="bubble user"></span>
          <span class="bubble agent"></span>
          <span class="bubble user truncated"><i></i><i></i><i></i></span>
        </div>
        <p class="panel-foot">
          {{ en ? 'The thread is the map' : 'El hilo es el mapa' }}
        </p>
      </div>
      <div class="compare-divider" aria-hidden="true">
        <span>→</span>
      </div>
      <div class="compare-panel canvas-side">
        <p class="panel-label">{{ en ? 'Chat + canvas' : 'Chat + canvas' }}</p>
        <ol class="mini-flow" aria-hidden="true">
          <li
            v-for="(step, index) in flow"
            :key="step"
            :class="{ decision: index === 2 }"
          >
            <span>{{ step }}</span>
            <small v-if="index === 2">{{ en ? 'You' : 'Tú' }}</small>
          </li>
        </ol>
        <p class="panel-foot">
          {{ en ? 'The process is the map' : 'El proceso es el mapa' }}
        </p>
      </div>
    </div>
    <figcaption>
      {{
        en
          ? 'Left: a chat thread. Right: the same work as a path with steps, your decision and evidence.'
          : 'Izquierda: un hilo de chat. Derecha: el mismo trabajo como recorrido con pasos, una decisión tuya y evidencia.'
      }}
    </figcaption>
  </figure>
</template>
