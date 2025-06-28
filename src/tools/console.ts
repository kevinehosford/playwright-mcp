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

const console = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_console_messages',
    title: 'Get console messages',
    description: 'Returns all console messages',
    inputSchema: z.object({
      ...paginationSchema.shape,
      ...filterSchema.shape,
      type: z.enum(['log', 'error', 'warn', 'info', 'debug', 'trace']).optional().describe('Filter by message type'),
    }),
    type: 'readOnly',
  },
  handle: async (context, params) => {
    let messages = context.currentTabOrDie().consoleMessages();

    // Apply filtering by type
    if (params.type)
      messages = messages.filter(message => message.type() === params.type);

    // Apply text filtering
    if (params.filter) {
      messages = applyTextFilter(
          messages,
          params.filter,
          message => `${message.type()} ${message.text()}`
      );
    }

    // Apply pagination
    const paginatedResult = applyPagination(messages, params);
    const log = paginatedResult.items.map(message => `[${message.type().toUpperCase()}] ${message.text()}`).join('\n');
    const paginationInfo = formatPaginationInfo(paginatedResult.metadata);

    return {
      code: [`// <internal code to get console messages>`],
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

export default [
  console,
];
