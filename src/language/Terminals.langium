
hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w]*/;
//terminal INT :/[0-9]/;
terminal STRING: /"[^"]*"|'[^']*'/;


//terminal ANY_OTHER returns string:.;
//terminal ML_DOCUMENTATION :/\/\*\*[\s\S]*?\*\//;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
