"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyMapsLink = safetyMapsLink;
exports.safeWalkStartSms = safeWalkStartSms;
exports.safeWalkArrivalText = safeWalkArrivalText;
function safetyMapsLink(latitude, longitude) {
    return `https://maps.google.com/?q=${latitude},${longitude}`;
}
function safeWalkStartSms(input) {
    const who = input.walkerName?.trim() || "Someone you trust";
    return (`${who} started a Safe Walk. Last known location: ` +
        `${safetyMapsLink(input.latitude, input.longitude)}. You'll receive another ` +
        `message on arrival or if a safety check-in fails.`);
}
function safeWalkArrivalText(walkerName) {
    return `${walkerName?.trim() || "Someone you trust"} arrived safely.`;
}
