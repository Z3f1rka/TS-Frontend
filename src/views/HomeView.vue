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

const gradientStartColor = computed(() => 'oklch(96.8% 0.007 247.896)')

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
let user = ref()
let auth = ref()
async function f() {
  try {
    const data = await api.get('auth/me')
    user.value = data
    if (data == undefined) {
      throw undefined
    }
    if (data === 1) {
      auth.value = false
    }
  } catch (err) {
    console.log(err)
    router.push({ path: '/' })
    alert('Такого пользователя')
  }
}
onMounted(() => {
  f()
})
watch(
  () => user.value,
  () => {
    auth.value = true
  },
)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <div class="relative h-screen">
      <img src="/background3.jpg" class="w-full object-cover blur-bgimage" />
      <div class="absolute top-0 left-0 w-full">
        <Header class="nav" :scroll="scroll" />
        <div style="margin-top: max(55px, 15vw); margin-left: 3vw; margin-right: 45vw">
          <h1
            class="main"
            style="color: oklch(27.9% 0.041 260.031); font-size: 6vw; margin-left: 0.5vw"
          >
            Верстка для всех
          </h1>
          <h2 style="color: oklch(27.9% 0.041 260.031); font-size: 3vw; margin-left: 1vw">
            от идеи до готовой книги в несколько кликов
          </h2>
        </div>
      </div>
    </div>
    <div
      class="flex-grow bg-gradient-to-b"
      :style="{
        '--gradient-color-start': gradientStartColor,
        '--gradient-color-end': 'white',
        background:
          'linear-gradient(to bottom, var(--gradient-color-start), var(--gradient-color-end))',
      }"
    ></div>
    <footer
      class="bg-slate-800 text-gray-300"
      style="padding-top: 6vw; padding-bottom: 4vw; padding-left: 6vw; padding-right: 5vw"
    >
      <div class="container mx-auto inline-flex md:flex-row justify-between items-center">
        <div class="mb-0" style="margin-bottom: 1vw">
          <h3 class="font-semibold" style="font-size: 1.2vw; margin-bottom: 0.5vw">Контакты</h3>
          <p style="font-size: 0.8vw">Email: 89450.miha@gmail.com</p>
          <p style="font-size: 0.8vw">Телефон: +7 (908) 490-30-27</p>
          <p style="font-size: 0.8vw">GitHub: https://github.com/Z3f1rka/TSMain</p>
        </div>
        <div v-if="auth && user != 1">
          <router-link :to="{ path: '/feedback', query: { id: user.id } }">
            <div class="mt-0 flex text-center" style="display: flex; space-x: 0.6vw">
              <a class="hover:text-gray-100" style="font-size: 1.4vw; margin-bottom: 0.2vw"
                >Задать вопрос</a
              ><img
                src="/arrow1.svg"
                style="width: 1.2vw; height: 1.2vw; margin-left: 0.8vw"
                class="self-center"
              /></div
          ></router-link>
        </div>
      </div>
    </footer>
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
