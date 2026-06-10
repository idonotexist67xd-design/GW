import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class GiantessWorldPlugin implements Plugin.PluginBase {
  id = 'giantessworld';
  name = 'GiantessWorld';
  icon = 'https://giantessworld.net/favicon.ico';
  site = 'https://giantessworld.net';
  version = '1.0.1';
  filters = undefined;

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const url = `\( {this.site}/browse.php?type=recent&page= \){pageNo}`;
    const body = await fetchApi(url).then(res => res.text());
    const $ = loadCheerio(body);
    const novels: Plugin.NovelItem[] = [];

    $('a[href^="viewstory.php?sid="]').each((i, el) => {
      const name = $(el).text().trim();
      const path = $(el).attr('href') || '';
      if (name && path) {
        novels.push({
          name,
          path,
          cover: defaultCover,
        });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.site + '/' + novelPath;
    const body = await fetchApi(url).then(res => res.text());
    const $ = loadCheerio(body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('h1').first().text().trim() || 'Sin título',
      cover: defaultCover,
      summary: '',
      author: '',
      status: NovelStatus.Unknown,
      chapters: [],
    };

    // Autor
    novel.author = $('a[href^="viewuser.php"]').first().text().trim();

    // Resumen
    novel.summary = $('.summary, p:contains("Summary")').text().trim() || 
                   $('td:contains("Summary")').next().text().trim();

    // Lista de capítulos (en la página con &index=1)
    const tocUrl = url.includes('index=1') ? url : url + '&index=1';
    const tocBody = await fetchApi(tocUrl).then(res => res.text());
    const $$ = loadCheerio(tocBody);

    \[ ('a[href^="viewchapter.php"]').each((i, el) => {
      const chapterName = \](el).text().trim();
      const chapterPath = $$(el).attr('href') || '';
      if (chapterName && chapterPath) {
        novel.chapters.push({
          name: chapterName,
          path: chapterPath,
          releaseTime: '',
          chapterNumber: i + 1,
        });
      }
    });

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.site + '/' + chapterPath;
    const body = await fetchApi(url).then(res => res.text());
    const $ = loadCheerio(body);

    // El contenido principal suele estar en un div grande o td
    let text = $('td[align="left"]').html() || 
               $('.chapter-content, .storytext').html() || 
               $('body').html() || '';

    // Limpieza básica
    text = text
      .replace(/<script.*?<\/script>/gis, '')
      .replace(/<style.*?<\/style>/gis, '')
      .replace(/<a[^>]*>/gi, '')
      .replace(/<\/a>/gi, '');

    return text || 'No se pudo cargar el capítulo.';
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const url = `\( {this.site}/search.php?search= \){encodeURIComponent(searchTerm)}`;
    const body = await fetchApi(url).then(res => res.text());
    const $ = loadCheerio(body);
    const novels: Plugin.NovelItem[] = [];

    $('a[href^="viewstory.php?sid="]').each((i, el) => {
      const name = $(el).text().trim();
      const path = $(el).attr('href') || '';
      if (name && path) {
        novels.push({
          name,
          path,
          cover: defaultCover,
        });
      }
    });

    return novels;
  }

  resolveUrl = (path: string, isNovel?: boolean) => 
    this.site + (path.startsWith('/') ? '' : '/') + path;
}

export default new GiantessWorldPlugin();
