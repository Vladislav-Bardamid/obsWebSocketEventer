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
import { CheckType, PatternSetting } from "../types";
import { checkSelfMuted as checkUserIsSelfMuted, checkUserForRoles, checkUserIsBlocked, checkUserIsFriend } from "../utils";
import { VoiceCheckStrategyGroupBase } from "./voiceCheckStrategyGroupBase";

export class PatternCheck extends VoiceCheckStrategyGroupBase<PatternSetting> {
    constructor() { super(CheckType.Patterns, settings.store.patterns); }

    protected checkUser(userId: string, guildId: string, setting: PatternSetting, enteredUserIds?: string[], leftUserIds?: string[]) {
        const groupRules = setting.pattern.split(" ");
        const groupRuleCheck = this.getRuleCheck(userId, guildId, enteredUserIds, leftUserIds);
        const result = groupRules.every(groupRuleCheck);

        return result;
    }

    private getRuleCheck(userId, guildId: string, enteredUserIds?: string[], leftUserIds?: string[]) {
        return (rule: string) => {
            const exclude = rule.startsWith("-");
            let groupName = rule.slice(exclude ? 1 : 0);

            const rules = groupName.split(":");
            groupName = rules.pop()!;

            const prefixStatus = this.checkPrefix(userId, rules, enteredUserIds, leftUserIds);
            if (!prefixStatus) return exclude;

            const isRule = this.checkRule(groupName, userId);
            if (isRule !== undefined) return isRule !== exclude;

            const group = settings.store.roleGroups.find(group => group.name === groupName);
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

    private checkPrefix(userId: string, rules: string[], enteredUserIds?: string[], leftUserIds?: string[]) {
        for (const rule of rules) {
            if (rule === ServiceRules.Join
                && !enteredUserIds?.includes(userId)
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
