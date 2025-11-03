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

import { ChannelStore } from "@webpack/common";

import { settings } from "..";
import { CheckType, GroupUpdateResult, PatternSetting } from "../types";
import { checkSelfMuted as checkUserIsSelfMuted, checkUserForRoles, checkUserIsBlocked, checkUserIsFriend } from "../utils";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class PatternCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const enabledPatterns = settings.store.patterns.filter(role => !role.disabled);
        const guildId = ChannelStore.getChannel(chanId)?.guild_id;

        const checkPattern = this.getCheckPattern(guildId, userIds, joinedUserIds, leftUserIds);
        const groupUpdates = enabledPatterns.map(checkPattern);

        return groupUpdates;
    }

    private getCheckPattern(guildId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        return (setting: PatternSetting) => {
            const currentUserIds = userIds.filter(userId => this.checkUser(userId, guildId, setting, joinedUserIds, leftUserIds));

            joinedUserIds = joinedUserIds?.filter(x =>
                currentUserIds.includes(x));
            leftUserIds = leftUserIds?.filter(x =>
                this.checkUser(x, guildId, setting, joinedUserIds, leftUserIds));

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


    private checkUser(userId: string, guildId: string, setting: PatternSetting, joinedUserIds?: string[], leftUserIds?: string[]) {
        const groupRules = setting.pattern.split(" ");
        const groupRuleCheck = this.getRuleCheck(userId, guildId, joinedUserIds, leftUserIds);
        const result = groupRules.every(groupRuleCheck);

        return result;
    }

    private getRuleCheck(userId, guildId: string, joinedUserIds?: string[], leftUserIds?: string[]) {
        return (rule: string) => {
            const exclude = rule.startsWith("-");
            let groupName = rule.slice(exclude ? 1 : 0);

            const rules = groupName.split(":");
            groupName = rules.pop()!;

            const prefixStatus = this.checkPrefix(userId, rules, joinedUserIds, leftUserIds);
            if (!prefixStatus) return exclude;

            const isRule = this.checkRule(groupName, userId);
            if (isRule !== undefined) return isRule !== exclude;

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

            const result = checkUserForRoles(userId, guildId, roleIds);

            return result !== exclude;
        };
    }

    private checkPrefix(userId: string, rules: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        for (const rule of rules) {
            if (rule === ServiceRules.Join
                && !joinedUserIds?.includes(userId)
            ) return false;
        }

        return true;
    }

    private checkRule(groupName: string, userId: string) {
        switch (groupName) {
            case CheckType.Muted:
                return checkUserIsSelfMuted(userId);
            case CheckType.Friends:
                return checkUserIsFriend(userId);
            case CheckType.Blocked:
                return checkUserIsBlocked(userId);
            default:
                return;
        }
    }
}

enum ServiceRules {
    Join = "join"
}
