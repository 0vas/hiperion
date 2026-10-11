<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
import HomeMotion from './HomeMotion.vue';
const { lang } = useData();
const en = computed(() => lang.value !== 'es');
const paused = ref(false);
const hidden = ref(false);
const hero = ref<HTMLElement>();
const id = useId().replace(/:/g, '');
let observer: IntersectionObserver | undefined;
let inViewport = true;
const visibility = () => {
  hidden.value = !inViewport || document.hidden;
};
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    visibility();
  });
  if (hero.value) observer.observe(hero.value);
  document.addEventListener('visibilitychange', visibility);
});
onUnmounted(() => {
  observer?.disconnect();
  document.removeEventListener('visibilitychange', visibility);
});
const route = (path: string) => withBase(`${en.value ? '/en' : ''}/${path}`);
</script>

<template>
  <section
    ref="hero"
    class="landscape-hero"
    :class="{ 'landscape-paused': paused || hidden }"
    aria-labelledby="landscape-title"
  >
    <div class="solar-scene" aria-hidden="true">
      <div class="solar-atmosphere"></div>
      <svg
        class="solar-landscape"
        viewBox="0 0 1600 960"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <radialGradient :id="`${id}-halo`">
            <stop stop-color="#ebba78" stop-opacity=".48" />
            <stop offset=".52" stop-color="#a87851" stop-opacity=".18" />
            <stop offset="1" stop-color="#131d27" stop-opacity="0" />
          </radialGradient>
          <linearGradient
            :id="`${id}-rim`"
            x1="900"
            y1="100"
            x2="1240"
            y2="650"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#fae2b6" />
            <stop offset=".42" stop-color="#be8d5e" />
            <stop offset="1" stop-color="#283746" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            :id="`${id}-planet`"
            x1="900"
            y1="190"
            x2="1280"
            y2="590"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#323839" />
            <stop offset=".35" stop-color="#131e29" />
            <stop offset="1" stop-color="#0c1622" />
          </linearGradient>
          <linearGradient :id="`${id}-terrain`" x2="0" y2="1">
            <stop stop-color="#283c4a" />
            <stop offset="1" stop-color="#09121d" />
          </linearGradient>
          <linearGradient :id="`${id}-thread`">
            <stop stop-color="#779899" stop-opacity="0" />
            <stop offset=".55" stop-color="#dfb980" stop-opacity=".65" />
            <stop offset="1" stop-color="#779899" stop-opacity="0" />
          </linearGradient>
        </defs>
        <circle cx="1110" cy="330" r="490" :fill="`url(#${id}-halo)`" />
        <circle
          cx="1110"
          cy="330"
          r="237"
          :fill="`url(#${id}-planet)`"
          :stroke="`url(#${id}-rim)`"
          stroke-width="2"
        />
        <ellipse
          cx="1110"
          cy="330"
          rx="315"
          ry="315"
          stroke="#dfc093"
          stroke-opacity=".09"
        />
        <ellipse
          cx="1110"
          cy="330"
          rx="386"
          ry="386"
          stroke="#dfc093"
          stroke-opacity=".06"
        />
        <g fill="#dfd2b8" opacity=".5">
          <circle
            v-for="i in 48"
            :key="i"
            :cx="(i * 197) % 1600"
            :cy="(i * 71) % 640"
            :r="i % 4 === 0 ? 1.2 : 0.6"
          />
        </g>
        <path
          d="M-100 765C220 420 453 858 843 740S1310 520 1730 730V1000H-100Z"
          :fill="`url(#${id}-terrain)`"
        />
        <g :stroke="`url(#${id}-thread)`" stroke-width=".8">
          <path
            v-for="i in 30"
            :key="i"
            :d="`M-100 ${755 + i * 9} C220 ${435 + i * 12} 453 ${858 + i * 4} 843 ${740 + i * 7} S1310 ${520 + i * 13} 1730 ${730 + i * 8}`"
          />
        </g>
        <path
          d="M-80 946C316 675 512 927 891 900S1350 745 1680 905V1000H-80Z"
          fill="#0a1420"
        />
      </svg>
      <div class="solar-shade"></div>
    </div>
    <div class="landscape-inner">
      <div class="landscape-topline">
        <span
          ><span class="sun-spark" aria-hidden="true">✦</span>
          {{
            en
              ? 'A clearer way to work with AI'
              : 'Una forma más clara de trabajar con IA'
          }}</span
        ><span class="landscape-edition">OPEN SOURCE · MIT</span>
      </div>
      <div class="landscape-main">
        <div class="landscape-copy">
          <p class="landscape-eyebrow">
            HYPERION <span aria-hidden="true">/</span>
            {{ en ? 'FROM INTENT TO ACTION' : 'DE LA INTENCIÓN A LA ACCIÓN' }}
          </p>
          <h1 id="landscape-title">
            {{ en ? 'Your ideas.' : 'Tus ideas.' }}<br /><span>{{
              en ? 'A visible path.' : 'Un camino visible.'
            }}</span>
          </h1>
          <p class="landscape-description">
            {{
              en
                ? 'Turn a conversation with your AI into a plan you can see, guide and follow. One step at a time.'
                : 'Convierte una conversación con tu IA en un plan que puedes ver, guiar y seguir. Paso a paso.'
            }}
          </p>
          <div class="landscape-actions">
            <a
              class="landscape-primary"
              :href="route('guia/primeros-pasos.html')"
              >{{ en ? 'Get started' : 'Empezar'
              }}<span aria-hidden="true">↗</span></a
            >
            <a
              class="landscape-secondary"
              :href="en ? '#try-a-workflow' : '#prueba-un-flujo'"
              ><DocIcon name="play" />{{
                en ? 'Try the canvas' : 'Probar el canvas'
              }}</a
            >
          </div>
          <a
            class="landscape-download"
            :href="en ? '#download-hyperion' : '#descarga-hyperion'"
            ><DocIcon name="download" />{{
              en
                ? 'Download for macOS & Windows'
                : 'Descargar para macOS y Windows'
            }}<span aria-hidden="true">↗</span></a
          >
        </div>
        <div class="landscape-product">
          <div class="landscape-intent">
            <DocIcon name="chat" /><span>{{
              en
                ? '“Use Hyperion to prepare a welcome guide.”'
                : '«Usa Hyperion para preparar una guía de bienvenida»'
            }}</span>
          </div>
          <HomeMotion />
          <a class="landscape-caption" :href="route('guia/integraciones.html')"
            >{{
              en
                ? 'Your conversation. Your agent. Your decisions.'
                : 'Tu conversación. Tu agente. Tus decisiones.'
            }}<span aria-hidden="true">↗</span></a
          >
        </div>
      </div>
      <div class="landscape-bottom">
        <a :href="route('guia/integraciones.html')" class="landscape-harnesses"
          ><span>{{ en ? 'Built around your AI' : 'Alrededor de tu IA' }}</span
          ><strong
            >Codex <i>·</i> Claude <i>·</i> Cursor <i>·</i> ChatGPT
            <i>·</i> Hermes</strong
          ></a
        >
        <button
          class="landscape-motion"
          @click="paused = !paused"
          :aria-label="
            en
              ? paused
                ? 'Resume landscape'
                : 'Pause landscape'
              : paused
                ? 'Reanudar paisaje'
                : 'Pausar paisaje'
          "
          :aria-pressed="paused"
        >
          <DocIcon :name="paused ? 'play' : 'pause'" /><span>{{
            en ? 'Landscape' : 'Paisaje'
          }}</span>
        </button>
      </div>
    </div>
  </section>
</template>
