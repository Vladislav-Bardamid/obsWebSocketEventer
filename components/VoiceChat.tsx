/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Forms } from "@webpack/common";

import { checkMessageValid } from "..";
import { VoiceChatStatusMessage } from "../types";
import { Input } from "./Input";


export function VoiceChat({ messages }: VoiceChatStatusProps) {
    return (<table style={{ width: "100%" }}>
        <tr>
            <th><Forms.FormText>Enter</Forms.FormText></th>
            <th><Forms.FormText>Leave</Forms.FormText></th>
        </tr>
        <tr>
            <td><Input
                placeholder="Enter message"
                initialValue={messages.enterMessage}
                onChange={e => {
                    messages.enterMessage = e;
                }}
                validator={checkMessageValid} /></td>
            <td><Input
                placeholder="Leave message"
                initialValue={messages.leaveMessage}
                onChange={e => { messages.leaveMessage = e; }}
                validator={checkMessageValid} /></td>
        </tr>
    </table>);
}

interface VoiceChatStatusProps {
    messages: VoiceChatStatusMessage;
}
