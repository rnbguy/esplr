<script setup lang="ts">
import { onMounted, inject, watch, ref, type Ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Web3Provider, Chainlink } from 'micro-eth-signer/net';
import { TOKENS } from 'micro-eth-signer/abi';
import type { Unspent } from 'node_modules/micro-eth-signer/net/archive';
import { getUnspent, getERC20TokenInfo, loadTokenInfoByBalances } from '@/utils/network';
import { transfersToTxnsList, currentDateLocalWithoutYear, usdBalance } from '@/utils/utils';
import type {
  ERC20TokenInfo,
  TransactionListItem,
  TokenBalance,
  OtsGetContractCreatorResponse,
  FavoriteAddress,
} from '@/types';
import AddressHeader from '@/components/address-view/AddressHeader.vue';
import FavoritesHeader from '@/components/address-view/FavoritesHeader.vue';
import TransactionsList from '@/components/address-view/TransactionsList.vue';

import { useSettingsStore } from '@/stores/settings';
import { AddressCache } from '@/cache';
import { Pagination } from '@/views/Pagination';
import { DetailsPagination } from '@/views/DetailsPagination';
import { FavoritesPagination } from '@/views/FavoritesPagination';

const route = useRoute();
const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = provider.value;

const settingsStore = useSettingsStore();

const SHOW_TXNS_LIMIT = 25;

const address = ref('');
const unspent = ref<Unspent | null>(null);
const loadingTxns = ref(false);
const transactionsList = ref<TransactionListItem[][]>([]);
const unspentEthUsd = ref(0);

const tokenCreator = ref<OtsGetContractCreatorResponse | null>(null);
const tokenInfo = ref<ERC20TokenInfo | null>(null);

const loadingTokens = ref(false);
const tokens = ref<TokenBalance[]>([]);
const activeTab = ref('internal');
const lastUpdateDate = ref('');
const warning = ref('');
const loadingPage = ref(false);

const cache = AddressCache.getInstance();
let updateTokenTransfersRequested = false;
let updateInternalTransactionsRequested = false;
let updateRequested = false;
// let updateFavoritesTransactionsRequested = false

const pagination = Pagination.getInstance(prov, SHOW_TXNS_LIMIT);
const detailsPagination = DetailsPagination.getInstance(prov, SHOW_TXNS_LIMIT);
const favoritesPagination = FavoritesPagination.getInstance(prov, SHOW_TXNS_LIMIT, cache);
const isFirstPage = ref(true);
const isLastPage = ref(false);
const currentPage = ref(1);

const isFavorites = computed(() => route.name === 'favorites');
const sumUnspent = ref(0n);
const sumBalance = ref(0n);
const sumUnspentEthUsd = ref(0);
const favoritesWithDetails = ref<FavoriteAddress[]>([]);

watch(
  () => route.params.address,
  async (newAddress) => {
    setTab('internal');
    await mount(newAddress as string);
  }
);

const clearState = () => {
  address.value = '';
  unspent.value = null;
  transactionsList.value = [];
  tokenCreator.value = null;
  tokenInfo.value = null;
  tokens.value = [];
};

onMounted(async () => {
  if (isFavorites.value) {
    await mountFavorites();
  } else {
    await mount(route.params.address as string);
  }
});

const updateData = async () => {
  if (!window.navigator.onLine) {
    warning.value = 'No internet connection. Please check your network settings.';
    setTimeout(() => {
      warning.value = '';
    }, 7000);
    return;
  }

  cache.clearAddressForUpdate(address.value);
  updateRequested = true;
  updateInternalTransactionsRequested = true;
  updateTokenTransfersRequested = true;
  if (isFavorites.value) {
    // updateFavoritesTransactionsRequested = true
    cache.clearInternalTransactionsFavorites();
    await mountFavorites();
  } else {
    await mount(address.value);
  }
};

const mountFavorites = async () => {
  clearState();

  setLoadingTokens(true);
  setLoadingTxns(true);

  const pageDataPromises = [];

  const addresses = Array.from(cache.getFavoriteAddresses());
  const unspentPromise = loadUnspentAddresses(addresses);
  pageDataPromises.push(unspentPromise);

  let txnsPromise = null;
  if (activeTab.value === 'internal') {
    txnsPromise = loadAddressesTransactions(addresses);
  } else if (activeTab.value === 'details') {
    // TODO: loading transfers for favorites will be here
  }
  pageDataPromises.push(txnsPromise);

  const tokensPromise = loadAddressesTokens(addresses);
  pageDataPromises.push(tokensPromise);

  await Promise.all(pageDataPromises);
  lastUpdateDate.value = currentDateLocalWithoutYear();
};

const mount = async (addr: string) => {
  clearState();

  setLoadingTokens(true);
  setLoadingTxns(true);

  const pageDataPromises = [];

  const contractCreatorPromise = loadAddressContractCreatorWithInfo(addr);
  pageDataPromises.push(contractCreatorPromise);

  address.value = addr;
  const unspentPromise = loadUnspent(addr);
  pageDataPromises.push(unspentPromise);

  let txnsPromise = null;
  if (activeTab.value === 'internal') {
    txnsPromise = loadAddressTransactions(addr);
  } else if (activeTab.value === 'details') {
    txnsPromise = loadTransfers(addr);
  }
  pageDataPromises.push(txnsPromise);

  const tokensPromise = loadAddressTokens(addr);
  pageDataPromises.push(tokensPromise);

  await Promise.all(pageDataPromises);
  if (cache.hasUpdateDate(addr) && !updateRequested) {
    lastUpdateDate.value = cache.getUpdateDate(addr) ?? '';
  } else {
    lastUpdateDate.value = currentDateLocalWithoutYear();
    cache.setUpdateDate(addr, lastUpdateDate.value);
  }
  updateRequested = false;
};

const getAddrUnspent = async (address: string) => {
  if (cache.hasUnspent(address)) {
    // console.log('used cached unspent')
    return cache.getUnspent(address) ?? null;
  }
  const result = await getUnspent(prov, address);
  cache.addUnspent(address, result);
  return result;
};

const loadUnspent = async (address: string) => {
  unspent.value = await getAddrUnspent(address);
  if (settingsStore.showUsdPrices) {
    if (cache.hasUnspentEthUsd(address)) {
      unspentEthUsd.value = cache.getUnspentEthUsd(address) ?? 0;
      return;
    }
    const link = new Chainlink(prov);
    const usdTokenPrice = await link.coinPrice('ETH');
    const balance = unspent.value?.balance ?? 0n;
    const ethDecimals = 18;
    const usd = usdBalance(balance, ethDecimals, usdTokenPrice);
    cache.setUnspentEthUsd(address, usd);
    unspentEthUsd.value = usd;
  }
};

const loadUnspentAddresses = async (addresses: string[]) => {
  const markedAddresses = await Promise.all(
    addresses.map(async (addr: string) => {
      return { address: addr, creator: await getContractCreator(addr) };
    })
  );

  const allUnspent = await Promise.all(
    markedAddresses.map(async (addr) => {
      return {
        address: addr.address,
        type: addr.creator ? 'contract' : 'user',
        unspent: await getAddrUnspent(addr.address),
      };
    })
  );

  favoritesWithDetails.value = allUnspent;

  // TODO: check that worked correctly after adding possibility to add contract addresses to favorites
  const userUnspent = allUnspent.filter((i) => i.type === 'user');
  sumUnspent.value = userUnspent.reduce((acc, curr: { unspent: Unspent | null }) => {
    if (!curr.unspent) return acc;
    return acc + BigInt(curr.unspent.nonce);
  }, 0n);

  sumBalance.value = allUnspent.reduce((acc, curr: { unspent: Unspent | null }) => {
    if (!curr.unspent) return acc;
    return acc + BigInt(curr.unspent.balance);
  }, 0n);

  if (settingsStore.showUsdPrices) {
    const link = new Chainlink(prov);
    const usdTokenPrice = await link.coinPrice('ETH');
    const balance = sumBalance.value;
    const ethDecimals = 18;
    const usd = usdBalance(balance, ethDecimals, usdTokenPrice);
    sumUnspentEthUsd.value = usd;
  }
};

const getContractCreator = async (address: string) => {
  let creator = null;
  if (cache.hasTokenCreator(address)) {
    creator = cache.getTokenCreator(address) ?? null;
  } else {
    creator = await prov.call('ots_getContractCreator', address);
    cache.addTokenCreator(address, creator);
  }
  if (!creator) return null;
  return creator;
};

const loadAddressContractCreatorWithInfo = async (address: string) => {
  const creator = await getContractCreator(address);
  if (!creator) return null;

  let tInfo = null;
  if (cache.hasTokenInfo(address)) {
    tInfo = cache.getTokenInfo(address) ?? null;
  } else {
    tInfo = await getERC20TokenInfo(prov, address);
    cache.addTokenInfo(address, tInfo);
  }

  tokenInfo.value = tInfo;
  tokenCreator.value = creator;
};

const loadAddressesTransactions = async (addresses: string[]) => {
  setTab('internal');
  setLoadingTxns(true);

  // TODO: fix caching, when new address was added to favorites
  const cachedTxns = null;
  // if (
  //   cache.hasInternalTransactionsAddressFavorites() &&
  //   !updateFavoritesTransactionsRequested
  // ) {
  //   const cached = cache.getInternalTransactionsFavorites() ?? []
  //   cachedTxns = cached.length ? cached : null
  // }

  const txnsToShow = await favoritesPagination.showFirstPage(addresses, cachedTxns);
  transactionsList.value = txnsToShow;

  // cache.addInternalTransactionsFavorites(
  //   favoritesPagination.currentPageTxns.concat(favoritesPagination.nextPageReminder),
  // )

  updatePagesState(favoritesPagination);
  // updateFavoritesTransactionsRequested = false
  setLoadingTxns(false);
};

const loadAddressTransactions = async (address: string) => {
  setTab('internal');
  setLoadingTxns(true);

  let cachedTxns = null;
  if (cache.hasInternalTransactionsAddress(address) && !updateInternalTransactionsRequested) {
    const cached = cache.getInternalTransactions(address) ?? [];
    cachedTxns = cached.length ? cached : null;
  }

  const txnsToShow = await pagination.showFirstPage(address, cachedTxns);
  transactionsList.value = txnsToShow;

  cache.addInternalTransactions(
    address,
    pagination.currentPageTxns.concat(pagination.nextPageReminder)
  );

  updatePagesState(pagination);
  updateInternalTransactionsRequested = false;
  setLoadingTxns(false);
};

const getPositiveTokenBalances = async (prov: Web3Provider, address: string) => {
  const balances = await prov.tokenBalances(address, Object.keys(TOKENS));
  const positiveBalances = Object.fromEntries(
    Object.entries(balances).filter(([, balance]) => {
      // @ts-expect-error: balance might not be a Map if there is TokenError instead
      return balance instanceof Map && balance?.get(1n) > 0n;
    })
  );
  return positiveBalances;
};

const loadAddressesTokens = async (addresses: string[]) => {
  setLoadingTokens(true);

  const results = await Promise.all(
    addresses.map(async (addr) => {
      const positiveBalances = await getPositiveTokenBalances(prov, addr);
      return await loadTokenInfoByBalances(prov, positiveBalances);
    })
  );
  const allTokens = results.flat();

  const allTokensSumBalances = new Map<string, TokenBalance>();
  allTokens.forEach((t) => {
    const existingBalance = allTokensSumBalances.get(t.token)?.balance ?? 0n;
    const newBalance = existingBalance + (t.balance ?? 0n);
    allTokensSumBalances.set(t.token, { ...t, balance: newBalance });
  });

  let result = Array.from(allTokensSumBalances.values());
  if (settingsStore.showUsdPrices) {
    result = await injectUsdPriceToTokenBalances(result);
  }
  tokens.value = result;

  setLoadingTokens(false);
};

const injectUsdPriceToTokenBalances = async (tokens: TokenBalance[]): Promise<TokenBalance[]> => {
  const link = new Chainlink(prov);
  const tokenPrices = await Promise.all(
    tokens.map(async (token) => {
      let usd = null;
      let usdTokenPrice = null;
      if (!token.info || !token.balance) {
        return { ...token, usd: { balance: usd, price: usdTokenPrice } };
      }

      if (token.info.symbol) {
        usdTokenPrice = await link.tokenPrice(token.info.symbol);
      } else {
        usdTokenPrice = 0;
      }

      const balance = token.balance;
      const decimals = token.info.decimals;
      usd = usdBalance(balance, decimals, usdTokenPrice);

      return { ...token, usd: { balance: usd, price: usdTokenPrice } };
    })
  );
  return tokenPrices;
};

const loadAddressTokens = async (address: string) => {
  setLoadingTokens(true);

  if (cache.hasTokenAddress(address)) {
    let result = cache.getToken(address) ?? [];
    const allHasPrice = result.every((t) => t.usd);
    if (settingsStore.showUsdPrices && !allHasPrice) {
      result = await injectUsdPriceToTokenBalances(result);
      cache.addToken(address, result);
    }
    tokens.value = result;
    setLoadingTokens(false);
    return;
  }

  const positiveBalances = await getPositiveTokenBalances(prov, address);
  let result = await loadTokenInfoByBalances(prov, positiveBalances);
  if (settingsStore.showUsdPrices) {
    result = await injectUsdPriceToTokenBalances(result);
  }

  tokens.value = result;
  cache.addToken(address, result);

  setLoadingTokens(false);
};

const loadTransfers = async (address: string) => {
  setTab('details');
  setLoadingTxns(true);

  const hasCache = cache.hasTokenTransfersTransactionsAddress(address);

  // load from cache by default
  let allTxns: TransactionListItem[][] = [];
  if (!updateTokenTransfersRequested && hasCache) {
    allTxns = cache.getTokenTransfersTransactions(address) ?? [];
  } else if (updateTokenTransfersRequested && hasCache) {
    const cached = cache.getTokenTransfersTransactions(address) ?? [];
    const block = cached.length ? parseInt(cached[0][0].blockNumber) : 0;
    const fromBlock = block > 0 ? block + 1 : 0;
    const transfers = await prov.transfers(address, { fromBlock });
    const newTxns = transfersToTxnsList(transfers.reverse());
    if (fromBlock === 0) {
      allTxns = newTxns;
    } else {
      allTxns = newTxns.concat(cached);
    }
  } else {
    const transfers = await prov.transfers(address);
    // const transfers = await provider.transfers(address, { fromBlock: 21431407 })

    allTxns = transfersToTxnsList(transfers.reverse());
  }

  cache.addTokenTransfersTransactions(address, allTxns);
  detailsPagination.updateTransactions(allTxns);

  transactionsList.value = detailsPagination.showFirstPage();
  updatePagesState(detailsPagination);
  updateTokenTransfersRequested = false;
  setLoadingTxns(false);
};

const loadTokensTransfers = async () => {
  if (!unspent.value) return;
  if (unspent.value.nonce > 10000n) {
    warning.value = 'Details are available for addresses with less than 10K sent transactions.';
    setTimeout(() => {
      warning.value = '';
    }, 7000);
    return;
  }
  if (!window.navigator.onLine && !cache.hasTokenTransfersTransactionsAddress(address.value)) {
    warning.value = 'No internet connection. Please check your network settings.';
    setTimeout(() => {
      warning.value = '';
    }, 7000);
    return;
  }
  await loadTransfers(address.value);
};

const loadInternalTransactions = async () => {
  if (isFavorites.value) {
    const addresses = Array.from(cache.getFavoriteAddresses());
    await loadAddressesTransactions(addresses);
  } else {
    await loadAddressTransactions(address.value);
  }
};

const setLoadingTxns = (loading: boolean) => {
  loadingTxns.value = loading;
};

const setLoadingTokens = (loading: boolean) => {
  loadingTokens.value = loading;
};

const setTab = (tab: string) => {
  activeTab.value = tab;
};

const openPage = async (page: string) => {
  if (loadingPage.value) return;
  loadingPage.value = true;

  let newList: TransactionListItem[][] = [];
  let paginate: Pagination | DetailsPagination | FavoritesPagination;
  let addressSource: string | string[];

  if (isFavorites.value) {
    paginate = favoritesPagination;
    addressSource = Array.from(cache.getFavoriteAddresses());
  } else {
    paginate = activeTab.value === 'internal' ? pagination : detailsPagination;
    addressSource = address.value;
  }

  if (page === 'next') {
    newList = await paginate.showNextPage(addressSource as string & string[]);
  }
  if (page === 'prev') {
    newList = await paginate.showPrevPage(addressSource as string & string[]);
  }
  if (page === 'first') {
    newList = await paginate.showFirstPage(addressSource as string & string[]);
  }
  if (page === 'last') {
    newList = await paginate.showLastPage(addressSource as string & string[]);
  }

  transactionsList.value = newList;
  updatePagesState(paginate);
  loadingPage.value = false;
};

const updatePagesState = (pagination: Pagination | DetailsPagination | FavoritesPagination) => {
  // console.log('pagination.firstPage', pagination.firstPage)
  // console.log('pagination.lastPage', pagination.lastPage)
  // console.log('pagination.page', pagination.page)
  // console.log('pagination.prevPageReminder', pagination.prevPageReminder)
  // console.log('pagination.prevPageReminder', pagination.nextPageRE)
  isFirstPage.value = pagination.firstPage;
  isLastPage.value = pagination.lastPage;
  currentPage.value = pagination.page;
};

const deleteFavorite = async (address: string) => {
  cache.clearInternalTransactionsFavorites();
  cache.removeFavoriteAddress(address);
  await mountFavorites();
};
</script>

<template>
  <AddressHeader
    v-if="!isFavorites"
    :address="address"
    :unspent="unspent"
    :tokens="tokens"
    :loadingTokens="loadingTokens"
    :lastUpdateDate="lastUpdateDate"
    :unspentEthUsd="unspentEthUsd"
    @updateData="updateData"
    :isContract="!!tokenCreator"
    :tokenCreator="tokenCreator"
    :tokenInfo="tokenInfo"
  />
  <FavoritesHeader
    v-if="isFavorites"
    :unspent="sumUnspent"
    :balance="sumBalance"
    :favorites="favoritesWithDetails"
    :loadingTokens="loadingTokens"
    :tokens="tokens"
    :lastUpdateDate="lastUpdateDate"
    :sumUnspentEthUsd="sumUnspentEthUsd"
    @updateData="updateData"
    @deleteFavorite="deleteFavorite"
  />

  <TransactionsList
    :loadingTxns="loadingTxns"
    :address="address"
    :activeTab="activeTab"
    :transactions="transactionsList"
    :isFirstPage="isFirstPage"
    :isLastPage="isLastPage"
    :currentPage="currentPage"
    :warning="warning"
    :loadingPage="loadingPage"
    :paginationOn="!isFavorites"
    @loadTokensTransfers="loadTokensTransfers"
    @loadInternalTransactions="loadInternalTransactions"
    @openPage="openPage"
  />
</template>
