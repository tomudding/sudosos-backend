/**
 *  SudoSOS back-end API service.
 *  Copyright (C) 2024  Study association GEWIS
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 *  @license
 */

/**
 * This is the module page of the transaction summaries.
 * Not that this module has been created in very strict time constraints,
 * so its implementation is very minimal.
 * https://github.com/GEWIS/sudosos-backend/pull/415
 *
 * @module transaction-summaries
 */

import { BaseUserResponse } from './user-response';
import { DineroObjectResponse } from './dinero-response';

/**
 * @typedef {object} ContainerSummaryResponse
 * @property {allOf|BaseUserResponse} user.required
 * @property {allOf|DineroObjectResponse} totalInclVat.required
 * @property {integer} amountOfProducts.required
 * @property {integer} containerId.required
 */
export interface ContainerSummaryResponse {
  user: BaseUserResponse;
  totalInclVat: DineroObjectResponse;
  amountOfProducts: number;
  containerId: number;
}
