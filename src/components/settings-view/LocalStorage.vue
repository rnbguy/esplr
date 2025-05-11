<script setup lang="ts">
import { ref, computed } from 'vue';
import Checkbox from '@/components/Checkbox.vue';
import { MainPageCache } from '@/cache/main-page/main-page';
import { AddressCache } from '@/cache/address/address';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();
const cacheTypeMainPage = ref(MainPageCache.getStrategyType());
const cacheTypeAddressPage = ref(AddressCache.getStrategyType());
const warning = ref(false);

const cacheInLocalStorage = computed(
  () => cacheTypeMainPage.value === 'localstorage' && cacheTypeAddressPage.value === 'localstorage'
);

const switchCache = () => {
  try {
    switchLocalStorageCache();
    if (isSettingsInLocalStorage()) {
      updateSettingsInLocalStorage();
    }
  } catch (error) {
    localStorage.clear();
    showWarning();
    console.error('Error switching cache:', error);
    MainPageCache.useMemoryStorage();
    AddressCache.useMemoryStorage();
  }
};

const switchLocalStorageCache = () => {
  warning.value = false;
  let cacheTypeMain = MainPageCache.getStrategyType();
  let cacheTypeAddress = AddressCache.getStrategyType();

  if (cacheTypeMain !== cacheTypeAddress) {
    console.log(
      'Warning: Address cache and main page cache have different storage types. This may cause issues.'
    );
    MainPageCache.useMemoryStorage();
    AddressCache.useMemoryStorage();
    localStorage.clear();
    showWarning();
    return;
  }

  if (cacheTypeMain === 'memory') {
    MainPageCache.useLocalStorage();
    AddressCache.useLocalStorage();
  } else {
    MainPageCache.useMemoryStorage();
    AddressCache.useMemoryStorage();
  }

  cacheTypeMain = MainPageCache.getStrategyType();
  cacheTypeAddress = AddressCache.getStrategyType();

  if (cacheTypeMain !== cacheTypeAddress) {
    console.log(
      'Warning: Address cache and main page cache have different storage types. This may cause issues.'
    );
    MainPageCache.useMemoryStorage();
    AddressCache.useMemoryStorage();
    localStorage.clear();
    showWarning();
    return;
  }

  cacheTypeMainPage.value = cacheTypeMain;
  cacheTypeAddressPage.value = cacheTypeAddress;
};

const showWarning = () => {
  warning.value = true;
  setTimeout(() => {
    warning.value = false;
  }, 7000);
};

const isSettingsInLocalStorage = () => !!localStorage.getItem('settings')?.length;

const switchLocalStorageSettings = () => {
  if (isSettingsInLocalStorage()) {
    localStorage.removeItem('settings');
  } else {
    const settings = {
      localStorage: {
        cache: cacheInLocalStorage.value,
        settings: true,
      },
      usdPrices: settingsStore.showUsdPrices,
      cacheUpdateInterval: settingsStore.cacheUpdateInterval,
    };
    localStorage.setItem('settings', JSON.stringify(settings));
  }

  settingsStore.setCacheSettingsLocalStorage(isSettingsInLocalStorage());
};

const updateSettingsInLocalStorage = () => {
  const settings = {
    localStorage: {
      cache:
        AddressCache.getStrategyType() === 'localstorage' &&
        MainPageCache.getStrategyType() === 'localstorage',
      settings: true,
    },
    usdPrices: settingsStore.showUsdPrices,
    cacheUpdateInterval: settingsStore.cacheUpdateInterval,
  };
  localStorage.setItem('settings', JSON.stringify(settings));
};
</script>

<template>
  <div>
    <h4>Local storage</h4>
    <div class="description">
      <p>
        Cached data and app settings may be available after page reload and stored in the
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
          target="_blank"
          >browser's local storage</a
        >
        on disk.
      </p>
      <div>Use local storage for:</div>
      <Checkbox @onChange="switchCache" label="Cache" :checked="cacheInLocalStorage" />
      <br />
      <Checkbox
        @onChange="switchLocalStorageSettings"
        label="Settings"
        :checked="settingsStore.cacheSettingsLocalStorage"
      />
    </div>
    <p v-if="warning" class="warning">
      <i class="bi bi-exclamation-triangle"></i>
      Something went wrong. Local storage was cleared, and cache settings were returned to default.
      Please try again or reload the page.
    </p>
  </div>
</template>
