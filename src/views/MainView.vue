<script setup lang="ts">
import { onMounted, ref, inject, type Ref, watch } from 'vue';
import { Web3Provider, Chainlink } from 'micro-eth-signer/net';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';

import { APP_DESC, CACHE_INTERVAL_MINUTES } from '@/config';
import { useSettingsStore } from '@/stores/settings';
import { AddressCache } from '@/cache';
import { MainPageCache } from '@/cache/mainPage';
import type { TxInfoExtended, OtsSearchTransactionExtended } from '@/types';
import {
  fromWeiToGwei,
  roundToTwo,
  hasMinutesPassed,
  formatTimestampLocalWithoutYear,
} from '@/utils/utils';
import {
  getGasPriceWei,
  getLastBlocksBefore,
  getLastTransactions,
  getLastTxnsByAddresses,
} from '@/utils/network';
import BasicInfo from '@/components/main-view/BasicInfo.vue';
import LastBlocks from '@/components/main-view/LastBlocks.vue';
import LastTxns from '@/components/main-view/LastTxns.vue';
import Favorites from '@/components/main-view/Favorites.vue';

const settingsStore = useSettingsStore();

const gasPriceGwei = ref('');
const maxPriorityFeeGwei = ref('');
const lastBlocks = ref<BlockInfo[]>([]);
const lastTxns = ref<TxInfoExtended[]>([]);
const updatedTimestamp = ref(Date.now());
const ethPrice = ref(0);

const LAST_BLOCKS_COUNT = 5;
const LAST_TXNS_COUNT = 5;
const GAS_PRICE_PRECISION = 9;

const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = ref<Web3Provider>(provider.value);

const favoriteTxns = ref<OtsSearchTransactionExtended[]>([]);
const favoriteAddresses = ref<string[]>([]);
const addressCache = AddressCache.getInstance();

const loadingData = ref(false);
const mainDataCache = MainPageCache.getInstance();
let updateRequested = false;

watch(provider, (newProvider) => {
  remount(newProvider);
});

onMounted(async () => {
  mount();
});

const mount = async () => {
  const lastUpdateTimestamp = mainDataCache.getLastUpdateTimestamp();
  const timeToUpdate = hasMinutesPassed(lastUpdateTimestamp, CACHE_INTERVAL_MINUTES);
  if (mainDataCache.hasData() && !timeToUpdate && !updateRequested) {
    return laodDataFromCache();
  }

  setLoadingData(true);

  const newLastBlockNum = await prov.value.height();
  const gasPriceWei = await getGasPriceWei(prov.value as Web3Provider);
  const newGasPriceGwei = fromWeiToGwei(gasPriceWei, GAS_PRICE_PRECISION);

  const maxPriorityFeeHex = await prov.value.call('eth_maxPriorityFeePerGas');
  const newMaxPriorityFeeGwei = fromWeiToGwei(BigInt(maxPriorityFeeHex), GAS_PRICE_PRECISION);

  if (settingsStore.showUsdPrices) {
    const link = new Chainlink(prov.value);
    ethPrice.value = roundToTwo(await link.coinPrice('ETH'));
  }

  const newFavoriteAddresses = Array.from(addressCache.getFavoriteAddresses());
  const newFavoriteTxns = await getLastTxnsByAddresses(
    prov.value as Web3Provider,
    newFavoriteAddresses,
    LAST_TXNS_COUNT
  );

  const newLastBlocks = await getLastBlocksBefore(
    prov.value as Web3Provider,
    newLastBlockNum,
    LAST_BLOCKS_COUNT
  );
  const newLastTxns = await getLastTransactions(
    prov.value as Web3Provider,
    newLastBlocks,
    LAST_TXNS_COUNT
  );

  // apply all new values at once to avoid flickering
  gasPriceGwei.value = newGasPriceGwei;
  favoriteAddresses.value = newFavoriteAddresses;
  favoriteTxns.value = newFavoriteTxns;
  lastBlocks.value = newLastBlocks;
  lastTxns.value = newLastTxns;
  maxPriorityFeeGwei.value = newMaxPriorityFeeGwei;
  updatedTimestamp.value = Date.now();

  mainDataCache.setGasPriceGwei(newGasPriceGwei);
  mainDataCache.setFavoriteAddresses(newFavoriteAddresses);
  mainDataCache.setFavoriteTxns(newFavoriteTxns);
  mainDataCache.setLastBlocks(newLastBlocks);
  mainDataCache.setLastTxns(newLastTxns);
  mainDataCache.setMaxPriorityFeeGwei(newMaxPriorityFeeGwei);
  mainDataCache.setEthPrice(ethPrice.value);
  mainDataCache.setLastUpdateTimestamp(updatedTimestamp.value);

  updateRequested = false;
  setLoadingData(false);
};

const setLoadingData = (loading: boolean) => {
  loadingData.value = loading;
};

const remount = async (provider: Web3Provider) => {
  prov.value = provider;
  updateRequested = true;
  await mount();
};

const handleUpdateData = async () => {
  updateRequested = true;
  await mount();
};

const laodDataFromCache = () => {
  gasPriceGwei.value = mainDataCache.getGasPriceGwei();
  favoriteAddresses.value = mainDataCache.getFavoriteAddresses();
  favoriteTxns.value = mainDataCache.getFavoriteTxns();
  lastBlocks.value = mainDataCache.getLastBlocks();
  lastTxns.value = mainDataCache.getLastTxns();
  maxPriorityFeeGwei.value = mainDataCache.getMaxPriorityFeeGwei();
  ethPrice.value = mainDataCache.getEthPrice();
  updatedTimestamp.value = mainDataCache.getLastUpdateTimestamp();
};
</script>

<template>
  <div class="header">
    <div>
      <div>
        {{ APP_DESC }}
      </div>
      <div class="update-data-loader" v-if="loadingData">
        <span>Updating data</span> <span class="spinner"></span>
      </div>
    </div>
    <div class="update-btn-wrapper">
      <button @click="handleUpdateData" class="btn btn-dark update-btn">
        <i class="bi bi-arrow-clockwise"></i> Update
      </button>
      <div class="last-update">
        {{ formatTimestampLocalWithoutYear(updatedTimestamp) }}
      </div>
    </div>
  </div>

  <BasicInfo
    :maxPriorityFeeGwei="maxPriorityFeeGwei"
    :ethPrice="ethPrice"
    :gasPriceGwei="gasPriceGwei"
    :block="lastBlocks[0]"
  />

  <Favorites
    v-if="favoriteTxns.length"
    :favoriteTxns="favoriteTxns"
    :favoriteAddresses="favoriteAddresses"
  />

  <div class="chain-info">
    <LastBlocks class="chain-info-col" :blocks="lastBlocks" />
    <LastTxns class="chain-info-col" :txns="lastTxns" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 768px) {
  .header {
    flex-direction: row;
    gap: 0;
  }
}

.update-data-loader {
  display: flex;
  align-items: center;
  gap: 7px;
}

.last-update {
  font-size: 17px;
  width: 105px;
  min-width: 105px;
}

@media (min-width: 768px) {
  .last-update {
    margin-bottom: 7px;
    margin-top: 2px;
  }
}

.update-btn-wrapper {
  width: 200px;
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 7px;
}

@media (min-width: 768px) {
  .update-btn-wrapper {
    display: block;
    width: 105px;
    text-align: right;
    margin-bottom: 0;
  }
}

.update-btn {
  width: 105px;
  min-width: 105px;
}

@media (min-width: 768px) {
  .update-btn {
    width: 100%;
  }
}

.chain-info {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 1%;
}

@media (min-width: 768px) {
  .chain-info {
    flex-direction: row;
  }
}

@media (min-width: 768px) {
  .chain-info-col {
    width: 49%;
  }
}
</style>
