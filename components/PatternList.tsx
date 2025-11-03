/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { DeleteIcon, PlusIcon } from "@components/Icons";
import { Span } from "@components/Span";
import { Switch } from "@components/Switch";
import { Button, React, useState } from "@webpack/common";

import { emptyUser } from "..";
import { PatternSetting as PatternSetting } from "../types";
import { checkValidName, checkValidPattern, makeEmptyPattern } from "../utils";
import { Input } from "./Input";
import { MessagesList } from "./MessagesList";

export function PatternList({ patterns }: PatternListProps) {
    const [isCreating, setIsCreating] = useState(false);

    const nameTitle = "Must start with a letter, can include letters or numbers, and may contain hyphens between parts";
    const patternTitle = "One or more names allowed, each may start with a hyphen for negation and be separated by spaces.";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {patterns.map((item, index) => {
                return (
                    <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <Flex style={{ alignItems: "center", gap: "0.25rem" }}>
                            <Switch
                                checked={!item.disabled}
                                onChange={e => { item.disabled = !e; }}
                            ></Switch>
                            <Input
                                title={nameTitle}
                                style={{ width: "10rem" }}
                                placeholder="Pattern name"
                                initialValue={item.name}
                                onChange={e => { item.name = e.trim(); }}
                                validator={e => checkValidName(e) && !patterns.find(x => x.name === e)} />
                            <Button
                                size={Button.Sizes.MIN}
                                onClick={() => patterns.splice(index, 1)}
                                style={{
                                    marginBottom: 0,
                                    background: "none",
                                    color: "var(--status-danger)"
                                }}
                            ><DeleteIcon /></Button>
                        </Flex>
                        <Input
                            title={patternTitle}
                            placeholder="pattern"
                            initialValue={item.pattern}
                            onChange={e => { item.pattern = e.trim(); }}
                            validator={e => checkValidPattern(e)} />
                        {!item.disabled && <>
                            <Span size="xs">Messages:</Span>
                            <MessagesList verticalTitles={["Enter", "Leave"]} horizontalTitles={emptyUser} title={item.name} />
                        </>}
                    </div>);
            })}
            <div>
                {isCreating ? <div style={{ display: "flex", alignItems: "center" }}><Input
                    placeholder="Pattern name"
                    initialValue={""}
                    style={{ width: "10rem" }}
                    onChange={e => {
                        patterns.push(makeEmptyPattern(e)),
                            setIsCreating(false);
                    }}
                    validator={e => checkValidName(e) && !patterns.find(x => x.name === e)} /><Button
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

interface PatternListProps {
    patterns: PatternSetting[];
}
