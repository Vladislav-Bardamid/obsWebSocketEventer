/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DeleteIcon, PlusIcon } from "@components/Icons";
import { Button, Forms, GuildStore, React, Switch, useState } from "@webpack/common";

import { checkValidName, makeEmptyGroup, settings } from "..";
import { RoleGroupSetting } from "../types";
import { Input } from "./Input";
import { MessagesList } from "./MessagesList";

export function RoleGroupList({ roleGroups }: GuildRoleGroupListProps) {
    const { guildRoles } = settings.use(["guildRoles"]);
    const [isCreating, setIsCreating] = useState(false);

    return (
        <>
            <Forms.FormTitle tag="h4">Guild Role Groups</Forms.FormTitle>
            {roleGroups.map((item, index) => {
                const firstRoleSetting = item.name ? guildRoles.find(x => x.groupNames.includes(item.name)) : null;
                const firstRole = firstRoleSetting ? GuildStore.getRole(firstRoleSetting.guildId, firstRoleSetting.id) : null;

                const roles = item.name
                    ? guildRoles.filter(x => x.groupNames.includes(item.name))
                        .map(x => GuildStore.getRole(x.guildId, x.id)!.name)
                        .join(" ")
                    : "";

                return (
                    <React.Fragment key={index}>
                        <div style={{ marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Switch
                                    hideBorder
                                    style={{ marginBottom: 0 }}
                                    value={!item.disabled}
                                    onChange={e => { item.disabled = !e; }}
                                ></Switch>
                                <Input
                                    style={{ width: "10rem" }}
                                    placeholder="Group name"
                                    initialValue={item.name}
                                    onChange={e => { item.name = e; }}
                                    validator={e => checkValidName(e) && !roleGroups.find(x => x.name === e)} />
                                {firstRole?.icon
                                    ? <img className="vc-mentionAvatars-icon vc-mentionAvatars-role-icon" src={`${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/role-icons/${firstRole.id}/${firstRole.icon}.webp?size=24&quality=lossless`} />
                                    : <span>&nbsp;</span>}
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => roleGroups.splice(index, 1)}
                                    style={{
                                        marginBottom: 0,
                                        background: "none",
                                        color: "var(--status-danger)"
                                    }}
                                >
                                    <DeleteIcon />
                                </Button>
                                {roles.length > 0 && <Forms.FormText
                                    title={roles}
                                    style={{
                                        verticalAlign: "middle",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>{roles}</Forms.FormText>}
                            </div>
                            <MessagesList messages={item} />
                        </div>
                    </React.Fragment>);
            })}
            <div>
                {isCreating ? <div style={{ display: "flex", alignItems: "center" }}><Input
                    placeholder="Group name"
                    initialValue={""}
                    style={{ width: "10rem" }}
                    onChange={e => {
                        roleGroups.push(makeEmptyGroup(e)),
                            setIsCreating(false);
                    }}
                    validator={e => checkValidName(e) && !roleGroups.find(x => x.name === e)} /><Button
                        size={Button.Sizes.MIN}
                        onClick={() => { setIsCreating(false); }}
                        style={{
                            marginBottom: 0,
                            background: "none",
                            fontWeight: "bold",
                            color: "var(--status-danger)"
                        }}
                    >X</Button></div> : <Button
                        size={Button.Sizes.MIN}
                        onClick={() => { setIsCreating(true); }}
                        style={{
                            marginBottom: 0,
                            background: "none",
                            color: "rgb(35, 165, 90)"
                        }}
                    ><PlusIcon /></Button>}
            </div>
        </>
    );
}

interface GuildRoleGroupListProps {
    roleGroups: RoleGroupSetting[];
}
