<script setup lang="ts">
import { ref } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
const { lang } = useData();
const paused = ref(false);
</script>
<template>
  <div class="home-motion" :class="{ 'motion-paused': paused }">
    <svg
      class="solar-scene"
      viewBox="0 0 480 400"
      role="img"
      :aria-label="
        lang === 'es'
          ? 'Hyperion — emblema solar en movimiento'
          : 'Hyperion — solar emblem in motion'
      "
    >
      <circle class="solar-halo" cx="240" cy="200" r="145" />
      <g class="home-orbit">
        <ellipse cx="240" cy="200" rx="211" ry="121" />
        <circle cx="451" cy="200" r="5" />
      </g>
      <g class="home-orbit orbit-second">
        <ellipse cx="240" cy="200" rx="180" ry="156" />
        <circle cx="60" cy="200" r="4" />
      </g>
      <image
        :href="withBase('/logo.svg')"
        x="145"
        y="105"
        width="190"
        height="190"
      />
      <path
        class="scene-path"
        d="M40 330C120 330 110 300 170 300S285 320 320 300 360 65 440 65"
      />
      <g class="scene-point">
        <circle cx="40" cy="330" r="8" />
        <circle cx="440" cy="65" r="8" />
      </g>
    </svg>
    <button
      class="motion-toggle"
      @click="paused = !paused"
      :aria-label="
        lang === 'es'
          ? paused
            ? 'Reanudar animación'
            : 'Pausar animación'
          : paused
            ? 'Resume animation'
            : 'Pause animation'
      "
    >
      <DocIcon :name="paused ? 'play' : 'pause'" />
    </button>
    <span class="scene-caption">{{
      lang === 'es'
        ? 'Del propósito al siguiente paso'
        : 'From intent to the next step'
    }}</span>
  </div>
</template>
