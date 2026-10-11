<script setup lang="ts">
defineProps<{ name: string }>();
const paths: Record<string, string> = {
  external: 'M7 17 17 7M7 7h10v10',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  repository: 'M4 4h16v16H4zM8 4v16M12 8h4M12 12h4',
  chat: 'M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2ZM7 9h10M7 13h6',
  flow: 'M4 3h6v6H4zM14 15h6v6h-6zM7 9v9h7M14 6h6M17 3v6',
  check: 'm5 12 4 4L19 6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  connect: 'm9 15 6-6M8 12l-2 2a3 3 0 0 0 4 4l2-2M12 8l2-2a3 3 0 0 1 4 4l-2 2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-2a8 8 0 0 1 16 0v2',
  logs: 'M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1',
  data: 'M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4',
  play: 'm8 4 12 8-12 8Z',
  pause: 'M8 4v16M16 4v16',
  reset: 'M3 10a9 9 0 1 1 1 8M3 4v6h6',
};
</script>
<template>
  <svg
    class="doc-icon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.flow" />
  </svg>
</template>
