/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType } from "../types";
import { VoiceCheckStrategyBase } from "./voiceCheckStrategyBase";

export class SomeCheck extends VoiceCheckStrategyBase {
    protected type = CheckType.Some;

    protected checkUser(userId: string): boolean {
        return true;
    }
}
