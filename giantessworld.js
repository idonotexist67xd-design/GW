(function() {
  "use strict";

  const plugin = {
    id: "giantessworld",
    name: "GiantessWorld",
    icon: "https://giantessworld.net/favicon.ico",
    site: "https://giantessworld.net",
    version: "1.0.7",

    async popularNovels(page) {
      const url = `https://giantessworld.net/browse.php?type=recent&page=${page}`;
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);
      const novels = [];

      $('a[href^="viewstory.php?sid="]').each((_, el) => {
        const name = $(el).text().trim();
        const path = $(el).attr("href");
        if (name && path) novels.push({ name, path, cover: "" });
      });
      return novels;
    },

    async parseNovel(novelPath) {
      let url = `https://giantessworld.net/${novelPath.replace(/^\//, '')}`;
      if (!url.includes("index=1")) {
        url += (url.includes("?") ? "&" : "?") + "index=1";
      }

      let html = await (await fetch(url)).text();
      let $ = cheerio.load(html);

      const novel = {
        name: $("h1").first().text().trim() || "Sin título",
        path: novelPath,
        cover: "",
        author: $('a[href^="viewuser.php"]').first().text().trim() || "Desconocido",
        summary: $('td:contains("Summary"), td:contains("Description")').next().text().trim(),
        chapters: []
      };

      $('a[href^="viewchapter.php"]').each((i, el) => {
        const name = $(el).text().trim();
        const path = $(el).attr("href");
        if (name && path) {
          novel.chapters.push({ name, path, chapterNumber: i + 1 });
        }
      });

      return novel;
    },

    async parseChapter(chapterPath) {
      const url = `https://giantessworld.net/${chapterPath.replace(/^\//, '')}`;
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);

      let text = $('td[align="left"]').html() || $("body").html() || "";

      text = text
        .replace(/<script.*?<\/script>/gis, "")
        .replace(/<style.*?<\/style>/gis, "")
        .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?(p|div)[^>]*>/gi, "\n")
        .replace(/\n\s+/g, "\n\n");

      return text.trim() || "No se pudo cargar el capítulo.";
    },

    async searchNovels(term) {
      const url = `https://giantessworld.net/search.php?search=${encodeURIComponent(term)}`;
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);
      const novels = [];

      $('a[href^="viewstory.php?sid="]').each((_, el) => {
        const name = $(el).text().trim();
        const path = $(el).attr("href");
        if (name && path) novels.push({ name, path, cover: "" });
      });
      return novels;
    }
  };

  // Esto asegura que tanto Tsundoku como LNReader intercepten el retorno correctamente
  if (typeof module !== "undefined" && module.exports) {
    module.exports = plugin;
  } else {
    return plugin;
  }
})();
