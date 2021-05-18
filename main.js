const Apify = require('apify');
const { log } = Apify.utils;

Apify.main(async () => {
    const proxyConfiguration = await Apify.createProxyConfiguration();
    const requestQueue = await Apify.openRequestQueue();
    const input = await Apify.getValue('INPUT');
    if (!input) throw new Error('Can not get input');
    const { query } = input;
    if (!query || typeof query !== 'string') throw new Error('Query loaded from INPUT is empty or not a string.');
    // let attempts = 20;
    // BASIC CRAWLER
    const url = `https://www.kickstarter.com/locations/search?searchable=true&term=${query}`;

    await requestQueue.addRequest({
        url,
    });
    log.info(`${url} was added to the queue`);
    const crawler = new Apify.BasicCrawler({
        requestQueue,
        handleRequestFunction: async ({ request, session }) => {
            const { body } = await Apify.utils.requestAsBrowser({
                url: request.url,
                proxyUrl: proxyConfiguration.newUrl(session.id),
                headers: {
                    accept: 'application/json',
                },
            });
            const response = JSON.parse(body);
            if (!response.locations) throw new Error('Response does not contain locations. Try again.');
            // Parse the response and output it to console and key-value-store
            const places = response.locations.map((location) => ({
                id: location.id,
                name: location.displayable_name,
            }));
            console.log('Found places:');
            places.forEach((place, i) => {
                console.log(`${(i + 1).toString().padStart(2, '0')}) ${place.id.toString().padStart(8, ' ')}: ${place.name}`);
            });
            if (response.total_hits > 10) log.info(`Found ${response.total_hits - 1} other locations, refine your search to get clearer results`);
            await Apify.setValue('OUTPUT', response);    
        },
        handleFailedRequestFunction: async ({ request }) => {
            await Apify.pushData({
              "#isFailed": true,
              "#debug": Apify.utils.createRequestDebugInfo(request),
            });
          },
    });

    log.info('Starting crawler');
    await crawler.run();
    log.info('Crawler finished');
});
