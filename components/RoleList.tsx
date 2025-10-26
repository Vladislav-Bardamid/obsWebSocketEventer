/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TextButton } from "@components/Button";
import { DeleteIcon } from "@components/index";
import { Button, Forms, GuildRoleStore, GuildStore, React } from "@webpack/common";

import { RoleSetting } from "../types";

export function RoleList({ roles }: RoleListProps) {
    const roleSettings = roles
        .sort((a, b) => a.guildId.localeCompare(b.guildId))
        .map(x => ({
            role: GuildRoleStore.getRole(x.guildId, x.id),
            setting: x
        })).sort((a, b) => a.role && b.role ? a.role.position - b.role.position : 0);

    return <div style={{ gap: "0.25rem", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
        <Forms.FormText>Roles:</Forms.FormText>
        {roleSettings.map((item, index) => {
            const { role, setting } = item;

            const guildName = GuildStore.getGuild(setting.guildId).name;
            const title = `${role.name}(${guildName})`;

            return (
                <Button
                    key={index}
                    size={Button.Sizes.MIN}
                    style={{
                        marginBottom: 0,
                        background: "none",
                        color: "var(--status-danger)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem"
                    }}>
                    {role ? <>
                        {role.icon && <img src={`${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/role-icons/${role.id}/${role.icon}.webp?size=24&quality=lossless`} />}
                        <Forms.FormText
                            title={title}
                            style={{
                                maxWidth: "10rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                            }}>{role.name}({guildName})</Forms.FormText>
                    </> : <span style={{ color: "var(--status-danger)", marginLeft: "0.5rem" }}>Unable to load role ({setting.id})</span>}
                    <TextButton
                        onClick={() => roles.splice(index, 1)}
                        style={{ color: "var(--status-danger)" }}
                    ><DeleteIcon /></TextButton>
                </Button>
            );
        })}
    </div>;
}

interface RoleListProps {
    roles: RoleSetting[];
}
