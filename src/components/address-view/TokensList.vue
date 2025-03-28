<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fromWeiToEth, fromTokenBalanceToHumanReadable } from '@/utils/utils';
import type { TokenBalance } from '@/types';

import { useSettingsStore } from '@/stores/settings';
const settingsStore = useSettingsStore();

const showPrices = ref(false);
onMounted(() => {
  showPrices.value = settingsStore.showUsdPrices;
});

defineProps<{
  tokens: TokenBalance[];
  loadingTokens: boolean;
  loadingUnspent: boolean;
  showErigonTokensWarning: boolean;
  showErigonPricesWarning: boolean;
  unspentEth: bigint;
  unspentEthUsd: number;
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
</script>

<template>
  <div class="tokens">
    <div class="tokens-holdings-header">
      <b>Balances</b>
      <span v-if="loadingTokens" class="spinner"></span>
    </div>
    <div :class="['tokens-holdings', { 'tokens-holdings_no-scroll': tokens.length <= 4 }]">
      <div v-if="!loadingUnspent">
        {{ fromWeiToEth(unspentEth, 18) }} ETH
        <span v-if="showPrices"> ({{ unspentEthUsd }}$) </span>

        <span class="token-name">
          {{ !showPrices ? '(' : '' }}Ethereum{{ !showPrices ? ')' : '' }}
        </span>
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
              <span v-if="showPrices && t.usd"> ({{ t?.usd.balance }}$) </span>

              <span class="token-name">
                {{ showPrices && t.usd && t.usd.balance ? '' : '('
                }}{{ t.info?.name || 'Unknown token'
                }}{{ showPrices && t.usd && t.usd.balance ? '' : ')' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tokens-holdings-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}

.tokens-holdings {
  height: auto;
  min-height: 170px;
  max-height: 170px;
  overflow-y: scroll;
  word-break: break-word;
}

.tokens-holdings_no-scroll {
  overflow-y: hidden;
}

.token-name {
  display: inline-block;
}
</style>
