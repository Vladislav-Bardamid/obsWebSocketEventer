/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType, GroupUpdateResult } from "../types";
import { checkUserIsBlocked } from "../utils";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class BlockedCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], enteredUserIds?: string[], leftUserIds?: string[]) {
        const currentUserIds = userIds.filter(x => checkUserIsBlocked(x));
        enteredUserIds = enteredUserIds?.filter(x => currentUserIds.includes(x));
        leftUserIds = leftUserIds?.filter(x => checkUserIsBlocked(x));

        const result = [{
            checkType: CheckType.Blocked,
            status: currentUserIds.length > 0,
            userIds: currentUserIds,
            enteredUserIds,
            leftUserIds
        } as GroupUpdateResult];

        return result;
    }
}
