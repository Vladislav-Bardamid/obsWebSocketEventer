/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { DeleteIcon } from "@components/Icons";
import { Button, React, UserStore } from "@webpack/common";

export function UsersList({ users }: UserAllowedListProps) {
    return (
        <Flex style={{ gap: "0.5em", flexWrap: "wrap" }}>
            {users.map((item, index) => {
                const user = UserStore.getUser(item);

                return (
                    <React.Fragment key={index}>
                        <Button size={Button.Sizes.MIN} style={{ marginBottom: 0, background: "none" }}>
                            <Flex flexDirection="row" style={{ gap: 0, alignItems: "center" }}>
                                <span style={{ color: !user?.username ? "var(--status-danger)" : undefined }}>{
                                    user?.username ?? `Unknown User (${item})`
                                }</span>
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => users.splice(index, 1)}
                                    style={{
                                        marginBottom: 0,
                                        background: "none",
                                        color: "var(--status-danger)"
                                    }}
                                >
                                    <DeleteIcon />
                                </Button>
                            </Flex>
                        </Button>
                    </React.Fragment>
                );
            }
            )}
        </Flex>
    );
}

interface UserAllowedListProps {
    users: string[];
}

