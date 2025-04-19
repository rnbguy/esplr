<script setup lang="ts">
import Breadcrumbs from '@/components/Breadcrumbs.vue';
import { useAppStore } from '@/stores/app';
const appStore = useAppStore();
</script>

<template>
  <div class="header">
    <div>
      <h3 class="header-title">
        <RouterLink class="link" to="/">
          {{ appStore.networkName }}
        </RouterLink>
      </h3>
      <Breadcrumbs />
    </div>
    <div>
      <RouterLink v-if="$route.name !== 'settings'" class="link" to="/settings">
        Settings
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.header-title {
  display: inline-block;
  margin-top: 0;
  margin-right: 6px;
  margin-bottom: 0;
  word-break: break-word;
}
</style>
