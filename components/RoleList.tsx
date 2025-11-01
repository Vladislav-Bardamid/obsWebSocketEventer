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
        .map((x, i) => ({
            role: GuildRoleStore.getRole(x.guildId, x.id),
            setting: x,
            index: i
        })).sort((a, b) => a.role?.position - b.role?.position);

    return <Flex flexDirection="row" style={{
        gap: "0.25rem",
        alignItems: "center",
        flexWrap: "wrap"
    }}>
        <Forms.FormText>Roles:</Forms.FormText>
        {roleSettings.map((item, index) => {
            const { role, setting } = item;
            const error = "Unable to load role";

            const guidlName = role && GuildStore.getGuild(setting.guildId).name;
            const title = role?.name ?? "Unable to load role";

            return (
                <Button
                    key={index}
                    title={role && `${title} (${guidlName})`}
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
                    <span style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: role ? undefined : "var(--status-danger)"
                    }}>{title}</span>
                    {role && <span style={{
                        minWidth: "2rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}>({guidlName})</span>}
                    <Button
                        size={Button.Sizes.MIN}
                        look={Button.Looks.LINK}
                        onClick={() => roles.splice(item.index, 1)}
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
