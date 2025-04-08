<template>
  <div class="editor-container">
    <!-- Панель инструментов слева -->
    <div class="toolbar">
      <button @click="addText">Добавить текст</button>
      <button @click="addImage">Добавить изображение</button>
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

const addText = () => {
  const textNode = new Konva.Text({
    x: 50,
    y: 50,
    text: 'Дважды кликни,\nчтобы редактировать',
    fontSize: 20,
    fontFamily: 'Arial',
    fill: 'black',
    wrap: 'word',
    draggable: true
  })

  layer.value.add(textNode)
  layer.value.draw()

  textNode.on('dblclick', () => {
    const stageBox = stage.value.container().getBoundingClientRect()

    const textarea = document.createElement('textarea')
textarea.value = textNode.text()

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
    toolbar.style.position = 'absolute'
    toolbar.style.left = `${stageBox.left + textNode.x()}px`
    toolbar.style.top = `${stageBox.top + textNode.y() - 40}px`
    toolbar.style.background = '#f0f0f0'
    toolbar.style.border = '1px solid #ccc'
    toolbar.style.padding = '5px 10px'
    toolbar.style.borderRadius = '6px'
    toolbar.style.zIndex = '1001'
    toolbar.style.display = 'flex'
    toolbar.style.gap = '8px'
    toolbar.style.alignItems = 'center'
    toolbar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)'

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
    })
    toolbar.appendChild(boldBtn)

    // Кнопка для курсива
    const italicBtn = document.createElement('button')
    italicBtn.textContent = 'I'
    italicBtn.style.fontStyle = 'italic'
    italicBtn.addEventListener('click', () => {
      textarea.style.fontStyle = textarea.style.fontStyle === 'italic' ? 'normal' : 'italic'
    })
    toolbar.appendChild(italicBtn)

    // Кнопка для подчёркнутого текста
    const underlineBtn = document.createElement('button')
    underlineBtn.textContent = 'U'
    underlineBtn.style.textDecoration = 'underline'
    underlineBtn.addEventListener('click', () => {
      textarea.style.textDecoration = textarea.style.textDecoration === 'underline' ? 'none' : 'underline'
    })
    toolbar.appendChild(underlineBtn)
    document.body.appendChild(toolbar)

    const removeUI = () => {
      document.body.removeChild(textarea)
      document.body.removeChild(toolbar)
      window.removeEventListener('click', handleOutsideClick)
    }

    const applyChanges = () => {
      textNode.text(textarea.value)
      textNode.fontSize(parseInt(fontSizeInput.value))
      layer.value.draw()
      removeUI()
    }

    const handleOutsideClick = (e) => {
      if (e.target !== textarea &&
          e.target !== fontSizeInput &&
          e.target !== boldBtn &&
          e.target !== italicBtn &&
          e.target !== underlineBtn && 
          e.target !== toolbar) {
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
      draggable: true
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
    draggable: false
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
    strokeWidth: 1
  })

  layer.value.add(background)
  layer.value.draw()
})
</script>

<style scoped>
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
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
}
</style>
