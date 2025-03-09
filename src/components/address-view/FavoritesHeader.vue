<script setup lang="ts">
import type { TokenBalance, FavoriteAddress } from '@/types';
import { fromWeiToEth, fromTokenBalanceToHumanReadable, shortenFavAddr } from '@/utils/utils';

const emit = defineEmits(['updateData', 'deleteFavorite']);

import { useSettingsStore } from '@/stores/settings';
const settingsStore = useSettingsStore();

defineProps<{
  favorites: FavoriteAddress[];
  unspent: bigint;
  balance: bigint;
  tokens: TokenBalance[];
  loadingTokens: boolean;
  lastUpdateDate: string;
  sumUnspentEthUsd: number;
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

const handleDeleteFavorite = (address: string) => {
  emit('deleteFavorite', address);
};

const handleCopy = (event: Event, text: string) => {
  const target = event.target as HTMLElement; // Ensure it's an HTMLElement
  target.classList.remove('bi-copy');
  target.classList.add('bi-check2');
  navigator.clipboard.writeText(text);
  setTimeout(() => {
    target.classList.add('bi-copy');
    target.classList.remove('bi-check2');
  }, 2000);
};
</script>

<template>
  <div class="header">
    <div class="sub-header">
      <b>Favorite Addresses</b>
      <div class="update-btn-wrapper">
        <span class="last-update">
          {{ lastUpdateDate }}
        </span>
        <button @click="handleUpdateData" class="btn btn-dark update-btn">
          <i class="bi bi-arrow-clockwise"></i> Update
        </button>
      </div>
    </div>
    <div v-if="favorites.length" class="favorite-addresses">
      <div v-for="fav in favorites" :key="fav.address" class="favorite-address">
        <span class="fav-addr-info">
          <RouterLink class="link fav-addr" :to="`/address/${fav.address}`">
            {{ shortenFavAddr(fav.address) }}
          </RouterLink>
          <i
            @click="(e: Event) => handleCopy(e, fav.address)"
            class="txn-hash-copy-icon bi bi-copy"
          ></i>
          <!-- <span v-if="fav.type === 'contract'">(contract)</span> -->
        </span>
        <span class="balance-trash">
          <span v-if="fav.unspent"> {{ fromWeiToEth(fav.unspent.balance, 18) }} ETH </span>
          <span @click="() => handleDeleteFavorite(fav.address)" class="delete-icon">
            <i class="bi bi-trash"></i>
          </span>
        </span>
        <span class="delete-from-list">
          <span
            @click="() => handleDeleteFavorite(fav.address)"
            class="btn btn-dark delete-btn delete-icon"
          >
            Delete from list <i class="bi bi-trash"></i>
          </span>
        </span>
      </div>
    </div>
  </div>

  <div><b>Transactions Sent (non contracts):</b> {{ unspent }}</div>

  <div class="tokens">
    <div class="tokens-holdings-header">
      <b>Balances</b>
      <span v-if="loadingTokens" class="spinner"></span>
    </div>
    <div class="tokens-holdings">
      <div>
        {{ unspent ? `${fromWeiToEth(balance, 18)}` : 'loading ...' }}
        ETH
        <span v-if="settingsStore.showUsdPrices">({{ sumUnspentEthUsd }}$) </span>
        <span v-if="!settingsStore.showUsdPrices">(</span>
        <span class="token-name">Ethereum</span>
        <span v-if="!settingsStore.showUsdPrices">)</span>
      </div>
      <div v-if="loadingTokens">Loading tokens may take time...</div>
      <div v-if="!loadingTokens && !tokens?.length">No tokens found</div>
      <div v-if="tokens?.length" class="token-container">
        <div class="token-item" v-for="(t, i) in tokens" :key="i">
          {{ readableTokenBalance(t) }}
          {{ settingsStore.showUsdPrices && t.usd ? `(${t?.usd.balance}$)` : '' }}
          {{ settingsStore.showUsdPrices && t.usd && t.usd.balance ? '' : '('
          }}<span class="token-name">{{ t.info?.name || 'Unknown token' }}</span
          >{{ settingsStore.showUsdPrices && t.usd && t.usd.balance ? '' : ')' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  margin-top: 20px;
  margin-bottom: 2px;
  font-weight: normal;
}

.sub-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 5px;
}

@media (min-width: 485px) {
  .sub-header {
    flex-direction: row;
  }
}

.update-btn-wrapper {
  display: flex;
  flex-direction: row-reverse;
}

@media (min-width: 485px) {
  .update-btn-wrapper {
    text-align: right;
    display: block;
  }
}

.last-update {
  font-size: 17px;
  margin-left: 7px;
  margin-top: 1px;
}

@media (min-width: 485px) {
  .last-update {
    margin-top: 0;
    margin-left: 0;
    margin-right: 7px;
  }
}

.fav-addr-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.fav-addr {
  min-width: 215px;
}

.favorite-addresses {
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
  padding: 4px 12px;
  margin-top: 6px;
  margin-bottom: 12px;
}

.favorite-address {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: flex-start;
  border-bottom: 1px solid var(--ash-grey);
  padding-bottom: 4px;
  margin-bottom: 4px;
}

@media (min-width: 768px) {
  .favorite-address {
    flex-direction: row;
  }
}

.favorite-address:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.txn-hash-copy-icon {
  font-size: 16px;
  cursor: pointer;
}

.balance-trash {
  display: flex;
  align-items: flex-start;
  word-break: break-word;
  gap: 7px;
}

.balance-trash .delete-icon {
  display: none;
}

.delete-from-list {
  margin-bottom: 6px;
}

@media (min-width: 768px) {
  .balance-trash {
    text-align: right;
  }

  .balance-trash .delete-icon {
    display: inline;
  }

  .delete-from-list {
    display: none;
  }
}

.delete-icon {
  cursor: pointer;
  color: var(--red-darker);
}

.delete-btn {
  cursor: pointer;
  color: var(--btn-red);
}

@media (prefers-color-scheme: dark) {
  .delete-btn {
    color: var(--btn-red-darker);
  }
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
</style>
