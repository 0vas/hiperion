<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
import HomeMotion from './HomeMotion.vue';
import ProjectBadges from './ProjectBadges.vue';
import HarnessMarks from './HarnessMarks.vue';
import { createVideoLoop } from './video-loop';
import {
  createHeadlineTypewriter,
  HEADLINE_PAIRS,
  headlineSizerPair,
  settledHeadlineLabel,
} from './headline-typewriter';
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const locale = computed(() => (en.value ? 'en' : 'es'));
const paused = ref(false);
const reduced = ref(true);
const hidden = ref(false);
const failed = ref(false);
const video = ref<HTMLVideoElement>();
const buffer = ref<HTMLVideoElement>();
const initialPair = HEADLINE_PAIRS[lang.value !== 'es' ? 'en' : 'es'][0];
const line1 = ref(initialPair[0]);
const line2 = ref(initialPair[1]);
const caret = ref<'line1' | 'line2' | null>(null);
const caretBlink = ref(false);
const liveAnnouncement = ref('');
const titleLabel = computed(() => settledHeadlineLabel(locale.value));
const sizer = computed(() => headlineSizerPair(locale.value));
let loop: ReturnType<typeof createVideoLoop> | undefined;
let typewriter: ReturnType<typeof createHeadlineTypewriter> | undefined;
let frame = 0;
const videoUrl =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';
let media: MediaQueryList | undefined;
const syncMotion = () => {
  reduced.value = media?.matches ?? true;
};
const syncVisibility = () => {
  hidden.value = document.hidden;
};
function applyLocalePair() {
  const [a, b] = HEADLINE_PAIRS[locale.value][0];
  line1.value = a;
  line2.value = b;
  caret.value = null;
  caretBlink.value = false;
}
function syncPlayback() {
  if (reduced.value || failed.value) loop?.reset();
  loop?.setEnabled(
    !paused.value && !reduced.value && !hidden.value && !failed.value,
  );
  cancelAnimationFrame(frame);
  if (!paused.value && !reduced.value && !hidden.value && !failed.value) {
    const tick = () => {
      loop?.tick();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  typewriter?.sync();
}
onMounted(() => {
  if (video.value && buffer.value)
    loop = createVideoLoop([video.value, buffer.value]);
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotion();
  syncVisibility();
  applyLocalePair();
  typewriter = createHeadlineTypewriter({
    getLocale: () => locale.value,
    isFrozen: () => reduced.value || paused.value,
    isHidden: () => hidden.value,
    onChange: (view) => {
      line1.value = view.line1;
      line2.value = view.line2;
      caret.value = view.caret;
      caretBlink.value = view.blink;
    },
    onPhraseComplete: (label) => {
      liveAnnouncement.value = label;
    },
  });
  typewriter.start();
  media.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncVisibility);
  syncPlayback();
});
watch([paused, reduced, hidden], syncPlayback, { flush: 'post' });
watch(locale, () => {
  typewriter?.stop();
  applyLocalePair();
  typewriter?.start();
});
onUnmounted(() => {
  cancelAnimationFrame(frame);
  loop?.setEnabled(false);
  typewriter?.stop();
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
      <div class="cinema-media">
        <video
          ref="video"
          class="cinema-video"
          :src="!reduced && !failed ? videoUrl : undefined"
          :poster="withBase('/brand/cinema-poster.svg')"
          muted
          playsinline
          preload="auto"
          @canplay="syncPlayback"
          @error="
            failed = true;
            syncPlayback();
          "
        />
        <video
          ref="buffer"
          class="cinema-video cinema-buffer"
          :src="!reduced && !failed ? videoUrl : undefined"
          muted
          playsinline
          preload="auto"
          @canplay="syncPlayback"
        />
      </div>
      <div class="cinema-scrim"></div>
    </div>
    <div class="landscape-copy">
      <p class="cinema-eyebrow">
        <span aria-hidden="true"></span
        >{{ en ? 'YOUR AI. A SHARED CANVAS.' : 'TU IA. UN CANVAS COMPARTIDO.' }}
      </p>
      <h1
        id="landscape-title"
        class="headline-typewriter"
        :aria-label="titleLabel"
      >
        <span class="headline-sizer" aria-hidden="true"
          ><span class="headline-line">{{ sizer[0] }}</span
          ><span class="headline-caret-slot"></span><br /><span
            class="headline-accent"
            >{{ sizer[1] }}</span
          ><span class="headline-caret-slot"></span
        ></span>
        <span class="headline-active" aria-hidden="true"
          ><span class="headline-line">{{ line1 }}</span
          ><span
            v-if="caret === 'line1'"
            class="headline-caret"
            :class="{ blink: caretBlink }"
          ></span
          ><br /><span class="headline-accent">{{ line2 }}</span
          ><span
            v-if="caret === 'line2'"
            class="headline-caret"
            :class="{ blink: caretBlink }"
          ></span
        ></span>
      </h1>
      <p class="headline-live" aria-live="polite">{{ liveAnnouncement }}</p>
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
