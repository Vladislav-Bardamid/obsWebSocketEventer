/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType, GroupUpdateResult } from "../types";
import { checkMute as checkMuted } from "../utils";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class MutedCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const currentUserIds = userIds.filter(x => checkMuted(x));
        joinedUserIds = joinedUserIds?.filter(x => currentUserIds.includes(x));
        leftUserIds = leftUserIds?.filter(x => checkMuted(x));

        const result = [{
            checkType: CheckType.Muted,
            status: currentUserIds.length > 0,
            userIds: currentUserIds,
            joinedUserIds,
            leftUserIds
        } as GroupUpdateResult];

        return result;
    }
}
