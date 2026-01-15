/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { SelectedChannelStore, UserStore } from "@webpack/common";

import { obsClient } from "..";
import { CheckType, GroupUpdateResult, VoiceStateChangeEvent } from "../types";
import { createMessage, getChannelUserIds, userIdsToUserCollection } from "../utils";
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

        const stateUpdates = voiceStates.filter(x =>
            x.channelId !== x.oldChannelId
            && x.userId !== myId);

        const enteredUserIds = stateUpdates.filter(x => x.channelId === myChanId)?.map(x => x.userId);
        const leftUserIds = stateUpdates.filter(x => x.oldChannelId === myChanId)?.map(x => x.userId);

        if (!enteredUserIds?.length && !leftUserIds?.length) return;

        this.processAllStrategies(myChanId);

        this.processAllStrategies(myChanId, enteredUserIds, true);
        this.processAllStrategies(myChanId, leftUserIds, false);
    }

    private process(type: CheckType, chanId?: string, userIds?: string[], userScopeStatus?: boolean) {
        chanId ??= SelectedChannelStore.getVoiceChannelId();
        if (!chanId) return;

        userIds ??= getChannelUserIds(chanId);
        const results = this.strategies[type].process(chanId, userIds);

        if (userScopeStatus !== undefined) {
            results.forEach(r => this.notify(r, userScopeStatus));
            return;
        }

        const cachedValues = this.getOrCreateCachedValue(type);
        results.forEach(r => {
            const oldStatus = cachedValues.get(r.source);
            if (oldStatus === r.status) return;

            this.notify(r);
            cachedValues.set(r.source, r.status);
        });
    }

    private processAllStrategies(chanId?: string, userIds?: string[], userScopeStatus?: boolean) {
        chanId ??= SelectedChannelStore.getVoiceChannelId();
        if (!chanId) return;

        userIds ??= getChannelUserIds(chanId);

        const strategies = Object.keys(this.strategies) as CheckType[];
        strategies.forEach(x => this.process(x, chanId, userIds, userScopeStatus));
    }

    private getOrCreateCachedValue(strategyType: CheckType) {
        let result = this.results.get(strategyType);
        if (!result) {
            result = new Map();
            this.results.set(strategyType, result);
        }

        return result;
    }

    private notify(update: GroupUpdateResult, userScopeStatus?: boolean) {
        const messageType = update.source ?? update.checkType;
        const message = createMessage(messageType, userScopeStatus ? USER : undefined, update.status ? ENTER : LEAVE);

        obsClient.sendRequest(message);

        if (userScopeStatus === undefined) {
            const users = userIdsToUserCollection(update.userIds);
            obsClient.sendStatus(update.checkType, update.status, users, update.source);
        } else if (update.status) {
            const user = UserStore.getUser(update.userIds[0]);
            obsClient.sendUserStatus(update.checkType, userScopeStatus, user, update.source);
        }
    }

    private disposeAll() {
        for (const [checkType, cachedMap] of this.results) {
            for (const source of cachedMap.keys()) {
                const messageType = source ?? checkType;
                const message = createMessage(messageType, LEAVE);

                obsClient.sendRequest(message);
                obsClient.sendStatus(checkType, false, undefined, source);
            }
        }
        this.results.clear();
    }
}
