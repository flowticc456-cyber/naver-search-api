const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { keyword, target, debug } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ error: 'keyword is required' });
  }
  
  try {
    let url;
    if (target === 'cafearticle') {
      // 카페 탭
      url = `https://search.naver.com/search.naver?ssc=tab.cafe.all&query=${encodeURIComponent(keyword)}`;
    } else if (target === 'blog') {
      // 블로그 탭
      url = `https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(keyword)}`;
    } else {
      // 통합검색 (VIEW)
      url = `https://search.naver.com/search.naver?ssc=tab.view.all&query=${encodeURIComponent(keyword)}`;
    }
    
    const html = await fetchPage(url);
    
    if (debug === '1') {
      return res.status(200).send(html);
    }
    
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9'
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
  
  const patterns = [
    /class="title_link"[^>]*>([^<]+)</gi,
    /class="api_txt_lines total_tit"[^>]*>([^<]+)</gi,
    /class="total_tit"[^>]*>([^<]+)</gi,
    /title_link[^>]*title="([^"]+)"/gi,
    /"title":"([^"]{5,100})"/g,
    /class="name_link"[^>]*>([^<]+)</gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let title = match[1].trim();
      title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      if (title && title.length > 3 && !results.some(r => r.title === title)) {
        results.push({ rank: results.length + 1, title: title });
      }
      if (results.length >= 50) break;
    }
    if (results.length >= 50) break;
  }
  
  return results;
}
```

수정 후 테스트:
```
https://naver-search-api-orcin.vercel.app/api/crawl?keyword=광주선불폰&target=cafearticle&debug=1
