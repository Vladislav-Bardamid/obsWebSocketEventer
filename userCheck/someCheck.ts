/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType, GroupUpdateResult, VoiceState } from "../types";
import { UserCheckStrategy } from "./userCheckStrategy";

export class SomeCheck implements UserCheckStrategy {
    process(guildId: string, chanId: string, userIds: string[], stateUpdates?: VoiceState[]) {
        const joinedUserIds = stateUpdates?.filter(x =>
            x.channelId === chanId
        ).map(x => x.userId);
        const leftUserIds = stateUpdates?.filter(x =>
            x.oldChannelId === chanId
        ).map(x => x.userId);

        const result = [{
            checkType: CheckType.Some,
            status: userIds.length > 0,
            userIds,
            joinedUserIds,
            leftUserIds
        } as GroupUpdateResult];

        return result;
    }
}
