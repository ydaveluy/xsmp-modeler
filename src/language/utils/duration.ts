
/**
 * Hours per day.
 */
const HOURS_PER_DAY = BigInt(24);
/**
 * Minutes per hour.
 */
const MINUTES_PER_HOUR = BigInt(60);

/**
 * Seconds per minute.
 */
const SECONDS_PER_MINUTE = BigInt(60);
/**
 * Seconds per hour.
 */
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
/**
 * Seconds per day.
 */
const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;


/**
 * Nanos per second.
 */
const NANOS_PER_SECOND = BigInt(1000000000);
/**
 * Nanos per minute.
 */
const NANOS_PER_MINUTE = NANOS_PER_SECOND * SECONDS_PER_MINUTE;
/**
 * Nanos per hour.
 */
const NANOS_PER_HOUR = NANOS_PER_MINUTE * MINUTES_PER_HOUR;


export function parse(text: string): bigint {

    /**
     * The pattern for parsing.
     */
    const PATTERN = /([-+]?)P(?:([-+]?\d+)D)?(T(?:([-+]?\d+)H)?(?:([-+]?\d+)M)?(?:([-+]?\d+)(?:[.,](\d{0,9}))?S)?)?/i;
    const matches = PATTERN.exec(text);
    if (matches !== null) {
        // check for letter T but no time sections
        if ('T' === matches[3] === false) {
            const negate = '-' === matches[1];
            const dayMatch = matches[2];
            const hourMatch = matches[4];
            const minuteMatch = matches[5];
            const secondMatch = matches[6];
            const fractionMatch = matches[7];
            if (dayMatch != null || hourMatch != null || minuteMatch != null || secondMatch != null) {
                const daysAsSecs = _parseNumber(text, dayMatch, SECONDS_PER_DAY);
                const hoursAsSecs = _parseNumber(text, hourMatch, SECONDS_PER_HOUR);
                const minsAsSecs = _parseNumber(text, minuteMatch, SECONDS_PER_MINUTE);
                const seconds = _parseNumber(text, secondMatch, BigInt(1));
                const negativeSecs = secondMatch?.startsWith('-');
                const nanos = _parseFraction(text, fractionMatch, negativeSecs ? -1 : 1) + BigInt(NANOS_PER_SECOND) * (daysAsSecs + hoursAsSecs + minsAsSecs + seconds);

                return negate ? -nanos : nanos;
            }
        }
    }
    throw new Error(`Text cannot be parsed to a Duration: ${text}`);
}


function _parseNumber(text: string, parsed: string, multiplier: bigint): bigint {
    // regex limits to [-+]?\d+
    if (parsed == null) {
        return BigInt(0);
    }

    if (parsed.startsWith('+')) {
        parsed = parsed.substring(1);
    }
    return BigInt(parseFloat(parsed)) * BigInt(multiplier);

}

function _parseFraction(text: string, parsed: string, negate: number): bigint {
    // regex limits to \d{0,9}
    if (parsed == null || parsed.length === 0) {
        return BigInt(0);
    }
    parsed = (`${parsed}000000000`).substring(0, 9);
    return BigInt(parseFloat(parsed)) * BigInt(negate);
}

export function serialize(value: bigint) {
    if (value === BigInt(0)) {
        return 'PT0S';
    }

   let nanos = value;

    const hours = nanos / NANOS_PER_HOUR;
    nanos %= NANOS_PER_HOUR;

    const minutes = nanos / NANOS_PER_MINUTE;
    nanos %= NANOS_PER_MINUTE;

    const secs = nanos / NANOS_PER_SECOND;
    nanos %= NANOS_PER_SECOND;

    let rval = 'PT';
    if (hours !== BigInt(0)) {
        rval += `${hours}H`;
    }
    if (minutes !== BigInt(0)) {
        rval += `${minutes}M`;
    }
    if (secs === BigInt(0) && nanos === BigInt(0) && rval.length > 2) {
        return rval;
    }
    if (secs < 0 && nanos > BigInt(0)) {
        if (secs === BigInt(-1)) {
            rval += '-0';
        } else {
            rval += secs + BigInt(1);
        }
    } else {
        rval += secs;
    }
    if (nanos > BigInt(0)) {
        rval += '.';
        let nanoString;
        if (secs < BigInt(0)) {
            nanoString = `${BigInt(2) * NANOS_PER_SECOND - nanos}`;
        } else {
            nanoString = `${NANOS_PER_SECOND + nanos}`;
        }
        // remove the leading '1'
        nanoString = nanoString.slice(1, nanoString.length);
        rval += nanoString;
        while (rval.endsWith('0')) {
            rval = rval.slice(0, rval.length - 1);
        }
    }
    rval += 'S';
    return rval;
}
