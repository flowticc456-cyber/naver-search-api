const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const keyword = req.query.keyword;
  const target = req.query.target;
  const debug = req.query.debug;
  
  if (!keyword) {
    return res.status(400).json({ error: 'keyword is required' });
  }
  
  var url;
  if (target === 'cafearticle') {
    url = 'https://search.naver.com/search.naver?where=cafearticle&sm=tab_opt&query=' + encodeURIComponent(keyword);
  } else if (target === 'blog') {
    url = 'https://search.naver.com/search.naver?where=blog&sm=tab_opt&query=' + encodeURIComponent(keyword);
  } else {
    url = 'https://search.naver.com/search.naver?where=nexearch&query=' + encodeURIComponent(keyword);
  }
  
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }, function(response) {
    var data = '';
    response.on('data', function(chunk) { data += chunk; });
    response.on('end', function() {
      if (debug === '1') {
        res.status(200).send(data);
        return;
      }
      
      var results = [];
      var regex = /class="title_link"[^>]*>([^<]+)</gi;
      var match;
      while ((match = regex.exec(data)) !== null) {
        var title = match[1].trim();
        if (title.length > 5) {
          results.push({ rank: results.length + 1, title: title });
        }
        if (results.length >= 50) break;
      }
      
      res.status(200).json({
        keyword: keyword,
        target: target || 'nexearch',
        total: results.length,
        items: results
      });
    });
  }).on('error', function(err) {
    res.status(500).json({ error: err.message });
  });
};
```

수정 후 테스트:
```
https://naver-search-api-orcin.vercel.app/api/crawl?keyword=광주선불폰&target=cafearticle&debug=1
