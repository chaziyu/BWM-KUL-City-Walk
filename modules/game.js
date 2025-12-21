import { STRINGS } from '../localization.js';
import { visitedSites, discoveredSites, solvedRiddle, addVisitedSite, addDiscoveredSite, saveSolvedRiddle } from './state.js';
import { allMarkers, safelyUpdateMarkerVisitedState, safelyUpdatePolygonVisitedState, getSites } from './map.js';
import { animateOpenModal } from './ui.js';
import { CONFETTI } from './utils.js';

// --- DAILY RIDDLE DATABASE ---
export const allRiddles = [
    { q: "My 41-meter clock tower houses a one-ton bell that first chimed for Queen Victoria's birthday. What am I?", a: "1" },
    { q: "I was designed by A.B. Hubback to perfectly match my famous neighbor, the Sultan Abdul Samad Building.", a: "2" },
    { q: "I am a 6-storey Art Deco building named after a famous tin tycoon, Loke Yew.", a: "3" },
    { q: "I sit at the 'muddy confluence' of two rivers, the very birthplace of Kuala Lumpur.", a: "4" },
    { q: "My Art Deco clock tower was built in 1937 to commemorate the coronation of King George VI.", a: "5" },
    { q: "I am KL's oldest Chinese temple, and I am uniquely angled to follow Feng Shui principles.", a: "6" },
    { q: "I am an unusual triangular building with no 'five-foot way' and whimsical garlic-shaped finials on my roof.", a: "7" },
    { q: "In 1932, I was the tallest building in KL, standing at 85 feet. I also housed Radio Malaya.", a: "9" },
    { q: "My prayer services are held in both Arabic and Tamil, a unique feature for a mosque in this area.", a: "11" },
    { q: "I am Malaysia's oldest existing jewellers, founded by a man who was shipwrecked!", a: "12" },
    { q: "I was KL's only theatre, but I was heavily damaged by a major fire in the 1980s.", a: "13" }
];

export let currentModalSite = null;
export let currentModalMarker = null;

export function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

export function handleMarkerClick(site, marker) {
    const siteModal = document.getElementById('siteModal');
    if (!siteModal) {
        console.error("Site modal is not initialized!");
        return;
    }

    currentModalSite = site;
    currentModalMarker = marker;

    // --- DOM Elements ---
    const siteModalTitle = document.getElementById('siteModalTitle');
    const siteModalInfo = document.getElementById('siteModalInfo');
    const siteModalImage = document.getElementById('siteModalImage');
    const siteModalLabel = document.getElementById('siteModalLabel');
    const siteModalQuizArea = document.getElementById('siteModalQuizArea');
    const siteModalCheckInBtn = document.getElementById('siteModalCheckInBtn');
    const siteModalSolveChallengeBtn = document.getElementById('siteModalSolveChallengeBtn');
    const siteModalDirections = document.getElementById('siteModalDirections');
    const siteModalAskAI = document.getElementById('siteModalAskAI');

    const siteModalQuizQ = document.getElementById('siteModalQuizQ');
    const siteModalQuizResult = document.getElementById('siteModalQuizResult');
    const siteModalHintText = document.getElementById('siteModalHintText');
    const siteModalQuizOptions = document.getElementById('siteModalQuizOptions');

    // --- STAGGERED ENTRANCE RESET ---
    const elementsToStagger = [
        siteModalTitle,
        siteModalInfo,
        document.getElementById('siteModalMore'),
        siteModalCheckInBtn,
        siteModalSolveChallengeBtn,
        document.querySelector('#siteModal .flex.gap-2'),
        document.querySelectorAll('#siteModal .flex.gap-2')[1]
    ];

    elementsToStagger.forEach((el, index) => {
        if (!el) return;
        if (el instanceof NodeList) {
            el.forEach(subEl => {
                subEl.classList.remove('animate-staggered');
                subEl.style.opacity = '0';
                void subEl.offsetWidth;
                subEl.classList.add('animate-staggered');
                subEl.style.animationDelay = `${0.1 + (index * 0.1)}s`;
            });
        } else {
            el.classList.remove('animate-staggered');
            el.style.opacity = '0';
            void el.offsetWidth;
            el.classList.add('animate-staggered');
            el.style.animationDelay = `${0.1 + (index * 0.1)}s`;
        }
    });

    // 1. Basic Site Info
    siteModalLabel.textContent = site.id ? `${site.id}.` : "";
    siteModalTitle.textContent = site.name;
    siteModalInfo.textContent = site.info;
    siteModalImage.src = site.image || 'https://placehold.co/600x400/eee/ccc?text=Site+Image';

    // 2. MORE INFO SECTION
    setupMoreInfo(site);

    // 3. ACTIONS
    if (siteModalDirections) siteModalDirections.style.display = 'block';
    if (siteModalAskAI) siteModalAskAI.style.display = 'block';

    // 4. QUIZ & CHECK-IN LOGIC
    const isMainSite = site.quiz && !isNaN(parseInt(site.id));

    if (isMainSite) {
        if (siteModalQuizArea) siteModalQuizArea.style.display = 'block';
        if (siteModalCheckInBtn) siteModalCheckInBtn.style.display = 'none';

        siteModalQuizQ.textContent = site.quiz.q;
        siteModalQuizResult.classList.add('hidden');
        siteModalHintText.textContent = site.quiz.hint || "Try again!";
        siteModalHintText.classList.add('hidden');
        siteModalQuizOptions.innerHTML = '';

        let options = site.quiz.options ? [...site.quiz.options] : [site.quiz.a];
        options.sort(() => Math.random() - 0.5);

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = "w-full bg-white text-gray-800 font-bold py-3 px-4 rounded-lg border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-400 transition text-center shadow-sm";
            btn.textContent = opt;

            btn.onclick = () => {
                if (opt === site.quiz.a) {
                    // CORRECT
                    siteModalQuizResult.textContent = STRINGS.game.quizCorrect;
                    siteModalQuizResult.className = "text-sm mt-2 text-center font-bold text-green-600";
                    siteModalQuizResult.classList.remove('hidden');
                    btn.classList.remove('bg-white', 'border-gray-200', 'hover:bg-blue-50', 'hover:border-blue-400');
                    btn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');

                    const allBtns = siteModalQuizOptions.querySelectorAll('button');
                    allBtns.forEach(b => b.disabled = true);

                    if (addVisitedSite(site.id)) {
                        const markerToUpdate = allMarkers[site.id];
                        safelyUpdateMarkerVisitedState(markerToUpdate, true);
                        safelyUpdatePolygonVisitedState(site.id, true);

                        // Trigger global update (progress bar etc) - maybe dispatch event?
                        document.dispatchEvent(new CustomEvent('site-visited'));
                        updatePassport(); // Update passport when visited

                        const chaChingSound = document.getElementById('chaChingSound');
                        if (chaChingSound) chaChingSound.play();

                        if (visitedSites.length === 11) { // Hardcoded total sites for now
                            document.getElementById('congratsModal').classList.remove('hidden');
                            if (typeof confetti === 'function') {
                                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                            }
                        }
                    }
                } else {
                    // WRONG
                    siteModalQuizResult.textContent = STRINGS.game.quizWrong;
                    siteModalQuizResult.className = "text-sm mt-2 text-center font-bold text-red-600";
                    siteModalQuizResult.classList.remove('hidden');
                    btn.classList.add('bg-red-50', 'border-red-300');
                    setTimeout(() => btn.classList.remove('bg-red-50', 'border-red-300'), 500);
                    siteModalHintText.classList.remove('hidden');
                }
            };
            siteModalQuizOptions.appendChild(btn);
        });

    } else {
        if (siteModalQuizArea) siteModalQuizArea.style.display = 'none';
        if (siteModalCheckInBtn) siteModalCheckInBtn.style.display = 'block';

        if (discoveredSites.includes(site.id)) {
            siteModalCheckInBtn.disabled = true;
            siteModalCheckInBtn.textContent = 'Visited';
            siteModalCheckInBtn.classList.remove('bg-purple-700', 'hover:bg-purple-800', 'text-white');
            siteModalCheckInBtn.classList.add('bg-gray-300', 'text-gray-600', 'cursor-not-allowed');
        } else {
            siteModalCheckInBtn.disabled = false;
            siteModalCheckInBtn.textContent = 'Check In to this Site';
            siteModalCheckInBtn.classList.remove('bg-gray-300', 'text-gray-600', 'cursor-not-allowed', 'bg-gray-400');
            siteModalCheckInBtn.classList.add('bg-purple-700', 'hover:bg-purple-800', 'text-white');
        }
    }

    // 5. DAILY CHALLENGE LOGIC
    const todayRiddle = allRiddles[getDayOfYear() % allRiddles.length];
    if (solvedRiddle.day !== getDayOfYear() && site.id === todayRiddle.a) {
        if (siteModalSolveChallengeBtn) siteModalSolveChallengeBtn.style.display = 'block';
    } else {
        if (siteModalSolveChallengeBtn) siteModalSolveChallengeBtn.style.display = 'none';
    }

    animateOpenModal(siteModal);
}

function setupMoreInfo(site) {
    const siteModalMore = document.getElementById('siteModalMore');
    const siteModalMoreBtn = document.getElementById('siteModalMoreBtn');
    const siteModalMoreContent = document.getElementById('siteModalMoreContent');

    if (siteModalMore && siteModalMoreBtn && siteModalMoreContent) {
        const bwImageHtml = (site.flyer_image && site.flyer_image.trim() !== "")
            ? `<img src="${site.flyer_image}" class="w-full h-auto rounded-lg mb-4 shadow-md border border-gray-200" alt="Historical view">`
            : "";
        const flyerTextHtml = site.flyer_text
            ? `<p class="text-gray-700 mb-4">${site.flyer_text}</p>`
            : "";

        let faqHtml = "";
        if (site.faq) {
            faqHtml = `
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <h4 class="font-bold text-gray-900 text-sm">📍 Visitor Quick Facts</h4>
                    <ul class="text-sm text-gray-700">
                        <li><strong>🕒 Hours:</strong> ${site.faq.opening_hours || 'Exterior view 24/7'}</li>
                        <li><strong>🎟️ Fee:</strong> ${site.faq.ticket_fee || 'Free Admission'}</li>
                        <li><strong>💡 Tip:</strong> ${site.faq.tips || 'Great for photography!'}</li>
                    </ul>
                </div>
            `;
        }

        siteModalMoreContent.innerHTML = `${bwImageHtml}${flyerTextHtml}${faqHtml}`;
        siteModalMoreContent.classList.add('hidden');
        siteModalMoreBtn.textContent = 'More info';

        const hasExtraInfo = bwImageHtml || flyerTextHtml || faqHtml;
        siteModalMore.style.display = hasExtraInfo ? 'block' : 'none';

        siteModalMoreBtn.onclick = () => {
            const isHidden = siteModalMoreContent.classList.contains('hidden');
            if (isHidden) {
                siteModalMoreContent.classList.remove('hidden');
                siteModalMoreBtn.textContent = 'Hide info';
            } else {
                siteModalMoreContent.classList.add('hidden');
                siteModalMoreBtn.textContent = 'More info';
            }
        };
    }
}

export function handleCheckIn() {
    if (!currentModalSite) return;

    if (addDiscoveredSite(currentModalSite.id)) {
        const markerToUpdate = allMarkers[currentModalSite.id];
        safelyUpdateMarkerVisitedState(markerToUpdate, true);
        safelyUpdatePolygonVisitedState(currentModalSite.id, true);

        // Sound logic
        if (/^[A-K]$/.test(currentModalSite.id)) {
            const soundEffect2 = document.getElementById('soundEffect2');
            if (soundEffect2) {
                soundEffect2.currentTime = 0;
                soundEffect2.play().catch(e => console.log("Audio play failed:", e));
            }
        }

        const siteModalCheckInBtn = document.getElementById('siteModalCheckInBtn');
        if (siteModalCheckInBtn) {
            siteModalCheckInBtn.disabled = true;
            siteModalCheckInBtn.textContent = STRINGS.game.visitedBtn;
            siteModalCheckInBtn.classList.add('bg-gray-300', 'text-gray-600', 'cursor-not-allowed');
            siteModalCheckInBtn.classList.remove('bg-purple-700', 'hover:bg-purple-800', 'text-white');
        }
    }
}

export function updatePassport() {
    const sites = getSites();
    if (!sites || sites.length === 0) return;

    const passportGrid = document.getElementById('passportGrid');
    const passportProgress = document.getElementById('passportProgress');
    const completionMessage = document.getElementById('completionMessage');

    if (!passportGrid) return;

    passportGrid.innerHTML = '';
    const mainSites = sites.filter(s => /^\d+$/.test(s.id)).sort((a, b) => parseInt(a.id) - parseInt(b.id));

    let visitedCount = 0;

    mainSites.forEach(site => {
        const isVisited = visitedSites.includes(site.id);
        if (isVisited) visitedCount++;

        const stamp = document.createElement('div');
        stamp.className = `aspect-square rounded-full flex items-center justify-center border-4 shadow-sm relative overflow-hidden transition-all duration-500 ${isVisited ? 'bg-indigo-100 border-indigo-500 rotate-0' : 'bg-gray-100 border-gray-300 opacity-50'}`;

        let content = '';
        if (isVisited) {
            content = `<span class="text-2xl font-black text-indigo-700 transform -rotate-12">${site.id}</span>`;
            const stampOverlay = document.createElement('div');
            stampOverlay.className = "absolute inset-0 border-[6px] border-double border-indigo-500/30 rounded-full";
            stamp.appendChild(stampOverlay);
        } else {
            content = `<span class="text-xl font-bold text-gray-400">${site.id}</span>`;
        }

        stamp.innerHTML += content;
        passportGrid.appendChild(stamp);
    });

    // Update Progress Bar/Text logic (simple version as elements are not always present/id might differ)
    const visitedCountEl = document.getElementById('visitedCount');
    if (visitedCountEl) visitedCountEl.textContent = visitedCount;
}
