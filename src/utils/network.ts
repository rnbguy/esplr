import type { Web3Provider } from 'micro-eth-signer/net';
import type {
  TokenBalances,
  BlockInfo,
  TxReceipt,
} from 'node_modules/micro-eth-signer/net/archive';
import { isERC20TokenInfo } from '@/utils/utils';

import type {
  OtsSearchTransactionsBeforeResponse,
  OtsSearchTransaction,
  OtsGetBlockDetailsResponse,
  ERC20TokenInfo,
  TokenBalance,
  TxInfoExtended,
  OtsSearchTransactionExtended,
} from '@/types';

export const getBlockDetailsByHash = async (
  prov: Web3Provider,
  blockHash: string
): Promise<OtsGetBlockDetailsResponse> => {
  return await prov.call('ots_getBlockDetailsByHash', blockHash);
};

export const getTransactionsBefore = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionsBeforeResponse> => {
  return await prov.call('ots_searchTransactionsBefore', address, blockNumber, pageSize);
};

export const getTransactionsAfter = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionsBeforeResponse> => {
  return await prov.call('ots_searchTransactionsAfter', address, blockNumber, pageSize);
};

export const getTransactionsBeforeWithBlockDetails = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionExtended[]> => {
  const transactions = await getTransactionsBefore(prov, address, blockNumber, pageSize);
  return transactions.txs.map((txn: OtsSearchTransaction) => {
    const receipt = transactions.receipts.find((r) => r.transactionHash === txn.hash);
    const blockData = {
      timestamp: receipt?.timestamp ?? '-',
    };
    return { txn, blockData };
  });
};

export const getTransactionsAfterWithBlockDetails = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionExtended[]> => {
  const transactions = await getTransactionsAfter(prov, address, blockNumber, pageSize);
  return transactions.txs.map((txn: OtsSearchTransaction) => {
    const receipt = transactions.receipts.find((r) => r.transactionHash === txn.hash);
    const blockData = {
      timestamp: receipt?.timestamp ?? '-',
    };
    return { txn, blockData };
  });
};

export const getLatestTxnsWithBlockDetails = async (
  prov: Web3Provider,
  address: string,
  limit: number
): Promise<OtsSearchTransactionExtended[]> => {
  const blockNumber = 0; // A value of 0 means the search is to be done from the most recent block
  const latestTransactions = await getTransactionsBefore(prov, address, blockNumber, limit);
  return latestTransactions.txs.map((txn: OtsSearchTransaction) => {
    const receipt = latestTransactions.receipts.find((r) => r.transactionHash === txn.hash);
    const blockData = {
      timestamp: receipt?.timestamp ?? '-',
    };
    return { txn, blockData };
  });
};

export const getUnspent = async (prov: Web3Provider, address: string) => {
  return await prov.unspent(address);
};

export const getGasPriceWei = async (prov: Web3Provider) => {
  const gasPriceHex = await prov.call('eth_gasPrice');
  return BigInt(gasPriceHex);
};

export const getERC20TokenInfo = async (
  prov: Web3Provider,
  contractAddress: string
): Promise<ERC20TokenInfo | null> => {
  const info = await prov.tokenInfo(contractAddress as string);
  if (isERC20TokenInfo(info)) {
    return info;
  }
  return null;
};

export const loadTokenInfoByBalances = async (
  prov: Web3Provider,
  balances: TokenBalances
): Promise<TokenBalance[]> => {
  const results = await Promise.all(
    Object.entries(balances).map(async ([token, erc20Balance]) => {
      const result = {
        token,
        balance: null as bigint | null,
        info: null as ERC20TokenInfo | null,
      };
      // accrording to micro-eth-signer format ERC20 balances are stored as Map([[1n, balance]])
      if ('get' in erc20Balance) {
        result.balance = erc20Balance.get(1n) ?? null;
      } else {
        console.warn(`Error fetching token balance for token ${token}:`);
        result.balance = null;
      }

      try {
        result.info = await getERC20TokenInfo(prov, token);
      } catch (e) {
        console.warn(`Error fetching token info for token ${token}:`, e);
        result.info = null;
      }

      return result;
    })
  );
  return results.filter((item) => item.info !== null && item.balance !== null);
};

export const getLastBlocksBefore = async (
  prov: Web3Provider,
  fromBlock: number,
  count: number
): Promise<BlockInfo[]> => {
  if (count == 0 || fromBlock == 0) return [];
  const blockPromises = Array.from({ length: count }, (_, i) => prov.blockInfo(fromBlock - i));
  return Promise.all(blockPromises);
};

export const getLastTransactions = async (
  prov: Web3Provider,
  lastBlocks: BlockInfo[],
  limit: number
) => {
  let result: TxInfoExtended[] = [];
  for (const block of lastBlocks) {
    const startIndex = 0;
    const details = await prov.call('ots_getBlockTransactions', block.number, startIndex, limit);
    const newTxns = details.fullblock.transactions.map((txn: TxInfoExtended) => {
      txn.blockData = { timestamp: block.timestamp };
      return txn;
    });
    result = [...result, ...newTxns.reverse()];
    if (result.length >= limit) {
      break;
    }
  }
  return result.slice(0, limit);
};

export const getLastTxnsByAddresses = async (
  prov: Web3Provider,
  addresses: string[],
  limit: number
): Promise<OtsSearchTransactionExtended[]> => {
  const results = await Promise.all(
    addresses.map(async (addr) => {
      return await prov.call('ots_searchTransactionsBefore', addr, 0, limit);
    })
  );

  const txnsByAddr = results.map((res) => {
    return res.txs.map((txn: OtsSearchTransaction) => {
      const receipt = res.receipts.find((r: TxReceipt) => r.transactionHash === txn.hash);
      const blockData = {
        timestamp: receipt?.timestamp ?? '-',
      };
      return { txn, blockData };
    });
  });

  const allTxnsList = txnsByAddr.flat();
  const uniqueTxnsList: OtsSearchTransactionExtended[] = [];

  const hashes = new Set<string>();
  for (const txn of allTxnsList) {
    const txnHash = txn.txn.hash;
    if (hashes.has(txnHash)) {
      continue;
    }
    hashes.add(txnHash);
    uniqueTxnsList.push(txn);
  }

  const sortedTxns = uniqueTxnsList.sort((a, b) => {
    if (a.blockData.timestamp === '-') return 1;
    if (b.blockData.timestamp === '-') return -1;
    return parseInt(b.blockData.timestamp) - parseInt(a.blockData.timestamp);
  });

  return sortedTxns.slice(0, limit);
};
