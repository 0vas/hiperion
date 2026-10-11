<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
const { lang } = useData();
const steps = computed(() =>
  lang.value === 'es'
    ? [
        [
          'download',
          'Instala',
          'Descarga Hyperion para tu equipo.',
          '#_1-abre-hyperion',
        ],
        [
          'connect',
          'Conecta',
          'Elige tu IA y abre un chat nuevo.',
          '#_2-conecta-tu-ia',
        ],
        [
          'chat',
          'Pide',
          '«Usa Hyperion para…» y tu objetivo.',
          '#_3-pide-lo-que-necesitas',
        ],
        [
          'eye',
          'Participa',
          'Sigue el plan y responde en el canvas.',
          '#_4-participa-en-el-canvas',
        ],
      ]
    : [
        [
          'download',
          'Install',
          'Download Hyperion for your computer.',
          '#_1-open-hyperion',
        ],
        [
          'connect',
          'Connect',
          'Choose your AI and open a new chat.',
          '#_2-connect-your-ai',
        ],
        [
          'chat',
          'Ask',
          '“Use Hyperion to…” and your goal.',
          '#_3-ask-for-what-you-need',
        ],
        [
          'eye',
          'Take part',
          'Follow the plan and answer on the canvas.',
          '#_4-take-part-in-the-canvas',
        ],
      ],
);
</script>
<template>
  <ol
    class="quickstart-map"
    :aria-label="
      lang === 'es'
        ? 'Inicio rápido en cuatro pasos'
        : 'Quickstart in four steps'
    "
  >
    <li v-for="(step, index) in steps" :key="step[0]">
      <a
        :href="
          withBase(
            `${lang === 'es' ? '' : '/en'}/guia/primeros-pasos.html${step[3]}`,
          )
        "
        ><span class="quickstart-symbol"
          ><DocIcon :name="step[0]" /><span>{{ index + 1 }}</span></span
        ><strong>{{ step[1] }}</strong>
        <p>{{ step[2] }}</p></a
      >
    </li>
  </ol>
</template>
