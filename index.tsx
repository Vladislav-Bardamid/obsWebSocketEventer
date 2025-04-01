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

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { ImageIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType, PluginNative, ReporterTestable } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, Forms, GuildMemberStore, GuildStore, Menu, SelectedChannelStore, SelectedGuildStore, UserStore, useState } from "@webpack/common";
import { Channel, User } from "discord-types/general";

import { Credentials } from "./components/Credentials";
import { MessagesList } from "./components/MessagesList";
import { MuteDeafen } from "./components/MuteDeafen";
import { RoleGroupList } from "./components/RoleGroupList";
import { RoleList } from "./components/RoleList";
import { StreamStatus } from "./components/StreamStatus";
import { UsersList } from "./components/UsersList";
import { MuteDeafenSetting, ObsWebSocketCredentials, RoleGroupSetting, RoleGroupSettingBase, RoleSetting, StreamStatusMessage, VoiceState } from "./types";

const VoiceStateStore = findByPropsLazy("getVoiceStatesForChannel", "getCurrentClientVoiceChannelId");
const MediaEngineStore = findByPropsLazy("isLocalMute", "isLocalVideoDisabled");

const Native = VencordNative.pluginHelpers.OBSWebSocketEventer as PluginNative<typeof import("./native")>;

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

const makeEmptyRole = (id: string, guildId: string) => ({
    id: id,
    guildId: guildId,
    disabled: false,
    deleted: false,
    groupNames: ""
} as RoleSetting);

export const makeEmptyGroup = (name: string) => ({
    ...makeEmptyGroupBase(name),
    name: name,
} as RoleGroupSetting);

const makeEmptyGroupBase = (name: string) => ({
    enterMessage: `${name}-role-group-enter`,
    leaveMessage: `${name}-role-group-left`,
    userEnterMessage: `${name}-role-enter`,
    userLeaveMessage: `${name}-role-leave`,
    enterStreamMessage: `${name}-stream-role-enter`,
    leaveStreamMessage: `${name}-stream-role-leave`,
    userEnterStreamMessage: `${name}-stream-role-enter`,
    userLeaveStreamMessage: `${name}-stream-role-leave`,
} as RoleGroupSettingBase);

export const settings = definePluginSettings({
    credentials: {
        type: OptionType.COMPONENT,
        component: () => {
            const { credentials } = settings.use(["credentials"]);
            return (<Credentials credentials={credentials} />);
        },
        default: {
            host: "ws://127.0.0.1:4455",
            password: ""
        } as ObsWebSocketCredentials
    },
    streamStatusMessage: {
        type: OptionType.COMPONENT,
        component: () => {
            const { streamStatusMessage } = settings.use(["streamStatusMessage"]);
            return (<StreamStatus streamStatusMessage={streamStatusMessage} />);
        },
        default: {
            messageStart: "stream-start",
            messageStop: "stream-stop"
        } as StreamStatusMessage
    },
    muteDeafen: {
        type: OptionType.COMPONENT,
        component: () => {
            const { muteDeafen: muteDeaf } = settings.use(["muteDeafen"]);
            return (<MuteDeafen muteDeafen={muteDeaf} />);
        },
        default: {
            muteMessage: "mute-message",
            unmuteMessage: "unmute-message",
            deafenMessage: "deaf-message",
            undeafenMessage: "undeaf-message"
        } as MuteDeafenSetting
    },
    mutedMessage: {
        type: OptionType.COMPONENT,
        component: () => {
            const { mutedMessage } = settings.use(["mutedMessage"]);
            return (<>
                <Forms.FormTitle tag="h4">Muted messages</Forms.FormTitle>
                <MessagesList messages={mutedMessage} /></>);
        },
        default: makeEmptyGroupBase("muted")
    },
    blackListMessage: {
        type: OptionType.COMPONENT,
        component: () => {
            const { blackListMessage } = settings.use(["blackListMessage"]);
            return (<>
                <Forms.FormTitle tag="h4">Black list messages</Forms.FormTitle>
                <MessagesList messages={blackListMessage} /></>);
        },
        default: makeEmptyGroupBase("blacklist")
    },
    guildRoleGroups: {
        type: OptionType.COMPONENT,
        component: () => {
            const { guildRoleGroups } = settings.use(["guildRoleGroups"]);
            return (<RoleGroupList roleGroups={guildRoleGroups} />);
        },
        default: [] as RoleGroupSetting[]
    },
    guildRoles: {
        type: OptionType.COMPONENT,
        component: () => {
            const { guildRoles } = settings.use(["guildRoles"]);
            return (<RoleList roles={guildRoles} />);
        },
        default: [] as RoleSetting[]
    },
    usersWhiteList: {
        type: OptionType.COMPONENT,
        component: () => {
            const { usersWhiteList } = settings.use(["usersWhiteList"]);
            return (<UsersList title="Users White List" users={usersWhiteList} />);
        },
        default: [] as string[]
    },
    usersBlackList: {
        type: OptionType.COMPONENT,
        component: () => {
            const { usersBlackList } = settings.use(["usersBlackList"]);
            return (<UsersList title="Users Black List" users={usersBlackList} />);
        },
        default: [] as string[]
    }
});

const activeGroupNames = new Set<string>();
const activeStreamGroupNames = new Set<string>();
const activeUserIds = new Set<string>();
const activeUserIdsOnStream = new Set<string>();
let blackListActive = false;
let blackListStreamActive = false;
let mutedActive = false;
const mutedStreamActive = false;

const UserContext: NavContextMenuPatchCallback = (children, { user, guildId }: UserContextProps) => {
    if (!user || !guildId) return;

    const myId = UserStore.getCurrentUser().id;
    const isMe = myId === user.id;

    if (isMe) return;

    const { roles } = GuildMemberStore.getMember(guildId!, user.id);
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

                    if (checked === hasRole) {
                        list.push(user.id);
                    } else {
                        list.splice(hasRole ? userWhiteListIndex : userBlackListIndex, 1);
                    }

                    hasRole ? checkCurrentRoles() : checkBlackList();

                    changeChecked(!checked);
                }}
                icon={ImageIcon}
                checked={checked}
            />
        </Menu.MenuGroup>
    ));
};

const RoleContext: NavContextMenuPatchCallback = (children, { id, userId }: { id: string; userId: string; }) => {
    const myChanId = SelectedChannelStore.getChannelId();

    const guildId = SelectedGuildStore.getGuildId();
    const role = GuildStore.getRole(guildId, id);

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

                    if (getVoiceStatesForChannel(myChanId).includes(userId)) {
                        checkCurrentRoles();
                    }

                    changeChecked(!checked);
                }}
                icon={ImageIcon}
                checked={checked}
            />
        </Menu.MenuGroup>
    ));
};

function getVoiceStatesForChannel(channelId: string) {
    return Object.keys(VoiceStateStore.getVoiceStatesForChannel(channelId));
}

async function sendRequest(request: string) {
    const c = settings.store.credentials;

    if (!c.host || !c.password) return;

    const isConnected = await Native.isConnected();

    if (!isConnected) {
        await connect();
    }

    await Native.makeObsMessageRequestAsync(request);
}

async function connect() {
    const c = settings.store.credentials;
    await Native.connect(c.host, c.password);
}

function init() {
    checkBlackList();
    checkMuted();
    checkCurrentRoles();
}

export default definePlugin({
    name: "OBSWebSocketEventer",
    description: "Make a request to OBS when something happen",
    authors: [Devs.Zorian],
    reporterTestable: ReporterTestable.None,
    settings: settings,

    settingsAboutComponent: () => (
        <>
            <Forms.FormTitle tag="h3">How to use OBSWebSocketEventer</Forms.FormTitle>
            <Forms.FormText>
                <Link href="https://github.com/VladislavB/OBSWebSocketEventer">Follow the instructions in the GitHub repo</Link>
            </Forms.FormText>
        </>
    ),

    async start() {
        await connect();

        const myChanId = SelectedChannelStore.getVoiceChannelId();

        if (!myChanId) return;

        init();
    },

    async stop() {
        await Native.disconnect();
    },

    contextMenus: {
        "user-context": UserContext,
        "dev-context": RoleContext
    },

    flux: {
        async STREAM_CREATE({ streamKey }: { streamKey: string; }) {
            checkStreamCreate(streamKey);
        },
        async STREAM_DELETE({ streamKey }: { streamKey: string; }) {
            checkStreamDelete(streamKey);
        },
        async STREAM_UPDATE({ viewerIds, streamKey }: { viewerIds: string[]; streamKey: string; }) {
            checkStreamUpdates(streamKey, viewerIds);
        },
        async VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            const myChanId = SelectedChannelStore.getVoiceChannelId();

            if (!myChanId) {
                disposeMessages();
                return;
            }

            if (ChannelStore.getChannel(myChanId).type === 13 /* Stage Channel */) return;

            const myId = UserStore.getCurrentUser().id;

            let stateUpdates = voiceStates.filter(x => (
                x.channelId === myChanId ||
                x.oldChannelId === myChanId
            ));

            if (stateUpdates.length === 0) return;

            const meEnter = voiceStates.some(x => x.userId === myId);
            stateUpdates = stateUpdates.filter(x =>
                x.userId !== myId &&
                x.channelId !== x.oldChannelId &&
                !settings.store.usersWhiteList.includes(x.userId));

            if (!meEnter && stateUpdates.length === 0) return;

            checkStateUpdates(stateUpdates);
            init();

        },
        AUDIO_TOGGLE_SELF_MUTE() {
            checkMuteStatus();
        },

        AUDIO_TOGGLE_SELF_DEAF() {
            checkDeafStatus();
        },

        AUDIO_TOGGLE_LOCAL_MUTE() {
            checkMuted();
        }
    }
});

function checkStreamCreate(streamKey: string) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    sendRequest(settings.store.streamStatusMessage.messageStart);
}

function checkStreamDelete(streamKey: string) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    sendRequest(settings.store.streamStatusMessage.messageStop);

    const enabledGroups = settings.store.guildRoleGroups.filter(role => !role.disabled);

    if (blackListStreamActive) {
        sendRequest(settings.store.blackListMessage.leaveStreamMessage);
        blackListStreamActive = false;
    }

    activeStreamGroupNames.values()
        .map(x => enabledGroups.find(r => r.name === x)!.leaveStreamMessage)
        .forEach(sendRequest);

    activeStreamGroupNames.clear();
    activeUserIdsOnStream.clear();
}

function checkStreamUpdates(streamKey: string, viewerIds: string[]) {
    const myId = UserStore.getCurrentUser().id;
    const myGuildId = SelectedGuildStore.getGuildId();

    if (!streamKey.endsWith(myId)) return;

    const enabledGroups = settings.store.guildRoleGroups.filter(role => !role.disabled);
    const enabledRoles = settings.store.guildRoles.filter(role => !role.disabled && !role.deleted);

    const whiteListedUserIds = viewerIds
        .filter(x => !settings.store.usersWhiteList.includes(x));

    const leftUserIds = [...activeUserIdsOnStream]
        .filter(x => !whiteListedUserIds.includes(x));

    enabledGroups.forEach(x => {
        const groupRoles = enabledRoles
            .filter(role => role.groupNames.includes(x.name));

        const enterUserIds = whiteListedUserIds
            .filter(x => groupRoles.some(role => checkUserHasRole(x, myGuildId, role.id)));
        const leaveUserIds = leftUserIds
            .filter(x => groupRoles.some(role => checkUserHasRole(x, myGuildId, role.id)));

        if (enterUserIds.length > 0) {
            sendRequest(x.userEnterStreamMessage);
            enterUserIds.forEach(x => activeUserIdsOnStream.add(x));
        }

        if (leaveUserIds.length > 0) {
            sendRequest(x.userLeaveStreamMessage);
            leaveUserIds.forEach(x => activeUserIdsOnStream.delete(x));
        }
    });
}

function checkUserHasRole(userId: string, guildId: string, roleId: string) {
    const roles = GuildMemberStore.getMember(guildId, userId)?.roles;
    const result = roles?.includes(roleId);

    return result;
}

function checkStateUpdates(voiceStates: VoiceState[]) {
    const enabledGroups = settings.store.guildRoleGroups.filter(group => !group.disabled);
    const enabledRoles = settings.store.guildRoles.filter(role => !role.disabled && !role.deleted);

    const myChanId = SelectedChannelStore.getVoiceChannelId()!;
    const myGuildId = SelectedGuildStore.getGuildId();

    if (!voiceStates.length) return;

    const joinedUserIds = voiceStates
        .filter(x => x.channelId === myChanId)
        .map(x => x.userId);

    const leftUserIds = voiceStates
        .filter(x => x.oldChannelId === myChanId)
        .map(x => x.userId);

    const joinedRoles = new Set(joinedUserIds.values()
        .flatMap(x => GuildMemberStore.getMember(myGuildId, x)?.roles ?? []));

    const leftRoles = new Set(leftUserIds.values()
        .flatMap(x => GuildMemberStore.getMember(myGuildId, x)?.roles ?? []));

    enabledGroups.forEach(x => {
        const groupRoles = enabledRoles
            .filter(role => role.groupNames.includes(x.name));

        if (groupRoles.some(role => joinedRoles.has(role.id))) {
            sendRequest(x.userEnterMessage);
        }

        if (groupRoles.some(role => leftRoles.has(role.id))) {
            sendRequest(x.userLeaveMessage);
        }
    });
}

function disposeMessages() {
    const enabledGroups = settings.store.guildRoleGroups.filter(group => !group.disabled);

    if (activeGroupNames.size === 0) return;

    if (blackListActive) {
        sendRequest(settings.store.blackListMessage.leaveMessage);
        blackListActive = false;
    }

    if (mutedActive) {
        sendRequest(settings.store.mutedMessage.leaveMessage);
        mutedActive = false;
    }

    activeGroupNames.values()
        .map(x => enabledGroups.find(r => r.name === x)!.leaveMessage)
        .forEach(sendRequest);

    activeGroupNames.clear();
}

function checkCurrentRoles() {
    const myId = UserStore.getCurrentUser().id;
    const myChanId = SelectedChannelStore.getVoiceChannelId();
    const myGuildId = SelectedGuildStore.getGuildId();

    const enabledGroups = settings.store.guildRoleGroups.filter(group => !group.disabled);
    const enabledRoles = settings.store.guildRoles.filter(role => !role.disabled && !role.deleted);

    const currentUserIds = Object.keys(VoiceStateStore.getVoiceStatesForChannel(myChanId))
        .filter(x => x !== myId && !settings.store.usersWhiteList.includes(x));

    const currentRoles = new Set(currentUserIds.values()
        .flatMap(x => GuildMemberStore.getMember(myGuildId, x)?.roles ?? []));

    enabledGroups.forEach(x => {
        const groupRoles = enabledRoles
            .filter(role => role.groupNames.includes(x.name));

        const isActive = activeGroupNames.has(x.name);
        const some = groupRoles.some(x => currentRoles.has(x.id));

        if (some === isActive) return;

        const message = !isActive ? x.enterMessage : x.leaveMessage;

        sendRequest(message);

        isActive ? activeGroupNames.delete(x.name) : activeGroupNames.add(x.name);
    });
}

function checkBlackList() {
    const myId = UserStore.getCurrentUser().id;
    const myChanId = SelectedChannelStore.getVoiceChannelId();

    const currentUserIds = Object.keys(VoiceStateStore.getVoiceStatesForChannel(myChanId))
        .filter(x => x !== myId && !settings.store.usersWhiteList.includes(x));

    const someBlackListUsers = currentUserIds.some(x =>
        settings.store.usersBlackList.includes(x));

    if (someBlackListUsers === blackListActive) return;

    sendRequest(blackListActive
        ? settings.store.blackListMessage.leaveMessage
        : settings.store.blackListMessage.enterMessage);

    blackListActive = someBlackListUsers;
}

function checkMuted() {
    const myChanId = SelectedChannelStore.getVoiceChannelId();
    const currentUserIds = Object.keys(VoiceStateStore.getVoiceStatesForChannel(myChanId)) as string[];

    const someMutedUsers = currentUserIds.some(x => MediaEngineStore.isLocalMute(x));

    if (someMutedUsers === mutedActive) return;

    sendRequest(mutedActive
        ? settings.store.mutedMessage.leaveMessage
        : settings.store.mutedMessage.enterMessage);

    mutedActive = someMutedUsers;
}

function checkMuteStatus() {
    const chanId = SelectedChannelStore.getVoiceChannelId()!;
    const s = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;

    if (!s) return;

    const isMuted = s.mute || s.selfMute;
    const isDeafened = s.deaf || s.selfDeaf;

    sendRequest(!isMuted ? settings.store.muteDeafen.muteMessage : settings.store.muteDeafen.unmuteMessage);

    if (!isMuted || !isDeafened) return;

    sendRequest(settings.store.muteDeafen.undeafenMessage);
}

function checkDeafStatus() {
    const chanId = SelectedChannelStore.getVoiceChannelId()!;
    const s = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;

    if (!s) return;

    const isDeafened = s.deaf || s.selfDeaf;

    sendRequest(!isDeafened ? settings.store.muteDeafen.deafenMessage : settings.store.muteDeafen.undeafenMessage);
}

export function checkValidName(value: string) {
    return !value || /^[a-zA-Z0-9-]+$/.test(value);
}

export function checkValidGroupNames(value: string) {
    return !value || /^[a-zA-Z0-9\- ]+$/.test(value);
}

export function checkMessageValid(value: string) {
    if (!checkValidName(value)) return false;

    const messages = [
        ...settings.store.guildRoleGroups.flatMap(x => [
            x.enterMessage,
            x.leaveMessage,
            x.userEnterMessage,
            x.userLeaveMessage,
            x.enterStreamMessage,
            x.leaveStreamMessage,
            x.userEnterStreamMessage,
            x.userLeaveStreamMessage
        ]),
        settings.store.streamStatusMessage.messageStart,
        settings.store.streamStatusMessage.messageStop,
        settings.store.muteDeafen.muteMessage,
        settings.store.muteDeafen.unmuteMessage,
        settings.store.muteDeafen.deafenMessage,
        settings.store.muteDeafen.undeafenMessage,
        settings.store.blackListMessage.enterMessage,
        settings.store.blackListMessage.leaveMessage,
        settings.store.blackListMessage.enterStreamMessage,
        settings.store.blackListMessage.leaveStreamMessage,
        settings.store.mutedMessage.enterMessage,
        settings.store.mutedMessage.leaveMessage,
        settings.store.mutedMessage.enterStreamMessage,
        settings.store.mutedMessage.leaveStreamMessage
    ];

    return !messages.includes(value);
}


