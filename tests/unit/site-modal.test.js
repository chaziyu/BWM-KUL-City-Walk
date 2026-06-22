/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createSiteModalController } from '../../src/features/sites/site-modal.js';

describe('Site Modal Logic', () => {
  it('displays correct content for a given site', () => {
    document.body.innerHTML = `
      <div id="modal"></div>
      <img id="image">
      <span id="label"></span>
      <h2 id="title"></h2>
      <p id="info"></p>
      <div id="quizArea"></div>
      <p id="quizQuestion"></p>
      <div id="quizOptions"></div>
      <p id="quizResult"></p>
      <button id="close"></button>
      <button id="askAI"></button>
      <button id="directions"></button>
      <button id="checkIn"></button>
      <button id="solveChallenge"></button>
      <div id="more"></div>
      <button id="moreButton"></button>
      <div id="moreContent"></div>
      <a id="food"></a>
      <a id="hotel"></a>
      <p id="hintText"></p>
    `;

    const controller = createSiteModalController({
      actions: {
        askAI: vi.fn(),
        checkIn: vi.fn(),
        openDirections: vi.fn(),
        openFood: vi.fn(),
        openHotels: vi.fn(),
      },
      progressService: { getDiscoveredSites: () => [] },
      modalManager: { close: vi.fn(), open: vi.fn() },
    });

    controller.bind({
      modal: document.getElementById('modal'),
      image: document.getElementById('image'),
      label: document.getElementById('label'),
      title: document.getElementById('title'),
      info: document.getElementById('info'),
      quizArea: document.getElementById('quizArea'),
      quizQuestion: document.getElementById('quizQuestion'),
      quizOptions: document.getElementById('quizOptions'),
      quizResult: document.getElementById('quizResult'),
      closeButton: document.getElementById('close'),
      askAI: document.getElementById('askAI'),
      directions: document.getElementById('directions'),
      checkIn: document.getElementById('checkIn'),
      solveChallenge: document.getElementById('solveChallenge'),
      more: document.getElementById('more'),
      moreButton: document.getElementById('moreButton'),
      moreContent: document.getElementById('moreContent'),
      food: document.getElementById('food'),
      hotel: document.getElementById('hotel'),
      hintText: document.getElementById('hintText'),
    });

    controller.render({
      id: '1',
      name: 'Sultan Abdul Samad Building',
      info: 'Merdeka Square landmark',
      image: '/site.jpg',
      category: 'must_visit',
      quiz: { question: 'Built in?', options: ['1897'], answer: '1897' },
      coordinates: { marker: [3, 101] },
    });

    expect(document.getElementById('title').textContent).toBe('Sultan Abdul Samad Building');
    expect(document.getElementById('info').textContent).toBe('Merdeka Square landmark');
  });

  it('keeps recommended check-in button layout classes', () => {
    document.body.innerHTML = `
      <div id="modal"></div>
      <img id="image">
      <span id="label"></span>
      <h2 id="title"></h2>
      <p id="info"></p>
      <div id="quizArea"></div>
      <p id="quizQuestion"></p>
      <div id="quizOptions"></div>
      <p id="quizResult"></p>
      <button id="close"></button>
      <button id="askAI"></button>
      <button id="directions"></button>
      <button id="checkIn"></button>
      <button id="solveChallenge"></button>
      <div id="more"></div>
      <button id="moreButton"></button>
      <div id="moreContent"></div>
      <a id="food"></a>
      <a id="hotel"></a>
      <p id="hintText"></p>
    `;

    const controller = createSiteModalController({
      actions: {
        askAI: vi.fn(),
        checkIn: vi.fn(),
        openDirections: vi.fn(),
        openFood: vi.fn(),
        openHotels: vi.fn(),
      },
      progressService: { getDiscoveredSites: () => [] },
      modalManager: { close: vi.fn(), open: vi.fn() },
    });

    controller.bind({
      modal: document.getElementById('modal'),
      image: document.getElementById('image'),
      label: document.getElementById('label'),
      title: document.getElementById('title'),
      info: document.getElementById('info'),
      quizArea: document.getElementById('quizArea'),
      quizQuestion: document.getElementById('quizQuestion'),
      quizOptions: document.getElementById('quizOptions'),
      quizResult: document.getElementById('quizResult'),
      closeButton: document.getElementById('close'),
      askAI: document.getElementById('askAI'),
      directions: document.getElementById('directions'),
      checkIn: document.getElementById('checkIn'),
      solveChallenge: document.getElementById('solveChallenge'),
      more: document.getElementById('more'),
      moreButton: document.getElementById('moreButton'),
      moreContent: document.getElementById('moreContent'),
      food: document.getElementById('food'),
      hotel: document.getElementById('hotel'),
      hintText: document.getElementById('hintText'),
    });

    controller.render({
      id: 'R1',
      name: 'Recommended Site',
      info: 'Info',
      coordinates: { marker: [3, 101] },
    });

    expect(document.getElementById('checkIn').className).toContain('w-full');
    expect(document.getElementById('checkIn').className).toContain('rounded-lg');
  });
});
