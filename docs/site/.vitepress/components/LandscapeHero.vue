<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
import HomeMotion from './HomeMotion.vue';
import ProjectBadges from './ProjectBadges.vue';
import HarnessMarks from './HarnessMarks.vue';
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const paused = ref(false);
const reduced = ref(true);
const hidden = ref(false);
const failed = ref(false);
const video = ref<HTMLVideoElement>();
const videoUrl =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';
let media: MediaQueryList | undefined;
const syncMotion = () => {
  reduced.value = media?.matches ?? true;
};
const syncVisibility = () => {
  hidden.value = document.hidden;
};
async function syncPlayback() {
  const player = video.value;
  if (!player) return;
  if (paused.value || reduced.value || hidden.value || failed.value)
    player.pause();
  else {
    try {
      await player.play();
    } catch {
      /* Autoplay can be blocked; the poster and controls remain usable. */
    }
    if (paused.value || reduced.value || hidden.value) player.pause();
  }
}
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotion();
  syncVisibility();
  media.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncVisibility);
});
watch([paused, reduced, hidden], syncPlayback, { flush: 'post' });
onUnmounted(() => {
  video.value?.pause();
  media?.removeEventListener('change', syncMotion);
  document.removeEventListener('visibilitychange', syncVisibility);
});
const route = (path: string) => withBase(`${en.value ? '/en' : ''}/${path}`);
</script>
<template>
  <section
    class="landscape-hero"
    :class="{ 'cinema-paused': paused || reduced || hidden }"
    aria-labelledby="landscape-title"
  >
    <div class="cinema-backdrop" aria-hidden="true">
      <video
        ref="video"
        class="cinema-video"
        :src="!reduced && !failed ? videoUrl : undefined"
        :poster="withBase('/brand/cinema-poster.svg')"
        autoplay
        loop
        muted
        playsinline
        preload="metadata"
        @canplay="syncPlayback"
        @error="failed = true"
      />
      <div class="cinema-scrim"></div>
    </div>
    <div class="landscape-copy">
      <p class="cinema-eyebrow">
        <span aria-hidden="true"></span
        >{{ en ? 'YOUR AI. A SHARED CANVAS.' : 'TU IA. UN CANVAS COMPARTIDO.' }}
      </p>
      <h1 id="landscape-title">
        {{ en ? 'Your ideas.' : 'Tus ideas.' }}<br /><span>{{
          en ? 'In motion.' : 'En movimiento.'
        }}</span>
      </h1>
      <p class="landscape-description">
        {{
          en
            ? 'From a conversation to a visible plan. Follow your agent, make decisions and shape the next step.'
            : 'De una conversación a un plan visible. Sigue a tu agente, toma decisiones y da forma al siguiente paso.'
        }}
      </p>
      <div class="landscape-actions">
        <a
          class="landscape-primary"
          :href="en ? '#download-hyperion' : '#descarga-hyperion'"
          ><DocIcon name="download" />{{
            en ? 'Download Hyperion' : 'Descargar Hyperion'
          }}<DocIcon name="external"
        /></a>
        <a
          class="landscape-secondary"
          :href="en ? '#try-a-workflow' : '#prueba-un-flujo'"
          ><DocIcon name="play" />{{
            en ? 'Try the canvas' : 'Probar el canvas'
          }}</a
        >
      </div>
      <p class="cinema-platforms">
        macOS · Windows <span> / </span> Open source · MIT
      </p>
      <div class="cinema-utilities">
        <a class="cinema-start" :href="route('guia/primeros-pasos.html')"
          >{{ en ? 'Get started' : 'Empezar' }} <DocIcon name="arrow"
        /></a>
        <button
          class="landscape-motion"
          :aria-label="
            en
              ? paused
                ? 'Resume background'
                : 'Pause background'
              : paused
                ? 'Reanudar fondo'
                : 'Pausar fondo'
          "
          :aria-pressed="paused"
          @click="paused = !paused"
        >
          <DocIcon :name="paused ? 'play' : 'pause'" /><span>{{
            en
              ? paused
                ? 'Resume background'
                : 'Pause background'
              : paused
                ? 'Reanudar fondo'
                : 'Pausar fondo'
          }}</span>
        </button>
      </div>
    </div>
    <div class="landscape-product"><HomeMotion /></div>
    <ProjectBadges />
    <div class="cinema-integrations">
      <p>
        {{
          en
            ? 'STARTS WHERE YOUR CONVERSATION HAPPENS'
            : 'EMPIEZA DONDE OCURRE TU CONVERSACIÓN'
        }}
      </p>
      <HarnessMarks />
      <small
        >{{
          en
            ? 'Explore connection options and available capabilities'
            : 'Consulta las conexiones y capacidades disponibles'
        }}
        <DocIcon name="external"
      /></small>
    </div>
  </section>
</template>
