/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DeleteIcon, NotesIcon } from "@components/Icons";
import { Button, Forms, GuildStore, React, Switch } from "@webpack/common";

import { checkValidGroupNames } from "..";
import { RoleSetting } from "../types";
import { Input } from "./Input";

export function RoleList({ guildRoles }: GuildRoleListProps) {
    const [editRoleId, setEditRoleId] = React.useState(-1);
    const roles = guildRoles
        .filter(x => !x.deleted)
        .sort((a, b) => a.guildId.localeCompare(b.guildId))
        .map(x => ({
            role: GuildStore.getRole(x.guildId, x.id),
            setting: x
        })).sort((a, b) => a.role && b.role ? a.role.position - b.role.position : 0);

    return (
        <div>
            <Forms.FormTitle tag="h4">Guild Roles</Forms.FormTitle>
            {roles.map((item, index) => {
                const guild = item.role
                    ? GuildStore.getGuild(item.setting.guildId)
                    : null;

                return (
                    <React.Fragment key={index}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <Switch
                                hideBorder
                                style={{ marginBottom: 0 }}
                                value={!item.setting.disabled}
                                onChange={e => item.setting.disabled = !e}
                            ></Switch>
                            {item.role ? <>
                                {item.role.icon
                                    ? <img className="vc-mentionAvatars-icon vc-mentionAvatars-role-icon" src={`${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/role-icons/${item.role.id}/${item.role.icon}.webp?size=24&quality=lossless`} />
                                    : <span>&nbsp;</span>}
                                <Forms.FormText style={{ maxWidth: "10rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginLeft: item.role.icon ? "0.5rem" : "0" }}>{item.role.name}{item.role.name ? " - " : ""}{guild!.name}</Forms.FormText>
                            </> : <span style={{ color: "var(--status-danger)", marginLeft: "0.5rem" }}>Error loading role</span>}
                            <Button
                                size={Button.Sizes.MIN}
                                onClick={() => item.setting.deleted = true}
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
                                title={item.setting.groupNames}
                                style={{
                                    flexGrow: 1,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}>{item.setting.groupNames}</Forms.FormText>
                        </div>
                        {editRoleId === index && <div>
                            <Input
                                placeholder="Role groups"
                                initialValue={item.setting.groupNames}
                                onChange={e => { item.setting.groupNames = e; setEditRoleId(-1); }}
                                validator={checkValidGroupNames} />
                        </div>}
                    </React.Fragment>);
            }
            )}
        </div>
    );
}

interface GuildRoleListProps {
    guildRoles: RoleSetting[];
}
