<template>
  <section class="vcontainer">
    <!-- 标题 -->
    <h1 class="text font-serif"> Albert's Blog</h1>

    <!-- 描述 -->
    <div class="describe">
      <p class="font-serif">能纵棹，惯乘流，长江白浪不曾忧</p>
    </div>

    <!-- 按钮 -->
    <div class="vactions">
      <!-- 主按钮 -->
      <div class="vaction">
        <a href="/guide/" class="primary">
          查看目录
          <svg viewBox="0 0 24 24" width="1.2em" height="1.2em">
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12h14m-7-7l7 7l-7 7"
            ></path>
          </svg>
        </a>
      </div>

      <!-- 次按钮 -->
      <div class="vaction">
        <span class="vaction-bg"></span>
        <a href="/guide/todo" class="secondary">
          Todo
          <svg viewBox="0 0 24 24" width="1.2em" height="1.2em">
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12h14m-7-7l7 7l-7 7"
            ></path>
          </svg>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
  /* 主页色卡 */
  .vcontainer {
    display: flex;
    margin-top: 5rem;
    flex-direction: column;
    align-items: center;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .vcontainer .text {
    font-size: 40px;
    font-weight: 700;
    line-height: 1.25;
    max-width: 375px;
    text-align: center;
    color: var(--main-page-text);
  }

  @media (min-width: 576px) {
    .vcontainer .text {
      font-size: 60px;
      max-width: 480px;
    }
  }

  @media (min-width: 768px) {
    .vcontainer .text {
      font-size: 72px;
      max-width: 580px;
    }
  }

  .vcontainer .text span {
    color: transparent;
    background-clip: text;
    background-image: linear-gradient(
      to right,
      var(--main-page-from),
      var(--main-page-to)
    );
  }

  .vcontainer .describe {
    color: var(--vp-c-text-2);
    margin-top: 2rem;
    text-align: center;
    font-size: 16px;
    line-height: 1.5rem;
    max-width: 360px;
    line-height: 1.625;
  }

  @media (min-width: 576px) {
    .vcontainer .describe {
      font-size: 24px;
      margin-top: 2.5rem;
      max-width: 480px;
      line-height: 2rem;
    }
  }

  @media (min-width: 768px) {
    .vcontainer .describe {
      max-width: 620px;
      line-height: 1.6;
      margin-top: 3rem;
    }
  }

  .vactions {
    margin-top: 2.5rem;
    margin-bottom: 2.5rem;
    display: flex;
  }

  @media (min-width: 992px) {
    .vactions {
      margin-top: 3rem;
    }
  }

  .vaction {
    position: relative;
    z-index: 1;
    margin: 0 16px;
    border: 2px solid var(--main-page-text);
    border-radius: 0.5rem;
  }

  .primary {
    display: flex;
    align-items: center;
    border-radius: 0.375rem;
    padding: 0.75rem 1.25rem;
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: var(--main-page-bg);
    background-color: var(--main-page-text);
  }

  .secondary {
    display: flex;
    align-items: center;
    border-radius: 0.375rem;
    padding: 0.75rem 1.25rem;
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: var(--main-page-text);
    background-color: var(--main-page-bg);
  }

  @media (min-width: 768px) {
    .vaction a {
      font-size: 1rem;
      line-height: 1.5rem;
    }
  }

  .vaction a svg {
    width: 0px;
    transition-duration: 0.15s;
    margin-left: 0.3rem;
  }

  .vaction a:hover svg {
    width: 1rem;
    margin-left: 0.125rem;
  }
</style>

<script setup lang="ts">
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { sitePages } from 'virtual:vitepress-analyzer'

  console.warn('pages', sitePages)
</script>
