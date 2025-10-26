/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RelationshipStore } from "@webpack/common";

import { CheckType, GroupUpdateResult, VoiceState } from "../types";
import { UserCheckStrategy } from "./userCheckStrategy";

export class BlockedCheck implements UserCheckStrategy {
    process(chanId: string, guildId: string, userIds: string[], stateUpdates?: VoiceState[]) {
        const currentUserIds = userIds.filter(x => this.checkUser(x));
        const joinedUserIds = stateUpdates?.filter(x =>
            x.channelId === chanId
            && currentUserIds.includes(x.userId)
        ).map(x => x.userId);
        const leftUserIds = stateUpdates?.filter(x =>
            x.oldChannelId === chanId
            && this.checkUser(x.userId)
        ).map(x => x.userId);

        const result = [{
            checkType: CheckType.Blocked,
            status: currentUserIds.length > 0,
            userIds: currentUserIds,
            joinedUserIds,
            leftUserIds
        } as GroupUpdateResult];

        return result;
    }

    private checkUser(userId: string): boolean {
        const result = RelationshipStore.isBlockedOrIgnored(userId);

        return result;
    }
}
