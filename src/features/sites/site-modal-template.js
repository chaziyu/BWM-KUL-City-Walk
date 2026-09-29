export function createSiteModalTemplate() {
  return `<div id="siteModal" class="classic-modal-backdrop fixed inset-0 hidden" role="dialog" aria-modal="true" aria-labelledby="siteModalTitle">
        <div class="classic-modal-content site-sheet animate-fade-scale">
            <div class="site-sheet__media">
                <img id="siteModalImage" src="" alt="Heritage site">
                <button id="closeSiteModal" aria-label="Close site details" class="ui-icon-button site-sheet__close">×</button>
            </div>

            <div class="site-sheet__body">
                <div class="site-sheet__heading">
                    <span id="siteModalLabel" class="ui-kicker"></span>
                    <h2 id="siteModalTitle" class="ui-title">Site Title</h2>
                </div>

                <div class="text-size-controls" aria-label="Text size">
                    <button id="btnTextSizeSmall" type="button">A−</button>
                    <button id="btnTextSizeReset" type="button">Reset</button>
                    <button id="btnTextSizeLarge" type="button">A+</button>
                </div>

                <p id="siteModalInfo" class="site-sheet__intro">Site info loading...</p>

                <div id="siteModalMore" class="site-more">
                    <button id="siteModalMoreBtn" class="ui-button ui-button--quiet site-more__toggle">More information</button>
                    <div id="siteModalMoreContent" class="site-more__content hidden whitespace-pre-line"></div>
                </div>

                <button id="siteModalCheckInBtn" class="ui-button ui-button--primary">
                    Check in to this site
                </button>

                <button id="siteModalSolveChallengeBtn" class="ui-button ui-button--secondary hidden">
                    Solve daily challenge
                </button>

                <div class="site-action-grid">
                    <button id="siteModalDirections" class="ui-button ui-button--secondary">Directions</button>
                    <button id="siteModalAskAI" class="ui-button ui-button--secondary">Ask AI</button>
                    <button id="siteModalFoodBtn" type="button" class="ui-button ui-button--secondary">Food nearby</button>
                    <button id="siteModalHotelBtn" type="button" class="ui-button ui-button--secondary">Hotels nearby</button>
                </div>

                <div id="siteModalQuizArea" class="site-quiz">
                    <p class="ui-kicker">Quick quiz</p>
                    <p id="siteModalQuizQ" class="site-quiz__question">Question loading...</p>
                    <div id="siteModalQuizOptions" class="grid grid-cols-1 gap-2"></div>
                    <p id="siteModalHintText" class="site-quiz__hint hidden"></p>
                    <p id="siteModalQuizResult" class="site-quiz__result"></p>
                </div>
            </div>
        </div>
    </div>`;
}
