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

import { GuildMemberStore } from "@webpack/common";

import { settings } from "..";
import { CheckType, GroupUpdateResult, VoiceState } from "../types";
import { RoleGroupSetting } from "./../types";
import { UserCheckStrategy } from "./userCheckStrategy";

export class RoleGroupCheck implements UserCheckStrategy {
    process(chanId: string, guildId: string, userIds: string[], stateUpdates?: VoiceState[]) {
        const enabledGroups = settings.store.guildRoleGroups.filter(role => !role.disabled);

        const checkRoleGroup = this.getCheckRoleGroup(chanId, guildId, userIds, stateUpdates);
        const groupUpdates = enabledGroups.map(group => checkRoleGroup(group));

        return groupUpdates;
    }

    private getCheckRoleGroup(chanId: string, guildId: string, userIds: string[], stateUpdates?: VoiceState[]) {
        return (group: RoleGroupSetting) => {
            const roleIds = group.roles
                .filter(x => x.guildId === guildId)
                .map(x => x.id);

            const includedUserIds = userIds.filter(x =>
                group.includeUserIds.includes(x));
            const filteredUserIds = userIds.filter(x =>
                !group.excludeUserIds.includes(x)
                && !includedUserIds.includes(x)
                && this.checkUser(x, roleIds, guildId)
            );
            const currentUserIds = [...includedUserIds, ...filteredUserIds];

            const joinedUserIds = stateUpdates?.filter(x =>
                x.channelId === chanId
                && currentUserIds.includes(x.userId)
            ).map(x => x.userId);
            const leftUserIds = stateUpdates?.filter(x =>
                x.oldChannelId === chanId
                && !group.excludeUserIds.includes(x.userId)
                && (includedUserIds.includes(x.userId)
                    || this.checkUser(x.userId, roleIds, guildId))
            ).map(x => x.userId);

            const result = {
                checkType: CheckType.RoleGroups,
                source: group.name,
                status: currentUserIds.length > 0,
                userIds: currentUserIds,
                joinedUserIds,
                leftUserIds
            } as GroupUpdateResult;

            return result;
        };
    }


    private checkUser(userId: string, roleIds: string[], guildId: string): boolean {
        const result = GuildMemberStore.getMember(guildId, userId)!.roles
            .some(roleId => roleIds.includes(roleId));

        return result;
    }
}
