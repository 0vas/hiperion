import { h } from 'vue';
import HomeMotion from '../components/HomeMotion.vue';
import UseCases from '../components/UseCases.vue';
import Quickstart from '../components/Quickstart.vue';
import WorkflowDemo from '../components/WorkflowDemo.vue';
import DocIcon from '../components/DocIcon.vue';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './product.css';
import Downloads from '../components/Downloads.vue';
import Architecture from '../components/Architecture.vue';
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, { 'home-hero-image': () => h(HomeMotion) }),
  enhanceApp({ app }) {
    app.component('UseCases', UseCases);
    app.component('Quickstart', Quickstart);
    app.component('WorkflowDemo', WorkflowDemo);
    app.component('DocIcon', DocIcon);
    app.component('Downloads', Downloads);
    app.component('Architecture', Architecture);
  },
};
