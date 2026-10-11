<script setup lang="ts">
import { ref } from 'vue';
import { useData, withBase } from 'vitepress';
import DocIcon from './DocIcon.vue';
import ProductCanvas from './ProductCanvas.vue';
const { lang } = useData();
const paused = ref(false);
const t = (es: string, en: string) => (lang.value === 'es' ? es : en);
</script>
<template>
  <div class="home-motion cinema-window">
    <div class="cinema-titlebar">
      <span class="traffic-lights" aria-hidden="true"
        ><i></i><i></i><i></i></span
      ><span>Hyperion — {{ t('Guía de bienvenida', 'Welcome guide') }}</span
      ><span class="cinema-sample">{{ t('Ejemplo', 'Example') }}</span>
    </div>
    <div class="cinema-workspace">
      <aside class="cinema-sidebar">
        <div class="cinema-brand">
          <img
            :src="withBase('/logo.svg')"
            :alt="t('Hyperion — símbolo solar', 'Hyperion — solar symbol')"
            width="28"
            height="28"
          />Hyperion
        </div>
        <p class="cinema-sidebar-label">
          {{ t('TU PETICIÓN', 'YOUR REQUEST') }}
        </p>
        <div class="cinema-request">
          <DocIcon name="chat" />
          <p>
            {{
              t(
                'Usa Hyperion para preparar una guía de bienvenida.',
                'Use Hyperion to prepare a welcome guide.',
              )
            }}
          </p>
        </div>
        <p class="cinema-sidebar-label">{{ t('EL PLAN', 'THE PLAN') }}</p>
        <div class="cinema-plan-item">
          <DocIcon name="check" />{{ t('Recoger contexto', 'Gather context') }}
        </div>
        <div class="cinema-plan-item">
          <DocIcon name="check" />{{ t('Preparar borrador', 'Prepare draft') }}
        </div>
        <div class="cinema-plan-item current">
          <DocIcon name="user" />{{ t('Revisar juntos', 'Review together') }}
        </div>
        <span class="cinema-local"
          ><span aria-hidden="true"></span
          >{{
            t('Tú decides el siguiente paso', 'You decide the next step')
          }}</span
        >
      </aside>
      <div class="cinema-main">
        <div class="cinema-canvas-toolbar">
          <span
            ><DocIcon name="flow" />{{
              t('Guía de bienvenida', 'Welcome guide')
            }}</span
          ><span>{{ t('2 de 3 pasos', '2 of 3 steps') }}</span>
        </div>
        <ProductCanvas :stage="2" :paused="paused" />
        <div class="cinema-evidence">
          <div class="cinema-review">
            <span class="cinema-review-label"
              ><DocIcon name="user" />{{ t('TU TURNO', 'YOUR TURN') }}</span
            >
            <h2>
              {{
                t(
                  'Una buena bienvenida empieza aquí.',
                  'A great welcome starts here.',
                )
              }}
            </h2>
            <p>
              {{
                t(
                  'El borrador está preparado para tu equipo. Revísalo antes de continuar.',
                  'The draft is ready for your team. Review it before moving on.',
                )
              }}
            </p>
            <a :href="lang === 'es' ? '#prueba-un-flujo' : '#try-a-workflow'"
              >{{ t('Probar la revisión', 'Try the review')
              }}<span aria-hidden="true">↗</span></a
            >
          </div>
          <div class="cinema-log">
            <span
              ><DocIcon name="logs" />{{
                t('Actividad del ejemplo', 'Example activity')
              }}</span
            >
            <p>
              <i>01</i>{{ t('Contexto recibido', 'Context received')
              }}<DocIcon name="check" />
            </p>
            <p>
              <i>02</i>{{ t('Borrador preparado', 'Draft prepared')
              }}<DocIcon name="check" />
            </p>
            <p>
              <i>03</i>{{ t('Esperando tu revisión', 'Awaiting your review')
              }}<DocIcon name="user" />
            </p>
            <div class="cinema-io">
              <DocIcon name="data" />{{
                t(
                  'Entrada: equipo → Salida: borrador',
                  'Input: team → Output: draft',
                )
              }}
            </div>
          </div>
        </div>
        <div class="hero-product-footer">
          <span
            ><span class="product-live-dot" aria-hidden="true"></span
            >{{
              t(
                'Simulación · sin agente conectado',
                'Simulation · no agent connected',
              )
            }}</span
          ><button
            class="motion-toggle"
            @click="paused = !paused"
            :aria-label="
              t(
                paused ? 'Reanudar animación' : 'Pausar animación',
                paused ? 'Resume animation' : 'Pause animation',
              )
            "
          >
            <DocIcon :name="paused ? 'play' : 'pause'" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
