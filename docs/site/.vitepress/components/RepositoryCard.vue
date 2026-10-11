<script setup lang="ts">
import { useData } from 'vitepress';
import DocIcon from './DocIcon.vue';
import ProjectBadges from './ProjectBadges.vue';
const { lang } = useData();
</script>
<template>
  <section
    class="repository-card"
    :aria-label="
      lang === 'es' ? 'Repositorio del proyecto' : 'Project repository'
    "
  >
    <div class="repository-heading">
      <DocIcon name="repository" /><strong>0vas / hiperion</strong>
    </div>
    <p>
      {{
        lang === 'es'
          ? 'Código, incidencias y contribuciones en un solo lugar.'
          : 'Source code, issues and contributions in one place.'
      }}
    </p>
    <a class="repository-open" href="https://github.com/0vas/hiperion"
      ><DocIcon name="repository" />{{
        lang === 'es'
          ? 'Abrir repositorio en GitHub'
          : 'Open repository on GitHub'
      }}<DocIcon name="external"
    /></a>
    <ProjectBadges />
    <div class="repository-links">
      <a href="https://github.com/0vas/hiperion/issues">{{
        lang === 'es' ? 'Ver incidencias' : 'Browse issues'
      }}</a
      ><a href="https://github.com/0vas/hiperion/blob/main/CONTRIBUTING.md">{{
        lang === 'es' ? 'Normas de contribución' : 'Contribution rules'
      }}</a>
    </div>
  </section>
</template>
