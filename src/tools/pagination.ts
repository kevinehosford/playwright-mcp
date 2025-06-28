/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  filter?: string;
}

export interface PaginationMetadata {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  metadata: PaginationMetadata;
}

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(1000).optional().describe('Maximum number of items to return (default: 50, max: 1000)'),
  offset: z.number().int().min(0).optional().describe('Number of items to skip (default: 0)'),
});

export const filterSchema = z.object({
  filter: z.string().optional().describe('Text to search for in the content'),
});

export function applyPagination<T>(
  items: T[],
  params: PaginationParams = {}
): PaginatedResult<T> {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const total = items.length;

  const paginatedItems = items.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    items: paginatedItems,
    metadata: {
      total,
      limit,
      offset,
      hasMore,
    },
  };
}

export function applyTextFilter<T>(
  items: T[],
  filterText: string | undefined,
  textExtractor: (item: T) => string
): T[] {
  if (!filterText)
    return items;

  const searchTerm = filterText.toLowerCase();
  return items.filter(item =>
    textExtractor(item).toLowerCase().includes(searchTerm)
  );
}

export function formatPaginationInfo(metadata: PaginationMetadata): string {
  const { total, limit, offset, hasMore } = metadata;
  const start = Math.min(offset + 1, total);
  const end = Math.min(offset + limit, total);

  if (total === 0)
    return 'No items found';

  let info = `Showing ${start}-${end} of ${total} items`;
  if (hasMore)
    info += ` (use offset: ${offset + limit} for more)`;

  return info;
}
