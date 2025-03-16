/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TextInput, useState } from "@webpack/common";

export function Input({ initialValue, onChange, validator, placeholder, style }: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
    validator?: (value: string) => boolean;
    style?: React.CSSProperties;
}) {
    const [value, setValue] = useState(initialValue);
    const [isValid, setIsValid] = useState(true);

    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChange={e => {
                setValue(e);
                setIsValid(validator ? initialValue === e || validator(e) : true);
            }}
            spellCheck={false}
            style={{ ...style, border: isValid ? "" : "1px solid red" }}
            onBlur={() => value !== initialValue && isValid && onChange(value)} />
    );
}
