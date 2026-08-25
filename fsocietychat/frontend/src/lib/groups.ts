import { API_URL } from './api';

export interface GroupPayload {
  name: string;
  members?: string[];
}

export async function fetchGroups(token: string) {
  const res = await fetch(`${API_URL}/api/groups`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function createGroup(payload: GroupPayload, token: string) {
  const res = await fetch(`${API_URL}/api/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create group');
  }
  return res.json();
}

export async function addMembers(groupId: string, members: string[], token: string) {
  const res = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ members }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add members');
  }
  return res.json();
}

export async function updateMembers(groupId: string, members: string[], token: string) {
  const res = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ members }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add members');
  }
  return res.json();
}
