import React from 'react';
import { ChevronRight, Sprout, UserRound } from 'lucide-react';

export const DEFAULT_PROFILES = [
  { id: 'brooke', name: 'Brooke', role: 'Director of Seed Acquisition', color: 'gold', initial: 'B', description: 'Keeper of the legendary seed book and co-conspirator in whatever gets planted next.' },
  { id: 'archie', name: 'Archie', role: 'Director of Dirt Operations', color: 'red', initial: 'A', description: 'Co-conspirator in watering, hauling, checking, harvesting, and keeping the operation moving.' },
];

export function ProfileChooser({ profiles = DEFAULT_PROFILES, onChoose }) {
  return <div className="profile-gate"><div className="profile-gate-card">
    <div className="profile-gate-mark"><Sprout /></div>
    <span className="section-kicker">THE RUNYAN GARDEN</span>
    <h1>Who’s in the garden?</h1>
    <p>One shared garden. Choose who is using this device so completed work lands in the right name.</p>
    <div className="profile-choice-list">{profiles.map((profile) => <button key={profile.id} onClick={() => onChoose(profile.id)}><ProfileAvatar profile={profile} /><span><strong>{profile.name}</strong><small>{profile.role}</small><em>{profile.description}</em></span><ChevronRight /></button>)}</div>
    <small className="profile-local-note">Both profiles share this device’s garden records. Cross-phone synchronization is the next infrastructure step.</small>
  </div></div>;
}

export function ProfileAvatar({ profile, small = false }) {
  return <span className={`runyan-avatar avatar-${profile.color || 'green'} ${small ? 'is-small' : ''}`}><UserRound /><b>{profile.initial || profile.name?.[0]}</b></span>;
}

export function ProfileSwitcher({ profiles = DEFAULT_PROFILES, activeId, onSwitch }) {
  return <section className="profile-switcher"><span className="section-kicker">WHO’S USING THE APP?</span><div className="profile-switch-grid">{profiles.map((profile) => <button key={profile.id} className={activeId === profile.id ? 'active' : ''} onClick={() => onSwitch(profile.id)}><ProfileAvatar profile={profile} small /><span><strong>{profile.name}</strong><small>{profile.role}</small></span>{activeId === profile.id && <span className="active-person-dot" />}</button>)}</div></section>;
}
