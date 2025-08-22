/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface ObsWebSocketCredentials {
    host: string;
    password: string;
}

export interface RoleSetting {
    id: string;
    guildId: string;
    disabled: boolean;
    deleted: boolean;
    groupNames: string;
}

export interface RoleGroupSetting {
    name: string;
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
