<script setup>
import Header from '@/components/Header/Header.vue'
import { ref, watch, onMounted, reactive, computed } from 'vue'
import Card from '@/components/Main/Card.vue'
import api from '@/request'
import api_photo from '@/request_photo'
import { useRouter, useRoute } from 'vue-router'

const id = useRoute()['query']['id']

let Active = ref(0)
const router = useRouter()
let user = ref(null)
let auth = ref(false)
let selfcards = reactive({
  search: '',
  array: [],
})
let historycards = reactive({
  search: '',
  array: [],
})

const imageUrl = ref('')

if (localStorage.getItem('refresh_token') == null) {
  router.push({ path: '/login' })
  alert('Войдите для просмотра профилей')
}

async function f() {
  try {
    const data = await api.get(`auth/user?user_id=${id}`)
    user.value = data
    if (data == undefined) {
      throw undefined
    }
    if (user.value.avatar != undefined && user.value.avatar != null && user.value.avatar != '') {
      imageUrl.value = user.value.avatar
    }
  } catch (err) {
    console.log(err)
    router.push({ path: '/' })
    alert('Такого пользователя нет')
  }
}
f()
watch(
  () => user.value,
  () => {
    auth.value = true
  },
)

const loadingM = ref(false)
const loadingH = ref(false)
const rulefive = ref(false)
const rulefiveH = ref(false)

const fetchData = async () => {
  loadingM.value = false

  try {
    selfcards.array = await api.get(`routes/all_user_routes?user_id=${id}`)
    if (selfcards.array == undefined) {
      throw undefined
    }
  } catch (err) {
    console.error('Ошибка при запросе к первичному эндпоинту:', err)
    try {
      selfcards.array = await api.get(`routes/all_user_public_routes?user_id=${id}`)
      if (selfcards.array == undefined) {
        throw undefined
      }
    } catch (err1) {
      console.error('Ошибка при запросе к вторичному эндпоинту:', err1)
    }
  } finally {
    loadingM.value = true
    if (selfcards.array.length >= 3) {
      rulefive.value = true
      selfcards.array = selfcards.array.slice(0, 3)
    }
  }
}
const fetchDataH = async () => {
  loadingH.value = false
  try {
    historycards.array = await api.get(`history/routes/other_user?user_id=${id}`)
    if (historycards.array == undefined) {
      throw undefined
    }
  } catch (err) {
    console.log(err)
  } finally {
    loadingH.value = true
    if (historycards.array.length >= 3) {
      rulefiveH.value = true
      historycards.array = historycards.array.slice(0, 3)
    }
  }
}

const rulefiveF = ref(false)
const loadingF = ref(false)
const favoritescards = reactive({
  search: '',
  array: [],
})

const fetchDataI = async () => {
  loadingF.value = false
  try {
    favoritescards.array = await api.get(`auth/favorites/fetch/other?user_id=${id}`)
    if (favoritescards.array == undefined) {
      throw undefined
    }
  } catch (err) {
    console.log(err)
  } finally {
    loadingF.value = true
    if (favoritescards.array.length >= 6) {
      rulefiveF.value = true
      favoritescards.array = favoritescards.array.slice(0, 6)
    }
  }
}
async function NewRoute() {
  try {
    const newid = await api.post(`routes/create`, { title: 'Новый маршрут' })
    console.log(newid)
    router.push(`/create_route?id=${newid}`)
  } catch (err) {
    console.log(err)
  }
}
onMounted(() => {
  fetchData()
})
onMounted(() => {
  fetchDataH()
})
onMounted(() => {
  fetchDataI()
})
const fileInput = ref(null)

const uploadAvatar = () => {
  fileInput.value.click()
}
const handleFileUpload = async (event) => {
  const file = ref()
  file.value = event.target.files[0]
  const formData = new FormData()
  formData.append('file', file.value)
  try {
    const image = await api_photo.post('files/upload', formData)
    try {
      imageUrl.value =
        import.meta.env.VITE_FILES_API_URL +
        'files/download/' +
        encodeURIComponent(image).replace('(', '%28').replace(')', '%29')
      console.log(imageUrl)
      const prof = await api.post(`auth/update`, {
        avatar: imageUrl.value,
      })
      router.go(0)
    } catch (err) {
      console.log(err)
    }
  } catch (err) {
    console.log(err)
  }
}
</script>
<template>
  <div class="min-h-screen overflow-hidden">
    <div
      style="
        position: fixed;
        background-color: oklch(98.4% 0.003 247.858);
        background-size: fill;
        background-position: center center;
        filter: blur(40px);
        width: 150%;
        height: 150%;
        left: -50px;
      "
    ></div>
    <Header class="nav shadow-md" :scroll="false" />
    <div class="bg-gradient-to-b">
      <div class="grid sticky">
        <div
          class="text-slate-900 bg-slate-50 grid grid-cols-5 grid-rows-1 shadow-md"
          style="
            border-width: 1px;
            border-color: white;
            padding-top: max(9vw, 40px);
            padding-bottom: 1vw;
          "
        >
          <div
            class="col-span-1 overflow-auto rounded-e-2xl text-slate-50 content-center"
            style="
              margin-top: 5.4vw;
              margin-bottom: 2.8vw;
              padding-left: 1vw;
              padding-right: 1vw;
              background-color: #0055d2;
            "
          >
            <div @click="uploadAvatar" class="justify-center flex">
              <img
                v-if="user && user.avatar"
                :src="imageUrl"
                class="rounded-full"
                style="width: 8vw; height: 8vw"
              />
              <img
                v-if="!(user && user.avatar)"
                src="/avatar.jpg"
                class="rounded-full"
                style="width: 8vw; height: 8vw"
              />
              <input
                type="file"
                ref="fileInput"
                style="display: none"
                @change="handleFileUpload"
                accept="image/*"
              />
            </div>

            <div class="justify-between">
              <div class="text-center">
                <div style="font-size: 1.8vw; margin-top: 1.5vw">
                  {{ user ? user.username : 'Имя пользователя отсутствует' }}
                </div>
                <div style="font-size: 1vw" class="text-slate-100">
                  {{ user ? user.email : 'email пользователя отсутствует' }}
                </div>
              </div>
              <div style="margin-top: 1vw" class="place-content-center flex">
                <div style="text-align: center; font-size: 1.1vw; margin: 1vw">
                  <div style="margin-bottom: 1vw; font-size: 1.3vw">
                    {{ selfcards.array.length }}
                  </div>
                  <div>Все проекты</div>
                </div>
                <div style="text-align: center; font-size: 1.1vw; margin: 1vw">
                  <div style="margin-bottom: 1vw; font-size: 1.3vw">
                    {{ favoritescards.array.length }}
                  </div>
                  <div>Избранные</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-span-4 text-center" style="margin-left: 1vw">
            <div style="font-size: 2.3vw">
              <div class="grid grid-cols-3" style="margin-bottom: 2vw">
                <div></div>
                <div style="color: #007dfe">Избранное</div>
                <div v-if="rulefive" class="flex justify-end" style="margin-right: 4vw">
                  <router-link :to="{ path: '/my_routes', query: { id: id } }"
                    ><div
                      class="items-center rounded-lg text-center bg-white text-black active:scale-95"
                      style="
                        padding-left: 1vw;
                        padding-right: 1vw;
                        padding-top: 0.7vw;
                        padding-bottom: 0.7vw;
                        font-size: 1vw;
                        border-width: 1px;
                        transition: 0.3s ease;
                      "
                    >
                      Все проекты
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
            <div
              v-if="!loading"
              style="
                margin-left: 0.3vw;
                margin-bottom: 3vw;
                transition: 0.3s ease;
                margin-top: 1vw;
                padding-bottom: 1.5vw;
                padding-right: 1.5vw;
              "
              class="bg-slate-200 rounded-s-2xl"
            >
              <div class="text-white flex place-content-around">
                <div v-for="item in selfcards.array" :key="item.id">
                  <div class="hover:scale-105" style="transition: 0.1s ease">
                    <router-link :to="{ path: '/create_route', query: { id: item.main_route_id } }">
                      <Card
                        :card="item"
                        :size="1"
                        style="border-width: 1px; border-color: white"
                      ></Card>
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="!loading"
          class="text-center"
          style="
            margin-right: 1vw;
            margin-left: 0.3vw;
            margin-bottom: 3vw;
            transition: 0.3s ease;
            margin-top: 1vw;
          "
        >
          <div class="text-white flex place-content-center">
            <Card
              :card="{ title: 'nananani' }"
              :size="3"
              class="hover:scale-105"
              style="border-width: 1px; border-color: white; transition: 0.1s ease"
            ></Card>
            <div v-for="item in selfcards.array" :key="item.id">
              <div class="hover:scale-105" style="transition: 0.1s ease">
                <router-link :to="{ path: '/create_route', query: { id: item.main_route_id } }">
                  <Card
                    :card="item"
                    :size="2"
                    style="border-width: 1px; border-color: white"
                  ></Card>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.fade-enter-from {
  opacity: 0;
}

.fade-enter-active {
  transition: opacity 0.3s ease-out;
}

.fade-enter-to {
  opacity: 1;
}

.fade-leave-from {
  opacity: 1;
}

.fade-leave-active {
  transition: opacity 0.3s ease-in;
  position: absolute; /* Важно для корректного удаления */
}

.fade-leave-to {
  opacity: 0;
}
.plus-button-style {
  padding-left: 1vw;
  padding-right: 1vw;
  padding-top: 0.7vw;
  padding-bottom: 0.7vw;
  font-size: 1.1vw;
  border-width: 1px;
  border-style: solid; /* Обязательно укажите style, чтобы border отображался */
  border-color: white; /* Исходный цвет рамки */
  color: white;
  transition:
    border-color 0.3s ease,
    transform 0.2s ease; /* Добавлена transition */
  /* transform: scale(1); /*  Добавьте это, если хотите гарантировать начальный масштаб */
}

.plus-button-style:hover {
  border-color: #007bff; /* Цвет рамки при наведении (пример: синий) */
  color: #007bff;
}
</style>
