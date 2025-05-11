import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SHOW_PRICES } from '@/config';
import { CACHE_INTERVAL_MINUTES } from '@/config';

let cached = null;
const localStorageSettings = localStorage.getItem('settings');
if (localStorageSettings?.length) {
  cached = JSON.parse(localStorageSettings);
}

export const useSettingsStore = defineStore('settings', () => {
  const showUsdPrices = ref(cached?.usdPrices ?? SHOW_PRICES);
  const forciblyDisabledPrices = ref(false);
  const cacheUpdateInterval = ref(cached?.cacheUpdateInterval ?? CACHE_INTERVAL_MINUTES);
  const cacheSettingsLocalStorage = ref(!!localStorageSettings?.length);

  function toggleShowUsdPrices() {
    showUsdPrices.value = !showUsdPrices.value;
  }

  function setShowUsdPrices(value: boolean) {
    showUsdPrices.value = value;
  }

  function setForciblyDisabledPrices(value: boolean) {
    forciblyDisabledPrices.value = value;
  }

  function setCacheUpdateInterval(minutes: number) {
    cacheUpdateInterval.value = minutes;
  }

  function setCacheSettingsLocalStorage(value: boolean) {
    cacheSettingsLocalStorage.value = value;
  }

  return {
    showUsdPrices,
    toggleShowUsdPrices,
    setShowUsdPrices,
    setForciblyDisabledPrices,
    forciblyDisabledPrices,
    cacheUpdateInterval,
    setCacheUpdateInterval,
    cacheSettingsLocalStorage,
    setCacheSettingsLocalStorage,
  };
});
