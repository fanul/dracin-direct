import 'dotenv/config';

const token = process.env.CAPTAIN_API_TOKEN;

async function debugGoodShort() {
    console.log('=== GoodShort ===');
    const r = await fetch('https://captain.sapimu.au/goodshort/api/v1/home', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const d = await r.json();

    // Simulate what sync does: unwrap Captain wrapper
    const rawData = d;
    const providerData = rawData.data !== undefined ? rawData.data : rawData;

    console.log('Provider data type:', typeof providerData);
    console.log('Provider data keys:', Object.keys(providerData));

    if (providerData.records && Array.isArray(providerData.records)) {
        const nonBanner = providerData.records.filter(r => r.style !== 'SLIDE_BANNER');
        console.log('Non-banner records:', nonBanner.length);
        let totalItems = 0;
        for (const rec of nonBanner) {
            const count = rec.items ? rec.items.length : 0;
            totalItems += count;
            console.log(`  ${rec.name} (${rec.style}): ${count} items`);
        }
        console.log('Total items:', totalItems);
    } else {
        console.log('No records found!');
    }
}

async function debugFlexTV() {
    console.log('\n=== FlexTV tabs ===');
    const r1 = await fetch('https://captain.sapimu.au/flextv/api/v1/tabs', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const d1 = await r1.json();
    const inner1 = d1.data !== undefined ? d1.data : d1;
    console.log('Tabs endpoint keys:', Object.keys(inner1));

    console.log('\n=== FlexTV tabs/Fokus ===');
    const r2 = await fetch('https://captain.sapimu.au/flextv/api/v1/tabs/Fokus', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const d2 = await r2.json();
    const inner2 = d2.data !== undefined ? d2.data : d2;
    console.log('Tabs/Fokus keys:', Object.keys(inner2));

    if (inner2.floor && Array.isArray(inner2.floor)) {
        let totalSeries = 0;
        for (const f of inner2.floor) {
            const count = f.series_list ? f.series_list.length : 0;
            totalSeries += count;
            console.log(`  ${f.title}: ${count} series`);
        }
        console.log('Total series:', totalSeries);
        if (inner2.floor[0]?.series_list?.[0]) {
            console.log('First series keys:', Object.keys(inner2.floor[0].series_list[0]));
        }
    }
}

await debugGoodShort();
await debugFlexTV();
