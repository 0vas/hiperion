<script setup lang="ts">
import { computed, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
const { lang, isDark } = useData();
const selected = ref('hyperion');
const en = computed(() => lang.value !== 'es');
const views = computed(() => [
  {
    id: 'hyperion',
    icon: 'flow',
    label: en.value ? 'Execution' : 'Ejecución',
    note: en.value
      ? 'The agent performs the work. Hyperion validates the process, persists evidence and makes human decisions visible.'
      : 'El agente realiza el trabajo. Hyperion valida el proceso, conserva la evidencia y hace visibles las decisiones humanas.',
  },
  {
    id: 'process',
    icon: 'data',
    label: en.value ? 'Data and decisions' : 'Datos y decisiones',
    note: en.value
      ? 'A response becomes a typed output. Contracts and gateways determine which task can use it next.'
      : 'Una respuesta se convierte en una salida tipada. Los contratos y las compuertas determinan qué tarea puede usarla después.',
  },
  {
    id: 'continuation',
    icon: 'pause',
    label: en.value ? 'Pause and resume' : 'Pausa y reanudación',
    note: en.value
      ? 'The queue survives a restart. Resuming a conversation also requires a real installed connector; native connectors remain pending.'
      : 'La cola sobrevive a un reinicio. Retomar una conversación también requiere un conector real instalado; los conectores nativos siguen pendientes.',
  },
]);
const current = computed(() =>
  views.value.find((v) => v.id === selected.value)!,
);
const url = computed(() =>
  withBase(`/architecture/${selected.value}-${en.value ? 'en' : 'es'}.html`),
);
const source = computed(
  () => `${url.value}?embed=1&theme=${isDark.value ? 'dark' : 'light'}`,
);
</script>

<template>
  <section
    class="architecture-explorer"
    :aria-label="en ? 'Architecture explorer' : 'Explorador de arquitectura'"
  >
    <div
      class="architecture-views"
      role="group"
      :aria-label="en ? 'Choose a view' : 'Elige una vista'"
    >
      <button
        v-for="view in views"
        :key="view.id"
        :aria-pressed="selected === view.id"
        @click="selected = view.id"
      >
        <DocIcon :name="view.icon" />{{ view.label }}
      </button>
    </div>
    <p class="architecture-note" aria-live="polite">{{ current.note }}</p>
    <iframe
      class="archify-frame"
      :src="source"
      :title="`${en ? 'Hyperion architecture' : 'Arquitectura de Hyperion'} · ${current.label}`"
      loading="lazy"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
    ></iframe>
    <div class="architecture-links">
      <a :href="url"
        ><DocIcon name="external" />{{
          en ? 'Explore in Archify' : 'Explorar en Archify'
        }}</a
      >
      <a
        :href="`https://github.com/0vas/hiperion/blob/main/docs/architecture/archify/${selected}.${en ? 'en' : 'es'}.json`"
        >{{ en ? 'Diagram source' : 'Fuente del diagrama' }}</a
      >
    </div>
  </section>
</template>

<style scoped>
.architecture-explorer {
  margin: 28px 0;
  min-width: 0;
}
.architecture-views {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.architecture-views button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}
.architecture-views button[aria-pressed='true'] {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-color: currentColor;
}
.architecture-views button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}
.architecture-views svg,
.architecture-links svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.architecture-note {
  font-size: 14px;
  color: var(--vp-c-text-2);
  min-height: 72px;
}
.architecture-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}
.architecture-links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
