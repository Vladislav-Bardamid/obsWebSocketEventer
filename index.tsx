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
import { Paragraph } from "@components/Paragraph";
import definePlugin, { OptionType, ReporterTestable } from "@utils/types";
import { VoiceState } from "@vencord/discord-types";
import { Forms, GuildMemberStore, Menu, React, SelectedChannelStore, SelectedGuildStore, UserStore, useState, VoiceStateStore } from "@webpack/common";

import { Credentials } from "./components/Credentials";
import { MessagesList } from "./components/MessagesList";
import { PatternList } from "./components/PatternList";
import { RoleGroupList } from "./components/RoleGroupList";
import { OBSWebSocketClient } from "./obsWebSocketClient";
import { ObsWebSocketCredentials, PatternSetting, RoleGroupSetting, UserContextProps, VoiceStateChangeEvent } from "./types";
import { createMessage, makeEmptyRole } from "./utils";
import { VoiceCheckContext } from "./voiceCheck/voiceCheckContext";

const userCheckContext = new VoiceCheckContext();
export const obsClient = new OBSWebSocketClient();

const enterLeave = ["Enter", "Leave"];
export const emptyUser = ["", "User"];

const fixedGroups = ["Some", "Friends", "Blocked", "Muted"];

export const nameTitle = "Must start with a letter, can include letters or numbers, and may contain hyphens between parts";
export const patternTitle = "One or more names allowed, each may start with a hyphen for negation and be separated by spaces.";

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
                <Paragraph>Stream status</Paragraph>
                <MessagesList
                    verticalTitles={["Start", "Stop"]}
                    title="Stream" />
            </div>
            <div>
                <Paragraph>Mute/Deafen</Paragraph>
                <MessagesList
                    verticalTitles={["On", "Off"]}
                    horizontalTitles={["Mute", "Deaf"]} />
            </div>
            {fixedGroups.map((group, index) => <div key={index}>
                <Paragraph>{group} messages</Paragraph>
                <MessagesList verticalTitles={enterLeave} horizontalTitles={emptyUser} title={group} />
            </div>)}
        </Flex>
    },
    roleGroups: {
        type: OptionType.COMPONENT,
        component: () => {
            const { roleGroups } = settings.use(["roleGroups"]);

            return (<div>
                <Paragraph>Guild roles</Paragraph>
                <RoleGroupList roleGroups={roleGroups} />
            </div>);
        },
        default: [] as RoleGroupSetting[]
    },
    patterns: {
        type: OptionType.COMPONENT,
        component: () => {
            const { patterns } = settings.use(["patterns"]);

            return (<div>
                <Paragraph>Group patterns</Paragraph>
                <PatternList patterns={patterns} />
            </div>);
        },
        default: [] as PatternSetting[]
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
            <Paragraph>
                <Link href="https://github.com/VladislavB/OBSWebSocketEventer">Follow the instructions in the GitHub repo</Link>
            </Paragraph>
        </div>
    ),

    start: async () => {
        const connected = await obsClient.connect();
        if (!connected) return;

        userCheckContext.processAll();
    },

    stop: () => {
        obsClient.disconnect();
    },

    contextMenus: {
        "user-context": UserContext,
        "dev-context": RoleContext
    },

    flux: {
        STREAM_CREATE: onStreamCreate,
        STREAM_DELETE: onStreamDelete,
        VOICE_STATE_UPDATES: onVoiceStateUpdates,
        RELATIONSHIP_ADD: onRelationshipUpdate,
        RELATIONSHIP_REMOVE: onRelationshipUpdate,
        RELATIONSHIP_UPDATE: onRelationshipUpdate,
        AUDIO_TOGGLE_SELF_MUTE: onMuteStatusChange,
        AUDIO_TOGGLE_SELF_DEAF: onDeafStatusChange,
        AUDIO_TOGGLE_LOCAL_MUTE: onMute,
        AUDIO_SET_INPUT_VOLUME: onMute,
    }
});

function onRelationshipUpdate() {
    const myChanId = SelectedChannelStore.getVoiceChannelId();
    const guildId = SelectedGuildStore.getGuildId();

    if (!guildId || !myChanId) return;

    userCheckContext.processFriends();
    userCheckContext.processBlocked();
}

function UserContext(children, { user, guildId }: UserContextProps) {
    if (!user || !guildId) return;

    const myId = UserStore.getCurrentUser().id;
    const isMe = myId === user.id;

    if (isMe) return;

    const { roleGroups } = settings.use(["roleGroups"]);
    const { roles } = GuildMemberStore.getMember(guildId!, user.id)!;

    const items = roleGroups.map(x => ({
        hasRole: x.roles.some(role => roles.includes(role.id)),
        roleGroup: x
    })).sort((a, b) => Number(b.hasRole) - Number(a.hasRole));
    const splitIndex = items.findIndex(x => !x.hasRole);

    children.splice(-1, 0, (
        <Menu.MenuItem id="obs-events-user-role-groups" label="OBS Events">
            {items.length > 0
                ? items.map((x, index) =>
                    <React.Fragment key={index}>
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

                userCheckContext.processRoleGroups();
                userCheckContext.processPatterns();
            }}
            icon={ImageIcon}
            checked={checked}
        />;
    }
}

function RoleContext(children, { id }: { id: string; }) {
    const guildId = SelectedGuildStore.getGuildId()!;

    const { roleGroups } = settings.use(["roleGroups"]);

    children.splice(-1, 0, (
        <Menu.MenuItem id="obs-events-role-group" label="OBS Events">
            {roleGroups.length > 0
                ? roleGroups.map((roleGroup, index) =>
                    <React.Fragment key={index}>
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

                userCheckContext.processRoleGroups();
                userCheckContext.processPatterns();
            }}
            icon={ImageIcon}
            checked={checked}
        />;
    }
}

function onMute() {
    userCheckContext.processMuted();
}

function onVoiceStateUpdates({ voiceStates }: { voiceStates: VoiceStateChangeEvent[]; }) {
    userCheckContext.processVoiceStates(voiceStates);
}

function onStreamCreate({ streamKey }: { streamKey: string; }) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    obsClient.sendRequest(createMessage("stream", "start"));
}

function onStreamDelete({ streamKey }: { streamKey: string; }) {
    const myId = UserStore.getCurrentUser().id;

    if (!streamKey.endsWith(myId)) return;

    obsClient.sendRequest(createMessage("stream", "stop"));
}

function onMuteStatusChange() {
    const chanId = SelectedChannelStore.getVoiceChannelId();
    if (!chanId) return;

    const state = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;
    const isMuted = state.mute || state.selfMute;
    const isDeafened = state.deaf || state.selfDeaf;

    obsClient.sendRequest(createMessage("mute", !isMuted ? "on" : "off"));

    if (!isMuted || !isDeafened) return;

    obsClient.sendRequest(createMessage("deaf", "off"));
}

function onDeafStatusChange() {
    const chanId = SelectedChannelStore.getVoiceChannelId();
    if (!chanId) return;

    const state = VoiceStateStore.getVoiceStateForChannel(chanId) as VoiceState;
    const isDeafened = state.deaf || state.selfDeaf;

    obsClient.sendRequest(createMessage("deaf", !isDeafened ? "on" : "off"));
}
