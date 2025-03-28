<script setup lang="ts">
import { onMounted, inject, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { Web3Provider } from 'micro-eth-signer/net';
import type { TokenTransfer, TxInfo } from 'node_modules/micro-eth-signer/net/archive';
import {
  formatTimestampLocal,
  getTransactionMethodName,
  shortenAddr,
  getTransferValue,
  fromWeiToEth,
  concatTransfers,
} from '@/utils/utils';
import { getTokenTransfersForTxn } from '@/utils/network';

const route = useRoute();
const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = provider.value;

// taken from micro-eth-signer/net/archive
type TxnType = '' | 'legacy' | 'eip2930' | 'eip1559' | 'eip4844' | 'eip7702';
type TxnInfo = {
  type: TxnType;
  info: TxInfo;
  receipt: unknown;
  raw?: string;
};

type NetTransfer = {
  addr: string;
  type: string;
  transfer: TokenTransfer;
};

const txnInfo = ref<TxnInfo | null>(null);
const isLoadingTxnBaseInfo = ref(false);
const isLoadingTxnTokenTransfers = ref(false);

const transactionHash = ref('');
const blockConfirmations = ref(0);
const timestamp = ref('');
const action = ref('');
const success = ref(false);
const netTransfers = ref<NetTransfer[]>([]);
const value = ref(0);
const type = ref('');
const nonce = ref(0);
const transactionIndex = ref(0);

onMounted(async () => {
  await mount(route.params.tx as string);
});

watch(
  () => route.params.tx,
  async (newTx) => {
    await mount(newTx as string);
  }
);

const mount = async (tx: string) => {
  isLoadingTxnBaseInfo.value = true;
  transactionHash.value = tx;

  const txn = await prov.txInfo(tx);
  txnInfo.value = txn;

  const { hash, from, to, blockNumber } = txn.info;
  const blockDetails = await prov.blockInfo(blockNumber);

  timestamp.value = formatTimestampLocal(blockDetails.timestamp);
  action.value = getTransactionMethodName(txn.info);
  blockConfirmations.value = (await prov.height()) - blockNumber + 1;
  success.value = txn.receipt.status === 1;
  value.value = txn.info.value;
  type.value = txn.type;
  nonce.value = txn.info.nonce;
  transactionIndex.value = txn.info.transactionIndex;
  isLoadingTxnBaseInfo.value = false;

  isLoadingTxnTokenTransfers.value = true;
  const [fromAddrTransfers, toAddrTransfers] = await Promise.all([
    getTokenTransfersForTxn(prov, hash, from, blockNumber),
    to ? getTokenTransfersForTxn(prov, hash, to, blockNumber) : Promise.resolve([]),
  ]);

  netTransfers.value = concatTransfers(fromAddrTransfers, toAddrTransfers);
  isLoadingTxnTokenTransfers.value = false;
};
</script>

<template>
  <div class="header">
    <div><b>Transaction hash:</b></div>
    <div class="tx-hash">{{ transactionHash }}</div>
  </div>

  <div class="details-header">
    <b>Details:</b>
    <span v-if="isLoadingTxnBaseInfo" class="spinner"></span>
  </div>
  <div class="info">
    <div class="field">
      <div class="field-title">Status:</div>
      <div v-if="!isLoadingTxnBaseInfo">
        <span v-if="success" class="label success"
          ><i class="icon bi bi-check-circle-fill"></i> Success</span
        >
        <span class="label failure" v-else><i class="icon bi bi-x-circle-fill"></i> Failure</span>
      </div>
    </div>

    <div class="field block">
      <div class="field-title">Block:</div>
      <div v-if="!isLoadingTxnBaseInfo && txnInfo" class="confirmations">
        <RouterLink class="link" :to="`/block/${txnInfo.info.blockNumber}`">
          {{ txnInfo.info.blockNumber }}
        </RouterLink>
        <span class="label small">{{ blockConfirmations }} Block Confirmations</span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Time:</div>
      <div v-if="!isLoadingTxnBaseInfo">
        {{ timestamp }}
      </div>
    </div>

    <div class="field">
      <div class="field-title">From:</div>
      <div v-if="!isLoadingTxnBaseInfo && txnInfo" class="tx-hash">
        <RouterLink
          v-if="txnInfo.info.from"
          class="link txn-hash-link"
          :to="`/address/${txnInfo.info.from}`"
        >
          {{ txnInfo.info.from }}
        </RouterLink>
        <span v-else>-</span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Interacted With (To):</div>
      <div v-if="!isLoadingTxnBaseInfo && txnInfo" class="tx-hash">
        <RouterLink
          v-if="txnInfo.info.to"
          class="link txn-hash-link"
          :to="`/address/${txnInfo.info.to}`"
        >
          {{ txnInfo.info.to }}
        </RouterLink>
        <span v-else>-</span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Transaction Action:</div>
      <div v-if="!isLoadingTxnBaseInfo" :class="[{ label: action.length > 1 }]">{{ action }}</div>
    </div>

    <div class="field transfers-block">
      <div class="field-title">Tokens Transfers:</div>
      <div v-if="netTransfers.length && !isLoadingTxnTokenTransfers" class="net-transfers">
        <div class="token-transfer" v-for="t in netTransfers" :key="t.addr">
          <span class="tx-hash shortenAddr">
            <RouterLink v-if="t.addr" class="link txn-hash-link" :to="`/address/${t.addr}`">
              {{ shortenAddr(t.addr) }}
            </RouterLink>
            <span v-else>-</span>
          </span>
          <span class="tx-type">{{ t.type }}</span>
          <span class="tx-value">
            {{ getTransferValue(t.transfer) }}
            {{ 'symbol' in t.transfer ? t.transfer.symbol : '' }}
          </span>
        </div>
      </div>
      <div v-if="isLoadingTxnTokenTransfers && !isLoadingTxnBaseInfo">
        <span class="spinner"></span>
      </div>
      <div v-if="!netTransfers.length && !isLoadingTxnTokenTransfers && !isLoadingTxnBaseInfo">
        -
      </div>
    </div>

    <div class="field">
      <div class="field-title">Value:</div>
      <div class="eth-value" v-if="!isLoadingTxnBaseInfo">
        {{ fromWeiToEth(BigInt(value), 18) }} ETH
      </div>
    </div>

    <div class="field">
      <div class="field-title">Other attributes:</div>
      <div v-if="!isLoadingTxnBaseInfo" class="other-attributes">
        <span class="label small">Txn type: {{ type.toUpperCase() }}</span>
        <span class="label small">Nonce: {{ nonce }}</span>
        <span class="label small">Position in block: {{ transactionIndex }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  margin-top: 20px;
  margin-bottom: 15px;
  font-weight: normal;
}

.details-header {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.tx-hash {
  font-size: 18px;
  word-break: break-word;
}

.info {
  justify-content: space-between;
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
  padding: 0 12px;
  margin-bottom: 15px;
}

.label.small {
  font-size: 13px;
  padding: 2px 6px;
  margin-bottom: 7px;
}

.label.small:last-child {
  margin-bottom: 0px;
}

@media (min-width: 650px) {
  .label.small {
    margin-left: 7px;
    margin-bottom: 0px;
  }
}

.field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 7px 0px;
  border-bottom: 1px solid var(--ash-grey);
}

@media (min-width: 425px) {
  .field {
    flex-direction: row;
  }
}

.transfers-block {
  flex-direction: column;
}

@media (min-width: 685px) {
  .transfers-block {
    flex-direction: row;
  }
}

.tx-value {
  word-break: break-word;
}

.field:last-child {
  border-bottom: none;
}

.field-title {
  display: inline-block;
  font-weight: 600;
  font-size: 18px;
  min-width: 180px;
}

.label.success {
  color: var(--success);
}

.label.failure {
  color: var(--error);
}

.shortenAddr {
  display: inline-block;
  min-width: 115px;
}

.tx-type {
  display: inline-block;
  min-width: 80px;
}

.net-transfers {
  max-height: 263px;
  overflow-y: scroll;
  width: 100%;
}

.other-attributes {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
}

@media (min-width: 650px) {
  .other-attributes {
    flex-direction: row;
    align-items: center;
  }
}

.other-attributes .label.small:first-child {
  margin-left: 0px;
}

.confirmations {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
}

@media (min-width: 650px) {
  .confirmations {
    flex-direction: row;
    align-items: center;
  }
}

.token-transfer {
  display: flex;
  flex-direction: column;
  padding: 6px;
  margin-top: 5px;
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
}

@media (min-width: 480px) {
  .token-transfer {
    flex-direction: row;
    border: none;
    padding: 0;
    margin-top: 0;
  }
}

.eth-value {
  word-break: break-word;
}
</style>
