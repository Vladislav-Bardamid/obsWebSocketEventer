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
import { Devs } from "@utils/constants";
import definePlugin, { OptionType, ReporterTestable } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, Forms, GuildMemberStore, GuildRoleStore, Menu, SelectedChannelStore, SelectedGuildStore, UserStore, useState } from "@webpack/common";

import { Credentials } from "./components/Credentials";
import { MessagesList } from "./components/MessagesList";
import { RoleGroupList } from "./components/RoleGroupList";
import { RoleList } from "./components/RoleList";
import { UsersList } from "./components/UsersList";
import { OBSWebSocketClient } from "./obsWebSocketClient";
import { ObsWebSocketCredentials, RoleGroupSetting, RoleSetting, UserContextProps, VoiceState } from "./types";
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
            return (<Forms.FormSection title="Credentials">
                <Credentials credentials={credentials} />
            </Forms.FormSection>);
        },
        default: {
            host: "ws://127.0.0.1:4455",
            password: ""
        } as ObsWebSocketCredentials
    },
    messages: {
        type: OptionType.COMPONENT,
        component: () => <Flex flexDirection="column" style={{ gap: "0.5rem" }}>
            <Forms.FormSection title="Voice chat enter messages">
                <MessagesList verticalTitles={enterLeave} />
            </Forms.FormSection>
            <Forms.FormSection title="Stream status">
                <MessagesList
                    verticalTitles={["Start", "Stop"]}
                    title="Stream" />
            </Forms.FormSection>
            <Forms.FormSection title="Mute/Deafen">
                <MessagesList
                    verticalTitles={["On", "Off"]}
                    horizontalTitles={["Mute", "Deaf"]} />
            </Forms.FormSection>
            <Forms.FormSection title="Muted messages">
                <MessagesList verticalTitles={enterLeave} title="muted" />
            </Forms.FormSection>
            <Forms.FormSection title="Some messages">
                <MessagesList verticalTitles={enterLeave} title="some" />
            </Forms.FormSection>
            <Forms.FormSection title="Black list messages">
                <MessagesList verticalTitles={enterLeave} title="blacklist" />
            </Forms.FormSection>
        </Flex>
    },
    guildRoleGroups: {
        type: OptionType.COMPONENT,
        component: () => {
            const { guildRoleGroups } = settings.use(["guildRoleGroups"]);
            const { guildRoles } = settings.use(["guildRoles"]);

            return (<Forms.FormSection title="Guild Roles">
                <RoleGroupList guildRoles={guildRoles} roleGroups={guildRoleGroups} />
            </Forms.FormSection>);
        },
        default: [] as RoleGroupSetting[]
    },
    guildRoles: {
        type: OptionType.COMPONENT,
        component: () => {
            const { guildRoles } = settings.use(["guildRoles"]);

            return (<Forms.FormSection title="Guild Role Groups">
                <RoleList guildRoles={guildRoles} />
            </Forms.FormSection>);
        },
        default: [] as RoleSetting[]
    },
    usersWhiteList: {
        type: OptionType.COMPONENT,
        component: () => {
            const { usersWhiteList } = settings.use(["usersWhiteList"]);

            return (<Forms.FormSection title="Users White List">
                <UsersList users={usersWhiteList} />
            </Forms.FormSection>);
        },
        default: [] as string[]
    },
    usersBlackList: {
        type: OptionType.COMPONENT,
        component: () => {
            const { usersBlackList } = settings.use(["usersBlackList"]);

            return (<Forms.FormSection title="Users Black List">
                <UsersList users={usersBlackList} />
            </Forms.FormSection>);
        },
        default: [] as string[]
    }
});

export default definePlugin({
    name: "OBSWebSocketEventer",
    description: "Make a request to OBS when something happen",
    authors: [Devs.Zorian],
    reporterTestable: ReporterTestable.None,
    settings,

    settingsAboutComponent: () => (
        <Forms.FormSection title="How to use OBSWebSocketEventer">
            <Forms.FormText>
                <Link href="https://github.com/VladislavB/OBSWebSocketEventer">Follow the instructions in the GitHub repo</Link>
            </Forms.FormText>
        </Forms.FormSection>
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
        AUDIO_SET_INPUT_VOLUME({ volume }: { volume: number; }) {
            if (volume !== 0) return;
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

    const { roles } = GuildMemberStore.getMember(guildId!, user.id)!;
    const { guildRoles, usersWhiteList, usersBlackList } = settings.use(["guildRoles", "usersWhiteList", "usersBlackList"]);
    const hasRole = guildRoles.some(role => roles.includes(role.id) && !role.deleted && !role.disabled);
    const userWhiteListIndex = usersWhiteList.findIndex(userId => userId === user.id);
    const userBlackListIndex = usersBlackList.findIndex(userId => userId === user.id);
    const [checked, changeChecked] = useState(() => hasRole ? userWhiteListIndex === -1 : userBlackListIndex !== -1);

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuCheckboxItem
                id="obs_event_user_context"
                label="OBS Events"
                action={() => {
                    const list = hasRole
                        ? usersWhiteList
                        : usersBlackList;

                    checked === hasRole
                        ? list.push(user.id)
                        : list.splice(hasRole ? userWhiteListIndex : userBlackListIndex, 1);

                    changeChecked(!checked);

                    if (!myChanId) return;

                    const guildId = ChannelStore.getChannel(myChanId).getGuildId();
                    hasRole ? userCheckContext.processRoleGroups(myChanId, guildId) : userCheckContext.processBlackList(myChanId, guildId);
                }}
                icon={ImageIcon}
                checked={checked}
            />
        </Menu.MenuGroup>
    ));
}

function RoleContext(children, { id }: { id: string; }) {
    const myChanId = SelectedChannelStore.getVoiceChannelId();
    const guildId = SelectedGuildStore.getGuildId()!;
    const role = GuildRoleStore.getRole(guildId, id);

    if (!role) return;

    const roleIndex = settings.store.guildRoles.findIndex(r => r.guildId === guildId && r.id === id);

    const roleSetting = settings.store.guildRoles[roleIndex];

    const [checked, changeChecked] = useState(() =>
        roleIndex !== -1 && !roleSetting.deleted);

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuCheckboxItem
                id="obs_event_role_context"
                label="OBS events"
                action={() => {
                    if (roleIndex !== -1) {
                        roleSetting.deleted = checked;
                    }
                    else {
                        settings.store.guildRoles.push(makeEmptyRole(id, guildId));
                    }

                    changeChecked(!checked);

                    if (!myChanId) return;

                    userCheckContext.processRoleGroups(myChanId, guildId);
                }}
                icon={ImageIcon}
                checked={checked}
            />
        </Menu.MenuGroup>
    ));
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
        obsClient.sendRequest(createMessage("leave"));
        userCheckContext.disposeAll();

        return;
    }

    const myChanId = myState?.channelId ?? SelectedChannelStore.getVoiceChannelId()!;
    const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();

    const stateUpdates = !myState
        ? voiceStates.filter(x => (
            x.channelId === myChanId ||
            x.oldChannelId === myChanId
        ) && x.channelId !== x.oldChannelId
            && x.userId !== myId
            && !settings.store.usersWhiteList.includes(x.userId))
        : undefined;

    if (!myState && !stateUpdates?.length) return;

    userCheckContext.processAll(myChanId, myGuildId, stateUpdates);

    if (!myState?.oldChannelId) return;

    obsClient.sendRequest(createMessage("enter"));
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
