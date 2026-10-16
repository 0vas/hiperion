<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useData } from 'vitepress';
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
const stages = computed(() =>
  en.value
    ? [
        { label: 'Request', tick: false },
        { label: 'Visible plan', tick: true },
        { label: 'Agent work', tick: true },
        { label: 'Your decision', tick: true, accent: true },
        { label: 'Next step', tick: true },
      ]
    : [
        { label: 'Petición', tick: false },
        { label: 'Plan visible', tick: true },
        { label: 'Trabajo del agente', tick: true },
        { label: 'Tu decisión', tick: true, accent: true },
        { label: 'Siguiente paso', tick: true },
      ],
);
</script>
<template>
  <figure
    class="landscape-diagram landscape-loop"
    :class="{ 'motion-ready': !reduced }"
    role="img"
    :aria-label="
      en
        ? 'Request to plan to agent work to your decision to next step, with evidence on each stretch.'
        : 'Petición a plan a trabajo del agente a tu decisión a siguiente paso, con evidencia en cada tramo.'
    "
  >
    <ol class="loop-lane" aria-hidden="true">
      <li
        v-for="(stage, index) in stages"
        :key="stage.label"
        :class="{ accent: stage.accent }"
      >
        <span class="loop-box">{{ stage.label }}</span>
        <small v-if="stage.tick">{{
          en ? 'state · evidence' : 'estado · evidencia'
        }}</small>
        <span v-if="index < stages.length - 1" class="loop-arrow">→</span>
      </li>
    </ol>
    <p class="loop-continue" aria-hidden="true">
      {{ en ? 'continues' : 'continúa' }}
    </p>
    <figcaption>
      {{
        en
          ? 'Request → plan → agent work → your decision → next step, with evidence on each stretch.'
          : 'Petición → plan → trabajo del agente → tu decisión → siguiente paso, con evidencia en cada tramo.'
      }}
    </figcaption>
  </figure>
</template>
