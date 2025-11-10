/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType } from "../types";
import { checkMute as checkMuted } from "../utils";
import { VoiceCheckStrategyBase } from "./voiceCheckStrategyBase";

export class MutedCheck extends VoiceCheckStrategyBase {
    protected type = CheckType.Muted;

    protected checkUser(userId: string): boolean {
        return checkMuted(userId);
    }
}
