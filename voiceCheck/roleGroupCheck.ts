/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */


import { settings } from "..";
import { CheckType, RoleGroupSetting } from "../types";
import { checkUserForRoles } from "../utils";
import { VoiceCheckStrategyGroupBase } from "./voiceCheckStrategyGroupBase";

export class RoleGroupCheck extends VoiceCheckStrategyGroupBase<RoleGroupSetting> {
    protected type = CheckType.RoleGroups;

    protected getGroups() { return settings.store.roleGroups; }

    protected checkUser(userId: string, guildId: string, group: RoleGroupSetting) {
        const { includeUserIds, excludeUserIds, roles } = group;

        if (excludeUserIds.includes(userId)) return false;
        if (includeUserIds.includes(userId)) return true;

        const roleIds = roles.map(role => role.id);
        return checkUserForRoles(userId, guildId, roleIds);
    }
}
