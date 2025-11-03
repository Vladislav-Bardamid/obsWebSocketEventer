/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType, GroupUpdateResult } from "../types";
import { checkUserIsFriend } from "../utils";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class FriendCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const currentUserIds = userIds.filter(x => checkUserIsFriend(x));
        joinedUserIds = joinedUserIds?.filter(x => currentUserIds.includes(x));
        leftUserIds = leftUserIds?.filter(x => checkUserIsFriend(x));

        const result = [{
            checkType: CheckType.Friends,
            status: currentUserIds.length > 0,
            userIds: currentUserIds,
            joinedUserIds,
            leftUserIds
        } as GroupUpdateResult];

        return result;
    }
}
