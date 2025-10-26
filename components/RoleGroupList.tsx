/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { DeleteIcon, PlusIcon } from "@components/Icons";
import { Switch } from "@components/Switch";
import { Button, React, useState } from "@webpack/common";

import { RoleGroupSetting } from "../types";
import { checkValidName, makeEmptyRoleGroup } from "../utils";
import { Input } from "./Input";
import { MessagesList } from "./MessagesList";
import { RoleList } from "./RoleList";
import { UsersList } from "./UsersList";

export function RoleGroupList({ roleGroups }: GuildRoleGroupListProps) {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {roleGroups.map((item, index) => {
                return (
                    <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <Flex style={{ alignItems: "center", gap: "0.5rem" }}>
                            <Switch
                                checked={!item.disabled}
                                onChange={e => { item.disabled = !e; }}
                            ></Switch>
                            <Input
                                style={{ width: "10rem" }}
                                placeholder="Group name"
                                initialValue={item.name}
                                onChange={e => { item.name = e.trim(); }}
                                validator={e => checkValidName(e) && !roleGroups.find(x => x.name === e)} />
                            <Button
                                size={Button.Sizes.MIN}
                                onClick={() => roleGroups.splice(index, 1)}
                                style={{
                                    marginBottom: 0,
                                    background: "none",
                                    color: "var(--status-danger)"
                                }}
                            ><DeleteIcon /></Button>
                        </Flex>
                        {item.roles.length > 0
                            && <RoleList roles={item.roles} />}
                        {item.includeUserIds.length > 0
                            && <UsersList users={item.includeUserIds} title="Included users" />}
                        {item.excludeUserIds.length > 0
                            && <UsersList users={item.excludeUserIds} title="Excluded users" />}
                        <MessagesList verticalTitles={["Enter", "Leave"]} horizontalTitles={["", "user"]} title={item.name} />
                    </div>);
            })}
            <div>
                {isCreating ? <div style={{ display: "flex", alignItems: "center" }}><Input
                    placeholder="Group name"
                    initialValue={""}
                    style={{ width: "10rem" }}
                    onChange={e => {
                        roleGroups.push(makeEmptyRoleGroup(e)),
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
        </div >
    );
}

interface GuildRoleGroupListProps {
    roleGroups: RoleGroupSetting[];
}
