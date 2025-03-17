/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Forms } from "@webpack/common";

import { checkValid } from "..";
import { MuteDeafenSetting } from "../types";
import { Input } from "./Input";

export function MuteDeafen({ muteDeafen: muteDeaf }: MuteDeafenProps) {
    return (<>
        <Forms.FormTitle tag="h4">Mute/Deaf messages</Forms.FormTitle>
        <table style={{ width: "100%" }}>
            <tr>
                <th></th>
                <th><Forms.FormText>On</Forms.FormText></th>
                <th><Forms.FormText>Off</Forms.FormText></th>
            </tr>
            <tr>
                <th style={{ width: "1%", verticalAlign: "middle", textAlign: "right" }}><Forms.FormText>Mute</Forms.FormText></th>
                <td><Input
                    placeholder="Mute message"
                    initialValue={muteDeaf.muteMessage}
                    onChange={e => {
                        muteDeaf.muteMessage = e;
                    }}
                    validator={checkValid} /></td>
                <td><Input
                    placeholder="Unmute message"
                    initialValue={muteDeaf.unmuteMessage}
                    onChange={e => { muteDeaf.unmuteMessage = e; }}
                    validator={checkValid} /></td>
            </tr>
            <tr>
                <th style={{ width: "1%" }}><Forms.FormText>Deaf</Forms.FormText></th>
                <td><Input
                    placeholder="Deaf message"
                    initialValue={muteDeaf.deafenMessage}
                    onChange={e => { muteDeaf.deafenMessage = e; }}
                    validator={checkValid} /></td>
                <td><Input
                    placeholder="Undeaf message"
                    initialValue={muteDeaf.undeafenMessage}
                    onChange={e => { muteDeaf.undeafenMessage = e; }}
                    validator={checkValid} /></td>
            </tr>
        </table>
    </>);
}

export interface MuteDeafenProps {
    muteDeafen: MuteDeafenSetting;
}
