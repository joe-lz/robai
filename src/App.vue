<script setup lang="ts">
</script>

<template>
  <Suspense>
    <RouterView />
  </Suspense>
</template>

<style>
pre {
  font-family: -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
    "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB",
    "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN",
    "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti",
    SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
}

* {
  font-size: 14px;
  padding: 0;
  margin: 0;
  box-sizing: border-box !important;
}
</style>
