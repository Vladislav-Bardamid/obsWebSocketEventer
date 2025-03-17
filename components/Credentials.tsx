/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Forms } from "@webpack/common";

import { ObsWebSocketCredentials } from "../types";
import { Input } from "./Input";

export function Credentials({ credentials }: CredentialsProps) {
    return (<>
        <Forms.FormTitle tag="h4">Credentials</Forms.FormTitle>
        <table width={"100%"}>
            <tr>
                <th><Forms.FormText>URL</Forms.FormText></th>
                <td><Input
                    placeholder="Host"
                    initialValue={credentials.host}
                    onChange={e => credentials.host = e}
                /></td>
            </tr>
            <tr>
                <th><Forms.FormText>Password</Forms.FormText></th>
                <td><Input
                    placeholder="Password"
                    isPassword
                    initialValue={credentials.password}
                    onChange={e => credentials.password = e}
                /></td>
            </tr>
        </table>
    </>);
}

interface CredentialsProps {
    credentials: ObsWebSocketCredentials;
}
