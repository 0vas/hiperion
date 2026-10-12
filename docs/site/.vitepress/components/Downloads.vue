<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import published from '../release.json';
import DocIcon from './DocIcon.vue';
import PlatformIcon from './PlatformIcon.vue';
const { lang } = useData();
const release = `https://github.com/0vas/hyperion/releases/download/v${published.version}/`;
const releaseDate = `${published.version.slice(0, 10).replaceAll('.', '-')}T${published.version.slice(11, 13)}:${published.version.slice(13)}:00Z`;
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
    <div class="download-version">
      <span>{{ lang === 'es' ? 'Versión' : 'Version' }}</span>
      <time :datetime="releaseDate">{{ published.version }}</time>
      <span
        >UTC ·
        {{
          published.channel === 'preview'
            ? 'Preview'
            : lang === 'es'
              ? 'Estable'
              : 'Stable'
        }}</span
      >
    </div>
    <div class="download-grid">
      <a
        v-for="item in installers"
        :key="item.asset"
        :href="`${release}Hyperion-${published.version}-${item.asset}`"
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
    <aside v-if="!published.macNotarized" class="download-status">
      <strong>{{
        lang === 'es'
          ? 'macOS: esta preview aún no está notarizada por Apple'
          : 'macOS: this preview is not yet notarized by Apple'
      }}</strong>
      <p>
        {{
          lang === 'es'
            ? 'Apple puede bloquear la apertura. Si decides confiar en esta copia oficial, después de intentar abrirla ve a Ajustes del Sistema → Privacidad y seguridad → Abrir igualmente.'
            : 'Apple may block opening the app. If you choose to trust this official copy, after attempting to open it go to System Settings → Privacy & Security → Open Anyway.'
        }}
      </p>
      <a
        :href="
          withBase(
            lang === 'es'
              ? '/guia/primeros-pasos.html#macos-bloquea-la-app'
              : '/en/guia/primeros-pasos.html#macos-blocks-the-app',
          )
        "
        >{{
          lang === 'es' ? 'Ver pasos de instalación' : 'View installation steps'
        }}
        <DocIcon name="arrow"
      /></a>
    </aside>
    <p class="download-note">
      {{
        lang === 'es'
          ? 'CalVer: año, mes, día, hora y minuto en UTC. Windows: instalador sin firma de editor.'
          : 'CalVer: year, month, day, hour and minute in UTC. Windows: no publisher signature.'
      }}
      <a
        :href="`https://github.com/0vas/hyperion/releases/tag/v${published.version}`"
        >{{ lang === 'es' ? 'Notas de la versión' : 'Release notes' }}</a
      >
    </p>
  </section>
</template>
