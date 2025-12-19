const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { keyword, target } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ error: 'keyword is required' });
  }
  
  try {
    let url;
    if (target === 'webkr') {
      url = `https://search.naver.com/search.naver?ssc=tab.cafe.all&where=article&query=${encodeURIComponent(keyword)}`;
    } else if (target === 'cafearticle') {
      url = `https://search.naver.com/search.naver?ssc=tab.cafe.all&where=article&query=${encodeURIComponent(keyword)}`;
    } else if (target === 'blog') {
      url = `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(keyword)}`;
    } else {
      url = `https://search.naver.com/search.naver?where=view&query=${encodeURIComponent(keyword)}`;
    }
    
    const html = await fetchPage(url);
    const titles = parseSearchResults(html);
    
    res.status(200).json({
      keyword: keyword,
      target: target || 'view',
      total: titles.length,
      items: titles
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseSearchResults(html) {
  const results = [];
  
  // 여러 패턴으로 제목 추출
  const patterns = [
    /class="title_link"[^>]*title="([^"]+)"/g,
    /class="api_txt_lines total_tit"[^>]*title="([^"]+)"/g,
    /class="total_tit"[^>]*>([^<]+)</g,
    /data-cr-area="bsc"[^>]*>.*?class="[^"]*tit[^"]*"[^>]*>([^<]+)</gs
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const title = match[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (title && title.length > 3 && !results.some(r => r.title === title)) {
        results.push({ rank: results.length + 1, title: title });
      }
      if (results.length >= 50) break;
    }
    if (results.length >= 50) break;
  }
  
  return results;
}
