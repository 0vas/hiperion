<script setup lang="ts">
import { computed, useId } from 'vue';
import { useData } from 'vitepress';
const props = defineProps<{
  stage: number;
  hero?: boolean;
  paused?: boolean;
}>();
const { lang } = useData();
const id = useId().replaceAll(':', '');
const t = (es: string, en: string) => (lang.value === 'es' ? es : en);
const tasks = computed(() => [
  {
    id: 'audience',
    title: t('Elegir destinatario', 'Choose audience'),
    role: t('Tú', 'You'),
    state:
      props.stage > 1 ? 'completed' : props.stage === 1 ? 'waiting' : 'pending',
  },
  {
    id: 'draft',
    title: t('Preparar borrador', 'Prepare draft'),
    role: t('Agente', 'Agent'),
    state: props.stage > 1 ? 'completed' : 'pending',
  },
  {
    id: 'review',
    title: t('Revisar guía', 'Review guide'),
    role: t('Tú', 'You'),
    state:
      props.stage === 3
        ? 'completed'
        : props.stage === 2
          ? 'waiting'
          : 'pending',
  },
]);
const layouts = computed(() =>
  props.hero
    ? [
        {
          name: 'hero',
          box: '0 0 480 350',
          nodes: [
            [20, 30],
            [270, 30],
            [145, 210],
          ],
          paths: [
            'M205 87H270',
            'M362 144V175Q362 190 347 190H253Q238 190 238 205V210',
          ],
          start: null,
          end: null,
        },
      ]
    : [
        {
          name: 'wide',
          box: '0 0 960 270',
          nodes: [
            [120, 66],
            [388, 66],
            [656, 66],
          ],
          paths: [
            'M50 123H120',
            'M305 123H388',
            'M573 123H656',
            'M841 123H915',
          ],
          start: [36, 123],
          end: [929, 123],
        },
        {
          name: 'narrow',
          box: '0 0 340 650',
          nodes: [
            [78, 78],
            [78, 266],
            [78, 454],
          ],
          paths: ['M170 40V78', 'M170 192V266', 'M170 380V454', 'M170 568V610'],
          start: [170, 26],
          end: [170, 624],
        },
      ],
);
const label = (state: string) =>
  state === 'completed'
    ? t('Completado', 'Completed')
    : state === 'waiting'
      ? t('Tu turno', 'Your turn')
      : t('Pendiente', 'Pending');
</script>
<template>
  <div
    class="product-canvas"
    :class="{ 'canvas-paused': paused, 'canvas-hero': hero }"
  >
    <svg
      v-for="layout in layouts"
      :key="layout.name"
      :class="`canvas-svg canvas-${layout.name}`"
      :viewBox="layout.box"
      role="img"
      :aria-label="
        t(
          'Canvas Hyperion: destinatario, borrador y revisión',
          'Hyperion canvas: audience, draft and review',
        )
      "
    >
      <defs>
        <pattern
          :id="`${id}-${layout.name}`"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".75" class="canvas-dot" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" :fill="`url(#${id}-${layout.name})`" />
      <g
        v-for="(path, index) in layout.paths"
        :key="path"
        :class="{
          'canvas-link': true,
          traversed: stage > (hero ? 1 : index === 0 ? 0 : index === 3 ? 2 : 1),
        }"
      >
        <path :d="path" class="link-track" />
        <path :d="path" class="link-current" />
      </g>
      <g v-if="layout.start">
        <circle
          :cx="layout.start[0]"
          :cy="layout.start[1]"
          r="13"
          class="canvas-start"
        />
        <text
          :x="layout.start[0] - (layout.name === 'narrow' ? 38 : 0)"
          :y="layout.start[1] + (layout.name === 'narrow' ? 4 : 31)"
          class="event-label"
          text-anchor="middle"
        >
          {{ t('Inicio', 'Start') }}
        </text>
      </g>
      <g v-if="layout.end">
        <circle
          :cx="layout.end[0]"
          :cy="layout.end[1]"
          r="13"
          class="canvas-end"
        />
        <text
          :x="layout.end[0] - (layout.name === 'narrow' ? 38 : 0)"
          :y="layout.end[1] + (layout.name === 'narrow' ? 4 : -23)"
          class="event-label"
          text-anchor="middle"
        >
          {{ t('Fin', 'End') }}
        </text>
      </g>
      <g
        v-for="(task, index) in tasks"
        :key="task.id"
        :transform="`translate(${layout.nodes[index][0]} ${layout.nodes[index][1]})`"
        :data-task="task.id"
        :data-state="task.state"
        class="canvas-task"
      >
        <rect width="185" height="114" rx="12" class="task-surface" />
        <path d="M1 16V98" class="task-accent" />
        <g v-if="index === 1" transform="translate(13 13)" class="task-symbol">
          <rect x="0" y="1" width="17" height="14" rx="3" />
          <path d="m4 5 3 3-3 3m6 0h3" />
        </g>
        <g v-else transform="translate(13 12)" class="task-symbol">
          <circle cx="8" cy="5" r="4" />
          <path d="M1 19v-2a7 7 0 0 1 14 0v2" />
        </g>
        <text x="40" y="27" class="task-number">0{{ index + 1 }}</text>
        <text x="171" y="27" text-anchor="end" class="task-status">
          {{ label(task.state) }}
        </text>
        <text x="14" y="55" class="task-title">{{ task.title }}</text>
        <text x="14" y="75" class="task-role">{{ task.role }}</text>
        <path
          d="M15 92h12m-3-3 3 3-3 3m-9 5h12m-9-3-3 3 3 3"
          class="task-symbol"
        />
        <text x="34" y="101" class="task-meta">
          I/O {{ task.state === 'completed' ? '1/1' : '0/1' }}
        </text>
        <path
          d="M126 92h3m3 0h11m-17 5h3m3 0h11m-17 5h3m3 0h11"
          class="task-symbol"
        />
        <text x="148" y="101" class="task-meta">Logs</text>
      </g>
    </svg>
  </div>
</template>
