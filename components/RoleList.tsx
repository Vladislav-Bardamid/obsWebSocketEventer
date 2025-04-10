/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DeleteIcon, NotesIcon } from "@components/Icons";
import { Button, Forms, GuildStore, React, Switch } from "@webpack/common";
import { Role } from "discord-types/general";

import { checkValidGroupNames } from "..";
import { RoleSetting } from "../types";
import { Input } from "./Input";

export function RoleList({ roles }: GuildRoleListProps) {
    const activeRoles = roles.filter(x => !x.deleted);

    const guildRoles = {} as Record<string, Role>;
    activeRoles.forEach(x => guildRoles[x.id] = GuildStore.getRole(x.guildId, x.id)!);

    activeRoles.sort((a, b) => a.guildId.localeCompare(b.guildId) || guildRoles[a.id].position - guildRoles[b.id].position);

    const [editRoleId, setEditRoleId] = React.useState(-1);

    return (
        <>
            <Forms.FormTitle tag="h4">Guild Roles</Forms.FormTitle>
            {activeRoles.map((item, index) => {
                const guild = GuildStore.getGuild(item.guildId);
                const role = guildRoles[item.id];

                return (
                    <React.Fragment key={index}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Switch
                                    hideBorder
                                    style={{ marginBottom: 0 }}
                                    value={!item.disabled}
                                    onChange={e => item.disabled = !e}
                                ></Switch>
                                {role.icon
                                    ? <img className="vc-mentionAvatars-icon vc-mentionAvatars-role-icon" src={`${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/role-icons/${role.id}/${role.icon}.webp?size=24&quality=lossless`} />
                                    : <span>&nbsp;</span>}
                                <Forms.FormText style={{ maxWidth: "10rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{role.name}{role.name ? " - " : ""}{guild.name}</Forms.FormText>
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => item.deleted = true}
                                    style={{
                                        marginBottom: 0,
                                        background: "none",
                                        color: "var(--status-danger)"
                                    }}
                                >
                                    <DeleteIcon />
                                </Button>
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => setEditRoleId(index === editRoleId ? -1 : index)}
                                    style={{
                                        marginBottom: 0,
                                        background: "none",
                                        color: "white"
                                    }}
                                >
                                    <NotesIcon />
                                </Button>
                                <Forms.FormText
                                    title={item.groupNames}
                                    style={{
                                        flexGrow: 1,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}>{item.groupNames}</Forms.FormText>
                            </div>
                            {editRoleId === index && <div>
                                <Input
                                    placeholder="Role groups"
                                    initialValue={item.groupNames}
                                    onChange={e => { item.groupNames = e; setEditRoleId(-1); }}
                                    validator={checkValidGroupNames} />
                            </div>}
                        </div>
                    </React.Fragment>);
            }
            )}
        </>
    );
}

interface GuildRoleListProps {
    roles: RoleSetting[];
}
