/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Channel } from "@vencord/discord-types";

export interface ObsWebSocketCredentials {
    host: string;
    password: string;
}

export interface RoleSetting {
    id: string;
    guildId: string;
}

export interface RoleGroupSetting {
    name: string;
    roles: RoleSetting[];
    includeUserIds: string[];
    excludeUserIds: string[];
    disabled: boolean;
}

export interface VoiceState {
    userId: string;
    channelId?: string;
    oldChannelId?: string;
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
}

export interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

interface User {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
}

export interface GroupUpdateResult {
    checkType: CheckType;
    source?: string;
    status: boolean;
    userIds: string[];
    joinedUserIds?: string[];
    leftUserIds?: string[];
}

export interface UserJoinResult {
    groupName: string;
    status: boolean;
    userIds: string[];
}

export interface CheckCacheEntry {
    checkType: CheckType;
    source?: string;
    status: boolean;
}

export enum CheckType {
    RoleGroups,
    Some,
    Muted,
}
