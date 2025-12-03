// Utilities for Oracle Cloud Extension

export default function removeHeader() {
    const bannerCheckIntervalMs = 200;
    // Oracle banner
    let banner, lookForInterval = setInterval((() => { banner ? (clearInterval(lookForInterval), banner.remove()) : banner = document.querySelectorAll('div:has(>table[role=presentation])')?.[0] || document.querySelector('.oj-sp-banner-container.oj-sp-banner-layout.oj-private-scale-lg.oj-sp-common-banner-content-layout') }), bannerCheckIntervalMs);
}
