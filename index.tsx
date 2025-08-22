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
import definePlugin, { OptionType, PluginNative, ReporterTestable } from "@utils/types";
import { Channel, GuildMember, User } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, Forms, GuildMemberStore, GuildRoleStore, Menu, SelectedChannelStore, SelectedGuildStore, UserStore, useState } from "@webpack/common";

import { Credentials } from "./components/Credentials";
import { MessagesList } from "./components/MessagesList";
import { RoleGroupList } from "./components/RoleGroupList";
import { RoleList } from "./components/RoleList";
import { UsersList } from "./components/UsersList";
import { ObsWebSocketCredentials, RoleGroupSetting, RoleSetting, VoiceState } from "./types";

const VoiceStateStore = findByPropsLazy("getVoiceStatesForChannel", "getCurrentClientVoiceChannelId");
const MediaEngineStore = findByPropsLazy("isLocalMute", "isLocalVideoDisabled");

const Native = VencordNative.pluginHelpers.OBSWebSocketEventer as PluginNative<typeof import("./native")>;

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

const enterLeave = ["Enter", "Leave"];

export const settings = definePluginSettings({
    credentials: {
        type: OptionType.COMPONENT,
        component: () => {
            const { credentials } = settings.use(["credentials"]);
            return (<Forms.FormSection>
                <Forms.FormTitle tag="h4">Credentials</Forms.FormTitle>
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
            <Forms.FormSection>
                <Forms.FormTitle tag="h4">Voice chat enter messages</Forms.FormTitle>
                <MessagesList verticalTitles={enterLeave} />
            </Forms.FormSection>
            <Forms.FormSection>
                <Forms.FormTitle tag="h4">Stream status</Forms.FormTitle>
                <MessagesList
                    verticalTitles={["Start", "Stop"]}
                    title="Stream" />
            </Forms.FormSection>
            <Forms.FormSection>
                <Forms.FormTitle tag="h4">Mute/Deafen</Forms.FormTitle>
                <MessagesList
                    verticalTitles={["On", "Off"]}
                    horizontalTitles={["Mute", "Deaf"]} />
            </Forms.FormSection>
            <Forms.FormSection>
                <Forms.FormTitle tag="h4">Muted messages</Forms.FormTitle>
                <MessagesList verticalTitles={enterLeave} title="muted" />
            </Forms.FormSection>
            <Forms.FormSection>
                <Forms.FormTitle tag="h4">Some messages</Forms.FormTitle>
                <MessagesList verticalTitles={enterLeave} title="some" />
            </Forms.FormSection>
            <Forms.FormSection>
                <Forms.FormTitle tag="h4">Black list messages</Forms.FormTitle>
                <MessagesList verticalTitles={enterLeave} title="blacklist" />
            </Forms.FormSection>
        </Flex>
    },
    guildRoleGroups: {
        type: OptionType.COMPONENT,
        component: () => {
            const { guildRoleGroups } = settings.use(["guildRoleGroups"]);
            const { guildRoles } = settings.use(["guildRoles"]);

            return (<div>
                <Forms.FormTitle tag="h4">Guild Roles</Forms.FormTitle>
                <RoleGroupList guildRoles={guildRoles} roleGroups={guildRoleGroups} /></div>);
        },
        default: [] as RoleGroupSetting[]
    },
    guildRoles: {
        type: OptionType.COMPONENT,
        component: () => {
            const { guildRoles } = settings.use(["guildRoles"]);

            return (<div>
                <Forms.FormTitle tag="h4">Guild Role Groups</Forms.FormTitle>
                <RoleList guildRoles={guildRoles} /></div>);
        },
        default: [] as RoleSetting[]
    },
    usersWhiteList: {
        type: OptionType.COMPONENT,
        component: () => {
            const { usersWhiteList } = settings.use(["usersWhiteList"]);

            return (<div>
                <Forms.FormTitle tag="h4">Users White List</Forms.FormTitle>
                <UsersList users={usersWhiteList} /></div>);
        },
        default: [] as string[]
    },
    usersBlackList: {
        type: OptionType.COMPONENT,
        component: () => {
            const { usersBlackList } = settings.use(["usersBlackList"]);

            return (<div>
                <Forms.FormTitle tag="h4">Users Black List</Forms.FormTitle>
                <UsersList users={usersBlackList} /></div>);
        },
        default: [] as string[]
    }
});

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

        const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();

        checkAll(myChanId, myGuildId);
    },

    async stop() {
        await Native.disconnect();
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

const activeGroupNames = new Set<string>();
let blackListActive = false;
let someActive = false;
let mutedActive = false;

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

                    if (checked === hasRole) {
                        list.push(user.id);
                    } else {
                        list.splice(hasRole ? userWhiteListIndex : userBlackListIndex, 1);
                    }

                    if (myChanId) {
                        const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();
                        const currentUserIds = getChannelUserIds(myChanId);

                        hasRole ? checkRoleGroups(currentUserIds, myGuildId) : checkBlackList(currentUserIds, myGuildId);
                    }

                    changeChecked(!checked);
                }}
                icon={ImageIcon}
                checked={checked}
            />
        </Menu.MenuGroup>
    ));
}

function makeEmptyRole(id: string, guildId: string) {
    return {
        id: id,
        guildId: guildId,
        disabled: false,
        deleted: false,
        groupNames: ""
    } as RoleSetting;
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
}

async function sendRequest(request: string) {
    const check = checkConnection();

    if (!check) return;

    await Native.makeObsMessageRequestAsync(request);
}

async function sendBrowserRequest(request: string, data: any) {
    const check = checkConnection();

    if (!check) return;

    await Native.makeObsBrowserMessageRequestAsync(request, data);
}

async function checkConnection() {
    const c = settings.store.credentials;

    if (!c.host || !c.password) return false;

    const isConnected = await Native.isConnected();

    if (!isConnected) {
        await connect();
    }

    return isConnected;
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

function onMute() {
    const myChanId = SelectedChannelStore.getVoiceChannelId();
    const currentUserIds = getChannelUserIds(myChanId);

    checkMuted(currentUserIds);
}

function onVoiceStateUpdates(voiceStates: VoiceState[]) {
    const myId = UserStore.getCurrentUser().id;
    const myState = voiceStates.find(x => x.userId === myId);

    const meLeave = myState && !myState.channelId;
    if (meLeave) {
        sendRequest(createMessage("leave"));
        disposeMessages();
        return;
    }

    const myChanId = SelectedChannelStore.getVoiceChannelId();
    if (!myChanId) return;

    const myGuildId = ChannelStore.getChannel(myChanId).getGuildId();

    if (myState) {
        checkAll(myChanId, myGuildId);

        const meEnter = myState && !myState?.oldChannelId;
        if (!meEnter) return;

        sendRequest(createMessage("enter"));

        return;
    }

    const stateUpdates = voiceStates.filter(x => (
        x.channelId === myChanId ||
        x.oldChannelId === myChanId
    ) && x.channelId !== x.oldChannelId
        && x.userId !== myId
        && !settings.store.usersWhiteList.includes(x.userId));

    if (stateUpdates.length === 0) return;

    checkAll(myChanId, myGuildId, stateUpdates);
}

function checkAll(myChanId: string, myGuildId: string, stateUpdates?: VoiceState[]) {
    const currentUserIds = getChannelUserIds(myChanId);

    checkRoleGroups(currentUserIds, myGuildId, stateUpdates);
    checkBlackList(currentUserIds, myGuildId, stateUpdates);
    checkMuted(currentUserIds);
    checkSome(currentUserIds);
}


function mapRolesToGroupIds(roles: RoleSetting[]) {
    const map = {} as { [key: string]: string[]; };

    roles.forEach(role => {
        role.groupNames.split(" ").forEach(group => {
            if (!map[group]) {
                map[group] = [];
            }
            map[group].push(role.id);
        });
    });

    return map;
}

function checkRoleGroups(userIds: string[], myGuildId: string, stateUpdates?: VoiceState[]) {
    const enabledGroupsNames = settings.store.guildRoleGroups.filter(role => !role.disabled).map(x => x.name);
    const mapRoles = mapRolesToGroupIds(settings.store.guildRoles.filter(role => !role.disabled && !role.deleted));

    const checkRoleGroup = getCheckRoleGroup(userIds, myGuildId);
    const checkStateUpdates = stateUpdates && getCheckStateUpdates(stateUpdates, myGuildId);

    enabledGroupsNames.forEach(group => {
        const roleIds = mapRoles[group];

        checkRoleGroup(group, roleIds);
        checkStateUpdates?.(group, roleIds);
    });
}

export function createMessage(...params: (string | undefined)[]) {
    return params.filter(x => x).map(x => x?.toLowerCase()).join("-");
}

function getCheckRoleGroup(userIds: string[], guildId: string) {
    const guildMembers = userIds.map(x => GuildMemberStore.getMember(guildId, x)!);
    const currentRoles = new Set(guildMembers.flatMap(x => x.roles));

    return (groupName: string, roleIds: string[]) => {
        const isActive = activeGroupNames.has(groupName);
        const some = roleIds.some(id => currentRoles.has(id));

        if (some === isActive) return;

        const message = createMessage(groupName, !isActive ? "enter" : "leave");
        sendRequest(message);

        const users = guildMembers.filter(x => roleIds.some(id => x.roles.includes(id)));
        sendBrowserRequest(message, { users });

        !isActive ? activeGroupNames.add(groupName) : activeGroupNames.delete(groupName);
    };
}

function getCheckStateUpdates(voiceStates: VoiceState[], guildId: string) {
    const myChanId = SelectedChannelStore.getVoiceChannelId();

    const joinedUsers = voiceStates
        .filter(x => x.channelId === myChanId)
        .map(x => GuildMemberStore.getMember(guildId, x.userId)!);

    const leftUsers = voiceStates
        .filter(x => x.oldChannelId === myChanId)
        .map(x => GuildMemberStore.getMember(guildId, x.userId)!);

    const joinedRoles = new Set(joinedUsers.flatMap(x => x?.roles ?? []));
    const leftRoles = new Set(leftUsers.flatMap(x => x?.roles ?? []));

    return (groupName: string, roleIds: string[]) => {
        processRoleIdsUpdate(groupName, roleIds, joinedRoles, joinedUsers);
        processRoleIdsUpdate(groupName, roleIds, leftRoles, leftUsers);
    };
}

function processRoleIdsUpdate(groupName: string, roleIds: string[], roleIdSet: Set<string>, members: GuildMember[]) {
    if (!roleIds.some(id => roleIdSet.has(id))) return;

    const users = members.filter(x => roleIds.some(id => x.roles.includes(id)));
    const message = createMessage(groupName, "user", "enter");

    sendRequest(message);
    sendBrowserRequest(message, { users });
}

function disposeMessages() {
    if (blackListActive) {
        sendRequest(createMessage("blacklist", "leave"));
        blackListActive = false;
    }

    if (mutedActive) {
        sendRequest(createMessage("muted", "leave"));
        mutedActive = false;
    }

    const enabledGroups = settings.store.guildRoleGroups.filter(group => !group.disabled);

    if (activeGroupNames.size === 0) return;

    activeGroupNames.values()
        .map(x => enabledGroups.find(r => r.name === x))
        .forEach(x => sendRequest(createMessage(x!.name, "leave")));

    activeGroupNames.clear();
}

function checkBlackList(userIds: string[], guildId: string, stateUpdates?: VoiceState[]) {
    const users = userIds.filter(x =>
        settings.store.usersBlackList.includes(x));
    const someBlackListUsers = users.length > 0;

    if (someBlackListUsers === blackListActive) return;

    const message = blackListActive
        ? createMessage("blacklist", "leave")
        : createMessage("blacklist", "enter");

    sendRequest(message);
    sendBrowserRequest(message, { users });

    blackListActive = someBlackListUsers;
}

function checkMuted(userIds: string[]) {
    const users = userIds.filter(x =>
        MediaEngineStore.isLocalMute(x) || MediaEngineStore.getLocalVolume(x) === 0
    );
    const someMutedUsers = users.length > 0;

    if (someMutedUsers === mutedActive) return;

    const message = mutedActive
        ? createMessage("muted", "leave")
        : createMessage("muted", "enter");

    sendRequest(message);

    mutedActive = someMutedUsers;
}

function checkSome(userIds: string[]) {
    const users = userIds.filter(x => !MediaEngineStore.isLocalMute(x));
    const someUsers = users.length > 0;

    if (someUsers === someActive) return;

    const message = someActive
        ? createMessage("some", "leave")
        : createMessage("some", "enter");

    sendRequest(message);
    sendBrowserRequest(message, { users });

    someActive = someUsers;
}

function onSreamCreate(streamKey: string) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    sendRequest(createMessage("stream", "start"));
}

function onStreamDelete(streamKey: string) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    sendRequest(createMessage("stream", "stop"));
}

function onMuteStatusChange() {
    const chanId = SelectedChannelStore.getVoiceChannelId()!;
    const s = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;

    if (!s) return;

    const isMuted = s.mute || s.selfMute;
    const isDeafened = s.deaf || s.selfDeaf;

    sendRequest(createMessage("mute", !isMuted ? "on" : "off"));

    if (!isMuted || !isDeafened) return;

    sendRequest(createMessage("deaf", "off"));
}

function onDeafStatusChange() {
    const chanId = SelectedChannelStore.getVoiceChannelId()!;
    const s = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;

    if (!s) return;

    const isDeafened = s.deaf || s.selfDeaf;

    sendRequest(createMessage("deaf", !isDeafened ? "on" : "off"));
}

export function checkValidName(value: string) {
    return !value || /^[a-zA-Z0-9\- ]+$/.test(value);
}
