import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SHOW_PRICES } from '@/config';

export const useSettingsStore = defineStore('settings', () => {
  const showUsdPrices = ref(SHOW_PRICES);
  const forciblyDisabledPrices = ref(false);

  function toggleShowUsdPrices() {
    showUsdPrices.value = !showUsdPrices.value;
  }

  function setShowUsdPrices(value: boolean) {
    showUsdPrices.value = value;
  }

  function setForciblyDisabledPrices(value: boolean) {
    forciblyDisabledPrices.value = value;
  }

  return {
    showUsdPrices,
    toggleShowUsdPrices,
    setShowUsdPrices,
    setForciblyDisabledPrices,
    forciblyDisabledPrices,
  };
});
