/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RoleGroupSetting, RoleSetting } from "./types";

export function createMessage(...params: (string | undefined)[]) {
    return params.filter(x => x).map(x => x?.toLowerCase()).join("-");
}

export function checkValidName(value: string) {
    return !value || /^[a-zA-Z0-9\- ]+$/.test(value);
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
