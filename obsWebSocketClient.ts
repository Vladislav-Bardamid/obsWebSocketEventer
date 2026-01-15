/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginNative } from "@utils/types";
import { User } from "@vencord/discord-types";

import { settings } from ".";
import { ActionType, CheckType, Scope } from "./types";

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

    public async sendUserStatus(type: CheckType, action: ActionType, user: User, source?: string);
    public async sendUserStatus(type: CheckType, status: boolean, user: User, source?: string);

    public async sendUserStatus(type: CheckType, actionOrStatus: ActionType | boolean, user: User, source?: string) {
        const actionType = typeof actionOrStatus === "boolean" ? (actionOrStatus ? ActionType.Enter : ActionType.Leave) : actionOrStatus;
        await this.sendBrowserData({ type, scope: Scope.User, action: actionType, user, source });
    }

    public async sendStatus(type: CheckType, status: boolean, users?: Record<string, User>, source?: string) {
        await this.sendBrowserData({ type, scope: Scope.Group, status, users, source });
    }

    public async sendBrowserData(data: any) {
        await this.sendBrowserRequest("OBSWebSocketEventer", data);
    }

    public async sendBrowserRequest(name: string, data?: any) {
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

    public async setPersistentData(name: string, data?: any) {
        await this.native.sendRequestAsync("SetPersistentData", {
            "realm": "OBS_WEBSOCKET_DATA_REALM_GLOBAL",
            "slotName": name,
            "slotValue": data
        });
    }

    public async checkConnection() {
        const c = settings.store.credentials;

        return c.host && await this.native.isConnected();
    }
}
