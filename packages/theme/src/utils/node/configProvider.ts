// import { getPosts } from './posts'

const getThemeConfig = async (cfg = {}) => {
  return {
    themeConfig: {
      title: 'DDDDDDDocs',
      ...cfg
    }
  }
}

export { getThemeConfig }
