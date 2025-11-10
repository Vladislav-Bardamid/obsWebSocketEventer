/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CheckType } from "../types";
import { checkUserIsFriend } from "../utils";
import { VoiceCheckStrategyBase } from "./voiceCheckStrategyBase";

export class FriendCheck extends VoiceCheckStrategyBase {
    protected type = CheckType.Friends;

    protected checkUser(userId: string): boolean {
        return checkUserIsFriend(userId);
    }
}
