const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;
const NANOS_PER_SECOND = BigInt(1_000_000_000);
const NANOS_PER_MINUTE = NANOS_PER_SECOND * BigInt(SECONDS_PER_MINUTE);
const NANOS_PER_HOUR = NANOS_PER_MINUTE * BigInt(MINUTES_PER_HOUR);
const NANOS_PER_DAY = NANOS_PER_HOUR * BigInt(HOURS_PER_DAY);
const ZERO = BigInt(0);

/**
 * The pattern for parsing.
 */
const PATTERN = /([-+]?)P(?:([-+]?\d+)D)?(T(?:([-+]?\d+)H)?(?:([-+]?\d+)M)?(?:([-+]?\d+)(?:[.,](\d{0,9}))?S)?)?/i;

export function parse(text: string): bigint {

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
            if (dayMatch !== undefined || hourMatch !== undefined || minuteMatch !== undefined || secondMatch !== undefined) {
                const daysAsSecs = _parseNumber(dayMatch, SECONDS_PER_DAY);
                const hoursAsSecs = _parseNumber(hourMatch, SECONDS_PER_HOUR);
                const minsAsSecs = _parseNumber(minuteMatch, SECONDS_PER_MINUTE);
                const seconds = _parseNumber(secondMatch, 1);
                const negativeSecs = secondMatch?.startsWith('-');
                const nanos = _parseFraction(fractionMatch, negativeSecs ? -1 : 1) + NANOS_PER_SECOND * (daysAsSecs + hoursAsSecs + minsAsSecs + seconds);

                return negate ? -nanos : nanos;
            }
        }
    }
    throw new Error(`Text cannot be parsed to a Duration: ${text}`);
}

function _parseNumber(parsed: string, multiplier: number): bigint {
    // regex limits to [-+]?\d+
    if (parsed === undefined) {
        return ZERO;
    }
    if (parsed.startsWith('+')) {
        parsed = parsed.substring(1);
    }
    return BigInt(parseFloat(parsed) * multiplier);
}

function _parseFraction(parsed: string, negate: number): bigint {
    // regex limits to \d{0,9}
    if (parsed === undefined || parsed.length === 0) {
        return ZERO;
    }
    parsed = parsed.padEnd(9, '0');
    return BigInt(parseFloat(parsed) * negate);
}

export function serialize(value: bigint) {
    if (value === ZERO) {
        return 'PT0S';
    }

    let nanos = value;

    const days = nanos / NANOS_PER_DAY;
    nanos %= NANOS_PER_DAY;

    const hours = nanos / NANOS_PER_HOUR;
    nanos %= NANOS_PER_HOUR;

    const minutes = nanos / NANOS_PER_MINUTE;
    nanos %= NANOS_PER_MINUTE;

    const secs = nanos / NANOS_PER_SECOND;
    nanos %= NANOS_PER_SECOND;

    let rval = 'P';
    if (days !== ZERO) {
        rval += `${days}D`;
    }
    rval += 'T';
    if (hours !== ZERO) {
        rval += `${hours}H`;
    }
    if (minutes !== ZERO) {
        rval += `${minutes}M`;
    }
    if (secs === ZERO && nanos === ZERO && rval.length > 2) {
        return rval;
    }
    if (secs < ZERO || nanos < ZERO) {
        rval += '-' + (secs < ZERO ? -secs : secs);
    } else {
        rval += secs;
    }
    if (nanos !== ZERO) {
        rval += '.';
        let nanoString: string;
        if (nanos < ZERO) {
            nanoString = '00000000' + (-nanos).toString();
        } else {
            nanoString = '00000000' + nanos.toString();
        }
        // remove the leading '1'
        nanoString = nanoString.slice(nanoString.length - 9, nanoString.length);
        rval += nanoString;
        while (rval.endsWith('0')) {
            rval = rval.slice(0, rval.length - 1);
        }
    }
    rval += 'S';
    return rval;
}
