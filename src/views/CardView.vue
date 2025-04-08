<script setup>
import Header from '@/components/Header/Header.vue'
import { ref, watch, onMounted, computed, onBeforeUnmount } from 'vue'
import api from '@/request'
import vue3starRatings from 'vue3-star-ratings'
import 'vue3-carousel/dist/carousel.css'
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'
import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
import '/leaflet-routing-machine-3.2.12/dist/leaflet-routing-machine.js'
import '/lrm-graphhopper-1.2.0.js'
import router from '../router'
import { useRoute } from 'vue-router'

const routeId = useRoute()['query']['id']
const mapContainer = ref()
let api1 = import.meta.env.VITE_FILES_API_URL
const api_key = import.meta.env.VITE_GRAPHHOPPER_API_KEY
const map = ref()
const control = ref()
const mainData = ref()
const title = ref('')
const text = ref('')
var points = ref([])
var count = 0
const imageUrl = ref('')
const success = ref(false)
const userLat = ref(0)
const userLon = ref(0)
const load = ref(false)
const myText = ref('')
const myRating = ref(0)
const isAnswer = ref(false)
const comments = ref([])
const canComment = ref(true)
const userId = ref()

onMounted(() => {
  fetchData()
  watch(
    () => load.value,
    () => {
      success.value = true
      title.value = mainData.value.title
      text.value = mainData.value.description
      if (mainData.value.photo != 'undefined' && mainData.value.photo != null) {
        imageUrl.value =
          import.meta.env.VITE_FILES_API_URL + 'files/download/' + mainData.value.photo
      }
      if (mainData.value.content_blocks != null) {
        mainData.value.content_blocks.forEach((item) => {
          let images = []
          item.images.forEach((image) => {
            images.push({
              file: null,
              fileUrl: import.meta.env.VITE_FILES_API_URL + 'files/download/' + image,
            })
          })
          points.value.push({
            lat: item.geoposition[0],
            lon: item.geoposition[1],
            id: count,
            text: item.text,
            position: item.position,
            oldPosition: item.position,
            title: item.title,
            images: images,
          })
          count++
        })
      }
      const promise = new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            resolve({ lat: position.coords.latitude, lon: position.coords.longitude })
          })
        } else {
          resolve({ lat: 0, lon: 0 })
        }
      })
      promise.then((result) => {
        userLat.value = result.lat
        userLon.value = result.lon
        // До сюда и далее будет
        map.value = L.map(mapContainer.value).setView([userLat.value, userLon.value], 13) // setView можешь хоть 0 0 поставить
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map.value)
        control.value = L.Routing.control({
          waypoints: [],
          router: L.Routing.graphHopper(api_key, {
            urlParameters: { vehicle: 'foot', locale: 'ru' },
          }),
          language: 'ru',
          draggableWaypoints: false,
          addWaypoints: false,
        }).addTo(map.value)
        points.value.sort((a, b) => parseFloat(a.position) - parseFloat(b.position))
        control.value.setWaypoints(points.value.map((p) => L.latLng(p.lat, p.lon)))
      })
      loading.value = true
    },
  )
})

let user = ref(null)
let loading = ref(false)
const roundedRating = computed({
  get: () => Math.ceil(myRating.value),
  set: (newValue) => {
    myRating.value = newValue
  },
})

const fetchData = async () => {
  loading.value = false
  try {
    mainData.value = await api.get(`routes/get_by_main_route_id_public?route_id=${routeId}`)
    if (mainData.value == undefined) {
      throw undefined
    }
  } catch (err) {
    console.error('Ошибка при запросе к первичному эндпоинту:', err)
    try {
      mainData.value = await api.get(`routes/get_by_main_route_id_public?route_id=${routeId}`)
      if (mainData.value == undefined) {
        throw undefined
      }
    } catch (err1) {
      console.error('Ошибка при запросе к вторичному эндпоинту:', err1)
    }
  } finally {
    async function f() {
      try {
        const data = await api.get(`auth/user?user_id=${mainData.value.user_id}`)
        user.value = data
        if (data == undefined) {
          throw undefined
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
        async function f1() {
          try {
            const data1 = await api.get(
              `comments/get_all_route_public_comments?route_id=${routeId}`,
            )
            comments.value = data1
            if (data1 == undefined) {
              throw undefined
            }
            console.log(comments.value)
          } catch (err) {
            console.log(err)
          }
        }
        f1()
        watch(
          () => comments.value,
          () => {
            load.value = true
            async function validateMe() {
              let ids = []
              let me = undefined
              try {
                const data = await api.get('auth/me')
                me = data
                if (data == undefined) {
                  throw undefined
                }
                userId.value = me.id
              } catch (err) {
                console.log(err)
                canComment.value = false // не работает
              } finally {
                if (me != undefined) {
                  if (me.id == user.value.id) {
                    canComment.value = false
                  } else {
                    if (comments.value != [] && comments.value != undefined) {
                      comments.value.forEach((comment) => {
                        ids.push(comment.user.id)
                      })
                      if (ids.includes(me.id)) {
                        canComment.value = false
                      }
                    }
                  }
                }
              }
            }
            validateMe()
          },
        )
      },
    )
  }
}
async function favor() {
  try {
    const data = await api.get(`auth/favorites/fetch/other?user_id=${routeId}`)
    console.log(data.length)
    if (data.length != 0) {
      fav.value = true
    }
  } catch (err) {
    console.log(err)
  }
}
favor()
const pointsExpanded = ref({})
const togglePoint = (pointId) => {
  pointsExpanded.value[pointId] = !pointsExpanded.value[pointId]
}
async function SendComment() {
  if (myRating.value != 0) {
    try {
      await api.post('comments/create', {
        text: myText.value,
        rating: Math.ceil(myRating.value),
        answer: isAnswer.value,
        route_id: routeId,
        type: 'public',
      })
      router.go(0)
    } catch (err) {
      console.error(err)
    }
  }
}
async function sendExitData() {
  if (fav.value) {
    try {
      const data = await api.post(`auth/favorites/add?route_id=${routeId}`)
      console.log(data)
    } catch (err) {
      console.log(err)
    }
  } else {
    try {
      const data = await api.delete(`auth/favorites/delete?route_id=${routeId}`)
      console.log(data)
    } catch (err) {
      console.log(err)
    }
  }
}
async function DelComment(id) {
  try {
    const data = await api.delete(`comments/delete?comment_id=${id}`)
    router.go(0)
  } catch (err) {
    console.log('удаления нет ->', err)
  }
}
onBeforeUnmount(() => {
  sendExitData()
})
const fav = ref(false)

const showDownloadDialog = ref(false)
const showDownloadOptions = () => {
  showDownloadDialog.value = true
}
const closeDownloadOptions = () => {
  showDownloadDialog.value = false
}
const downroute = async (format) => {
  try {
    const response = await api.get(`routes/export?format=${format}&route_id=${routeId}`)
    let contentType = 'text/xml'
    if (format === 'gpx') {
      contentType = 'application/gpx+xml'
    } else if (format === 'kml') {
      contentType = 'application/vnd.google-earth.kml+xml'
    }
    const blob = new Blob([response], { type: contentType })
    const urlObject = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = urlObject
    link.setAttribute('download', `Маршрут.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(urlObject)

    closeDownloadOptions()
  } catch (error) {
    console.error('Ошибка при скачивании файла:', error)
    // Добавьте обработку ошибок (например, отображение сообщения пользователю)
  }
}
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <div class="flex-grow bg-gradient-to-b z-10 text-slate-900">
      <Header class="nav" :scroll="false" />
      <div v-if="load" style="margin-top: max(6vw, 50px)" class="grid grid-cols-5">
        <div class="col-span-2 h-screen overflow-auto">
          <div class="overflow-hidden bg-slate-200">
            <img
              v-if="mainData || mainData.photo"
              :src="api1 + 'files/download/' + mainData.photo"
              class="place-self-center"
            />
            <img v-if="!(mainData || mainData.photo)" src="/avatar.jpg" class="place-self-center" />

            <div
              v-if="showDownloadDialog"
              style="font-size: 1vw; color: #64748b; padding-right: 0.4vw; padding-top: 0.2vw"
              class="text-end bg-gray-900 bg-opacity-30"
            >
              {{ mainData.created_at.slice(0, 10) }}
            </div>
            <div
              v-else
              style="font-size: 1vw; color: #64748b; padding-right: 0.4vw; padding-top: 0.2vw"
              class="text-end"
            >
              {{ mainData.created_at.slice(0, 10) }}
            </div>
            <div style="padding: 1vw; padding-top: 0%" class="drop-shadow-lg">
              <div
                style="font-size: 2.5vw; padding: 1vw 0.2vw; padding-top: 0%"
                class="drop-shadow-lg"
              >
                {{ mainData.title }}
              </div>
              <div
                style="
                  font-size: 1.7vw;
                  min-height: 8vw;
                  width: 100%;
                  overflow: auto;
                  border: none;
                  outline: none;
                  border-radius: 5px;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  background-color: white;
                  padding: 0vw 0.5vw;
                "
              >
                {{ mainData.description }}
              </div>

              <div class="grid-cols-2 grid-rows-1 grid" style="margin: 1.5vw 0; margin-left: 0.2vw">
                <div class="inline-flex">
                  <a
                    v-if="user.avatar != null"
                    href="#"
                    class="select-none flex cursor-default"
                    role="menuitem"
                    tabindex="-1"
                    id="menu-item-0"
                    ><img :src="user.avatar" class="rounded-full" style="width: 4vw" />
                  </a>
                  <a
                    v-if="user.avatar == null"
                    href="#"
                    class="select-none flex cursor-default"
                    role="menuitem"
                    tabindex="-1"
                    id="menu-item-0"
                    ><img src="/avatar.jpg" class="rounded-full" style="width: 4vw" />
                  </a>
                  <div class="grid-rows-2">
                    <div style="font-size: 1.5vw; padding: 0 0 0 0.7vw">
                      {{ user.username }}
                    </div>
                    <div style="font-size: 0.9vw; padding: 0 0 0 0.7vw" class="text-indigo-700">
                      Автор
                    </div>
                  </div>
                </div>
                <div class="items-center justify-end inline-flex">
                  <div>
                    <vue3starRatings
                      v-model="mainData.rating"
                      :starSize="38"
                      starColor="#ff9800"
                      inactiveColor="#333333"
                      :numberOfStars="5"
                      :disableClick="true"
                    />
                  </div>
                  <button
                    @click="fav = !fav"
                    v-if="fav === false"
                    class="bg-indigo-300 text-white rounded-md shadow-md"
                    style="
                      padding-right: 0.8vw;
                      padding-left: 0.8vw;
                      padding-top: 0.8vw;
                      padding-bottom: 0.8vw;
                      margin-left: 0.5vw;
                    "
                  >
                    <img src="/favf.png" class="cursor-pointer" style="height: 1vw; width: 1vw" />
                  </button>
                  <button
                    @click="fav = !fav"
                    v-if="fav === true"
                    class="bg-slate-300 text-white rounded-md shadow-md"
                    style="
                      padding-right: 0.8vw;
                      padding-left: 0.8vw;
                      padding-top: 0.8vw;
                      padding-bottom: 0.8vw;
                      margin-left: 0.5vw;
                    "
                  >
                    <img src="/favt.png" class="cursor-pointer" style="height: 1vw; width: 1vw" />
                  </button>
                  <button
                    class="bg-slate-300 text-white rounded-md shadow-md"
                    style="
                      padding-right: 0.8vw;
                      padding-left: 0.8vw;
                      padding-top: 0.8vw;
                      padding-bottom: 0.8vw;
                      margin-left: 0.5vw;
                    "
                    @click="showDownloadOptions"
                  >
                    <img src="/down.png" class="cursor-pointer" style="height: 1vw" />
                  </button>
                  <div
                    v-if="showDownloadDialog"
                    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-30 flex items-center justify-center"
                  >
                    <div class="bg-white rounded-md p-4">
                      <p style="margin-bottom: 0.5vw; font-size: 1.1vw">
                        Выберите формат файла для скачивания:
                      </p>
                      <button
                        @click="downroute('gpx')"
                        class="bg-green-500 text-white rounded-md"
                        style="padding: 0.5vw 1vw; margin-right: 0.5vw; font-size: 1.1vw"
                      >
                        GPX
                      </button>
                      <button
                        @click="downroute('kml')"
                        class="bg-blue-500 text-white rounded-md"
                        style="padding: 0.5vw 1vw; margin-right: 0.5vw; font-size: 1.1vw"
                      >
                        KML
                      </button>
                      <button
                        @click="closeDownloadOptions"
                        class="bg-red-500 text-white rounded-md"
                        style="padding: 0.5vw 1vw; margin-right: 0.5vw; font-size: 1.1vw"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-for="point in points"
              :key="point.id"
              class="bg-slate-100"
              style="padding-bottom: 0"
            >
              <div class="border-b border-slate-500">
                <div class="bg-slate-100 border-slate-400" style="padding-bottom: 3vw">
                  <div style="padding: 1vw">
                    <div
                      class="cursor-pointer"
                      style="display: flex; justify-content: space-between; align-items: center"
                      @click="togglePoint(point.id)"
                    >
                      <div class="drop-shadow-lg">
                        <div
                          v-if="point.title != ''"
                          style="font-size: 1.8vw; margin-top: 0.5vw; padding-left: 0.3vw"
                        >
                          {{ point.title }}
                        </div>
                        <div
                          v-else
                          style="font-size: 1.8vw; margin-top: 0.5vw; padding-left: 0.3vw"
                          class="drop-shadow-lg"
                        >
                          Точка
                        </div>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        style="width: 1.5vw; height: 1.5vw; transition: transform 0.3s ease"
                        :class="{ 'rotate-180': pointsExpanded[point.id] }"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </div>

                    <div
                      class="collapsible-content"
                      :class="{ expanded: pointsExpanded[point.id] }"
                      style="
                        overflow: hidden;
                        transition: all 0.3s ease-out;
                        transform-origin: top center;
                      "
                      :style="{
                        height: pointsExpanded[point.id] ? 'auto' : '0',
                        opacity: pointsExpanded[point.id] ? 1 : 0,
                        transform: pointsExpanded[point.id] ? 'translateY(0)' : 'translateY(-10px)',
                      }"
                    >
                      <div class="text-center" v-if="point.image != ''" style="margin-top: 2vw">
                        <Carousel :items-to-show="1.9" :wrap-around="true">
                          <Slide v-for="image in point.images" :key="image.fileUrl">
                            <div class="carousel__item">
                              <img
                                class="bg-no-repeat bg-cover h-full rounded-lg"
                                style="height: 15vw"
                                :src="image.fileUrl"
                              />
                            </div>
                          </Slide>
                          <template #addons>
                            <Navigation />
                            <Pagination />
                          </template>
                        </Carousel>
                      </div>

                      <div
                        style="
                          font-size: 1.2vw;
                          min-height: 6vw;
                          width: 100%;
                          overflow: auto;
                          border: none;
                          outline: none;
                          border-radius: 5px;
                          white-space: pre-wrap;
                          word-wrap: break-word;
                          background-color: white;
                          padding: 0vw 0.5vw;
                          margin-top: 1vw;
                          padding-left: 0.3vw;
                        "
                      >
                        {{ point.text }}
                      </div>
                      <div
                        class="inline-flex text-slate-600"
                        style="font-size: 0.9vw; padding-left: 0.3vw"
                      >
                        <div style="margin-right: 1vw">Номер {{ point.position }}</div>
                        <div style="margin-right: 1vw">{{ point.lat }}</div>
                        <div>{{ point.lon }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 grid" style="padding-bottom: 2vw">
            <p style="font-size: 1.5vw; margin: 0.5vw 1vw">Отзывы</p>
            <div style="margin: 1.5vw 1vw; margin-top: 0.5vw" v-if="canComment">
              <textarea
                placeholder="Введите текст"
                class="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style="min-height: 5vw; font-size: 1.2vw; padding: 0.3vw"
                v-model="myText"
              ></textarea>
              <div class="flex justify-between" style="margin: 0.3vw">
                <vue3starRatings
                  v-model="roundedRating"
                  :starSize="32"
                  starColor="#ff9800"
                  inactiveColor="#333333"
                  :numberOfStars="5"
                />
                <div class="flex justify-center">
                  <input
                    type="checkbox"
                    class="custom-checkbox"
                    id="happy"
                    name="happy"
                    value="yes"
                    v-model="isAnswer"
                  />
                  <label for="happy">Я прошел маршрут</label>
                </div>
              </div>
              <div class="flex justify-end">
                <div
                  class="rounded-lg cursor-pointer text-white bg-indigo-600 active:scale-95 text-center"
                  @click="SendComment"
                  style="
                    padding-bottom: 0.5vw;
                    padding-top: 0.5vw;
                    padding-left: 0.8vw;
                    padding-right: 0.8vw;
                    font-size: 1.1vw;
                    transition: transform 0.1s ease;
                    width: 15vw;
                  "
                >
                  Оставить отзыв
                </div>
              </div>
            </div>
            <div>
              <div v-for="comment in comments" :key="comment.id">
                <div
                  class="border-2 rounded-lg border-slate-300"
                  style="
                    padding: 1.5vw 0.8vw;
                    padding-bottom: 0.3vw;
                    margin: 0.1vw 0.3vw;
                    margin-bottom: 0.8vw;
                  "
                >
                  <div class="flex justify-between">
                    <div class="inline-flex">
                      <a
                        v-if="comment.user.avatar != null"
                        href="#"
                        class="select-none flex cursor-default"
                        role="menuitem"
                        tabindex="-1"
                        id="menu-item-0"
                        ><img :src="comment.user.avatar" class="rounded-full" style="width: 4vw" />
                      </a>
                      <a
                        v-if="comment.user.avatar == null"
                        href="#"
                        class="select-none flex cursor-default"
                        role="menuitem"
                        tabindex="-1"
                        id="menu-item-0"
                        ><img src="/avatar.jpg" class="rounded-full" style="width: 4vw" />
                      </a>
                      <div class="grid-rows-2">
                        <div style="font-size: 1.5vw; padding: 0 0 0 0.7vw">
                          {{ comment.user.username }}
                        </div>
                        <div
                          style="font-size: 0.9vw; padding: 0 0 0 0.7vw"
                          class="text-indigo-700"
                          v-if="comment.user.role == 'admin' || comment.user.role == 'moderator'"
                        >
                          Модератор
                        </div>
                      </div>
                    </div>
                    <div class="justify-end self-center" v-if="comment.type == 'public'">
                      <vue3starRatings
                        v-model="comment.rating"
                        :starSize="32"
                        starColor="#ff9800"
                        inactiveColor="#333333"
                        :numberOfStars="5"
                        :disableClick="true"
                      />
                      <div
                        v-if="comment.answer"
                        class="text-right text-slate-600"
                        style="margin-top: 0.3vw; font-size: 1vw"
                      >
                        Прошел маршрут
                      </div>
                    </div>
                  </div>
                  <div v-if="comment.user.id === userId">
                    <div
                      class="border-2 border-slate-300"
                      style="
                        font-size: 1.2vw;
                        border-radius: 5px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        background-color: white;
                        padding: 0vw 0.5vw;
                        margin: 1.5vw 0.3vw;
                        margin-bottom: 0.8vw;
                        padding-left: 0.3vw;
                      "
                    >
                      {{ comment.text }}
                    </div>
                    <div class="flex justify-end">
                      <div
                        class="rounded-lg cursor-pointer text-slate-100 active:scale-95"
                        style="
                          padding-bottom: 0.5vw;
                          padding-top: 0.5vw;
                          padding-left: 0.8vw;
                          padding-right: 0.8vw;
                          margin-bottom: 0.8vw;
                          margin-right: 0.3vw;
                          font-size: 1.1vw;
                          background-color: crimson;
                          transition: transform 0.1s ease;
                        "
                        @click="DelComment(comment.id)"
                      >
                        Удалить
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="border-2 border-slate-300"
                    style="
                      font-size: 1.2vw;
                      border-radius: 5px;
                      white-space: pre-wrap;
                      word-wrap: break-word;
                      background-color: white;
                      padding: 0vw 0.5vw;
                      margin-bottom: 0;
                      margin: 1.5vw 0.3vw;
                      padding-left: 0.3vw;
                    "
                  >
                    {{ comment.text }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full h-screen col-span-3 z-0">
          <div ref="mapContainer" style="width: 100%; height: 100%"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.collapsible-content {
  height: 0;
  overflow: hidden;
  transition: all 0.2s ease-out; /* Smooth transition for all properties */
  opacity: 0; /* Initially hidden */
  transform: translateY(-10px); /* Start slightly above */
  transform-origin: top center; /* Animate from the top */
}

.collapsible-content.expanded {
  height: auto; /* Adjust dynamically */
  opacity: 1; /* Fade in */
  transform: translateY(0); /* Slide to final position */
}
.custom-checkbox {
  z-index: -1;
  opacity: 0;
}
.custom-checkbox + label {
  display: inline-flex;
  align-items: center;
  user-select: none;
}
.custom-checkbox + label::before {
  content: '';
  display: inline-block;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  flex-grow: 0;
  border: 1px solid #adb5bd;
  border-radius: 0.25em;
  margin-right: 0.5em;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 50% 50%;
}
.custom-checkbox:checked + label::before {
  border-color: #0b76ef;
  background-color: #0b76ef;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23fff' d='M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z'/%3e%3c/svg%3e");
}
/* стили при наведении курсора на checkbox */
.custom-checkbox:not(:disabled):not(:checked) + label:hover::before {
  border-color: #b3d7ff;
}
/* стили для активного состояния чекбокса (при нажатии на него) */
.custom-checkbox:not(:disabled):active + label::before {
  background-color: #b3d7ff;
  border-color: #b3d7ff;
}
/* стили для чекбокса, находящегося в фокусе */
</style>
