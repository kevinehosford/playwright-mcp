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
import { defineTool } from './tool.js';
import { paginationSchema, filterSchema, applyPagination, applyTextFilter, formatPaginationInfo } from './pagination.js';

import type * as playwright from 'playwright';

const requests = defineTool({
  capability: 'core',

  schema: {
    name: 'browser_network_requests',
    title: 'List network requests',
    description: 'Returns all network requests since loading the page',
    inputSchema: z.object({
      ...paginationSchema.shape,
      ...filterSchema.shape,
      method: z.string().optional().describe('Filter by HTTP method (GET, POST, etc.)'),
      status: z.number().int().min(100).max(599).optional().describe('Filter by HTTP status code'),
      url: z.string().optional().describe('Filter by URL pattern'),
    }),
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const requests = context.currentTabOrDie().requests();
    let requestEntries = [...requests.entries()];

    // Apply filtering
    if (params.method) {
      const methodFilter = params.method.toUpperCase();
      requestEntries = requestEntries.filter(([request]) =>
        request.method().toUpperCase() === methodFilter
      );
    }

    if (params.status) {
      requestEntries = requestEntries.filter(([, response]) =>
        response?.status() === params.status
      );
    }

    if (params.url) {
      const urlPattern = params.url.toLowerCase();
      requestEntries = requestEntries.filter(([request]) =>
        request.url().toLowerCase().includes(urlPattern)
      );
    }

    if (params.filter) {
      requestEntries = applyTextFilter(
          requestEntries,
          params.filter,
          ([request, response]) => `${request.method()} ${request.url()} ${response?.status() || ''} ${response?.statusText() || ''}`
      );
    }

    // Apply pagination
    const paginatedResult = applyPagination(requestEntries, params);
    const log = paginatedResult.items.map(([request, response]) => renderRequest(request, response)).join('\n');
    const paginationInfo = formatPaginationInfo(paginatedResult.metadata);

    return {
      code: [`// <internal code to list network requests>`],
      action: async () => {
        const content: { type: 'text'; text: string }[] = [];
        if (log)
          content.push({ type: 'text', text: log });
        content.push({ type: 'text', text: `\n---\n${paginationInfo}` });
        return { content };
      },
      captureSnapshot: false,
      waitForNetwork: false,
    };
  },
});

function renderRequest(request: playwright.Request, response: playwright.Response | null) {
  const result: string[] = [];
  result.push(`[${request.method().toUpperCase()}] ${request.url()}`);
  if (response)
    result.push(`=> [${response.status()}] ${response.statusText()}`);
  return result.join(' ');
}

export default [
  requests,
];
