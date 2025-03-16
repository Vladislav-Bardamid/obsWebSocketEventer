/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";
import OBSWebSocket from "obs-websocket-js";

const obs = new OBSWebSocket();
const href = "ws://127.0.0.1:4455";
const password = "VVYElwj6Mz8jpaDz";

let connection;

obs.on("ConnectionClosed", async () => {
    connection = null;
});

export async function connect() {
    connection = await obs.connect(href, password);
}

export function disconnect() {
    if (!connection) return;

    obs.disconnect();
}

export async function makeObsMessageRequestAsync(_: IpcMainInvokeEvent, message: string) {
    if (!message) return;

    if (!connection) {
        await connect();
    }

    await obs.call("CallVendorRequest", {
        "vendorName": "AdvancedSceneSwitcher",
        "requestType": "AdvancedSceneSwitcherMessage",
        "requestData": { "message": message }
    });
}

export async function makeObsBrowserMessageRequestAsync(_: IpcMainInvokeEvent, name: string, data: any) {
    if (!connection) {
        await connect();
    }

    await obs.call("CallVendorRequest", {
        "vendorName": "obs-browser",
        "requestType": "emit_event",
        "requestData": {
            "event_name": name,
            "event_data": data
        }
    });
}
