<script setup>
import { ref, onMounted, watch } from 'vue'
import Dropdown from './Dropdown.vue'
import api from '@/request'

let data1 = defineProps({
  scroll: Boolean,
  cleanmode: Boolean,
})

let user = ref(null)
let auth = ref(false)

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
f()
watch(
  () => user.value,
  () => {
    auth.value = true
  },
)

const clean = ref(data1.cleanmode ? false : true)
const Active = ref(false)
const isOpen = ref(false)
const handleClickOutside = (event) => {
  if (!event.target.closest('.modal')) {
    isOpen.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onMounted(() => {
  f()
})
</script>

<template>
  <div
    class="fixed w-full bg-gradient-to-b z-50"
    :style="
      data1.scroll
        ? { background: 'rgba(0, 0, 0, 0)' }
        : {
            background: 'oklch(98.4% 0.003 247.858)',
          }
    "
  >
    <div class="flex static">
      <header
        class="inline-flex justify-between select-none"
        style="padding-left: 2.5vw; padding-top: 1vw; padding-bottom: 1vw"
      >
        <router-link :to="{ path: '/' }">
          <div class="inline-flex items-center" style="padding-top: 1vh; padding-bottom: 1vh">
            <img src="/logo.webp" class="cursor-pointer" style="height: 3vw" />
          </div>
        </router-link>
      </header>
      <div
        class="absolute modal bg-slate-50"
        style="right: 0"
        :class="{ EnterDropRight: isOpen, LeaveDropRight: !isOpen }"
      >
        <div
          class="inline-flex items-center modal place-content-end select-none"
          style="padding-right: 1vw; margin-top: 1vw; width: 21vw"
          v-if="clean && Active"
        >
          <div
            class="justify-center hover:bg-gray-200 rounded-full cursor-pointer"
            style="padding: 1.4vw"
            @click="((isOpen = !isOpen), (Active = true))"
          >
            <img src="/arrow1.svg" style="width: 1.2vw; height: 1.2vw" />
          </div>
        </div>
        <Dropdown
          class="modal"
          v-if="Active"
          :username="user.username"
          :email="user.email"
          :img="user.avatar"
          :role="user.role"
          :id="user.id"
        />
      </div>
      <div class="inline-flex" v-if="auth">
        <div
          class="inline-flex DropDown items-center cursor-pointer select-none modal"
          style="padding-right: 1.5vw"
          @click="((isOpen = !isOpen), (Active = true))"
          v-if="clean"
        >
          <img src="/arrow.png" style="width: 1.2vw; margin-right: 0.7vw; margin-left: 1vw" />
          <img
            v-if="user.avatar"
            :src="user.avatar"
            class="rounded-full shadow-lg"
            style="width: 3.5vw; height: 3.5vw"
          />
          <img
            v-if="!user.avatar"
            src="/avatar.jpg"
            class="rounded-full shadow-lg"
            style="width: 3.5vw; height: 3.5vw"
          />
        </div>
      </div>
      <div
        v-if="!auth"
        class="content-center grid grid-rows-1 grid-cols-3 gap-2 items-center"
        style="width: 19vw; margin-right: 1vw"
      >
        <router-link class="col-span-2" :to="{ path: '/register' }"
          ><div
            class="items-center rounded-lg text-center shadow-lg"
            style="
              padding-left: 1vw;
              padding-right: 1vw;
              padding-top: 0.7vw;
              padding-bottom: 0.7vw;
              font-size: 1.1vw;
              background-color: rgba(255, 255, 255, 0.5);
            "
          >
            Регистрация
          </div>
        </router-link>
        <router-link :to="{ path: '/login' }">
          <div
            class="items-center rounded-lg text-center shadow-lg"
            style="
              padding-left: 1vw;
              padding-right: 1vw;
              padding-top: 0.7vw;
              padding-bottom: 0.7vw;
              font-size: 1.1vw;
              background-color: #007dfe;
              color: white;
            "
          >
            Вход
          </div></router-link
        >
      </div>
    </div>
  </div>
</template>
<style scoped>
.scrolled {
  background-color: pink;
}
.search-box {
  width: fit-content;
  height: fit-content;
  position: relative;
}
.input-search {
  height: 50px;
  width: 50px;
  border-style: none;
  padding: 10px;
  font-size: 18px;
  letter-spacing: 2px;
  outline: none;
  border-radius: 25px;
  transition: all 0.5s ease-in-out;
  background-color: #00a176;
  padding-right: 40px;
  color: #fff;
}
.input-search::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 100;
}
.btn-search {
  width: 50px;
  height: 50px;
  border-style: none;
  font-size: 20px;
  font-weight: bold;
  outline: none;
  cursor: pointer;
  border-radius: 50%;
  position: absolute;
  right: 0px;
  color: #ffffff;
  background-color: transparent;
  pointer-events: painted;
}
.btn-search:focus ~ .input-search {
  width: 300px;
  border-radius: 0px;
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 500ms cubic-bezier(0, 0.11, 0.35, 2);
}
.input-search:focus {
  width: 300px;
  border-radius: 0px;
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 500ms cubic-bezier(0, 0.11, 0.35, 2);
}
h1 {
  font-size: calc(68px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
}
h2 {
  font-size: calc(24px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
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
</style>
