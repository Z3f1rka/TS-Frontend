<template>
  <div>
    <Header class="nav shadow-md z-50" :scroll="false" />
    <div class="editor-container flex flex-col h-screen bg-gray-200" style="padding-top: 8vw">
      <button
        class="absolute top-4 left-4 text-slate-100 hover:text-black bg-blue-500 rounded-lg text-center justify-center self-center"
        style="
          font-size: 2vw;
          margin-top: 6vw;
          padding: 0.2vw 0.6vw 0.2vw 0.6vw;
          transition: all 0.1 ease;
        "
        @click="goBack"
      >
        &#8592;
        <!-- Стрелка назад -->
      </button>
      <!-- Контейнер листа, он занимает всё доступное пространство, с нижним отступом чтобы не перекрывать панель инструментов -->
      <div class="sheet-container flex-grow flex justify-center items-center pb-32 bg-gray-200">
        <div ref="stageContainer" class="stage-container bg-white shadow-md z-10"></div>
        <!-- Контейнер предпросмотров -->
        <div ref="previewContainer" class="preview-container pointer-events-none"></div>

        <!-- Кнопка перехода на предыдущую страницу (слева) -->
      </div>

      <!-- Нижняя панель инструментов -->
      <div class="fixed bottom-3 left-0 right-0 flex justify-center z-20">
        <div class="toolbar flex bg-white rounded-t-xl rounded-b-xl p-4 space-x-4 shadow-md">
          <button
            class="tool-btn hover:text-black transform hover:scale-105 transition-all"
            style="font-size: 1.7vw"
            @click="prevPage"
          >
            &#8249;
          </button>
          <div class="border-r border-gray-300"></div>
          <input class="border-slate-400 border-2 rounded-md" v-model="PageName" />
          <button
            class="tool-btn hover:text-black transform hover:scale-105 transition-all"
            style="color: #007dfe"
            @click="SavePage()"
          >
            Сохранить
          </button>
          <div class="border-r border-gray-300"></div>

          <button
            class="tool-btn text-gray-700 hover:text-black transform hover:scale-105 transition-all"
            @click="addText()"
          >
            Добавить текст
          </button>
          <div class="border-r border-gray-300"></div>
          <button
            class="tool-btn text-gray-700 hover:text-black transform hover:scale-105 transition-all"
            @click="addHeader"
          >
            Добавить заголовок
          </button>
          <div class="border-r border-gray-300"></div>
          <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" />
          <button
            class="tool-btn text-gray-700 hover:text-black transform hover:scale-105 transition-all"
            @click="uploadAvatar"
          >
            Добавить изображение
          </button>
          <div class="border-r border-gray-300"></div>
          <button
            class="tool-btn text-gray-700 hover:text-black transform hover:scale-105 transition-all"
            @click="saveScene"
          >
            Скачать
          </button>
          <div class="border-r border-gray-300"></div>
          <button
            class="tool-btn text-gray-700 hover:text-black transform hover:scale-105 transition-all"
            @click="addPage"
          >
            +
          </button>
          <div class="border-r border-gray-300"></div>
          <button
            style="font-size: 1.7vw"
            class="tool-btn text-gray-700 hover:text-black transform hover:scale-105 transition-all"
            @click="nextPage"
          >
            &#8250;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header/Header.vue'
import { ref, onMounted, nextTick, watch } from 'vue'
import Konva from 'konva'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useRoute, useRouter } from 'vue-router'
import api from '@/request'
const targetWidth = ref(595)
const targetHeight = ref(842)
const router = useRouter()

const id_obj = useRoute()['query']['id']

const selectedNode = ref(null)

const stage = ref(null)
const layer = ref(null)
const stageContainer = ref(null)
const previewContainer = ref(null)
var resData = { pages: [{ elements: [] }] }

let leftPreviewContainer, rightPreviewContainer, leftPreviewImg, rightPreviewImg

var pages = ref([])

var currentPage = ref(0)

const addHeader = () => {
  // Создаем контейнер панели заголовков
  const headerPanel = document.createElement('div')
  Object.assign(headerPanel.style, {
    position: 'fixed',
    bottom: '80px', // Располагается немного выше основной панели инструментов
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #e5e7eb', // светлая рамка
    padding: '12px 16px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    zIndex: '2000',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  })

  // Создаем кнопки для выбора заголовка
  const btnLarge = document.createElement('button')
  btnLarge.textContent = 'Большой'
  const btnMedium = document.createElement('button')
  btnMedium.textContent = 'Средний'
  const btnSub = document.createElement('button')
  btnSub.textContent = 'Подзаголовок'

  // Стили для кнопок (пример, можно доработать через Tailwind классы)
  ;[btnLarge, btnMedium, btnSub].forEach((btn) => {
    Object.assign(btn.style, {
      padding: '8px 12px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      background: 'white',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, background 0.2s ease',
    })
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#f3f4f6'
      btn.style.transform = 'scale(1.05)'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'white'
      btn.style.transform = 'scale(1)'
    })
  })

  // Функция для обработки выбора заголовка:
  const selectHeader = (type) => {
    // Определяем параметры заголовка в зависимости от типа
    // Например, позиционирование — заголовок будет расположен сверху по центру,
    // поэтому x = 0, y = 20, ширина = ширина сцены, align: 'center'
    const stageWidth = stage.value.width()
    let params = {
      x: 0,
      y: 20, // отступ сверху (можно настроить)
      fontFamily: 'Arial', // или другой по умолчанию
      align: 'center',
      draggable: true,
    }
    if (type === 'large') {
      params.fontSize = 36
      params.fontStyle = 'bold'
      params.x = 190
    } else if (type === 'medium') {
      params.fontSize = 28
      params.x = 234
    } else if (type === 'sub') {
      params.fontSize = 20
      params.fontStyle = 'italic'
      params.y = 400
      params.x = 234
    }

    // Вызовем addText с этими параметрами, чтобы создать заголовок на текущей странице:
    addText(params)

    // Убираем панель
    document.body.removeChild(headerPanel)
  }

  // Обработчики кликов для кнопок
  btnLarge.addEventListener('click', () => {
    selectHeader('large')
    document.removeEventListener('mousedown', handleClickOutside)
  })
  btnMedium.addEventListener('click', () => {
    selectHeader('medium')
    document.removeEventListener('mousedown', handleClickOutside)
  })
  btnSub.addEventListener('click', () => {
    selectHeader('sub')
    document.removeEventListener('mousedown', handleClickOutside)
  })

  // Добавляем кнопки в панель
  headerPanel.appendChild(btnLarge)
  headerPanel.appendChild(btnMedium)
  headerPanel.appendChild(btnSub)

  // Добавляем панель в body
  document.body.appendChild(headerPanel)

  const handleClickOutside = (e) => {
    if (!headerPanel.contains(e.target)) {
      document.body.removeChild(headerPanel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }
  // Ставим слушатель
  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside)
  }, 0)
}

window.addEventListener('keydown', (e) => {
  if ((e.key === 'Delete' || e.key === 'Del') && selectedNode.value) {
    // Если у выбранного узла сохранён transformer, сначала удалим его
    if (selectedNode.value._transformer) {
      // Очищаем связи и удаляем transformer
      selectedNode.value._transformer.nodes([])
      selectedNode.value._transformer.destroy()
      selectedNode.value._transformer = null
    }
    // Удаляем сам узел
    selectedNode.value.remove()
    selectedNode.value = null
    layer.value.draw()
  }
})

const deleteCurrentPage = () => {
  // Если остается только одна страница - не даем удалить её
  if (pages.value.length <= 1) {
    return
  }
  // Удаляем страницу из массива
  pages.value.splice(currentPage.value, 1)
  // Если удалённая страница была последней, смещаем индекс на предыдущую страницу
  if (currentPage.value >= pages.value.length) {
    currentPage.value = pages.value.length - 1
  }
  // Загружаем новую текущую страницу
  loadPage(currentPage.value)
}

let v = ref()
let v1 = ref()
async function f1() {
  try {
    const data = await api.get(`objects/get_by_id_one?object_id=${id_obj}`)
    v.value = data
    if (data == undefined) {
      throw undefined
    }
    if (data === 1) {
      v1.value = false
    }
  } catch (err) {
    console.log(err)
    alert('Такого пользователя')
  }
}
f1()
watch(
  () => v.value,
  () => {
    pages.value = v.value.file.file
    PageName.value = v.value.title
    console.log(pages.value)
    loadPage(0)
    updatePreviews()
  },
)

const goBack = () => {
  router.go(-1)
}
const saveScene = async () => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [595, 842], // A4 в px при 72 DPI
  })

  for (let item = 0; item < pages.value.length; item++) {
    loadPage(item)
    updatePreviews()

    if (!stageContainer.value) {
      console.error('Target area not found.')
      return
    }

    try {
      const scale = 2

      const canvas = await html2canvas(stageContainer.value, {
        scale: scale,
      })

      const imgData = canvas.toDataURL('image/png')

      const width = canvas.width / scale
      const height = canvas.height / scale

      // Добавляем изображение на текущую страницу
      pdf.addImage(imgData, 'PNG', 0, 0, width, height)

      // Добавляем новую страницу, если это не последняя
      if (item < pages.value.length - 1) {
        pdf.addPage([width, height])
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  pdf.save('area.pdf')
}

const saveCurrentPage = () => {
  if (stage.value) {
    // Сохраняем текущий stage как JSON (или сохраняем объект stage, если планируете именно stage)
    pages.value[currentPage.value] = stage.value.toJSON()
    console.log(pages.value)
  }
}

const PageName = ref('')
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
const SavePage = async () => {
  saveCurrentPage()
  if (auth.value) {
    const user_id = user.value.id
    let data = {
      title: PageName.value,
      file: { file: pages.value },
      main_object_id: id_obj,
      user_id: user_id,
    }
    await api.post('objects/update', data)
    router.push({ path: '/profile', query: { id: user_id } })
  }
}

const loadPage = (index) => {
  stageContainer.value.innerHTML = ''
  console.log(stageContainer.value)
  if (pages.value[index]) {
    const newStage = Konva.Node.create(pages.value[index], stageContainer.value)
    stage.value = newStage
    layer.value = newStage.findOne('Layer')
  } else {
    createEmptyPage()
  }
  layer.value.draw()
  rebindTextEvents() // Привязываем обработчики для текстовых узлов
  rebindImageNodes()
  rebindImageEvents()
  updatePreviews()
}

const addPage = () => {
  // Сохраняем текущую страницу
  saveCurrentPage()
  // Создаем новый stage (новая страница)
  stageContainer.value.innerHTML = '' // очищаем контейнер
  const newStage = new Konva.Stage({
    container: stageContainer.value,
    width: 595,
    height: 842,
    draggable: false,
  })
  const newLayer = new Konva.Layer()
  newStage.add(newLayer)
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: 595,
    height: 842,
    fill: '#fff',
    stroke: '#000',
    strokeWidth: 1,
  })
  newLayer.add(background)
  newLayer.draw()
  // Добавляем новый stage в массив страниц
  pages.value.push(newStage.toJSON())
  currentPage.value = pages.value.length - 1
  stage.value = newStage
  layer.value = newLayer
  updatePreviews()
}

const prevPage = () => {
  if (currentPage.value > 0) {
    saveCurrentPage()
    currentPage.value--
    loadPage(currentPage.value)
    updatePreviews()
  }
}

const nextPage = () => {
  if (currentPage.value < pages.value.length - 1) {
    saveCurrentPage()
    currentPage.value++
    loadPage(currentPage.value)
    updatePreviews()
  }
}

const loadScene = (sceneData) => {
  sceneData.elements.forEach((element) => {
    addText({
      text: element.attrs.text,
      x: element.attrs.x,
      y: element.attrs.y,
      rotation: element.attrs.rotation || 0,
      fontSize: element.attrs.fontSize || 20,
      fill: element.attrs.fill || 'black',
      id: element.attrs.id || undefined,
      draggable: true,
      fontFamily: element.attrs.fontFamily,
      fontStyle: element.attrs.fontStyle,
    })
  })

  layer.value.batchDraw()
}

const availableFonts = [
  'Roboto',
  'Oswald',
  'Montserrat',
  'Pacifico',
  'Jost',
  'Bitter',
  'Ponomar',
  'Playfair Display',
  'Great Vibes',
  'Rubic Doodle Shadow',
  'Alumni Sans',
]

const addText = (data = {}) => {
  const defaultText = 'Новый текст'
  const stageCenterX = stage.value.attrs.width / 2
  const stageCenterY = stage.value.attrs.height / 2
  const textNode = new Konva.Text({
    text: data.text || defaultText,
    x: data.x || stageCenterX,
    y: data.y || stageCenterY,
    rotation: data.rotation || 0,
    fontSize: data.fontSize || 14,
    fill: data.fill || 'black',
    id: data.id || `text-${Date.now()}`,
    draggable: true,
    fontFamily: data.fontFamily || 'Arial',
    fontStyle: data.fontStyle || '',
  })
  layer.value.add(textNode)
  layer.value.draw()
  attachTextListeners(textNode)
}

const rebindTextEvents = () => {
  // Найдем все текстовые узлы в текущем слое:
  const textNodes = layer.value.find('Text')
  textNodes.forEach((node) => {
    attachTextListeners(node)
  })
  layer.value.batchDraw()
}

const attachTextListeners = (textNode) => {
  // Создаем Transformer для текстового узла
  const transformer = new Konva.Transformer({
    // Разрешаем изменение размера и вращение:
    enabledAnchors: [],
    rotateEnabled: true,
    // Дополнительные опции для стилизации (по необходимости)
    anchorSize: 8,
    borderDash: [4, 2],
    borderStroke: 'blue',
  })
  layer.value.add(transformer)
  // При клике на текстовом узле привязываем Transformer к нему
  textNode.on('click', (e) => {
    transformer.nodes([textNode])
    transformer.show()
    layer.value.draw()
    // Отмена всплытия, чтобы Transformer не снимался при клике на stage
    e.cancelBubble = true
  })
  textNode._transformer = transformer

  // При клике вне узла снимаем Transformer (если нужно, можно привязать это глобально)
  stage.value.on('click', (e) => {
    // Если клик не по самому текстовому узлу
    if (e.target !== textNode) {
      transformer.nodes([])
      layer.value.draw()
    }
  })

  // При клике по тексту:
  textNode.on('click', (e) => {
    if (selectedNode.value) selectedNode.value._transformer.nodes([])
    // Привязываем Transformer, если вы его используете – можно оставить этот код.
    transformer.nodes([textNode])
    // Устанавливаем выбранный узел
    selectedNode.value = textNode
    layer.value.batchDraw()
    e.cancelBubble = true
  })

  textNode.on('dblclick', () => {
    // Расположение с учетом абсолютных координат текстового узла
    const absPos = textNode.getAbsolutePosition()
    const stageBox = stage.value.container().getBoundingClientRect()
    // Скрываем текстовый узел и Transformer
    transformer.hide()
    textNode.hide()
    layer.value.batchDraw()

    // Создаем textarea и позиционируем её относительно absPos
    const textarea = document.createElement('textarea')
    textarea.value = textNode.text()

    Object.assign(textarea.style, {
      position: 'absolute',
      top: `${absPos.y + 104}px`,
      left: `${stageBox.left + absPos.x - 4}px`,
      fontSize: `${textNode.fontSize()}px`,
      fontFamily: textNode.fontFamily(),
      color: textNode.fill(),
      border: '1px solid #ccc',
      padding: '4px',
      background: 'white',
      outline: 'none',
      resize: 'none',
      zIndex: '1000',
      lineHeight: textNode.lineHeight().toString(),
      whiteSpace: 'nowrap',
    })
    const angle = textNode.rotation()
    textarea.style.transform = `rotate(${angle}deg)`
    // Для корректного позиционирования измените точку трансформации, например:
    textarea.style.transformOrigin = 'top left'

    const nodeFontStyle = textNode.fontStyle() // например: 'bold italic'
    const isBold = nodeFontStyle.includes('bold')
    const isItalic = nodeFontStyle.includes('italic')
    const isUnderline = textNode.textDecoration().includes('underline')

    textarea.style.fontWeight = isBold ? 'bold' : 'normal'
    textarea.style.fontStyle = isItalic ? 'italic' : 'normal'
    textarea.style.textDecoration = isUnderline ? 'underline' : 'none'
    document.body.appendChild(textarea)

    const autosizeTextarea = () => {
      textarea.style.height = 'auto'
      textarea.style.width = 'auto'
      const paddingX = 8
      const paddingY = 8
      textarea.style.height = textarea.scrollHeight + paddingY + 'px'
      textarea.style.width = textarea.scrollWidth + paddingX + 'px'
    }
    autosizeTextarea()
    textarea.addEventListener('input', autosizeTextarea)
    textarea.focus()

    // 🎛 Панель стилей
    const toolbar = document.createElement('div')
    Object.assign(toolbar.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #e5e7eb', // border-gray-200
      padding: '12px 16px',
      borderRadius: '16px',
      zIndex: '1001',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '24px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(6px)',
      fontFamily: 'sans-serif',
    })

    // Input для размера шрифта
    const fontSizeInput = document.createElement('input')
    fontSizeInput.type = 'number'
    fontSizeInput.value = textNode.fontSize().toString()
    fontSizeInput.min = '8'
    fontSizeInput.max = '100'
    fontSizeInput.style.width = '60px'

    fontSizeInput.addEventListener('input', () => {
      textarea.style.fontSize = `${fontSizeInput.value}px`
    })

    toolbar.appendChild(fontSizeInput)
    // Кнопка для жирного шрифта
    const boldBtn = document.createElement('button')
    boldBtn.textContent = 'B'
    boldBtn.style.fontWeight = 'bold'
    boldBtn.addEventListener('click', () => {
      textarea.style.fontWeight = textarea.style.fontWeight === 'bold' ? 'normal' : 'bold'
      autosizeTextarea()
    })
    toolbar.appendChild(boldBtn)

    // Кнопка для курсива
    const italicBtn = document.createElement('button')
    italicBtn.textContent = 'I'
    italicBtn.style.fontStyle = 'italic'
    italicBtn.addEventListener('click', () => {
      textarea.style.fontStyle = textarea.style.fontStyle === 'italic' ? 'normal' : 'italic'
      autosizeTextarea()
    })
    toolbar.appendChild(italicBtn)

    // Кнопка для подчёркнутого текста
    const underlineBtn = document.createElement('button')
    underlineBtn.textContent = 'U'
    underlineBtn.style.textDecoration = 'underline'
    underlineBtn.addEventListener('click', () => {
      textarea.style.textDecoration =
        textarea.style.textDecoration === 'underline' ? 'none' : 'underline'
      autosizeTextarea()
    })
    toolbar.appendChild(underlineBtn)

    const createFontSelector = () => {
      const container = document.createElement('div')
      container.style.display = 'flex'
      container.style.flexDirection = 'column'
      container.style.maxHeight = '100px'
      container.style.overflowY = 'auto'
      container.style.padding = '4px'
      container.style.border = '1px solid #ccc'
      container.style.background = 'white'

      // Поле для поиска шрифта
      const searchInput = document.createElement('input')
      searchInput.type = 'text'
      searchInput.placeholder = 'Поиск шрифта'
      searchInput.style.marginBottom = '4px'
      container.appendChild(searchInput)

      // Выпадающий список
      const selectEl = document.createElement('select')
      selectEl.size = 5 // показывать несколько вариантов
      selectEl.style.minWidth = '180px'
      container.appendChild(selectEl)

      const updateOptions = () => {
        const filter = searchInput.value.toLowerCase()
        selectEl.innerHTML = ''
        const filteredFonts = availableFonts.filter((font) => font.toLowerCase().includes(filter))
        filteredFonts.forEach((font) => {
          const option = document.createElement('option')
          option.value = font
          option.style.fontFamily = font
          option.textContent = font
          selectEl.appendChild(option)
        })
        // Если в textarea уже установлен шрифт, пробуем его выбрать
        if (textarea.style.fontFamily) {
          const opt = Array.from(selectEl.options).find(
            (opt) => opt.value === textarea.style.fontFamily,
          )
          if (opt) selectEl.value = opt.value
        }
      }
      searchInput.addEventListener('input', updateOptions)
      updateOptions()

      // При выборе шрифта обновляем textarea
      selectEl.addEventListener('change', () => {
        textarea.style.fontFamily = selectEl.value
        autosizeTextarea()
      })

      return container
    }
    const fontSelector = createFontSelector()
    toolbar.appendChild(fontSelector)

    var colorPopoverVisible = false

    const getHexColor = (color) => {
      const ctx = document.createElement('canvas').getContext('2d')
      if (ctx) {
        ctx.fillStyle = color
        return ctx.fillStyle
      }
      return color // если не удалось, вернуть исходное значение
    }

    const updateColorBtnAppearance = (colorHex) => {
      // Простейший расчёт яркости для определения цвета текста кнопки:
      const r = parseInt(colorHex.substr(1, 2), 16)
      const g = parseInt(colorHex.substr(3, 2), 16)
      const b = parseInt(colorHex.substr(5, 2), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      colorBtn.style.backgroundColor = colorHex
      colorBtn.style.color = brightness < 128 ? 'white' : 'black'
      colorBtn.textContent = 'Цвет'
    }

    const colorBtn = document.createElement('button')
    colorBtn.style.padding = '4px 8px'
    colorBtn.style.width = '100%'
    colorBtn.classList.add('rounded-md')
    updateColorBtnAppearance(getHexColor(textNode.fill()) || '#000000') // инициализация по цвету текста
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      colorPopoverVisible = !colorPopoverVisible
      colorPopover.style.display = colorPopoverVisible ? 'block' : 'none'
    })

    toolbar.appendChild(colorBtn)

    // Выпадающее меню выбора цвета (скрыто по умолчанию)
    const colorPopover = document.createElement('div')
    Object.assign(colorPopover.style, {
      display: 'none',
      position: 'absolute',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px',
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      zIndex: '1002',
    })

    // Сетка образцов цветов
    const sampleColors = [
      '#000000',
      '#ffffff',
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '#ff00ff',
      '#00ffff',
      '#808080',
      '#800000',
    ]
    const grid = document.createElement('div')
    grid.style.display = 'grid'
    grid.style.gridTemplateColumns = 'repeat(5, 30px)'
    grid.style.gridGap = '5px'
    sampleColors.forEach((col) => {
      const swatch = document.createElement('div')
      Object.assign(swatch.style, {
        backgroundColor: col,
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        border: '1px solid #ccc',
      })
      swatch.addEventListener('click', () => {
        textarea.style.color = col
        textNode.fill(col)
        updateColorBtnAppearance(col)
        hexInput.value = col
        colorWheel.value = col
      })
      grid.appendChild(swatch)
    })
    colorPopover.appendChild(grid)

    // Поле для ввода HEX кода
    const hexInput = document.createElement('input')
    hexInput.type = 'text'
    hexInput.value = getHexColor(textNode.fill() || '#000000')

    hexInput.placeholder = '#hexcode'
    hexInput.style.marginTop = '8px'
    hexInput.addEventListener('input', () => {
      let val = hexInput.value
      if (!val.startsWith('#')) val = '#' + val
      if (val.length === 7) {
        textarea.style.color = val
        textNode.fill(val)
        updateColorBtnAppearance(val)
        colorWheel.value = val
      }
    })
    colorPopover.appendChild(hexInput)

    // Color wheel (инпут типа "color")
    const colorWheel = document.createElement('input')
    colorWheel.type = 'color'
    colorWheel.style.marginTop = '8px'
    colorWheel.addEventListener('input', () => {
      const val = colorWheel.value
      textarea.style.color = val
      textNode.fill(val)
      updateColorBtnAppearance(val)
      hexInput.value = val
    })
    colorPopover.appendChild(colorWheel)
    toolbar.appendChild(colorPopover)

    const leftSection = document.createElement('div')
    leftSection.style.display = 'flex'
    leftSection.style.flexDirection = 'column'
    leftSection.style.gap = '8px'

    const rightSection = document.createElement('div')
    rightSection.style.display = 'flex'
    rightSection.style.flexDirection = 'column'
    rightSection.style.alignItems = 'flex-end'

    // Ряд 1: Изменение размера шрифта
    const row1 = document.createElement('div')
    row1.style.display = 'flex'
    row1.style.alignItems = 'center'
    row1.style.gap = '8px'
    row1.appendChild(document.createTextNode('Размер:'))
    row1.appendChild(fontSizeInput)

    // Ряд 2: Кнопки изменения стиля (жирный, курсив, подчёркивание)
    const row2 = document.createElement('div')
    row2.style.display = 'flex'
    row2.style.alignItems = 'center'
    row2.style.justifyContent = 'space-between'
    row2.appendChild(boldBtn)
    row2.appendChild(italicBtn)
    row2.appendChild(underlineBtn)

    // Ряд 3: Кнопка изменения цвета
    const row3 = document.createElement('div')
    row3.style.display = 'flex'
    row3.style.alignItems = 'center'
    row3.style.gap = '8px'
    row3.appendChild(colorBtn)

    // Добавляем ряды в левую секцию
    leftSection.appendChild(row1)
    leftSection.appendChild(row2)
    leftSection.appendChild(row3)

    // Font selector — в правую часть
    rightSection.appendChild(fontSelector)

    // Добавляем обе секции в toolbar
    toolbar.appendChild(leftSection)
    toolbar.appendChild(rightSection)

    const styleButton = (btn) => {
      Object.assign(btn.style, {
        padding: '6px 10px',
        fontSize: '14px',
        borderRadius: '8px',
        border: '1px solid #d1d5db', // gray-300
        background: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      })
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#f3f4f6' // gray-100
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'white'
      })
    }

    styleButton(boldBtn)
    styleButton(italicBtn)
    styleButton(underlineBtn)

    Object.assign(fontSizeInput.style, {
      width: '60px',
      padding: '4px 6px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
    })

    document.body.appendChild(toolbar) // Конец тулбара --------------------------------------------

    const removeUI = () => {
      document.body.removeChild(textarea)
      document.body.removeChild(toolbar)
      window.removeEventListener('click', handleOutsideClick)
    }

    const applyChanges = () => {
      textNode.fontSize(parseInt(fontSizeInput.value))

      // Определяем комбинированный стиль для fontStyle
      const isBold = textarea.style.fontWeight === 'bold'
      const isItalic = textarea.style.fontStyle === 'italic'
      let fontStyle = 'normal'
      if (isBold && isItalic) fontStyle = 'bold italic'
      else if (isBold) fontStyle = 'bold'
      else if (isItalic) fontStyle = 'italic'
      textNode.fontStyle(fontStyle)

      textNode.textDecoration(
        textarea.style.textDecoration.includes('underline') ? 'underline' : '',
      )

      textNode.fontFamily(textarea.style.fontFamily || 'Roboto')

      // Если поле пустое, устанавливаем placeholder "Введите текст" с полупрозрачным цветом
      if (textarea.value.trim() === '') {
        textNode.text('Введите текст')
        textNode.fill('rgba(0, 0, 0, 0.4)')
      } else {
        textNode.text(textarea.value)
        // При необходимости можно оставить или сбросить цвет, например:
        // textNode.fill('black')
      }

      layer.value.draw()
      removeUI()
      textNode.show()
    }

    const handleOutsideClick = (e) => {
      if (e.target !== textarea && !toolbar.contains(e.target)) {
        applyChanges()
      }
    }

    fontSizeInput.addEventListener('input', () => {
      textarea.style.fontSize = `${fontSizeInput.value}px`
      autosizeTextarea()
    })

    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        applyChanges()
      } else if (e.key === 'Escape') {
        removeUI()
      }
    })

    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick)
    })
  })
}
const fileInput = ref(null)
let fileDa = null // Переменная для хранения выбранного файла

const uploadAvatar = () => {
  fileInput.value.click()
}

const handleFileUpload = (event) => {
  fileDa = event.target.files[0] // Сохраняем файл
  addImage() // Вызываем addImage после выбора файла
}

const rebindImageNodes = () => {
  const imageNodes = layer.value.find('Image')
  imageNodes.forEach((node) => {
    const src = node.getAttr('src') // наш кастомный атрибут
    if (src) {
      const img = new Image()
      img.onload = () => {
        node.image(img)
        layer.value.batchDraw()
      }
      img.src = src
    }
  })
}

const attachImageListeners = (imgNode) => {
  // Если у узла уже есть transformer, он мог быть уничтожен или не привязан.
  // Создадим новый transformer для узла
  const transformer = new Konva.Transformer({
    node: imgNode,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    keepRatio: true, // можно изменить, если хотите независимое масштабирование
    anchorStroke: 'blue',
    anchorFill: 'white',
    anchorCornerRadius: 4,
    anchorSize: 10,
    borderStroke: 'blue',
    borderDash: [4, 2],
  })
  layer.value.add(transformer)
  imgNode._transformer = transformer
  if (selectedNode.value) selectedNode.value._transformer.nodes([])
  selectedNode.value = imgNode

  // При клике вне изображения снимаем transformer с этого узла
  stage.value.on('click', (e) => {
    const clickedNode = e.target
    console.log(selectedNode.value)
    selectedNode.value._transformer.nodes([])
    const currentNodes = transformer.nodes()

    // Если кликнутый узел не входит в список активных узлов
    if (!currentNodes.includes(clickedNode)) {
      transformer.nodes([])
      layer.value.batchDraw()
    }
  })

  imgNode.on('click', (e) => {
    if (selectedNode.value) selectedNode.value._transformer.nodes([])
    transformer.nodes([imgNode])
    selectedNode.value = imgNode
    console.log(selectedNode)
    layer.value.batchDraw()
    e.cancelBubble = true
  })
}

const rebindImageEvents = () => {
  const imgNodes = layer.value.find('Image')
  imgNodes.forEach((node) => {
    // Если необходимо, сперва удалить старые обработчики, чтобы не накладывать их повторно.
    // Затем привязать обработчики.
    attachImageListeners(node)
  })
}

const addImage = async () => {
  if (!fileDa) {
    console.warn('No file selected.')
    return
  }

  try {
    // Создаем Blob из File (необязательно)
    const blob = new Blob([fileDa], { type: fileDa.type })

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageObj = new Image()
      imageObj.onload = () => {
        const container = stageContainer.value // Убедись, что у тебя есть такой ref
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        const maxWidth = containerWidth * 0.9
        const maxHeight = containerHeight * 0.9

        const originalWidth = imageObj.width
        const originalHeight = imageObj.height

        const scaleX = maxWidth / originalWidth
        const scaleY = maxHeight / originalHeight
        const scale = Math.min(1, scaleX, scaleY)

        const newWidth = originalWidth * scale
        const newHeight = originalHeight * scale
        const img = new Konva.Image({
          x: 0,
          y: 100,
          image: imageObj,
          draggable: true,
          width: newWidth,
          height: newHeight,
        })
        layer.value.add(img)
        img.setAttr('src', imageObj.src)
        layer.value.draw()

        attachImageListeners(img)
      }
      imageObj.src = e.target.result // Data URL - ПРАВИЛЬНОЕ МЕСТО
    }
    reader.readAsDataURL(blob) // Читаем BLOB как Data URL
  } catch (error) {
    console.error('Error loading image:', error)
  }
}

const loadImagesInTempStage = (tempStage) => {
  const imageNodes = tempStage.find('Image')
  const promises = []
  imageNodes.forEach((node) => {
    const src = node.getAttr('src') // наш кастомный атрибут, который мы записывали при создании
    if (src) {
      const p = new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          node.image(img)
          resolve()
        }
        img.onerror = reject
        img.src = src
      })
      promises.push(p)
    }
  })
  return Promise.all(promises)
}

const updatePreviews = async () => {
  // Предыдущая страница
  if (currentPage.value > 0) {
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.visibility = 'hidden'
    document.body.appendChild(tempContainer)
    const tempStage = Konva.Node.create(pages.value[currentPage.value - 1], tempContainer)
    try {
      await loadImagesInTempStage(tempStage)
      const dataURL = tempStage.toDataURL()
      leftPreviewImg.src = dataURL
    } catch (err) {
      console.error('Ошибка загрузки изображений в предпросмотре:', err)
    }
    tempStage.destroy()
    document.body.removeChild(tempContainer)
    leftPreviewContainer.style.display = 'block'
  } else {
    leftPreviewContainer.style.display = 'none'
  }
  // Следующая страница
  if (currentPage.value < pages.value.length - 1) {
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.visibility = 'hidden'
    document.body.appendChild(tempContainer)
    const tempStage = Konva.Node.create(pages.value[currentPage.value + 1], tempContainer)
    try {
      await loadImagesInTempStage(tempStage)
      const dataURL = tempStage.toDataURL()
      rightPreviewImg.src = dataURL
    } catch (err) {
      console.error('Ошибка загрузки изображений в предпросмотре:', err)
    }
    tempStage.destroy()
    document.body.removeChild(tempContainer)
    rightPreviewContainer.style.display = 'block'
  } else {
    rightPreviewContainer.style.display = 'none'
  }
}

onMounted(() => {
  const width = 595
  const height = 842

  // Создаем основную страницу (stage)
  const newStage = new Konva.Stage({
    container: stageContainer.value,
    width,
    height,
    draggable: false,
  })
  const newLayer = new Konva.Layer()
  newStage.add(newLayer)
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width,
    height,
    fill: '#fff',
    stroke: '#000',
    strokeWidth: 1,
  })
  newLayer.add(background)
  newLayer.draw()

  pages.value.push(newStage.toJSON())
  currentPage.value = 0
  stage.value = newStage
  layer.value = newLayer

  // Создаем контейнеры предпросмотра и добавляем их в previewContainer
  leftPreviewContainer = document.createElement('div')
  Object.assign(leftPreviewContainer.style, {
    position: 'absolute',
    top: '40%',
    transform: 'translateY(-30%)',

    left: '50px',
    pointerEvents: 'none',
    zIndex: '0',
    display: 'none',
  })
  rightPreviewContainer = document.createElement('div')
  Object.assign(rightPreviewContainer.style, {
    position: 'absolute',
    right: '50px',
    top: '40%',
    transform: 'translateY(-30%)',
    pointerEvents: 'none',
    zIndex: '0',
    display: 'none',
  })
  leftPreviewImg = document.createElement('img')
  Object.assign(leftPreviewImg.style, {
    maxWidth: '300px',
    maxHeight: '60vh',
    border: '1px solid #ccc',
    borderRadius: '8px',
  })
  rightPreviewImg = document.createElement('img')
  Object.assign(rightPreviewImg.style, {
    maxWidth: '300px',
    maxHeight: '60vh',
    border: '1px solid #ccc',
    borderRadius: '8px',
  })
  leftPreviewContainer.appendChild(leftPreviewImg)
  rightPreviewContainer.appendChild(rightPreviewImg)
  previewContainer.value.appendChild(leftPreviewContainer)
  previewContainer.value.appendChild(rightPreviewContainer)

  updatePreviews()
})
</script>
<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.page-container {
  width: 600px; /* Задайте ширину, чтобы обрезать страницы */
  overflow: hidden;
}

.page {
  display: flex;
  transition: transform 0.1s ease-in-out; /* Добавляем плавную анимацию */
}

.page-content {
  width: 600px;
  height: 400px; /* Задайте высоту страницы */
  border: 1px solid black;
  box-sizing: border-box; /* Важно для корректного расчета ширины */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
