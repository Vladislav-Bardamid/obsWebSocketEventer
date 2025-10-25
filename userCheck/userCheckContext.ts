/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { UserStore } from "@webpack/common";

import { obsClient, voiceStateStore } from "..";
import { CheckCacheEntry, CheckType, VoiceState } from "../types";
import { createMessage } from "../utils";
import { MutedCheck } from "./mutedCheck";
import { RoleGroupCheck } from "./roleGroupCheck";
import { SomeCheck } from "./someCheck";
import { UserCheckStrategy } from "./userCheckStrategy";

export class UserCheckContext {
    private strategies: { [key in CheckType]: UserCheckStrategy } = {
        [CheckType.RoleGroups]: new RoleGroupCheck(),
        [CheckType.Some]: new SomeCheck(),
        [CheckType.Muted]: new MutedCheck(),
    };
    private results = [] as CheckCacheEntry[];

    processAll(chanId: string, guildId: string, stateUpdates?: VoiceState[]) {
        this.process(chanId, guildId, stateUpdates);
    }

    processRoleGroups(chanId: string, guildId: string, stateUpdates?: VoiceState[]) {
        this.process(chanId, guildId, stateUpdates, CheckType.RoleGroups);
    }

    processSome(chanId: string, guildId: string, stateUpdates?: VoiceState[]) {
        this.process(chanId, guildId, stateUpdates, CheckType.Some);
    }

    processMuted(chanId: string, guildId: string, stateUpdates?: VoiceState[]) {
        this.process(chanId, guildId, stateUpdates, CheckType.Muted);
    }

    disposeAll() {
        this.results.forEach(x => {
            const messageType = this.getCheckMessageType(x.checkType);
            obsClient.sendRequest(createMessage(messageType, x.source, "leave"));
        });
        this.results = [];
    }

    private process(chanId: string, guildId: string, stateUpdates?: VoiceState[], type?: CheckType) {
        const userIds = this.getChannelUserIds(chanId);
        const strategies = this.getStrategies(type);
        strategies.forEach(x => {
            const result = x.process(chanId, guildId, userIds, stateUpdates);
            result.forEach(x => {
                const entry = this.results.find(r => r.checkType === x.checkType && r.source === x.source);

                if (!entry) {
                    const newEntry = {
                        checkType: x.checkType,
                        source: x.source,
                        status: x.status,
                    };
                    this.results.push(newEntry);
                }
                else if (x.status !== entry.status) {
                    entry.status = x.status;
                }
                else
                    return;

                const messageType = this.getCheckMessageType(x.checkType);
                const statusMessage = x.status ? "enter" : "leave";
                obsClient.sendRequest(createMessage(messageType, x.source, statusMessage));

                if (!entry)
                    return;

                if (x.joinedUserIds) {
                    obsClient.sendRequest(createMessage(messageType, x.source, "user", statusMessage));
                }

                if (x.leftUserIds) {
                    obsClient.sendRequest(createMessage(messageType, x.source, "user", statusMessage));
                }
            });
        });
    }

    private getCheckMessageType(type: CheckType) {
        switch (type) {
            case CheckType.Some:
                return "some";
            case CheckType.Muted:
                return "muted";
            default:
                return "";
        }
    }

    private getStrategies(type?: CheckType) {
        if (type === undefined)
            return Object.values(this.strategies);

        return [this.strategies[type]];
    }

    private getChannelUserIds(chanId) {
        const myId = UserStore.getCurrentUser().id;

        return Object.keys(voiceStateStore.getVoiceStatesForChannel(chanId))
            .filter(x => x !== myId);
    }
}
