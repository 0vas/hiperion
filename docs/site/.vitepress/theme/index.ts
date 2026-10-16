import { h } from 'vue';
import ArchitectureAtlas from '../components/ArchitectureAtlas.vue';
import './architecture.css';
import GoalExplorer from '../components/GoalExplorer.vue';
import GuideLens from '../components/GuideLens.vue';
import RepositoryCard from '../components/RepositoryCard.vue';
import LandscapeHero from '../components/LandscapeHero.vue';
import LandscapeCompare from '../components/LandscapeCompare.vue';
import LandscapeLoop from '../components/LandscapeLoop.vue';
import LandscapeTeaser from '../components/LandscapeTeaser.vue';
import UseCases from '../components/UseCases.vue';
import Quickstart from '../components/Quickstart.vue';
import WorkflowDemo from '../components/WorkflowDemo.vue';
import DocIcon from '../components/DocIcon.vue';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './product.css';
import './landscape.css';
import './story.css';
import './goals.css';
import './navigation.css';
import Downloads from '../components/Downloads.vue';
import Architecture from '../components/Architecture.vue';
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-hero-before': () => h(LandscapeHero),
    }),
  enhanceApp({ app }) {
    app.component('GoalExplorer', GoalExplorer);
    app.component('GuideLens', GuideLens);
    app.component('RepositoryCard', RepositoryCard);
    app.component('UseCases', UseCases);
    app.component('Quickstart', Quickstart);
    app.component('WorkflowDemo', WorkflowDemo);
    app.component('DocIcon', DocIcon);
    app.component('Downloads', Downloads);
    app.component('Architecture', Architecture);
    app.component('ArchitectureAtlas', ArchitectureAtlas);
    app.component('LandscapeCompare', LandscapeCompare);
    app.component('LandscapeLoop', LandscapeLoop);
    app.component('LandscapeTeaser', LandscapeTeaser);
  },
};
