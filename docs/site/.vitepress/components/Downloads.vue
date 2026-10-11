<script setup lang="ts">
import { useData } from 'vitepress';
import DocIcon from './DocIcon.vue';
import PlatformIcon from './PlatformIcon.vue';
const { lang } = useData();
const release =
  'https://github.com/0vas/hyperion/releases/download/v0.4.0-preview.1/';
const installers = [
  {
    name: 'macOS · Apple Silicon',
    platform: 'macos',
    asset: 'mac-arm64.dmg',
    format: 'DMG · Apple Silicon',
  },
  {
    platform: 'macos',
    name: 'macOS · Intel',
    asset: 'mac-x64.dmg',
    format: 'DMG · x64',
  },
  {
    platform: 'windows',
    name: 'Windows · x64',
    asset: 'win-x64.exe',
    format: 'EXE · x64',
  },
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
        <PlatformIcon :platform="item.platform" />
        <span
          ><strong>{{ item.name }}</strong
          ><small>{{ item.format }}</small></span
        >
        <DocIcon name="download" class="download-action" />
      </a>
    </div>
    <p class="download-note">
      {{
        lang === 'es'
          ? 'Preview 0.4.0 · Instaladores sin firma. No incluyen todavía los cambios del núcleo 0.5.'
          : 'Preview 0.4.0 · Unsigned installers. They do not yet include the 0.5 core changes.'
      }}
      <a
        href="https://github.com/0vas/hyperion/releases/tag/v0.4.0-preview.1"
        >{{ lang === 'es' ? 'Notas de la versión' : 'Release notes' }}</a
      >
    </p>
  </section>
</template>
