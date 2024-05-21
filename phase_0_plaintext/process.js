var fs = require('fs');

function formatVerse(s){
    var indented = s[0] === ' ';
    s = s.trim();
    if (indented) {
        s = '\t' + s;
    }
    return s;
}
//for each file in phase_0_plaintext
fs.readdirSync('./phase_0_plaintext').forEach(file => {
    //read the file
    var data = fs.readFileSync('./phase_0_plaintext/' + file, 'utf8');
    //split the file into lines
    var lines = data.split('\n');
    //split into text + linenumber (\d+\w at end of line)
    var regex = /(.+)(\d+\w)/;
    //for each line
    var twocols = lines.map(line => {
        var match = regex.exec(line);
        if (match) {
            return {
                text: formatVerse(match[1]),
                line: match[2]
            };
        }
        return {
            text: line,
            line: ""
        };
    }
    );    
    var result = twocols.map(twocol => {
        twocol.line
});