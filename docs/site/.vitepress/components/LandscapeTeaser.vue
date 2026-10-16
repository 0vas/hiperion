<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import LandscapeCompare from './LandscapeCompare.vue';
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const href = computed(() =>
  withBase(en.value ? '/en/guia/the-landscape.html' : '/guia/el-paisaje.html'),
);
</script>
<template>
  <section class="landscape-teaser" :aria-labelledby="'landscape-teaser-title'">
    <p class="landscape-eyebrow">
      {{ en ? 'THE LANDSCAPE' : 'EL PAISAJE' }}
    </p>
    <h2 id="landscape-teaser-title">
      {{
        en
          ? 'From the chat that answers to the process you guide'
          : 'Del chat que responde al proceso que guías'
      }}
    </h2>
    <p class="landscape-teaser-lead">
      {{
        en
          ? 'Hyperion turns your AI’s work into a process you can see and guide.'
          : 'Hyperion convierte el trabajo de tu IA en un proceso que puedes ver y guiar.'
      }}
    </p>
    <p>
      {{
        en
          ? 'AI no longer only consults: with agents and tools it executes. When that work runs long, a thread is not enough.'
          : 'La IA ya no solo consulta: con agentes y herramientas ejecuta. Cuando ese trabajo se alarga, un hilo no basta.'
      }}
    </p>
    <p>
      {{
        en
          ? 'Hyperion offers the landscape: a visible plan, your decisions and real evidence — beside your chat, not instead of it.'
          : 'Hyperion ofrece el paisaje: plan visible, decisiones tuyas y evidencia real — junto a tu chat, sin sustituirlo.'
      }}
    </p>
    <p class="landscape-teaser-link">
      <a :href="href">{{ en ? 'Read the landscape' : 'Leer el paisaje' }}</a>
      <span aria-hidden="true"> →</span>
    </p>
    <LandscapeCompare compact />
  </section>
</template>
