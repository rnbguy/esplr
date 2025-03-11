import type {
  ERC20TokenInfo,
  OtsGetContractCreatorResponse,
  TokenBalance,
  TransactionListItem,
} from '@/types';
import type { Unspent } from 'node_modules/micro-eth-signer/net/archive';

export class AddressCache {
  private static instance: AddressCache;

  private tokens: Map<string, TokenBalance[]> = new Map();
  private internalTransactions: Map<string, TransactionListItem[][]> = new Map();
  private tokenTransfersTransactions: Map<string, TransactionListItem[][]> = new Map();
  private unspent: Map<string, Unspent> = new Map();
  private updatedAtTimestamp: Map<string, number> = new Map();
  private unspentEthUsd: Map<string, number> = new Map();

  private tokenInfo: Map<string, ERC20TokenInfo | null> = new Map();
  private tokenCreator: Map<string, OtsGetContractCreatorResponse> = new Map();

  private favoriteAddresses = new Set<string>();
  private internalTransactionsFavorites = <TransactionListItem[][]>[];

  private constructor() {}

  static getInstance(): AddressCache {
    if (!AddressCache.instance) {
      AddressCache.instance = new AddressCache();
    }

    return AddressCache.instance;
  }

  clear(): void {
    this.tokens.clear();
    this.internalTransactions.clear();
    this.tokenTransfersTransactions.clear();
    this.unspent.clear();
    this.updatedAtTimestamp.clear()
    this.unspentEthUsd.clear();
    this.tokenInfo.clear();
    this.tokenCreator.clear();
  }

  clearAddress(address: string): void {
    this.clearAddressForUpdate(address);
    this.tokenTransfersTransactions.delete(address);
  }

  // tokenTransfersTransactions is not cleared here (because we are not loading them from scratch later for optimization)
  clearAddressForUpdate(address: string): void {
    this.tokens.delete(address);
    this.internalTransactions.delete(address);
    this.unspent.delete(address);
    this.updatedAtTimestamp.delete(address);
    this.unspentEthUsd.delete(address);
    this.tokenInfo.delete(address);
    this.tokenCreator.delete(address);
  }

  allCachedAddresses(): string[] {
    return Array.from(
      new Set([
        ...this.tokens.keys(),
        ...this.internalTransactions.keys(),
        ...this.tokenTransfersTransactions.keys(),
        ...this.unspent.keys(),
        ...this.updatedAtTimestamp.keys(),
        ...this.tokenInfo.keys(),
        ...this.tokenCreator.keys(),
      ])
    );
  }

  /**
   * Eth usd amount for address
   */

  setUnspentEthUsd(address: string, value: number): void {
    this.unspentEthUsd.set(address, value);
  }

  getUnspentEthUsd(address: string): number | undefined {
    return this.unspentEthUsd.get(address);
  }

  hasUnspentEthUsd(address: string): boolean {
    return this.unspentEthUsd.has(address);
  }

  removeUnspentEthUsd(address: string): void {
    this.unspentEthUsd.delete(address);
  }

  /**
   * Update date timestamp cache
   */

  setUpdatedAtTimestamp(address: string, timestamp: number): void {
    this.updatedAtTimestamp.set(address, timestamp);
  }

  getUpdatedAtTimestamp(address: string): number {
    return this.updatedAtTimestamp.get(address) ?? 0;
  }

  hasUpdatedAtTimestamp(address: string): boolean {
    return this.updatedAtTimestamp.has(address);
  }

  removeUpdatedAtTimestamp(address: string): void {
    this.updatedAtTimestamp.delete(address);
  }

  /**
   * Token Creator Cache
   */

  addTokenCreator(address: string, tokenCreator: OtsGetContractCreatorResponse): void {
    this.tokenCreator.set(address, tokenCreator);
  }

  getTokenCreator(address: string): OtsGetContractCreatorResponse | undefined {
    return this.tokenCreator.get(address);
  }

  hasTokenCreator(address: string): boolean {
    return this.tokenCreator.has(address);
  }

  removeTokenCreator(address: string): void {
    this.tokenCreator.delete(address);
  }

  getAllTokenCreator(): ReadonlyMap<string, OtsGetContractCreatorResponse> {
    return this.tokenCreator;
  }

  /**
   * Token Info Cache
   */

  addTokenInfo(address: string, tokenInfo: ERC20TokenInfo | null): void {
    this.tokenInfo.set(address, tokenInfo);
  }

  getTokenInfo(address: string): ERC20TokenInfo | undefined | null {
    return this.tokenInfo.get(address);
  }

  hasTokenInfo(address: string): boolean {
    return this.tokenInfo.has(address);
  }

  removeTokenInfo(address: string): void {
    this.tokenInfo.delete(address);
  }

  getAllTokenInfo(): ReadonlyMap<string, ERC20TokenInfo | null> {
    return this.tokenInfo;
  }

  /**
   * Unspent Cache
   */

  addUnspent(address: string, unspent: Unspent): void {
    this.unspent.set(address, unspent);
  }

  getUnspent(address: string): Unspent | undefined {
    return this.unspent.get(address);
  }

  hasUnspent(address: string): boolean {
    return this.unspent.has(address);
  }

  removeUnspent(address: string): void {
    this.unspent.delete(address);
  }

  getAllUnspent(): ReadonlyMap<string, Unspent> {
    return this.unspent;
  }

  /**
   * Tokens Balances Cache
   */

  // Add token balance for a specific address
  addToken(address: string, tokens: TokenBalance[]): void {
    this.tokens.set(address, tokens);
  }

  // Get token balance for a specific address
  getToken(address: string): TokenBalance[] | undefined {
    return this.tokens.get(address);
  }

  // Check if an address exists in the map
  hasTokenAddress(address: string): boolean {
    return this.tokens.has(address);
  }

  // Remove token balance for a specific address
  removeTokenAddress(address: string): void {
    this.tokens.delete(address);
  }

  // Get all tokens balances
  getAllTokens(): ReadonlyMap<string, TokenBalance[]> {
    return this.tokens;
  }

  /**
   * Internal Transactions Cache
   */

  // Add internal transactions for a specific address
  addInternalTransactions(address: string, transactions: TransactionListItem[][]): void {
    this.internalTransactions.set(address, transactions);
  }

  // Get internal transactions for a specific address
  getInternalTransactions(address: string): TransactionListItem[][] | undefined {
    return this.internalTransactions.get(address);
  }

  // Check if an address exists in the map
  hasInternalTransactionsAddress(address: string): boolean {
    return this.internalTransactions.has(address);
  }

  // Remove internal transactions for a specific address
  removeInternalTransactionsAddress(address: string): void {
    this.internalTransactions.delete(address);
  }

  // Get all internal transactions
  getAllInternalTransactions(): ReadonlyMap<string, TransactionListItem[][]> {
    return this.internalTransactions;
  }

  /**
   * Token Transfers Transactions Cache
   */

  // Add token transfers transactions for a specific address
  addTokenTransfersTransactions(address: string, transactions: TransactionListItem[][]): void {
    this.tokenTransfersTransactions.set(address, transactions);
  }

  // Get token transfers transactions for a specific address
  getTokenTransfersTransactions(address: string): TransactionListItem[][] | undefined {
    return this.tokenTransfersTransactions.get(address);
  }

  // Check if an address exists in the map
  hasTokenTransfersTransactionsAddress(address: string): boolean {
    return this.tokenTransfersTransactions.has(address);
  }

  // Remove token transfers transactions for a specific address
  removeTokenTransfersTransactionsAddress(address: string): void {
    this.tokenTransfersTransactions.delete(address);
  }

  // Get all token transfers transactions
  getAllTokenTransfersTransactions(): ReadonlyMap<string, TransactionListItem[][]> {
    return this.tokenTransfersTransactions;
  }

  // TODO: extract to separate favorite address cache class

  /**
   * FAVOURITE ADDRESSES
   */

  getFavoriteAddresses(): Set<string> {
    return this.favoriteAddresses;
  }

  addFavoriteAddress(address: string): void {
    this.favoriteAddresses.add(address);
  }

  isFavoriteAddress(address: string): boolean {
    return this.favoriteAddresses.has(address);
  }

  removeFavoriteAddress(address: string): void {
    this.favoriteAddresses.delete(address);
  }

  /**
   * FAVOURITE ADDRESSES INTERNAL TRANSACTIONS
   */

  hasInternalTransactionsAddressFavorites(): boolean {
    return this.internalTransactionsFavorites.length > 0;
  }

  getInternalTransactionsFavorites(): TransactionListItem[][] {
    return this.internalTransactionsFavorites;
  }

  addInternalTransactionsFavorites(txns: TransactionListItem[][]): void {
    this.internalTransactionsFavorites = txns;
  }

  clearInternalTransactionsFavorites(): void {
    this.internalTransactionsFavorites = [];
  }
}
