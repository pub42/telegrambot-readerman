'use strict';

/**
 * Module dependencies.
 */

const
  Promise       = require('bluebird'),
  debug         = require('debug'),
  request       = require('request'),
  FeedParser    = require('feedparser'),
  iconv         = require('iconv-lite'),
  URL           = require('url');


const
  log         = debug('telegrambot-reanderman:fetch');


const getEncodingFromHeader = (header) => {
  const contentType = (header || '').split(';')
    .map((chunk) => chunk.split('='))
    .filter((chunks) => chunks[0].trim().toLowerCase() === 'charset')
    .map((chunks) => chunks[1].trim().toLowerCase().replace(/^(["']*)/i, '').replace(/(["']*)$/, ''));

  return contentType[0] || null;
};

const XML_INSTRUCTION_REGEXP = /<\?xml([^>]*)\?>/i;
const getXMLInstruction = (body) => {
  const matches = (body || '').match(XML_INSTRUCTION_REGEXP);
  if (!matches) {
    return null;
  }

  return matches[1].split(' ')
    .filter((x) => x)
    .reduce((memo, chunk) => {
      let pairs = chunk.split('=')
        .filter((x) => x)
        .map((pair) => pair.trim().toLowerCase().replace(/^(["']*)/i, '').replace(/(["']*)$/, ''));

      memo[pairs[0]] = pairs[1] || true;

      return memo;
    }, {});
};

const getEncodingFromXML = (body) => {
  const instruction = getXMLInstruction(body);
  return instruction && instruction.encoding ? instruction.encoding : null;
};

const
  MAX_RETRY_COUNT = 10,
  RETRY_INTERVAL  = 1000; // 1 sec


const fetch = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) { return reject(new Error(`Bad URL (url: ${url}`)); }

    const
      feedparser = new FeedParser(),
      items     = [];

    var
      retry = 0;

    feedparser.on('error', (e) => {
      log('Errored body: ', debugBody);
      return reject(e);
    }).on('readable', () => {
      // This is where the action is!
      var item;

      while (item = feedparser.read()) {
        items.push(item)
      }
    }).on('end', () => {
      feedparser.meta.lastRecordLink = items.length ? (items[0].link || null) : null;

      resolve({
        meta: feedparser.meta,
        records: items
      });
    });

    const doFetch = () => {
      if (++retry > MAX_RETRY_COUNT) {
        return reject(new Error(`Maximum retry count reached! (url: ${url})`));
      }

      request({
        method: 'GET',
        url: url,
        headers: {
          'User-Agent': 'FeedFetcher-Google; (+http://www.google.com/feedfetcher.html)'
        },
        timeout: 1000 * 15, // 15 sec
        encoding: null
      }, (e, res, bufBody) => {
        if (e) {
          return reject(e);
        }

        if (res.statusCode != 200) {
          return reject(new Error(`Bad status code (status: ${res.statusCode}, url: ${url})`));
        }

        if (bufBody.length === 0) { // got empty response. is server busy?
          log('URL %s respond with empty response body. retrying... (remain: %d)', url, retry);
          return setTimeout(() => doFetch(), RETRY_INTERVAL);
        }

        let
          body = bufBody.toString('utf8'),
          httpEncoding = getEncodingFromHeader(res.headers['content-type']),
          xmlEncoding = getEncodingFromXML(body),
          contentEncoding = xmlEncoding || httpEncoding;


        if (!httpEncoding && !xmlEncoding) {
          log('no encoding information. setting contentEncoding to utf8... (url: %s)', url);
          contentEncoding = 'utf8';
        }
        if ((httpEncoding && xmlEncoding) && (httpEncoding !== xmlEncoding)) {
          log('encoding is different between http header and xml header. (http: %s, xml: %s, url: %s)', httpEncoding, xmlEncoding, url);
        }


        if (contentEncoding.substr(0, 3) !== 'utf') { // content should be decoded
          log('encoding %s detected. decoding... (url: %s)', contentEncoding, url);
          body = iconv.decode(bufBody, contentEncoding);
        }

        feedparser.end(body);
      });
    };

    doFetch();
  });
};

module.exports = exports = fetch;