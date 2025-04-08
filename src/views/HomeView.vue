<script setup>
import { computed, ref, reactive, watch, onMounted } from 'vue'
import api from '@/request'
import Header from '@/components/Header/Header.vue'
import Card from '@/components/Main/Card.vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const state = reactive({
  search: '',
  array: [],
})

const gradientStartColor = computed(() => '#080E1A')

async function loadRoutes() {
  try {
    const data = await api.get('routes/all_public_routes')
    state.array = data
  } catch (error) {
    state.array = []
  }
}

async function NewRoute() {
  try {
    const newid = await api.post(`routes/create`, { title: 'Новый маршрут' })
    router.push(`/create_route?id=${newid}`)
  } catch (err) {
    console.log(err)
  }
}

function mySort(searchKey) {
  let matchedKeys = [],
    notMatchedKeys = []
  for (let i = 0; i < state.array.length; i++) {
    if (state.array[i]['title'].toLowerCase().includes(searchKey.toLowerCase())) {
      matchedKeys.push(state.array[i])
    } else {
      notMatchedKeys.push(state.array[i])
    }
  }
  return matchedKeys.concat(notMatchedKeys)
}
watch(
  () => state.search,
  () => {
    state.array = mySort(state.search)
  },
)
const scroll = ref(true)
onMounted(() => {
  window.onscroll = function () {
    let currentScrollPos = window.scrollY
    if (200 < currentScrollPos) {
      scroll.value = false
    } else {
      scroll.value = true
    }
  }
})
onMounted(async () => {
  await loadRoutes()
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <div class="relative h-screen">
      <img src="/background3.png" class="w-full h-full object-cover blur-bgimage" />
      <div class="absolute top-0 left-0 w-full">
        <Header class="nav" :scroll="scroll" />
        <div style="margin-top: max(55px, 5vw); margin-left: 0.3vw; margin-right: 0.1vw">
          <h1 class="main" style="color: #fcf3e7; font-size: 6vw; margin-left: 0.5vw">
            Ваш путь начинается здесь
          </h1>
          <h2 style="color: #fcf3e7; font-size: 3vw; margin-left: 1vw">
            Cоздавай и иследуй новые маршруты вместе с GripTrip!
          </h2>
          <div class="flex justify-center" style="margin-top: 14vw">
            <div class="relative" style="width: 50vw">
              <input
                placeholder="Поиск"
                v-model="state.search"
                style="font-size: 2.5vw; padding-left: 2vw; padding-top: 1vw; padding-bottom: 1vw"
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
                  style="width: 3vw; height: 3vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="flex-grow bg-gradient-to-b"
      :style="{
        '--gradient-color-start': gradientStartColor,
        '--gradient-color-end': '#202C3D',
        background:
          'linear-gradient(to bottom, var(--gradient-color-start), var(--gradient-color-end))',
      }"
    >
      <div class="text-white inline-grid grid-cols-2" style="margin-right: 1vw; margin-left: 0.3vw">
        <h1 v-for="item in state.array" :key="item.id">
          <router-link :to="{ path: '/card', query: { id: item.main_route_id } }">
            <Card :card="item" style="border-width: 1px; border-color: white"></Card>
          </router-link>
        </h1>
      </div>
      <div class="text-center">
        <p style="font-size: 3vw; color: #fcf3e7; margin-top: 3vw">Маршрутов больше нет</p>

        <div
          class="inline-flex items-center cursor-pointer active:scale-95"
          @click="NewRoute()"
          style="
            padding-left: 2vw;
            padding-right: 2vw;
            padding-top: 0.8vw;
            padding-bottom: 0.8vw;
            font-size: 2.5vw;
            background-color: #c4d9d2;
            margin-bottom: 5vw;
            margin-top: 2vw;
            transition: transform 0.1s ease;
          "
        >
          Создать маршрут
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pink {
  background-color: pink;
}
.blur-bgimage {
  overflow: hidden;
  margin: 0;
  text-align: left;
}
.blur-bgimage:before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: inherit;
  z-index: -1;

  filter: blur(100px);
  -moz-filter: blur(100px);
  -webkit-filter: blur(100px);
  -o-filter: blur(100px);

  transition: all 2s linear;
  -moz-transition: all 2s linear;
  -webkit-transition: all 2s linear;
  -o-transition: all 2s linear;
}
h1 {
  font-size: calc(12px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
}
h2 {
  font-size: calc(12px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
}
h3 {
  font-size: calc(8px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
}
h4 {
  font-size: calc((5 + 4 * 0.7) * ((110vw - 320px) / 1280) + 2px);
  align-content: center;
}
h5 {
  font-size: calc((6 + 4 * 0.7) * ((110vw - 320px) / 1280) + 3px);
  align-content: center;
}
p {
  font-size: calc((10 + 4 * 0.7) * ((110vw - 320px) / 1280) + 5px);
  align-content: center;
}
h6 {
  font-size: calc((14 + 4 * 0.7) * ((110vw - 320px) / 1280) + 6px);
  align-content: center;
}
.header_hidden {
  background-color: rgba(0, 0, 0, 0);
}
</style>
