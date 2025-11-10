/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType } from "../types";
import { checkUserIsBlocked } from "../utils";
import { VoiceCheckStrategyBase } from "./voiceCheckStrategyBase";

export class BlockedCheck extends VoiceCheckStrategyBase {
    constructor() { super(CheckType.Blocked); }

    protected checkUser(userId: string) {
        return !checkUserIsBlocked(userId);
    }
}
