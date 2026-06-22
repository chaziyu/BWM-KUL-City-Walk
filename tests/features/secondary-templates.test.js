/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { createChatTemplate } from '../../src/features/chat/chat-template.js';
import { createChallengeTemplate } from '../../src/features/challenges/challenge-template.js';

describe('secondary feature templates', () => {
  it('renders chat without index.html', () => {
    document.body.innerHTML = createChatTemplate();
    expect(document.getElementById('btnChat')).toBeTruthy();
    expect(document.getElementById('chatModal')?.getAttribute('role')).toBe('dialog');
  });

  it('renders challenge without index.html', () => {
    document.body.innerHTML = createChallengeTemplate();
    expect(document.getElementById('btnChallenge')).toBeTruthy();
    expect(document.getElementById('challengeRiddle')?.textContent).toContain('Riddle loading');
  });
});
