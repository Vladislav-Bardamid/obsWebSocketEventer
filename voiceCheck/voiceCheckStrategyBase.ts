/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GroupUpdateResult } from "../types";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export abstract class VoiceCheckStrategyBase implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[]) {
        const currentUserIds = userIds.filter(this.checkUser);

        const result = [{
            checkType: this.type,
            status: currentUserIds.length > 0,
            userIds: currentUserIds,
        } as GroupUpdateResult];

        return result;
    }

    protected abstract type;
    protected abstract checkUser(userId: string): boolean;
}
