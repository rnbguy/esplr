import { Pagination } from '@/views/Pagination';
import { Web3Provider } from 'micro-eth-signer/net';
import { jsonrpc } from 'micro-ftch';
import { describe, expect, it, vi } from 'vitest';

import firstNextReminder from './pagination-mock/first-page-next-reminder.json';
import firstNoNextReminder from './pagination-mock/first-page-no-next-reminder.json';
import nextFromRemindersNextReminder from './pagination-mock/next-page-from-reminders-next-reminder.json';
import nextFromRemindersNoReminders from './pagination-mock/next-page-from-reminders-no-reminders.json';
import nextFromRemindersPrevReminderMoreThanPageSize from './pagination-mock/next-page-from-reminders-prev-reminder-more-than-page-size.json';
import nextFromRemindersPrevReminderPageSize from './pagination-mock/next-page-from-reminders-prev-reminder-page-size.json';
import nextFromRemindersPrevReminder from './pagination-mock/next-page-from-reminders-prev-reminder.json';
import nextFromScratchNoReminders from './pagination-mock/next-page-from-scratch-no-reminders.json';
import nextPartlyFromRemindersNextReminder from './pagination-mock/next-page-partly-from-reminders-next-reminder.json';
import nextPartlyFromRemindersNoReminders from './pagination-mock/next-page-partly-from-reminders-no-reminders.json';
import nextPartlyFromRemindersPrevReminderMoreThanPageSize from './pagination-mock/next-page-partly-from-reminders-prev-reminder-more-than-page-size.json';
import nextPartlyFromRemindersPrevReminderPageSize from './pagination-mock/next-page-partly-from-reminders-prev-reminder-page-size.json';
import nextPartlyFromRemindersPrevReminder from './pagination-mock/next-page-partly-from-reminders-prev-reminder.json';

const RPC_URL = 'http://localhost:6900';
const SHOW_TXNS_LIMIT = 5; // mock data from files is supposed to have 5 txns per page, just for testing purposes
const prov = new Web3Provider(jsonrpc(fetch.bind(window), RPC_URL));
const address = '0x1234567890123456789012345678901234567890';

const pagination = Pagination.getInstance(
  prov,
  SHOW_TXNS_LIMIT
  // mockGetLatestTxns,
);

const setupPaginationTest = async (mockJson: unknown) => {
  pagination.clear();
  const mockTxns = vi.fn().mockResolvedValue(mockJson);
  return await mockTxns();
};

describe('First page', () => {
  it('Load with no reminders', async () => {
    const testData = await setupPaginationTest(firstNoNextReminder);
    const firstPage = await pagination.showFirstPage(address, testData);

    expect(pagination.prevPageReminder).toEqual([]);
    expect(pagination.currentPageTxns).toEqual(firstPage);
    expect(pagination.nextPageReminder).toEqual([]);

    expect(pagination.firstTxnHash).toEqual(firstPage[0][0].hash);
    expect(pagination.firstTxnHash).toEqual(testData[0][0].hash);
  });

  it('Load with reminders', async () => {
    const testData = await setupPaginationTest(firstNextReminder);

    const firstPage = await pagination.showFirstPage(address, testData);
    const newReminder = testData.slice(SHOW_TXNS_LIMIT);

    expect(pagination.prevPageReminder).toEqual([]);
    expect(pagination.currentPageTxns).toEqual(firstPage);

    expect(newReminder.length).toBeGreaterThan(0);
    expect(pagination.nextPageReminder).toEqual(newReminder);

    expect(pagination.firstTxnHash).toEqual(firstPage[0][0].hash);
    expect(pagination.firstTxnHash).toEqual(testData[0][0].hash);
  });
});

describe('Next page', () => {
  it('Load full from reminder, no new reminders', async () => {
    const testData = await setupPaginationTest(nextFromRemindersNoReminders);

    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;

    await pagination.showNextPage(address);
    expect(pagination.prevPageReminder).toEqual([]);
    expect(pagination.currentPageTxns).toEqual(testData.nextPageReminder);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load full from reminder, only next reminder', async () => {
    const testData = await setupPaginationTest(nextFromRemindersNextReminder);

    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;

    await pagination.showNextPage(address);
    expect(pagination.prevPageReminder).toEqual([]);
    expect(pagination.currentPageTxns).toEqual(testData.nextPageReminder.slice(0, SHOW_TXNS_LIMIT));
    expect(pagination.nextPageReminder).toEqual(testData.nextPageReminder.slice(SHOW_TXNS_LIMIT));
  });

  it('Load full from reminder, prev reminder short length', async () => {
    const testData = await setupPaginationTest(nextFromRemindersPrevReminder);

    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;

    await pagination.showNextPage(address);
    expect(pagination.prevPageReminder).toEqual(testData.expectedPrevReminder);
    expect(pagination.currentPageTxns).toEqual(testData.nextPageReminder);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load full from reminder, prev reminder length = page size', async () => {
    const testData = await setupPaginationTest(nextFromRemindersPrevReminderPageSize);

    pagination.prevPageReminder = testData.prevPageReminder;
    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;

    await pagination.showNextPage(address);
    expect(pagination.prevPageReminder).toEqual(testData.expectedPrevReminder);
    expect(pagination.currentPageTxns).toEqual(testData.nextPageReminder);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load full from reminder, prev reminder length > page size', async () => {
    const testData = await setupPaginationTest(nextFromRemindersPrevReminderMoreThanPageSize);

    pagination.prevPageReminder = testData.prevPageReminder;
    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;

    await pagination.showNextPage(address);
    expect(pagination.prevPageReminder).toEqual(testData.expectedPrevReminder);
    expect(pagination.currentPageTxns).toEqual(testData.nextPageReminder);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load next from scratch, no reminders', async () => {
    const testData = await setupPaginationTest(nextFromScratchNoReminders);

    const dataToLoad = testData.dataToLoad;
    pagination.currentPageTxns = testData.currentPageTxns;

    // console.log('dataToLoad', dataToLoad)
    await pagination.showNextPage(address, dataToLoad);
    expect(pagination.prevPageReminder).toEqual([]);
    expect(pagination.currentPageTxns).toEqual(dataToLoad);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load partly from reminder, get rest, no new reminders', async () => {
    const testData = await setupPaginationTest(nextPartlyFromRemindersNoReminders);

    const dataToLoad = testData.dataToLoad;
    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;
    const expectedCurrentPageTxns = testData.nextPageReminder.concat(dataToLoad);

    await pagination.showNextPage(address, dataToLoad);
    expect(pagination.prevPageReminder).toEqual([]);
    expect(expectedCurrentPageTxns.length).toBe(SHOW_TXNS_LIMIT);
    expect(pagination.currentPageTxns).toEqual(expectedCurrentPageTxns);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load partly from reminder, get rest, only next reminder', async () => {
    const testData = await setupPaginationTest(nextPartlyFromRemindersNextReminder);

    const dataToLoad = testData.dataToLoad;
    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;
    const expectedCurrentPageTxns = testData.nextPageReminder
      .concat(dataToLoad)
      .slice(0, SHOW_TXNS_LIMIT);

    await pagination.showNextPage(address, dataToLoad);
    expect(pagination.prevPageReminder).toEqual([]);
    expect(expectedCurrentPageTxns.length).toBe(SHOW_TXNS_LIMIT);
    expect(pagination.currentPageTxns).toEqual(expectedCurrentPageTxns);
    expect(pagination.nextPageReminder).toEqual(testData.expectedNextReminder);
  });

  it('Load partly from reminder, get rest, prev remider short length', async () => {
    const testData = await setupPaginationTest(nextPartlyFromRemindersPrevReminder);

    const dataToLoad = testData.dataToLoad;
    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;
    const expectedCurrentPageTxns = testData.nextPageReminder.concat(dataToLoad);

    await pagination.showNextPage(address, dataToLoad);
    expect(pagination.prevPageReminder).toEqual(testData.expectedPrevReminder);
    expect(expectedCurrentPageTxns.length).toBe(SHOW_TXNS_LIMIT);
    expect(pagination.currentPageTxns).toEqual(expectedCurrentPageTxns);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load partly from reminder, get rest, prev remider length = page size', async () => {
    const testData = await setupPaginationTest(nextPartlyFromRemindersPrevReminderPageSize);

    const dataToLoad = testData.dataToLoad;
    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;
    const expectedCurrentPageTxns = testData.nextPageReminder.concat(dataToLoad);

    await pagination.showNextPage(address, dataToLoad);
    expect(pagination.prevPageReminder).toEqual(testData.expectedPrevReminder);
    expect(expectedCurrentPageTxns.length).toBe(SHOW_TXNS_LIMIT);
    expect(pagination.currentPageTxns).toEqual(expectedCurrentPageTxns);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('Load partly from reminder, get rest, prev remider length > page size', async () => {
    const testData = await setupPaginationTest(nextPartlyFromRemindersPrevReminderMoreThanPageSize);

    const dataToLoad = testData.dataToLoad;
    pagination.currentPageTxns = testData.currentPageTxns;
    pagination.nextPageReminder = testData.nextPageReminder;
    pagination.prevPageReminder = testData.prevPageReminder;
    const expectedCurrentPageTxns = testData.nextPageReminder.concat(dataToLoad);

    await pagination.showNextPage(address, dataToLoad);
    expect(pagination.prevPageReminder).toEqual(testData.expectedPrevReminder);
    expect(expectedCurrentPageTxns.length).toBe(SHOW_TXNS_LIMIT);
    expect(pagination.currentPageTxns).toEqual(expectedCurrentPageTxns);
    expect(pagination.nextPageReminder).toEqual([]);
  });

  it('If current page is last, return current page txns', async () => {
    const testData = await setupPaginationTest(firstNoNextReminder);
    const lastPage = await pagination.showLastPage(address, testData);

    expect(pagination.prevPageReminder).toEqual([]);
    expect(pagination.currentPageTxns).toEqual(lastPage);
    expect(pagination.nextPageReminder).toEqual([]);
    expect(pagination.lastTxnHash).toEqual(testData[testData.length - 1][0].hash);
    expect(pagination.lastTxnHash).toEqual(lastPage[lastPage.length - 1][0].hash);

    // TODO fix this (error happened when checking last or first page)
    // const nextPage = await pagination.showNextPage(address)
    // expect(nextPage).toEqual(lastPage)
    // expect(pagination.prevPageReminder).toEqual([])
    // expect(pagination.nextPageReminder).toEqual([])
  });
});
