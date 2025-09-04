/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GuildMember } from "@vencord/discord-types";
import { GuildMemberStore, SelectedChannelStore } from "@webpack/common";

import { obsClient, settings } from "..";
import { RoleSetting, VoiceState } from "../types";
import { createMessage } from "../utils";
import { UserCheckStrategy } from "./userCheckStrategy";

export class RoleGroupCheck implements UserCheckStrategy {
    private activeGroupNames = new Set<string>();

    process(userIds: string[], guildId: string, stateUpdates?: VoiceState[]): void {
        const enabledGroupsNames = settings.store.guildRoleGroups.filter(role => !role.disabled).map(x => x.name);
        const mapRoles = this.mapRolesToGroupIds(settings.store.guildRoles.filter(role => !role.disabled && !role.deleted));

        const checkRoleGroup = this.getCheckRoleGroup(userIds, guildId);
        const checkStateUpdates = stateUpdates && this.getCheckStateUpdates(stateUpdates, guildId);

        enabledGroupsNames.forEach(group => {
            const roleIds = mapRoles[group];

            checkRoleGroup(group, roleIds);
            checkStateUpdates?.(group, roleIds);
        });
    }

    dispose(): void {
        if (this.activeGroupNames.size === 0) return;

        const enabledGroups = settings.store.guildRoleGroups.filter(group => !group.disabled);

        this.activeGroupNames.values()
            .map(x => enabledGroups.find(r => r.name === x))
            .forEach(x => obsClient.sendRequest(createMessage(x!.name, "leave")));

        this.activeGroupNames.clear();
    }

    getCheckRoleGroup(userIds: string[], guildId: string) {
        const guildMembers = userIds.map(x => GuildMemberStore.getMember(guildId, x)!);
        const currentRoles = new Set(guildMembers.flatMap(x => x.roles));

        return (groupName: string, roleIds: string[]) => {
            const isActive = this.activeGroupNames.has(groupName);
            const some = roleIds.some(id => currentRoles.has(id));

            if (some === isActive) return;

            const message = createMessage(groupName, !isActive ? "enter" : "leave");
            obsClient.sendRequest(message);

            const users = guildMembers.filter(x => roleIds.some(id => x.roles.includes(id)));
            obsClient.sendBrowserRequest(message, { users });

            !isActive ? this.activeGroupNames.add(groupName) : this.activeGroupNames.delete(groupName);
        };
    }

    getCheckStateUpdates(voiceStates: VoiceState[], guildId: string) {
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
            this.processRoleIdsUpdate(groupName, roleIds, joinedRoles, joinedUsers);
            this.processRoleIdsUpdate(groupName, roleIds, leftRoles, leftUsers);
        };
    }

    processRoleIdsUpdate(groupName: string, roleIds: string[], roleIdSet: Set<string>, members: GuildMember[]) {
        if (!roleIds.some(id => roleIdSet.has(id))) return;

        const users = members.filter(x => roleIds.some(id => x.roles.includes(id)));
        const message = createMessage(groupName, "user", "enter");

        obsClient.sendRequest(message);
        obsClient.sendBrowserRequest(message, { users });
    }

    mapRolesToGroupIds(roles: RoleSetting[]) {
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
}
