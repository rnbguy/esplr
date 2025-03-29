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
  tokensError: boolean;
  tokensPricesError: boolean;
  unspentPriceError: boolean;
  unspentError: boolean;
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
      <div v-if="!unspentError">
        <div v-if="!loadingUnspent">
          {{ fromWeiToEth(unspentEth, 18) }} ETH
          <span v-if="showPrices && !unspentPriceError"> ({{ unspentEthUsd }}$) Ethereum</span>
          <span v-else> (Ethereum) </span>
        </div>
        <div v-if="showPrices && unspentPriceError" class="warning eth-price-warning">
          Ethereum USD balance was not loaded, probably because of the Erigon node limitations.
        </div>
      </div>

      <div
        v-if="unspentError || tokensError || tokensPricesError"
        class="warning tokens-holdings-warning"
      >
        <span v-if="unspentError">Ethereum balance was not loaded. </span>
        <span v-if="tokensError">Tokens were not loaded. </span>
        <span v-if="tokensPricesError">Tokens USD prices were not loaded. </span>
        <br />
        Probably because of the Erigon node limitations. Check the node request limits.
      </div>

      <div v-if="!tokensError">
        <div v-if="loadingTokens">Loading tokens may take time...</div>
        <div v-if="!loadingTokens && !tokens?.length">No tokens found</div>
        <div v-if="tokens.length" class="token-container">
          <div class="token-item" v-for="(t, i) in tokens" :key="i">
            <div v-if="t.info && t.info.symbol">
              {{ readableTokenBalance(t) }}
              <span v-if="showPrices && t.usd && !tokensPricesError">
                ({{ t?.usd.balance }}$)
              </span>

              <span class="token-name">
                {{ showPrices && t.usd && t.usd.balance !== null && !tokensPricesError ? '' : '('
                }}{{ t.info?.name || 'Unknown token'
                }}{{
                  showPrices && t.usd && t.usd.balance !== null && !tokensPricesError ? '' : ')'
                }}
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

.tokens-holdings-warning {
  font-size: 17px;
}

.eth-price-warning {
  font-size: 17px;
}
</style>
