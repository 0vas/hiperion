<script setup lang="ts">
import { ref } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
import ProductCanvas from './ProductCanvas.vue';
const { lang } = useData();
const paused = ref(false);
</script>
<template>
  <div class="home-motion" :class="{ 'motion-paused': paused }">
    <div class="hero-product-bar">
      <img
        :src="withBase('/logo.svg')"
        :alt="
          lang === 'es' ? 'Hyperion — símbolo solar' : 'Hyperion — solar symbol'
        "
        width="25"
        height="25"
      /><span
        >Hyperion
        <small>{{
          lang === 'es'
            ? 'Vista del producto · ejemplo'
            : 'Product view · example'
        }}</small></span
      ><span class="product-live-dot" aria-hidden="true"></span>
    </div>
    <ProductCanvas :stage="2" hero :paused="paused" />
    <div class="hero-product-footer">
      <span
        ><DocIcon name="user" />{{
          lang === 'es' ? 'Tu turno · Revisar guía' : 'Your turn · Review guide'
        }}</span
      ><button
        class="motion-toggle"
        @click="paused = !paused"
        :aria-label="
          lang === 'es'
            ? paused
              ? 'Reanudar animación'
              : 'Pausar animación'
            : paused
              ? 'Resume animation'
              : 'Pause animation'
        "
      >
        <DocIcon :name="paused ? 'play' : 'pause'" />
      </button>
    </div>
  </div>
</template>
