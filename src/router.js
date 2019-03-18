import Vue from 'vue';
import Router from 'vue-router';
import MatchHistory from './views/MatchHistory.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'matchHistory',
      component: MatchHistory
    }
  ]
});
