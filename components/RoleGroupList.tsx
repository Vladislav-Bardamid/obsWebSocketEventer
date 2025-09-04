/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { DeleteIcon, PlusIcon } from "@components/Icons";
import { Button, Forms, GuildRoleStore, React, Switch, useState } from "@webpack/common";

import { RoleGroupSetting, RoleSetting } from "../types";
import { checkValidName } from "../utils";
import { Input } from "./Input";
import { MessagesList } from "./MessagesList";

export function RoleGroupList({ guildRoles, roleGroups }: GuildRoleGroupListProps) {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <Flex flexDirection="column" style={{ gap: "0.5rem" }}>
            {roleGroups.map((item, index) => {
                const firstRoleSetting = guildRoles.find(y => y.groupNames.split(" ").includes(item.name));
                const firstRole = firstRoleSetting ? GuildRoleStore.getRole(firstRoleSetting.guildId, firstRoleSetting.id) : null;

                const roles = item.name
                    ? guildRoles.filter(y => y.groupNames.includes(item.name))
                        .map(x => GuildRoleStore.getRole(x.guildId, x.id)?.name)
                        .filter(x => x)
                        .join(" ")
                    : "";

                return (
                    <div key={index}>
                        <Flex style={{ alignItems: "center", gap: "0.5rem" }}>
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
                                onChange={e => { item.name = e.trim(); }}
                                validator={e => checkValidName(e) && !roleGroups.find(x => x.name === e)} />
                            {firstRole?.icon &&
                                <img className="vc-mentionAvatars-icon vc-mentionAvatars-role-icon" src={`${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/role-icons/${firstRole.id}/${firstRole.icon}.webp?size=24&quality=lossless`} />}
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
                        </Flex>
                        <MessagesList verticalTitles={["Enter", "Leave"]} horizontalTitles={["", "user"]} title={item.name} />
                    </div>);
            })}
            <div>
                {isCreating ? <div style={{ display: "flex", alignItems: "center" }}><Input
                    placeholder="Group name"
                    initialValue={""}
                    style={{ width: "10rem" }}
                    onChange={e => {
                        roleGroups.push({ name: "", disabled: false }),
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
        </Flex>
    );
}

interface GuildRoleGroupListProps {
    roleGroups: RoleGroupSetting[];
    guildRoles: RoleSetting[];
}
