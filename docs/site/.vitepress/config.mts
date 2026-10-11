import { defineConfig } from 'vitepress';
export default defineConfig({
  lang: 'es',
  title: 'Hyperion',
  description:
    'Tu petición, un proceso visible. Guía de Hyperion para trabajar con tu IA paso a paso.',
  base: '/hiperion/',
  cleanUrls: false,
  locales: {
    root: {
      label: 'Español',
      lang: 'es',
      themeConfig: {
        langMenuLabel: 'Cambiar idioma',
        nav: [
          {
            text: 'Guía',
            link: '/guia/primeros-pasos',
            activeMatch: '^/guia/',
          },
          {
            text: 'Arquitectura',
            link: '/referencia/arquitectura',
            activeMatch: '^/referencia/',
          },
          {
            text: 'Contribuir',
            link: '/contribuir',
            activeMatch: '^/contribuir',
          },
          { text: 'Probar Hyperion', link: '/#prueba-un-flujo' },
        ],
        sidebar: [
          {
            text: 'Empieza aquí',
            items: [
              { text: 'Tu primer flujo', link: '/guia/primeros-pasos' },
              { text: 'Usar el canvas', link: '/guia/usar-el-flujo' },
              { text: 'Conectar tu IA', link: '/guia/integraciones' },
              { text: 'Pausa y reanudación', link: '/guia/reanudacion' },
            ],
          },
          {
            text: 'Entender Hyperion',
            items: [
              { text: 'Arquitectura', link: '/referencia/arquitectura' },
              { text: 'Alcance y límites', link: '/referencia/limites' },
            ],
          },
          {
            text: 'Proyecto abierto',
            items: [
              { text: 'Contribuir', link: '/contribuir' },
              { text: 'Publicar la documentación', link: '/despliegue' },
            ],
          },
        ],
        outline: { label: 'En esta página' },
        sidebarMenuLabel: 'Secciones',
        mobileMenuLabel: 'Navegación móvil',
        darkModeSwitchLabel: 'Cambiar tema',
        lightModeSwitchTitle: 'Tema claro',
        darkModeSwitchTitle: 'Tema oscuro',
        returnToTopLabel: 'Volver arriba',
        skipToContentLabel: 'Saltar al contenido',
        docFooter: { prev: 'Anterior', next: 'Siguiente' },
        editLink: {
          pattern: 'https://github.com/0vas/hiperion/edit/main/docs/site/:path',
          text: 'Mejorar esta página',
        },
        footer: {
          message: 'Un módulo independiente. Código abierto bajo licencia MIT.',
          copyright: 'Hyperion · Del propósito al siguiente paso',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      description:
        'Your request, a visible process. Work with your AI, step by step.',
      themeConfig: {
        langMenuLabel: 'Change language',
        nav: [
          {
            text: 'Guide',
            link: '/en/guia/primeros-pasos',
            activeMatch: '^/en/guia/',
          },
          {
            text: 'Architecture',
            link: '/en/referencia/arquitectura',
            activeMatch: '^/en/referencia/',
          },
          {
            text: 'Contribute',
            link: '/en/contribuir',
            activeMatch: '^/en/contribuir',
          },
          { text: 'Try Hyperion', link: '/en/#try-a-workflow' },
        ],
        sidebar: [
          {
            text: 'Get started',
            items: [
              { text: 'Your first workflow', link: '/en/guia/primeros-pasos' },
              { text: 'Use the canvas', link: '/en/guia/usar-el-flujo' },
              { text: 'Connect your AI', link: '/en/guia/integraciones' },
              { text: 'Pause and resume', link: '/en/guia/reanudacion' },
            ],
          },
          {
            text: 'Understand Hyperion',
            items: [
              { text: 'Architecture', link: '/en/referencia/arquitectura' },
              { text: 'Scope and limits', link: '/en/referencia/limites' },
            ],
          },
          {
            text: 'Open project',
            items: [
              { text: 'Contribute', link: '/en/contribuir' },
              { text: 'Publish the documentation', link: '/en/despliegue' },
            ],
          },
        ],
        outline: { label: 'On this page' },
        editLink: {
          pattern: 'https://github.com/0vas/hiperion/edit/main/docs/site/:path',
          text: 'Improve this page',
        },
        footer: {
          message: 'An independent module. Open source under the MIT license.',
          copyright: 'Hyperion · From intent to the next step',
        },
      },
    },
  },
  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        href: '/hiperion/brand/hyperion-titan.png',
      },
    ],
  ],
  themeConfig: {
    logo: '/brand/hyperion-titan.png',
    siteTitle: 'Hyperion',
    socialLinks: [{ icon: 'github', link: 'https://github.com/0vas/hiperion' }],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Buscar',
                buttonAriaLabel: 'Buscar en la documentación',
              },
              modal: {
                noResultsText: 'Sin resultados para',
                resetButtonTitle: 'Borrar búsqueda',
                footer: {
                  selectText: 'seleccionar',
                  navigateText: 'navegar',
                  closeText: 'cerrar',
                },
              },
            },
          },
        },
      },
    },
  },
});
