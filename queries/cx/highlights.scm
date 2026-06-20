; Keywords
[
  "if" "else" "switch" "case" "default"
  "for" "while" "do" "break" "continue" "return" "goto"
  "defer" "is" "sizeof"
] @keyword

; Storage and qualifiers
[
  "static" "extern" "register" "auto" "inline"
  "const" "volatile"
  "typedef"
  "_Noreturn" "_Thread_local"
] @keyword

; Structure keywords
[
  "struct" "union" "enum" "variant"
] @keyword

; Primitive types
(primitive_type) @type.builtin

; Signed/unsigned/long/short as type modifiers
[
  "unsigned" "signed" "long" "short"
] @type.builtin

; Generic type parameters (@T)
(generic_param) @type.builtin

; Type identifiers in type positions
(type_specifier (identifier) @type)

; Generic type name
(generic_type name: (identifier) @type)

; Function definitions
(function_definition name: (identifier) @AlabasterDefinition)

; Function calls
(call_expression function: (identifier) @function)

; Struct/enum/variant names at definition
(struct_declaration name: (identifier) @AlabasterDefinition)
(enum_declaration name: (identifier) @AlabasterDefinition)
(variant_declaration name: (identifier) @AlabasterDefinition)

; Typedef names
(typedef_declaration (identifier) @AlabasterDefinition)

; Enum constants
(enumerator (identifier) @AlabasterConstant)

; Field access
(member_expression "." @punctuation.delimiter)
(member_expression "->" @punctuation.delimiter)

; Label definitions
(label_statement name: (identifier) @label)

; Strings
(string_literal) @string
(char_literal) @AlabasterConstant
(escape_sequence) @string.escape

; Numbers
(number_literal) @number

; Booleans and null
(true) @constant.builtin
(false) @constant.builtin
(null) @constant.builtin

; Comments
(comment) @comment

; Preprocessor
(preproc_directive) @keyword

; Operators
[
  "=" "+=" "-=" "*=" "/=" "%=" "<<=" ">>=" "&=" "^=" "|="
  "+" "-" "*" "/" "%"
  "||" "&&" "|" "^" "&"
  "==" "!=" "<" ">" "<=" ">="
  "<<" ">>"
  "!" "~"
  "++" "--"
  "?" ":"
] @operator

; Punctuation
[ "," ";" ] @punctuation.delimiter
[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket

; Variadic
"..." @punctuation.special
