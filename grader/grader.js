#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(html) {
    return cheerio.load(html);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(html, checksfile) {
    $ = cheerioHtmlFile(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var readFromFile = function(file) {
    return fs.readFileSync(file, "UTF-8");
}

var assertUrlExists = function(url) {
    if(!url) {
        console.log("Url not specified. Exiting.");
        process.exit(1);
    }
    return url;
};

var grade = function(html, checks) {
    var checkJson = checkHtmlFile(html, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

var gradeFromFile = function(file, checks) {
    console.log("reading from file %s", file);
    grade(readFromFile(file), program.checks);
}

var gradeFromUrl = function(url, checks) {
    console.log("reading from url %s", url);
    rest.get(url).on('complete', function(result, response) {
        grade(result.toString(), checks);
    });
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Url to bitstarter', clone(assertUrlExists), null)
        .parse(process.argv);
        
    if (program.url) {
        gradeFromUrl(program.url, program.checks);
    } else {
        gradeFromFile(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}