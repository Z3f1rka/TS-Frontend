<script setup>
import Header from '@/components/Header/Header.vue'
import { ref, onMounted } from 'vue'
import { FormKit } from '@formkit/vue'
import api from '@/request'

const submitted = ref(false)
const formErrors = ref({})

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

const handleSubmit = async (data) => {
  submitted.value = false
  formErrors.value = {}
  try {
    await f()
    data['email'] = user._rawValue.email
    console.log(data)
    const response = await api.post(`auth/feedback`, data)

    if (response === null) {
      submitted.value = true
    } else {
      formErrors.value = response.data.error
    }
  } catch (error) {
    // Обработка ошибок при отправке
    if (error.response && error.response.data && error.response.data.errors) {
      formErrors.value = error.response.data.errors
    } else {
      formErrors.value.general = 'Произошла ошибка при отправке сообщения. Попробуйте позже.'
      console.error('Ошибка при отправке:', error) // Логируем ошибку для отладки
    }
  }
}
</script>
<template>
  <div>
    <Header class="nav shadow-md" :scroll="false" />
    <div class="container mx-auto">
      <h1
        class="font-bold text-center"
        style="font-size: 3.2vw; padding: 4vw; padding-top: max(40px, 9vw); padding-bottom: 2vw"
      >
        Обратная связь
      </h1>
      <div class="flex place-content-between text-center">
        <div class="self-center" style="margin-left: 2vw">
          <FormKit
            type="form"
            id="feedback-form"
            @submit="handleSubmit"
            :actions="false"
            incomplete-message=" "
          >
            <FormKit
              type="textarea"
              name="text"
              placeholder="Ваше сообщение"
              validation="required"
              label-class="text-lg"
              input-class="text-lg w-full"
              style="height: 10vw; width: 35vw"
              :validation-messages="{ required: 'Пожалуйста, введите ваше сообщение.' }"
            />

            <div v-if="formErrors.general" class="text-red-500">{{ formErrors.general }}</div>
            <FormKit type="submit" label="Отправить" style="margin-top: 1vw" />

            <div v-if="submitted" class="mt-4">
              <h2 class="text-xl" style="color: #007dfe">Сообщение успешно отправлено!</h2>
            </div>
          </FormKit>
        </div>
        <div><img src="/feed.jpg" style="width: 35vw; height: 35vw" class="object-cover" /></div>
      </div>
    </div>
  </div>
</template>
