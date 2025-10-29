/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RelationshipStore } from "@webpack/common";

import { CheckType, GroupUpdateResult } from "../types";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class BlockedCheck implements VoiceCheckStrategy {
    process(chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const currentUserIds = userIds.filter(x => this.checkUser(x));
        joinedUserIds = joinedUserIds?.filter(x =>
            currentUserIds.includes(x));
        leftUserIds = leftUserIds?.filter(x =>
            this.checkUser(x));

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
