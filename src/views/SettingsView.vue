<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { AddressCache } from '@/cache';
import { MainPageCache } from '@/cache/mainPage';
import Checkbox from '@/components/Checkbox.vue';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const cashedAddresses = ref<string[]>([]);
const cache = AddressCache.getInstance();
const mainDataCache = MainPageCache.getInstance();

const settingsStore = useSettingsStore();
const appStore = useAppStore();

const networkName = computed(() =>
  appStore.networkName === 'Mainnet' ? 'Ethereum Mainnet' : appStore.networkName
);

onMounted(() => {
  cashedAddresses.value = cache.allCachedAddresses();
});

const handleDisconnect = async () => {
  location.reload();
};

const handleClearCache = () => {
  cache.clear();
  mainDataCache.clear();
  cashedAddresses.value = [];
};

const handleShowUsdPrices = () => {
  settingsStore.toggleShowUsdPrices();
};
</script>

<template>
  <div class="header">
    <h3>Settings</h3>
  </div>
  <div>
    Connected to
    <b>{{ networkName }}</b
    >:
    <br />
    {{ appStore.rpcUrl }}
  </div>
  <div class="logout">
    <button class="btn btn-dark logout-button" @click="handleDisconnect">
      Disconnect <i class="bi bi-door-closed"></i>
    </button>
  </div>

  <div>
    <h4>Tokens Prices:</h4>
    <Checkbox
      @onChange="handleShowUsdPrices"
      label="Show prices in USD"
      :checked="settingsStore.showUsdPrices"
    />
  </div>

  <div>
    <h4>Addresses with cached data:</h4>
    <ul v-if="cashedAddresses.length" class="cached-list">
      <li v-for="address in cashedAddresses" :key="address">
        <RouterLink :to="`/address/${address}`">{{ address }}</RouterLink>
      </li>
    </ul>
    <div v-else>No cached data.</div>
    <button v-if="cashedAddresses.length" class="btn btn-dark" @click="handleClearCache">
      Clear cache
    </button>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout {
  margin-top: 20px;
}

.logout-button {
  color: var(--btn-red);
}

@media (prefers-color-scheme: dark) {
  .logout-button {
    color: var(--btn-red-darker);
  }
}

h4 {
  margin-bottom: 12px;
}

.cached-list {
  margin-top: 0px;
  margin-bottom: 20px;
  overflow-y: scroll;
  max-height: 325px;
}
</style>
