// Utilities for Oracle Cloud Extension

import { querySelectors } from './selectors.js';

export default function removeHeader() {
    const bannerCheckIntervalMs = 200;
    // Oracle banner
    let banner, lookForInterval = setInterval((() => {
        banner ? (clearInterval(lookForInterval), banner.remove()) : banner = querySelectors.query(querySelectors.banner);
    }), bannerCheckIntervalMs);
}
