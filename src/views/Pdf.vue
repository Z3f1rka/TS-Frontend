<template>
  <div class="editor-container">
    <!-- Панель инструментов слева -->
    <div class="toolbar">
      <button @click="addText">Добавить текст</button>
      <button @click="addImage">Добавить изображение</button>
      <button @click="saveScene">Сохранить</button>
      <button @click="loadScene(resData)">Загрузить</button>
    </div>

    <!-- Рабочее поле с имитацией размера A4 (595x842px, можно подогнать под нужный масштаб) -->
    <div class="canvas-container">
      <div ref="stageContainer" class="stage-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Konva from 'konva'

const stage = ref(null)
const layer = ref(null)
const stageContainer = ref(null)
var resData = {elements: []}

const saveScene = () => {
  const sceneData = JSON.parse(stage.value.toJSON())
  resData.elements = []
  sceneData.children[0].children.forEach(element => {
    if (element.className == "Text"){
      resData.elements.push(element)
    } 
  });
}

const loadScene = (sceneData) => {
  sceneData.elements.forEach(element =>{
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
      fontStyle: element.attrs.fontStyle
    });
  });

  layer.value.batchDraw();
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
  const defaultText = 'Новый текст';
  const stageCenterX = stage.value.width() / 2;
  const stageCenterY = stage.value.height() / 2;

  const textNode = new Konva.Text({
    text: data.text || defaultText,
    x: data.x || stageCenterX,
    y: data.y || stageCenterY,
    rotation: data.rotation || 0,
    fontSize: data.fontSize || 24,
    fill: data.fill || '#000000',
    id: data.id || `text-${Date.now()}`,
    draggable: true,
    fontFamily: data.fontFamily || "Arial",
    fontStyle: data.fontStyle || ""
  });

  layer.value.add(textNode)
  layer.value.draw()

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
      background: '#f0f0f0',
      border: '1px solid #ccc',
      padding: '8px 12px',
      borderRadius: '8px',
      zIndex: '1001',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
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

    toolbar.appendChild(document.createTextNode('Размер:'))
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

    document.body.appendChild(toolbar) // Конец тулбара --------------------------------------------

    const removeUI = () => {
      document.body.removeChild(textarea)
      document.body.removeChild(toolbar)
      window.removeEventListener('click', handleOutsideClick)
    }

    const applyChanges = () => {
      textNode.text(textarea.value)
      textNode.fontSize(parseInt(fontSizeInput.value))

      // Определяем комбинированный стиль для fontStyle
      const isBold = textarea.style.fontWeight === 'bold'
      const isItalic = textarea.style.fontStyle === 'italic'
      let fontStyle = 'normal'
      if (isBold && isItalic) fontStyle = 'bold italic'
      else if (isBold) fontStyle = 'bold'
      else if (isItalic) fontStyle = 'italic'
      textNode.fontStyle(fontStyle)

      // Применяем подчёркивание
      textNode.textDecoration(
        textarea.style.textDecoration.includes('underline') ? 'underline' : '',
      )

      // Сохраняем выбранный шрифт
      textNode.fontFamily(textarea.style.fontFamily || 'Roboto')
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

const addImage = () => {
  const imageObj = new Image()
  imageObj.src = 'https://konvajs.org/assets/yoda.jpg'
  imageObj.onload = () => {
    const img = new Konva.Image({
      x: 100,
      y: 100,
      image: imageObj,
      width: 150,
      height: 150,
      draggable: true,
    })
    layer.value.add(img)
    layer.value.draw()
  }
}

onMounted(() => {
  const width = 595
  const height = 842

  stage.value = new Konva.Stage({
    container: stageContainer.value,
    width,
    height,
    draggable: false,
  })

  layer.value = new Konva.Layer()
  stage.value.add(layer.value)

  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width,
    height,
    fill: '#fff',
    stroke: '#000',
    strokeWidth: 1,
  })

  layer.value.add(background)
  layer.value.draw()
})
</script>

<style scoped>
button.active {
  background-color: #ccc;
}

.editor-container {
  display: flex;
  height: 100vh;
}

/* Панель инструментов слева */
.toolbar {
  width: 200px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 10px;
  box-sizing: border-box;
}

/* Рабочая область */
.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e2e2e2;
}

/* Контейнер для Konva Stage */
.stage-container {
  background-color: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}
</style>
