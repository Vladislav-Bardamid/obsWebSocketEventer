/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GroupUpdateResult, VoiceState } from "../types";

export interface UserCheckStrategy {
    process(chanId: string, guildId: string, userIds: string[], stateUpdates?: VoiceState[]): GroupUpdateResult[];
}
