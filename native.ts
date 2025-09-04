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
import OBSWebSocket from "obs-websocket-js";
import { JsonObject } from "type-fest";

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

export async function sendRequestAsync(_: IpcMainInvokeEvent, requestType: "CallVendorRequest", requestData?: {
    vendorName: string;
    requestType: string;
    requestData?: JsonObject | undefined;
} | undefined) {
    if (!connection) return null;

    return obs.call(requestType, requestData);
}
