<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import codex from './brands/codex.svg?raw';
import claude from './brands/claude.svg?raw';
import cursor from './brands/cursor.svg?raw';
import openai from './brands/openai.svg?raw';
import hermes from './brands/hermesagent.svg?raw';
import antigravity from './brands/antigravity.svg?raw';
const { lang } = useData();
const brands = [
  { name: 'Codex', svg: codex },
  { name: 'Claude', svg: claude },
  { name: 'Cursor', svg: cursor },
  { name: 'ChatGPT', svg: openai },
  { name: 'Hermes', svg: hermes },
  { name: 'Antigravity', svg: antigravity },
];
</script>
<template>
  <div class="harness-marks">
    <a
      v-for="brand in brands"
      :key="brand.name"
      :href="withBase(`${lang === 'es' ? '' : '/en'}/guia/integraciones.html`)"
      ><span class="harness-mark" aria-hidden="true" v-html="brand.svg"></span
      ><span>{{ brand.name }}</span></a
    >
  </div>
</template>
