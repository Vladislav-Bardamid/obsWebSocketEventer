/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Forms } from "@webpack/common";

import { RoleGroupSettingBase } from "../types";
import { MessagesList } from "./MessagesList";

export function BlackList({ blackListMessages }: BlackListProps) {
    return (<>
        <Forms.FormTitle tag="h4">Black list messages</Forms.FormTitle>
        <MessagesList messages={blackListMessages} />
    </>);
}

interface BlackListProps {
    blackListMessages: RoleGroupSettingBase;
}
