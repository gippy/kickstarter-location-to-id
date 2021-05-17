/* eslint-disable linebreak-style */
const Apify = require('apify');

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
    let attempts = 20;
    let response;
    do {
        try {
            const proxyConfiguration = await Apify.createProxyConfiguration();
            // Query the kickstarter location search page
            console.log(`making request to https://www.kickstarter.com/locations/search?searchable=true&term=${query}`);
            const { body } = await Apify.utils.requestAsBrowser({
                url: `https://www.kickstarter.com/locations/search?searchable=true&term=${query}`,
                proxyUrl: proxyConfiguration.newUrl(),
                headers: {
                    // eslint-disable-next-line max-len
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
                    accept: 'application/json',
                    Connection: 'keep-alive',
                    'Accept-Encoding': 'gzip, deflate, br',
                },
            });
            response = JSON.parse(body);
            // console.info('response:');
            // console.dir(response);

            if (!response.locations) crash('Response does not contain locations. Try again.');

            // Parse the response and output it to console and key-value-store
            const places = response.locations.map((location) => ({
                id: location.id,
                name: location.displayable_name,
            }));

            console.log('Found places:');
            places.forEach((place, i) => {
                console.log(`${(i + 1).toString().padStart(2, '0')}) ${place.id.toString().padStart(8, ' ')}: ${place.name}`);
            });

            if (response.total_hits > 10) console.log(`Found ${response.total_hits - 1} other locations, refine your search to get clearer results`);

            await Apify.setValue('OUTPUT', response);
        } catch (error) {
            console.log(error.message);
            response = null;
            attempts--;
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    } while (attempts > 0 && !response);
});
