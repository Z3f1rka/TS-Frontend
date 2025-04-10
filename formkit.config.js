import { defaultConfig } from '@formkit/vue'
import { rootClasses } from './formkit.theme'
import { ru } from '@formkit/i18n'


export default defaultConfig({
  config: {
    rootClasses,
  },
  locales: {
    ru: ru
  },
  locale: 'ru'
})
