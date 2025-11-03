/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { TextInput } from "@webpack/common";

import { createMessage } from "../utils";


export function MessagesList({ title, horizontalTitles, verticalTitles }: GuildMessageListProps) {
    return (<div>
        {(horizontalTitles ?? [""]).map((horizontalTitle: string) => <Flex key={horizontalTitle} style={{ gap: 0 }}>
            {verticalTitles.map(verticalTitle => {
                const value = createMessage(title, horizontalTitle, verticalTitle);
                const placeholder = [title, verticalTitle, horizontalTitle].filter(x => x).join(" ");

                return (<div key={value} style={{ margin: "0.05rem", flex: 1 }}><TextInput
                    placeholder={placeholder}
                    value={value}
                    readOnly
                /></div>);
            })}
        </Flex>)}
    </div>);
}

interface GuildMessageListProps {
    verticalTitles: string[];
    horizontalTitles?: string[];
    title?: string;
}
