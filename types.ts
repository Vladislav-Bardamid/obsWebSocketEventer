/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
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

export interface NamedGroup {
    name: string;
    disabled: boolean;
}

export interface RoleGroupSetting extends NamedGroup {
    roles: RoleSetting[];
    includeUserIds: string[];
    excludeUserIds: string[];
}

export interface PatternSetting extends NamedGroup {
    pattern: string;
}

export interface VoiceStateChangeEvent {
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
}

export interface UserJoinResult {
    groupName: string;
    status: boolean;
    userIds: string[];
}

export enum CheckType {
    RoleGroups = "role-groups",
    Patterns = "patterns",
    Some = "some",
    Muted = "muted",
    Friends = "friends",
    Blocked = "blocked"
}

export enum ActionType {
    Enter = "enter",
    Leave = "leave",
    Add = "add",
    Remove = "remove"
}

export enum Scope {
    User = "user",
    Group = "group"
}

export enum EnterLeave {
    Enter = "enter",
    Leave = "leave"
}

export enum GroupUser {
    Group = "",
    User = "user"
}
