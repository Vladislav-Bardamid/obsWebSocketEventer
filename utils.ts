/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RoleSetting } from "./types";

export function createMessage(...params: (string | undefined)[]) {
    return params.filter(x => x).map(x => x?.toLowerCase()).join("-");
}

export function checkValidName(value: string) {
    return !value || /^[a-zA-Z0-9\- ]+$/.test(value);
}

export function makeEmptyRole(id: string, guildId: string) {
    return {
        id: id,
        guildId: guildId,
        disabled: false,
        deleted: false,
        groupNames: ""
    } as RoleSetting;
}
