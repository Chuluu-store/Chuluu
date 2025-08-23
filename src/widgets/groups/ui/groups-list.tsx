"use client";

import React from "react";
import { Plus } from "lucide-react";

import { GroupCard, type Group } from "../../../entities/group";
import { CreateGroupCard } from "../../../features/create-group";

interface GroupsListProps {
  groups: Group[];
  onCreateGroup: () => void;
  onGroupClick: (group: Group) => void;
}

export function GroupsList({
  groups,
  onCreateGroup,
  onGroupClick,
}: GroupsListProps) {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">
          내 그룹 ({groups.length})
        </h2>
        <button
          onClick={onCreateGroup}
          className="text-base text-stone-400 hover:text-white transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>새 그룹</span>
        </button>
      </div>

      <div className="grid gap-8">
        <CreateGroupCard onClick={onCreateGroup} />
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={() => onGroupClick(group)}
          />
        ))}
      </div>
    </div>
  );
}
