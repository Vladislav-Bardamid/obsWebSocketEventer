/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { UserStore } from "@webpack/common";

import { settings, voiceStateStore } from "..";
import { VoiceState } from "../types";
import { BlackListCheck } from "./blackListCheck";
import { MutedCheck } from "./mutedCheck";
import { RoleGroupCheck } from "./roleGroupCheck";
import { SomeCheck } from "./someCheck";

export class UserCheckContext {
    private roleGroupCheck = new RoleGroupCheck();
    private someCheck = new SomeCheck();
    private mutedCheck = new MutedCheck();
    private blackListCheck = new BlackListCheck();

    constructor() { }

    processAll(chanId: string, guildId: string, stateUpdates?: VoiceState[]): void {
        const userIds = this.getChannelUserIds(chanId);

        this.roleGroupCheck.process(userIds, guildId, stateUpdates);
        this.someCheck.process(userIds, guildId, stateUpdates);
        this.mutedCheck.process(userIds, guildId, stateUpdates);
        this.blackListCheck.process(userIds, guildId, stateUpdates);
    }

    processRoleGroups(chanId: string, guildId: string, stateUpdates?: VoiceState[]): void {
        const userIds = this.getChannelUserIds(chanId);
        this.roleGroupCheck.process(userIds, guildId, stateUpdates);
    }

    processSome(chanId: string, guildId: string, stateUpdates?: VoiceState[]): void {
        const userIds = this.getChannelUserIds(chanId);
        this.someCheck.process(userIds, guildId, stateUpdates);
    }

    processMuted(chanId: string, guildId: string, stateUpdates?: VoiceState[]): void {
        const userIds = this.getChannelUserIds(chanId);
        this.mutedCheck.process(userIds, guildId, stateUpdates);
    }

    processBlackList(chanId: string, guildId: string, stateUpdates?: VoiceState[]): void {
        const userIds = this.getChannelUserIds(chanId);
        this.blackListCheck.process(userIds, guildId, stateUpdates);
    }

    disposeAll(): void {
        this.roleGroupCheck.dispose();
    }

    private getChannelUserIds(chanId) {
        const myId = UserStore.getCurrentUser().id;

        return Object.keys(voiceStateStore.getVoiceStatesForChannel(chanId))
            .filter(x => x !== myId && !settings.store.usersWhiteList.includes(x));
    }
}
