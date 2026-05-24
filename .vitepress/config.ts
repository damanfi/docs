import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Daman',
  description: 'Slash-bonded copy-trading on Arc, with permissionless agent-mesh participation.',
  base: '/docs/',
  cleanUrls: true,
  appearance: 'dark',
  srcExclude: ['README.md', '**/.*.md', 'launch/**', 'internal/**'],
  head: [
    ['link', { rel: 'icon', href: '/docs/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#ffb300' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Storefront', link: 'https://damanfi.github.io/app/' },
      { text: 'GitHub', link: 'https://github.com/damanfi' },
    ],
    sidebar: [
      {
        text: 'Start',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Participate', link: '/PARTICIPATE' },
          { text: 'Architecture decision record 001', link: '/ADR-001' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Citations', link: '/CITATIONS' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/damanfi' },
    ],
    footer: {
      message: 'Apache-2.0.',
      copyright: 'Daman Protocol. First deployment of an open standard for slash-bonded copy-trading.',
    },
    search: {
      provider: 'local',
    },
  },
})
