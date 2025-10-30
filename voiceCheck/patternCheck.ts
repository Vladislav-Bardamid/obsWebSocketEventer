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
import { CheckType, GroupUpdateResult, PatternSetting } from "../types";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class PatternCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const enabledPatterns = settings.store.patterns.filter(role => !role.disabled);
        const guildId = ChannelStore.getChannel(chanId)?.guild_id;

        const checkPattern = this.getCheckPattern(guildId, userIds, joinedUserIds, leftUserIds);
        const groupUpdates = enabledPatterns.map(pattern => checkPattern(pattern));

        return groupUpdates;
    }

    private getCheckPattern(guildId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        return (setting: PatternSetting) => {
            const currentUserIds = userIds.filter(userId => this.checkUser(userId, guildId, setting));

            joinedUserIds = joinedUserIds?.filter(x =>
                currentUserIds.includes(x));
            leftUserIds = leftUserIds?.filter(x =>
                this.checkUser(x, guildId, setting));

            const result = {
                checkType: CheckType.Patterns,
                source: setting.name,
                status: currentUserIds.length > 0,
                userIds: currentUserIds,
                joinedUserIds,
                leftUserIds
            } as GroupUpdateResult;

            return result;
        };
    }


    private checkUser(userId: string, guildId: string, setting: PatternSetting) {
        const groupRules = setting.pattern.split(" ");
        const result = groupRules
            .every(groupRule => {
                const exclude = groupRule.startsWith("-");
                const groupName = groupRule.slice(exclude ? 1 : 0);
                const group = settings.store.guildRoleGroups.find(group => group.name === groupName);
                if (!group) return exclude;

                const roleIds = group.roles
                    .filter(x => x.guildId === guildId)
                    .map(x => x.id);

                const isIncluded = (exclude
                    ? group.excludeUserIds
                    : group.includeUserIds
                ).includes(userId);
                if (isIncluded) return exclude;

                const result = GuildMemberStore.getMember(guildId, userId)!.roles
                    .some(roleId => roleIds.includes(roleId));

                return result !== exclude;
            });

        return result;
    }
}
