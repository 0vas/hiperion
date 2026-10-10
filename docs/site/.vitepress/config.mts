import { defineConfig } from 'vitepress';
export default defineConfig({
  lang: 'es',
  title: 'Hyperion',
  description:
    'Tu petición, un proceso visible. Guía de Hyperion para trabajar con tu IA paso a paso.',
  base: '/hiperion/',
  cleanUrls: false,
  head: [
    [
      'link',
      { rel: 'icon', type: 'image/svg+xml', href: '/hiperion/logo.svg' },
    ],
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Hyperion',
    nav: [
      { text: 'Guía', link: '/guia/primeros-pasos' },
      { text: 'Arquitectura', link: '/referencia/arquitectura' },
      { text: 'Contribuir', link: '/contribuir' },
    ],
    sidebar: [
      {
        text: 'Empieza aquí',
        items: [
          { text: 'Tu primer flujo', link: '/guia/primeros-pasos' },
          { text: 'Usar el canvas', link: '/guia/usar-el-flujo' },
          { text: 'Conectar tu IA', link: '/guia/integraciones' },
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
});
