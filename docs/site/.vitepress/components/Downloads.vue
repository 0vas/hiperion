<script setup lang="ts">
import { useData } from 'vitepress';
const { lang } = useData();
const release =
  'https://github.com/0vas/hiperion/releases/download/v0.4.0-preview.1/';
const installers = [
  {
    name: 'macOS · Apple Silicon',
    asset: 'mac-arm64.dmg',
    format: 'DMG · Apple Silicon',
  },
  { name: 'macOS · Intel', asset: 'mac-x64.dmg', format: 'DMG · x64' },
  { name: 'Windows · x64', asset: 'win-x64.exe', format: 'EXE · x64' },
];
</script>

<template>
  <section
    class="downloads"
    :aria-label="
      lang === 'es'
        ? 'Descargas de Hyperion Desktop'
        : 'Hyperion Desktop downloads'
    "
  >
    <div class="download-grid">
      <a
        v-for="item in installers"
        :key="item.asset"
        :href="`${release}Hyperion-0.4.0-${item.asset}`"
        :aria-label="item.name"
        class="download-card"
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          aria-hidden="true"
        >
          <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
        </svg>
        <span
          ><strong>{{ item.name }}</strong
          ><small>{{ item.format }}</small></span
        >
      </a>
    </div>
    <p class="download-note">
      {{
        lang === 'es'
          ? 'Preview 0.4.0 · Instaladores sin firma. No incluyen todavía los cambios del núcleo 0.5.'
          : 'Preview 0.4.0 · Unsigned installers. They do not yet include the 0.5 core changes.'
      }}
      <a
        href="https://github.com/0vas/hiperion/releases/tag/v0.4.0-preview.1"
        >{{ lang === 'es' ? 'Notas de la versión' : 'Release notes' }}</a
      >
    </p>
  </section>
</template>
