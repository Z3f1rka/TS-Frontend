<template>
  <div>
    <Header class="nav shadow-md z-50" :scroll="false" />
    <div class="editor-container flex flex-col h-screen bg-gray-200" style="padding-top: 8vw">
      <!-- Контейнер листа, он занимает всё доступное пространство, с нижним отступом чтобы не перекрывать панель инструментов -->
      <div class="sheet-container flex-grow flex justify-center items-center pb-32 bg-gray-200">
        <div ref="stageContainer" class="stage-container bg-white shadow-md"></div>
      <!-- Контейнер предпросмотров -->
      <div ref="previewContainer" class="preview-container pointer-events-none"></div>

      <!-- Кнопка перехода на предыдущую страницу (слева) -->
      <button 
        class="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 hover:text-black hover:bg-gray-200 rounded-r-lg p-4 text-4xl focus:outline-none"
        @click="prevPage">
        &#8249;
      </button>

      <!-- Кнопка перехода на следующую страницу (справа) -->
      <button 
        class="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 hover:text-black hover:bg-gray-200 rounded-l-lg p-4 text-4xl focus:outline-none"
        @click="nextPage">
        &#8250;
      </button>

      <!-- Кнопка добавления новой страницы (справа внизу) -->
      <button 
        class="absolute right-4 bottom-4 bg-green-500 text-white hover:bg-green-600 rounded-full w-16 h-16 text-4xl flex items-center justify-center focus:outline-none"
        @click="addPage">
        +
      </button>
      </div>

      <!-- Нижняя панель инструментов -->
      <div class="fixed bottom-3 left-0 right-0 flex justify-center">
        <div class="toolbar flex bg-white rounded-t-xl rounded-b-xl p-4 space-x-4 shadow-md">
          <button
            class="tool-btn text-gray-700 hover:text-black transform hover:scale-105 transition-all"
            @click="addText()"
          >
            Добавить текст
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
            Сохранить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header/Header.vue'
import { ref, onMounted, nextTick } from 'vue'
import Konva from 'konva'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
const targetWidth = ref(595)
const targetHeight = ref(842)

const stage = ref(null)
const layer = ref(null)
const stageContainer = ref(null)
const previewContainer = ref(null)
var resData = { pages: [{elements: []}] }

let leftPreviewContainer, rightPreviewContainer, leftPreviewImg, rightPreviewImg

var pages = ref([])

var currentPage = ref(0)

const saveScene = async () => {
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
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / scale, canvas.height / scale],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / scale, canvas.height / scale)
    pdf.save('area.pdf')
  } catch (error) {
    console.error('Error generating PDF:', error)
  }
}

const saveCurrentPage = () => {
  if (stage.value) {
    // Сохраняем текущий stage как JSON (или сохраняем объект stage, если планируете именно stage)
    pages.value[currentPage.value] = stage.value.toJSON()
    console.log("save", pages.value[currentPage.value])
  }
}

const loadPage = (index) => {
  stageContainer.value.innerHTML = ''
  if (pages.value[index]) {
    const newStage = Konva.Node.create(pages.value[index], stageContainer.value)
    stage.value = newStage
    layer.value = newStage.findOne('Layer')
  } else {
    createEmptyPage()
  }
  layer.value.draw()
  rebindTextEvents()  // Привязываем обработчики для текстовых узлов
  rebindImageNodes()
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
    console.log("prev")
    saveCurrentPage()
    currentPage.value--
    loadPage(currentPage.value)
    updatePreviews()
  }
}

const nextPage = () => {
  if (currentPage.value < pages.value.length - 1) {
    console.log("next")
    saveCurrentPage()
    currentPage.value++
    loadPage(currentPage.value)
    updatePreviews()
  }
}

const loadScene = (sceneData) => {
  sceneData.elements.forEach((element) => {
    console.log(element)
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
    fontSize: data.fontSize || 24,
    fill: data.fill || 'black',
    id: data.id || `text-${Date.now()}`,
    draggable: true,
    fontFamily: data.fontFamily || 'Arial',
    fontStyle: data.fontStyle || '',
  })
  layer.value.add(textNode)
  layer.value.draw()
  console.log(textNode)
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
  // Создаем рамку для выделения и ручку вращения
  const border = new Konva.Rect({
    stroke: 'blue',
    strokeWidth: 1,
    dash: [4, 2],
    visible: false,
  })
  border.listening(false)
  layer.value.add(border)

  const rotationHandle = new Konva.Circle({
    radius: 6,
    fill: 'blue',
    stroke: 'white',
    strokeWidth: 1,
    visible: false,
    draggable: true,
  })
  layer.value.add(rotationHandle)

  // Функция обновления позиции рамки и ручки, привязанных к текущему тексту
  const updateControls = () => {
    // Получаем bounding box текста с учетом трансформаций
    const box = textNode.getClientRect({ relativeTo: layer.value })
    // Рамка — чуть больше bounding box
    border.setAttrs({
      x: box.x - 4,
      y: box.y - 4,
      width: box.width + 8,
      height: box.height + 8,
      visible: true,
    })
    // Вычисляем центр верхней границы
    const centerX = box.x + box.width / 2
    const topY = box.y
    // Ручка вращения появится над текстом на фиксированном расстоянии (например, 20px)
    const handleDistance = 20
    // Если текст уже повернут, можно скорректировать позицию (здесь для простоты используем осевой сдвиг)
    rotationHandle.setAttrs({
      x: centerX,
      y: topY - handleDistance,
      visible: true,
    })
  }

  // При одиночном клике по тексту – показываем рамку и ручку
  textNode.on('click', (e) => {
    // Не блокируем всплытие, чтобы другие элементы по-прежнему реагировали
    updateControls()
    layer.value.batchDraw()
    // Предотвращаем дальнейшую обработку, если нужно
    e.cancelBubble = true
  })

  textNode.on('dblclick', () => {
    if (textNode.text() == 'Введите текст') {
      textNode.text('')
      textNode.fill('black')
    }
    border.visible(false)
    rotationHandle.visible(false)
    layer.value.batchDraw()

    const stageBox = stage.value.container().getBoundingClientRect()

    const textarea = document.createElement('textarea')
    textNode.hide()
    textarea.value = textNode.text()
    layer.value.batchDraw()

    // Стили
    Object.assign(textarea.style, {
      position: 'absolute',
      top: `${stageBox.top + textNode.y()}px`,
      left: `${stageBox.left + textNode.x()}px`,
      width: 'auto',
      minWidth: '50px',
      maxWidth: 'none',
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
      overflowX: 'hidden',
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

    // 🔁 Автоматическая подстройка высоты
    const autosizeTextarea = () => {
      textarea.style.height = 'auto'
      textarea.style.width = 'auto'
      const paddingX = 8 // в px (left + right), соответствует padding: 4px
      const paddingY = 8

      // Используем scroll размеры, чтобы определить нужные габариты
      textarea.style.height = textarea.scrollHeight + paddingY + 'px'
      textarea.style.width = textarea.scrollWidth + paddingX + 'px'
    }

    // Первый запуск
    autosizeTextarea()

    // Подстройка при наборе текста
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
  // Обработка вращения при перетаскивании ручки
  rotationHandle.on('dragmove', () => {
    // Получаем bounding box для точного центра текста
    const box = textNode.getClientRect({ relativeTo: layer.value })
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    const dx = rotationHandle.x() - centerX
    const dy = rotationHandle.y() - centerY
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    textNode.rotation(angle)
    updateControls()
    layer.value.batchDraw()
  })

  // При перемещении текста обновляем позицию рамки и ручки
  textNode.on('dragmove', () => {
    updateControls()
    layer.value.batchDraw()
  })
  stage.value.on('click', (e) => {
    // Если клик не по текстовому узлу и не по ручке вращения:
    if (e.target !== textNode && e.target !== rotationHandle) {
      border.visible(false)
      rotationHandle.visible(false)
      layer.value.batchDraw()
    }
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
  const imageNodes = layer.value.find('Image');
  imageNodes.forEach((node) => {
    const src = node.getAttr('src'); // наш кастомный атрибут
    if (src) {
      const img = new Image();
      img.onload = () => {
        node.image(img);
        layer.value.batchDraw();
      }
      img.src = src;
    }
  });
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
        const img = new Konva.Image({
          x: 100,
          y: 100,
          image: imageObj,
          draggable: true,
        })
        layer.value.add(img)
        img.setAttr('src', imageObj.src);
        layer.value.draw()
      }
      imageObj.src = e.target.result // Data URL - ПРАВИЛЬНОЕ МЕСТО
    }
    reader.readAsDataURL(blob) // Читаем BLOB как Data URL
  } catch (error) {
    console.error('Error loading image:', error)
  }
}

const loadImagesInTempStage = (tempStage) => {
  const imageNodes = tempStage.find('Image');
  const promises = [];
  imageNodes.forEach((node) => {
    const src = node.getAttr('src'); // наш кастомный атрибут, который мы записывали при создании
    if (src) {
      const p = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          node.image(img);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
      promises.push(p);
    }
  });
  return Promise.all(promises);
};

const updatePreviews = async () => {
  // Предыдущая страница
  if (currentPage.value > 0) {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);
    const tempStage = Konva.Node.create(pages.value[currentPage.value - 1], tempContainer);
    try {
      await loadImagesInTempStage(tempStage);
      const dataURL = tempStage.toDataURL();
      leftPreviewImg.src = dataURL;
    } catch (err) {
      console.error("Ошибка загрузки изображений в предпросмотре:", err);
    }
    tempStage.destroy();
    document.body.removeChild(tempContainer);
    leftPreviewContainer.style.display = 'block';
  } else {
    leftPreviewContainer.style.display = 'none';
  }
  // Следующая страница
  if (currentPage.value < pages.value.length - 1) {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);
    const tempStage = Konva.Node.create(pages.value[currentPage.value + 1], tempContainer);
    try {
      await loadImagesInTempStage(tempStage);
      const dataURL = tempStage.toDataURL();
      rightPreviewImg.src = dataURL;
    } catch (err) {
      console.error("Ошибка загрузки изображений в предпросмотре:", err);
    }
    tempStage.destroy();
    document.body.removeChild(tempContainer);
    rightPreviewContainer.style.display = 'block';
  } else {
    rightPreviewContainer.style.display = 'none';
  }
};

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
    left: '50px',
    top: '40%',
    transform: 'translateY(-30%)',
    pointerEvents: 'none',
    zIndex: '900',
    display: 'none',
  })
  rightPreviewContainer = document.createElement('div')
  Object.assign(rightPreviewContainer.style, {
    position: 'absolute',
    right: '50px',
    top: '40%',
    transform: 'translateY(-30%)',
    pointerEvents: 'none',
    zIndex: '900',
    display: 'none',
  })
  leftPreviewImg = document.createElement('img')
  Object.assign(leftPreviewImg.style, {
    maxWidth: '300px',
    maxHeight: '90vh',
    border: '1px solid #ccc',
    borderRadius: '8px',
  })
  rightPreviewImg = document.createElement('img')
  Object.assign(rightPreviewImg.style, {
    maxWidth: '300px',
    maxHeight: '90vh',
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
