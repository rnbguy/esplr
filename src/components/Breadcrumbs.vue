<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { shortenAddr } from '@/utils/utils';
import { AddressCache } from '@/cache';

const route = useRoute();
const pageHasParams = computed(() => Object.keys(route.params).length > 0);
const cache = AddressCache.getInstance();

const addressBreadcrumb = (address: string) => {
  const saddr = shortenAddr(address);
  const section = cache.isFavoriteAddress(address) ? 'favorites' : 'address';
  return ` / ${section} / ${saddr}`;
};
</script>

<template>
  <div class="breadcrumbs">
    <span v-if="$route.name !== 'main' && $route.name !== 'settings' && $route.name !== 'address'">
      / {{ $route.name }} {{ pageHasParams ? '/' : '' }}
      {{ $route.params.tx?.length ? shortenAddr($route.params.tx as string) : '' }}
      {{ $route.params.block?.length ? $route.params.block : '' }}
    </span>

    <span v-if="$route.name === 'address'">
      {{ $route.params.address?.length ? addressBreadcrumb($route.params.address as string) : '' }}
    </span>

    <span v-if="$route.name === 'settings'"> / Settings </span>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: inline-block;
}
</style>
