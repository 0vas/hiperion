<script setup lang="ts">
import { useData } from 'vitepress';
const { lang } = useData();
const repo = 'https://github.com/0vas/hiperion';
</script>
<template>
  <div
    class="project-badges"
    :aria-label="lang === 'es' ? 'Proyecto en GitHub' : 'Project on GitHub'"
  >
    <a :href="repo"
      ><img
        src="https://img.shields.io/badge/GitHub-0vas%2Fhiperion-755922?style=flat&amp;logo=github&amp;logoColor=white&amp;labelColor=273139"
        alt="GitHub: 0vas/hiperion"
        width="149"
        height="20"
    /></a>
    <a :href="`${repo}/blob/main/LICENSE`"
      ><img
        src="https://img.shields.io/badge/License-MIT-755922?style=flat&amp;labelColor=273139"
        :alt="lang === 'es' ? 'Licencia MIT' : 'MIT license'"
        width="82"
        height="20"
    /></a>
    <a :href="`${repo}/actions/workflows/pages.yml`"
      ><img
        src="https://img.shields.io/github/actions/workflow/status/0vas/hiperion/pages.yml?branch=main&amp;label=Docs&amp;style=flat&amp;labelColor=273139"
        :alt="
          lang === 'es'
            ? 'Estado de la documentación'
            : 'Documentation build status'
        "
        width="88"
        height="20"
    /></a>
  </div>
</template>
