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
import { VoiceChat } from "./components/VoiceChat";
import { MuteDeafenSetting, ObsWebSocketCredentials, RoleGroupSetting, RoleGroupSettingBase, RoleSetting, StreamStatusMessage, VoiceChatStatusMessage, VoiceState } from "./types";

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
    voiceChatEnterMessages: {
        type: OptionType.COMPONENT,
        component: () => {
            const { voiceChatEnterMessages: voiceChatEnterMessage } = settings.use(["voiceChatEnterMessages"]);
            return (<>
                <Forms.FormTitle tag="h4">Voice chat enter messages</Forms.FormTitle>
                <VoiceChat messages={voiceChatEnterMessage} /></>);
        },
        default: {
            enterMessage: "enter-message",
            leaveMessage: "leave-message"
        } as VoiceChatStatusMessage
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
    const myChanId = SelectedChannelStore.getVoiceChannelId();

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

                    if (myChanId) {
                        const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();
                        const currentUserIds = getChannelUserIds(myChanId);

                        hasRole ? checkRoleGroups(currentUserIds, myGuildId) : checkBlackList(currentUserIds);
                    }

                    changeChecked(!checked);
                }}
                icon={ImageIcon}
                checked={checked}
            />
        </Menu.MenuGroup>
    ));
};

const RoleContext: NavContextMenuPatchCallback = (children, { id }: { id: string; }) => {
    const myChanId = SelectedChannelStore.getVoiceChannelId();
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

                    if (myChanId) {
                        const currentUserIds = getChannelUserIds(myChanId);

                        checkRoleGroups(currentUserIds, guildId);
                    }

                    changeChecked(!checked);
                }}
                icon={ImageIcon}
                checked={checked}
            />
        </Menu.MenuGroup>
    ));
};

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

function getChannelUserIds(chanId) {
    const myId = UserStore.getCurrentUser().id;

    return Object.keys(VoiceStateStore.getVoiceStatesForChannel(chanId))
        .filter(x => x !== myId && !settings.store.usersWhiteList.includes(x));
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

        checkAll(myChanId);
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
            onSreamCreate(streamKey);
        },
        async STREAM_DELETE({ streamKey }: { streamKey: string; }): Promise<void> {
            onStreamDelete(streamKey);
        },
        async STREAM_UPDATE({ viewerIds, streamKey }: { viewerIds: string[]; streamKey: string; }) {
            onStreamUpdate(streamKey, viewerIds);
        },
        async VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
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
        }
    }
});

function onMute() {
    const myChanId = SelectedChannelStore.getVoiceChannelId();
    const currentUserIds = getChannelUserIds(myChanId);

    checkMuted(currentUserIds);
}

function onStreamUpdate(streamKey: string, viewerIds: string[]) {
    const myChanId = SelectedChannelStore.getVoiceChannelId();

    if (!myChanId) return;

    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    const guildId = ChannelStore.getChannel(myChanId).getGuildId();

    const enabledGroups = settings.store.guildRoleGroups.filter(role => !role.disabled);
    const enabledRoles = settings.store.guildRoles.filter(role => !role.disabled && !role.deleted);

    const checkStreamUpdates = getCheckStreamUpdates(guildId, viewerIds);

    enabledGroups.forEach(group => {
        const groupRoles = enabledRoles
            .filter(role => role.groupNames.split(" ").includes(group.name));

        checkStreamUpdates(group, groupRoles);
    });
}

function onVoiceStateUpdates(voiceStates: VoiceState[]) {
    const myChanId = SelectedChannelStore.getVoiceChannelId();

    if (!myChanId) return;

    const myId = UserStore.getCurrentUser().id;
    const myState = voiceStates.find(x => x.userId === myId);
    const meLeave = myState && myState.oldChannelId === myChanId && !myState.channelId;
    const meEnter = myState && myState.channelId === myChanId;

    if (meLeave) {
        sendRequest(settings.store.voiceChatEnterMessages.leaveMessage);
        disposeMessages();
        return;
    }

    if (ChannelStore.getChannel(myChanId).type === 13 /* Stage Channel */) return;

    if (meEnter) {
        sendRequest(settings.store.voiceChatEnterMessages.enterMessage);
        checkAll(myChanId);
        return;
    }

    const stateUpdates = voiceStates.filter(x => (
        x.channelId === myChanId ||
        x.oldChannelId === myChanId
    ) && x.channelId !== x.oldChannelId
        && x.userId !== myId
        && !settings.store.usersWhiteList.includes(x.userId));

    if (stateUpdates.length === 0) return;

    checkAll(myChanId, stateUpdates);
}

function checkAll(myChanId: string, stateUpdates?: VoiceState[]) {
    const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();
    const currentUserIds = getChannelUserIds(myChanId);

    checkRoleGroups(currentUserIds, myGuildId, stateUpdates);
    checkBlackList(currentUserIds);
    checkMuted(currentUserIds);
}

function checkRoleGroups(userIds: string[], myGuildId: string, stateUpdates?: VoiceState[]) {
    const enabledGroups = settings.store.guildRoleGroups.filter(role => !role.disabled);
    const enabledRoles = settings.store.guildRoles.filter(role => !role.disabled && !role.deleted);

    const checkRoleGroup = getCheckRoleGroup(userIds, myGuildId);
    const checkStateUpdates = stateUpdates && getCheckStateUpdates(stateUpdates, myGuildId);

    enabledGroups.forEach(group => {
        const groupRoles = enabledRoles
            .filter(role => role.groupNames.split(" ").includes(group.name));

        checkRoleGroup(group, groupRoles);
        checkStateUpdates?.(group, groupRoles);
    });
}

function onSreamCreate(streamKey: string) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    sendRequest(settings.store.streamStatusMessage.messageStart);
}

function onStreamDelete(streamKey: string) {
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

function getCheckStreamUpdates(guildId: string, viewerIds: string[]) {
    const whiteListedUserIds = viewerIds
        .filter(x => !settings.store.usersWhiteList.includes(x));

    const leftUserIds = [...activeUserIdsOnStream]
        .filter(x => !whiteListedUserIds.includes(x));

    return (group: RoleGroupSetting, roles: RoleSetting[]) => {
        const enterUserIds = whiteListedUserIds
            .filter(x => roles.some(role => checkUserHasRole(x, guildId, role.id)));
        const leaveUserIds = leftUserIds
            .filter(x => roles.some(role => checkUserHasRole(x, guildId, role.id)));

        if (enterUserIds.length > 0) {
            sendRequest(group.userEnterStreamMessage);
            enterUserIds.forEach(x => activeUserIdsOnStream.add(x));
        }

        if (leaveUserIds.length > 0) {
            sendRequest(group.userLeaveStreamMessage);
            leaveUserIds.forEach(x => activeUserIdsOnStream.delete(x));
        }
    };
}

function checkUserHasRole(userId: string, guildId: string, roleId: string) {
    const roles = GuildMemberStore.getMember(guildId, userId)?.roles;
    const result = roles?.includes(roleId);

    return result;
}

function getCheckRoleGroup(userIds: string[], guildId: string) {
    const currentRoles = new Set(userIds.values()
        .flatMap(x => GuildMemberStore.getMember(guildId, x).roles));

    return (group: RoleGroupSetting, roles: RoleSetting[]) => {
        const isActive = activeGroupNames.has(group.name);
        const some = roles.some(x => currentRoles.has(x.id));

        if (some === isActive) return;

        const message = !isActive ? group.enterMessage : group.leaveMessage;

        sendRequest(message);

        !isActive ? activeGroupNames.add(group.name) : activeGroupNames.delete(group.name);
    };
}

function getCheckStateUpdates(voiceStates: VoiceState[], guildId: string) {
    const myChanId = SelectedChannelStore.getVoiceChannelId();

    const joinedUserIds = voiceStates
        .filter(x => x.channelId === myChanId)
        .map(x => x.userId);

    const leftUserIds = voiceStates
        .filter(x => x.oldChannelId === myChanId)
        .map(x => x.userId);

    const joinedRoles = new Set(joinedUserIds.values()
        .flatMap(x => GuildMemberStore.getMember(guildId, x)?.roles ?? []));

    const leftRoles = new Set(leftUserIds.values()
        .flatMap(x => GuildMemberStore.getMember(guildId, x)?.roles ?? []));

    return (group: RoleGroupSetting, roles: RoleSetting[]) => {
        if (roles.some(role => joinedRoles.has(role.id))) {
            sendRequest(group.userEnterMessage);
        }

        if (roles.some(role => leftRoles.has(role.id))) {
            sendRequest(group.userLeaveMessage);
        }
    };
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

function checkBlackList(userIds: string[]) {
    const someBlackListUsers = userIds.some(x =>
        settings.store.usersBlackList.includes(x));

    if (someBlackListUsers === blackListActive) return;

    sendRequest(blackListActive
        ? settings.store.blackListMessage.leaveMessage
        : settings.store.blackListMessage.enterMessage);

    blackListActive = someBlackListUsers;
}

function checkMuted(userIds: string[]) {
    const someMutedUsers = userIds.some(x => MediaEngineStore.isLocalMute(x));

    if (someMutedUsers === mutedActive) return;

    sendRequest(mutedActive
        ? settings.store.mutedMessage.leaveMessage
        : settings.store.mutedMessage.enterMessage);

    mutedActive = someMutedUsers;
}

function onMuteStatusChange() {
    const chanId = SelectedChannelStore.getVoiceChannelId()!;
    const s = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;

    if (!s) return;

    const isMuted = s.mute || s.selfMute;
    const isDeafened = s.deaf || s.selfDeaf;

    sendRequest(!isMuted ? settings.store.muteDeafen.muteMessage : settings.store.muteDeafen.unmuteMessage);

    if (!isMuted || !isDeafened) return;

    sendRequest(settings.store.muteDeafen.undeafenMessage);
}

function onDeafStatusChange() {
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
        settings.store.voiceChatEnterMessages.enterMessage,
        settings.store.voiceChatEnterMessages.leaveMessage,
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


