import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Register from '../views/Register.vue'
import Login from '@/views/Login.vue'
import ProfileView from '@/views/ProfileView.vue'
import MyRoutesView from '@/views/MyRoutesView.vue'
import ModerView from '@/views/ModerView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import Pdf from '@/views/Pdf.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
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
      path: '/my_routes',
      name: 'my_routes',
      component: MyRoutesView,
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
      path: '/pdf',
      name: 'pdf',
      component: Pdf,
    },
  ],
})

export default router
