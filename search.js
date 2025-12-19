export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { keyword, target } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: '키워드를 입력하세요' });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  try {
    const searchType = target || 'cafearticle';
    const url = `https://openapi.naver.com/v1/search/${searchType}?query=${encodeURIComponent(keyword)}&display=100`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    const data = await response.json();

    if (data.errorCode) {
      return res.status(400).json({ error: data.errorMessage });
    }

    return res.status(200).json({
      keyword: keyword,
      total: data.total,
      items: data.items.map(item => ({
        title: item.title.replace(/<[^>]*>/g, ''),
        link: item.link,
        description: item.description.replace(/<[^>]*>/g, ''),
        cafename: item.cafename || '',
        cafeurl: item.cafeurl || '',
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: '검색 중 오류가 발생했습니다' });
  }
}
