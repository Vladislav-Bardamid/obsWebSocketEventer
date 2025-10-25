/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MediaEngineStore } from "plugins/voiceMessages/utils";

import { CheckType, GroupUpdateResult, VoiceState } from "../types";
import { UserCheckStrategy } from "./userCheckStrategy";

export class MutedCheck implements UserCheckStrategy {
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
            checkType: CheckType.Muted,
            status: currentUserIds.length > 0,
            userIds: currentUserIds,
            joinedUserIds,
            leftUserIds
        } as GroupUpdateResult];

        return result;
    }

    private checkUser(userId: string): boolean {
        const result = MediaEngineStore.isLocalMute(userId)
            || MediaEngineStore.getLocalVolume(userId) === 0;

        return result;
    }
}
