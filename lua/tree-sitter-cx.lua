local M = {}

function M.setup()
  local parsers = require('nvim-treesitter.parsers').get_parser_configs()
  parsers.cx = {
    install_info = {
      url = vim.fn.fnamemodify(debug.getinfo(1, 'S').source:sub(2), ':h:h'),
      files = { 'src/parser.c' },
      generate_requires_npm = true,
    },
    filetype = 'cx',
  }

  vim.treesitter.language.register('cx', 'cx')
end

return M
