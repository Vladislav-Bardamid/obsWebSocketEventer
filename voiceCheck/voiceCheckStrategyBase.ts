/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType, GroupUpdateResult } from "../types";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export abstract class VoiceCheckStrategyBase implements VoiceCheckStrategy {
    protected constructor(private type: CheckType) { }

    process(chanId: string, userIds: string[], enteredUserIds?: string[], leftUserIds?: string[]) {
        const currentUserIds = userIds.filter(this.checkUser);
        const filteredEnteredUserIds = enteredUserIds?.filter(x => currentUserIds.includes(x));
        const filteredLeftUserIds = leftUserIds?.filter(this.checkUser);

        const result = [{
            checkType: this.type,
            status: userIds.length > 0,
            userIds,
            enteredUserIds: filteredEnteredUserIds,
            leftUserIds: filteredLeftUserIds
        } as GroupUpdateResult];

        return result;
    }

    protected abstract checkUser(userId: string): boolean;
}
