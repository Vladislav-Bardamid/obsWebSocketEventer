/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";
import OBSWebSocket from "obs-websocket-js";

const obs = new OBSWebSocket();

let connection;

obs.on("ConnectionClosed", async () => {
    connection = null;
});

export function isConnected() {
    return !!connection;
}

export async function connect(_: IpcMainInvokeEvent, host: string, password: string) {
    connection = await obs.connect(host, password);
}

export async function disconnect() {
    if (!connection) return;

    await obs.disconnect();
}

export async function makeObsMessageRequestAsync(_: IpcMainInvokeEvent, message: string) {
    if (!message || !connection) return null;

    return obs.call("CallVendorRequest", {
        "vendorName": "AdvancedSceneSwitcher",
        "requestType": "AdvancedSceneSwitcherMessage",
        "requestData": { "message": message }
    });
}

export async function makeObsBrowserMessageRequestAsync(_: IpcMainInvokeEvent, name: string, data: any) {
    if (!name || !connection) return null;

    return obs.call("CallVendorRequest", {
        "vendorName": "obs-browser",
        "requestType": "emit_event",
        "requestData": {
            "event_name": name,
            "event_data": data
        }
    });
}
