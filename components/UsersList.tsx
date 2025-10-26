/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TextButton } from "@components/Button";
import { Flex } from "@components/Flex";
import { DeleteIcon } from "@components/Icons";
import { Button, Forms, React, UserStore } from "@webpack/common";

export function UsersList({ users, title }: UserListProps) {
    return (
        <Flex style={{ gap: "0.25rem", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
            <Forms.FormText>{title}: </Forms.FormText>
            {users.map((item, index) => {
                const user = UserStore.getUser(item);

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
                        {user
                            ? <Forms.FormText
                                title={user.username}
                                style={{
                                    maxWidth: "10rem",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}>{user.username}</Forms.FormText>
                            : <span style={{ color: "var(--status-danger)", marginLeft: "0.5rem" }}>Unable to load user ({item})</span>}
                        <TextButton
                            onClick={() => users.splice(index, 1)}
                            style={{ color: "var(--status-danger)" }}
                        ><DeleteIcon /></TextButton>
                    </Button>
                );
            }
            )}
        </Flex>
    );
}

interface UserListProps {
    users: string[];
    title?: string;
}

