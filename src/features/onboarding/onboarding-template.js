export function createOnboardingTemplate() {
  return `<div id="welcomeModal" class="classic-modal-backdrop fixed inset-0 z-[9000] flex hidden" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle">
        <div class="classic-modal-content p-6 text-center animate-fade-scale">
            <h2 id="welcomeTitle" class="text-2xl font-bold text-gray-800 mb-3">Welcome to BWM KUL City Walk!</h2>
            <p class="text-gray-600 mb-6">Explore the 24 pins to discover the city's history. Collect all 11 stamps from
                the main sites to complete your passport!</p>
            <button id="closeWelcomeModal" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg">Start
                Exploring</button>
        </div>
    </div>
<div id="userGuideModal" class="classic-modal-backdrop fixed inset-0 z-[9000] flex hidden" role="dialog" aria-modal="true" aria-labelledby="userGuideTitle">
        <div class="classic-modal-content p-6 animate-fade-scale max-h-[85vh] overflow-y-auto">
            <button id="closeUserGuideModal" aria-label="Close user guide" class="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl transition">×</button>
            <div class="text-center mb-4">
                <div class="text-5xl mb-3">📖</div>
                <h2 id="userGuideTitle" class="text-2xl font-bold text-gray-800 mb-2">How to Use This App</h2>
            </div>

            <div class="text-left space-y-4 text-gray-700">
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <h3 class="font-bold text-blue-900 mb-2">📍 What is BWM KUL City Walk?</h3>
                    <p class="text-sm">An interactive heritage trail that guides you through 11 historic sites in Kuala
                        Lumpur. Collect stamps, learn history, and explore KL's architectural gems!</p>
                </div>

                <div>
                    <h3 class="font-bold text-gray-900 mb-2">🔑 How to Get Started</h3>
                    <ol class="list-decimal list-inside text-sm space-y-2 ml-2">
                        <li><strong>Explore Demo:</strong> Click "Explore Demo" to try the full heritage trail instantly
                        </li>
                        <li><strong>Visitor Passkey:</strong> Event participants can enter an organiser-issued visitor
                            passkey</li>
                        <li><strong>Start Exploring:</strong> The interactive map will open, showing all heritage sites
                        </li>
                    </ol>
                </div>

                <div>
                    <h3 class="font-bold text-gray-900 mb-2">🎮 Key Features</h3>
                    <ul class="text-sm space-y-2">
                        <li><strong>🗺️ Interactive Map:</strong> Tap any site marker to learn its history</li>
                        <li><strong>📖 Digital Passport:</strong> Answer quiz questions to collect stamps</li>
                        <li><strong>💬 AI Tour Guide:</strong> Ask questions about the sites</li>
                        <li><strong>📍 GPS Navigation:</strong> Get walking directions to each site</li>
                        <li><strong>🏆 Daily Challenge:</strong> Solve riddles to discover mystery locations</li>
                        <li><strong>🎓 Explorer Badge:</strong> Download your personalized completion certificate</li>
                    </ul>
                </div>

                <div>
                    <h3 class="font-bold text-gray-900 mb-2">❓ Need Help While Exploring?</h3>
                    <p class="text-sm">Look for the purple <strong>?</strong> button in the bottom-right corner after
                        login. It provides a quick interactive tour of all features!</p>
                </div>

                <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <h3 class="font-bold text-green-900 mb-2">💡 Pro Tip</h3>
                    <p class="text-sm">The app works best outdoors with GPS enabled. Make sure location services are
                        turned on for the best experience!</p>
                </div>
            </div>

            <button id="closeUserGuideModalBtn" class="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg">
                Got it, Let's Start!
            </button>
        </div>
    </div>`;
}
