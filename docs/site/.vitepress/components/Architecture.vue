<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
const { lang, isDark } = useData();
const source = computed(() =>
  withBase(
    `/architecture/hyperion-${lang.value === 'es' ? 'es' : 'en'}.html?embed=1&theme=${isDark.value ? 'dark' : 'light'}`,
  ),
);
</script>

<template>
  <iframe
    class="archify-frame"
    :src="source"
    :title="
      lang === 'es'
        ? 'Arquitectura de Hyperion en Archify'
        : 'Hyperion architecture in Archify'
    "
    loading="lazy"
    sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
  ></iframe>
</template>
