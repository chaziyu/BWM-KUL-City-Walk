export function createAccessTemplate() {
  return `<div id="landing-page" class="fixed inset-0 bg-white z-[6000] grid grid-cols-1 lg:grid-cols-2 overflow-y-auto">

        <!-- Left Column: Branding / Hero Image -->
        <div class="hidden lg:flex flex-col justify-center items-center bg-indigo-50 p-12 animate-fade-in text-center">
            <h1 class="text-5xl lg:text-7xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                BWM KUL City Walk
            </h1>
            <p class="text-lg text-gray-600 uppercase tracking-widest">
                Discover Kuala Lumpur's Heritage Buildings
            </p>
        </div>

        <!-- Right Column: Interactive Elements & Buttons -->
        <div class="flex flex-col justify-center items-center p-6 sm:p-12">
            
            <!-- Mobile-only Title (hides on Desktop) -->
            <div class="lg:hidden w-full text-center mb-8 animate-fade-in">
                <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight leading-tight">
                    BWM KUL City Walk
                </h1>
                <p class="text-[10px] sm:text-xs md:text-sm text-gray-500 uppercase tracking-wider sm:tracking-widest px-4">
                    Discover Kuala Lumpur's Heritage Buildings
                </p>
            </div>

            <!-- Buttons Section -->
            <div class="w-full max-w-sm space-y-3 sm:space-y-4 animate-slide-up">
                <button id="btnExploreDemo" class="w-full group relative flex flex-col justify-center items-center py-3.5 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:scale-95">
                    <span class="flex items-center justify-center"><span class="mr-2 sm:mr-3 text-lg sm:text-xl">▶</span><span>Explore Demo</span></span>
                    <span class="text-[11px] sm:text-xs font-medium text-gray-300 mt-1">Try the full heritage trail
                        instantly</span>
                </button>
                <button id="btnVisitor" class="w-full group relative flex flex-col justify-center items-center py-3 sm:py-4 px-4 border-2 border-gray-900 text-sm sm:text-base font-bold rounded-xl text-gray-900 bg-white hover:bg-gray-50 transition-all active:scale-95">
                    <span class="flex items-center justify-center"><span class="mr-2 sm:mr-3 text-lg sm:text-xl">🗝️</span><span>Enter Visitor Passkey</span></span>
                    <span class="text-[11px] sm:text-xs font-medium text-gray-500 mt-1">For participants with an
                        organiser-issued code</span>
                </button>
                <button id="btnStaff" class="w-full flex flex-col justify-center items-center py-2.5 sm:py-3 px-4 border border-gray-200 text-xs sm:text-sm font-bold rounded-xl text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all active:scale-95">
                    <span class="flex items-center justify-center"><span class="mr-2">🧑‍💼</span><span>Project Admin
                            (Prototype)</span></span>
                    <span class="text-[10px] sm:text-xs font-medium text-gray-400 mt-1">View the proposed organiser passkey
                        workflow</span>
                </button>
                <div class="prototype-notice text-left">
                    <strong>Prototype notice:</strong>
                    This project was developed for Badan Warisan Malaysia. The Project Admin area demonstrates a proposed
                    organiser workflow and is not currently operated by Badan Warisan Malaysia.
                </div>
            </div>

            <!-- Bottom Section -->
            <div class="w-full max-w-sm mt-8 space-y-3 pb-6 sm:pb-8">
                <button id="btnPreLoginHelp" class="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 border border-gray-300 text-xs sm:text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95">
                    <span class="mr-2">ℹ️</span>
                    <span>How to Use This App</span>
                </button>
                <p class="text-[10px] sm:text-xs text-gray-400 animate-fade-in text-center leading-relaxed">
                    A SULAM Project by Universiti Malaya &amp; BWM
                </p>
            </div>
            
        </div>
    </div>
<div id="gatekeeper" class="fixed inset-0 bg-slate-900 z-[7000] hidden flex flex-col justify-center items-center p-4 transition-opacity duration-500">
        <div class="classic-modal-content p-6 md:p-8 max-w-sm w-full text-center relative animate-fade-scale">
            <button id="backToHome" class="absolute top-4 left-4 text-gray-400 hover:text-gray-800 text-sm font-medium transition-all duration-200">←
                Back</button>
            <div class="mb-4 mt-2 text-5xl">🔐</div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Visitor Access</h2>
            <p class="text-gray-600 mb-6 text-sm">Please enter the visitor passkey provided by the organiser.</p>
            <input type="text" id="passcodeInput" placeholder="e.g. AB-12345" class="w-full border-2 border-gray-200 p-3 rounded-lg mb-4 text-center text-lg uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-all duration-200 font-mono">
            <button id="unlockBtn" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg">Verify
                &amp; Unlock</button>
            <p id="errorMsg" class="text-red-500 text-sm mt-4 hidden font-bold">Invalid Passkey.</p>
        </div>
    </div>
<div id="platformWarningModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[8000] hidden flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="warningTitle">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-scale relative">
            <div class="text-center mb-4">
                <div id="warningIcon" class="text-6xl mb-3">⚠️</div>
                <h2 id="warningTitle" class="text-2xl font-bold text-gray-900 mb-2">Important Notice</h2>
            </div>

            <div id="warningContent" class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                <p class="text-sm text-gray-800 leading-relaxed"></p>
            </div>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                <p class="text-xs text-blue-900 font-semibold mb-2">🔒 Device Locking Explained:</p>
                <p class="text-xs text-gray-700">Your passkey will be locked to <strong>one platform only</strong>
                    (either PWA or Browser). This security feature prevents sharing passkeys across devices.</p>
            </div>

            <!-- Copy Passkey Section -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p class="text-xs text-gray-600 font-semibold mb-2">📋 Your Passkey:</p>
                <div class="flex gap-2">
                    <input id="passkeyDisplay" type="text" readonly="" class="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-center font-mono text-sm text-gray-800 font-bold uppercase tracking-widest">
                    <button id="copyPasskeyBtn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 font-semibold text-sm flex items-center gap-1 whitespace-nowrap">
                        <span>📋</span>
                        <span>Copy</span>
                    </button>
                </div>
                <p id="copySuccess" class="text-xs text-green-600 font-semibold mt-2 hidden">✓ Copied to clipboard!</p>
            </div>

            <div class="space-y-3">
                <button id="continueLoginBtn" class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg">
                    I Understand, Continue Login
                </button>
                <button id="cancelLoginBtn" class="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all duration-200">
                    Cancel
                </button>
                <button id="whatIsPWABtn" class="w-full bg-purple-50 text-purple-700 font-semibold py-2 rounded-xl hover:bg-purple-100 transition-all duration-200 border-2 border-purple-200 flex items-center justify-center gap-2">
                    <span>❓</span>
                    <span>What is PWA?</span>
                </button>
            </div>

            <p class="text-xs text-gray-500 text-center mt-4">💡 Tip: We recommend using PWA for the best experience</p>
        </div>
    </div>
<div id="staff-screen" class="fixed inset-0 classic-modal-backdrop fixed inset-0 z-[7000] hidden flex flex-col justify-center items-center p-4 sm:p-6 text-center transition-opacity duration-500">
        <div class="classic-modal-content p-6 md:p-8 max-w-sm w-full text-center relative text-gray-900 animate-fade-scale">
            <button id="closeStaffScreen" class="absolute top-4 left-4 text-gray-400 hover:text-gray-800 text-sm font-medium transition-all duration-200">←
                Back</button>
            <div class="mb-4 mt-2 text-5xl">🧑‍💼</div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Project Admin (Prototype)</h2>
            <p class="text-gray-600 mb-6 text-sm">Protected access for demonstrating the proposed organiser workflow.
            </p>
            <div id="adminLoginForm">
                <input type="password" id="adminPasswordInput" placeholder="Admin Password" class="w-full border-2 border-gray-200 p-3 rounded-lg mb-4 text-center focus:outline-none focus:border-blue-500 transition-all duration-200">
                <button id="adminLoginBtn" class="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg">Login</button>
                <p id="adminErrorMsg" class="text-red-500 text-sm mt-4 hidden font-bold">Wrong password.</p>
            </div>
            <div id="adminResult" class="hidden">
                <div class="prototype-notice mb-4 text-left">
                    <strong>Project Admin prototype:</strong>
                    This interface demonstrates the proposed organiser workflow for issuing visitor passkeys and
                    managing event access. It is maintained for project demonstration and is not currently operated by
                    Badan Warisan Malaysia.
                </div>
                <p class="text-gray-600 mb-2" id="passkeyDate"></p>
                <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-4 shadow-sm">
                    <p class="text-2xl font-bold font-mono text-blue-600 mb-1" id="passkeyResult">Click "Generate New
                        Passkey" to create a code</p>
                    <p id="adminStatusMsg" class="text-[10px] text-blue-400 font-bold uppercase tracking-widest hidden">
                        New Code Generated!</p>
                </div>

                <div class="space-y-3">
                    <button id="adminGenerateBtn" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-md flex items-center justify-center">
                        <span class="mr-2">🪄</span> Generate New Passkey
                    </button>
                    <button id="adminShareBtn" class="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-md hidden flex items-center justify-center">
                        <span class="mr-2">📧</span> Share via Email
                    </button>
                    <button id="adminSwitchToMapBtn" class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition shadow-md flex items-center justify-center">
                        <span class="mr-2">🗺️</span> Switch to Map
                    </button>
                    <button id="adminLogoutBtn" class="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center">
                        <span class="mr-2">🚪</span> Log Out
                    </button>
                </div>

                <div class="mt-6 border-t pt-4">
                    <p class="text-xs text-gray-500">To check your AI API usage and quota, log in to your Google Cloud
                        account and visit the dashboard:</p>
                    <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" class="text-xs text-blue-600 hover:underline">Google Cloud API Dashboard</a>
                </div>
            </div>
        </div>
    </div>`;
}





