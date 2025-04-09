<script setup>
import { FormKit } from '@formkit/vue'
import axios from 'axios'
import { ref } from 'vue'
import router from '../router'

const submitted = ref(false)
const formErrors = ref({})

const submitHandler = async (data) => {
  const API = import.meta.env.VITE_API_URL
  try {
    const response = await axios.post(API + 'auth/register', data)

    if (response.data.error) {
      formErrors.value = response.data.error
    } else {
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      submitted.value = true
      formErrors.value = {}
      router.push('/')
    }
  } catch (error) {
    console.error('Ошибка при регистрации:', error)
    formErrors.value = { general: error.response.data.detail }
  }
}
</script>

<template>
  <div class="flex items-center justify-center h-screen w-screen">
    <div style="width: 50vw">
      <img src="/book1.jpg" class="object-cover w-full" style="height: 100vh" />
    </div>
    <div class="flex-grow ml-20">
      <FormKit
        type="form"
        id="registration-example"
        :form-class="submitted ? 'hide' : 'show'"
        submit-label="Register"
        @submit="submitHandler"
        :actions="false"
        incomplete-message="Введите данные"
      >
        <h1 class="font-bold" style="font-size: 3.2vw; margin-bottom: 2vw">Регистрация!</h1>
        <div class="mb-5">
          <FormKit
            type="text"
            name="name"
            label="Имя"
            placeholder="Имя"
            validation="required"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
            :validation-messages="{ required: 'Пожалуйста, введите ваше имя.' }"
          />
        </div>
        <FormKit
          type="email"
          name="email"
          label="Email"
          placeholder="Misha@example.com"
          help="Введите вашу почту"
          validation="required|email"
          label-class="text-lg"
          input-class="text-lg py-2 px-4 w-full"
          :validation-messages="{
            required: 'Пожалуйста, введите ваш email.',
            email: 'Пожалуйста, введите корректный email адрес.',
          }"
        />
        <div class="double">
          <FormKit
            type="password"
            name="password"
            label="Пароль"
            validation="required|length:6|matches:/[a-zA-Z-Z]/"
            :validation-messages="{
              required: 'Пожалуйста, введите пароль.',
              length: 'Пароль должен содержать не менее 6 символов.',
              matches: 'Пароль должен содержать хотя бы одну букву или цифру.',
            }"
            placeholder="Пароль"
            help="Введите пароль"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
          />
          <FormKit
            type="password"
            name="password_confirm"
            label="Подтвердите пароль"
            placeholder="Подтвердите пароль"
            validation="required|confirm"
            :validation-messages="{
              required: 'Пожалуйста, подтвердите пароль.',
              confirm: 'Пароли не совпадают.',
            }"
            help="Подтвердите пароль"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
          />
        </div>
        <div class="mt-5 text-left">
          <FormKit type="submit">Продолжить ></FormKit>
        </div>
      </FormKit>
      <div v-if="formErrors.general" class="text-red-500 mb-4">{{ formErrors.general }}</div>
      <router-link :to="{ path: '/login' }"
        ><div style="font-size: 1vw">Уже есть аккаунт</div></router-link
      >
      <div v-if="submitted">
        <h2 class="text-xl text-green-500">Регистрация прошла успешно!</h2>
      </div>
    </div>
  </div>
</template>
<style scoped>
h1 {
  font-size: calc(24px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
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
</style>
