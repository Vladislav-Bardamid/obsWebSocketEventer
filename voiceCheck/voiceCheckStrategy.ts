/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GroupUpdateResult as VoiceCheckResult } from "../types";

export interface VoiceCheckStrategy {
    process(chanId: string, userIds: string[]): VoiceCheckResult[];
}
