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
    if (users.length === 0) return;

    return (
        <Flex style={{ gap: "0.25rem", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
            <Forms.FormText>{title}: </Forms.FormText>
            {users.map((item, index) => {
                const user = UserStore.getUser(item);
                const title = user?.username ?? "Unable to load user";

                return (
                    <Button
                        key={index}
                        title={title}
                        size={Button.Sizes.MIN}
                        style={{
                            marginBottom: 0,
                            maxWidth: "9rem",
                            textOverflow: "ellipsis",
                            color: user ? undefined : "var(--status-danger)",
                            background: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem"
                        }}>
                        <span style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden"
                        }}>{title}</span>
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

