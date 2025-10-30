/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DeleteIcon, Flex } from "@components/index";
import { Button, Forms, GuildRoleStore, GuildStore, React } from "@webpack/common";

import { RoleSetting } from "../types";

export function RoleList({ roles }: RoleListProps) {
    if (roles.length === 0) return;

    const roleSettings = roles
        .sort((a, b) => a.guildId.localeCompare(b.guildId))
        .map(x => ({
            role: GuildRoleStore.getRole(x.guildId, x.id),
            setting: x
        })).sort((a, b) => a.role && b.role ? a.role.position - b.role.position : 0);

    return <Flex flexDirection="row" style={{
        gap: "0.25rem",
        alignItems: "center",
        flexWrap: "wrap"
    }}>
        <Forms.FormText>Roles:</Forms.FormText>
        {roleSettings.map((item, index) => {
            const { role, setting } = item;
            const error = "Unable to load role";

            const guildName = role
                ? `(${GuildStore.getGuild(setting.guildId).name})`
                : error;
            const title = role
                ? [role.name, `(${guildName})`].filter(Boolean).join(" ")
                : error;

            return (
                <Button
                    key={index}
                    title={title}
                    size={Button.Sizes.MIN}
                    style={{
                        marginBottom: 0,
                        maxWidth: "9rem",
                        whiteSpace: "nowrap",
                        background: "none",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        gap: "0.25rem"
                    }}>
                    {role?.icon && <img src={`${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/role-icons/${role.id}/${role.icon}.webp?size=16&quality=lossless`} />}
                    {role?.name && <span style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: role ? undefined : "var(--status-danger)"
                    }}>{role.name}</span>}
                    <span style={{
                        minWidth: "2rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}>{guildName}</span>
                    <Button
                        size={Button.Sizes.MIN}
                        look={Button.Looks.LINK}
                        onClick={() => roleSettings.splice(index, 1)}
                        style={{ color: "var(--status-danger)" }}
                    ><DeleteIcon /></Button>
                </Button>
            );
        })}
    </Flex >;
}

interface RoleListProps {
    roles: RoleSetting[];
}
