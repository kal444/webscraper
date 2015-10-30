var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

fs.exists('./output', function(exists) {
  if (!exists) fs.mkdirSync('output');
});

var queues = [
  { type: 'outer_deity', key: 'odid', min: 1, max: 10 },
  { type:      'quests', key:  'qid', min: 1, max: 50 },
  { type:    'dialogue', key:  'did', min: 1, max: 50 },
  { type:     'website', key:  'wid', min: 1, max: 200 },
  { type:        'book', key:  'bid', min: 1, max: 500 },
];

for (var i = 0; i < queues.length; i++) {
  var q = queues[i];
  for (var id = q.min; id <= q.max; id++) {
    var url = 'http://www.lorelibrary.com/?page=' + q.type + '&' + q.key + '=' + id;

    request({ url: url }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var h = cheerio.load(body);

        if (h('div#content').text().match(/We\'re sorry\..*valid./)) {
          return;
        }

        h('div#content div.title span').replaceWith(' - ');
        h('div#content div.title a').replaceWith(h('div#content div.title a').text());
        var path = h('div#content div.title').html().trim();
        var title = h('div#content div.contentname h3').html().trim();
        var content  = h('div#content div.bodycontent').html().trim();
        h('div#content div.source b').remove();
        var source = h('div#content div.source').html().trim();

        var o = cheerio.load(
          '<!DOCTYPE html><html><head><meta charset="UTF-8"><title></title></head><body></body></html>');
        o('title').text(title);
        o('head').append('<link rel="stylesheet" href="../css/normalize.css" type="text/css">');
        o('head').append('<link rel="stylesheet" href="../css/main.css" type="text/css">');
        o('body').append('<div class="title chapter">' + title + '</div>');
        o('body').append('<hr>');
        o('body').append('<div class="story">' + content + '</div>');
        o('body').append('<hr>');
        o('body').append('<div class="source">' + 'Source: ' + source + '</div>');

        var file = path.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase() + '.html';
        var output = o.html()
          .replace(/I&#xFFFD;m/g, "I&apos;m")
          .replace(/s&#xFFFD; /g, "s&apos; ")
          .replace(/&#xFFFD;s/g, "&apos;s")
          .replace(/&#xFFFD;t/g, "&apos;t")
          .replace(/&#xFFFD;re/g, "&apos;re")
          .replace(/&#xFFFD;ve/g, "&apos;ve")
          .replace(/&#xFFFD;ll/g, "&apos;ll")
          .replace(/&#xFFFD;Dal/g, "&apos;Dal")
          .replace(/&#xFFFD;Dul/g, "&apos;Dul")
          .replace(/&#xFFFD;Anon/g, "&apos;Anon")
          .replace(/&#xFFFD;Arad/g, "&apos;Arad")
          ;

        fs.writeFile('./output/' + file, output, function(err) {
          if (err) {
            console.log(file + ' in error');
          } else {
            // console.log(file + ' saved');
          }
        });

      }
    });

  }
}

