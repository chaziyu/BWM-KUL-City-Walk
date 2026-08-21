export function createLandingTemplate() {
  return `<div id="landing-page" class="fixed inset-0 bg-white z-[6000] flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto">
        <div class="w-full max-w-sm flex flex-col items-center text-center">
            
            <!-- Branding / Title -->
            <div class="w-full text-center mb-8 animate-fade-in">
                <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight leading-tight">
                    BWM KUL City Walk
                </h1>
                <p class="text-xs sm:text-sm text-gray-500 uppercase tracking-widest px-2">
                    Discover Kuala Lumpur's Heritage Buildings
                </p>
            </div>

            <!-- Buttons Section -->
            <div class="w-full space-y-3 sm:space-y-4 animate-slide-up">
                <button id="btnExploreDemo" class="w-full group relative flex flex-col justify-center items-center py-3.5 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95">
                    <span class="flex items-center justify-center"><span class="mr-2 sm:mr-3 text-lg sm:text-xl">▶</span><span>Explore Demo</span></span>
                    <span class="text-[11px] sm:text-xs font-medium text-gray-300 mt-1">Try the full heritage trail instantly</span>
                </button>
                <div class="prototype-notice text-left">
                    <strong>Prototype notice:</strong>
                    This project was developed for Badan Warisan Malaysia.
                </div>
            </div>

            <!-- Bottom Section -->
            <div class="w-full mt-8 space-y-3 pb-6 sm:pb-8">
                <button id="btnPreLoginHelp" class="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 border border-gray-300 text-xs sm:text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95">
                    <span class="mr-2">ℹ️</span>
                    <span>How to Use This App</span>
                </button>
                <p class="text-xs text-gray-500 animate-fade-in text-center leading-relaxed">
                    A SULAM Project by Universiti Malaya &amp; BWM
                </p>
            </div>
            
        </div>
    </div>`;
}
