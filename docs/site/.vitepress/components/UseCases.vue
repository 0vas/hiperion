<script setup lang="ts">
import { computed, ref } from 'vue';
import { useData } from 'vitepress';
import DocIcon from './DocIcon.vue';
const { lang } = useData();
const selected = ref(0);
const copied = ref(false);
const failed = ref(false);
const en = computed(() => lang.value !== 'es');
const cases = computed(() =>
  en.value
    ? [
        {
          icon: 'chat',
          title: 'Documentation',
          description: 'From missing context to a reviewed draft.',
          prompt: 'Use Hyperion to prepare a welcome guide for my project.',
          result:
            'Expected workflow: gather missing context → prepare a draft → review the result.',
        },
        {
          icon: 'download',
          title: 'Installation',
          description: 'Choose the application and follow the checks.',
          prompt:
            'Use Hyperion to guide me through installing a JetBrains application on this computer.',
          result:
            'Expected workflow: choose a product → check the computer → install → verify. The agent asks for permissions when needed.',
        },
        {
          icon: 'flow',
          title: 'Code review',
          description: 'Review evidence before deciding what to change.',
          prompt:
            'Use Hyperion to review this repository and propose three prioritized improvements without modifying files.',
          result:
            'Expected workflow: agree on scope → inspect the code → present findings → review priorities.',
        },
      ]
    : [
        {
          icon: 'chat',
          title: 'Documentación',
          description: 'Del contexto que falta a un borrador revisado.',
          prompt:
            'Usa Hyperion para preparar una guía de bienvenida a mi proyecto.',
          result:
            'Flujo esperado: recoger contexto → preparar borrador → revisar el resultado.',
        },
        {
          icon: 'download',
          title: 'Instalación',
          description: 'Elige la aplicación y sigue las comprobaciones.',
          prompt:
            'Usa Hyperion para guiarme en la instalación de una aplicación de JetBrains en este equipo.',
          result:
            'Flujo esperado: elegir producto → comprobar equipo → instalar → verificar. El agente pide los permisos necesarios.',
        },
        {
          icon: 'flow',
          title: 'Revisión de código',
          description: 'Revisa la evidencia antes de decidir qué cambiar.',
          prompt:
            'Usa Hyperion para revisar este repositorio y proponer tres mejoras priorizadas sin modificar archivos.',
          result:
            'Flujo esperado: acordar alcance → inspeccionar código → presentar hallazgos → revisar prioridades.',
        },
      ],
);
async function copy() {
  try {
    await navigator.clipboard.writeText(cases.value[selected.value].prompt);
    copied.value = true;
    failed.value = false;
  } catch {
    failed.value = true;
  }
}
function select(index: number) {
  selected.value = index;
  copied.value = false;
  failed.value = false;
}
</script>
<template>
  <section class="use-cases" :aria-label="en ? 'Use cases' : 'Casos de uso'">
    <div class="case-selector">
      <button
        v-for="(item, index) in cases"
        :key="index"
        :aria-pressed="selected === index"
        @click="select(index)"
      >
        <DocIcon :name="item.icon" />{{ item.title }}
      </button>
    </div>
    <div class="case-content">
      <p class="case-description">{{ cases[selected].description }}</p>
      <pre class="case-prompt"><code>{{ cases[selected].prompt }}</code></pre>
      <div class="case-copy-row">
        <button class="demo-secondary" @click="copy">
          <DocIcon :name="copied ? 'check' : 'chat'" />{{
            en ? 'Copy request' : 'Copiar petición'
          }}</button
        ><span role="status">{{
          failed
            ? en
              ? 'Select and copy the text above.'
              : 'Selecciona y copia el texto de arriba.'
            : copied
              ? en
                ? 'Copied'
                : 'Copiado'
              : ''
        }}</span>
      </div>
      <p class="case-result">{{ cases[selected].result }}</p>
    </div>
  </section>
</template>
