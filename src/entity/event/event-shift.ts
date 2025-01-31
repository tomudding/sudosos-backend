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
 * This is the module page of event-shift.
 *
 * @module events
 * @deprecated Events are out of scope for SudoSOS. Delete from 01/11/2026.
 */

import {
  Column, DeleteDateColumn, Entity, JoinTable, ManyToMany,
} from 'typeorm';
import BaseEntity from '../base-entity';
import Role from '../rbac/role';

/**
 * @typedef {BaseEntity} EventShift
 * @property {string} name - Name of the shift.
 * @property {boolean} default - Indicator whether the shift is a regular shift.
 * @deprecated Events are out of scope for SudoSOS. Delete from 01/11/2026.
 */

@Entity()
export default class EventShift extends BaseEntity {
  @DeleteDateColumn()
  public deletedAt?: Date | null;

  @Column()
  public name: string;

  @ManyToMany(() => Role, { eager: true, onUpdate: 'CASCADE' })
  @JoinTable()
  public roles: Role[];
}
