import type {
  ERC20TokenInfo,
  OtsGetContractCreatorResponse,
  TokenBalance,
  TransactionListItem,
  UnspentWithUsd,
} from '@/types';

export class AddressCache {
  private static instance: AddressCache;

  private tokens: Map<string, TokenBalance[]> = new Map();
  private internalTransactions: Map<string, TransactionListItem[][]> = new Map();
  private tokenTransfersTransactions: Map<string, TransactionListItem[][]> = new Map();
  private unspent: Map<string, UnspentWithUsd> = new Map();
  private updatedAtTimestamp: Map<string, number> = new Map();

  private tokenInfo: Map<string, ERC20TokenInfo | null> = new Map();
  private tokenCreator: Map<string, OtsGetContractCreatorResponse> = new Map();

  private favoriteAddresses = new Set<string>();

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
    this.updatedAtTimestamp.clear();
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
    this.tokenInfo.delete(address);
    this.tokenCreator.delete(address);
  }

  clearAddressesForUpdate(addresses: string[]): void {
    addresses.forEach((address) => {
      this.clearAddressForUpdate(address);
    });
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

  hasUpdatedAtTimestampForEveryAddress(addresses: string[]): boolean {
    return addresses.every((address) => this.updatedAtTimestamp.has(address));
  }

  getUpdatedAtTimestampForAddresses(addresses: string[]): Map<string, number> {
    let cachedTimestamps: Map<string, number> = new Map();
    addresses.forEach((address: string) => {
      const timestamp = this.getUpdatedAtTimestamp(address);
      cachedTimestamps.set(address, timestamp);
    });
    return cachedTimestamps;
  }

  getLowestUpdatedAtTimestampForAddresses(addresses: string[]): number {
    const cached = this.getUpdatedAtTimestampForAddresses(addresses);
    const timestamps = Array.from(cached.values()).filter((timestamp) => timestamp > 0);
    if (!timestamps.length) {
      return 0;
    }
    return Math.min(...timestamps);
  }

  setUpdatedAtTimestampForAddresses(addresses: string[], timestamp: number): void {
    addresses.forEach((address: string) => {
      this.setUpdatedAtTimestamp(address, timestamp);
    });
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

  addUnspent(address: string, unspent: UnspentWithUsd): void {
    this.unspent.set(address, unspent);
  }

  getUnspent(address: string): UnspentWithUsd | undefined {
    return this.unspent.get(address);
  }

  hasUnspent(address: string): boolean {
    return this.unspent.has(address);
  }

  removeUnspent(address: string): void {
    this.unspent.delete(address);
  }

  getAllUnspent(): ReadonlyMap<string, UnspentWithUsd> {
    return this.unspent;
  }

  /**
   * Tokens Balances Cache
   */

  addTokens(address: string, tokens: TokenBalance[]): void {
    this.tokens.set(address, tokens);
  }

  getTokens(address: string): TokenBalance[] | undefined {
    return this.tokens.get(address);
  }

  removeTokensAddress(address: string): void {
    this.tokens.delete(address);
  }

  getAllTokens(): ReadonlyMap<string, TokenBalance[]> {
    return this.tokens;
  }

  hasTokensForEveryAddress(addresses: string[]): boolean {
    return addresses.every((address) => this.tokens.has(address));
  }

  getTokensForAddresses(addresses: string[]): Map<string, TokenBalance[]> {
    let cachedTokens: Map<string, TokenBalance[]> = new Map();
    addresses.forEach((address: string) => {
      const tokens = this.getTokens(address) || [];
      cachedTokens.set(address, tokens);
    });
    return cachedTokens;
  }

  /**
   * Internal Transactions Cache
   */

  addInternalTransactions(address: string, transactions: TransactionListItem[][]): void {
    this.internalTransactions.set(address, transactions);
  }

  getInternalTransactions(address: string): TransactionListItem[][] | undefined {
    return this.internalTransactions.get(address);
  }

  hasInternalTransactionsAddress(address: string): boolean {
    return this.internalTransactions.has(address);
  }

  removeInternalTransactionsAddress(address: string): void {
    this.internalTransactions.delete(address);
  }

  getAllInternalTransactions(): ReadonlyMap<string, TransactionListItem[][]> {
    return this.internalTransactions;
  }

  hasInternalTransactionsForEveryAddress(addresses: string[]): boolean {
    return addresses.every((address) => this.internalTransactions.has(address));
  }

  getInternalTransactionsForAddresses(addresses: string[]): Map<string, TransactionListItem[][]> {
    let cachedTxns: Map<string, TransactionListItem[][]> = new Map();
    addresses.forEach((address: string) => {
      const txns = this.getInternalTransactions(address) || [];
      cachedTxns.set(address, txns);
    });
    return cachedTxns;
  }

  /**
   * Token Transfers Transactions Cache
   */

  addTokenTransfersTransactions(address: string, transactions: TransactionListItem[][]): void {
    this.tokenTransfersTransactions.set(address, transactions);
  }

  getTokenTransfersTransactions(address: string): TransactionListItem[][] | undefined {
    return this.tokenTransfersTransactions.get(address);
  }

  hasTokenTransfersTransactionsAddress(address: string): boolean {
    return this.tokenTransfersTransactions.has(address);
  }

  removeTokenTransfersTransactionsAddress(address: string): void {
    this.tokenTransfersTransactions.delete(address);
  }

  getAllTokenTransfersTransactions(): ReadonlyMap<string, TransactionListItem[][]> {
    return this.tokenTransfersTransactions;
  }

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
}
