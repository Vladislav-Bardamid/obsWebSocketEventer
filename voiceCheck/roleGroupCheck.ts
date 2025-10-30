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

import { ChannelStore, GuildMemberStore } from "@webpack/common";

import { settings } from "..";
import { CheckType, GroupUpdateResult, RoleGroupSetting } from "../types";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class RoleGroupCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const enabledGroups = settings.store.guildRoleGroups.filter(role => !role.disabled);
        const guildId = ChannelStore.getChannel(chanId)?.guild_id;

        const checkRoleGroup = this.getCheckRoleGroup(guildId, userIds, joinedUserIds, leftUserIds);
        const groupUpdates = enabledGroups.map(group => checkRoleGroup(group));

        return groupUpdates;
    }

    private getCheckRoleGroup(guildId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        return (group: RoleGroupSetting) => {
            const roleIds = group.roles
                .filter(x => x.guildId === guildId)
                .map(x => x.id);

            const includedUserIds = userIds.filter(x =>
                group.includeUserIds.includes(x));
            const filteredUserIds = userIds.filter(x =>
                !group.excludeUserIds.includes(x)
                && !includedUserIds.includes(x)
                && this.checkUser(x, roleIds, guildId));
            const currentUserIds = [...includedUserIds, ...filteredUserIds];

            joinedUserIds = joinedUserIds?.filter(x =>
                currentUserIds.includes(x));
            leftUserIds = leftUserIds?.filter(x =>
                !group.excludeUserIds.includes(x)
                && (includedUserIds.includes(x)
                    || this.checkUser(x, roleIds, guildId)));

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
