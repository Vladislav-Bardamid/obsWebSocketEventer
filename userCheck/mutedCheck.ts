/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MediaEngineStore } from "plugins/voiceMessages/utils";

import { obsClient } from "..";
import { VoiceState } from "../types";
import { createMessage } from "../utils";
import { UserCheckStrategy } from "./userCheckStrategy";

export class MutedCheck implements UserCheckStrategy {
    private active = false;

    process(userIds: string[], guildId: string, stateUpdates?: VoiceState[]): void {
        const users = userIds.filter(x =>
            MediaEngineStore.isLocalMute(x) || MediaEngineStore.getLocalVolume(x) === 0
        );
        const someMutedUsers = users.length > 0;

        if (someMutedUsers === this.active) return;

        const message = this.active
            ? createMessage("muted", "leave")
            : createMessage("muted", "enter");

        obsClient.sendRequest(message);

        this.active = someMutedUsers;
    }

    dispose(): void {
        if (!this.active) return;

        obsClient.sendRequest(createMessage("muted", "leave"));
        this.active = false;
    }
}
