/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Forms } from "@webpack/common";

import { StreamStatusMessage } from "../types";
import { Input } from "./Input";

export function StreamStatus({ streamStatusMessage }: StreamStatusProps) {
    return (<>
        <Forms.FormTitle tag="h4">Stream Status Messages</Forms.FormTitle>
        <table style={{ width: "100%" }}>
            <tr>
                <th><Forms.FormText>Start</Forms.FormText></th>
                <th><Forms.FormText>Stop</Forms.FormText></th>
            </tr>
            <tr>
                <th>Stream</th>
                <td><Input
                    placeholder="Message start"
                    initialValue={streamStatusMessage.messageStart}
                    onChange={e => streamStatusMessage.messageStart = e} /></td>
                <td><Input
                    placeholder="Message stop"
                    initialValue={streamStatusMessage.messageStop}
                    onChange={e => streamStatusMessage.messageStop = e} /></td>
            </tr>
        </table>
    </>);
}

interface StreamStatusProps {
    streamStatusMessage: StreamStatusMessage;
}
