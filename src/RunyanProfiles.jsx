import React from 'react';
import { ChevronRight, Crown, Sprout, UserRound } from 'lucide-react';

export const DEFAULT_PROFILES = [
  { id: 'brooke', name: 'Brooke', role: 'Garden planner', color: 'gold', initial: 'B', description: 'Plans crops, manages spaces, seeds, and seasonal decisions.' },
  { id: 'archie', name: 'Archie', role: 'Garden helper', color: 'red', initial: 'A', description: 'Completes care tasks, checks conditions, logs harvests, and adds notes.' },
];

export function ProfileChooser({ profiles = DEFAULT_PROFILES, onChoose }) {
  return <div className="profile-gate">
    <div className="profile-gate-card">
      <div className="profile-gate-mark"><Sprout /></div>
      <span className="section-kicker">THE GARDEN OF THE RUNYANS</span>
      <h1>Who’s in the garden?</h1>
      <p>Choose once on this device. You can switch people later from Profile.</p>
      <div className="profile-choice-list">
        {profiles.map((profile) => <button key={profile.id} onClick={() => onChoose(profile.id)}>
          <ProfileAvatar profile={profile} />
          <span><strong>{profile.name}</strong><small>{profile.role}</small><em>{profile.description}</em></span>
          <ChevronRight />
        </button>)}
      </div>
      <small className="profile-local-note">Both profiles currently share this device’s saved garden. Cross-phone synchronization comes with the cloud-sync step.</small>
    </div>
  </div>;
}

export function ProfileAvatar({ profile, small = false }) {
  return <span className={`runyan-avatar avatar-${profile.color || 'green'} ${small ? 'is-small' : ''}`}>
    {profile.role?.toLowerCase().includes('planner') ? <Crown /> : <UserRound />}
    <b>{profile.initial || profile.name?.[0]}</b>
  </span>;
}

export function ProfileSwitcher({ profiles = DEFAULT_PROFILES, activeId, onSwitch }) {
  return <section className="profile-switcher">
    <span className="section-kicker">CURRENT GARDENER</span>
    <div className="profile-switch-grid">
      {profiles.map((profile) => <button key={profile.id} className={activeId === profile.id ? 'active' : ''} onClick={() => onSwitch(profile.id)}>
        <ProfileAvatar profile={profile} small />
        <span><strong>{profile.name}</strong><small>{profile.role}</small></span>
        {activeId === profile.id && <span className="active-person-dot" />}
      </button>)}
    </div>
  </section>;
}
