/*
to-do macronized characters missing in generated pdf 
indented starting lines broken in processing

*/
var fs = require('fs');
//allow to execute shell commands
var exec = require('child_process').exec;
var header = `% WITHOUT BLEED
% US Trade => 6x9
\\documentclass[paper=6in:9in,pagesize=pdftex,
               headinclude=on,footinclude=on,12pt]\{scrbook\}

\\usepackage\{longtable\}
\\usepackage[cmintegrals,cmbraces]\{newtxmath\}
\\usepackage\{ebgaramond-maths\}
\\usepackage[T1]\{fontenc\}
\\renewcommand\{\\baselinestretch\}\{1.2\} 

%set font to 13 pt
\\KOMAoptions\{fontsize=13pt\}

% include truetype font "EBGaramond-Regular.ttf"


% Paper width
% W = 6in
% Paper height
% H = 9in
% Paper gutter
% BCOR = 0.5in
% Margin (0.5in imposed on lulu, recommended on createspace)
% m = 0.5in
% Text height
% h = H - 2m = 8in
% Text width
% w = W - 2m - BCOR = 4.5in
\\areaset[0.50in]\{4.5in\}\{8in\}
\\begin\{document\}

% shakespeare sonnet with line numbers to left, don't use any packages

% two columns - line number, and text, well-aligned
% line number col width is 0.5cm and aligned right
\\begin\{longtable\}[p]\{ r l \}
`;

const footer = `
\\end\{longtable\}


\\end\{document\}
`;

var quotepartity_s = false;//if false, next single-quote should be replaced
var quotepartity_d = false;//if false, next double-quote should be replaced

var unicode_macronized_vowels = ['ā', 'ē', 'ī', 'ō', 'ū', 'ȳ', 'Ā', 'Ē', 'Ī', 'Ō', 'Ū', 'Ȳ'];
//nfd them
unicode_macronized_vowels = unicode_macronized_vowels.map(s => s.normalize('NFD'));
//convert to global regexs
unicode_macronized_vowels = unicode_macronized_vowels.map(s => new RegExp(s, 'g'));
//tex versions
const tex_macronized_vowels = ['\\=a', '\\=e', '\\={\\i}', '\\=o', '\\=u', '\\=y', '\\=A', '\\=E', '\\=I', '\\=O', '\\=U', '\\=Y'];
function texifyMacrons(s){
    //normalize s
    s = s.normalize('NFD');
    for (var i = 0; i < unicode_macronized_vowels.length; i++) {
        s = s.replace(unicode_macronized_vowels[i], tex_macronized_vowels[i]);
    }
    //do quote replacement
    for (var i = 0; i < s.length; i++) {
        var whitespace_left = i == 0 || s[i - 1] == ' ';
        var whitespace_right = i == s.length - 1 || s[i + 1] == ' ';
        if (s[i] === '\'') {
            if (whitespace_left && ! whitespace_right){
                quotepartity_s = false;
            }
            if (whitespace_right && !whitespace_left) {
                quotepartity_s = true;
            }
            if (quotepartity_s==false) {
                s = s.substring(0, i) + '`' + s.substring(i + 1);
            } 
            quotepartity_s = !quotepartity_s;        
        }
        if (s[i] === '"') {
            if (quotepartity_d==false) {
                s = s.substring(0, i) + '``' + s.substring(i + 1);
            } else {
                s = s.substring(0, i) + "''" + s.substring(i + 1);
            }
            quotepartity_d = !quotepartity_d;        
        }
    }
    return s;
}
//for each file in phase_0_plaintext
fs.readdirSync('./phase_1_macronized').forEach(file => {
    quotepartity_d=false;
    quotepartity_s=false;

    //read the file
    var data = fs.readFileSync('./phase_1_macronized/' + file, 'utf8');
    //split the file into lines
    var lines = data.split('\n');
    //split into text + linenumber (\d+\w at end of line)
    var regex = /(.+)\s+(\d+\w*)\s*$/;
    //for each line
    var twocols = lines.map(line => {
        var indented =  line.match(/^\s+/);
        line = line.trim();
        if (indented) {
            line = "\\indent " + line;
        }
        var match = regex.exec(line);
        if (match) {
            return {
                text: texifyMacrons(match[1].trim()),
                line: match[2]
            };
        }
        return {
            text: texifyMacrons(line.trim()),
            line: ""
        };
    }
    ); 
    
    var file_contents = header;
    twocols.forEach(line => {
        file_contents += line.line + ' & ' + line.text + '\\\\ \n';
    });
    file_contents += footer;
    var filename_without_extension = file.split('.')[0];
    fs.writeFileSync('./phase_2_tex/' + filename_without_extension + '.tex', file_contents);
    //generate pdf
    exec('pdflatex -output-directory=phase_3_pdf phase_2_tex/' + filename_without_extension + '.tex', function (error, stdout, stderr) {
        if (error) {
            console.log(error);
        }
        console.log(stdout);
        //delete .aux and .log files
        fs.unlinkSync('./phase_3_pdf/' + filename_without_extension + '.aux');
        fs.unlinkSync('./phase_3_pdf/' + filename_without_extension + '.log');
    });

});