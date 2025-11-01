/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { IpcMainInvokeEvent } from "electron";
import OBSWebSocket, { OBSRequestTypes } from "obs-websocket-js";

const obs = new OBSWebSocket();

let connection;

obs.on("ConnectionClosed", async () => {
    connection = null;
});
obs.on("ConnectionError", async () => {
    connection = null;
});

export function isConnected() {
    return !!connection;
}

export async function connect(_: IpcMainInvokeEvent, host: string, password: string) {
    connection = await obs.connect(host, password);

    return !!connection;
}

export async function disconnect() {
    if (!connection) return;

    await obs.disconnect();
}

export async function sendRequestAsync<Type extends keyof OBSRequestTypes>(_: IpcMainInvokeEvent, requestType: Type, requestData?: OBSRequestTypes[Type]) {
    if (!connection) return null;

    return await obs.call(requestType, requestData);
}
