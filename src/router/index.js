import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateRouteView from '../views/CreateRouteView.vue'
import Register from '../views/Register.vue'
import Login from '@/views/Login.vue'
import ProfileView from '@/views/ProfileView.vue'
import HistoryView from '@/views/HistoryView.vue'
import MyRoutesView from '@/views/MyRoutesView.vue'
import CardView from '@/views/CardView.vue'
import ModerView from '@/views/ModerView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import VersionsView from '@/views/VersionsView.vue'
import CheckView from '@/views/CheckView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/create_route',
      name: 'create route',
      component: CreateRouteView,
    },
    { path: '/register', name: 'register', component: Register },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/my_routes',
      name: 'my_routes',
      component: MyRoutesView,
    },
    {
      path: '/card',
      name: 'card',
      component: CardView,
    },
    {
      path: '/moder',
      name: 'moder',
      component: ModerView,
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
    },
    {
      path: '/versions',
      name: 'versions',
      component: VersionsView,
    },
    {
      path: '/check',
      name: 'check',
      component: CheckView,
    },
  ],
})

export default router
