export const STRINGS = {
    auth: {
        verifying: "Verifying...",
        verifyUnlock: "Verify & Unlock",
        invalidPasskey: "Invalid or expired passkey.",
        networkError: "Unable to connect to the server. Please check your internet connection.",
        login: "Login",
        getAccess: "Get Access",
        invalidAdmin: "Invalid Admin Password.",
        adminSuccess: "ACCESS GRANTED",
        adminDate: "Authenticated as Admin",
        adminGenerateBtn: "Generate New Passkey",
        adminShareBtn: "Share via Email",
        adminGenSuccess: "New Passkey Generated!",
        emailSubject: "Your BWM KUL City Walk Access Code",
        emailBody: "Hello!\n\nThank you for joining the BWM KUL City Walk. Here is your unique access code:\n\nCODE: [CODE]\n\nStart your journey here: https://bwm-kul-city-walk.vercel.app/\n\nEnjoy your walk!"
    },
    game: {
        progress: (visited, total) => `You have visited ${visited} of the ${total} heritage buildings in Kuala Lumpur!`,
        progressShort: (visited, total) => `${visited}/${total} Sites`,
        quizCorrect: "Correct! Well done!",
        quizWrong: "Not quite, try again!",
        challengeSolved: "You've already solved today's challenge. Well done!",
        challengeHint: "Find the heritage site that matches this riddle and click 'Solve Challenge' in its pop-up!",
        visitedBtn: "Visited",
        checkInBtn: "Check In to this Site",
        hideInfo: "Hide info",
        moreInfo: "More info",
        generatingBadge: "Generating...",
        generateBadge: "✨ Generate & Download ID",
        tryAgain: "Try Again",
        badgeError: "Could not generate badge. Please try again."
    },
    chat: {
        aiName: "AI Guide",
        userName: "You",
        error: "Sorry, I couldn't connect. Please try again.",
        limitReached: "You have reached your message limit for this session.",
        placeholder: "Ask a question..."
    },
    preview: {
        tapForDetails: "Tap for details"
    }
};
