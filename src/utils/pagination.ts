import type { PaginatedResponse } from '../types/common.js';

/**
 * Options for paginated requests
 */
export interface PaginationOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Create an async iterator from a paginated API endpoint
 */
export function createPaginatedIterator<T>(
  fetchPage: (cursor?: string) => Promise<PaginatedResponse<T>>
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      let cursor: string | undefined;
      let hasMore = true;
      let currentPage: T[] = [];
      let currentIndex = 0;

      return {
        async next(): Promise<IteratorResult<T>> {
          // If we have items in the current page, return the next one
          if (currentIndex < currentPage.length) {
            return { value: currentPage[currentIndex++], done: false };
          }

          // If no more pages, we're done
          if (!hasMore) {
            return { value: undefined, done: true };
          }

          // Fetch the next page
          const response = await fetchPage(cursor);
          currentPage = response.data;
          currentIndex = 0;
          cursor = response.pagination.cursor;
          hasMore = response.pagination.hasMore;

          // If the page is empty, we're done
          if (currentPage.length === 0) {
            return { value: undefined, done: true };
          }

          return { value: currentPage[currentIndex++], done: false };
        },
      };
    },
  };
}

/**
 * Collect all items from an async iterable into an array
 */
export async function collectAll<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
}
