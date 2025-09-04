/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginNative } from "@utils/types";

import { settings } from ".";

export class OBSWebSocketClient {
    private native = VencordNative.pluginHelpers.OBSWebSocketEventer as PluginNative<typeof import("./native")>;

    public async connect() {
        const c = settings.store.credentials;
        const result = await this.native.connect(c.host, c.password);

        return result;
    }

    public async disconnect() {
        await this.native.disconnect();
    }

    public async sendRequest(message: string) {
        const connection = await this.checkConnection();

        if (!connection && !await this.connect()) return;

        await this.native.sendRequestAsync("CallVendorRequest", {
            "vendorName": "AdvancedSceneSwitcher",
            "requestType": "AdvancedSceneSwitcherMessage",
            "requestData": { "message": message }
        });
    }

    public async sendBrowserRequest(name: string, data: any) {
        const connection = await this.checkConnection();

        if (!connection && !await this.connect()) return;

        await this.native.sendRequestAsync("CallVendorRequest", {
            "vendorName": "obs-browser",
            "requestType": "emit_event",
            "requestData": {
                "event_name": name,
                "event_data": data
            }
        });
    }

    public async checkConnection() {
        const c = settings.store.credentials;

        return c.host && await this.native.isConnected();
    }
}
