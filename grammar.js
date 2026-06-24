module.exports = grammar({
  name: 'cx',

  extras: $ => [/\s/, $.comment],

  conflicts: $ => [
    [$.type_specifier, $._expression],
    [$.type_specifier],
    [$.type_specifier, $.declarator],
    [$.type_specifier, $.parameter],
    [$.type_argument_list, $.argument_list],
    [$.variant_specifier, $.variant_forward_declaration, $.variant_declaration],
    [$.auto_declaration, $.storage_class],
  ],

  rules: {

    source_file: $ => repeat($._top_level),

    _top_level: $ => choice(
      $.function_definition,
      $.struct_declaration,
      $.enum_declaration,
      $.variant_declaration,
      $.variant_forward_declaration,
      $.typedef_declaration,
      $.declaration,
      $.auto_declaration,
      $.preproc_directive,
      ';',
    ),

    // ---------------------------------------------------------------
    // Preprocessor
    // ---------------------------------------------------------------
    preproc_directive: $ => choice(
      $.preproc_include,
      $.preproc_define,
      $.preproc_other,
    ),

    preproc_include: $ => seq(
      token(prec(1, seq('#', /\s*/, 'include'))),
      field('path', choice(
        $.system_lib_string,
        $.string_literal,
      )),
    ),

    system_lib_string: $ => token(seq('<', /[^>\n]+/, '>')),

    preproc_define: $ => seq(
      token(prec(1, seq('#', /\s*/, 'define'))),
      field('name', $.identifier),
      optional(field('value', $.preproc_value)),
    ),

    preproc_value: $ => /[^\n]+/,

    preproc_other: $ => token(seq('#', /[^\n]*/)),

    // ---------------------------------------------------------------
    // Comments
    // ---------------------------------------------------------------
    comment: $ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    )),

    // ---------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------
    type_specifier: $ => choice(
      $.primitive_type,
      $.identifier,
      $.generic_type,
      $.struct_specifier,
      $.enum_specifier,
      $.variant_specifier,
      $.generic_param,
      prec.left(seq($.type_specifier, '*')),
      prec(2, seq('const', $.type_specifier)),
      prec(2, seq('volatile', $.type_specifier)),
      prec(2, seq('unsigned', optional($.type_specifier))),
      prec(2, seq('signed', optional($.type_specifier))),
      prec(2, seq('long', optional($.type_specifier))),
      prec(2, seq('short', optional($.type_specifier))),
    ),

    primitive_type: $ => choice(
      'void', 'char', 'int', 'float', 'double', 'bool',
      '_Bool', 'size_t',
    ),

    generic_param: $ => seq('@', $.identifier),

    generic_type: $ => prec(3, seq(
      field('name', $.identifier),
      '(',
      field('arguments', $.type_argument_list),
      ')',
    )),

    type_argument_list: $ => seq(
      $.type_specifier,
      repeat(seq(',', $.type_specifier)),
    ),

    struct_specifier: $ => prec.left(1, seq('struct', optional($.identifier))),
    enum_specifier: $ => prec.left(1, seq('enum', optional($.identifier))),
    variant_specifier: $ => prec.left(1, seq('variant', optional($.identifier))),

    // ---------------------------------------------------------------
    // Declarations
    // ---------------------------------------------------------------
    declaration: $ => seq(
      optional($.storage_class),
      $.type_specifier,
      $.declarator_list,
      ';',
    ),

    typedef_declaration: $ => seq(
      'typedef',
      $.type_specifier,
      optional($.struct_body),
      $.identifier,
      ';',
    ),

    auto_declaration: $ => seq(
      'auto',
      field('name', $.identifier),
      '=',
      $._expression,
      ';',
    ),

    storage_class: $ => choice(
      'static', 'extern', 'register', 'auto', 'inline',
      '_Noreturn', '_Thread_local',
    ),

    declarator_list: $ => seq(
      $.declarator,
      repeat(seq(',', $.declarator)),
    ),

    declarator: $ => seq(
      repeat('*'),
      field('name', $.identifier),
      repeat($.array_dimension),
      optional(seq('=', $.initializer)),
    ),

    array_dimension: $ => seq('[', optional($._expression), ']'),

    initializer: $ => choice(
      $._expression,
      $.initializer_list,
    ),

    initializer_list: $ => seq(
      '{',
      optional(seq(
        choice($.designator, $.initializer),
        repeat(seq(',', choice($.designator, $.initializer))),
        optional(','),
      )),
      '}',
    ),

    designator: $ => seq(
      choice(
        seq('.', $.identifier),
        seq('[', $._expression, ']'),
      ),
      '=',
      $.initializer,
    ),

    // ---------------------------------------------------------------
    // Struct / Enum / Variant declarations
    // ---------------------------------------------------------------
    struct_declaration: $ => prec(5, seq(
      choice('struct', 'union'),
      optional(field('name', $.identifier)),
      optional($.generic_param_list),
      $.struct_body,
      ';',
    )),

    generic_param_list: $ => seq(
      '(',
      $.generic_param,
      repeat(seq(',', $.generic_param)),
      ')',
    ),

    struct_body: $ => seq(
      '{',
      repeat($.field_declaration),
      '}',
    ),

    field_declaration: $ => seq(
      $.type_specifier,
      optional(seq(
        $.declarator,
        repeat(seq(',', $.declarator)),
      )),
      optional(seq(':', $._expression)),
      ';',
    ),

    enum_declaration: $ => prec(5, seq(
      'enum',
      optional(field('name', $.identifier)),
      '{',
      optional(seq(
        $.enumerator,
        repeat(seq(',', $.enumerator)),
        optional(','),
      )),
      '}',
      ';',
    )),

    enumerator: $ => seq(
      $.identifier,
      optional(seq('=', $._expression)),
    ),

    variant_forward_declaration: $ => seq(
      'variant',
      field('name', $.identifier),
      ';',
    ),

    variant_declaration: $ => prec(5, seq(
      'variant',
      field('name', $.identifier),
      optional($.generic_param_list),
      '{',
      $.type_specifier,
      repeat(seq(',', $.type_specifier)),
      optional(','),
      '}',
      ';',
    )),

    // ---------------------------------------------------------------
    // Functions
    // ---------------------------------------------------------------
    function_definition: $ => seq(
      optional($.storage_class),
      field('return_type', $.type_specifier),
      field('name', $.identifier),
      $.parameter_list,
      choice($.block, ';'),
    ),

    parameter_list: $ => seq(
      '(',
      optional(seq(
        $.parameter,
        repeat(seq(',', $.parameter)),
        optional(seq(',', '...')),
      )),
      ')',
    ),

    parameter: $ => seq(
      $.type_specifier,
      optional(seq(
        repeat('*'),
        optional(field('name', $.identifier)),
        repeat($.array_dimension),
      )),
    ),

    // ---------------------------------------------------------------
    // Statements
    // ---------------------------------------------------------------
    _statement: $ => choice(
      $.block,
      $.declaration,
      $.auto_declaration,
      $.expression_statement,
      $.if_statement,
      $.while_statement,
      $.do_while_statement,
      $.for_statement,
      $.switch_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.goto_statement,
      $.label_statement,
      $.defer_statement,
      $.empty_statement,
    ),

    block: $ => seq('{', repeat($._statement), '}'),

    expression_statement: $ => seq($._expression, ';'),
    empty_statement: $ => ';',

    if_statement: $ => prec.right(seq(
      'if', '(', $._expression, ')',
      $._statement,
      optional(seq('else', $._statement)),
    )),

    while_statement: $ => seq(
      'while', '(', $._expression, ')',
      $._statement,
    ),

    do_while_statement: $ => seq(
      'do', $._statement,
      'while', '(', $._expression, ')', ';',
    ),

    for_statement: $ => seq(
      'for', '(',
      choice($.declaration, $.expression_statement, $.empty_statement),
      optional($._expression), ';',
      optional($._expression),
      ')',
      $._statement,
    ),

    switch_statement: $ => seq(
      'switch', '(', $._expression, ')',
      '{',
      repeat(choice($.case_clause, $.default_clause)),
      '}',
    ),

    case_clause: $ => prec.left(seq(
      'case',
      choice($._expression, $.type_specifier),
      ':',
      repeat($._statement),
    )),

    default_clause: $ => prec.left(seq(
      'default', ':',
      repeat($._statement),
    )),

    return_statement: $ => seq('return', optional($._expression), ';'),
    break_statement: $ => seq('break', ';'),
    continue_statement: $ => seq('continue', ';'),
    goto_statement: $ => seq('goto', $.identifier, ';'),
    label_statement: $ => prec(1, seq(field('name', $.identifier), ':', $._statement)),

    defer_statement: $ => seq('defer', $._statement),

    // ---------------------------------------------------------------
    // Expressions
    // ---------------------------------------------------------------
    _expression: $ => choice(
      $.assignment_expression,
      $.ternary_expression,
      $.binary_expression,
      $.unary_expression,
      $.postfix_expression,
      $.call_expression,
      $.subscript_expression,
      $.member_expression,
      $.cast_expression,
      $.sizeof_expression,
      $.compound_literal,
      $.paren_expression,
      $.is_expression,
      $.identifier,
      $.number_literal,
      $.string_literal,
      $.char_literal,
      $.true,
      $.false,
      $.null,
    ),

    assignment_expression: $ => prec.right(1, seq(
      $._expression,
      choice('=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '^=', '|='),
      $._expression,
    )),

    ternary_expression: $ => prec.right(2, seq(
      $._expression, '?', $._expression, ':', $._expression,
    )),

    binary_expression: $ => {
      const ops = [
        ['||', 3],
        ['&&', 4],
        ['|', 5],
        ['^', 6],
        ['&', 7],
        ['==', 8], ['!=', 8],
        ['<', 9], ['>', 9], ['<=', 9], ['>=', 9],
        ['<<', 10], ['>>', 10],
        ['+', 11], ['-', 11],
        ['*', 12], ['/', 12], ['%', 12],
      ];
      return choice(...ops.map(([op, prec_val]) =>
        prec.left(prec_val, seq(
          field('left', $._expression),
          field('operator', op),
          field('right', $._expression),
        ))
      ));
    },

    unary_expression: $ => prec.right(13, seq(
      choice('!', '~', '-', '+', '++', '--', '*', '&'),
      $._expression,
    )),

    postfix_expression: $ => prec.left(15, seq(
      $._expression,
      choice('++', '--'),
    )),

    call_expression: $ => prec.left(15, seq(
      field('function', choice($.identifier, $.member_expression)),
      '(',
      optional($.argument_list),
      ')',
    )),

    argument_list: $ => seq(
      choice($._expression, $.type_specifier),
      repeat(seq(',', choice($._expression, $.type_specifier))),
    ),

    subscript_expression: $ => prec.left(15, seq(
      $._expression, '[', $._expression, ']',
    )),

    member_expression: $ => prec.left(15, seq(
      $._expression,
      choice('.', '->'),
      $.identifier,
    )),

    cast_expression: $ => prec(14, seq(
      '(', $.type_specifier, ')',
      $._expression,
    )),

    sizeof_expression: $ => prec.right(13, seq(
      'sizeof',
      choice(
        seq('(', $.type_specifier, ')'),
        $._expression,
      ),
    )),

    compound_literal: $ => prec(14, seq(
      '(', $.type_specifier, ')',
      $.initializer_list,
    )),

    paren_expression: $ => seq('(', $._expression, ')'),

    is_expression: $ => prec.left(9, seq(
      $._expression, 'is', $.type_specifier,
    )),

    // ---------------------------------------------------------------
    // Literals
    // ---------------------------------------------------------------
    identifier: $ => /[a-zA-Z_]\w*/,

    number_literal: $ => token(choice(
      /0[xX][0-9a-fA-F]+[uUlL]*/,
      /0[bB][01]+[uUlL]*/,
      /0[0-7]*[uUlL]*/,
      /[1-9][0-9]*[uUlL]*/,
      /[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?[fFlL]?/,
      /\.[0-9]+([eE][+-]?[0-9]+)?[fFlL]?/,
      /[0-9]+[eE][+-]?[0-9]+[fFlL]?/,
    )),

    string_literal: $ => seq(
      optional(choice('L', 'u', 'U', 'u8')),
      '"',
      repeat(choice($.escape_sequence, /[^"\\]+/)),
      '"',
    ),

    char_literal: $ => seq(
      optional('L'),
      "'",
      choice($.escape_sequence, /[^'\\]/),
      "'",
    ),

    escape_sequence: $ => token.immediate(choice(
      /\\[\\'"abfnrtv0]/,
      /\\x[0-9a-fA-F]+/,
      /\\[0-7]{1,3}/,
      /\\u[0-9a-fA-F]{4}/,
      /\\U[0-9a-fA-F]{8}/,
    )),

    true: $ => 'true',
    false: $ => 'false',
    null: $ => 'NULL',
  },
});
