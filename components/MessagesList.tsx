/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Forms, TextInput } from "@webpack/common";

import { createMessage } from "../utils";


export function MessagesList({ title, horizontalTitles, verticalTitles }: GuildMessageListProps) {
    const hasNames = horizontalTitles?.every(title => title);
    return (<table style={{ width: "100%" }}>
        <tr>
            {horizontalTitles && hasNames && <th></th>}
            {verticalTitles.map((title: string) => <th key={title}>
                <Forms.FormText>{title}</Forms.FormText></th>)}
        </tr>
        {(horizontalTitles ?? [""]).map((horizontalTitle: string) => <tr key={horizontalTitle}>
            {horizontalTitles && hasNames && <th style={{ width: "1%", verticalAlign: "middle", textAlign: "right" }}>
                <Forms.FormText>{horizontalTitle}</Forms.FormText>
            </th>}
            {verticalTitles.map(verticalTitle => {
                const value = createMessage(title, horizontalTitle, verticalTitle);
                const placeholder = [title, verticalTitle, horizontalTitle].filter(x => x).join(" ");

                return (<td key={verticalTitle}>
                    <TextInput
                        key={value}
                        placeholder={placeholder}
                        value={value}
                        readOnly
                    />
                </td>);
            })}
        </tr>)}
    </table>);
}

interface GuildMessageListProps {
    verticalTitles: string[];
    horizontalTitles?: string[];
    title?: string;
}
