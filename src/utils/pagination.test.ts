import { describe, it, expect, vi } from 'vitest';
import { createPaginatedIterator, collectAll } from './pagination.js';
import type { PaginatedResponse } from '../types/common.js';

describe('createPaginatedIterator', () => {
  it('should iterate through a single page', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      pagination: { hasMore: false },
    } as PaginatedResponse<{ id: number }>);

    const items: { id: number }[] = [];
    for await (const item of createPaginatedIterator<{ id: number }>(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(undefined);
  });

  it('should iterate through multiple pages', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        pagination: { hasMore: true, cursor: 'cursor1' },
      })
      .mockResolvedValueOnce({
        data: [{ id: 3 }, { id: 4 }],
        pagination: { hasMore: true, cursor: 'cursor2' },
      })
      .mockResolvedValueOnce({
        data: [{ id: 5 }],
        pagination: { hasMore: false },
      });

    const items: { id: number }[] = [];
    for await (const item of createPaginatedIterator<{ id: number }>(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'cursor1');
    expect(fetchPage).toHaveBeenNthCalledWith(3, 'cursor2');
  });

  it('should handle empty first page', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      data: [],
      pagination: { hasMore: false },
    });

    const items: unknown[] = [];
    for await (const item of createPaginatedIterator(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('should stop when page is empty even if hasMore is true', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: 1 }],
        pagination: { hasMore: true, cursor: 'cursor1' },
      })
      .mockResolvedValueOnce({
        data: [],
        pagination: { hasMore: true, cursor: 'cursor2' },
      });

    const items: { id: number }[] = [];
    for await (const item of createPaginatedIterator<{ id: number }>(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: 1 }]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('should allow early break from iteration', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        pagination: { hasMore: true, cursor: 'cursor1' },
      })
      .mockResolvedValueOnce({
        data: [{ id: 4 }, { id: 5 }],
        pagination: { hasMore: false },
      });

    const items: { id: number }[] = [];
    for await (const item of createPaginatedIterator<{ id: number }>(fetchPage)) {
      items.push(item);
      if (item.id === 2) break;
    }

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});

describe('collectAll', () => {
  it('should collect all items from an async iterable', async () => {
    async function* generate() {
      yield 1;
      yield 2;
      yield 3;
    }

    const items = await collectAll(generate());
    expect(items).toEqual([1, 2, 3]);
  });

  it('should return empty array for empty iterable', async () => {
    async function* generate() {
      // Empty generator
    }

    const items = await collectAll(generate());
    expect(items).toEqual([]);
  });

  it('should work with paginated iterator', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        pagination: { hasMore: true, cursor: 'cursor1' },
      })
      .mockResolvedValueOnce({
        data: [{ id: 3 }],
        pagination: { hasMore: false },
      });

    const items = await collectAll(createPaginatedIterator(fetchPage));
    expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });
});
