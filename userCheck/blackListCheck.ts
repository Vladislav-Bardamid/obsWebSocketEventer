/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { obsClient, settings } from "..";
import { VoiceState } from "../types";
import { createMessage } from "../utils";
import { UserCheckStrategy } from "./userCheckStrategy";

export class BlackListCheck implements UserCheckStrategy {
    private active = false;

    process(userIds: string[], guildId: string, stateUpdates?: VoiceState[]): void {
        const users = userIds.filter(x =>
            settings.store.usersBlackList.includes(x));
        const someBlackListUsers = users.length > 0;

        if (someBlackListUsers === this.active) return;

        const message = this.active
            ? createMessage("blacklist", "leave")
            : createMessage("blacklist", "enter");

        obsClient.sendRequest(message);
        obsClient.sendBrowserRequest(message, { users });

        this.active = someBlackListUsers;
    }

    dispose(): void {
        if (!this.active) return;

        obsClient.sendRequest(createMessage("blacklist", "leave"));
        this.active = false;
    }
}
