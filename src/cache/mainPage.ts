import type { OtsSearchTransactionExtended, TxInfoExtended } from '@/types';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';

export class MainPageCache {
  private static instance: MainPageCache = new MainPageCache();

  private constructor() {}

  private gasPriceGwei: string = '';
  private maxPriorityFeeGwei: string = '';
  private favoriteAddresses = <string[]>[];
  private favoriteTxns = <OtsSearchTransactionExtended[]>[];
  private lastBlocks = <BlockInfo[]>[];
  private lastTxns = <TxInfoExtended[]>[];
  private ethPrice = 0;
  private lastUpdateTimestamp = 0;

  static getInstance(): MainPageCache {
    return MainPageCache.instance;
  }

  hasData(): boolean {
    // favoriteAddresses and favoriteTxns are not checked, because they may be empty
    return (
      this.gasPriceGwei !== '' &&
      this.maxPriorityFeeGwei !== '' &&
      this.lastBlocks.length !== 0 &&
      this.lastTxns.length !== 0 &&
      this.lastUpdateTimestamp !== 0
    );
  }

  setEthPrice(ethPrice: number): void {
    this.ethPrice = ethPrice;
  }
  getEthPrice(): number {
    return this.ethPrice;
  }

  setGasPriceGwei(gasPriceGwei: string): void {
    this.gasPriceGwei = gasPriceGwei;
  }
  getGasPriceGwei(): string {
    return this.gasPriceGwei;
  }

  setFavoriteAddresses(favoriteAddresses: string[]): void {
    this.favoriteAddresses = favoriteAddresses;
  }

  getFavoriteAddresses(): string[] {
    return this.favoriteAddresses;
  }

  setFavoriteTxns(favoriteTxns: OtsSearchTransactionExtended[]): void {
    this.favoriteTxns = favoriteTxns;
  }

  getFavoriteTxns(): OtsSearchTransactionExtended[] {
    return this.favoriteTxns;
  }

  setLastBlocks(lastBlocks: BlockInfo[]): void {
    this.lastBlocks = lastBlocks;
  }
  getLastBlocks(): BlockInfo[] {
    return this.lastBlocks;
  }

  setLastTxns(lastTxns: TxInfoExtended[]): void {
    this.lastTxns = lastTxns;
  }
  getLastTxns(): TxInfoExtended[] {
    return this.lastTxns;
  }

  setMaxPriorityFeeGwei(maxPriorityFeeGwei: string): void {
    this.maxPriorityFeeGwei = maxPriorityFeeGwei;
  }
  getMaxPriorityFeeGwei(): string {
    return this.maxPriorityFeeGwei;
  }

  setLastUpdateTimestamp(timestamp: number): void {
    this.lastUpdateTimestamp = timestamp;
  }
  getLastUpdateTimestamp(): number {
    return this.lastUpdateTimestamp;
  }
}
