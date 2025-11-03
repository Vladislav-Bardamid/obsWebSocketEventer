/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TextInput, useState } from "@webpack/common";

export function Input({ title, initialValue, onChange, validator, placeholder, isPassword, style }: {
    title?: string;
    placeholder: string;
    initialValue: string | number;
    onChange(value: string): void;
    validator?: (value: string) => boolean;
    style?: React.CSSProperties;
    isPassword?: boolean;
}) {
    const [value, setValue] = useState(initialValue);
    const [isValid, setIsValid] = useState(true);

    return (
        <TextInput
            title={title}
            placeholder={placeholder}
            value={value}
            onChange={e => {
                setValue(e);
                setIsValid(validator ? initialValue === e || validator(e) : true);
            }}
            spellCheck={false}
            type={isPassword ? "password" : "text"}
            style={{ ...style, border: isValid ? "" : "1px solid red" }}
            onBlur={() => value !== initialValue && isValid && onChange(String(value))} />
    );
}
