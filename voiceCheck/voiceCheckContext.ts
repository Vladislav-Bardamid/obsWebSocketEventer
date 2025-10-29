/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { SelectedChannelStore, UserStore, VoiceStateStore } from "@webpack/common";

import { obsClient } from "..";
import { CheckCacheEntry, CheckType, VoiceStateChangeEvent } from "../types";
import { createMessage } from "../utils";
import { BlockedCheck } from "./blockedCheck";
import { MutedCheck } from "./mutedCheck";
import { RoleGroupCheck } from "./roleGroupCheck";
import { SomeCheck } from "./someCheck";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class VoiceCheckContext {
    private strategies: { [key in CheckType]: VoiceCheckStrategy } = {
        [CheckType.RoleGroups]: new RoleGroupCheck(),
        [CheckType.Some]: new SomeCheck(),
        [CheckType.Muted]: new MutedCheck(),
        [CheckType.Blocked]: new BlockedCheck()
    };
    private results = [] as CheckCacheEntry[];

    processRoleGroups() {
        this.process(CheckType.RoleGroups);
    }

    processSome() {
        this.process(CheckType.Some);
    }

    processMuted() {
        this.process(CheckType.Muted);
    }

    processBlocked() {
        this.process(CheckType.Blocked);
    }

    processAll() {
        const myChanId = SelectedChannelStore.getVoiceChannelId();
        if (!myChanId) return;

        this.processAllStrategies(myChanId);
    }

    processVoiceStates(voiceStates: VoiceStateChangeEvent[]) {
        const myId = UserStore.getCurrentUser().id;
        const myState = voiceStates.find(x => x.userId === myId);

        if (myState) {
            myState.channelId
                ? this.processAllStrategies(myState?.channelId)
                : this.disposeAll();

            return;
        }

        const myChanId = SelectedChannelStore.getVoiceChannelId()!;

        const stateUpdates = voiceStates.filter(x =>
            x.channelId !== x.oldChannelId
            && x.userId !== myId);

        const joinedUserIds = stateUpdates.filter(x => x.channelId === myChanId)?.map(x => x.userId);
        const leftUserIds = stateUpdates.filter(x => x.oldChannelId === myChanId)?.map(x => x.userId);

        if (!myState && !joinedUserIds.length && !leftUserIds.length) return;

        this.processAllStrategies(myChanId, joinedUserIds, leftUserIds);
    }

    private process(type: CheckType) {
        const myChanId = SelectedChannelStore.getVoiceChannelId();
        if (!myChanId) return;

        const userIds = this.getChannelUserIds(myChanId);
        const strategy = this.strategies[type];

        this.processStrategy(strategy, myChanId, userIds);
    }

    private processAllStrategies(chanId: string, joinedUserIds?: string[], leftUserIds?: string[]) {
        const userIds = this.getChannelUserIds(chanId);
        const strategies = Object.values(this.strategies);

        strategies.forEach(strategy => this.processStrategy(strategy, chanId, userIds, joinedUserIds, leftUserIds));
    }

    private processStrategy(strategy: VoiceCheckStrategy, chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const result = strategy.process(chanId, userIds, joinedUserIds, leftUserIds);
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
            else return;

            const messageType = this.getCheckMessageType(x.checkType);
            const statusMessage = x.status ? "enter" : "leave";
            this.sendMessage(messageType, statusMessage, x.userIds, x.source);

            if (!entry) return;

            x.joinedUserIds && this.sendMessage(messageType, statusMessage, x.joinedUserIds, x.source);
            x.leftUserIds && this.sendMessage(messageType, statusMessage, x.leftUserIds, x.source);
        });
    }

    private sendMessage(messageType: string, statusMessage, userIds: string[], source?: string) {
        obsClient.sendRequest(createMessage(messageType, source, statusMessage));
        obsClient.sendBrowserRequest(messageType, { users: userIds });
    }

    private disposeAll() {
        this.results.forEach(x => {
            const messageType = this.getCheckMessageType(x.checkType);
            obsClient.sendRequest(createMessage(messageType, x.source, "leave"));
        });
        this.results = [];
    }

    private getChannelUserIds(chanId): string[] {
        const myId = UserStore.getCurrentUser().id;

        return Object.keys(VoiceStateStore.getVoiceStatesForChannel(chanId))
            .filter(x => x !== myId);
    }

    private getCheckMessageType(type: CheckType): string {
        switch (type) {
            case CheckType.Some:
                return "some";
            case CheckType.Muted:
                return "muted";
            case CheckType.Blocked:
                return "blocked";
            default:
                return "";
        }
    }
}
