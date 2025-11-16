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

import { CheckType, GroupUpdateResult, NamedGroup } from "../types";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export abstract class VoiceCheckStrategyGroupBase<T extends NamedGroup> implements VoiceCheckStrategy {
    protected abstract type: CheckType;

    process(chanId: string, userIds: string[], enteredUserIds?: string[], leftUserIds?: string[]) {
        const enabledGroups = this.getGroups().filter(role => !role.disabled);
        const guildId = ChannelStore.getChannel(chanId).guild_id;

        const checkGroup = this.getCheckGroup(guildId, userIds, enteredUserIds, leftUserIds);
        const groupUpdates = enabledGroups.map(checkGroup);

        return groupUpdates;
    }

    private getCheckGroup(guildId: string, userIds: string[], enteredUserIds?: string[], leftUserIds?: string[]) {
        return (group: T) => {
            const currentUserIds = userIds.filter(x => this.checkUser(x, guildId, group));
            const filteredEnteredUserIds = enteredUserIds?.filter(x => currentUserIds.includes(x));
            const filteredLeftUserIds = leftUserIds?.filter(x => this.checkUser(x, guildId, group));

            const result = {
                checkType: this.type,
                source: group.name,
                status: currentUserIds.length > 0,
                userIds: currentUserIds,
                enteredUserIds: filteredEnteredUserIds,
                leftUserIds: filteredLeftUserIds
            } as GroupUpdateResult;

            return result;
        };
    }

    protected abstract getGroups(): T[];
    protected abstract checkUser(userId: string, guildId: string, group: T);
}
