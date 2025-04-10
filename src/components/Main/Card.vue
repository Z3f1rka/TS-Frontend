<script setup>
import router from '@/router'
import { ref } from 'vue'

let api = import.meta.env.VITE_FILES_API_URL

let data = defineProps({
  card: Object,
  size: String,
})

const isHovered = ref(false)

const handleMouseOver = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}
</script>
<template>
  <div
    style="
      width: 20vw;
      height: 25vw;
      margin-left: 2vw;
      margin-top: 1.5vw;
      transition: transform 0.1s ease;
    "
    class="relative justify-center cursor-pointer overflow-hidden z-10 select-none active:scale-95 shadow-lg"
    :style="data.size === 1 ? { width: '20vw', height: '25vw' } : { width: '12vw', height: '17vw' }"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
  >
    <div v-if="data.size != 1">
      <img
        v-if="data.card.file != undefined && data.card.file != null && data.card.file != ''"
        src="/fileS.jpg"
        class="w-full h-full object-cover"
      />
    </div>
    <div v-if="data.size === 1">
      <img
        v-if="
          data.card.object.file != undefined &&
          data.card.object.file != null &&
          data.card.object.file != ''
        "
        src="/fileS.jpg"
        class="w-full h-full object-cover"
      />
    </div>
    <div
      v-if="
        (data.size === 2 && data.card.file === undefined) ||
        data.card.file === null ||
        data.card.file === ''
      "
    >
      <img src="/fileS.jpg" class="w-full h-full object-cover" />
    </div>
    <div v-if="data.size === 3">
      <img src="/what.png" class="w-full h-full object-cover" />
    </div>
    <div v-if="data.size === 2" class="absolute bottom-0 w-full content-center desc">
      <h1
        style="font-size: 0.8vw; margin-left: 1vw; margin-right: 2vw; transition: opacity 2s ease"
        class="content-center truncate"
      >
        {{ data.card.title }}
      </h1>
      <!--
      <img
        v-if="data.card.status === 'public' || data.card.status == undefined"
        src="/arrow1.svg"
        style="width: 1.6vw; margin-right: 2vw; margin-top: 1.3vw"
        class="absolute right-0"
      />
      <img
        v-else
        src="/cross.png"
        style="width: 2vw; margin-right: 2vw; margin-top: 1.3vw"
        class="absolute right-0"
      />-->
    </div>
    <div v-if="data.size === 1" class="absolute bottom-0 w-full content-center desc">
      <h1
        style="font-size: 1vw; margin-left: 1vw; margin-right: 2vw; transition: opacity 2s ease"
        class="content-center truncate"
      >
        {{ data.card.object.title }}
      </h1>
      <!--
      <img
        v-if="data.card.status === 'public' || data.card.status == undefined"
        src="/arrow1.svg"
        style="width: 1.6vw; margin-right: 2vw; margin-top: 1.3vw"
        class="absolute right-0"
      />
      <img
        v-else
        src="/cross.png"
        style="width: 2vw; margin-right: 2vw; margin-top: 1.3vw"
        class="absolute right-0"
      />-->
    </div>
  </div>
</template>
<style scoped>
.desc {
  transition: all 0.6s ease;
  height: 4vw;
  background-color: rgba(15, 15, 15, 0.6);
  padding: 1vw;
  color: #fffaf4;
}
.to-bottom {
  background-position: 50% 0%;
}
.center-right-left,
.to-left,
.to-right {
  background-size: 0% 100%;
}
.center-top-bottom,
.to-top,
.to-bottom {
  background-size: 100% 0%;
}
.to-top {
  background-position: 50% 100%;
}

@keyframes pulseForward {
  0% {
    height: 10vw;
  }
  100% {
    height: 30vw;
    background-color: white;
  }
}

@keyframes pulseBackward {
  0% {
    height: 30vw;
    background-color: white;
  }
  100% {
    height: 6vw;
    background-color: rgba(15, 15, 15, 0.6);
  }
}
</style>
