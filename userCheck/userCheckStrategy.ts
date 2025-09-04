/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { VoiceState } from "../types";

export interface UserCheckStrategy {
    process(userIds: string[], guildId: string, stateUpdates?: VoiceState[]): void;
    dispose(): void;
}
