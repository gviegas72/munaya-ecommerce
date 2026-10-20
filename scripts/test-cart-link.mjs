async function test() {
  const res = await fetch('https://munayarocks.lojavirtualnuvem.com.br/cart-link/1622729752-1,1623046307-1,1623047280-1', {
    redirect: 'manual'
  });
  console.log('Status 1:', res.status, res.headers.get('location'));
  const cookies = res.headers.getSetCookie();

  const loc = res.headers.get('location');
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
  const res2 = await fetch(loc, {
    headers: { 'Cookie': cookieHeader }
  });
  console.log('Status 2:', res2.status);
  const text = await res2.text();
  console.log('Includes Bonzo:', text.includes('Bonzo'));
  console.log('Includes Dimebag:', text.includes('Dimebag'));
  console.log('Includes Cathedral:', text.includes('Cathedral'));
  
  // Find cart items
  const titles = text.match(/<h\d[^>]*>.*?<\/h\d>/gi) || [];
  console.log('Headers:', titles);
  
  // Check total price in html
  const priceMatches = text.match(/R\$\s*[\d,.]+/g) || [];
  console.log('Prices found:', priceMatches);
}
test();
