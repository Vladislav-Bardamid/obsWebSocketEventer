/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { ImageIcon } from "@components/Icons";
import { Link } from "@components/Link";
import definePlugin, { OptionType, ReporterTestable } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, Forms, GuildMemberStore, Menu, React, SelectedChannelStore, SelectedGuildStore, UserStore, useState } from "@webpack/common";

import { Credentials } from "./components/Credentials";
import { MessagesList } from "./components/MessagesList";
import { RoleGroupList } from "./components/RoleGroupList";
import { OBSWebSocketClient } from "./obsWebSocketClient";
import { ObsWebSocketCredentials, RoleGroupSetting, UserContextProps, VoiceState } from "./types";
import { UserCheckContext } from "./userCheck/userCheckContext";
import { createMessage, makeEmptyRole } from "./utils";

export const voiceStateStore = findByPropsLazy("getVoiceStatesForChannel", "getCurrentClientVoiceChannelId");

const userCheckContext = new UserCheckContext();
export const obsClient = new OBSWebSocketClient();

const enterLeave = ["Enter", "Leave"];

export const settings = definePluginSettings({
    credentials: {
        type: OptionType.COMPONENT,
        component: () => {
            const { credentials } = settings.use(["credentials"]);
            return (<div>
                <Forms.FormTitle>Credentials</Forms.FormTitle>
                <Credentials credentials={credentials} />
            </div>);
        },
        default: {
            host: "ws://127.0.0.1:4455",
            password: ""
        } as ObsWebSocketCredentials
    },
    messages: {
        type: OptionType.COMPONENT,
        component: () => <Flex flexDirection="column" style={{ gap: "0.5rem" }}>
            <div>
                <Forms.FormText>Stream status</Forms.FormText>
                <MessagesList
                    verticalTitles={["Start", "Stop"]}
                    title="Stream" />
            </div>
            <div>
                <Forms.FormText>Mute/Deafen</Forms.FormText>
                <MessagesList
                    verticalTitles={["On", "Off"]}
                    horizontalTitles={["Mute", "Deaf"]} />
            </div>
            <div>
                <Forms.FormText>Muted messages</Forms.FormText>
                <MessagesList verticalTitles={enterLeave} title="muted" />
            </div>
            <div>
                <Forms.FormText>Some messages</Forms.FormText>
                <MessagesList verticalTitles={enterLeave} title="some" />
            </div>
        </Flex>
    },
    guildRoleGroups: {
        type: OptionType.COMPONENT,
        component: () => {
            const { guildRoleGroups } = settings.use(["guildRoleGroups"]);

            return (<div>
                <Forms.FormText>Guild Roles</Forms.FormText>
                <RoleGroupList roleGroups={guildRoleGroups} />
            </div>);
        },
        default: [] as RoleGroupSetting[]
    }
});

export default definePlugin({
    name: "OBSWebSocketEventer",
    description: "Make a request to OBS when something happen",
    authors: [/* Devs.Zorian */],
    reporterTestable: ReporterTestable.None,
    settings,

    settingsAboutComponent: () => (
        <div title="How to use OBSWebSocketEventer">
            <Forms.FormText>
                <Link href="https://github.com/VladislavB/OBSWebSocketEventer">Follow the instructions in the GitHub repo</Link>
            </Forms.FormText>
        </div>
    ),

    start: async () => {
        const connected = await obsClient.connect();
        if (!connected) return;

        const myChanId = SelectedChannelStore.getVoiceChannelId();
        if (!myChanId) return;

        const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();
        userCheckContext.processAll(myChanId, myGuildId);
    },

    stop: () => {
        obsClient.disconnect();
    },

    contextMenus: {
        "user-context": UserContext,
        "dev-context": RoleContext
    },

    flux: {
        STREAM_CREATE({ streamKey }: { streamKey: string; }) {
            onSreamCreate(streamKey);
        },
        STREAM_DELETE({ streamKey }: { streamKey: string; }) {
            onStreamDelete(streamKey);
        },
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            onVoiceStateUpdates(voiceStates);
        },
        AUDIO_TOGGLE_SELF_MUTE() {
            onMuteStatusChange();
        },
        AUDIO_TOGGLE_SELF_DEAF() {
            onDeafStatusChange();
        },
        AUDIO_TOGGLE_LOCAL_MUTE() {
            onMute();
        },
        AUDIO_SET_INPUT_VOLUME() {
            onMute();
        }
    }
});

function UserContext(children, { user, guildId }: UserContextProps) {
    if (!user || !guildId) return;

    const myId = UserStore.getCurrentUser().id;
    const myChanId = SelectedChannelStore.getVoiceChannelId();

    const isMe = myId === user.id;

    if (isMe) return;

    const { guildRoleGroups } = settings.use(["guildRoleGroups"]);
    const { roles } = GuildMemberStore.getMember(guildId!, user.id)!;

    const items = guildRoleGroups.map(x => ({
        hasRole: x.roles.some(role => roles.includes(role.id)),
        roleGroup: x
    })).sort((a, b) => a.hasRole === b.hasRole ? 0 : a.hasRole ? -1 : 1);
    const splitIndex = items.findIndex(x => !x.hasRole);

    children.splice(-1, 0, (
        <Menu.MenuItem id="obs-events-user-role-groups" label="OBS Events">
            {items.length > 0
                ? items.map((x, index) => <React.Fragment key={index}>
                    {splitIndex === index && splitIndex > 0 && <Menu.MenuSeparator />}
                    {createItem(x.roleGroup, x.hasRole)}
                </React.Fragment>)
                : "None"}
        </Menu.MenuItem>
    ));

    function createItem(roleGroup: RoleGroupSetting, hasRole: boolean) {
        const list = hasRole
            ? roleGroup.excludeUserIds
            : roleGroup.includeUserIds;
        const listIndex = list.findIndex(userId => userId === user.id);
        const isChecked = hasRole ? listIndex === -1 : listIndex !== -1;
        const [checked, changeChecked] = useState(isChecked);

        return <Menu.MenuCheckboxItem
            id={`obs-event-role-group-${roleGroup.name}`}
            label={roleGroup.name}
            action={() => {
                checked === hasRole
                    ? list.push(user.id)
                    : list.splice(listIndex, 1);

                changeChecked(!checked);

                if (!myChanId) return;

                const guildId = ChannelStore.getChannel(myChanId).getGuildId();
                userCheckContext.processRoleGroups(myChanId, guildId);
            }}
            icon={ImageIcon}
            checked={checked}
        />;
    }
}

function RoleContext(children, { id }: { id: string; }) {
    const myChanId = SelectedChannelStore.getVoiceChannelId();
    const guildId = SelectedGuildStore.getGuildId()!;

    const { guildRoleGroups } = settings.use(["guildRoleGroups"]);

    children.splice(-1, 0, (
        <Menu.MenuItem id="obs-events-role-group" label="OBS Events">
            {guildRoleGroups.length > 0
                ? guildRoleGroups.map((roleGroup, index) => <React.Fragment key={index}>
                    {createItem(roleGroup)}
                </React.Fragment>)
                : "None"}
        </Menu.MenuItem>
    ));

    function createItem(roleGroup: RoleGroupSetting) {
        const roleIndex = roleGroup.roles.findIndex(r => r.guildId === guildId && r.id === id);
        const [checked, changeChecked] = useState(() => roleIndex !== -1);

        return <Menu.MenuCheckboxItem
            id={`obs-event-role-group-${roleGroup.name}`}
            label={roleGroup.name}
            action={() => {
                roleIndex !== -1
                    ? roleGroup.roles.splice(roleIndex, 1)
                    : roleGroup.roles.push(makeEmptyRole(id, guildId));

                changeChecked(!checked);

                if (!myChanId) return;

                userCheckContext.processRoleGroups(myChanId, guildId);
            }}
            icon={ImageIcon}
            checked={checked}
        />;
    }
}

function onMute() {
    const guildId = SelectedGuildStore.getGuildId()!;
    const myChanId = SelectedChannelStore.getVoiceChannelId();

    if (!myChanId) return;

    userCheckContext.processMuted(myChanId, guildId);
}

function onVoiceStateUpdates(voiceStates: VoiceState[]) {
    const myId = UserStore.getCurrentUser().id;
    const myState = voiceStates.find(x => x.userId === myId);

    if (myState && !myState.channelId) {
        userCheckContext.disposeAll();
        return;
    }

    const myChanId = myState?.channelId ?? SelectedChannelStore.getVoiceChannelId()!;
    if (!myChanId) return;

    const stateUpdates = !myState
        ? voiceStates.filter(x => (
            x.channelId === myChanId
            || x.oldChannelId === myChanId
        ) && x.channelId !== x.oldChannelId
            && x.userId !== myId)
        : undefined;

    if (!myState && !stateUpdates?.length) return;

    const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();
    userCheckContext.processAll(myChanId, myGuildId, stateUpdates);
}

function onSreamCreate(streamKey: string) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    obsClient.sendRequest(createMessage("stream", "start"));
}

function onStreamDelete(streamKey: string) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    obsClient.sendRequest(createMessage("stream", "stop"));
}

function onMuteStatusChange() {
    const chanId = SelectedChannelStore.getVoiceChannelId();
    if (!chanId) return;

    const state = voiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;
    const isMuted = state.mute || state.selfMute;
    const isDeafened = state.deaf || state.selfDeaf;

    obsClient.sendRequest(createMessage("mute", !isMuted ? "on" : "off"));

    if (!isMuted || !isDeafened) return;

    obsClient.sendRequest(createMessage("deaf", "off"));
}

function onDeafStatusChange() {
    const chanId = SelectedChannelStore.getVoiceChannelId();
    if (!chanId) return;

    const state = voiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;
    const isDeafened = state.deaf || state.selfDeaf;

    obsClient.sendRequest(createMessage("deaf", !isDeafened ? "on" : "off"));
}
