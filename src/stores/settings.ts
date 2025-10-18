import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SHOW_PRICES, SHOW_IMAGES } from '@/config';
import { CACHE_INTERVAL_MINUTES } from '@/config';

let cached = null;
const localStorageSettings = localStorage.getItem('settings');
if (localStorageSettings?.length) {
  cached = JSON.parse(localStorageSettings);
}

const SOURCIFY_URL = import.meta.env.VITE_SOURCIFY_URL || '';
const localStorageSourcifyUrl = localStorage.getItem('sourcifyUrl') ?? '';
if (SOURCIFY_URL.length && localStorageSourcifyUrl.length) {
  localStorage.removeItem('sourcifyUrl');
}
const initialSourcifyUrl = SOURCIFY_URL.length ? SOURCIFY_URL : localStorageSourcifyUrl;

export const useSettingsStore = defineStore('settings', () => {
  const showUsdPrices = ref(cached?.usdPrices ?? SHOW_PRICES);
  const forciblyDisabledPrices = ref(false);
  const cacheUpdateInterval = ref(cached?.cacheUpdateInterval ?? CACHE_INTERVAL_MINUTES);
  const cacheSettingsLocalStorage = ref(!!localStorageSettings?.length);
  const sourcifyUrl = ref(initialSourcifyUrl);
  const showImages = ref(cached?.showImages ?? SHOW_IMAGES);

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

  function setSourcifyUrl(url: string) {
    sourcifyUrl.value = url;
  }

  function toggleShowImages() {
    showImages.value = !showImages.value;
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
    sourcifyUrl,
    setSourcifyUrl,
    showImages,
    toggleShowImages,
  };
});
