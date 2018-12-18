const Apify = require('apify');
const request = require('request-promise');
const cheerio = require('cheerio');

/**
 * Helper function which writes provided message into console log and then
 * exists the process with failure code.
 *
 * @param {String} errorMessage Message to be written into console log
 */
function crash(errorMessage) {
    console.log(errorMessage);
    process.exit(1);
}

Apify.main(async () => {
    // Load query from input
    const input = await Apify.getValue('INPUT');
    if (!input) crash('Key-value store does not contain INPUT.');
    const { query } = input;
    if (!query || typeof query !== 'string') crash('Query loaded from INPUT is empty or not a string.');

    const commonHeaders = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    };

    /*
    const sessionLength = 8;
    const proxy = Apify.getApifyProxyUrl({
        session: `ks${Math.floor(Math.random() * (10 ** sessionLength)).toString().padStart(sessionLength, '0')}`,
    });
    */

    // Prepare cookie jar so that the second request contains cookies from the first one
    const cookieJar = request.jar();
    const preparedRequest = request.defaults({ jar: cookieJar });

    // Query the url and load csrf token from it
    const url = 'https://www.kickstarter.com/discover/advanced?ref=nav_search&result=all&term=game';
    const html = await preparedRequest({
        url,
        headers: { ...commonHeaders },
    });

    const $ = cheerio.load(html);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');

    if (!csrfToken) crash('Could not load CSRF token. Try again.');

    // Query the kickstarter location search page with the correct csrf token and cookies
    const response = await preparedRequest({
        url: `https://www.kickstarter.com/locations/search?searchable=true&term=${query}`,
        headers: {
            accept: 'application/json, text/javascript, */*; q=0.01',
            'accept-language': 'en;q=0.9',
            referer: url,
            'x-csrf-token': csrfToken,
            'x-requested-with': 'XMLHttpRequest',
        },
        json: true,
    });

    if (!response.locations) crash('Response does not contain locations. Try again.');

    // Parse the response and output it to console and key-value-store
    const places = response.locations.map((location) => ({
        id: location.id,
        name: location.displayable_name,
    }));

    console.log('Found places:');
    places.forEach((place, i) => {
        console.log(`${(i+1).toString().padStart(2, '0')}) ${place.id.toString().padStart(8, ' ')}: ${place.name}`);
    });

    if (response.total_hits > 10) console.log(`Found ${response.total_hits - 1} other locations, refine your search to get clearer results`);

    await Apify.setValue('OUTPUT', response);
});
