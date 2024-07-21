grammar Xsmpproject
import 'Terminals'
import 'xsmp-types'

entry Project returns Project:
    'project' name=STRING  
     
     ('tool' tools+=[Tool:STRING] |
     'source' sourcePaths+=STRING |
     'dependency' dependencies+=[Project:STRING] |
     'profile' profile=[Profile:STRING]
      )*
;

Profile returns Profile:
    'profile' name=STRING;

Tool returns Tool:
    'tool' name=STRING;



