<script setup lang="ts">
import { computed, onMounted, ref, inject, type Ref } from 'vue';
import { Chainlink, Web3Provider } from 'micro-eth-signer/net';
import { AddressCache } from '@/cache';
import { MainPageCache } from '@/cache/mainPage';
import Checkbox from '@/components/Checkbox.vue';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = ref<Web3Provider>(provider.value);

const cashedAddresses = ref<string[]>([]);
const cache = AddressCache.getInstance();
const mainDataCache = MainPageCache.getInstance();

const settingsStore = useSettingsStore();
const appStore = useAppStore();
const priceError = ref(false);

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

const priceTryError = () => {
  settingsStore.setShowUsdPrices(false);
  settingsStore.setForciblyDisabledPrices(true);

  priceError.value = true;
  setTimeout(() => {
    priceError.value = false;
  }, 5000);

  console.warn('Chainlink error, disabling USD prices');
};

const tryPrice = async () => {
  await new Chainlink(prov.value).coinPrice('ETH');
  settingsStore.setForciblyDisabledPrices(false);
};

const handleShowUsdPrices = async () => {
  if (!settingsStore.showUsdPrices) {
    try {
      await tryPrice();
    } catch {
      return priceTryError();
    }
  }
  settingsStore.toggleShowUsdPrices();
};
</script>

<template>
  <div class="header">
    <h3>Settings</h3>
  </div>
  <div class="connected-to">
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
    <div class="warning">
      <div v-if="priceError">
        <i class="bi bi-exclamation-triangle"></i>
        Try to enable USD prices failed.
      </div>
      <div v-if="settingsStore.forciblyDisabledPrices">
        <i class="bi bi-exclamation-triangle"></i>
        USD prices were disabled because of the Ethereum node limitations.
      </div>
    </div>
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
.checkbox {
  display: flex;
  align-items: center;
}

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

.warning {
  font-size: 17px;
}

.connected-to {
  word-break: break-word;
}
</style>
