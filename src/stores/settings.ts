import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SHOW_PRICES } from '@/config';

export const useSettingsStore = defineStore('settings', () => {
  const showUsdPrices = ref(SHOW_PRICES);

  function toggleShowUsdPrices() {
    showUsdPrices.value = !showUsdPrices.value;
  }

  return { showUsdPrices, toggleShowUsdPrices };
});
