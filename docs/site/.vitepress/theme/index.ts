import DefaultTheme from 'vitepress/theme';
import './style.css';
import Downloads from '../components/Downloads.vue';
import Architecture from '../components/Architecture.vue';
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Downloads', Downloads);
    app.component('Architecture', Architecture);
  },
};
