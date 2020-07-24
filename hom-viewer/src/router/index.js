import Vue from 'vue'
import VueRouter from 'vue-router'
import Overview from '../views/Overview.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Overview',
    component: Overview,
  },
  {
    path: '/site/:id',
    name: 'Site',
    component: () => import(/* webpackChunkName: "about" */ '../views/Site.vue'),
  },
  {
    path: '/site/:id/visual',
    name: 'Visual',
    component: () => import(/* webpackChunkName: "about" */ '../views/Visual.vue'),
  },
]

const router = new VueRouter({
  routes,
})

export default router
