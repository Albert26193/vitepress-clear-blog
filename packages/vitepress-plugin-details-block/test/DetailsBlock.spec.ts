import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DetailsBlock from '../src/DetailsBlock.vue'

describe('DetailsBlock', () => {
  describe('rendering', () => {
    it('renders collapsed by default', () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block').classes()).not.toContain('is-open')
      expect(wrapper.find('.is-open').exists()).toBe(false)
    })

    it('renders expanded when open prop is true', () => {
      const wrapper = mount(DetailsBlock, { props: { open: true } })
      expect(wrapper.find('.collapse-block').classes()).toContain('is-open')
      expect(
        wrapper.find('.collapse-block-content').attributes('aria-hidden')
      ).toBe('false')
    })

    it('renders default summary text', () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block-title').text()).toBe('Details')
    })

    it('renders custom summary prop', () => {
      const wrapper = mount(DetailsBlock, { props: { summary: 'Show more' } })
      expect(wrapper.find('.collapse-block-title').text()).toContain(
        'Show more'
      )
    })

    it('renders custom summary via named slot', () => {
      const wrapper = mount(DetailsBlock, {
        slots: { summary: '<strong>Custom</strong>' }
      })
      expect(wrapper.find('.collapse-block-title').html()).toContain(
        '<strong>Custom</strong>'
      )
    })

    it('renders default slot content', () => {
      const wrapper = mount(DetailsBlock, {
        props: { open: true },
        slots: { default: '<p>Hidden content</p>' }
      })
      expect(wrapper.find('.collapse-block-content').html()).toContain(
        '<p>Hidden content</p>'
      )
    })
  })

  describe('interaction', () => {
    it('toggles open on title click', async () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block').classes()).not.toContain('is-open')

      await wrapper.find('.collapse-block-title').trigger('click')
      expect(wrapper.find('.collapse-block').classes()).toContain('is-open')

      await wrapper.find('.collapse-block-title').trigger('click')
      expect(wrapper.find('.collapse-block').classes()).not.toContain('is-open')
    })

    it('toggles open on Enter key', async () => {
      const wrapper = mount(DetailsBlock)
      await wrapper.find('.collapse-block-title').trigger('keydown.enter')
      expect(wrapper.find('.collapse-block').classes()).toContain('is-open')
    })

    it('toggles open on Space key', async () => {
      const wrapper = mount(DetailsBlock)
      await wrapper.find('.collapse-block-title').trigger('keydown.space')
      expect(wrapper.find('.collapse-block').classes()).toContain('is-open')
    })
  })

  describe('accessibility', () => {
    it('has aria-expanded false when collapsed', () => {
      const wrapper = mount(DetailsBlock)
      expect(
        wrapper.find('.collapse-block-title').attributes('aria-expanded')
      ).toBe('false')
    })

    it('has aria-expanded true when open', () => {
      const wrapper = mount(DetailsBlock, { props: { open: true } })
      expect(
        wrapper.find('.collapse-block-title').attributes('aria-expanded')
      ).toBe('true')
    })

    it('has aria-controls referencing content id', () => {
      const wrapper = mount(DetailsBlock)
      const title = wrapper.find('.collapse-block-title')
      const content = wrapper.find('.collapse-block-content')
      expect(title.attributes('aria-controls')).toBe(content.attributes('id'))
    })

    it('has role button on title', () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block-title').attributes('role')).toBe(
        'button'
      )
    })

    it('has tabindex 0 on title for keyboard focus', () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block-title').attributes('tabindex')).toBe(
        '0'
      )
    })

    it('content has aria-hidden true when collapsed', () => {
      const wrapper = mount(DetailsBlock)
      expect(
        wrapper.find('.collapse-block-content').attributes('aria-hidden')
      ).toBe('true')
    })

    it('content has aria-hidden false when expanded', () => {
      const wrapper = mount(DetailsBlock, { props: { open: true } })
      expect(
        wrapper.find('.collapse-block-content').attributes('aria-hidden')
      ).toBe('false')
    })
  })

  describe('chevron icon', () => {
    it('renders chevron icon', () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block-icon').exists()).toBe(true)
    })

    it('has is-open class when expanded', () => {
      const wrapper = mount(DetailsBlock, { props: { open: true } })
      expect(wrapper.find('.collapse-block-icon').classes()).toContain(
        'is-open'
      )
    })

    it('does not have is-open class when collapsed', () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block-icon').classes()).not.toContain(
        'is-open'
      )
    })

    it('toggles icon class on click', async () => {
      const wrapper = mount(DetailsBlock)
      expect(wrapper.find('.collapse-block-icon').classes()).not.toContain(
        'is-open'
      )

      await wrapper.find('.collapse-block-title').trigger('click')
      expect(wrapper.find('.collapse-block-icon').classes()).toContain(
        'is-open'
      )

      await wrapper.find('.collapse-block-title').trigger('click')
      expect(wrapper.find('.collapse-block-icon').classes()).not.toContain(
        'is-open'
      )
    })
  })
})
