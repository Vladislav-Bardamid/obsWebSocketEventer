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
import { FriendCheck as FriendsCheck } from "./friendCheck";
import { MutedCheck } from "./mutedCheck";
import { PatternCheck } from "./patternCheck";
import { RoleGroupCheck } from "./roleGroupCheck";
import { SomeCheck } from "./someCheck";
import { VoiceCheckStrategy } from "./voiceCheckStrategy";

const ENTER = "enter";
const LEAVE = "leave";

const USER = "user";

const MESSAGE_TYPES = {
    [CheckType.Some]: "some",
    [CheckType.Muted]: "muted",
    [CheckType.Blocked]: "blocked"
};

export class VoiceCheckContext {
    private strategies: { [key in CheckType]: VoiceCheckStrategy } = {
        [CheckType.RoleGroups]: new RoleGroupCheck(),
        [CheckType.Patterns]: new PatternCheck(),
        [CheckType.Some]: new SomeCheck(),
        [CheckType.Muted]: new MutedCheck(),
        [CheckType.Friends]: new FriendsCheck(),
        [CheckType.Blocked]: new BlockedCheck()
    };
    private results = new Map<CheckType, Map<string | undefined, boolean>>();

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

    processFriends() {
        this.process(CheckType.Friends);
    }

    processBlocked() {
        this.process(CheckType.Blocked);
    }

    processAll() {
        const myChanId = SelectedChannelStore.getVoiceChannelId();
        if (!myChanId) return;

        this.processAllStrategies(myChanId);
    }

    private myLastChannelId?: string;

    processVoiceStates(voiceStates: VoiceStateChangeEvent[]) {
        const myId = UserStore.getCurrentUser().id;
        const myState = voiceStates.find(x => x.userId === myId
            && x.channelId !== this.myLastChannelId);

        if (myState) {
            myState.channelId
                ? this.processAllStrategies(myState.channelId)
                : this.disposeAll();

            this.myLastChannelId = myState.channelId;

            return;
        }

        const myChanId = SelectedChannelStore.getVoiceChannelId()!;
        if (!myChanId) return;

        const channelChanged = voiceStates.some(x => (
            x.channelId === myChanId
            || x.oldChannelId === myChanId
        ) && x.userId !== myId);
        const stateUpdates = voiceStates.filter(x =>
            x.channelId !== x.oldChannelId
            && x.userId !== myId);

        const joinedUserIds = stateUpdates.filter(x => x.channelId === myChanId)?.map(x => x.userId);
        const leftUserIds = stateUpdates.filter(x => x.oldChannelId === myChanId)?.map(x => x.userId);

        if (!myState && !channelChanged) return;

        this.processAllStrategies(myChanId, joinedUserIds, leftUserIds);
    }

    private process(type: CheckType) {
        const myChanId = SelectedChannelStore.getVoiceChannelId();
        if (!myChanId) return;

        const userIds = this.getChannelUserIds(myChanId);
        this.processStrategy(type, myChanId, userIds);
    }

    private processAllStrategies(chanId: string, joinedUserIds?: string[], leftUserIds?: string[]) {
        const userIds = this.getChannelUserIds(chanId);

        Object.keys(this.strategies).map(x => x as CheckType).forEach(x =>
            this.processStrategy(x, chanId, userIds, joinedUserIds, leftUserIds));
    }

    private processStrategy(strategyType: CheckType, chanId: string, userIds: string[], joinedUserIds?: string[], leftUserIds?: string[]) {
        const strategy = this.strategies[strategyType];
        const result = strategy.process(chanId, userIds, joinedUserIds, leftUserIds);

        let oldValues = this.results.get(strategyType);
        if (!oldValues) {
            oldValues = new Map();
            this.results.set(strategyType, oldValues);
        }

        result.forEach(x => {
            const entry = oldValues.get(x.source);
            const messageType = MESSAGE_TYPES[strategyType] ?? x.source;

            if (entry !== x.status) {
                const message = createMessage(messageType, x.status ? ENTER : LEAVE);
                this.sendMessage(message, x.userIds);

                oldValues.set(x.source, x.status);
            }

            if (x.joinedUserIds?.length) {
                const message = createMessage(messageType, USER, ENTER);
                this.sendMessage(message, x.userIds);
            }

            if (x.leftUserIds?.length) {
                const message = createMessage(messageType, USER, LEAVE);
                this.sendMessage(message, x.userIds);
            }
        });
    }

    private sendMessage(messageType: string, userIds: string[]) {
        obsClient.sendRequest(messageType);
        obsClient.sendBrowserRequest(messageType, { users: userIds });
    }

    private disposeAll() {
        this.results.entries().forEach(x => x[1].keys().forEach(y => {
            const messageType = MESSAGE_TYPES[x[0]] ?? y;
            const message = createMessage(messageType, LEAVE);

            obsClient.sendRequest(message);
        }));
        this.results.clear();
    }

    private getChannelUserIds(chanId): string[] {
        const myId = UserStore.getCurrentUser().id;

        return Object.keys(VoiceStateStore.getVoiceStatesForChannel(chanId))
            .filter(x => x !== myId);
    }
}
