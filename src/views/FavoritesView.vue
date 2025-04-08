<script setup>
import Header from '@/components/Header/Header.vue'
import { ref, watch, onMounted, reactive } from 'vue'
import api from '@/request'
import Card from '@/components/Main/Card.vue'
import { useRouter, useRoute } from 'vue-router'

const id = useRoute()['query']['id']

let selfcards = reactive({
  search: '',
  array: [],
})
function mySort(searchKey) {
  let matchedKeys = [],
    notMatchedKeys = []
  for (let i = 0; i < selfcards.array.length; i++) {
    if (selfcards.array[i]['title'].toLowerCase().includes(searchKey.toLowerCase())) {
      matchedKeys.push(selfcards.array[i])
    } else {
      notMatchedKeys.push(selfcards.array[i])
    }
  }
  return matchedKeys.concat(notMatchedKeys)
}
watch(
  () => selfcards.search,
  () => {
    selfcards.array = mySort(selfcards.search)
  },
)

async function f() {
  try {
    const data = await api.get(`auth/favorites/fetch/other?user_id=${id}`)
    selfcards.array = data
  } catch (error) {
    console.error('Ошибка при загрузке данных пользователя:', error)
  }
}

onMounted(async () => {
  await f()
})
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <div
      style="
        position: fixed;
        background-image: url('/zve.jpg');
        background-size: cover;
        background-position: center center;
        filter: blur(20px);
        width: 150%;
        height: 150%;
        left: -50px;
        z-index: -1;
      "
    ></div>
    <Header class="nav" :scroll="false" />
    <div class="self-center" style="margin-top: max(6vw, 40px)">
      <div class="flex justify-center text-white">
        <p style="font-size: 3vw; margin-top: 3vw">Избранные</p>
      </div>
      <div class="flex justify-center" style="margin-top: 2vw">
        <div class="relative" style="width: 40vw">
          <input
            placeholder="Поиск"
            v-model="selfcards.search"
            style="font-size: 1.5vw; padding-left: 2vw; padding-top: 1vw; padding-bottom: 1vw"
            class="w-full rounded-lg bg-zinc-100 focus:outline-none"
          />
          <div
            class="absolute inset-y-0 flex items-center pointer-events-none justify-center"
            style="right: 1.3vw"
          >
            <img
              src="/search.png"
              alt="Поиск"
              class="text-gray-400"
              style="width: 2vw; height: 2vw"
            />
          </div>
        </div>
      </div>
      <div
        v-if="selfcards.array"
        class="text-white inline-grid grid-cols-2"
        style="margin-right: 1vw; margin-left: 0.3vw; margin-bottom: 3vw; transition: 0.3s ease"
      >
        <div v-for="item in selfcards.array" :key="item.id">
          <router-link :to="{ path: '/card', query: { id: item.main_route_id } }">
            <Card :card="item.route" style="border-width: 1px; border-color: white"></Card>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
