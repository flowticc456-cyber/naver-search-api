const https = require('https');

module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  var keyword = req.query.keyword || '';
  var target = req.query.target || '';
  var debug = req.query.debug || '';
  
  if (!keyword) {
    return res.status(400).json({ error: 'keyword is required' });
  }
  
  var url = 'https://search.naver.com/search.naver?where=nexearch&query=' + encodeURIComponent(keyword);
  
  if (target === 'cafearticle') {
    url = 'https://search.naver.com/search.naver?where=cafearticle&query=' + encodeURIComponent(keyword);
  } else if (target === 'blog') {
    url = 'https://search.naver.com/search.naver?where=blog&query=' + encodeURIComponent(keyword);
  }
  
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  }, function(response) {
    var data = '';
    response.on('data', function(chunk) { data += chunk; });
    response.on('end', function() {
      
      if (debug === '1') {
        return res.status(200).send(data);
      }
      
      var results = [];
      var match;
      
      var regex1 = /class="total_tit"[^>]*>([^<]+)/g;
      while ((match = regex1.exec(data)) !== null && results.length < 50) {
        results.push({ rank: results.length + 1, title: match[1].trim() });
      }
      
      var regex2 = /class="link_tit"[^>]*>([^<]+)/g;
      while ((match = regex2.exec(data)) !== null && results.length < 50) {
        results.push({ rank: results.length + 1, title: match[1].trim() });
      }
      
      res.status(200).json({
        keyword: keyword,
        target: target || 'nexearch',
        total: results.length,
        items: results
      });
    });
  }).on('error', function(e) {
    res.status(500).json({ error: e.message });
  });
};
```

수정 후 테스트:
```
https://naver-search-api-orcin.vercel.app/api/crawl?keyword=광주선불폰
