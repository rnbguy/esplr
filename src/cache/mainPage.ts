import type { OtsSearchTransactionExtended, TxInfoExtended } from '@/types';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';

export class MainPageCache {
  private static instance: MainPageCache;

  private constructor() {}

  private gasPriceGwei: string = '';
  private maxPriorityFeeGwei: string = '';
  private favoriteAddresses = <string[]>[];
  private favoriteTxns = <OtsSearchTransactionExtended[]>[];
  private lastBlocks = <BlockInfo[]>[];
  private lastTxns = <TxInfoExtended[]>[];
  private lastUpdateDate = '';
  private ethPrice = 0;

  static getInstance(): MainPageCache {
    if (!MainPageCache.instance) {
      MainPageCache.instance = new MainPageCache();
    }

    return MainPageCache.instance;
  }

  hasData(): boolean {
    // favoriteAddresses and favoriteTxns are not checked, because they may be empty
    return (
      this.gasPriceGwei !== '' &&
      this.maxPriorityFeeGwei !== '' &&
      this.lastBlocks.length !== 0 &&
      this.lastTxns.length !== 0 &&
      this.lastUpdateDate !== ''
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

  setLastUpdateDate(lastUpdateDate: string): void {
    this.lastUpdateDate = lastUpdateDate;
  }
  getLastUpdateDate(): string {
    return this.lastUpdateDate;
  }

  setMaxPriorityFeeGwei(maxPriorityFeeGwei: string): void {
    this.maxPriorityFeeGwei = maxPriorityFeeGwei;
  }
  getMaxPriorityFeeGwei(): string {
    return this.maxPriorityFeeGwei;
  }
}
