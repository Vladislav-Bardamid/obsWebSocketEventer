/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Forms } from "@webpack/common";

import { checkMessageValid } from "..";
import { RoleGroupSettingBase } from "../types";
import { Input } from "./Input";


export function MessagesList({ messages }: GuildMessageListProps) {
    return (<table style={{ width: "100%" }}>
        <tr>
            <th></th>
            <th><Forms.FormText>Enter</Forms.FormText></th>
            <th><Forms.FormText>Leave</Forms.FormText></th>
        </tr>
        <tr>
            <th style={{ width: "1%", verticalAlign: "middle" }}><Forms.FormText>Group</Forms.FormText></th>
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
        <tr>
            <th style={{ width: "1%", verticalAlign: "middle" }}><Forms.FormText>User</Forms.FormText></th>
            <td><Input
                placeholder="User enter message"
                initialValue={messages.userEnterMessage}
                onChange={e => { messages.userEnterMessage = e; }}
                validator={checkMessageValid} /></td>
            <td><Input
                placeholder="User leave message"
                initialValue={messages.userLeaveMessage}
                onChange={e => { messages.userLeaveMessage = e; }}
                validator={checkMessageValid} /></td>
        </tr>
        <tr>
            <th style={{ width: "1%", verticalAlign: "middle" }}><Forms.FormText>Stream (group)</Forms.FormText></th>
            <td><Input
                placeholder="Stream enter message"
                initialValue={messages.enterStreamMessage}
                onChange={e => { messages.enterStreamMessage = e; }}
                validator={checkMessageValid} /></td>
            <td><Input
                placeholder="Stream leave message"
                initialValue={messages.leaveStreamMessage}
                onChange={e => { messages.leaveStreamMessage = e; }}
                validator={checkMessageValid} /></td>
        </tr>
        <tr>
            <th style={{ width: "1%", verticalAlign: "middle" }}><Forms.FormText>Stream (user)</Forms.FormText></th>
            <td><Input
                placeholder="User stream enter message"
                initialValue={messages.userEnterStreamMessage}
                onChange={e => { messages.userEnterStreamMessage = e; }}
                validator={checkMessageValid} /></td>
            <td><Input
                placeholder="User stream leave message"
                initialValue={messages.userLeaveStreamMessage}
                onChange={e => { messages.userLeaveStreamMessage = e; }}
                validator={checkMessageValid} /></td>
        </tr>
    </table>);
}

interface GuildMessageListProps {
    messages: RoleGroupSettingBase;
}
