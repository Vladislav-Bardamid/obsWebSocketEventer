/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RelationshipType } from "@vencord/discord-types/enums";
import { GuildMemberStore, MediaEngineStore, RelationshipStore, UserStore, VoiceStateStore } from "@webpack/common";

import { obsClient } from ".";
import { CheckType, PatternSetting, RoleGroupSetting, RoleSetting } from "./types";

export function createMessage(...params: (string | undefined)[]) {
    return params.filter(x => x).map(x => x!.toLowerCase()).join("-");
}

const ln = "[a-zA-Z0-9]+";
const name = `[a-zA-Z](${ln})(-${ln})*`;
const rule = "[a-z]+";

const nameRegexp = new RegExp(`^${name}$`);
const patternRegexp = new RegExp(`^(-?(${rule}:)*${name} ?)*?$`);


export function checkValidName(value: string) {
    return !value || nameRegexp.test(value);
}

export function checkValidPattern(value: string) {
    return !value || patternRegexp.test(value);
}

export function makeEmptyRole(id: string, guildId: string) {
    return {
        id,
        guildId,
    } as RoleSetting;
}

export function makeEmptyRoleGroup(name: string) {
    return {
        name: name,
        roles: [],
        includeUserIds: [],
        excludeUserIds: [],
        disabled: false,
    } as RoleGroupSetting;
}

export function sendGroupUpdateMessage(messageType: string, userIds?: string[]) {
    const users = userIds?.reduce((result, key) => {
        result[key] = UserStore.getUser(key);
        return result;
    }, {});

    obsClient.sendRequest(messageType);
    obsClient.sendBrowserRequest(messageType, { users });
}

export function getChannelUserIds(chanId): string[] {
    const myId = UserStore.getCurrentUser().id;

    return Object.keys(VoiceStateStore.getVoiceStatesForChannel(chanId))
        .filter(x => x !== myId);
}

export function checkMute(userId: string) {
    const result = MediaEngineStore.isLocalMute(userId)
        || MediaEngineStore.getLocalVolume(userId) === 0;

    return result;
}

export function checkSelfMuted(userId: string) {
    const state = VoiceStateStore.getVoiceStateForUser(userId);
    return state?.selfMute || state?.selfDeaf;
}

export function checkUserForRoles(userId: string, guildId: string, roleIds: string[]) {
    const result = GuildMemberStore.getMember(guildId, userId)!.roles
        .some(roleId => roleIds.includes(roleId));

    return result;
}

export function checkUserIsFriend(userId: string) {
    return RelationshipStore.isFriend(userId);
}

export function checkUserIsBlocked(userId: string) {
    return RelationshipStore.isBlockedOrIgnored(userId);
}

export function makeEmptyPattern(name: string) {
    return {
        name: name,
        pattern: "",
        disabled: false,
    } as PatternSetting;
}

export function relationshipToCheckType(type: RelationshipType): CheckType {
    switch (type) {
        case RelationshipType.FRIEND:
            return CheckType.Friends;
        case RelationshipType.BLOCKED:
            return CheckType.Blocked;
        default:
            throw new Error(`Unsupported relationship type: ${type}`);
    }
}
