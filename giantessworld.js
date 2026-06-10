(function() {
  const plugin = {
    id: "giantessworld",
    name: "GiantessWorld",
    icon: "https://giantessworld.net/favicon.ico",
    site: "https://giantessworld.net",
    version: "1.0.5",

    async popularNovels(page) {
      const url = `https://giantessworld.net/browse.php?type=recent&page=${page}`;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
      const novels = [];
      $('a[href^="viewstory.php?sid="]').each((i, el) => {
        const name = $(el).text().trim();
        const path = $(el).attr('href');
        if (name && path) novels.push({ name, path, cover: "" });
      });
      return novels;
    },

    async parseNovel(novelPath) {
      let url = this.site + (novelPath.startsWith('/') ? '' : '/') + novelPath;
      let html = await (await fetch(url)).text();
      let $ = cheerio.load(html);

      const novel = {
        name: $('h1').first().text().trim() || 'Sin título',
        path: novelPath,
        cover: "",
        author: $('a[href^="viewuser.php"]').first().text().trim() || 'Desconocido',
        summary: $('td:contains("Summary"), td:contains("Description")').next().text().trim(),
        chapters: []
      };

      const tocUrl = url.includes('index=1') ? url : url + '&index=1';
      html = await (await fetch(tocUrl)).text();
      $ = cheerio.load(html);

      $('a[href^="viewchapter.php"]').each((i, el) => {
        const name = $(el).text().trim();
        const path = $(el).attr('href');
        if (name && path) {
          novel.chapters.push({ name, path, chapterNumber: i + 1 });
        }
      });

      return novel;
    },

    async parseChapter(chapterPath) {
      const url = this.site + (chapterPath.startsWith('/') ? '' : '/') + chapterPath;
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);

      let text = $('td[align="left"]').html() || $('body').html() || '';
      text = text
        .replace(/<script.*?<\/script>/gis, '')
        .replace(/<style.*?<\/style>/gis, '')
        .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(p|div)[^>]*>/gi, '\n')
        .replace(/\n\s+/g, '\n\n');
      return text.trim();
    },

    async searchNovels(term) {
      const url = `https://giantessworld.net/search.php?search=${encodeURIComponent(term)}`;
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);
      const novels = [];
      $('a[href^="viewstory.php?sid="]').each((i, el) => {
        const name = $(el).text().trim();
        const path = $(el).attr('href');
        if (name && path) novels.push({ name, path, cover: "" });
      });
      return novels;
    }
  };

  return plugin;
})();
