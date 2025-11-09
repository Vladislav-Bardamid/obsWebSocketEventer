/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType, GroupUpdateResult } from "../types";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class SomeCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], enteredUserIds?: string[], leftUserIds?: string[]) {
        const result = [{
            checkType: CheckType.Some,
            status: userIds.length > 0,
            userIds,
            enteredUserIds,
            leftUserIds
        } as GroupUpdateResult];

        return result;
    }
}
