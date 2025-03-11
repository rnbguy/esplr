<script setup lang="ts">
import { onBeforeUpdate, onMounted, ref } from 'vue';
import {
  fromWeiToEth,
  shortenTx,
  fromTokenBalanceToHumanReadable,
  formatTimestampLocalWithoutYear,
} from '@/utils/utils';
import type { TokenBalance, OtsGetContractCreatorResponse, ERC20TokenInfo } from '@/types';
import { AddressCache } from '@/cache';

import { useSettingsStore } from '@/stores/settings';
const settingsStore = useSettingsStore();

const emit = defineEmits(['updateData']);
const cache = AddressCache.getInstance();
const isFavorite = ref(false);

onMounted(() => {
  isFavorite.value = cache.isFavoriteAddress(props.address);
});

onBeforeUpdate(() => {
  isFavorite.value = cache.isFavoriteAddress(props.address);
});

const props = defineProps<{
  address: string;
  unspent: {
    balance: bigint;
    nonce: number;
  } | null;
  unspentEthUsd: number;
  tokens: TokenBalance[];
  loadingTokens: boolean;
  lastUpdateTimestamp: number;
  isContract: boolean;
  tokenCreator: OtsGetContractCreatorResponse | null;
  tokenInfo: ERC20TokenInfo | null;
  showErigonTokensWarning: boolean;
  showErigonPricesWarning: boolean;
}>();

const readableTokenBalance = (token: TokenBalance) => {
  if (token.info === null || token.balance === null) return 'Unknown balance';
  const balance = fromTokenBalanceToHumanReadable(
    token.balance,
    token.info.decimals,
    token.info.decimals
  );
  return `${balance} ${token.info.symbol}`;
};

const handleUpdateData = () => {
  emit('updateData');
};

const toggleFavorite = () => {
  if (cache.isFavoriteAddress(props.address)) {
    cache.removeFavoriteAddress(props.address);
  } else {
    cache.addFavoriteAddress(props.address);
  }
  isFavorite.value = cache.isFavoriteAddress(props.address);
};
</script>

<template>
  <div class="header">
    <div class="address-info">
      <div>
        <div class="address">
          <b>Address:</b>
          {{ address }}
        </div>
        <div v-if="isContract" class="contract-notice warning">
          <i class="bi bi-info-circle"></i> Contract address
        </div>

        <div v-if="!isContract">
          <b>Transactions Sent:</b> {{ unspent ? unspent.nonce : 'loading ...' }}
        </div>

        <div class="actions">
          <button @click="toggleFavorite" class="btn btn-dark">
            <i v-if="isFavorite" class="bi bi-star-fill"></i>
            <i v-else class="bi bi-star"></i>
            {{ isFavorite ? 'Unfavorite' : 'Add to favorite' }}
          </button>
          <div class="update-btn-wrapper only-mobile">
            <button @click="handleUpdateData" class="btn btn-dark update-btn">
              <i class="bi bi-arrow-clockwise"></i> Update
            </button>
            <div class="last-update">
              {{
                lastUpdateTimestamp > 0 ? formatTimestampLocalWithoutYear(lastUpdateTimestamp) : ''
              }}
            </div>
          </div>
        </div>
      </div>
      <div class="update-btn-wrapper only-desktop">
        <button @click="handleUpdateData" class="btn btn-dark update-btn">
          <i class="bi bi-arrow-clockwise"></i> Update
        </button>
        <div class="last-update">
          {{ lastUpdateTimestamp > 0 ? formatTimestampLocalWithoutYear(lastUpdateTimestamp) : '' }}
        </div>
      </div>
    </div>
  </div>

  <div class="tokens">
    <div v-if="tokenInfo">
      <b>Token:</b> {{ tokenInfo.name }} ({{ tokenInfo.symbol }})
      <span class="label" style="margin: 0 5px">{{ tokenInfo.abi }}</span>
      <span class="label">{{ tokenInfo.decimals }} decimals</span>
    </div>

    <div v-if="tokenCreator">
      <b>Contract creator: </b>
      <RouterLink class="link" :to="`/address/${tokenCreator.creator}`">
        {{ shortenTx(tokenCreator.creator) }}
      </RouterLink>
      <b> at txn </b>
      <RouterLink class="link" :to="`/tx/${tokenCreator.hash}`">
        {{ shortenTx(tokenCreator.hash) }}
      </RouterLink>
    </div>

    <div class="tokens-holdings-header">
      <b>Balances</b>
      <span v-if="loadingTokens" class="spinner"></span>
    </div>
    <div class="tokens-holdings">
      <div v-if="!showErigonPricesWarning">
        {{ unspent ? `${fromWeiToEth(unspent.balance, 18)}` : 'loading ...' }}
        ETH
        <span v-if="settingsStore.showUsdPrices"> ({{ unspentEthUsd }}$) </span>
        <span v-if="!settingsStore.showUsdPrices">(</span>
        <span class="token-name">Ethereum</span>
        <span v-if="!settingsStore.showUsdPrices">)</span>
      </div>

      <div v-if="showErigonTokensWarning || showErigonPricesWarning">
        <div class="warning">
          <i class="bi bi-exclamation-triangle"></i>
          Only Erigon RPC is supported for token balances.
        </div>
      </div>

      <div v-if="!showErigonTokensWarning">
        <div v-if="loadingTokens">Loading tokens may take time...</div>
        <div v-if="!loadingTokens && !tokens?.length">No tokens found</div>
        <div v-if="tokens.length" class="token-container">
          <div class="token-item" v-for="(t, i) in tokens" :key="i">
            <div v-if="t.info && t.info.symbol">
              {{ readableTokenBalance(t) }}
              {{ settingsStore.showUsdPrices && t.usd ? `(${t?.usd.balance}$)` : '' }}
              {{ settingsStore.showUsdPrices && t.usd && t.usd.balance ? '' : '('
              }}<span class="token-name">{{ t.info?.name || 'Unknown token' }}</span
              >{{ settingsStore.showUsdPrices && t.usd && t.usd.balance ? '' : ')' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.only-desktop {
  display: none;
}

@media (min-width: 685px) {
  .only-desktop {
    display: block;
  }
}

@media (min-width: 685px) {
  .only-mobile {
    display: none;
  }
}

.header {
  margin-top: 20px;
  margin-bottom: 2px;
}

.actions {
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

@media (min-width: 685px) {
  .actions {
    /* display: none; */
  }
}

.token-name {
  display: inline-block;
}

.address-info {
  margin-bottom: 15px;
  gap: 5px;
}

@media (min-width: 685px) {
  .address-info {
    display: flex;
    flex-direction: row;
    display: flex;
    justify-content: space-between;
    gap: 5px;
  }
}

.address {
  word-break: break-word;
}

.tokens-holdings-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}

.tokens-holdings {
  height: auto;
  max-height: 170px;
  overflow-y: scroll;
  word-break: break-word;
}

.last-update {
  text-align: right;
  font-size: 17px;
  margin-bottom: 15px;
  margin-top: 2px;
}

.update-btn-wrapper {
  width: 105px;
  text-align: right;
}

.update-btn {
  width: 100%;
}
</style>
