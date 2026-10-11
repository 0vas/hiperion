<script setup lang="ts">
defineProps<{ platform: string }>();
</script>
<template>
  <svg
    class="platform-icon"
    :data-platform="platform"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
  >
    <template v-if="platform === 'macos'">
      <path
        d="M21.1 2c.3 3.4-1.9 5.8-4.5 6 .1-2.8 1.8-5.3 4.5-6ZM23.8 9.7c-2.7-2.1-5-.6-7.2-.6-2.1 0-4.1-1.4-6.6.1C4 12.7 8 25.4 12.1 28c1.6 1 2.7-.5 4.5-.5s2.8 1.5 4.5.4c2.1-1.4 3.7-4.2 4.4-6.3-4.2-1.9-4.5-7.4-.5-9.8-.3-.7-.7-1.4-1.2-2.1Z"
      />
    </template>
    <path
      v-else
      d="M3 5.5 14.5 4v11H3Zm14-1.8L29 2v13H17ZM3 17h11.5v11L3 26.5Zm14 0h12v13l-12-1.7Z"
    />
  </svg>
</template>
