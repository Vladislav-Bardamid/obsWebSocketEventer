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
import { CheckType, VoiceStateChangeEvent } from "../types";
import { createMessage } from "../utils";
import { BlockedCheck } from "./blockedCheck";
import { MutedCheck } from "./mutedCheck";
import { PatternCheck } from "./patternCheck";
import { RoleGroupCheck } from "./roleGroupCheck";
import { SomeCheck } from "./someCheck";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

export class VoiceCheckContext {
    private strategies: { [key in CheckType]: VoiceCheckStrategy } = {
        [CheckType.RoleGroups]: new RoleGroupCheck(),
        [CheckType.Patterns]: new PatternCheck(),
        [CheckType.Some]: new SomeCheck(),
        [CheckType.Muted]: new MutedCheck(),
        [CheckType.Blocked]: new BlockedCheck()
    };
    private results = new Map<[CheckType, string?], boolean>();

    processRoleGroups() {
        this.process(CheckType.RoleGroups);
    }

    processPatterns() {
        this.process(CheckType.Patterns);
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
        const myState = voiceStates.find(x => x.userId === myId
            && x.channelId !== x.oldChannelId);

        if (myState) {
            myState.channelId
                ? this.processAllStrategies(myState.channelId)
                : this.disposeAll();

            return;
        }

        const myChanId = SelectedChannelStore.getVoiceChannelId()!;
        if (!myChanId) return;

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
            const entry = this.results.get([x.checkType, x.source])!;

            if (entry === x.status) return;

            const messageType = this.getCheckMessageType(x.checkType);
            const statusMessage = x.status ? "enter" : "leave";

            this.sendMessage(messageType, statusMessage, x.userIds, x.source);

            x.joinedUserIds && this.sendMessage(messageType, statusMessage, x.joinedUserIds, x.source);
            x.leftUserIds && this.sendMessage(messageType, statusMessage, x.leftUserIds, x.source);

            this.results.set([x.checkType, x.source], x.status);
        });
    }

    private sendMessage(messageType: string, statusMessage, userIds: string[], source?: string) {
        obsClient.sendRequest(createMessage(messageType, source, statusMessage));
        obsClient.sendBrowserRequest(messageType, { users: userIds });
    }

    private disposeAll() {
        this.results.keys().forEach(x => {
            const messageType = this.getCheckMessageType(x[0]);
            obsClient.sendRequest(createMessage(messageType, x[1], "leave"));
        });
        this.results.clear();
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
